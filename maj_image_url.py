import json
import sqlite3

print("Chargement...")
with open("dofura_monstres.json", encoding="utf-8") as f:
    monstres = json.load(f)

conn = sqlite3.connect("dofura.db")
cur = conn.cursor()

# Ajouter la colonne si elle n'existe pas
try:
    cur.execute("ALTER TABLE monstres ADD COLUMN image_url TEXT")
    print("Colonne image_url ajoutée")
except:
    print("Colonne déjà existante")

# Mettre à jour chaque monstre
for m in monstres:
    cur.execute(
        "UPDATE monstres SET image_url = ? WHERE id = ?",
        (m.get("image_url"), m["id"])
    )

conn.commit()
conn.close()
print(f"Terminé ! {len(monstres)} monstres mis à jour.")