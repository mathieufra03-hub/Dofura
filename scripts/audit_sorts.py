import json

with open(r'dofura_sorts.json', encoding='utf-8') as f:
    sorts = json.load(f)

with open(r'dofura_effects.json', encoding='utf-8') as f:
    effets_index = json.load(f)  # dict {id_str: description_fr}

def formater_effet(effet):
    eid = str(effet.get('effectId', ''))
    template = effets_index.get(eid, '')
    if not template:
        return None
    dice_num  = effet.get('diceNum', 0)  or 0
    dice_side = effet.get('diceSide', 0) or 0
    val = str(dice_num) if dice_num == dice_side or dice_side == 0 else f"{dice_num} à {dice_side}"
    texte = template.replace('#1', val).replace('#2', str(dice_side))
    return texte

problemes = []

for sort in sorts:
    nom_sort = sort.get('name', {}).get('fr', '?')
    sort_id = sort.get('id')
    for niveau in sort.get('spellLevels', []):
        for effet in niveau.get('effects', []) + niveau.get('criticalEffects', []):
            texte = formater_effet(effet)
            if texte is None:
                eid = str(effet.get('effectId', ''))
                problemes.append({
                    'sort_id': sort_id,
                    'sort_nom': nom_sort,
                    'effect_id': eid,
                    'diceNum': effet.get('diceNum'),
                    'diceSide': effet.get('diceSide'),
                })

ids_inconnus = {}
for p in problemes:
    eid = p['effect_id']
    if eid not in ids_inconnus:
        ids_inconnus[eid] = {'effect_id': eid, 'nb_sorts': 0, 'exemples': []}
    ids_inconnus[eid]['nb_sorts'] += 1
    if len(ids_inconnus[eid]['exemples']) < 3:
        ids_inconnus[eid]['exemples'].append(f"{p['sort_nom']} ({p['sort_id']})")

rapport = sorted(ids_inconnus.values(), key=lambda x: -x['nb_sorts'])

with open('audit_sorts.json', 'w', encoding='utf-8') as f:
    json.dump(rapport, f, ensure_ascii=False, indent=2)

print(f"{len(problemes)} effets mal formatés")
print(f"{len(rapport)} effect_id inconnus")
print("Rapport : audit_sorts.json")