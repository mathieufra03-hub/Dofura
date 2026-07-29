import json
import sqlite3
import bcrypt
import os
import re

DB_PATH = os.getenv("DB_PATH", "dofura.db")

print("[init_db] Chargement des fichiers JSON sources...")
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
with open("dofura_quetes.json", "r", encoding="utf-8") as f:
    quetes = json.load(f)
with open("dofura_succes.json", "r", encoding="utf-8") as f:
    succes = json.load(f)
with open("dofura_songes_items.json", "r", encoding="utf-8") as f:
    songes_items = json.load(f)
with open("dofura_songes_taux.json", "r", encoding="utf-8") as f:
    songes_taux = json.load(f)
print(f"[init_db] JSON charges. Connexion a la base : {DB_PATH}")
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
# ============================================================
# Liste blanche des tables autorisees au DROP (protection donnees users)
# ============================================================
# Ce script DROP + CREATE tout ce qui suit a chaque import : c'est normal,
# ce sont des tables encyclopediques 100% regenerees depuis les JSON sources
# (regle 9 CLAUDE.md). Seules les tables de cette liste ont le droit d'etre
# dans le bloc DROP TABLE du schema ci-dessous.
TABLES_ENCYCLOPEDIE = {
    "monstres", "grades", "drops", "sorts", "zones", "objets", "objets_effets",
    "recettes", "panoplies", "panoplies_effets", "donjons", "donjons_monstres",
    "donjons_objets_requis", "zones_areas", "quetes", "quetes_etapes",
    "quetes_etapes_items", "quetes_etapes_actions", "quetes_ressources",
    "quetes_prerequis_quetes", "quetes_prerequis_objets", "quetes_donjons",
    "succes", "succes_objectifs", "succes_recompenses_items", "succes_donjons",
    # Suivi de Songes (SONGES.md §5) : donnees de reference 100% regenerees
    # depuis dofura_songes_items.json / dofura_songes_taux.json, pas de donnee
    # utilisateur — donc autorisees ici comme le reste de l'encyclopedie.
    "songe_items_trackables", "songe_taux",
}

# users / progression_joueur / favoris portent de la donnee utilisateur reelle
# (comptes, cases cochees, favoris) qui ne se regenere depuis AUCUN fichier
# source — un DROP dessus serait une perte definitive et irrecuperable.
# Idem pour les 6 tables songe_* de donnees joueur (SONGES.md §5) : runs,
# drops, personnages, teams — rien de tout ca ne peut se reconstruire.
# songe_journal (refonte interface "Tout supprimer") : archive de drops
# passes, alimentee uniquement par l'appli — memes raisons, meme protection.
# Elles ne doivent JAMAIS apparaitre dans TABLES_ENCYCLOPEDIE ni dans le
# schema DROP ci-dessous ; elles ne sont creees plus bas qu'en
# CREATE TABLE IF NOT EXISTS, jamais precedees d'un DROP.
TABLES_UTILISATEUR_INTERDITES = {
    "users", "progression_joueur", "favoris",
    "songe_personnages", "songe_teams", "songe_team_membres",
    "songe_runs", "songe_run_participants", "songe_drops", "songe_journal",
}

print("[init_db] Creation du schema (DROP + CREATE des tables encyclopediques)...")
SCHEMA_ENCYCLOPEDIE = """
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
DROP TABLE IF EXISTS quetes;
DROP TABLE IF EXISTS quetes_etapes;
DROP TABLE IF EXISTS quetes_etapes_items;
DROP TABLE IF EXISTS quetes_etapes_actions;
DROP TABLE IF EXISTS quetes_ressources;
DROP TABLE IF EXISTS quetes_prerequis_quetes;
DROP TABLE IF EXISTS quetes_prerequis_objets;
DROP TABLE IF EXISTS quetes_donjons;
DROP TABLE IF EXISTS succes;
DROP TABLE IF EXISTS succes_objectifs;
DROP TABLE IF EXISTS succes_recompenses_items;
DROP TABLE IF EXISTS succes_donjons;
DROP TABLE IF EXISTS songe_items_trackables;
DROP TABLE IF EXISTS songe_taux;
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
CREATE TABLE quetes (
    id INTEGER PRIMARY KEY,
    nom TEXT,
    niveau_min INTEGER,
    niveau_max INTEGER,
    categorie TEXT,
    is_dungeon_quest INTEGER,
    zone TEXT,
    sous_zone TEXT,
    lieu_precis TEXT,
    coord_x INTEGER,
    coord_y INTEGER,
    pnj TEXT,
    carte_img_depart TEXT
);
CREATE TABLE quetes_etapes (
    id INTEGER PRIMARY KEY,
    quete_id INTEGER,
    ordre INTEGER,
    nom TEXT,
    description TEXT,
    a_xp INTEGER,
    a_kamas INTEGER
);
CREATE TABLE quetes_etapes_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etape_id INTEGER,
    objet_id INTEGER,
    quantite INTEGER
);
CREATE TABLE quetes_etapes_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etape_id INTEGER,
    ordre INTEGER,
    icone TEXT,
    verbe TEXT,
    cible TEXT,
    cible_secondaire TEXT,
    lieu TEXT,
    coord_x INTEGER,
    coord_y INTEGER,
    carte_img TEXT
);
CREATE TABLE quetes_ressources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quete_id INTEGER,
    objet_id INTEGER,
    quantite INTEGER
);
CREATE TABLE quetes_prerequis_quetes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quete_id INTEGER,
    quete_requise_id INTEGER
);
CREATE TABLE quetes_prerequis_objets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quete_id INTEGER,
    objet_id INTEGER,
    quantite INTEGER
);
CREATE TABLE quetes_donjons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quete_id INTEGER,
    donjon_id INTEGER
);
CREATE TABLE succes (
    id INTEGER PRIMARY KEY,
    nom TEXT,
    description TEXT,
    categorie TEXT,
    points INTEGER,
    niveau INTEGER,
    img TEXT,
    recompense_titre TEXT,
    recompense_a_kamas INTEGER
);
CREATE TABLE succes_objectifs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    succes_id INTEGER,
    ordre INTEGER,
    nom TEXT,
    type TEXT,
    quete_id INTEGER
);
CREATE TABLE succes_recompenses_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    succes_id INTEGER,
    objet_id INTEGER,
    quantite INTEGER
);
CREATE TABLE succes_donjons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    succes_id INTEGER,
    donjon_id INTEGER
);
CREATE TABLE songe_items_trackables (
    item_id       INTEGER PRIMARY KEY,
    categorie     TEXT NOT NULL,
    cle_taux      TEXT NOT NULL,
    paliers       TEXT NOT NULL,
    intensite_min TEXT
);
CREATE TABLE songe_taux (
    intensite     TEXT NOT NULL,
    niveau        INTEGER NOT NULL,
    palier        INTEGER NOT NULL,
    cle_taux      TEXT NOT NULL,
    taux          REAL NOT NULL,
    PRIMARY KEY (intensite, niveau, palier, cle_taux)
);
"""

# Verification avant execution : chaque DROP TABLE du schema doit cibler une
# table de la liste blanche, jamais une table utilisateur protegee. Arrete
# tout avant la moindre requete si le schema a ete modifie par erreur.
tables_droppees = set(re.findall(r"DROP TABLE IF EXISTS (\w+);", SCHEMA_ENCYCLOPEDIE))
tables_interdites_touchees = tables_droppees & TABLES_UTILISATEUR_INTERDITES
if tables_interdites_touchees:
    raise RuntimeError(
        f"[init_db] ARRET : DROP TABLE detecte sur des tables utilisateur protegees "
        f"{sorted(tables_interdites_touchees)} — donnees irrecuperables, import annule."
    )
tables_hors_liste_blanche = tables_droppees - TABLES_ENCYCLOPEDIE
if tables_hors_liste_blanche:
    raise RuntimeError(
        f"[init_db] ARRET : DROP TABLE sur des tables absentes de la liste blanche "
        f"{sorted(tables_hors_liste_blanche)} — a valider avant d'ajouter au schema."
    )
print(f"[init_db] Liste blanche verifiee : {len(tables_droppees)} tables encyclopediques a recreer, aucune table utilisateur touchee.")

cur.executescript(SCHEMA_ENCYCLOPEDIE)
print("[init_db] Schema cree. Import des donnees dans les tables...")
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

for q in quetes:
    coord = q.get("coordonnees") or {}
    cur.execute("""
        INSERT OR REPLACE INTO quetes (id, nom, niveau_min, niveau_max, categorie, is_dungeon_quest, zone,
                                        sous_zone, lieu_precis, coord_x, coord_y, pnj, carte_img_depart)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        q.get("id"), q.get("nom"), q.get("niveau_min"), q.get("niveau_max"),
        q.get("categorie"), int(bool(q.get("is_dungeon_quest"))), q.get("zone"),
        q.get("sous_zone"), q.get("lieu_precis"), coord.get("x"), coord.get("y"), q.get("pnj"),
        q.get("carte_img_depart")
    ))
    for ordre, e in enumerate(q.get("etapes", [])):
        cur.execute("""
            INSERT OR REPLACE INTO quetes_etapes (id, quete_id, ordre, nom, description, a_xp, a_kamas)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (e.get("id"), q.get("id"), ordre, e.get("nom"), e.get("description"),
              int(bool(e.get("a_xp"))), int(bool(e.get("a_kamas")))))
        for it in e.get("items", []):
            cur.execute("""
                INSERT INTO quetes_etapes_items (etape_id, objet_id, quantite)
                VALUES (?, ?, ?)
            """, (e.get("id"), it.get("id"), it.get("quantite")))
        for ordre_action, a in enumerate(e.get("actions", [])):
            cur.execute("""
                INSERT INTO quetes_etapes_actions (etape_id, ordre, icone, verbe, cible, cible_secondaire, lieu, coord_x, coord_y, carte_img)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (e.get("id"), ordre_action, a.get("icone"), a.get("verbe"), a.get("cible"),
                  a.get("cible_secondaire"), a.get("lieu"), a.get("x"), a.get("y"), a.get("carte_img")))
    for quete_requise_id in q.get("prerequis_quetes", []):
        cur.execute("""
            INSERT INTO quetes_prerequis_quetes (quete_id, quete_requise_id)
            VALUES (?, ?)
        """, (q.get("id"), quete_requise_id))
    for it in q.get("prerequis_items", []):
        cur.execute("""
            INSERT INTO quetes_prerequis_objets (quete_id, objet_id, quantite)
            VALUES (?, ?, ?)
        """, (q.get("id"), it.get("id"), it.get("quantite")))
    for r in q.get("ressources", []):
        cur.execute("""
            INSERT INTO quetes_ressources (quete_id, objet_id, quantite)
            VALUES (?, ?, ?)
        """, (q.get("id"), r.get("id"), r.get("quantite")))
    for donjon_id in q.get("donjons_lies", []):
        cur.execute("""
            INSERT INTO quetes_donjons (quete_id, donjon_id)
            VALUES (?, ?)
        """, (q.get("id"), donjon_id))

for s in succes:
    cur.execute("""
        INSERT OR REPLACE INTO succes (id, nom, description, categorie, points, niveau, img,
                                        recompense_titre, recompense_a_kamas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        s.get("id"), s.get("nom"), s.get("description"), s.get("categorie"),
        s.get("points"), s.get("niveau"), s.get("img"),
        s.get("recompense_titre"), int(bool(s.get("recompense_a_kamas")))
    ))
    for ordre, o in enumerate(s.get("objectifs", [])):
        cur.execute("""
            INSERT INTO succes_objectifs (succes_id, ordre, nom, type, quete_id)
            VALUES (?, ?, ?, ?, ?)
        """, (s.get("id"), ordre, o.get("nom"), o.get("type"), o.get("quete_id")))
    for it in s.get("recompense_items", []):
        cur.execute("""
            INSERT INTO succes_recompenses_items (succes_id, objet_id, quantite)
            VALUES (?, ?, ?)
        """, (s.get("id"), it.get("id"), it.get("quantite")))
    for donjon_id in s.get("donjons_lies", []):
        cur.execute("""
            INSERT INTO succes_donjons (succes_id, donjon_id)
            VALUES (?, ?)
        """, (s.get("id"), donjon_id))

for it in songes_items:
    cur.execute("""
        INSERT OR REPLACE INTO songe_items_trackables (item_id, categorie, cle_taux, paliers, intensite_min)
        VALUES (?, ?, ?, ?, ?)
    """, (it.get("item_id"), it.get("categorie"), it.get("cle_taux"), json.dumps(it.get("paliers")), it.get("intensite_min")))

for t in songes_taux:
    cur.execute("""
        INSERT OR REPLACE INTO songe_taux (intensite, niveau, palier, cle_taux, taux)
        VALUES (?, ?, ?, ?, ?)
    """, (t.get("intensite"), t.get("niveau"), t.get("palier"), t.get("cle_taux"), t.get("taux")))


# ============================================================
# Comptes utilisateurs / progression / favoris (chantier Phase 4)
# + tables donnee-joueur du Suivi de Songes (SONGES.md §5)
# ⚠️ CREATE TABLE IF NOT EXISTS UNIQUEMENT — jamais de DROP TABLE ici.
# Contrairement a tout ce qui precede (encyclopedie, regeneree a chaque
# demarrage depuis les JSON sources, voir regle 9 CLAUDE.md), ces tables
# portent de la donnee utilisateur reelle qui doit survivre aux redemarrages.
# Ce script entier n'est desormais relance qu'une fois par base (voir la
# verification "base deja peuplee" dans main.py) : sur Railway, avec DB_PATH
# pointant vers le volume persistant, ces tables ne sont donc plus recreees
# ni re-semees a chaque redeploiement. Tous ces noms sont dans
# TABLES_UTILISATEUR_INTERDITES ci-dessus, verifiee avant le DROP du schema
# encyclopedique — double garde-fou volontaire (liste blanche + ce commentaire).
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
CREATE TABLE IF NOT EXISTS songe_personnages (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    nom           TEXT NOT NULL,
    classe        TEXT,
    serveur       TEXT,
    cree_le       TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS songe_teams (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    nom           TEXT NOT NULL,
    cree_le       TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS songe_team_membres (
    team_id       INTEGER NOT NULL REFERENCES songe_teams(id) ON DELETE CASCADE,
    perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, perso_id)
);
CREATE TABLE IF NOT EXISTS songe_runs (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id            INTEGER,
    date_run           TEXT DEFAULT (datetime('now')),
    intensite          TEXT NOT NULL,
    niveau             INTEGER NOT NULL,
    terminee           INTEGER NOT NULL DEFAULT 1,
    salle_atteinte     INTEGER NOT NULL DEFAULT 26,
    nb_combats         INTEGER NOT NULL,
    source_nb_combats  TEXT NOT NULL,
    team_id            INTEGER,
    note               TEXT
);
CREATE TABLE IF NOT EXISTS songe_run_participants (
    run_id        INTEGER NOT NULL REFERENCES songe_runs(id) ON DELETE CASCADE,
    perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id),
    PRIMARY KEY (run_id, perso_id)
);
CREATE TABLE IF NOT EXISTS songe_drops (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id        INTEGER NOT NULL REFERENCES songe_runs(id) ON DELETE CASCADE,
    perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id),
    item_id       INTEGER NOT NULL,
    quantite      INTEGER NOT NULL DEFAULT 1,
    palier        INTEGER,
    cree_le       TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS songe_journal (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    item_id       INTEGER NOT NULL,
    palier        INTEGER,
    date_drop     TEXT
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
print("[init_db] Import termine, base de donnees creee avec succes !")
