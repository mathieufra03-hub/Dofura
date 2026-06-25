import json

with open("dofensive_monstres.json", "r", encoding="utf-8") as f:
    dofensive = json.load(f)
with open("dofusdb_monstres.json", "r", encoding="utf-8") as f:
    dofusdb = json.load(f)
with open("monstres_session1.json", "r", encoding="utf-8") as f:
    duffus = json.load(f)

# Index par ID
def index_par_id(liste):
    return {m["id"]: m for m in liste if m.get("id")}

# Index par nom normalisé
def normaliser(nom):
    return nom.lower().strip() if nom else ""

def index_par_nom(liste, champ_nom="nom"):
    return {normaliser(m.get(champ_nom, "")): m for m in liste}

dof = index_par_id(dofensive)
db = index_par_id(dofusdb)
duf_par_nom = index_par_nom(duffus)
dof_par_nom = index_par_nom(dofensive)
db_par_nom = index_par_nom(dofusdb)

print(f"Dofensive : {len(dof)} monstres")
print(f"DofusDB   : {len(db)} monstres")
print(f"Duffus    : {len(duffus)} monstres")

communs_id = set(dof.keys()) & set(db.keys())
print(f"\nMonstres communs dofensive+dofusdb (par ID) : {len(communs_id)}")

noms_duf = set(duf_par_nom.keys())
noms_dof = set(dof_par_nom.keys())
noms_db = set(db_par_nom.keys())
print(f"Monstres communs dofensive+duffus (par nom) : {len(noms_dof & noms_duf)}")
print(f"Monstres communs dofusdb+duffus (par nom)   : {len(noms_db & noms_duf)}")
print(f"Monstres communs tous 3 (par nom)           : {len(noms_dof & noms_db & noms_duf)}")

divergences = []

for mid in communs_id:
    m1 = dof[mid]
    m2 = db[mid]
    nom = m1.get("nom", "")
    nom_norm = normaliser(nom)
    m3 = duf_par_nom.get(nom_norm)

    diff = {"id": mid, "nom": nom, "differences": []}

    # Grade 1
    g1 = m1.get("grades", [{}])[0] if m1.get("grades") else {}
    g2 = m2.get("grades", [{}])[0] if m2.get("grades") else {}

    # Stats duffus
    stats3 = m3.get("stats", {}) if m3 else {}

    for stat, cle_duf in [
        ("pv", "PV"), ("pa", "PA"), ("pm", "PM"),
        ("force", "Force"), ("intelligence", "Intelligence"),
        ("chance", "Chance"), ("agilite", "Agilité"),
        ("sagesse", "Sagesse"), ("xp", "XP")
    ]:
        v1 = g1.get(stat)
        v2 = g2.get(stat)
        v3 = stats3.get(cle_duf) if m3 else None

        valeurs = {}
        if v1 is not None:
            valeurs["dofensive"] = v1
        if v2 is not None:
            valeurs["dofusdb"] = v2
        if v3 is not None:
            try:
                valeurs["duffus"] = float(str(v3).replace(",", "."))
            except:
                pass

        vals = list(valeurs.values())
        if len(set(vals)) > 1:
            detail = " | ".join(f"{k}={v}" for k, v in valeurs.items())
            diff["differences"].append(f"{stat.upper()}: {detail}")

    # Resistances
    for res, cle_duf in [
        ("res_neutre", "Résistance Neutre %"),
        ("res_terre", "Résistance Terre %"),
        ("res_feu", "Résistance Feu %"),
        ("res_eau", "Résistance Eau %"),
        ("res_air", "Résistance Air %"),
    ]:
        v1 = g1.get(res)
        v2 = g2.get(res)
        if v1 is not None and v2 is not None and v1 != v2:
            diff["differences"].append(f"{res.upper()}: dofensive={v1} | dofusdb={v2}")

    # Drops dofensive vs dofusdb
    drops1 = {d["nom"]: d.get("pourcentage") for d in m1.get("drops", []) if not d.get("conditionnel")}
    drops2 = {d["nom"]: d.get("pct1") for d in m2.get("drops", []) if not d.get("conditionnel")}
    for nom_drop, pct1 in drops1.items():
        if nom_drop in drops2:
            pct2 = drops2[nom_drop]
            if pct1 is not None and pct2 is not None:
                try:
                    if abs(float(pct1) - float(pct2)) > 0.1:
                        diff["differences"].append(f"DROP '{nom_drop}': dofensive={pct1}% | dofusdb={pct2}%")
                except:
                    pass

    if diff["differences"]:
        divergences.append(diff)

print(f"\nMonstres avec divergences : {len(divergences)}")
print("\n=== EXEMPLES (20 premiers) ===")
for d in divergences[:20]:
    print(f"\n[ID {d['id']}] {d['nom']}")
    for diff in d["differences"]:
        print(f"  -> {diff}")

with open("divergences.json", "w", encoding="utf-8") as f:
    json.dump(divergences, f, ensure_ascii=False, indent=2)
print(f"\nSauvegarde dans divergences.json")