import sqlite3
import json

with open("dofura_sorts.json", "r", encoding="utf-8") as f:
    sorts = json.load(f)

# Mapping nom → id dofusdb
nom_to_id = {}
for s in sorts:
    if s.get("nom"):
        nom_to_id[s["nom"].strip().lower()] = s["id"]

print(f"Mapping: {len(nom_to_id)} sorts")

conn = sqlite3.connect("dofura.db")
cur = conn.cursor()

# Ajouter colonne sort_id si elle n'existe pas
try:
    cur.execute("ALTER TABLE sorts ADD COLUMN sort_id INTEGER")
    print("Colonne sort_id ajoutee")
except:
    print("Colonne sort_id existe deja")

# Mettre à jour avec les IDs
cur.execute("SELECT id, nom FROM sorts")
rows = cur.fetchall()

maj = 0
non_trouve = 0
for row_id, nom in rows:
    sid = nom_to_id.get(nom.strip().lower() if nom else "")
    if sid:
        cur.execute("UPDATE sorts SET sort_id = ? WHERE id = ?", (sid, row_id))
        maj += 1
    else:
        non_trouve += 1

conn.commit()
conn.close()
print(f"Mis a jour: {maj} | Non trouvés: {non_trouve}")