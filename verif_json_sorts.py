import json

with open("dofura_monstres.json", "r", encoding="utf-8") as f:
    monstres = json.load(f)

m = [x for x in monstres if x["id"] == 101][0]
print(m["sorts"])