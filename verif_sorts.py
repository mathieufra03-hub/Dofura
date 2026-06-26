import json

with open("dofura_sorts.json", "r", encoding="utf-8") as f:
    sorts = json.load(f)

# Collecter tous les effectIds uniques
effect_ids = set()
for s in sorts:
    for e in s.get("effects", []):
        if e.get("effectId"):
            effect_ids.add(e["effectId"])desc 
    for e in s.get("critical_effects", []):
        if e.get("effectId"):
            effect_ids.add(e["effectId"])

print(f"effectIds uniques : {len(effect_ids)}")
print(f"Exemples : {sorted(effect_ids)[:20]}")