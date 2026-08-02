"""
Tache 6a/6b : prepare une copie de dofura.db reproduisant exactement l'etat
diagnostique en prod (les 10 tables identifiees absentes). Ce script ne
touche QUE dofura_test_refresh.db, jamais dofura.db (source, lue en copie
seulement) ni la prod.
"""
import shutil
import sqlite3
import os

SOURCE = "dofura.db"
COPIE = "dofura_test_refresh.db"

TABLES_A_SUPPRIMER = [
    "songe_items_trackables", "songe_taux", "songe_boss_modifs",
    "songe_personnages", "songe_teams", "songe_team_membres",
    "songe_runs", "songe_run_participants", "songe_drops", "songe_journal",
]


def main():
    if os.path.exists(COPIE):
        os.remove(COPIE)
        print(f"Ancienne copie {COPIE} supprimee.")

    shutil.copy2(SOURCE, COPIE)
    print(f"Copie creee : {SOURCE} -> {COPIE} ({os.path.getsize(COPIE)} octets)")

    conn = sqlite3.connect(COPIE)
    cur = conn.cursor()

    print("\nEtat AVANT suppression (tables cible) :")
    for table in TABLES_A_SUPPRIMER:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", (table,))
        present = cur.fetchone() is not None
        print(f"  {table:<28} {'presente' if present else 'absente'}")

    for table in TABLES_A_SUPPRIMER:
        cur.execute(f"DROP TABLE IF EXISTS {table}")
    conn.commit()

    print("\nEtat APRES suppression (doit etre 'absente' partout) :")
    tout_absent = True
    for table in TABLES_A_SUPPRIMER:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", (table,))
        present = cur.fetchone() is not None
        tout_absent = tout_absent and not present
        print(f"  {table:<28} {'presente (ERREUR)' if present else 'absente'}")

    print("\nBaseline des tables protegees (doivent etre retrouvees IDENTIQUES apres tous les tests) :")
    baseline = {}
    for table in ("users", "progression_joueur", "favoris"):
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        n = cur.fetchone()[0]
        baseline[table] = n
        print(f"  {table:<20} {n} lignes")

    conn.close()

    print(f"\n{'OK' if tout_absent else 'ECHEC'} : etat prod reproduit sur la copie de test.")
    return tout_absent


if __name__ == "__main__":
    ok = main()
    raise SystemExit(0 if ok else 1)
