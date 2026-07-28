import json, urllib.request, time, sqlite3, os

EFFECTS_SPECIAUX = {'792','793','1017','1018','1019','1160','2017','2160','2792','2793','2794','2960'}

# Récupère tous les sort_id de la DB
conn = sqlite3.connect(os.getenv("DB_PATH", "dofura.db"))
cur = conn.cursor()
cur.execute("SELECT DISTINCT sort_id FROM sorts")
sort_ids = [r[0] for r in cur.fetchall()]
conn.close()

print(f"{len(sort_ids)} sorts à analyser...")

dice_to_resolve = set()

for i, sid in enumerate(sort_ids):
    if i % 500 == 0:
        print(f"  {i}/{len(sort_ids)}...")
    url = f"https://api.dofusdb.fr/spell-levels?spellId={sid}&lang=fr&$limit=10"
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        r = urllib.request.urlopen(req, timeout=5)
        d = json.load(r)
        for level in d.get('data', []):
            for effet in level.get('effects', []) + level.get('criticalEffects', []):
                if str(effet.get('effectId','')) in EFFECTS_SPECIAUX:
                    dn = effet.get('diceNum')
                    if dn and dn > 0:
                        dice_to_resolve.add(dn)
    except:
        pass
    time.sleep(0.05)

print(f"\n{len(dice_to_resolve)} diceNum à résoudre: {dice_to_resolve}")

# Résout les noms
resolutions = {}
for dn in dice_to_resolve:
    url = f"https://api.dofusdb.fr/spells/{dn}?lang=fr"
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        r = urllib.request.urlopen(req, timeout=5)
        d = json.load(r)
        nom = d.get('name',{}).get('fr','')
        if nom:
            resolutions[str(dn)] = nom
            print(f"  {dn} → {nom}")
    except:
        pass
    time.sleep(0.1)

with open('dofura_effets_speciaux.json', 'w', encoding='utf-8') as f:
    json.dump(resolutions, f, ensure_ascii=False, indent=2)

print(f"\nTerminé — {len(resolutions)} effets résolus → dofura_effets_speciaux.json")