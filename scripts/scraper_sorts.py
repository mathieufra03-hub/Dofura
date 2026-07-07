import urllib.request
import json
import time
import os

FICHIER_MONSTRES = "dofura_monstres.json"
FICHIER_SORTS = "dofura_sorts.json"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())

with open(FICHIER_MONSTRES, "r", encoding="utf-8") as f:
    monstres = json.load(f)

ids_sorts = set()
for m in monstres:
    for s in m.get("sorts", []):
        if isinstance(s, dict) and s.get("id"):
            ids_sorts.add(s["id"])
        elif isinstance(s, int):
            ids_sorts.add(s)

ids_sorts = sorted(ids_sorts)
print(f"{len(ids_sorts)} sorts uniques trouves")

if os.path.exists(FICHIER_SORTS):
    with open(FICHIER_SORTS, "r", encoding="utf-8") as f:
        sorts = json.load(f)
    ids_faits = {s["id"] for s in sorts}
else:
    sorts = []
    ids_faits = set()

print(f"Deja scrappe : {len(ids_faits)}")
ids_restants = [i for i in ids_sorts if i not in ids_faits]
print(f"Restants : {len(ids_restants)}")

for i, sort_id in enumerate(ids_restants):
    try:
        spell = fetch(f"https://api.dofusdb.fr/spells/{sort_id}?lang=fr")
        nom_fr = spell.get("name", {}).get("fr", "")
        icon_img = spell.get("img", "")
        spell_levels = spell.get("spellLevels", [])

        details = {}
        if spell_levels:
            level_id = spell_levels[0]
            level = fetch(f"https://api.dofusdb.fr/spell-levels/{level_id}?lang=fr")
            details = {
                "ap_cost": level.get("apCost"),
                "range": level.get("range"),
                "min_range": level.get("minRange"),
                "critical_hit_probability": level.get("criticalHitProbability"),
                "cast_test_los": level.get("castTestLos"),
                "range_can_be_boosted": level.get("rangeCanBeBoosted"),
                "max_cast_per_turn": level.get("maxCastPerTurn"),
                "global_cooldown": level.get("globalCooldown"),
                "effects": level.get("effects", []),
                "critical_effects": level.get("criticalEffect", []),
            }

        sorts.append({
            "id": sort_id,
            "nom": nom_fr,
            "img": icon_img,
            **details
        })

    except Exception as e:
        print(f"  ERREUR sort {sort_id} : {e}")
        sorts.append({"id": sort_id, "nom": "", "img": "", "erreur": str(e)})

    if (i + 1) % 50 == 0:
        with open(FICHIER_SORTS, "w", encoding="utf-8") as f:
            json.dump(sorts, f, ensure_ascii=False, indent=2)
        print(f"  [{i+1}/{len(ids_restants)}] sauvegarde")

    time.sleep(0.15)

with open(FICHIER_SORTS, "w", encoding="utf-8") as f:
    json.dump(sorts, f, ensure_ascii=False, indent=2)

print(f"Termine — {len(sorts)} sorts dans {FICHIER_SORTS}")