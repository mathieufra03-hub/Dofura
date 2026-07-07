import json, urllib.request, time

with open('dofura_effects.json', encoding='utf-8') as f:
    effects = json.load(f)

# Trouve tous les effect_id avec description='#1'
ids_speciaux = [k for k,v in effects.items() if isinstance(v,dict) and v.get('description','') == '#1']
print(f"{len(ids_speciaux)} effets spéciaux à résoudre: {ids_speciaux}")

# Pour chaque sort dans dofura_sorts.json, trouve les diceNum associés à ces effect_id
with open('dofura_sorts.json', encoding='utf-8') as f:
    sorts = json.load(f)

# dofura_sorts.json format: [{'id','nom','img','erreur'}] — pas les spellLevels
# Donc on va directement sur l'API pour les diceNum qu'on a vus
# On sait que 6168, 6075 sont des IDs de sorts — on les résout via api.dofusdb.fr/spells/{id}

dice_nums_speciaux = set()
# Relit main.py pour trouver les diceNum problématiques via la DB
import sqlite3
conn = sqlite3.connect('dofura.db')
cur = conn.cursor()
cur.execute("SELECT DISTINCT sort_id FROM sorts")
sort_ids = [r[0] for r in cur.fetchall()]
conn.close()

print(f"{len(sort_ids)} sorts dans la DB")

# Map diceNum -> nom FR pour les effets spéciaux
resolutions = {}

# On va chercher le nom de chaque sort_id via l'API dofusdb
# et stocker dans un fichier de résolution
resolus = 0
for sid in sort_ids[:20]:  # test sur 20 d'abord
    url = f"https://api.dofusdb.fr/spells/{sid}?lang=fr"
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        r = urllib.request.urlopen(req, timeout=5)
        d = json.load(r)
        nom = d.get('name',{}).get('fr','')
        if nom:
            resolutions[str(sid)] = nom
            resolus += 1
    except:
        pass
    time.sleep(0.1)

print(f"Résolus: {resolus}/20")
print(list(resolutions.items())[:5])