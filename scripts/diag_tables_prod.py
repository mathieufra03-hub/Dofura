"""
Diagnostic (3 aout 2026, tache 4) : /songes/taux renvoie 500 en prod avec
"no such table: songe_items_trackables". Cause probable : base_deja_peuplee()
(main.py) court-circuite init_db.py des que 'monstres' contient des lignes —
toute table encyclopedique ajoutee APRES la premiere creation de la base prod
n'a donc jamais ete creee, meme aux deploiements suivants.

Ce script compare les tables attendues par le schema ACTUEL de init_db.py
avec celles reellement presentes dans un backup de la base de prod (ouvert
en LECTURE SEULE, mode=ro — jamais d'ecriture, jamais la vraie prod).

Usage : python scripts/diag_tables_prod.py [chemin_backup]
Par defaut, pointe sur le backup du 2 aout 2026 range en tache 1.
"""
import re
import sqlite3
import sys

BACKUP_PAR_DEFAUT = "backups/dofura_2026-08-02_2044_avant_fix_tables_manquantes.db"

# Reprises depuis init_db.py — tables ENCYCLOPEDIQUES (DROP+CREATE, TABLES_ENCYCLOPEDIE)
# vs tables de PROGRESSION JOUEUR (CREATE TABLE IF NOT EXISTS, jamais de DROP).
TABLES_ENCYCLOPEDIQUES = {
    "monstres", "grades", "drops", "sorts", "zones", "objets", "objets_effets",
    "recettes", "panoplies", "panoplies_effets", "donjons", "donjons_monstres",
    "donjons_objets_requis", "zones_areas", "quetes", "quetes_etapes",
    "quetes_etapes_items", "quetes_etapes_actions", "quetes_ressources",
    "quetes_prerequis_quetes", "quetes_prerequis_objets", "quetes_donjons",
    "succes", "succes_objectifs", "succes_recompenses_items", "succes_donjons",
    "songe_items_trackables", "songe_taux", "songe_boss_modifs",
}
TABLES_PROGRESSION_JOUEUR = {
    "users", "progression_joueur", "favoris",
    "songe_personnages", "songe_teams", "songe_team_membres", "songe_runs",
    "songe_run_participants", "songe_drops", "songe_journal",
}


def tables_attendues_par_init_db():
    """Extrait tous les noms de table de chaque CREATE TABLE (avec ou sans
    IF NOT EXISTS) directement depuis le texte source de init_db.py — pas de
    liste recopiee a la main, pour ne jamais desynchroniser ce diagnostic du
    vrai schema si init_db.py change plus tard.

    Lignes de commentaire ('#') exclues avant la recherche : sinon des
    phrases comme "CREATE TABLE IF NOT EXISTS UNIQUEMENT — jamais de DROP"
    (commentaire, pas du SQL) font capturer "UNIQUEMENT"/"IF" comme de faux
    noms de table."""
    lignes_code = [
        l for l in open("init_db.py", encoding="utf-8") if not l.strip().startswith("#")
    ]
    texte = "".join(lignes_code)
    return set(re.findall(r"CREATE TABLE(?: IF NOT EXISTS)? (\w+)", texte))


def tables_et_comptes_prod(chemin_backup):
    """Lecture seule stricte (mode=ro) : {nom_table: nombre_de_lignes}."""
    conn = sqlite3.connect(f"file:{chemin_backup}?mode=ro", uri=True)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' ORDER BY name")
    noms = [r[0] for r in cur.fetchall()]
    comptes = {}
    for nom in noms:
        cur.execute(f"SELECT COUNT(*) FROM {nom}")
        comptes[nom] = cur.fetchone()[0]
    conn.close()
    return comptes


def categorie(nom_table):
    if nom_table in TABLES_ENCYCLOPEDIQUES:
        return "encyclopedique"
    if nom_table in TABLES_PROGRESSION_JOUEUR:
        return "progression joueur"
    return "INCONNUE (ni encyclo ni progression — a investiguer)"


def main(chemin_backup):
    attendues = tables_attendues_par_init_db()
    print(f"{len(attendues)} tables attendues par le schema actuel de init_db.py")
    print(f"  dont {len(TABLES_ENCYCLOPEDIQUES)} encyclopediques, {len(TABLES_PROGRESSION_JOUEUR)} de progression joueur")
    non_classees = attendues - TABLES_ENCYCLOPEDIQUES - TABLES_PROGRESSION_JOUEUR
    if non_classees:
        print(f"  ATTENTION : {len(non_classees)} table(s) attendue(s) mais non classee(s) dans ce script : {sorted(non_classees)}")

    comptes_prod = tables_et_comptes_prod(chemin_backup)
    print(f"\n{len(comptes_prod)} tables reellement presentes en prod (backup {chemin_backup}, lecture seule)\n")

    manquantes = sorted(attendues - set(comptes_prod))
    en_trop = sorted(set(comptes_prod) - attendues)

    print("=== Tables PRESENTES en prod, avec leur nombre de lignes ===")
    print(f"{'table':<32}{'categorie':<22}{'lignes':>8}")
    for nom in sorted(comptes_prod):
        vide = "  <-- VIDE" if comptes_prod[nom] == 0 else ""
        print(f"{nom:<32}{categorie(nom):<22}{comptes_prod[nom]:>8}{vide}")

    print(f"\n=== Tables MANQUANTES en prod ({len(manquantes)}) ===")
    if manquantes:
        for nom in manquantes:
            print(f"  {nom:<32}{categorie(nom)}")
    else:
        print("  Aucune.")

    print(f"\n=== Tables en prod mais plus attendues par le schema actuel ({len(en_trop)}) ===")
    if en_trop:
        for nom in en_trop:
            print(f"  {nom}")
    else:
        print("  Aucune.")

    print("\n=== Verification cible : tables de progression joueur ===")
    manquantes_progression = [t for t in manquantes if t in TABLES_PROGRESSION_JOUEUR]
    if manquantes_progression:
        print(f"  ALERTE : {manquantes_progression} — table(s) de progression joueur manquante(s) en prod !")
    else:
        print("  OK : aucune table de progression joueur manquante (toutes presentes, avec leur nombre de lignes ci-dessus).")


if __name__ == "__main__":
    chemin = sys.argv[1] if len(sys.argv) > 1 else BACKUP_PAR_DEFAUT
    main(chemin)
