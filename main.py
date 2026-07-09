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
    conn.close()
    return {
        **dict(monstre),
        "grades": [dict(g) for g in grades],
        "drops": [dict(d) for d in drops],
        "sorts": [dict(s) for s in sorts],
        "zones": [dict(z) for z in zones],
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
            "value": dice_num, "duration": 0,
        })

    return formater_effet({
        "effectId": effect_id,
        "diceNum": dice_num,
        "diceSide": row["dice_side"],
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

@app.get("/objets")
def liste_objets(categorie: str = "equipement", search: str = "", type: str = "",
                  tranche_niveau: str = "", page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)
    super_types = CATEGORIES_OBJETS.get(categorie, CATEGORIES_OBJETS["equipement"])

    conditions = [f"super_type_nom IN ({','.join('?' for _ in super_types)})", "nom LIKE ?"]
    params = list(super_types) + [f"%{search}%"]

    if type == SANS_VALEUR:
        conditions.append("(type_nom IS NULL OR type_nom = '')")
    elif type:
        conditions.append("type_nom = ?")
        params.append(type)

    if tranche_niveau == SANS_VALEUR:
        conditions.append("(niveau IS NULL OR niveau = 0)")
    elif tranche_niveau in TRANCHES_NIVEAU:
        borne_min, borne_max = TRANCHES_NIVEAU[tranche_niveau]
        conditions.append("niveau BETWEEN ? AND ?")
        params.extend([borne_min, borne_max])

    where_clause = " AND ".join(conditions)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM objets WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT id, nom, img, niveau, type_nom FROM objets
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
        "objets": [dict(r) for r in rows],
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

    conn.close()
    return {"types": types, "sans_type": sans_type, "sans_niveau": sans_niveau}

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

    cur.execute("""
        SELECT r.ingredient_id, r.quantite, r.job_id, o.nom AS ingredient_nom, o.img AS ingredient_img
        FROM recettes r
        LEFT JOIN objets o ON o.id = r.ingredient_id
        WHERE r.objet_id = ?
    """, (objet_id,))
    ingredients = cur.fetchall()

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

    conn.close()
    return {
        **dict(objet),
        "effects": [f for e in effets_bruts if (f := formater_effet_objet(e))["texte"] is not None],
        "recette": [
            {"ingredient_id": i["ingredient_id"], "quantite": i["quantite"], "nom": i["ingredient_nom"], "img": i["ingredient_img"]}
            for i in ingredients
        ],
        "job_id": ingredients[0]["job_id"] if ingredients else None,
        "panoplie": panoplie,
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)