"""Nettoie les artefacts de test (copie + backups automatiques generes par
les appels de test a /admin/refresh-encyclopedie). Ne touche a AUCUN
fichier commence par 'dofura.db' (la vraie base locale) ni a rien dans
backups/ (les vrais backups de prod/dev)."""
import glob
import os

fichiers = glob.glob("dofura_test_refresh.db*")
if not fichiers:
    print("Rien a nettoyer.")
for f in fichiers:
    taille = os.path.getsize(f)
    os.remove(f)
    print(f"Supprime : {f} ({taille} octets)")
