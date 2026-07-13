"""
Scrape le domaine Quetes (chantier Quetes, encyclopedie) depuis
api.dofusdb.fr/quests (1976 quetes). Reprend le mecanisme subarea->area
deja eprouve par scraper_donjons.py/scraper_zones.py pour resoudre la zone,
et fetch_par_lots pour les PNJ.

Particularites verifiees avant d'ecrire ce script (voir CLAUDE.md, section
Quetes) :
- /quests embarque deja tout (etapes, objectifs, recompenses, items complets)
  en une seule pagination bulk $limit/$skip -> pas besoin d'appels /quest-
  objectives separes.
- XP/Kamas ne sont que des RATIOS (experienceRatio/kamasRatio), jamais un
  montant absolu -> on ne stocke qu'un booleen "a_xp"/"a_kamas" (decision
  Popo), jamais de faux chiffre invente.
- Pas d'endpoint /maps autonome (404) : la zone est resolue depuis le
  subAreaId deja embarque dans le premier objectif dont le mapId correspond
  au startPosition, avec repli sur le premier objectif disponible.
- Categorie derivee de champs factuels uniquement (pas de champ Ankama
  "principale/secondaire") : "repetable" si repeatType != 0, sinon "autre".
  Categorie "quete de dofus" ABANDONNEE (decision Popo) : verifie que seuls
  3 Dofus reels sur 34 sont donnes directement par une quete (les autres
  passent par un succes, achievementsThatReward, jamais par une quete) —
  relève du futur chantier Succes/Chasse aux Dofus, pas de celui-ci.

Ecrit dofura_quetes.json. Reutilisable comme les autres scrapers du projet.

Etapes "action GPS" (ajout 2026-07-14, demande explicite Popo) : chaque
etape Ankama porte en realite plusieurs "objectifs" bruts (aller voir un
PNJ, combattre, ramener un objet, decouvrir une carte...), chacun avec sa
propre position [x,y]. Transformation automatique, aucune redaction
manuelle :
- Si un objectif de l'etape reference un donjon (need.generated.dungeons)
  -> toute l'etape se reduit a une seule action "Traverser le {donjon}"
  (combat + decouverte de sortie + retour PNJ tous implicites).
- Sinon, les objectifs "aller voir un PNJ" (className GoToNpc, aussi bien
  le premier "Aller voir" que le "Retourner voir" final) sont retires DES
  QU'IL EXISTE un autre type d'objectif dans la meme etape (le lieu de la
  vraie action suffit a se reperer) ; ils ne sont gardes que si le PNJ est
  le SEUL objectif de l'etape (le but de l'etape est alors litteralement
  d'aller lui parler).
- Chaque objectif restant est mappe par son type reel vers une icone/verbe
  factuel (voir ICONES_ACTION), avec ses cibles (PNJ/monstre/objet) resolues
  par ID depuis nos propres bases deja en place (npcs/dofura_monstres.json/
  dofura_items.json/dofura_donjons.json) -- jamais de texte invente.
- Verifie avant d'ecrire ce code (voir CLAUDE.md) : aucun objectif ne porte
  de position pixel/cellule precise dans le decor (juste la carte + son
  repere monde) -- la "carte cliquable" reste hors de portee des donnees
  publiques, pas construite ici.

Ressources a prevoir : agregation de tous les objectifs "Ramener un objet"
de la quete entiere (pas seulement les prerequis de depart), pour donner
une vraie liste de courses avant de se lancer.
"""
import urllib.request
import json
import re
import time

FICHIER_SORTIE = "dofura_quetes.json"

ICONES_ACTION = {
    "parler": "💬",
    "combattre": "🗡️",
    "rapporter": "🎁",
    "decouvrir": "📍",
    "fabriquer": "🛠️",
    "donjon": "🗡️",
    "autre": "📝",
}

# Marqueurs bruts trouves dans nom/description des etapes (meme famille que
# {{spell,ID,N::Label}} des chantiers #3/#5/#8, mais 3 nouveaux prefixes
# specifiques aux quetes : catalogue exhaustif verifie sur les 4450 textes
# avant d'ecrire ce nettoyage (aucun {{}} sans "::", 2 balises hors accolades
# seulement) :
# - {{npc,ID[,X,Y]::Label}} / {{monster,ID[,X,Y]::Label}} / {{transition,...::Label}}
#   / {{ui,...::Label}} -> on ne garde que le Label (apres le dernier "::").
# - <sprite name="X"> (icone PA/PM/quete...) et <shortcut=.../> (raccourci
#   clavier) -> aucun texte de remplacement possible, retires comme les
#   balises <sprite> deja retirees au chantier #5/#8.
def nettoyer_texte_quete(texte):
    if not texte:
        return texte
    texte = re.sub(r"\{\{[^{}]*?::([^{}]*?)\}\}", r"\1", texte)
    texte = re.sub(r"<sprite[^>]*>", "", texte)
    texte = re.sub(r"<shortcut[^>]*/?>", "", texte)
    texte = re.sub(r"\s{2,}", " ", texte).strip()
    return texte


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return json.loads(urllib.request.urlopen(req, timeout=15).read())


def fetch_par_lots(collection, ids, lot=25):
    """Feathers $in : pas de -g necessaire ici car urllib gere les crochets."""
    ids = sorted(i for i in ids if i is not None)
    resultats = {}
    for i in range(0, len(ids), lot):
        paquet = ids[i:i + lot]
        params = "&".join(f"id[$in][]={v}" for v in paquet)
        url = f"https://api.dofusdb.fr/{collection}?lang=fr&{params}&$limit={len(paquet)}"
        d = fetch(url)
        for r in d.get("data", []):
            resultats[r["id"]] = r
        time.sleep(0.12)
    return resultats


# 1. Recuperer toutes les quetes (pagination bulk, tout est deja embarque).
quetes_brutes = []
skip = 0
while True:
    d = fetch(f"https://api.dofusdb.fr/quests?lang=fr&$limit=50&$skip={skip}")
    quetes_brutes.extend(d["data"])
    skip += 50
    time.sleep(0.1)
    if skip >= d["total"]:
        break

print(f"{len(quetes_brutes)} quetes recuperees")

# 2. Charger les bases deja construites par les chantiers precedents, pour
#    resoudre les cibles des actions (aucune invention, ID -> nom reel).
with open("dofura_items.json", encoding="utf-8") as f:
    ITEMS = {i["id"]: i for i in json.load(f)}
with open("dofura_monstres.json", encoding="utf-8") as f:
    MONSTRES = {m["id"]: m for m in json.load(f)}
with open("dofura_donjons.json", encoding="utf-8") as f:
    DONJONS = {d["id"]: d for d in json.load(f)}

# 3. Resoudre les PNJ : ceux du point de depart ET tous ceux references dans
#    les objectifs (aller voir / ramener a) de toutes les quetes -- necessaire
#    pour les actions GPS par etape, pas seulement l'en-tete de fiche.
npc_ids = {q["startPosition"][0]["npcId"] for q in quetes_brutes if q.get("startPosition")}
for q in quetes_brutes:
    for etape in q.get("steps", []):
        for obj in etape.get("objectives", []):
            cn = obj.get("className")
            p = obj.get("parameters", {})
            if cn in ("QuestObjectiveGoToNpcData", "QuestObjectiveBringItemToNpcData", "QuestObjectiveBringSoulToNpcData"):
                if p.get("parameter0"):
                    npc_ids.add(p["parameter0"])
npcs = fetch_par_lots("npcs", npc_ids)
print(f"{len(npcs)} PNJ resolus")

# 3. Resoudre les zones. Pas d'endpoint /maps autonome (collection vide,
#    verifie) : seule source de subAreaId = les objets "map" deja embarques
#    dans les objectifs des quetes elles-memes. On construit donc un index
#    global mapId->subAreaId a partir de TOUTES les quetes (une carte visitee
#    par une quete peut resoudre le startPosition d'une autre quete qui ne
#    l'a pas dans ses propres objectifs) avant de resoudre quete par quete.
map_vers_subarea = {}
map_vers_nom = {}
map_vers_xy = {}
for q in quetes_brutes:
    for etape in q.get("steps", []):
        for obj in etape.get("objectives", []):
            m = obj.get("map")
            if not m or not obj.get("mapId"):
                continue
            map_id = obj["mapId"]
            if m.get("subAreaId") is not None:
                map_vers_subarea.setdefault(map_id, m["subAreaId"])
            nom_carte = m.get("name", {}).get("fr")
            if nom_carte and nom_carte != "0":
                map_vers_nom.setdefault(map_id, nom_carte)
            if m.get("posX") is not None and m.get("posY") is not None:
                map_vers_xy.setdefault(map_id, (m["posX"], m["posY"]))
print(f"{len(map_vers_subarea)} cartes resolues en subArea (index global)")
print(f"{len(map_vers_nom)} cartes avec un nom de lieu precis")
print(f"{len(map_vers_xy)} cartes avec des coordonnees [x,y]")


def sous_zone_de(quete):
    map_depart = quete["startPosition"][0]["mapId"] if quete.get("startPosition") else None
    if map_depart is not None and map_depart in map_vers_subarea:
        return map_vers_subarea[map_depart]
    premier_repli = None
    for etape in quete.get("steps", []):
        for obj in etape.get("objectives", []):
            m = obj.get("map")
            if m and m.get("subAreaId") is not None:
                premier_repli = m["subAreaId"]
                break
        if premier_repli is not None:
            break
    return premier_repli


# Position de depart precise : nom de lieu (ex. "Boutique de Kerubim") si
# disponible, sinon repli sur le nom de la sous-zone (ex. "Foret d'Astrub"),
# + coordonnees [x,y] du monde (memes reperes qu'affiches en jeu). Resolu via
# le mapId du startPosition dans les index globaux ci-dessus -- ~5% des
# quetes restent sans position precise (aucun objectif ne reference leur
# propre carte de depart), meme limite deja documentee pour la zone.
def position_precise_de(quete):
    map_depart = quete["startPosition"][0]["mapId"] if quete.get("startPosition") else None
    if map_depart is None:
        return None, None
    nom = map_vers_nom.get(map_depart)
    xy = map_vers_xy.get(map_depart)
    return nom, xy


sous_zone_par_quete = {q["id"]: sous_zone_de(q) for q in quetes_brutes}
subarea_ids = set(sous_zone_par_quete.values())
subareas = fetch_par_lots("subareas", subarea_ids)
print(f"{len(subareas)} subareas resolues")

area_ids = {s["areaId"] for s in subareas.values() if s.get("areaId") is not None}
areas = fetch_par_lots("areas", area_ids)
print(f"{len(areas)} areas resolues")


def zone_de(quete):
    subarea = subareas.get(sous_zone_par_quete.get(quete["id"]))
    area = areas.get(subarea["areaId"]) if subarea else None
    return area["name"]["fr"] if area else None


def sous_zone_nom_de(quete):
    subarea = subareas.get(sous_zone_par_quete.get(quete["id"]))
    return subarea["name"]["fr"] if subarea else None


# Position d'un objectif precis (pas seulement celle de depart de la quete) :
# nom de lieu si Ankama en donne un, sinon nom de la sous-zone, + [x,y].
def position_de_objectif(obj):
    map_id = obj.get("mapId")
    if not map_id:
        return None, None
    lieu = map_vers_nom.get(map_id)
    if not lieu:
        subarea = subareas.get(map_vers_subarea.get(map_id))
        lieu = subarea["name"]["fr"] if subarea else None
    xy = map_vers_xy.get(map_id)
    return lieu, xy


def action_depuis_objectif(obj):
    cn = obj.get("className")
    p = obj.get("parameters", {}) or {}
    lieu, xy = position_de_objectif(obj)
    base = {"lieu": lieu, "x": xy[0] if xy else None, "y": xy[1] if xy else None}

    if cn == "QuestObjectiveGoToNpcData":
        npc = npcs.get(p.get("parameter0"))
        cible = npc["name"]["fr"] if npc else f"PNJ #{p.get('parameter0')}"
        return {**base, "icone": ICONES_ACTION["parler"], "verbe": "Parler à", "cible": cible}

    if cn in ("QuestObjectiveFightMonsterData", "QuestObjectiveMultiFightMonsterData", "QuestObjectiveFightMonstersOnMapData"):
        mon = MONSTRES.get(p.get("parameter0"))
        qte = p.get("parameter1") or 1
        nom = mon["nom"] if mon else f"Monstre #{p.get('parameter0')}"
        cible = f"{nom} ×{qte}" if qte > 1 else nom
        return {**base, "icone": ICONES_ACTION["combattre"], "verbe": "Combattre", "cible": cible}

    if cn in ("QuestObjectiveBringItemToNpcData", "QuestObjectiveBringSoulToNpcData"):
        npc = npcs.get(p.get("parameter0"))
        item = ITEMS.get(p.get("parameter1")) if cn == "QuestObjectiveBringItemToNpcData" else None
        qte = p.get("parameter2") or 1
        nom_item = item["nom"] if item else ("une âme" if cn == "QuestObjectiveBringSoulToNpcData" else f"Objet #{p.get('parameter1')}")
        cible = f"{nom_item} ×{qte}" if qte > 1 else nom_item
        npc_nom = npc["name"]["fr"] if npc else None
        return {**base, "icone": ICONES_ACTION["rapporter"], "verbe": "Rapporter", "cible": cible, "cible_secondaire": npc_nom}

    if cn == "QuestObjectiveDiscoverMapData":
        texte = obj.get("text", {}).get("fr", "")
        lieu_carte = texte.split(":", 1)[1].strip() if ":" in texte else nettoyer_texte_quete(texte)
        return {**base, "icone": ICONES_ACTION["decouvrir"], "verbe": "Découvrir", "cible": lieu_carte}

    if cn == "QuestObjectiveCraftItemData":
        item = ITEMS.get(p.get("parameter0"))
        cible = item["nom"] if item else "un objet"
        return {**base, "icone": ICONES_ACTION["fabriquer"], "verbe": "Fabriquer", "cible": cible}

    # Repli : aucune cible structuree exploitable sans deviner -> texte
    # officiel de l'objectif lui-meme (deja court), nettoye comme le reste.
    return {**base, "icone": ICONES_ACTION["autre"], "verbe": "", "cible": nettoyer_texte_quete(obj.get("text", {}).get("fr", ""))}


def actions_de_etape(objectives):
    dungeons_ref = set()
    for obj in objectives:
        dungeons_ref.update(obj.get("need", {}).get("generated", {}).get("dungeons", []))
    if dungeons_ref:
        donjon = DONJONS.get(sorted(dungeons_ref)[0])
        nom = donjon["nom"] if donjon else f"Donjon #{sorted(dungeons_ref)[0]}"
        return [{"icone": ICONES_ACTION["donjon"], "verbe": "Traverser le", "cible": nom, "lieu": None, "x": None, "y": None}]

    autres = [o for o in objectives if o.get("className") != "QuestObjectiveGoToNpcData"]
    a_traiter = autres if autres else objectives

    dedupe = []
    for o in a_traiter:
        if dedupe and dedupe[-1].get("className") == o.get("className") and dedupe[-1].get("parameters") == o.get("parameters"):
            continue
        dedupe.append(o)

    return [action_depuis_objectif(o) for o in dedupe]


# Liste de courses : agregation de TOUS les objectifs "ramener un objet" de
# la quete entiere (pas seulement le prerequis de depart), quantites
# cumulees si le meme objet revient a plusieurs etapes.
def ressources_de_quete(q):
    total = {}
    for etape in q.get("steps", []):
        for obj in etape.get("objectives", []):
            if obj.get("className") == "QuestObjectiveBringItemToNpcData":
                p = obj.get("parameters", {}) or {}
                item_id = p.get("parameter1")
                qte = p.get("parameter2") or 1
                if item_id is not None:
                    total[item_id] = total.get(item_id, 0) + qte
    return [{"id": k, "quantite": v} for k, v in total.items()]


# 4. Nettoyer et assembler.
quetes = []
for q in quetes_brutes:
    etapes = []
    donjons_lies = set()
    for etape in q.get("steps", []):
        for obj in etape.get("objectives", []):
            donjons_lies.update(obj.get("need", {}).get("generated", {}).get("dungeons", []))

        recompense_items = []
        a_xp = False
        a_kamas = False
        for rec in etape.get("rewards", []):
            if rec.get("experienceRatio", 0) > 0:
                a_xp = True
            if rec.get("kamasRatio", 0) > 0:
                a_kamas = True
            for item_id, quantite in rec.get("itemsReward", []):
                recompense_items.append({"id": item_id, "quantite": quantite})

        etapes.append({
            "id": etape["id"],
            "nom": nettoyer_texte_quete(etape.get("name", {}).get("fr", "")),
            "description": nettoyer_texte_quete(etape.get("description", {}).get("fr", "")),
            "actions": actions_de_etape(etape.get("objectives", [])),
            "a_xp": a_xp,
            "a_kamas": a_kamas,
            "items": recompense_items,
        })

    categorie = "repetable" if q.get("repeatType", 0) != 0 else "autre"

    startpos = q.get("startPosition") or [{}]
    npc_id = startpos[0].get("npcId")
    npc = npcs.get(npc_id)
    lieu_precis, xy = position_precise_de(q)

    quetes.append({
        "id": q["id"],
        "nom": q.get("name", {}).get("fr", ""),
        "niveau_min": q.get("levelMin", 0),
        "niveau_max": q.get("levelMax", 0),
        "categorie": categorie,
        "is_dungeon_quest": bool(q.get("isDungeonQuest")),
        "zone": zone_de(q),
        "sous_zone": sous_zone_nom_de(q),
        "lieu_precis": lieu_precis,
        "coordonnees": {"x": xy[0], "y": xy[1]} if xy else None,
        "pnj": npc["name"]["fr"] if npc else None,
        "prerequis_quetes": q.get("need", {}).get("quests", []),
        "prerequis_items": [
            {"id": item_id, "quantite": qte}
            for item_id, qte in zip(
                q.get("need", {}).get("items", []),
                q.get("need", {}).get("quantities", []),
            )
        ],
        "donjons_lies": sorted(donjons_lies),
        "ressources": ressources_de_quete(q),
        "etapes": etapes,
    })

sans_zone = sum(1 for q in quetes if q["zone"] is None)
sans_xy = sum(1 for q in quetes if q["coordonnees"] is None)
print(f"Sans zone resolue : {sans_zone}/{len(quetes)}")
print(f"Sans coordonnees [x,y] resolues : {sans_xy}/{len(quetes)}")
print(f"Categories : repetable={sum(1 for q in quetes if q['categorie']=='repetable')} "
      f"autre={sum(1 for q in quetes if q['categorie']=='autre')}")

with open(FICHIER_SORTIE, "w", encoding="utf-8") as f:
    json.dump(quetes, f, ensure_ascii=False, indent=2)

print(f"\nTermine — {len(quetes)} quetes ecrites dans {FICHIER_SORTIE}")
