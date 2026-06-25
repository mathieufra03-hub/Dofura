import urllib.request
import json
import time

def appel_api(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())

# Charger dofusdb pour collecter tous les IDs de zones
with open("dofusdb_monstres.json", "r", encoding="utf-8") as f:
    dofusdb = json.load(f)

# Collecter tous les IDs uniques
ids_zones = set()
for m in dofusdb:
    for z in m.get("zones", []):
        if isinstance(z, int):
            ids_zones.add(z)
        elif isinstance(z, dict):
            ids_zones.add(z.get("id"))

print(f"IDs de zones uniques: {len(ids_zones)}")

# Récupérer les noms
cache_zones = {}
for i, zid in enumerate(sorted(ids_zones), 1):
    if zid is None:
        continue
    try:
        data = appel_api(f"https://api.dofusdb.fr/subareas/{zid}?lang=fr")
        nom = data.get("name", {})
        nom_fr = nom.get("fr") if isinstance(nom, dict) else str(nom)
        cache_zones[zid] = nom_fr
        print(f"[{i}/{len(ids_zones)}] ID {zid}: {nom_fr}")
        time.sleep(0.15)
    except Exception as e:
        print(f"[{i}] ID {zid}: erreur — {e}")
        cache_zones[zid] = None

with open("cache_zones.json", "w", encoding="utf-8") as f:
    json.dump(cache_zones, f, ensure_ascii=False, indent=2)

print(f"\nTermine — {len(cache_zones)} zones dans cache_zones.json")