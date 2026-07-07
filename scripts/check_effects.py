import json

with open('dofura_sorts.json', encoding='utf-8') as f:
    sorts = json.load(f)

ids_cibles = {'792','793','1017','1018','1019','1160','2017','2160','2792','2793'}
trouve = {}

for s in sorts:
    nom = s.get('name', {}).get('fr', '?')
    for niv in s.get('spellLevels', []):
        for e in niv.get('effects', []) + niv.get('criticalEffects', []):
            eid = str(e.get('effectId', ''))
            if eid in ids_cibles:
                if eid not in trouve:
                    trouve[eid] = {'noms': set(), 'exemple_dice': None}
                trouve[eid]['noms'].add(nom)
                if trouve[eid]['exemple_dice'] is None:
                    trouve[eid]['exemple_dice'] = f"diceNum={e.get('diceNum')} diceSide={e.get('diceSide')}"

for k, v in sorted(trouve.items()):
    print(f"effect_id {k} : {len(v['noms'])} sorts — ex: {list(v['noms'])[:2]} — {v['exemple_dice']}")