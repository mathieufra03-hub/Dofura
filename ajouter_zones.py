import json

with open("dofura_monstres.json", "r", encoding="utf-8") as f:
    monstres = json.load(f)

with open("dofusdb_monstres.json", "r", encoding="utf-8") as f:
    dofusdb = json.load(f)

db_par_id = {m["id"]: m for m in dofusdb if m.get("id")}

# Trouver 5 monstres positifs sans zones et voir s'ils sont dans dofusdb
sans_zones = [m for m in monstres if not m.get("zones") and isinstance(m.get("id"), int) and m.get("id", 0) > 0]

print(f"Total sans zones positifs: {len(sans_zones)}")
print("\nExemples:")
for m in sans_zones[:10]:
    mid = m.get("id")
    dans_db = mid in db_par_id
    zones_db = db_par_id[mid].get("zones") if dans_db else None
    print(f"  ID {mid} {m['nom']} — dans dofusdb: {dans_db} — zones: {zones_db}")