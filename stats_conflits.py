import json

with open("divergences.json", "r", encoding="utf-8") as f:
    d = json.load(f)

vrais_conflits = []
for m in d:
    diffs_reelles = []
    for diff in m["differences"]:
        if "dofensive=" in diff and "dofusdb=" in diff:
            try:
                v1 = diff.split("dofensive=")[1].split("|")[0].strip()
                v2 = diff.split("dofusdb=")[1].split("|")[0].strip()
                if v1 != v2:
                    diffs_reelles.append(diff)
            except:
                pass
    if diffs_reelles:
        vrais_conflits.append({"id": m["id"], "nom": m["nom"], "differences": diffs_reelles})

stats = {}
for m in vrais_conflits:
    for diff in m["differences"]:
        cle = diff.split(":")[0].strip()
        stats[cle] = stats.get(cle, 0) + 1

rapport = {
    "total_conflits": len(vrais_conflits),
    "divergences_par_type": dict(sorted(stats.items(), key=lambda x: -x[1])),
    "conflits": vrais_conflits
}

with open("rapport_conflits.json", "w", encoding="utf-8") as f:
    json.dump(rapport, f, ensure_ascii=False, indent=2)

print("Sauvegarde dans rapport_conflits.json")
print("Total:", len(vrais_conflits))
print("Types:", dict(sorted(stats.items(), key=lambda x: -x[1])))