import json
import sqlite3
with open("dofura_monstres.json", "r", encoding="utf-8") as f:
    monstres = json.load(f)
with open("dofura_items.json", "r", encoding="utf-8") as f:
    items = json.load(f)
with open("dofura_recipes.json", "r", encoding="utf-8") as f:
    recipes = json.load(f)
with open("dofura_item_sets.json", "r", encoding="utf-8") as f:
    item_sets = json.load(f)
conn = sqlite3.connect("dofura.db")
cur = conn.cursor()
cur.executescript("""
DROP TABLE IF EXISTS monstres;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS drops;
DROP TABLE IF EXISTS sorts;
DROP TABLE IF EXISTS zones;
DROP TABLE IF EXISTS objets;
DROP TABLE IF EXISTS objets_effets;
DROP TABLE IF EXISTS recettes;
DROP TABLE IF EXISTS panoplies;
DROP TABLE IF EXISTS panoplies_effets;
CREATE TABLE monstres (
    id INTEGER PRIMARY KEY,
    nom TEXT,
    race TEXT,
    famille TEXT,
    agression INTEGER,
    tacle INTEGER,
    fuite INTEGER,
    image_url TEXT
);
CREATE TABLE grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monstre_id INTEGER,
    niveau INTEGER,
    pv INTEGER,
    pa INTEGER,
    pm INTEGER,
    xp INTEGER,
    esquive_pa INTEGER,
    esquive_pm INTEGER,
    res_neutre INTEGER,
    res_terre INTEGER,
    res_feu INTEGER,
    res_eau INTEGER,
    res_air INTEGER
);
CREATE TABLE drops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monstre_id INTEGER,
    nom TEXT,
    pourcentage REAL
);
CREATE TABLE sorts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monstre_id INTEGER,
    nom TEXT,
    sort_id INTEGER
);
CREATE TABLE zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monstre_id INTEGER,
    nom TEXT
);
CREATE TABLE panoplies (
    id INTEGER PRIMARY KEY,
    nom TEXT,
    niveau INTEGER
);
CREATE TABLE objets (
    id INTEGER PRIMARY KEY,
    nom TEXT,
    img TEXT,
    niveau INTEGER,
    type_nom TEXT,
    super_type_nom TEXT,
    description TEXT,
    panoplie_id INTEGER,
    has_recipe INTEGER,
    prix INTEGER
);
CREATE TABLE objets_effets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objet_id INTEGER,
    effect_id INTEGER,
    dice_num INTEGER,
    dice_side INTEGER,
    element_id INTEGER,
    characteristic INTEGER
);
CREATE TABLE recettes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objet_id INTEGER,
    ingredient_id INTEGER,
    quantite INTEGER,
    job_id INTEGER
);
CREATE TABLE panoplies_effets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    panoplie_id INTEGER,
    palier INTEGER,
    effect_id INTEGER,
    dice_num INTEGER,
    dice_side INTEGER,
    element_id INTEGER,
    characteristic INTEGER
);
""")
def safe_int(val):
    if isinstance(val, dict):
        return list(val.values())[0] if val else None
    return val
for m in monstres:
    cur.execute("""
        INSERT OR REPLACE INTO monstres (id, nom, race, famille, agression, tacle, fuite, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        m.get("id"),
        m.get("nom"),
        m.get("race"),
        m.get("famille"),
        safe_int(m.get("agression")),
        safe_int(m.get("tacle")),
        safe_int(m.get("fuite")),
        m.get("image_url")
    ))
    for g in m.get("grades", []):
        cur.execute("""
            INSERT INTO grades (monstre_id, niveau, pv, pa, pm, xp, esquive_pa, esquive_pm,
                                res_neutre, res_terre, res_feu, res_eau, res_air)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            m.get("id"),
            safe_int(g.get("niveau")),
            safe_int(g.get("pv")),
            safe_int(g.get("pa")),
            safe_int(g.get("pm")),
            safe_int(g.get("xp")),
            safe_int(g.get("esquive_pa")),
            safe_int(g.get("esquive_pm")),
            safe_int(g.get("res_neutre")),
            safe_int(g.get("res_terre")),
            safe_int(g.get("res_feu")),
            safe_int(g.get("res_eau")),
            safe_int(g.get("res_air"))
        ))
    for d in m.get("drops", []):
        cur.execute("""
            INSERT INTO drops (monstre_id, nom, pourcentage)
            VALUES (?, ?, ?)
        """, (m.get("id"), d.get("nom"), d.get("pourcentage")))
    for s in m.get("sorts", []):
        cur.execute("""
            INSERT INTO sorts (monstre_id, nom, sort_id)
            VALUES (?, ?, ?)
        """, (m.get("id"), s.get("nom"), s.get("id")))
    for z in m.get("zones", []):
        cur.execute("""
            INSERT INTO zones (monstre_id, nom)
            VALUES (?, ?)
        """, (m.get("id"), z.get("nom")))

for p in item_sets:
    cur.execute("""
        INSERT OR REPLACE INTO panoplies (id, nom, niveau)
        VALUES (?, ?, ?)
    """, (p.get("id"), p.get("nom"), p.get("level")))
    for palier_idx, palier in enumerate(p.get("effects", [])):
        for e in palier:
            cur.execute("""
                INSERT INTO panoplies_effets (panoplie_id, palier, effect_id, dice_num, dice_side, element_id, characteristic)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (p.get("id"), palier_idx + 1, e.get("effectId"), e.get("diceNum"),
                  e.get("diceSide"), e.get("elementId"), e.get("characteristic")))

for it in items:
    cur.execute("""
        INSERT OR REPLACE INTO objets (id, nom, img, niveau, type_nom, super_type_nom, description, panoplie_id, has_recipe, prix)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        it.get("id"), it.get("nom"), it.get("img"), it.get("level"),
        it.get("type_nom"), it.get("super_type_nom"), it.get("description"),
        it.get("item_set_id"), int(bool(it.get("has_recipe"))), it.get("price")
    ))
    for e in it.get("effects", []):
        cur.execute("""
            INSERT INTO objets_effets (objet_id, effect_id, dice_num, dice_side, element_id, characteristic)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (it.get("id"), e.get("effectId"), e.get("diceNum"), e.get("diceSide"),
              e.get("elementId"), e.get("characteristic")))

for r in recipes:
    for ing in r.get("ingredients", []):
        cur.execute("""
            INSERT INTO recettes (objet_id, ingredient_id, quantite, job_id)
            VALUES (?, ?, ?, ?)
        """, (r.get("result_id"), ing.get("item_id"), ing.get("quantite"), r.get("job_id")))

conn.commit()
conn.close()
print("Base de donnees creee avec succes !")
