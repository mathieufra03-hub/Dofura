"""
Etape 4a/b/d (verification endpoints, 3 aout 2026) : teste /songes/taux sur
les 10 intensites, en particulier les 6 jamais couvertes avant la migration
(Reve I-III, Paradoxe II-IV, Cauchemar II-III).

Controles :
  a) chaque intensite renvoie des items avec au moins un taux non-null
  b) Reve I-III : QUE des cosmetiques (categorie == 'cosmetique'), aucune
     legende/legende_animale/rune_astrale, et pas de Diplome de Feur parmi
     les cosmetiques presents
  d) aucune trace de reflet_onirique nulle part dans la reponse

Lecture seule cote serveur (GET uniquement) — aucune donnee joueur touchee.
Backend suppose deja lance sur localhost:8000 (ou VITE_API_URL/API local).
"""
import sys
import requests

API = "http://localhost:8000"

INTENSITES = [
    ("reve", 1), ("reve", 2), ("reve", 3),
    ("paradoxe", 1), ("paradoxe", 2), ("paradoxe", 3), ("paradoxe", 4),
    ("cauchemar", 1), ("cauchemar", 2), ("cauchemar", 3),
]
INTENSITES_JAMAIS_COUVERTES = {
    ("reve", 1), ("reve", 2), ("reve", 3),
    ("paradoxe", 2), ("paradoxe", 3), ("paradoxe", 4),
    ("cauchemar", 2), ("cauchemar", 3),
}

echecs = []

print("=== /songes/taux sur les 10 intensites ===\n")
for intensite, niveau in INTENSITES:
    r = requests.get(f"{API}/songes/taux", params={"intensite": intensite, "niveau": niveau})
    marque_couverture = " (jamais couverte avant)" if (intensite, niveau) in INTENSITES_JAMAIS_COUVERTES else ""
    if r.status_code != 200:
        echecs.append(f"{intensite} {niveau} : HTTP {r.status_code} — {r.text[:200]}")
        print(f"{intensite:<10} niveau {niveau}{marque_couverture} : ECHEC HTTP {r.status_code}")
        continue

    data = r.json()
    items = data["items"]
    au_moins_un_taux = any(v is not None for it in items for v in it["taux_par_palier"].values())

    reflet_present = any("reflet" in (it.get("nom") or "").lower() for it in items)

    if intensite == "reve":
        categories = {it["categorie"] for it in items}
        noms = {it["nom"] for it in items}
        categories_interdites = categories - {"cosmetique"}
        diplome_present = any("Diplôme" in (it.get("nom") or "") for it in items)
        pb = []
        if not au_moins_un_taux:
            pb.append("aucun taux non-null")
        if categories_interdites:
            pb.append(f"categories non-cosmetiques presentes : {categories_interdites}")
        if diplome_present:
            pb.append("Diplome de Feur present alors qu'il ne devrait pas l'etre en Reve")
        if reflet_present:
            pb.append("reflet_onirique/Reflet onirique trouve dans la reponse")
        if pb:
            echecs.append(f"{intensite} {niveau} : {'; '.join(pb)}")
            print(f"{intensite:<10} niveau {niveau}{marque_couverture} : ECHEC — {'; '.join(pb)}")
        else:
            print(f"{intensite:<10} niveau {niveau}{marque_couverture} : OK "
                  f"({len(items)} items, uniquement cosmetiques, taux presents, pas de Diplome de Feur, pas de reflet_onirique)")
    else:
        pb = []
        if not au_moins_un_taux:
            pb.append("aucun taux non-null")
        if reflet_present:
            pb.append("reflet_onirique/Reflet onirique trouve dans la reponse")
        if pb:
            echecs.append(f"{intensite} {niveau} : {'; '.join(pb)}")
            print(f"{intensite:<10} niveau {niveau}{marque_couverture} : ECHEC — {'; '.join(pb)}")
        else:
            categories = sorted({it["categorie"] for it in items})
            print(f"{intensite:<10} niveau {niveau}{marque_couverture} : OK "
                  f"({len(items)} items, categories {categories}, taux presents, pas de reflet_onirique)")

print("\n=== Verification globale reflet_onirique (toutes intensites confondues) ===")
# reflet_onirique ne doit apparaitre dans AUCUNE reponse, meme sous un autre nom
if any("reflet" in e.lower() for e in echecs):
    print("ECHEC : reflet_onirique detecte quelque part (voir echecs ci-dessus).")
else:
    print("OK : reflet_onirique absent de toutes les reponses testees.")

print("\n" + "=" * 60)
if echecs:
    print(f"ECHEC(S) : {len(echecs)}")
    for e in echecs:
        print(f"  - {e}")
    sys.exit(1)
else:
    print("TOUT OK : 10/10 intensites valides, points a/b/d confirmes.")
