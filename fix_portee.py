import re

path = r'frontend\src\App.jsx'
with open(path, encoding='utf-8') as f:
    src = f.read()

ancien = "{ label: `Portée ${portee}`, color: C.txt2 },"
nouveau = "{ label: portee === '0' ? 'Corps-à-corps' : `Portée ${portee}`, color: C.txt2 },"

new_src = src.replace(ancien, nouveau)

if new_src == src:
    print("ERREUR — texte non trouvé")
else:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_src)
    print("OK — Portée 0 → Corps-à-corps")