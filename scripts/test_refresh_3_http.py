"""
Tache 6c/6d/6e (partie HTTP) : lance une instance temporaire du backend,
DB_PATH pointe sur dofura_test_refresh.db (jamais dofura.db, jamais la
prod), sur un port different (8099) de l'instance de dev habituelle
(8000) pour ne jamais interferer avec elle.

Scenario :
  1. Echecs d'authentification : sans token, avec un mauvais token -> 401.
  2. Premier appel (succes) : les 10 tables doivent etre creees, les 3
     encyclopediques remplies, les 7 de progression creees mais VIDES.
  3. Insertion de lignes de test dans les 7 tables de progression (simule
     de vrais joueurs qui ont utilise le tracker depuis le 1er refresh).
  4. Deuxieme appel (succes) : les lignes de progression doivent etre
     RIGOUREUSEMENT IDENTIQUES avant/apres — le scenario le plus important,
     celui du prochain appel en prod avec de vraies donnees.
  5. users/progression_joueur/favoris verifies inchanges du debut a la fin.
"""
import os
import subprocess
import sys
import time
import sqlite3
import secrets

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_TEST = os.path.join(RACINE, "dofura_test_refresh.db")
PORT_TEST = 8099
BASE_URL = f"http://localhost:{PORT_TEST}"
ADMIN_TOKEN_TEST = secrets.token_hex(16)

TABLES_ENCYCLO = {"songe_items_trackables", "songe_taux", "songe_boss_modifs"}
TABLES_PROGRESSION = {
    "songe_personnages", "songe_teams", "songe_team_membres", "songe_runs",
    "songe_run_participants", "songe_drops", "songe_journal",
}

echecs = []


def verif(condition, message):
    if condition:
        print(f"  OK   : {message}")
    else:
        echecs.append(message)
        print(f"  ECHEC: {message}")


def demarrer_serveur():
    env = os.environ.copy()
    env["DB_PATH"] = DB_TEST
    env["ADMIN_TOKEN"] = ADMIN_TOKEN_TEST
    env["PORT"] = str(PORT_TEST)
    proc = subprocess.Popen(
        [sys.executable, "main.py"],
        cwd=RACINE, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    import requests
    for _ in range(60):
        try:
            requests.get(f"{BASE_URL}/songes/config", timeout=1)
            print(f"Serveur de test pret sur {BASE_URL} (DB_PATH={DB_TEST}).")
            return proc
        except requests.exceptions.RequestException:
            time.sleep(0.5)
    proc.terminate()
    raise RuntimeError("Le serveur de test n'a jamais repondu.")


def snapshot_tables_progression(chemin_db):
    conn = sqlite3.connect(f"file:{chemin_db}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    snap = {}
    for table in TABLES_PROGRESSION:
        cur.execute(f"SELECT * FROM {table} ORDER BY rowid")
        snap[table] = [dict(r) for r in cur.fetchall()]
    conn.close()
    return snap


def compte_tables_protegees(chemin_db):
    conn = sqlite3.connect(f"file:{chemin_db}?mode=ro", uri=True)
    cur = conn.cursor()
    resultat = {}
    for table in ("users", "progression_joueur", "favoris"):
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        resultat[table] = cur.fetchone()[0]
    conn.close()
    return resultat


def seed_lignes_test(chemin_db):
    """Insere de vraies lignes de test dans les 7 tables de progression —
    simule le premier joueur a utiliser le tracker apres le refresh."""
    conn = sqlite3.connect(chemin_db)
    cur = conn.cursor()
    cur.execute("INSERT INTO songe_personnages (user_id, nom, classe, serveur) VALUES (1, 'TestPerso', 'Iop', 'Dakal')")
    perso_id = cur.lastrowid
    cur.execute("INSERT INTO songe_teams (user_id, nom) VALUES (1, 'TestTeam')")
    team_id = cur.lastrowid
    cur.execute("INSERT INTO songe_team_membres (team_id, perso_id) VALUES (?, ?)", (team_id, perso_id))
    cur.execute("""
        INSERT INTO songe_runs (user_id, intensite, niveau, terminee, salle_atteinte, nb_combats, source_nb_combats, team_id)
        VALUES (1, 'paradoxe', 1, 1, 26, 22, 'estime', ?)
    """, (team_id,))
    run_id = cur.lastrowid
    cur.execute("INSERT INTO songe_run_participants (run_id, perso_id) VALUES (?, ?)", (run_id, perso_id))
    cur.execute("INSERT INTO songe_drops (run_id, perso_id, item_id, quantite, palier) VALUES (?, ?, 20658, 1, 3)", (run_id, perso_id))
    cur.execute("INSERT INTO songe_journal (user_id, item_id, palier, date_drop) VALUES (1, 20658, 3, datetime('now'))")
    conn.commit()
    conn.close()
    print(f"Lignes de test inserees : perso_id={perso_id}, team_id={team_id}, run_id={run_id}")


def main():
    import requests

    print("=== Test 1 : sans token X-Admin-Token -> 401 attendu ===")
    r = requests.post(f"{BASE_URL}/admin/refresh-encyclopedie")
    verif(r.status_code == 401, f"sans token -> HTTP {r.status_code} (attendu 401)")

    print("\n=== Test 2 : mauvais token -> 401 attendu ===")
    r = requests.post(f"{BASE_URL}/admin/refresh-encyclopedie", headers={"X-Admin-Token": "mauvais-token"})
    verif(r.status_code == 401, f"mauvais token -> HTTP {r.status_code} (attendu 401)")

    print("\n=== Test 3 : premier appel, token correct -> 200 attendu ===")
    headers = {"X-Admin-Token": ADMIN_TOKEN_TEST}
    r = requests.post(f"{BASE_URL}/admin/refresh-encyclopedie", headers=headers)
    verif(r.status_code == 200, f"premier appel -> HTTP {r.status_code} (attendu 200)")
    if r.status_code != 200:
        print(f"  Detail de l'erreur : {r.text}")
    if r.status_code == 200:
        data = r.json()
        par_table = {t["table"]: t for t in data["tables"]}
        verif(len(par_table) == 10, f"10 tables dans la reponse (obtenu {len(par_table)})")
        for table in TABLES_ENCYCLO:
            t = par_table.get(table, {})
            verif(t.get("action") == "remplie", f"{table} : action = 'remplie' (obtenu {t.get('action')})")
            verif(t.get("lignes_apres", 0) > 0, f"{table} : lignes_apres > 0 (obtenu {t.get('lignes_apres')})")
        for table in TABLES_PROGRESSION:
            t = par_table.get(table, {})
            verif(t.get("action") == "creee", f"{table} : action = 'creee' (obtenu {t.get('action')})")
            verif(t.get("lignes_apres") == 0, f"{table} : lignes_apres = 0, creee VIDE (obtenu {t.get('lignes_apres')})")

    print("\n=== Verification independante (lecture directe SQLite) ===")
    conn = sqlite3.connect(f"file:{DB_TEST}?mode=ro", uri=True)
    cur = conn.cursor()
    for table in TABLES_ENCYCLO | TABLES_PROGRESSION:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", (table,))
        verif(cur.fetchone() is not None, f"{table} existe reellement dans la base (verification hors reponse HTTP)")
    conn.close()

    compte_avant_seed = compte_tables_protegees(DB_TEST)

    print("\n=== Test 4 : insertion de lignes de test dans les 7 tables de progression ===")
    seed_lignes_test(DB_TEST)
    snapshot_avant = snapshot_tables_progression(DB_TEST)
    for table, lignes in snapshot_avant.items():
        print(f"  {table:<28} {len(lignes)} ligne(s) avant le 2e appel")

    print("\n=== Test 5 : deuxieme appel (le plus important) -> les lignes de progression ne doivent PAS bouger ===")
    r = requests.post(f"{BASE_URL}/admin/refresh-encyclopedie", headers=headers)
    verif(r.status_code == 200, f"deuxieme appel -> HTTP {r.status_code} (attendu 200)")
    if r.status_code == 200:
        data = r.json()
        par_table = {t["table"]: t for t in data["tables"]}
        for table in TABLES_PROGRESSION:
            t = par_table.get(table, {})
            verif(t.get("action") == "deja_presente_ignoree",
                  f"{table} : action = 'deja_presente_ignoree' au 2e appel (obtenu {t.get('action')})")
        for table in TABLES_ENCYCLO:
            t = par_table.get(table, {})
            verif(t.get("action") == "remplie", f"{table} : toujours 'remplie' au 2e appel (obtenu {t.get('action')})")

    snapshot_apres = snapshot_tables_progression(DB_TEST)
    for table in TABLES_PROGRESSION:
        identique = snapshot_avant[table] == snapshot_apres[table]
        verif(identique, f"{table} : lignes STRICTEMENT IDENTIQUES avant/apres le 2e appel ({len(snapshot_apres[table])} ligne(s))")

    compte_apres = compte_tables_protegees(DB_TEST)
    for table in ("users", "progression_joueur", "favoris"):
        verif(compte_avant_seed[table] == compte_apres[table],
              f"{table} : {compte_avant_seed[table]} -> {compte_apres[table]} lignes, inchange")

    print("\n" + "=" * 60)
    if echecs:
        print(f"ECHEC(S) : {len(echecs)}")
        for e in echecs:
            print(f"  - {e}")
        return False
    print("TOUT OK.")
    return True


if __name__ == "__main__":
    proc = demarrer_serveur()
    try:
        ok = main()
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        print("Serveur de test arrete.")
    raise SystemExit(0 if ok else 1)
