import json

sorts = json.load(open("dofura_sorts.json", encoding="utf-8"))

s = next((x for x in sorts if x["nom"] == "Bêlement"), None)

with open("belement.json", "w", encoding="utf-8") as f:
    json.dump(s, f, indent=2, ensure_ascii=False)

print("OK - ouvre belement.json")