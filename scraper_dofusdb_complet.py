import urllib.request
import json
import os
import time

FICHIER_SORTIE = "dofusdb_monstres.json"
SAUVEGARDE_TOUS_LES = 100
LIMIT = 100

def appel_api(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())

def get_nom_item(item_id, cache_items):
    if item_id in cache_items:
        return cache_items[item_id]
    try:
        data = appel_api(f"https://api.dofusdb.fr/items/{item_id}?lang=fr")
        nom = data.get("name", {})
        nom_fr = nom.get("fr") if isinstance(nom, dict) else str(nom)
        cache_items[item_id] = nom_fr
        time.sleep(0.1)
        return nom_fr
    except:
        return str(item_id)

def extraire_monstre(m, cache_items):
    nom = m.get("name", {})
    nom_fr = nom.get("fr") if isinstance(nom, dict) else str(nom)
    race = m.get("race", {})
    race_nom = race.get("name", {}).get("fr") if isinstance(race, dict) else None
    grades = []
    for g in m.get("grades", []):
        grades.append({
            "grade": g.get("grade"),
            "niveau": g.get("level"),
            "pv": g.get("lifePoints"),
            "pa": g.get("actionPoints"),
            "pm": g.get("movementPoints"),
            "force": g.get("strength"),
            "intelligence": g.get("intelligence"),
            "chance": g.get("chance"),
            "agilite": g.get("agility"),
            "sagesse": g.get("wisdom"),
            "esquive_pa": g.get("paDodge"),
            "esquive_pm": g.get("pmDodge"),
            "res_neutre": g.get("neutralResistance"),
            "res_terre": g.get("earthResistance"),
            "res_feu": g.get("fireResistance"),
            "res_eau": g.get("waterResistance"),
            "res_air": g.get("airResistance"),
            "xp": g.get("gradeXp"),
        })
    drops = []
    for d in m.get("drops", []):
        item_id = d.get("objectId")
        nom_item = get_nom_item(item_id, cache_items)
        drops.append({
            "id": item_id,
            "nom": nom_item,
            "pourcentage_grade1": d.get("percentDropForGrade1"),
            "pourcentage_grade2": d.get("percentDropForGrade2"),
            "pourcentage_grade3": d.get("percentDropForGrade3"),
            "pourcentage_grade4": d.get("percentDropForGrade4"),
            "pourcentage_grade5": d.get("percentDropForGrade5"),
            "conditionnel": d.get("hasCriterions", False),
        })
    sorts = m.get("spells", [])
    zones = m.get("subareas", [])
    return {
        "id": m.get("id"),
        "nom": nom_fr,
        "race": race_nom,
        "agression": m.get("aggressiveZoneSize", 0) > 0,
        "est_boss": m.get("isBoss", False),
        "grades": grades,
        "drops": drops,
        "sorts": sorts,
        "zones": zones,
    }

if os.path.exists(FICHIER_SORTIE):
    with open(FICHIER_SORTIE, "r", encoding="utf-8") as f:
        monstres = json.load(f)
    ids_faits = {m["id"] for m in monstres}
    print(f"Reprise — {len(monstres)} monstres deja scraped")
else:
    monstres = []
    ids_faits = set()

cache_items = {}
skip = 0
total = None
i = 0

while total is None or skip < total:
    try:
        url = f"https://api.dofusdb.fr/monsters?lang=fr&$limit={LIMIT}&$skip={skip}"
        data = appel_api(url)
        total = data["total"]
        liste = data["data"]
        if not liste:
            break
        for m in liste:
            monster_id = m.get("id")
            if monster_id not in ids_faits:
                monstre = extraire_monstre(m, cache_items)
                monstres.append(monstre)
                ids_faits.add(monster_id)
                i += 1
                print(f"[{i}] {monstre['nom']} (ID {monster_id})")
                if i % SAUVEGARDE_TOUS_LES == 0:
                    with open(FICHIER_SORTIE, "w", encoding="utf-8") as f:
                        json.dump(monstres, f, ensure_ascii=False, indent=2)
                    print(f"  -> Sauvegarde auto ({len(monstres)} total)")
        skip += LIMIT
        time.sleep(0.3)
    except Exception as e:
        print(f"Erreur skip={skip}: {e}")
        time.sleep(2)
        continue

with open(FICHIER_SORTIE, "w", encoding="utf-8") as f:
    json.dump(monstres, f, ensure_ascii=False, indent=2)

print(f"\nTermine — {len(monstres)} monstres dans {FICHIER_SORTIE}")