with open("divergences.json", "r", encoding="utf-8") as f:
    d = json.load(f)

vrais_conflits = []
for m in d:
    diffs_reelles = []
    for diff in m["differences"]:
        if "dofensive=" in diff and "dofusdb=" in diff:
            parties = diff.split("|")
            vals = {}
            for p in parties:
                p = p.strip()
                if "dofensive=" in p:
                    vals["dofensive"] = p.split("dofensive=")[1].split(" ")[0]
                elif "dofusdb=" in p:
                    vals["dofusdb"] = p.split("dofusdb=")[1].split(" ")[0]
            if vals.get("dofensive") != vals.get("dofusdb"):
                diffs_reelles.append(diff)
    if diffs_reelles:
        vrais_conflits.append({"id": m["id"], "nom": m["nom"], "differences": diffs_reelles})

print(f"Vrais conflits dofensive vs dofusdb: {len(vrais_conflits)}")
with open("vrais_conflits.json", "w", encoding="utf-8") as f:
    json.dump(vrais_conflits, f, ensure_ascii=False, indent=2)
print("Sauvegarde dans vrais_conflits.json")