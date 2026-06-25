import json

with open("dofura_monstres.json", encoding="utf-8") as f:
    monstres = json.load(f)

imgs = [m for m in monstres if m.get("image_url")]
for m in imgs[:10]:
    print(f"{m['nom']} -> {m['image_url']}")