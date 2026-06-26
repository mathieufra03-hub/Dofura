import re

path = r"C:\Users\mathi\Documents\dofura\main.py"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = '''        "max_cast_per_turn": sort.get("max_cast_per_turn"),
        "global_cooldown": sort.get("global_cooldown"),
        "effects": [formater_effet(e) for e in sort.get("effects", [])],
        "critical_effects": [formater_effet(e) for e in sort.get("critical_effects", [])],
    }'''

new = '''        "max_cast_per_turn": sort.get("max_cast_per_turn"),
        "max_cast_per_target": sort.get("max_cast_per_target"),
        "max_global_cast_per_turn": sort.get("max_global_cast_per_turn"),
        "min_cast_interval": sort.get("min_cast_interval"),
        "initial_cooldown": sort.get("initial_cooldown"),
        "global_cooldown": sort.get("global_cooldown"),
        "cast_in_line": sort.get("cast_in_line"),
        "cast_in_diagonal": sort.get("cast_in_diagonal"),
        "effects": [formater_effet(e) for e in sort.get("effects", [])],
        "critical_effects": [formater_effet(e) for e in sort.get("critical_effects", [])],
    }'''

if old in content:
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK — main.py mis à jour")
else:
    print("ERREUR — texte non trouvé, vérifie main.py")