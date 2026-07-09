"""
Scrape le domaine Zones (chantier Zones, encyclopedie, annuaire a deux
niveaux) : resout chaque sous-zone (le champ "zones"/"nom" deja present
dans dofura_monstres.json, source Duffus, 372 valeurs) vers sa region
DofusDB (subarea -> area), exactement comme scraper_donjons.py le fait
deja pour donjons.zone.

Verifie avant d'ecrire ce script (voir CLAUDE.md, chantier Zones) :
- 371/372 noms de sous-zone correspondent a un nom de subarea DofusDB.
- 1 seul nom ambigu ("Cimetiere", partage par 2 subareas d'aires
  differentes - Amakna et Incarnam) : laisse volontairement sans region
  (pas de choix arbitraire entre les deux, regle "ne jamais inventer").
- 1 seul nom sans aucune correspondance ("Territoire des Dragodindes
  Sauvages") : laisse sans region.
- Les 46 regions obtenues recoupent exactement (100%) les 42 zones deja
  presentes dans donjons.zone (memes noms, meme collection DofusDB).

Ecrit dofura_zones_areas.json (mapping sous-zone -> region, "area": null
si non resolue). Reutilisable (comme scraper_donjons.py) pour rafraichir
apres un patch Ankama.
"""
import urllib.request
import json
import time

FICHIER_SORTIE = "dofura_zones_areas.json"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return json.loads(urllib.request.urlopen(req, timeout=10).read())


def fetch_par_lots(collection, ids, lot=25):
    ids = sorted(ids)
    resultats = {}
    for i in range(0, len(ids), lot):
        paquet = ids[i:i + lot]
        params = "&".join(f"id[$in][]={v}" for v in paquet)
        url = f"https://api.dofusdb.fr/{collection}/?lang=fr&{params}&$limit={len(paquet)}"
        d = fetch(url)
        for r in d.get("data", []):
            resultats[r["id"]] = r
        time.sleep(0.12)
    return resultats


# 1. Sous-zones connues chez nous : extraites directement de
#    dofura_monstres.json (source de verite, pas de dofura.db qui est
#    ephemere - regle 9).
with open("dofura_monstres.json", "r", encoding="utf-8") as f:
    monstres = json.load(f)

noms_sous_zones = set()
for m in monstres:
    for z in m.get("zones", []):
        if z.get("nom"):
            noms_sous_zones.add(z["nom"])

print(f"{len(noms_sous_zones)} sous-zones distinctes dans dofura_monstres.json")

# 2. Toutes les subareas DofusDB (pagination, pas de filtre par ID car on
#    doit matcher par NOM - aucun ID Duffus disponible cote sous-zones).
subareas_bruts = []
skip = 0
while True:
    d = fetch(f"https://api.dofusdb.fr/subareas?lang=fr&$limit=50&$skip={skip}")
    subareas_bruts.extend(d["data"])
    skip += 50
    time.sleep(0.12)
    if skip >= d["total"]:
        break

print(f"{len(subareas_bruts)} subareas recuperees")

subareas_par_nom = {}
for s in subareas_bruts:
    nom = (s.get("name") or {}).get("fr", "")
    if nom:
        subareas_par_nom.setdefault(nom, []).append(s)

# 3. Resoudre chaque sous-zone : 1 seul areaId candidat -> resolue,
#    0 ou plusieurs areaId distincts -> laissee sans region (pas de choix
#    arbitraire sur une ambiguite reelle).
zone_vers_area_id = {}
non_matchees = []
ambigues = []
for nom in noms_sous_zones:
    candidats = subareas_par_nom.get(nom, [])
    if not candidats:
        non_matchees.append(nom)
        continue
    area_ids = {c.get("areaId") for c in candidats if c.get("areaId") is not None}
    if len(area_ids) == 1:
        zone_vers_area_id[nom] = next(iter(area_ids))
    else:
        ambigues.append(nom)

print(f"{len(zone_vers_area_id)} sous-zones resolues vers une area unique")
print(f"{len(non_matchees)} sans correspondance : {non_matchees}")
print(f"{len(ambigues)} ambigues (plusieurs areaId distincts) : {ambigues}")

# 4. Resoudre les noms d'area.
area_ids = set(zone_vers_area_id.values())
areas = fetch_par_lots("areas", area_ids)
print(f"{len(areas)} areas resolues")

# 5. Assembler et ecrire.
resultat = []
for nom in sorted(noms_sous_zones):
    area_id = zone_vers_area_id.get(nom)
    area = areas.get(area_id)
    area_nom = (area.get("name") or {}).get("fr", "") if area else None
    resultat.append({"nom": nom, "area": area_nom})

with open(FICHIER_SORTIE, "w", encoding="utf-8") as f:
    json.dump(resultat, f, ensure_ascii=False, indent=2)

print(f"\nTermine — {len(resultat)} sous-zones ecrites dans {FICHIER_SORTIE}")
