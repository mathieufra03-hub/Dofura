import json
import sqlite3
import bcrypt
with open("dofura_monstres.json", "r", encoding="utf-8") as f:
    monstres = json.load(f)
with open("dofura_items.json", "r", encoding="utf-8") as f:
    items = json.load(f)
with open("dofura_recipes.json", "r", encoding="utf-8") as f:
    recipes = json.load(f)
with open("dofura_item_sets.json", "r", encoding="utf-8") as f:
    item_sets = json.load(f)
with open("dofura_donjons.json", "r", encoding="utf-8") as f:
    donjons = json.load(f)
with open("dofura_zones_areas.json", "r", encoding="utf-8") as f:
    zones_areas = json.load(f)
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
DROP TABLE IF EXISTS donjons;
DROP TABLE IF EXISTS donjons_monstres;
DROP TABLE IF EXISTS donjons_objets_requis;
DROP TABLE IF EXISTS zones_areas;
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
    niveau INTEGER,
    cosmetique INTEGER,
    image_objet_id INTEGER
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
    prix INTEGER,
    legendaire INTEGER
);
CREATE TABLE objets_effets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objet_id INTEGER,
    effect_id INTEGER,
    dice_num INTEGER,
    dice_side INTEGER,
    value INTEGER,
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
    value INTEGER,
    element_id INTEGER,
    characteristic INTEGER
);
CREATE TABLE donjons (
    id INTEGER PRIMARY KEY,
    nom TEXT,
    niveau_min INTEGER,
    niveau_optimal INTEGER,
    difficulte INTEGER,
    zone TEXT,
    recherche_groupe INTEGER,
    disponible_hall INTEGER,
    disponible_trousseau INTEGER,
    boss_principal_id INTEGER
);
CREATE TABLE donjons_monstres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donjon_id INTEGER,
    monstre_id INTEGER,
    est_boss INTEGER
);
CREATE TABLE donjons_objets_requis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donjon_id INTEGER,
    objet_id INTEGER,
    quantite INTEGER
);
CREATE TABLE zones_areas (
    nom TEXT PRIMARY KEY,
    area TEXT
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
        INSERT OR REPLACE INTO panoplies (id, nom, niveau, cosmetique, image_objet_id)
        VALUES (?, ?, ?, ?, ?)
    """, (p.get("id"), p.get("nom"), p.get("level"), int(bool(p.get("cosmetique"))), p.get("image_objet_id")))
    for palier_idx, palier in enumerate(p.get("effects", [])):
        # palier_idx = nombre de pieces equipees (0 = quasi-toujours vide,
        # sauf 5 panoplies avec un bonus "toujours actif" atypique - garde
        # tel quel, pas de +1 : "palier N" == N pieces, pas invente.
        for e in palier:
            cur.execute("""
                INSERT INTO panoplies_effets (panoplie_id, palier, effect_id, dice_num, dice_side, value, element_id, characteristic)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (p.get("id"), palier_idx, e.get("effectId"), e.get("diceNum"),
                  e.get("diceSide"), e.get("value"), e.get("elementId"), e.get("characteristic")))

for it in items:
    cur.execute("""
        INSERT OR REPLACE INTO objets (id, nom, img, niveau, type_nom, super_type_nom, description, panoplie_id, has_recipe, prix, legendaire)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        it.get("id"), it.get("nom"), it.get("img"), it.get("level"),
        it.get("type_nom"), it.get("super_type_nom"), it.get("description"),
        it.get("item_set_id"), int(bool(it.get("has_recipe"))), it.get("price"),
        int(bool(it.get("legendaire")))
    ))
    for e in it.get("effects", []):
        cur.execute("""
            INSERT INTO objets_effets (objet_id, effect_id, dice_num, dice_side, value, element_id, characteristic)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (it.get("id"), e.get("effectId"), e.get("diceNum"), e.get("diceSide"),
              e.get("value"), e.get("elementId"), e.get("characteristic")))

for r in recipes:
    for ing in r.get("ingredients", []):
        cur.execute("""
            INSERT INTO recettes (objet_id, ingredient_id, quantite, job_id)
            VALUES (?, ?, ?, ?)
        """, (r.get("result_id"), ing.get("item_id"), ing.get("quantite"), r.get("job_id")))

for d in donjons:
    boss_ids = d.get("boss_ids", [])
    monstre_ids = d.get("monstre_ids", [])
    boss_principal_id = boss_ids[0] if boss_ids else (monstre_ids[0] if monstre_ids else None)
    cur.execute("""
        INSERT OR REPLACE INTO donjons (id, nom, niveau_min, niveau_optimal, difficulte, zone,
                                         recherche_groupe, disponible_hall, disponible_trousseau, boss_principal_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        d.get("id"), d.get("nom"), d.get("niveau_min"), d.get("niveau_optimal"), d.get("difficulte"),
        d.get("zone"), int(bool(d.get("recherche_groupe"))), int(bool(d.get("disponible_hall"))),
        int(bool(d.get("disponible_trousseau"))), boss_principal_id
    ))
    boss_ids_set = set(boss_ids)
    for monstre_id in monstre_ids:
        cur.execute("""
            INSERT INTO donjons_monstres (donjon_id, monstre_id, est_boss)
            VALUES (?, ?, ?)
        """, (d.get("id"), monstre_id, int(monstre_id in boss_ids_set)))
    for o in d.get("objets_requis", []):
        cur.execute("""
            INSERT INTO donjons_objets_requis (donjon_id, objet_id, quantite)
            VALUES (?, ?, ?)
        """, (d.get("id"), o.get("id"), o.get("quantite")))

for z in zones_areas:
    cur.execute("""
        INSERT OR REPLACE INTO zones_areas (nom, area)
        VALUES (?, ?)
    """, (z.get("nom"), z.get("area")))


# ============================================================
# Comptes utilisateurs / progression / favoris (chantier Phase 4)
# ⚠️ CREATE TABLE IF NOT EXISTS UNIQUEMENT — jamais de DROP TABLE ici.
# Contrairement a tout ce qui precede (encyclopedie, regeneree a chaque
# demarrage depuis les JSON sources, voir regle 9 CLAUDE.md), ces 3 tables
# portent de la donnee utilisateur reelle qui doit survivre aux redemarrages
# locaux. ATTENTION : sur Railway (pas de volume persistant, voir CLAUDE.md
# "Chantiers en cours #1"), tout dofura.db reste ephemere au redeploiement
# tant que ce chantier n'est pas fait — teste en local uniquement pour l'instant.
cur.executescript("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS progression_joueur (
    user_id INTEGER NOT NULL,
    element_type TEXT NOT NULL,
    element_id TEXT NOT NULL,
    fait INTEGER NOT NULL DEFAULT 0,
    date_maj TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, element_type, element_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS favoris (
    user_id INTEGER NOT NULL,
    element_type TEXT NOT NULL,
    element_id TEXT NOT NULL,
    date_ajout TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, element_type, element_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
""")

# Compte de test seme au demarrage (idempotent) : mot de passe connu, permet
# de tester favoris/progression sans avoir monte l'inscription publique.
# Identifiants documentes dans CLAUDE.md (section Compte de test).
TEST_PSEUDO, TEST_EMAIL, TEST_PASSWORD = "PopoTest", "popo-test@dofura.local", "dofura-test-2026"
cur.execute("SELECT id FROM users WHERE pseudo = ?", (TEST_PSEUDO,))
if not cur.fetchone():
    hash_test = bcrypt.hashpw(TEST_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cur.execute("INSERT INTO users (pseudo, email, password_hash) VALUES (?, ?, ?)",
                (TEST_PSEUDO, TEST_EMAIL, hash_test))

conn.commit()
conn.close()
print("Base de donnees creee avec succes !")
