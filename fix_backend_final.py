path = r'main.py'
with open(path, encoding='utf-8') as f:
    src = f.read()

ancien = '''        "effects": [formater_effet(e) for e in sort.get("effects", [])],
        "critical_effects": [formater_effet(e) for e in sort.get("critical_effects", [])],'''

nouveau = '''        "effects": [f for e in sort.get("effects", []) if (f:=formater_effet(e))["texte"] is not None],
        "critical_effects": [f for e in sort.get("critical_effects", []) if (f:=formater_effet(e))["texte"] is not None],'''

if ancien not in src:
    print("ERREUR — texte non trouvé")
else:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src.replace(ancien, nouveau))
    print("OK — effets null filtrés côté backend")