"""
Etape 4c (verification endpoints, 3 aout 2026) : verifie que chaque cle_taux
utilise cote "items" (songe_items_trackables + RUNES_HORS_TRACKER de main.py)
trouve bien sa correspondance dans songe_taux, et inversement.

Risque cible : un mauvais mapping ne leve AUCUNE erreur (charger_taux()
renvoie juste un dict vide pour un cle_taux introuvable) — un item afficherait
alors silencieusement "—" partout, ou un rune_hors_tracker disparaitrait de la
page sans un seul warning. Ce script rend visible ce que le code laisse
silencieux.

Lecture seule sur dofura.db. N'importe main.py juste pour RUNES_HORS_TRACKER
(sans danger : uvicorn.run() est protege par if __name__ == "__main__").
"""
import sqlite3
import sys

sys.path.insert(0, ".")
from main import RUNES_HORS_TRACKER

conn = sqlite3.connect("file:dofura.db?mode=ro", uri=True)
cur = conn.cursor()

cur.execute("SELECT DISTINCT cle_taux FROM songe_items_trackables")
cles_trackables = {r[0] for r in cur.fetchall()}

cur.execute("SELECT DISTINCT cle_taux FROM songe_taux")
cles_taux = {r[0] for r in cur.fetchall()}

cles_runes_hors_tracker = set(RUNES_HORS_TRACKER.keys())

# Toutes les cle_taux effectivement demandees par le code (items trackes +
# runes hors tracker), cote "consommateur".
cles_demandees = cles_trackables | cles_runes_hors_tracker

print(f"cle_taux dans songe_items_trackables : {sorted(cles_trackables)}")
print(f"cle_taux dans RUNES_HORS_TRACKER (main.py) : {sorted(cles_runes_hors_tracker)}")
print(f"cle_taux presentes dans songe_taux : {sorted(cles_taux)}")
print()

orphelins_demande_sans_donnee = cles_demandees - cles_taux
orphelins_donnee_sans_demande = cles_taux - cles_demandees

print("=== Orphelins : demandes par le code mais ABSENTES de songe_taux ===")
print("(risque n1 : taux 'null'/absent silencieux pour ces items)")
if orphelins_demande_sans_donnee:
    for cle in sorted(orphelins_demande_sans_donnee):
        source = []
        if cle in cles_trackables:
            source.append("songe_items_trackables")
        if cle in cles_runes_hors_tracker:
            source.append("RUNES_HORS_TRACKER")
        print(f"  {cle}  (source : {', '.join(source)})")
else:
    print("  AUCUN — toutes les cle_taux demandees ont une correspondance.")

print("\n=== Orphelins : presentes dans songe_taux mais JAMAIS demandees ===")
print("(sans danger — juste des donnees inutilisees)")
if orphelins_donnee_sans_demande:
    for cle in sorted(orphelins_donnee_sans_demande):
        print(f"  {cle}")
else:
    print("  AUCUN — toutes les cle_taux de songe_taux sont utilisees.")

print("\n=== Verification supplementaire : rune_astrale_legendaire ===")
print("(doit venir de songe_items_trackables SEUL, PAS de RUNES_HORS_TRACKER —")
print(" sinon duplication dans le tableau /songes/taux, piege documente en dur")
print(" dans le commentaire de RUNES_HORS_TRACKER)")
if "rune_astrale_legendaire" in cles_trackables and "rune_astrale_legendaire" not in cles_runes_hors_tracker:
    print("  OK : present dans trackables, absent de RUNES_HORS_TRACKER.")
else:
    print(f"  ANOMALIE : dans trackables={('rune_astrale_legendaire' in cles_trackables)}, "
          f"dans RUNES_HORS_TRACKER={('rune_astrale_legendaire' in cles_runes_hors_tracker)}")

conn.close()

if orphelins_demande_sans_donnee:
    print("\nECHEC : au moins une cle_taux demandee n'a pas de donnee en base.")
    sys.exit(1)
else:
    print("\nOK : jointure complete, aucun orphelin cote demande.")
