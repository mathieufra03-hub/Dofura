import urllib.request
import urllib.error
import json
import os
import time

FICHIER_URLS = "dofensive_urls.json"
FICHIER_SORTIE = "dofensive_monstres.json"
SAUVEGARDE_TOUS_LES = 100

def extraire_id(url):
    return url.rstrip("/").split("/")[-1]

def scraper_monstre(monster_id):
    url = f"https://cdn.api.dofensive.com/dofus2/bestiary/monsters/{monster_id}?lang=fr"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, timeout=10)
    data = json.loads(resp.read())
    if not data.get("Data"):
        return None
    m = data["Data"][0]

    # Grades (stats par niveau)
    grades = []
    for g in m.get("Grades", []):
        pc = g.get("PrimaryCharacteristics", {})
        res = g.get("Resistances", {})
        grades.append({
            "grade": g["Id"],
            "niveau": g["Level"],
            "pv": pc.get("LifePoints"),
            "pa": g.get("ActionPoints"),
            "pm": g.get("MovementPoints"),
            "force": pc.get("Strength"),
            "intelligence": pc.get("Intelligence"),
            "chance": pc.get("Chance"),
            "agilite": pc.get("Agility"),
            "sagesse": pc.get("Wisdom"),
            "esquive_pa": g.get("ApDodge"),
            "esquive_pm": g.get("MpDodge"),
            "res_neutre": res.get("Neutral"),
            "res_terre": res.get("Earth"),
            "res_feu": res.get("Fire"),
            "res_eau": res.get("Water"),
            "res_air": res.get("Air"),
            "xp": g.get("Experience"),
        })

    # Drops
    drops = []
    for d in m.get("Drops", []):
        prob = d.get("ProbabilityByGrades", {})
        drops.append({
            "id": d["Id"],
            "nom": d["Name"],
            "pourcentage": prob.get("1"),
            "conditionnel": d.get("IsConditional", False),
        })

    # Sorts
    sorts = [{"id": s["Id"], "nom": s["Name"]} for s in m.get("Spells", [])]

    # Zones
    zones = [{"id": z["Id"], "nom": z["Name"], "favorite": z.get("IsFavorite")} for z in m.get("Subareas", [])]

    return {
        "id": m["Id"],
        "nom": m["Name"],
        "race": m.get("Race", {}).get("Name") if isinstance(m.get("Race"), dict) else m.get("Race"),
        "famille": m.get("Family", {}).get("Name") if isinstance(m.get("Family"), dict) else m.get("Family"),
        "agression": m.get("Aggression"),
        "grades": grades,
        "drops": drops,
        "sorts": sorts,
        "zones": zones,
    }

# Chargement URLs
with open(FICHIER_URLS, "r", encoding="utf-8") as f:
    toutes_urls = json.load(f)

# Reprise
if os.path.exists(FICHIER_SORTIE):
    with open(FICHIER_SORTIE, "r", encoding="utf-8") as f:
        monstres = json.load(f)
    ids_faits = {str(m["id"]) for m in monstres}
    print(f"Reprise — {len(monstres)} monstres déjà scraped")
else:
    monstres = []
    ids_faits = set()

urls_restantes = [u for u in toutes_urls if extraire_id(u) not in ids_faits]
print(f"{len(urls_restantes)} monstres restants")

for i, url in enumerate(urls_restantes, 1):
    monster_id = extraire_id(url)
    try:
        monstre = scraper_monstre(monster_id)
        if monstre:
            monstres.append(monstre)
            print(f"[{i}/{len(urls_restantes)}] {monstre['nom']} (grade 1: niv {monstre['grades'][0]['niveau'] if monstre['grades'] else '?'})")
        else:
            print(f"[{i}] ID {monster_id} — pas de données")

        if i % SAUVEGARDE_TOUS_LES == 0:
            with open(FICHIER_SORTIE, "w", encoding="utf-8") as f:
                json.dump(monstres, f, ensure_ascii=False, indent=2)
            print(f"  → Sauvegarde auto ({len(monstres)} total)")

        time.sleep(0.2)

    except Exception as e:
        print(f"[{i}] Erreur {monster_id}: {e}")
        continue

with open(FICHIER_SORTIE, "w", encoding="utf-8") as f:
    json.dump(monstres, f, ensure_ascii=False, indent=2)

print(f"\nTerminé — {len(monstres)} monstres dans {FICHIER_SORTIE}")