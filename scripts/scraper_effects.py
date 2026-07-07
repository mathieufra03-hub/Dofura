import urllib.request
import json
import time

FICHIER_SORTS = "dofura_sorts.json"
FICHIER_EFFECTS = "dofura_effects.json"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())

with open(FICHIER_SORTS, "r", encoding="utf-8") as f:
    sorts = json.load(f)

effect_ids = set()
for s in sorts:
    for e in s.get("effects", []):
        if e.get("effectId"):
            effect_ids.add(e["effectId"])
    for e in s.get("critical_effects", []):
        if e.get("effectId"):
            effect_ids.add(e["effectId"])

effect_ids = sorted(effect_ids)
print(f"{len(effect_ids)} effects a scrapper")

effects = {}
for i, eid in enumerate(effect_ids):
    try:
        data = fetch(f"https://api.dofusdb.fr/effects/{eid}?lang=fr")
        desc_fr = data.get("description", {}).get("fr", "")
        effects[eid] = {
            "id": eid,
            "description": desc_fr,
            "is_in_percent": data.get("isInPercent", False),
        }
        print(f"  [{i+1}/{len(effect_ids)}] {eid} — {desc_fr[:50]}")
    except Exception as e:
        print(f"  ERREUR {eid} : {e}")
        effects[eid] = {"id": eid, "description": "", "erreur": str(e)}
    time.sleep(0.1)

with open(FICHIER_EFFECTS, "w", encoding="utf-8") as f:
    json.dump(effects, f, ensure_ascii=False, indent=2)

print(f"\nTermine — {len(effects)} effects dans {FICHIER_EFFECTS}")