import json

with open("monstres_session1.json", "r", encoding="utf-8") as f:
    d = json.load(f)

# Trouver le Bouftou
for m in d:
    if m["nom"] == "Bouftou":
        print("=== BOUFTOU DUFFUS ===")
        print("Stats:", m.get("stats"))
        print("Drops:", m.get("drops"))
        print("Sorts:", m.get("sorts"))
        print("Zones:", m.get("zones"))
        break