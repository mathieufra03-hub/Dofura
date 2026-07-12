from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import uvicorn
import os
import json
import re
import subprocess
subprocess.run(["python", "init_db.py"])

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SORTS_DATA = {}
EFFECTS_DATA = {}
EFFETS_SPECIAUX_DATA = {}

if os.path.exists("dofura_sorts.json"):
    with open("dofura_sorts.json", "r", encoding="utf-8") as f:
        for s in json.load(f):
            SORTS_DATA[s["id"]] = s

if os.path.exists("dofura_effects.json"):
    with open("dofura_effects.json", "r", encoding="utf-8") as f:
        raw = json.load(f)
        for k, v in raw.items():
            EFFECTS_DATA[int(k)] = v

if os.path.exists("dofura_effets_speciaux.json"):
    with open("dofura_effets_speciaux.json", "r", encoding="utf-8") as f:
        EFFETS_SPECIAUX_DATA = json.load(f)

ETATS_SPECIAUX_DATA = {}
if os.path.exists("dofura_etats_speciaux.json"):
    with open("dofura_etats_speciaux.json", "r", encoding="utf-8") as f:
        ETATS_SPECIAUX_DATA = json.load(f)

# Detail des sorts accordes par les objets (chantier #8ter) : cle "sortId_grade"
# car un meme sort peut etre accorde a un grade different selon l'objet
# (verifie sur 16 cas au chantier #8ter, une cle par seul sortId aurait ete fausse).
SORTS_OBJETS_DATA = {}
if os.path.exists("dofura_sorts_objets.json"):
    with open("dofura_sorts_objets.json", "r", encoding="utf-8") as f:
        SORTS_OBJETS_DATA = json.load(f)

# Guides de boss des donjons (mecaniques/salles/composition conseillee),
# cle "donjon_id" : contenu 100% editorial (jamais scrape ni invente),
# rempli progressivement par Popo/Krag. Absent de la DB (regeneree a
# chaque demarrage par init_db.py, voir regle 9) pour ne pas perdre ce
# travail au prochain redeploiement.
DONJONS_GUIDES_DATA = {}
if os.path.exists("dofura_donjons_guides.json"):
    with open("dofura_donjons_guides.json", "r", encoding="utf-8") as f:
        DONJONS_GUIDES_DATA = json.load(f)

# Effets dont un placeholder brut (#1/#2/#3) est en realite un ID a resoudre,
# pas un nombre (chantier #6) :
# - EFFECTS_ETAT_VALEUR : "Etat #3"/"Enleve l'etat #3"/"Desactive l'etat #3",
#   le champ "value" est un ID d'etat (api.dofusdb.fr/spell-states/{id})
# - EFFECTS_ETAT_DICE : "Chatiment de #2 #1 sur #3 tours", diceNum et diceSide
#   sont aussi des IDs d'etat
# - motif structurel "#1 : ..." (regex ci-dessous, plutot qu'une liste figee
#   d'effect_id) : diceNum est l'ID d'un sort du jeu (deja dans SORTS_DATA,
#   pas besoin de resolution externe). Trouve initialement sur 15 effect_id
#   cote sorts/monstres (chantier #6), mais motif general confirme sur les
#   objets (chantier #7) qui en utilisent 5 de plus (ex. 289 "#1 : ligne de
#   vue desactivee", sans #3) — une liste figee aurait rate ces variantes.
EFFECTS_ETAT_VALEUR = {950, 951, 952}
EFFECTS_ETAT_DICE = {788}
MOTIF_SORT_CONDITION = re.compile(r'^#1\s*:')

def formater_effet(effet):
    effect_id = effet.get("effectId")
    dice_num = effet.get("diceNum", 0)
    dice_side = effet.get("diceSide", 0)
    value_brut = effet.get("value", 0)
    duration = effet.get("duration", 0)

    effect_def = EFFECTS_DATA.get(effect_id, {})
    template = effect_def.get("description", f"Effet {effect_id}")

    # Polarite issue des champs Ankama (characteristic_operator/boost), pas d'une
    # supposition sur le texte : sert au "+" explicite ci-dessous et a la future
    # coloration vert/rouge cote frontend.
    if effect_def.get("boost") and effect_def.get("characteristic_operator") == "+":
        polarite = "bonus"
    elif effect_def.get("boost") and effect_def.get("characteristic_operator") == "-":
        polarite = "malus"
    else:
        polarite = None

    # Certains effect_id (ex. invocation) n'ont pas de vraie description : le
    # diceNum est en realite l'ID d'un sort dont le nom est le vrai libelle.
    if template.strip() in ("#1", "#2", "#1#2", ""):
        nom = EFFETS_SPECIAUX_DATA.get(str(dice_num))
        if nom:
            # Certains noms resolus contiennent encore une balise <sprite> brute
            # copiee depuis la description Ankama d'origine.
            nom = re.sub(r'<sprite[^>]*>', '', nom)
            nom = re.sub(r'\s{2,}', ' ', nom).strip()
        return {
            "texte": nom,
            "valeur": str(dice_num),
            "duration": duration,
            "effect_id": effect_id,
            "polarite": polarite,
        }

    desc = template

    # Resolution des placeholders qui sont en realite des IDs (etat ou sort)
    # plutot que des nombres (chantier #6). Par defaut #1/#2/#3 restent des
    # nombres bruts ; ces trois familles remplacent l'un ou l'autre par un nom.
    remplacement_1 = remplacement_2 = remplacement_3 = None
    introuvable = False
    if effect_id in EFFECTS_ETAT_VALEUR:
        remplacement_3 = ETATS_SPECIAUX_DATA.get(str(value_brut))
        introuvable = remplacement_3 is None
    elif effect_id in EFFECTS_ETAT_DICE:
        remplacement_1 = ETATS_SPECIAUX_DATA.get(str(dice_num))
        remplacement_2 = ETATS_SPECIAUX_DATA.get(str(dice_side))
        introuvable = remplacement_1 is None or remplacement_2 is None
    elif MOTIF_SORT_CONDITION.match(template.strip()):
        sort = SORTS_DATA.get(dice_num)
        remplacement_1 = sort.get("nom") if sort else None
        introuvable = remplacement_1 is None

    if introuvable:
        return {
            "texte": None,
            "valeur": str(dice_num),
            "duration": duration,
            "effect_id": effect_id,
            "polarite": polarite,
        }

    try:
        dn, ds = int(dice_num), int(dice_side)
        pluriel = (dn != 1) if (ds == 0 or dn == ds) else (ds > 1)
    except (TypeError, ValueError):
        pluriel = None  # valeur non numerique : filet de securite, pas de pluriel devine

    # Nettoyage des marqueurs de pluriel AVANT le nettoyage generique de "}}"
    # ci-dessous (qui sinon mange leur accolade fermante en premier).
    desc = desc.replace("{{~ps}}", "s" if pluriel else "")
    desc = desc.replace("{{~zs}}", "")

    if dice_side == 0 or dice_num == dice_side:
        valeur = str(dice_num)
        desc = re.sub(r'\{\{~1~2[^}]*\}\}', '', desc)
    else:
        valeur = f"{dice_num} à {dice_side}"
        desc = re.sub(r'\{\{~1~2\s*', ' ', desc)
        desc = re.sub(r'\}\}', '', desc)

    desc = desc.replace("#1", remplacement_1 if remplacement_1 is not None else str(dice_num))
    if dice_side != 0:
        desc = desc.replace("#2", remplacement_2 if remplacement_2 is not None else str(dice_side))
    else:
        desc = desc.replace("#2", remplacement_2 if remplacement_2 is not None else "")
    desc = desc.replace("#3", remplacement_3 if remplacement_3 is not None else str(value_brut))

    # Le retrait de la balise laisse l'espace qui l'entourait des deux cotes
    # (ex. "1 <sprite name=\"PA\"> PA" -> "1  PA") : on les recollapse a un seul.
    desc = re.sub(r'<sprite[^>]*>', '', desc)
    desc = re.sub(r'\s{2,}', ' ', desc).strip()

    # "+" explicite pour les bonus dont le texte demarre par la valeur brute
    # (ex. "2 PM" -> "+2 PM"), symetrique du "-" deja integre par Ankama dans
    # le texte des malus. Le garde-fou "#" absent exclut les rares templates
    # a placeholders au-dela de #3 (non geres), et startswith(valeur) exclut
    # les tournures verbales ("Vole 2 PM") qui n'ont
    # pas besoin de signe.
    if polarite == "bonus" and "#" not in desc and desc.startswith(str(dice_num)):
        desc = "+" + desc

    # Filet de securite general : un placeholder au-dela de #1/#2/#3 (ex.
    # #4, jamais gere) laisserait un texte casse — on masque plutot que
    # d'afficher un residu (trouve sur des objets : "Emballe par : #4",
    # "Renommer la guilde : #4" referencent une donnee dynamique par
    # instance de jeu, impossible a resoudre statiquement).
    if "#" in desc:
        desc = None
    # Si la description source était juste '#1', le texte final est un nombre brut — on le masque
    elif desc.strip().lstrip('-+').isdigit():
        desc = None

    return {
        "texte": desc,
        "valeur": valeur,
        "duration": duration,
        "effect_id": effect_id,
        "polarite": polarite,
    }

def effet_visible(effet):
    # Si Ankama marque un effet invisible partout (tooltip/UI de buff/log de
    # combat), il n'est pas cense etre montre au joueur en jeu non plus.
    return bool(effet.get("visibleInTooltip") or effet.get("visibleInBuffUi") or effet.get("visibleInFightLog"))

def get_db():
    conn = sqlite3.connect("dofura.db")
    conn.row_factory = sqlite3.Row
    return conn

SANS_VALEUR = "__aucune__"

@app.get("/monstres")
def liste_monstres(search: str = "", famille: str = "", zone: str = "", page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conditions = ["nom LIKE ?"]
    params = [f"%{search}%"]

    if famille == SANS_VALEUR:
        conditions.append("(famille IS NULL OR famille = '')")
    elif famille:
        conditions.append("famille = ?")
        params.append(famille)

    if zone == SANS_VALEUR:
        conditions.append("id NOT IN (SELECT monstre_id FROM zones)")
    elif zone:
        conditions.append("id IN (SELECT monstre_id FROM zones WHERE nom = ?)")
        params.append(zone)

    where_clause = " AND ".join(conditions)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM monstres WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT * FROM monstres
        WHERE {where_clause}
        ORDER BY nom
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()
    conn.close()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "monstres": [dict(r) for r in rows],
    }

@app.get("/monstres/filtres")
def filtres_monstres(famille: str = "", zone: str = ""):
    conn = get_db()
    cur = conn.cursor()

    # Familles disponibles : filtrees par la zone active (jamais par la famille
    # elle-meme, sinon la valeur selectionnee pourrait disparaitre de son propre menu).
    zone_cond, zone_params = "", []
    if zone == SANS_VALEUR:
        zone_cond = "AND id NOT IN (SELECT monstre_id FROM zones)"
    elif zone:
        zone_cond = "AND id IN (SELECT monstre_id FROM zones WHERE nom = ?)"
        zone_params = [zone]

    cur.execute(f"""
        SELECT DISTINCT famille FROM monstres
        WHERE famille IS NOT NULL AND famille != '' {zone_cond}
        ORDER BY famille
    """, zone_params)
    familles = [r[0] for r in cur.fetchall()]

    cur.execute(f"""
        SELECT COUNT(*) FROM monstres
        WHERE (famille IS NULL OR famille = '') {zone_cond}
    """, zone_params)
    sans_famille = cur.fetchone()[0] > 0

    # Zones disponibles : filtrees par la famille active (meme logique inverse).
    famille_cond, famille_params = "", []
    if famille == SANS_VALEUR:
        famille_cond = "AND (famille IS NULL OR famille = '')"
    elif famille:
        famille_cond = "AND famille = ?"
        famille_params = [famille]

    cur.execute(f"""
        SELECT DISTINCT z.nom FROM zones z
        JOIN monstres m ON m.id = z.monstre_id
        WHERE 1=1 {famille_cond}
        ORDER BY z.nom
    """, famille_params)
    zones = [r[0] for r in cur.fetchall()]

    cur.execute(f"""
        SELECT COUNT(*) FROM monstres
        WHERE id NOT IN (SELECT monstre_id FROM zones) {famille_cond}
    """, famille_params)
    sans_zone = cur.fetchone()[0] > 0

    conn.close()
    return {"familles": familles, "sans_famille": sans_famille, "zones": zones, "sans_zone": sans_zone}

@app.get("/monstres/{monstre_id}")
def detail_monstre(monstre_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM monstres WHERE id = ?", (monstre_id,))
    monstre = cur.fetchone()
    if not monstre:
        return {"erreur": "Monstre introuvable"}
    cur.execute("SELECT * FROM grades WHERE monstre_id = ? ORDER BY niveau", (monstre_id,))
    grades = cur.fetchall()
    cur.execute("SELECT * FROM drops WHERE monstre_id = ?", (monstre_id,))
    drops = cur.fetchall()
    cur.execute("SELECT id, monstre_id, nom, sort_id FROM sorts WHERE monstre_id = ?", (monstre_id,))
    sorts = cur.fetchall()
    cur.execute("SELECT * FROM zones WHERE monstre_id = ?", (monstre_id,))
    zones = cur.fetchall()
    cur.execute("""
        SELECT d.id, d.nom, dm.est_boss
        FROM donjons_monstres dm
        JOIN donjons d ON d.id = dm.donjon_id
        WHERE dm.monstre_id = ?
        ORDER BY d.nom
    """, (monstre_id,))
    donjons = cur.fetchall()
    conn.close()
    return {
        **dict(monstre),
        "grades": [dict(g) for g in grades],
        "drops": [dict(d) for d in drops],
        "sorts": [dict(s) for s in sorts],
        "zones": [dict(z) for z in zones],
        "donjons": [{"id": d["id"], "nom": d["nom"], "est_boss": bool(d["est_boss"])} for d in donjons],
    }

@app.get("/sorts/{sort_id}")
def detail_sort(sort_id: int):
    sort = SORTS_DATA.get(sort_id)
    if not sort:
        return {"erreur": "Sort introuvable"}
    return {
        "id": sort["id"],
        "nom": sort.get("nom", ""),
        "img": sort.get("img", ""),
        "ap_cost": sort.get("ap_cost"),
        "range": sort.get("range"),
        "min_range": sort.get("min_range"),
        "critical_hit_probability": sort.get("critical_hit_probability"),
        "cast_test_los": sort.get("cast_test_los"),
        "range_can_be_boosted": sort.get("range_can_be_boosted"),
        "max_cast_per_turn": sort.get("max_cast_per_turn"),
        "max_cast_per_target": sort.get("max_cast_per_target"),
        "max_global_cast_per_turn": sort.get("max_global_cast_per_turn"),
        "min_cast_interval": sort.get("min_cast_interval"),
        "initial_cooldown": sort.get("initial_cooldown"),
        "global_cooldown": sort.get("global_cooldown"),
        "cast_in_line": sort.get("cast_in_line"),
        "cast_in_diagonal": sort.get("cast_in_diagonal"),
        "effects": [f for e in sort.get("effects", []) if effet_visible(e) and (f:=formater_effet(e))["texte"] is not None],
        "critical_effects": [f for e in sort.get("critical_effects", []) if effet_visible(e) and (f:=formater_effet(e))["texte"] is not None],
    }

# Templates a #3 seul (sans #1 ni #2) rencontres sur des objets/panoplies ou
# #3 est en realite l'ID d'un sort accorde par l'objet, resolu via SORTS_DATA
# comme EFFECTS_SORT_CONDITION (memes garde-fous : introuvable -> masque).
EFFECTS_OBJET_SORT_3 = {604, 2864}

def formater_effet_objet(row):
    effect_id = row["effect_id"]
    dice_num = row["dice_num"]  # = champ "from" cote objets
    template = EFFECTS_DATA.get(effect_id, {}).get("description", "")

    if effect_id in EFFECTS_OBJET_SORT_3:
        sort = SORTS_DATA.get(dice_num)
        if not sort:
            return {"texte": None, "valeur": str(dice_num), "duration": 0,
                    "effect_id": effect_id, "polarite": None}
        return {"texte": template.replace("#3", sort["nom"]), "valeur": str(dice_num),
                "duration": 0, "effect_id": effect_id, "polarite": None}

    # Contrairement aux sorts/monstres (diceNum toujours une magnitude
    # positive, le signe ne vivant que dans le texte du template), les objets
    # encodent le signe DANS le nombre brut (confirme sur 953+68 effets :
    # les templates bonus n'ont jamais de from negatif, les templates malus
    # jamais de from positif). Un template malus a deja son "-" en dur
    # ("-#1...") : lui donner un diceNum deja negatif produirait "--100".
    # On neutralise donc le signe cote objets, le template porte le sien.
    dice_num_abs = abs(dice_num)
    dice_side_abs = abs(row["dice_side"])

    # Les objets n'ont que 2 emplacements numeriques (from/to, ici diceNum/
    # diceSide) contre 3 pour les sorts/monstres (diceNum/diceSide/value).
    # Quand un template n'utilise QUE #3 (ex. "+#3 Points d'experience"),
    # c'est diceNum (from) qui porte la vraie valeur, pas "value" (absent
    # des effets d'objets pour ce cas — value ne sert que pour la famille
    # etat du chantier #6, jamais utilisee par les objets).
    trois_seul = "#3" in template and "#1" not in template and "#2" not in template
    if trois_seul:
        return formater_effet({
            "effectId": effect_id, "diceNum": 0, "diceSide": 0,
            "value": dice_num_abs, "duration": 0,
        })

    return formater_effet({
        "effectId": effect_id,
        "diceNum": dice_num_abs,
        "diceSide": dice_side_abs,
        "value": row["value"],
        "duration": 0,
    })

# Perimetre verifie le 2026-07-09 (chantier Equipements/Ressources) : ces
# valeurs de super_type_nom sont les seules a representer un objet que le
# joueur porte reellement (slot d'equipement classique). Volontairement
# exclu : Suiveur/Compagnon/Equipement de percepteur (mecaniques annexes,
# pas un slot d'equipement joueur) — voir CLAUDE.md pour le detail.
CATEGORIES_OBJETS = {
    "equipement": ("Arme", "Amulette", "Anneau", "Bottes", "Ceinture", "Chapeau",
                   "Cape", "Bouclier", "Dofus / Trophée / Prysmaradite", "Familier"),
    "ressource": ("Ressource",),
}

TRANCHES_NIVEAU = {
    "1-50": (1, 50), "51-100": (51, 100), "101-150": (101, 150), "151-200": (151, 200),
}

# Filtre "Effets recherchés" des équipements (§5 CLAUDE.md, "le filtre tueur").
# Chaque effect_id a ete verifie individuellement dans dofura_effects.json
# (boost=true, characteristic_operator="+", description au mot entier) —
# PAS un simple substring sur le nom, qui aurait aussi remonte des mecaniques
# homonymes sans rapport avec un vrai bonus de stat portee par l'objet :
# "Esquive PA"(160)/"Retrait PA"(410)/"Vole PA"(84) pour PA, meme piege pour PM.
# Seule Vitalite a plusieurs effect_id verifies (valeur fixe + 2 variantes %).
EFFETS_RECHERCHABLES = {
    "Force":        (118,),
    "Agilité":      (119,),
    "Chance":       (123,),
    "Sagesse":      (124,),
    "Vitalité":     (125, 1078, 2844),
    "Intelligence": (126,),
    "PA":           (111,),
    "PM":           (128,),
}

@app.get("/objets")
def liste_objets(categorie: str = "equipement", search: str = "", type: str = "",
                  niveau_min: int = 1, niveau_max: int = 999,
                  effets: str = "", panoplie: bool = False, legendaire: bool = False,
                  tri: str = "az", page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)
    super_types = CATEGORIES_OBJETS.get(categorie, CATEGORIES_OBJETS["equipement"])

    conditions = [f"super_type_nom IN ({','.join('?' for _ in super_types)})", "nom LIKE ?"]
    params = list(super_types) + [f"%{search}%"]

    # Multi-selection (checkboxes, pas un menu deroulant) : plusieurs types
    # a la fois, "__aucune__" mele aux vrais types possible (OR, pas AND).
    types_choisis = [t for t in type.split(",") if t]
    if types_choisis:
        sous_conditions = []
        if SANS_VALEUR in types_choisis:
            sous_conditions.append("(type_nom IS NULL OR type_nom = '')")
            types_choisis = [t for t in types_choisis if t != SANS_VALEUR]
        if types_choisis:
            sous_conditions.append(f"type_nom IN ({','.join('?' for _ in types_choisis)})")
            params.extend(types_choisis)
        conditions.append("(" + " OR ".join(sous_conditions) + ")")

    conditions.append("niveau BETWEEN ? AND ?")
    params.extend([niveau_min, niveau_max])

    if panoplie:
        conditions.append("panoplie_id IS NOT NULL")
    if legendaire:
        conditions.append("legendaire = 1")

    # Effets recherches : logique ET (l'objet doit porter TOUS les effets
    # coches, ex. Force + Vitalite en meme temps), un EXISTS par effet choisi.
    effets_choisis = [e for e in effets.split(",") if e in EFFETS_RECHERCHABLES]
    for e in effets_choisis:
        ids = EFFETS_RECHERCHABLES[e]
        conditions.append(f"""EXISTS (
            SELECT 1 FROM objets_effets oe
            WHERE oe.objet_id = objets.id AND oe.effect_id IN ({','.join('?' for _ in ids)})
        )""")
        params.extend(ids)

    where_clause = " AND ".join(conditions)

    ordres = {
        "az": "nom",
        "niveau_desc": "niveau DESC, nom",
        "niveau_asc": "niveau ASC, nom",
        "type": "type_nom, niveau DESC",
    }
    order_by = ordres.get(tri, ordres["az"])

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM objets WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT id, nom, img, niveau, type_nom, legendaire, panoplie_id FROM objets
        WHERE {where_clause}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()

    # Effets formates par objet (pour le tooltip au survol des vignettes) :
    # une seule requete groupee sur la page courante (max page_size lignes),
    # pas une par objet — meme fonction de formatage que la fiche detail
    # (formater_effet_objet), une seule source de verite pour le texte.
    effets_par_objet = {}
    ids_page = [r["id"] for r in rows]
    if ids_page:
        cur.execute(f"""
            SELECT * FROM objets_effets WHERE objet_id IN ({','.join('?' for _ in ids_page)})
        """, ids_page)
        for e in cur.fetchall():
            f = formater_effet_objet(e)
            if f["texte"] is not None:
                effets_par_objet.setdefault(e["objet_id"], []).append(f)
    conn.close()

    objets_resultat = []
    for r in rows:
        d = dict(r)
        d["effects"] = effets_par_objet.get(r["id"], [])
        d["legendaire"] = bool(d["legendaire"])
        d["panoplie"] = d.pop("panoplie_id") is not None
        objets_resultat.append(d)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "objets": objets_resultat,
    }

@app.get("/objets/filtres")
def filtres_objets(categorie: str = "equipement"):
    super_types = CATEGORIES_OBJETS.get(categorie, CATEGORIES_OBJETS["equipement"])
    placeholders = ",".join("?" for _ in super_types)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT DISTINCT type_nom FROM objets
        WHERE super_type_nom IN ({placeholders}) AND type_nom IS NOT NULL AND type_nom != ''
        ORDER BY type_nom
    """, super_types)
    types = [r[0] for r in cur.fetchall()]

    cur.execute(f"""
        SELECT COUNT(*) FROM objets
        WHERE super_type_nom IN ({placeholders}) AND (type_nom IS NULL OR type_nom = '')
    """, super_types)
    sans_type = cur.fetchone()[0] > 0

    cur.execute(f"""
        SELECT COUNT(*) FROM objets
        WHERE super_type_nom IN ({placeholders}) AND (niveau IS NULL OR niveau = 0)
    """, super_types)
    sans_niveau = cur.fetchone()[0] > 0

    # Bornes reelles du curseur de niveau (pas de valeur en dur type 200 :
    # Dofus 3.0 a des objets au-dela selon les extensions live).
    cur.execute(f"""
        SELECT MIN(niveau), MAX(niveau) FROM objets
        WHERE super_type_nom IN ({placeholders}) AND niveau IS NOT NULL AND niveau > 0
    """, super_types)
    niveau_min_dispo, niveau_max_dispo = cur.fetchone()

    conn.close()
    return {
        "types": types, "sans_type": sans_type, "sans_niveau": sans_niveau,
        "niveau_min": niveau_min_dispo or 1, "niveau_max": niveau_max_dispo or 200,
        "effets": list(EFFETS_RECHERCHABLES.keys()) if categorie == "equipement" else [],
    }

@app.get("/objets/{objet_id}")
def detail_objet(objet_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM objets WHERE id = ?", (objet_id,))
    objet = cur.fetchone()
    if not objet:
        conn.close()
        return {"erreur": "Objet introuvable"}

    cur.execute("SELECT * FROM objets_effets WHERE objet_id = ?", (objet_id,))
    effets_bruts = cur.fetchall()

    # Sort accorde par l'objet (effect_id 1175, chantier #8ter) : sorti a part
    # de la liste generique "effects" pour avoir sa propre section dediee
    # (sinon le nom du sort apparaitrait deux fois).
    effets_sort_accorde = [e for e in effets_bruts if e["effect_id"] == 1175]
    effets_bruts = [e for e in effets_bruts if e["effect_id"] != 1175]

    sort_accorde = None
    if effets_sort_accorde:
        e = effets_sort_accorde[0]
        spell_id = e["dice_num"]
        grade = e["dice_side"] or 1
        detail = SORTS_OBJETS_DATA.get(f"{spell_id}_{grade}")
        if detail:
            sort_accorde = {
                "nom": detail["nom"],
                "description": detail["description"],
                "effects": [
                    f for eff in detail["effects"]
                    if effet_visible(eff) and (f := formater_effet(eff))["texte"] is not None
                ],
            }

    cur.execute("""
        SELECT r.ingredient_id, r.quantite, r.job_id, o.nom AS ingredient_nom, o.img AS ingredient_img,
               o.niveau AS ingredient_niveau, o.type_nom AS ingredient_type_nom
        FROM recettes r
        LEFT JOIN objets o ON o.id = r.ingredient_id
        WHERE r.objet_id = ?
    """, (objet_id,))
    ingredients = cur.fetchall()

    # Obtention : monstres qui droppent cet objet (table drops, sourcee
    # Dofensive, liee par NOM — meme mecanisme deja utilise par la fiche
    # donjon pour son propre tableau de butins). Egalement calcule pour
    # chaque ingredient de la recette, pour le tooltip "source" au survol.
    def sources_drop(nom_objet):
        cur.execute("""
            SELECT m.id AS monstre_id, m.nom AS monstre_nom, m.image_url AS monstre_img, d.pourcentage
            FROM drops d JOIN monstres m ON m.id = d.monstre_id
            WHERE d.nom = ?
            ORDER BY d.pourcentage DESC
        """, (nom_objet,))
        return [dict(r) for r in cur.fetchall()]

    obtention = sources_drop(objet["nom"])
    sources_ingredients = {i["ingredient_nom"]: sources_drop(i["ingredient_nom"]) for i in ingredients if i["ingredient_nom"]}

    panoplie = None
    if objet["panoplie_id"] is not None:
        cur.execute("SELECT * FROM panoplies WHERE id = ?", (objet["panoplie_id"],))
        p = cur.fetchone()
        if p:
            cur.execute("SELECT id, nom FROM objets WHERE panoplie_id = ?", (objet["panoplie_id"],))
            membres = cur.fetchall()
            cur.execute("SELECT * FROM panoplies_effets WHERE panoplie_id = ? ORDER BY palier", (objet["panoplie_id"],))
            effets_paliers_bruts = cur.fetchall()
            paliers = {}
            for e in effets_paliers_bruts:
                f = formater_effet_objet(e)
                if f["texte"] is not None:
                    paliers.setdefault(e["palier"], []).append(f)
            panoplie = {
                "id": p["id"],
                "nom": p["nom"],
                "niveau": p["niveau"],
                "membres": [dict(m) for m in membres],
                "effets_par_palier": paliers,
            }

    cur.execute("""
        SELECT d.id, d.nom, dor.quantite
        FROM donjons_objets_requis dor
        JOIN donjons d ON d.id = dor.donjon_id
        WHERE dor.objet_id = ?
        ORDER BY d.nom
    """, (objet_id,))
    donjons_requis = cur.fetchall()

    conn.close()

    # Fil d'Ariane : categorie humaine deduite de super_type_nom, reutilise
    # CATEGORIES_OBJETS (meme mapping que les listes /equipements et /ressources)
    # plutot qu'une nouvelle table de correspondance. Libelles explicites
    # (pas de pluriel calcule) pour eviter toute grammaire fragile.
    LIBELLES_CATEGORIES = {"equipement": "Équipements", "ressource": "Ressources"}
    categorie_nom = next(
        (LIBELLES_CATEGORIES[cle] for cle, super_types in CATEGORIES_OBJETS.items() if objet["super_type_nom"] in super_types),
        None
    )

    return {
        **dict(objet),
        "legendaire": bool(objet["legendaire"]),
        "categorie_nom": categorie_nom,
        "effects": [f for e in effets_bruts if (f := formater_effet_objet(e))["texte"] is not None],
        "recette": [
            {
                "ingredient_id": i["ingredient_id"], "quantite": i["quantite"],
                "nom": i["ingredient_nom"], "img": i["ingredient_img"],
                "niveau": i["ingredient_niveau"], "type_nom": i["ingredient_type_nom"],
                "sources": sources_ingredients.get(i["ingredient_nom"], []),
            }
            for i in ingredients
        ],
        "obtention": obtention,
        "panoplie": panoplie,
        "sort_accorde": sort_accorde,
        "donjons_requis": [{"id": d["id"], "nom": d["nom"], "quantite": d["quantite"]} for d in donjons_requis],
    }

@app.get("/panoplies")
def liste_panoplies(search: str = "", type: str = "", tranche_niveau: str = "",
                     page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conditions = ["p.nom LIKE ?"]
    params = [f"%{search}%"]

    if type == "cosmetique":
        conditions.append("p.cosmetique = 1")
    elif type == "bonus":
        conditions.append("p.cosmetique = 0")

    if tranche_niveau == SANS_VALEUR:
        conditions.append("(p.niveau IS NULL OR p.niveau = 0)")
    elif tranche_niveau in TRANCHES_NIVEAU:
        borne_min, borne_max = TRANCHES_NIVEAU[tranche_niveau]
        conditions.append("p.niveau BETWEEN ? AND ?")
        params.extend([borne_min, borne_max])

    where_clause = " AND ".join(conditions)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM panoplies p WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT p.id, p.nom, p.niveau, p.cosmetique, o.img,
               (SELECT COUNT(*) FROM objets o2 WHERE o2.panoplie_id = p.id) AS nb_objets
        FROM panoplies p
        LEFT JOIN objets o ON o.id = p.image_objet_id
        WHERE {where_clause}
        ORDER BY p.nom
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()
    conn.close()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "panoplies": [dict(r) for r in rows],
    }

@app.get("/panoplies/filtres")
def filtres_panoplies():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM panoplies WHERE niveau IS NULL OR niveau = 0")
    sans_niveau = cur.fetchone()[0] > 0
    conn.close()
    return {"sans_niveau": sans_niveau}

@app.get("/panoplies/{panoplie_id}")
def detail_panoplie(panoplie_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.*, o.img
        FROM panoplies p
        LEFT JOIN objets o ON o.id = p.image_objet_id
        WHERE p.id = ?
    """, (panoplie_id,))
    panoplie = cur.fetchone()
    if not panoplie:
        conn.close()
        return {"erreur": "Panoplie introuvable"}

    cur.execute("SELECT id, nom, img, niveau, type_nom FROM objets WHERE panoplie_id = ? ORDER BY nom", (panoplie_id,))
    membres = cur.fetchall()

    cur.execute("SELECT * FROM panoplies_effets WHERE panoplie_id = ? ORDER BY palier", (panoplie_id,))
    effets_paliers_bruts = cur.fetchall()
    paliers = {}
    for e in effets_paliers_bruts:
        f = formater_effet_objet(e)
        if f["texte"] is not None:
            paliers.setdefault(e["palier"], []).append(f)

    conn.close()
    return {
        "id": panoplie["id"],
        "nom": panoplie["nom"],
        "niveau": panoplie["niveau"],
        "cosmetique": bool(panoplie["cosmetique"]),
        "img": panoplie["img"],
        "membres": [dict(m) for m in membres],
        "effets_par_palier": paliers,
    }

@app.get("/donjons")
def liste_donjons(search: str = "", zone: str = "", page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conditions = ["d.nom LIKE ?"]
    params = [f"%{search}%"]

    if zone == SANS_VALEUR:
        conditions.append("(d.zone IS NULL OR d.zone = '')")
    elif zone:
        conditions.append("d.zone = ?")
        params.append(zone)

    where_clause = " AND ".join(conditions)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM donjons d WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT d.id, d.nom, d.niveau_min, d.niveau_optimal, d.difficulte, d.zone,
               m.nom AS boss_nom, m.image_url AS boss_img
        FROM donjons d
        LEFT JOIN monstres m ON m.id = d.boss_principal_id
        WHERE {where_clause}
        ORDER BY d.nom
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()
    conn.close()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "donjons": [dict(r) for r in rows],
    }

@app.get("/donjons/filtres")
def filtres_donjons():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT zone FROM donjons WHERE zone IS NOT NULL AND zone != '' ORDER BY zone")
    zones = [r[0] for r in cur.fetchall()]
    cur.execute("SELECT COUNT(*) FROM donjons WHERE zone IS NULL OR zone = ''")
    sans_zone = cur.fetchone()[0] > 0
    conn.close()
    return {"zones": zones, "sans_zone": sans_zone}

@app.get("/donjons/{donjon_id}")
def detail_donjon(donjon_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM donjons WHERE id = ?", (donjon_id,))
    donjon = cur.fetchone()
    if not donjon:
        conn.close()
        return {"erreur": "Donjon introuvable"}

    cur.execute("""
        SELECT dm.monstre_id, dm.est_boss, m.nom, m.image_url
        FROM donjons_monstres dm
        JOIN monstres m ON m.id = dm.monstre_id
        WHERE dm.donjon_id = ?
        ORDER BY dm.est_boss DESC, m.nom
    """, (donjon_id,))
    monstres_rows = cur.fetchall()

    boss_principal = None
    if donjon["boss_principal_id"] is not None:
        cur.execute("SELECT id, nom, image_url FROM monstres WHERE id = ?", (donjon["boss_principal_id"],))
        bp = cur.fetchone()
        if bp:
            boss_principal = {"id": bp["id"], "nom": bp["nom"], "img": bp["image_url"]}

    cur.execute("""
        SELECT dor.objet_id, dor.quantite, o.nom, o.img
        FROM donjons_objets_requis dor
        LEFT JOIN objets o ON o.id = dor.objet_id
        WHERE dor.donjon_id = ?
    """, (donjon_id,))
    objets_requis_rows = cur.fetchall()

    # Table de drops du donjon : agrege les drops (table existante, sourcee
    # Dofensive, liee par NOM et non par ID) de tous les monstres du donjon.
    # Jointure sur le nom vers objets pour l'image/le lien — pas garantie a
    # 100% (pas de cle commune), repli propre (objet_id/img a None) sinon.
    monstre_ids = [r["monstre_id"] for r in monstres_rows]
    drops = []
    if monstre_ids:
        placeholders = ",".join("?" for _ in monstre_ids)
        cur.execute(f"""
            SELECT d.nom, MAX(d.pourcentage) AS pourcentage, o.id AS objet_id, o.img
            FROM drops d
            LEFT JOIN objets o ON o.nom = d.nom
            WHERE d.monstre_id IN ({placeholders})
            GROUP BY d.nom
            ORDER BY pourcentage DESC
        """, monstre_ids)
        drops = [dict(r) for r in cur.fetchall()]

    conn.close()

    # Guide de boss (mecaniques/salles/composition) : contenu 100% editorial,
    # jamais scrape. Absent tant que Popo/Krag ne l'a pas rempli -> section
    # masquee cote frontend (pas de "a completer" qui ferait croire a du contenu).
    guide_brut = DONJONS_GUIDES_DATA.get(str(donjon_id), {})
    mecaniques = guide_brut.get("mecaniques", [])
    salles = guide_brut.get("salles", [])
    compo_conseillee = guide_brut.get("compo_conseillee", "")
    guide = None
    if mecaniques or salles or compo_conseillee:
        guide = {"mecaniques": mecaniques, "salles": salles, "compo_conseillee": compo_conseillee}

    return {
        **dict(donjon),
        "boss_principal": boss_principal,
        "monstres": [
            {"id": r["monstre_id"], "nom": r["nom"], "img": r["image_url"], "est_boss": bool(r["est_boss"])}
            for r in monstres_rows
        ],
        "objets_requis": [
            {"id": r["objet_id"], "nom": r["nom"], "img": r["img"], "quantite": r["quantite"]}
            for r in objets_requis_rows
        ],
        "drops": drops,
        "guide": guide,
    }

@app.get("/zones")
def liste_regions(search: str = "", page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(DISTINCT area) FROM zones_areas
        WHERE area IS NOT NULL AND area LIKE ?
    """, (f"%{search}%",))
    total = cur.fetchone()[0]

    cur.execute("""
        SELECT za.area AS nom,
               COUNT(DISTINCT za.nom) AS nb_sous_zones,
               (SELECT COUNT(*) FROM donjons d WHERE d.zone = za.area) AS nb_donjons,
               (SELECT m.image_url FROM monstres m
                JOIN zones z2 ON z2.monstre_id = m.id
                JOIN zones_areas za2 ON za2.nom = z2.nom
                WHERE za2.area = za.area
                ORDER BY m.nom LIMIT 1) AS img
        FROM zones_areas za
        WHERE za.area IS NOT NULL AND za.area LIKE ?
        GROUP BY za.area
        ORDER BY za.area
        LIMIT ? OFFSET ?
    """, (f"%{search}%", page_size, (page - 1) * page_size))
    rows = cur.fetchall()
    conn.close()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "regions": [dict(r) for r in rows],
    }

@app.get("/sous-zones")
def recherche_sous_zones(search: str = "", limite: int = 20):
    limite = min(max(limite, 1), 50)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT za.nom, za.area,
               (SELECT m.image_url FROM monstres m
                JOIN zones z2 ON z2.monstre_id = m.id
                WHERE z2.nom = za.nom
                ORDER BY m.nom LIMIT 1) AS img
        FROM zones_areas za
        WHERE za.nom LIKE ?
        ORDER BY za.nom
        LIMIT ?
    """, (f"%{search}%", limite))
    rows = cur.fetchall()
    conn.close()
    return {"sous_zones": [dict(r) for r in rows]}

@app.get("/zones/{region}")
def detail_region(region: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM zones_areas WHERE area = ?", (region,))
    if cur.fetchone()[0] == 0:
        conn.close()
        return {"erreur": "Région introuvable"}

    cur.execute("""
        SELECT id, nom, niveau_min, niveau_optimal, difficulte
        FROM donjons WHERE zone = ? ORDER BY nom
    """, (region,))
    donjons_rows = cur.fetchall()

    cur.execute("""
        SELECT m.image_url FROM monstres m
        JOIN zones z ON z.monstre_id = m.id
        JOIN zones_areas za ON za.nom = z.nom
        WHERE za.area = ?
        ORDER BY m.nom LIMIT 1
    """, (region,))
    img_row = cur.fetchone()
    img = img_row["image_url"] if img_row else None

    cur.execute("""
        SELECT za.nom,
               COUNT(DISTINCT z.monstre_id) AS nb_monstres,
               MIN(base.niveau_base) AS niveau_min,
               MAX(base.niveau_base) AS niveau_max,
               (SELECT m.image_url FROM monstres m
                JOIN zones z2 ON z2.monstre_id = m.id
                WHERE z2.nom = za.nom
                ORDER BY m.nom LIMIT 1) AS img
        FROM zones_areas za
        JOIN zones z ON z.nom = za.nom
        JOIN (SELECT monstre_id, MIN(niveau) AS niveau_base FROM grades GROUP BY monstre_id) base
             ON base.monstre_id = z.monstre_id
        WHERE za.area = ?
        GROUP BY za.nom
        ORDER BY za.nom
    """, (region,))
    sous_zones_rows = cur.fetchall()
    conn.close()

    return {
        "nom": region,
        "img": img,
        "donjons": [dict(r) for r in donjons_rows],
        "sous_zones": [dict(r) for r in sous_zones_rows],
    }

@app.get("/sous-zones/{nom}")
def detail_sous_zone(nom: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT nom, area FROM zones_areas WHERE nom = ?", (nom,))
    zone = cur.fetchone()
    if not zone:
        conn.close()
        return {"erreur": "Zone introuvable"}

    cur.execute("""
        SELECT m.id, m.nom, m.image_url, base.niveau_base
        FROM zones z
        JOIN monstres m ON m.id = z.monstre_id
        JOIN (SELECT monstre_id, MIN(niveau) AS niveau_base FROM grades GROUP BY monstre_id) base
             ON base.monstre_id = m.id
        WHERE z.nom = ?
        ORDER BY m.nom
    """, (nom,))
    monstres_rows = cur.fetchall()
    conn.close()

    niveaux = [r["niveau_base"] for r in monstres_rows]

    return {
        "nom": zone["nom"],
        "area": zone["area"],
        "niveau_min": min(niveaux) if niveaux else None,
        "niveau_max": max(niveaux) if niveaux else None,
        "monstres": [
            {"id": r["id"], "nom": r["nom"], "img": r["image_url"], "niveau_base": r["niveau_base"]}
            for r in monstres_rows
        ],
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)