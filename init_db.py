import json
import sqlite3
with open("dofura_monstres.json", "r", encoding="utf-8") as f:
    monstres = json.load(f)
conn = sqlite3.connect("dofura.db")
cur = conn.cursor()
cur.executescript("""
DROP TABLE IF EXISTS monstres;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS drops;
DROP TABLE IF EXISTS sorts;
DROP TABLE IF EXISTS zones;
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
    nom TEXT
);
CREATE TABLE zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monstre_id INTEGER,
    nom TEXT
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
            INSERT INTO sorts (monstre_id, nom)
            VALUES (?, ?)
        """, (m.get("id"), s.get("nom")))
    for z in m.get("zones", []):
        cur.execute("""
            INSERT INTO zones (monstre_id, nom)
            VALUES (?, ?)
        """, (m.get("id"), z.get("nom")))
conn.commit()
conn.close()
print("Base de donnees creee avec succes !")
