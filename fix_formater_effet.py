path = r'main.py'
with open(path, encoding='utf-8') as f:
    src = f.read()

ancien = '''    desc = re.sub(r'<sprite[^>]*>', '', desc).strip()

    return {
        "texte": desc,
        "valeur": valeur,
        "duration": duration,
        "effect_id": effect_id,
    }'''

nouveau = '''    desc = re.sub(r'<sprite[^>]*>', '', desc).strip()

    # Si la description source était juste '#1', le texte final est un nombre brut — on le masque
    if desc.strip().lstrip('-').isdigit():
        desc = None

    return {
        "texte": desc,
        "valeur": valeur,
        "duration": duration,
        "effect_id": effect_id,
    }'''

if ancien not in src:
    print("ERREUR — texte non trouvé")
else:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src.replace(ancien, nouveau))
    print("OK — formater_effet mis à jour")