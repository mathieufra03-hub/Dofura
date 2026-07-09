"""
Scrape le domaine Donjons (chantier Donjons, encyclopedie) depuis
api.dofusdb.fr/dungeons (187 donjons). Les IDs de boss/monstres
correspondent deja a ceux de dofura_monstres.json (verifie avant
d'ecrire ce script) : aucune resolution de nom necessaire ici, juste
la zone (subarea -> area) qui n'existe pas encore cote Dofura.

Ecrit dofura_donjons.json. Reutilisable (comme scraper_sorts.py,
scraper_items.py) pour rafraichir la donnee apres un patch Ankama.
"""
import urllib.request
import json
import time

FICHIER_SORTIE = "dofura_donjons.json"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return json.loads(urllib.request.urlopen(req, timeout=10).read())

def fetch_par_lots(collection, ids, lot=25):
    """Feathers $in : ndeg curl echoue sans -g a cause des crochets, mais
    urllib n'a pas ce probleme (pas de glob shell). Lots pour rester
    raisonnable sur la longueur d'URL."""
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

# 1. Recuperer tous les donjons (pagination 50/page, plafond deja connu
#    depuis le chantier #7).
donjons_bruts = []
skip = 0
while True:
    d = fetch(f"https://api.dofusdb.fr/dungeons?lang=fr&$limit=50&$skip={skip}")
    donjons_bruts.extend(d["data"])
    skip += 50
    time.sleep(0.12)
    if skip >= d["total"]:
        break

print(f"{len(donjons_bruts)} donjons recuperes")

# 2. Resoudre la zone (subarea -> area) pour chaque donjon.
subarea_ids = {d["subarea"] for d in donjons_bruts if d.get("subarea") is not None}
subareas = fetch_par_lots("subareas", subarea_ids)
print(f"{len(subareas)} subareas resolues")

area_ids = {s["areaId"] for s in subareas.values() if s.get("areaId") is not None}
areas = fetch_par_lots("areas", area_ids)
print(f"{len(areas)} areas resolues")

# 3. Nettoyer et assembler.
donjons = []
for d in donjons_bruts:
    subarea = subareas.get(d.get("subarea"))
    area = areas.get(subarea["areaId"]) if subarea else None
    zone = area["name"]["fr"] if area else None

    boss_ids = d.get("bosses", [])
    monstre_ids = d.get("monsters", [])

    donjons.append({
        "id": d["id"],
        "nom": d.get("name", {}).get("fr", ""),
        "niveau_min": d.get("minLevel", 0),
        "niveau_optimal": d.get("optimalPlayerLevel", 0),
        "difficulte": d.get("difficulty", 0),
        "zone": zone,
        "recherche_groupe": bool(d.get("availableInAutomaticGroupSearch")),
        "disponible_hall": bool(d.get("availableInLobby")),
        "disponible_trousseau": bool(d.get("availableOnKeyring")),
        "boss_ids": boss_ids,
        "monstre_ids": monstre_ids,
        "objets_requis": [
            {"id": o["id"], "quantite": o.get("quantity", 1)}
            for o in d.get("requiredObjects", [])
        ],
    })

sans_zone = [d["nom"] for d in donjons if d["zone"] is None]
print(f"Sans zone resolue : {len(sans_zone)} {sans_zone[:5]}")

with open(FICHIER_SORTIE, "w", encoding="utf-8") as f:
    json.dump(donjons, f, ensure_ascii=False, indent=2)

print(f"\nTermine — {len(donjons)} donjons ecrits dans {FICHIER_SORTIE}")
