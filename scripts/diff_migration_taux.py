"""
Verification automatique de la migration dofura_songes_taux.json v2.0
(etape 3 du plan, 2-3 aout 2026) : compare songe_taux avant/apres
python init_db.py, et confirme qu'aucune table de progression joueur n'a
bouge (nombre de lignes strictement identique).

Usage : python scripts/diff_migration_taux.py <db_avant> <db_apres>
Lance en lecture seule sur les deux bases — ne modifie rien.
"""
import sqlite3
import sys

TABLES_PROGRESSION_JOUEUR = [
    "songe_personnages", "songe_teams", "songe_runs", "songe_run_participants",
    "songe_drops", "songe_journal", "users", "progression_joueur", "favoris",
]


def _conn(path):
    conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def snapshot_songe_taux(conn):
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM songe_taux")
    total = cur.fetchone()[0]

    cur.execute("SELECT intensite, niveau, COUNT(*) FROM songe_taux GROUP BY intensite, niveau")
    par_intensite = {f"{r[0]}_{r[1]}": r[2] for r in cur.fetchall()}

    cur.execute("SELECT cle_taux, COUNT(*) FROM songe_taux GROUP BY cle_taux")
    par_cle = {r[0]: r[1] for r in cur.fetchall()}

    cur.execute("SELECT cle_taux, palier, taux FROM songe_taux WHERE intensite = 'paradoxe' AND niveau = 1")
    paradoxe_1 = {(r[0], r[1]): r[2] for r in cur.fetchall()}

    return {"total": total, "par_intensite": par_intensite, "par_cle": par_cle, "paradoxe_1": paradoxe_1}


def compte_tables_protegees(conn):
    cur = conn.cursor()
    resultat = {}
    for table in TABLES_PROGRESSION_JOUEUR:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        resultat[table] = cur.fetchone()[0]
    return resultat


def main(db_avant, db_apres):
    conn_avant = _conn(db_avant)
    conn_apres = _conn(db_apres)

    print(f"AVANT : {db_avant}")
    print(f"APRES : {db_apres}\n")

    snap_avant = snapshot_songe_taux(conn_avant)
    snap_apres = snapshot_songe_taux(conn_apres)

    print("=== songe_taux : total ===")
    print(f"  avant : {snap_avant['total']}")
    print(f"  apres : {snap_apres['total']}")
    print(f"  ecart : {snap_apres['total'] - snap_avant['total']:+d}\n")

    print("=== songe_taux : par intensite (avant -> apres) ===")
    toutes_intensites = sorted(set(snap_avant["par_intensite"]) | set(snap_apres["par_intensite"]))
    for cle in toutes_intensites:
        a = snap_avant["par_intensite"].get(cle, 0)
        b = snap_apres["par_intensite"].get(cle, 0)
        marque = "" if a == b and a > 0 else "  <-- nouveau" if a == 0 else "  <-- change" if a != b else ""
        print(f"  {cle:<16} {a:>4} -> {b:>4}{marque}")

    print("\n=== songe_taux : par cle_taux (avant -> apres) ===")
    toutes_cles = sorted(set(snap_avant["par_cle"]) | set(snap_apres["par_cle"]))
    for cle in toutes_cles:
        a = snap_avant["par_cle"].get(cle, 0)
        b = snap_apres["par_cle"].get(cle, 0)
        marque = "" if a == b else "  <-- change"
        print(f"  {cle:<28} {a:>4} -> {b:>4}{marque}")

    print("\n=== Paradoxe I : valeurs avant vs apres (cote a cote) ===")
    toutes_p1 = sorted(set(snap_avant["paradoxe_1"]) | set(snap_apres["paradoxe_1"]))
    print(f"  {'cle_taux':<28}{'palier':>7}{'avant':>10}{'apres':>10}{'ecart':>10}")
    for cle_taux, palier in toutes_p1:
        a = snap_avant["paradoxe_1"].get((cle_taux, palier))
        b = snap_apres["paradoxe_1"].get((cle_taux, palier))
        a_s = f"{a}" if a is not None else "absent"
        b_s = f"{b}" if b is not None else "ABSENT"
        ecart = f"{b - a:+.3f}" if (a is not None and b is not None) else "-"
        print(f"  {cle_taux:<28}{palier:>7}{a_s:>10}{b_s:>10}{ecart:>10}")

    print("\n=== Tables de progression joueur : nombre de lignes (doit etre IDENTIQUE) ===")
    compte_avant = compte_tables_protegees(conn_avant)
    compte_apres = compte_tables_protegees(conn_apres)
    tout_identique = True
    for table in TABLES_PROGRESSION_JOUEUR:
        a = compte_avant[table]
        b = compte_apres[table]
        ok = a == b
        tout_identique = tout_identique and ok
        print(f"  {table:<24} {a:>6} -> {b:>6}   {'OK' if ok else 'DIFFERENCE !!!'}")

    conn_avant.close()
    conn_apres.close()

    print()
    if tout_identique:
        print("Toutes les tables de progression joueur sont IDENTIQUES avant/apres.")
    else:
        print("ATTENTION : au moins une table de progression joueur a change — investiguer avant de continuer.")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage : python scripts/diff_migration_taux.py <db_avant> <db_apres>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
