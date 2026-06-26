import json

with open("dofura_effects.json", "r", encoding="utf-8") as f:
    effects = json.load(f)

print("=== 20 premiers effets ===")
for eid, e in list(effects.items())[:20]:
    print(f"  {eid} — {e['description']}")