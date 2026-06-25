import json
import urllib.request
import time

print("Chargement de dofura_monstres.json...")
with open("dofura_monstres.json", encoding="utf-8") as f:
    monstres = json.load(f)

total = len(monstres)
modifies = 0
erreurs = 0

for i, monstre in enumerate(monstres):
    monster_id = monstre["id"]
    try:
        url = f"https://api.dofusdb.fr/monsters/{monster_id}?lang=fr"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        r = urllib.request.urlopen(req, timeout=10)
        d = json.loads(r.read())
        if "img" in d:
            monstre["image_url"] = d["img"]
            modifies += 1
        else:
            monstre["image_url"] = None
    except Exception as e:
        monstre["image_url"] = None
        erreurs += 1

    if (i + 1) % 100 == 0:
        print(f"{i+1}/{total} — {modifies} images trouvées, {erreurs} erreurs")
        with open("dofura_monstres.json", "w", encoding="utf-8") as f:
            json.dump(monstres, f, ensure_ascii=False, indent=2)

with open("dofura_monstres.json", "w", encoding="utf-8") as f:
    json.dump(monstres, f, ensure_ascii=False, indent=2)

print(f"Terminé ! {modifies}/{total} images ajoutées.")