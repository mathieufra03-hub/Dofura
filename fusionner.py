import json
import re

def normaliser(nom):
    return nom.lower().strip() if nom else ""

def nettoyer_pct(taux):
    if not taux:
        return None
    taux = str(taux).replace("%", "").replace(",", ".").strip()
    # Gérer les fourchettes comme "1%-20%"
    if "-" in taux or "\u2013" in taux:
        taux = taux.replace("\u2013", "-")
        parties = taux.split("-")
        try:
            return (float(parties[0]) + float(parties[1])) / 2
        except:
            return None
    try:
        return float(taux)
    except:
        return None

def nettoyer_stat(val):
    if val is None:
        return None
    val = str(val).replace("\u202f", "").replace(" ", "").replace("XP", "").replace(",", ".")
    try:
        return float(val)
    except:
        return None

# Chargement
with open("dofensive_monstres.json", "r", encoding="utf-8") as f:
    dofensive = json.load(f)
with open("dofusdb_monstres.json", "r", encoding="utf-8") as f:
    dofusdb = json.load(f)
with open("monstres_session1.json", "r", encoding="utf-8") as f:
    duffus = json.load(f)

print(f"Dofensive: {len(dofensive)} | DofusDB: {len(dofusdb)} | Duffus: {len(duffus)}")

# Index
db_par_id = {m["id"]: m for m in dofusdb if m.get("id")}
duf_par_nom = {normaliser(m["nom"]): m for m in duffus}

monstres_fusionnes = []

for m in dofensive:
    mid = m.get("id")
    nom = m.get("nom", "")
    nom_norm = normaliser(nom)

    m_db = db_par_id.get(mid)
    m_duf = duf_par_nom.get(nom_norm)

    # Grades depuis dofensive (source principale)
    grades = []
    for g in m.get("grades", []):
        grades.append({
            "grade": g.get("grade"),
            "niveau": g.get("niveau"),
            "pv": g.get("pv"),
            "pa": g.get("pa"),
            "pm": g.get("pm"),
            "force": g.get("force"),
            "intelligence": g.get("intelligence"),
            "chance": g.get("chance"),
            "agilite": g.get("agilite"),
            "sagesse": g.get("sagesse"),
            "esquive_pa": g.get("esquive_pa"),
            "esquive_pm": g.get("esquive_pm"),
            "res_neutre": g.get("res_neutre"),
            "res_terre": g.get("res_terre"),
            "res_feu": g.get("res_feu"),
            "res_eau": g.get("res_eau"),
            "res_air": g.get("res_air"),
            "xp": g.get("xp"),
        })

    # Si pas de grades dans dofensive, prendre dofusdb
    if not grades and m_db:
        for g in m_db.get("grades", []):
            grades.append({
                "grade": g.get("grade"),
                "niveau": g.get("niveau"),
                "pv": g.get("pv"),
                "pa": g.get("pa"),
                "pm": g.get("pm"),
                "force": g.get("force"),
                "intelligence": g.get("intelligence"),
                "chance": g.get("chance"),
                "agilite": g.get("agilite"),
                "sagesse": g.get("sagesse"),
                "esquive_pa": g.get("esquive_pa"),
                "esquive_pm": g.get("esquive_pm"),
                "res_neutre": g.get("res_neutre"),
                "res_terre": g.get("res_terre"),
                "res_feu": g.get("res_feu"),
                "res_eau": g.get("res_eau"),
                "res_air": g.get("res_air"),
                "xp": g.get("xp"),
            })

    # Drops — dofensive en priorité
    drops = []
    drops_dof = {d["nom"]: d for d in m.get("drops", []) if not d.get("conditionnel")}
    
    if drops_dof:
        for nom_drop, d in drops_dof.items():
            drops.append({
                "nom": nom_drop,
                "pourcentage": d.get("pourcentage"),
                "source": "dofensive"
            })
    elif m_duf:
        for d in m_duf.get("drops", []):
            pct = nettoyer_pct(d.get("taux"))
            drops.append({
                "nom": d.get("item"),
                "pourcentage": pct,
                "source": "duffus"
            })

    # Sorts — dofensive
    sorts = m.get("sorts", [])

    # Zones — dofensive en priorité, duffus en backup
    zones = m.get("zones", [])
    if not zones and m_duf:
        zones = [{"nom": z} for z in m_duf.get("zones", [])]

    # Stats duffus grade 1 (tacle/fuite/esquive)
    stats_duffus = {}
    if m_duf:
        s = m_duf.get("stats", {})
        stats_duffus = {
            "tacle": nettoyer_stat(s.get("Tacle")),
            "fuite": nettoyer_stat(s.get("Fuite")),
        }

    monstre_final = {
        "id": mid,
        "nom": nom,
        "race": m.get("race"),
        "famille": m.get("famille"),
        "agression": m.get("agression"),
        "grades": grades,
        "drops": drops,
        "sorts": sorts,
        "zones": zones,
        "tacle": stats_duffus.get("tacle"),
        "fuite": stats_duffus.get("fuite"),
        "sources": {
            "dofensive": True,
            "dofusdb": m_db is not None,
            "duffus": m_duf is not None,
        }
    }

    monstres_fusionnes.append(monstre_final)

with open("dofura_monstres.json", "w", encoding="utf-8") as f:
    json.dump(monstres_fusionnes, f, ensure_ascii=False, indent=2)

print(f"Fusion terminee — {len(monstres_fusionnes)} monstres dans dofura_monstres.json")

# Stats de couverture
avec_grades = sum(1 for m in monstres_fusionnes if m["grades"])
avec_drops = sum(1 for m in monstres_fusionnes if m["drops"])
avec_sorts = sum(1 for m in monstres_fusionnes if m["sorts"])
avec_zones = sum(1 for m in monstres_fusionnes if m["zones"])
avec_3sources = sum(1 for m in monstres_fusionnes if all(m["sources"].values()))

print(f"  Avec grades    : {avec_grades}/{len(monstres_fusionnes)}")
print(f"  Avec drops     : {avec_drops}/{len(monstres_fusionnes)}")
print(f"  Avec sorts     : {avec_sorts}/{len(monstres_fusionnes)}")
print(f"  Avec zones     : {avec_zones}/{len(monstres_fusionnes)}")
print(f"  3 sources      : {avec_3sources}/{len(monstres_fusionnes)}")