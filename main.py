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

def formater_effet(effet):
    effect_id = effet.get("effectId")
    dice_num = effet.get("diceNum", 0)
    dice_side = effet.get("diceSide", 0)
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

    desc = desc.replace("#1", str(dice_num))
    if dice_side != 0:
        desc = desc.replace("#2", str(dice_side))
    else:
        desc = desc.replace("#2", "")

    # Le retrait de la balise laisse l'espace qui l'entourait des deux cotes
    # (ex. "1 <sprite name=\"PA\"> PA" -> "1  PA") : on les recollapse a un seul.
    desc = re.sub(r'<sprite[^>]*>', '', desc)
    desc = re.sub(r'\s{2,}', ' ', desc).strip()

    # "+" explicite pour les bonus dont le texte demarre par la valeur brute
    # (ex. "2 PM" -> "+2 PM"), symetrique du "-" deja integre par Ankama dans
    # le texte des malus. Le garde-fou "#" absent exclut les rares templates
    # a placeholders multiples (#3+) que ce formatage ne gere pas encore, et
    # startswith(valeur) exclut les tournures verbales ("Vole 2 PM") qui n'ont
    # pas besoin de signe.
    if polarite == "bonus" and "#" not in desc and desc.startswith(str(dice_num)):
        desc = "+" + desc

    # Si la description source était juste '#1', le texte final est un nombre brut — on le masque
    if desc.strip().lstrip('-+').isdigit():
        desc = None

    return {
        "texte": desc,
        "valeur": valeur,
        "duration": duration,
        "effect_id": effect_id,
        "polarite": polarite,
    }

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
        "effects": [f for e in sort.get("effects", []) if (f:=formater_effet(e))["texte"] is not None],
        "critical_effects": [f for e in sort.get("critical_effects", []) if (f:=formater_effet(e))["texte"] is not None],
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)