"""
Scrape le domaine Succes (chantier Succes, encyclopedie) depuis
api.dofusdb.fr/achievements (2774 succes) + /achievement-categories (133).

Particularites verifiees avant d'ecrire ce script (voir CLAUDE.md, section
Succes) :
- Scope volontairement restreint aux 6 categories racines qui correspondent
  a la maquette (Donjons/Quetes/Exploration/Monstres/Elevage/Metiers,
  1572/2774 succes) -- decision Popo. Les categories exclues (Temporis,
  Evenements, Guilde, Koliseum, Anomalies Temporelles, Songes Infinis, La
  Source, General, Compagnons) sont des modes de jeu a part, hors perimetre
  de ce chantier.
- Un objectif "quete" se detecte par le prefixe du champ `criterion`
  (QF>id,... ou Qf=id) : l'ID pointe directement vers un ID de
  dofura_quetes.json (verifie sans ecart). Tous les autres prefixes
  (EM=tuer un monstre, PL=niveau perso, OA/Ef/BI/Sc...) sont des criteres
  non verifiables sans connexion au jeu -> objectif manuel, texte affiche
  = celui deja ecrit par Ankama (objective.name), jamais invente.
- ~16% des succes ont un objectiveIds pointant vers un objectif supprime du
  jeu (objectives resolu a null, meme famille de trou que les IDs morts deja
  rencontres). Repli : la description Ankama du succes sert d'objectif
  unique en mode manuel, aucune invention.
- Donjon lie : pas de champ direct, reconstruit depuis un objectif
  EM>{idBoss} dont l'ID correspond a boss_ids dans dofura_donjons.json
  (verifie sans ecart). Rarement (4 cas) un meme boss appartient a
  plusieurs donjons (raid reutilisant un boss deja vaincu ailleurs) -> on
  garde la liste complete, jamais un choix arbitraire.
- Kamas = ratio uniquement (jamais de montant absolu), meme limite deja
  actee pour les quetes -> booleen a_kamas.

Ecrit dofura_succes.json. Reutilisable comme les autres scrapers du projet.
"""
import urllib.request
import json
import re
import time

FICHIER_SORTIE = "dofura_succes.json"

CATEGORIES_CORE = {
    "Donjons": "Donjons",
    "Quêtes": "Quêtes",
    "Exploration": "Exploration",
    "Monstres": "Bestiaire",
    "Élevage": "Élevage",
    "Métiers": "Métiers",
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return json.loads(urllib.request.urlopen(req, timeout=20).read())


def fetch_tout(collection, extra=""):
    """Pagination bulk $limit/$skip. Le serveur plafonne $limit a 50 quoi
    qu'on demande -- utiliser 50 directement (piege deja rencontre en
    exploration : incrementer skip d'autre chose que la taille de page
    reellement renvoyee saute des enregistrements)."""
    resultats = []
    skip = 0
    while True:
        d = fetch(f"https://api.dofusdb.fr/{collection}?lang=fr&$limit=50&$skip={skip}{extra}")
        resultats.extend(d["data"])
        skip += 50
        time.sleep(0.08)
        if skip >= d["total"]:
            break
    return resultats


# 1. Categories : construire la chaine parentId -> racine, pour ne garder
#    que les 6 categories core (decision Popo).
categories_brutes = fetch_tout("achievement-categories")
print(f"{len(categories_brutes)} categories recuperees")
cats_par_id = {c["id"]: c for c in categories_brutes}


def racine_de(cat_id):
    c = cats_par_id.get(cat_id)
    vus = set()
    while c and c.get("parentId") not in (0, None) and c["id"] not in vus:
        vus.add(c["id"])
        c = cats_par_id.get(c["parentId"])
    return c


# 2. Succes complets (objectifs + recompenses deja embarques par l'API).
achievements_bruts = fetch_tout("achievements")
print(f"{len(achievements_bruts)} succes recuperes")

# 3. Bases deja construites par les chantiers precedents, pour resoudre les
#    cibles sans jamais inventer (memes fichiers que scraper_quetes.py).
with open("dofura_donjons.json", encoding="utf-8") as f:
    DONJONS = json.load(f)
boss_vers_donjons = {}
for d in DONJONS:
    for boss_id in d.get("boss_ids", []):
        boss_vers_donjons.setdefault(boss_id, []).append(d["id"])

with open("dofura_quetes.json", encoding="utf-8") as f:
    QUETE_IDS = {q["id"] for q in json.load(f)}


def objectif_depuis(o):
    """Un objectif brut -> (type, nom_affiche, quete_id|None, boss_ids_vus)."""
    crit = o.get("criterion", "") or ""
    boss_ids = {int(m) for m in re.findall(r"EM>(\d+)", crit)}

    m_quete = re.search(r"Q[fF][>=](\d+)", crit)
    if m_quete:
        quete_id = int(m_quete.group(1))
        if quete_id in QUETE_IDS:
            nom = o.get("name", {}).get("fr") or f"Quête #{quete_id}"
            return {"nom": nom, "type": "quete", "quete_id": quete_id}, boss_ids
        # ID de quete introuvable cote nous (contenu retire) -> repli manuel,
        # meme esprit que les sorts/etats morts deja acceptes aux chantiers
        # precedents.

    nom = o.get("name", {}).get("fr") or ""
    return {"nom": nom, "type": "manuel", "quete_id": None}, boss_ids


def recompenses_depuis(achievement):
    titre = None
    a_kamas = False
    items = {}
    for r in achievement.get("rewards", []):
        if r.get("kamasRatio", 0) > 0:
            a_kamas = True
        if not titre and r.get("titles"):
            t = r["titles"][0]
            titre = t.get("nameMale", {}).get("fr") or t.get("nameFemale", {}).get("fr")
        for item_id, qte in zip(r.get("itemsReward", []), r.get("itemsQuantityReward", [])):
            items[item_id] = items.get(item_id, 0) + qte
    return titre, a_kamas, [{"id": k, "quantite": v} for k, v in items.items()]


# 4. Filtrer sur les 6 categories core et assembler.
succes = []
sans_categorie_core = 0
for a in achievements_bruts:
    racine = racine_de(a["categoryId"])
    nom_categorie = CATEGORIES_CORE.get(racine["name"]["fr"]) if racine else None
    if not nom_categorie:
        sans_categorie_core += 1
        continue

    objectifs_valides = [o for o in (a.get("objectives") or []) if o]
    boss_ids_toutes = set()
    objectifs = []
    for o in objectifs_valides:
        obj, boss_ids = objectif_depuis(o)
        objectifs.append(obj)
        boss_ids_toutes.update(boss_ids)

    if not objectifs:
        # Objectif(s) references mais supprimes du jeu -> repli sur la
        # description Ankama du succes lui-meme, jamais invente.
        desc = a.get("description", {}).get("fr", "")
        if desc:
            objectifs = [{"nom": desc, "type": "manuel", "quete_id": None}]

    donjons_lies = sorted({did for bid in boss_ids_toutes for did in boss_vers_donjons.get(bid, [])})

    titre, a_kamas, items = recompenses_depuis(a)

    succes.append({
        "id": a["id"],
        "nom": a.get("name", {}).get("fr", ""),
        "description": a.get("description", {}).get("fr", ""),
        "categorie": nom_categorie,
        "points": a.get("points", 0),
        "niveau": a.get("level", 0),
        "img": a.get("img", ""),
        "objectifs": objectifs,
        "recompense_titre": titre,
        "recompense_a_kamas": a_kamas,
        "recompense_items": items,
        "donjons_lies": donjons_lies,
    })

print(f"Succes hors des 6 categories core (ignores) : {sans_categorie_core}")
print(f"Succes retenus : {len(succes)}")
sans_objectif = sum(1 for s in succes if not s["objectifs"])
print(f"Succes sans aucun objectif ni description exploitable : {sans_objectif}")
avec_donjon = sum(1 for s in succes if s["donjons_lies"])
print(f"Succes lies a un donjon : {avec_donjon}")

with open(FICHIER_SORTIE, "w", encoding="utf-8") as f:
    json.dump(succes, f, ensure_ascii=False, indent=2)

print(f"\nTermine — {len(succes)} succes ecrits dans {FICHIER_SORTIE}")
