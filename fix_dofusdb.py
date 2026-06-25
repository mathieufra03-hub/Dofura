import urllib.request
import json
import time

def appel_api(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())

def extraire(m):
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
        drops.append({
            "id": d.get("objectId"),
            "nom": str(d.get("objectId")),
            "pct1": d.get("percentDropForGrade1"),
            "pct2": d.get("percentDropForGrade2"),
            "pct3": d.get("percentDropForGrade3"),
            "pct4": d.get("percentDropForGrade4"),
            "pct5": d.get("percentDropForGrade5"),
            "conditionnel": d.get("hasCriterions", False),
        })
    return {
        "id": m.get("id"),
        "nom": nom_fr,
        "race": race_nom,
        "agression": m.get("aggressiveZoneSize", 0) > 0,
        "est_boss": m.get("isBoss", False),
        "grades": grades,
        "drops": drops,
        "sorts": m.get("spells", []),
        "zones": m.get("subareas", []),
    }

with open("dofusdb_monstres.json", "r", encoding="utf-8") as f:
    monstres = json.load(f)
ids_faits = {m["id"] for m in monstres}

manquants = [8245,8246,8252,8255,8256,8257,8258,8259,8260,8261,8262,8263,8264,8265,8266,8267,8268,8269,8270,8271,8272,8273,8274,8275,8278]

nouveaux = 0
for mid in manquants:
    try:
        data = appel_api(f"https://api.dofusdb.fr/monsters/{mid}?lang=fr")
        monstre = extraire(data)
        monstres.append(monstre)
        nouveaux += 1
        print(f"[+] {monstre['nom']} (ID {mid})")
        time.sleep(0.2)
    except Exception as e:
        print(f"Erreur ID {mid}: {e}")

with open("dofusdb_monstres.json", "w", encoding="utf-8") as f:
    json.dump(monstres, f, ensure_ascii=False, indent=2)

print(f"\nTermine — {len(monstres)} monstres total, {nouveaux} nouveaux")