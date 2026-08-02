"""
Tache 6e (partie garde/whitelist) : teste _autoriser_operation_refresh() et
_verifier_sql_sans_verbe_destructeur_refresh() directement, sans passer par
le serveur HTTP — ce sont des fonctions pures, testables isolement.

DB_PATH pointe vers la copie de test avant d'importer main (par hygiene :
meme si ces deux fonctions ne touchent aucune base, mieux vaut ne jamais
laisser une importation de main.py risquer de lire dofura.db par defaut).
"""
import os
import sys

# Ce script vit dans scripts/, sys.path[0] pointe donc sur scripts/ et pas
# sur la racine du projet ou vit main.py — meme piege que celui corrige sur
# taux_songes.py (2 aout 2026, "convention scripts/ deplace a la racine").
# Ici pas d'option de deplacer main.py, donc ajout explicite de la racine.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["DB_PATH"] = "dofura_test_refresh.db"

import main

echecs = []


def attendre_ok(table, operation):
    try:
        main._autoriser_operation_refresh(table, operation)
        print(f"  OK (autorise)  : {operation:<7} sur {table}")
    except RuntimeError as e:
        echecs.append(f"{operation} sur {table} : attendu autorise, refuse ({e})")
        print(f"  ECHEC : {operation} sur {table} aurait du etre autorise — {e}")


def attendre_refus(table, operation):
    try:
        main._autoriser_operation_refresh(table, operation)
        echecs.append(f"{operation} sur {table} : attendu refuse, mais AUTORISE")
        print(f"  ECHEC : {operation} sur {table} aurait du etre refuse, ne l'a pas ete")
    except RuntimeError as e:
        print(f"  OK (refuse)    : {operation:<7} sur {table} -> {e}")


print("=== CREATE : autorise sur toutes les tables connues (encyclo + progression) ===")
for table in sorted(main.TABLES_ENCYCLOPEDIQUES_REFRESH):
    attendre_ok(table, "create")
for table in sorted(main.TABLES_INTERDITES_REFRESH):
    attendre_ok(table, "create")

print("\n=== CREATE : refuse sur une table totalement inconnue ===")
attendre_refus("table_qui_n_existe_pas", "create")

print("\n=== FILL : autorise uniquement sur les 3 tables encyclopediques du Suivi de Songes ===")
for table in ("songe_items_trackables", "songe_taux", "songe_boss_modifs"):
    attendre_ok(table, "fill")

print("\n=== FILL : refuse sur users/progression_joueur/favoris ===")
for table in ("users", "progression_joueur", "favoris"):
    attendre_refus(table, "fill")

print("\n=== FILL : refuse sur les 7 tables de progression joueur du tracker Songes ===")
for table in sorted(main.TABLES_INTERDITES_REFRESH - {"users", "progression_joueur", "favoris"}):
    attendre_refus(table, "fill")

print("\n=== FILL : refuse sur une table encyclopedique hors registre (ex. monstres) ===")
# monstres est dans TABLES_ENCYCLOPEDIQUES_REFRESH (whitelist large, copiee
# de TABLES_ENCYCLOPEDIE d'init_db.py) donc FILL dessus est en fait AUTORISE
# par la garde elle-meme (coherent avec la demande : la whitelist porte sur
# TOUTE l'encyclopedie). Seul TABLES_ENDPOINT_CREATE limite en pratique ce
# qui est reellement rempli aujourd'hui (registre des 10 tables manquantes).
attendre_ok("monstres", "fill")

print("\n=== FILL : refuse sur une table totalement inconnue ===")
attendre_refus("table_qui_n_existe_pas", "fill")

print("\n=== Operation inconnue (ni create ni fill) ===")
attendre_refus("songe_taux", "supprimer_tout")

print("\n=== Verification SQL sans verbe destructeur ===")
try:
    main._verifier_sql_sans_verbe_destructeur_refresh("CREATE TABLE IF NOT EXISTS test (id INTEGER)")
    print("  OK (autorise)  : CREATE TABLE normal")
except RuntimeError as e:
    echecs.append(f"CREATE TABLE normal refuse a tort : {e}")
    print(f"  ECHEC : {e}")

for sql_dangereux in [
    "DROP TABLE users",
    "DELETE FROM songe_taux",
    "UPDATE users SET password_hash = 'x'",
]:
    try:
        main._verifier_sql_sans_verbe_destructeur_refresh(sql_dangereux)
        echecs.append(f"SQL dangereux NON detecte : {sql_dangereux!r}")
        print(f"  ECHEC : {sql_dangereux!r} aurait du etre refuse")
    except RuntimeError as e:
        print(f"  OK (refuse)    : {sql_dangereux!r} -> {e}")

print("\n" + "=" * 60)
if echecs:
    print(f"ECHEC(S) : {len(echecs)}")
    for e in echecs:
        print(f"  - {e}")
    raise SystemExit(1)
else:
    print("TOUT OK : garde par operation + verification SQL conformes.")
