import json

with open("dofura_sorts.json", "r", encoding="utf-8") as f:
    sorts = json.load(f)

s = next((x for x in sorts if x["id"] == 8703), None)
if s:
    print("Trouvé:", s["id"], s.get("nom"))
else:
    print("Non trouvé")

print("Total sorts:", len(sorts))
print("IDs autour de 8703:", [x["id"] for x in sorts if 8700 <= x["id"] <= 8710])