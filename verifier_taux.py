"""
Vérifie que la formule taux_base * multiplicateur reproduit TOUS les taux
relevés en jeu. Si un seul relevé casse, le modèle est faux.
"""
import json

with open("dofura_songes_taux.json", encoding="utf-8") as f:
    D = json.load(f)

MULT = {i["id"]: i["multiplicateur"] for i in D["intensites"]}

BASES = {
    "cosmetique":      D["categories"]["cosmetique"]["taux_base"],
    "legende":         D["categories"]["legende"]["taux_base"],
    "legende_animale": D["categories"]["legende_animale"]["taux_base"],
    "rune_base_2":     2.0,
    "rune_base_4":     4.0,
    "rune_base_6":     6.0,
    "rune_lvl200_p4":  0.67,
}

def arrondi_jeu(v):
    """Le jeu arrondit à 3 décimales sous 1%, à 3 chiffres significatifs au-dessus."""
    return round(v, 3)

ok = ko = 0
print(f"{'Intensité':<14}{'Catégorie':<18}{'Calculé':>10}{'Relevé':>10}   ")
print("-" * 58)
for r in D["_verification"]["releves"]:
    base = BASES[r["categorie"]]
    calc = arrondi_jeu(base * MULT[r["intensite"]])
    attendu = r["attendu"]
    match = abs(calc - attendu) < 0.0006
    print(f"{r['intensite']:<14}{r['categorie']:<18}{calc:>10.3f}{attendu:>10.3f}   {'OK' if match else 'ECHEC'}")
    ok += match
    ko += not match

print("-" * 58)
print(f"{ok} relevés validés, {ko} échecs\n")

if ko:
    raise SystemExit("Le modèle ne tient pas, ne pas deployer.")

# ---- Table complète recalculée pour les 10 intensités ----
print("\nTABLE COMPLETE RECALCULEE\n")
head = f"{'Intensité':<14}{'Cosmét.':>9}{'Légende':>9}{'L.anim.':>9}{'Rune 2':>8}{'Rune 4':>8}{'Rune 6':>8}{'R.lég.':>8}"
print(head); print("-" * len(head))
for i in D["intensites"]:
    m = i["multiplicateur"]
    if not i["drop_legendes"]:
        print(f"{i['nom']:<14}{arrondi_jeu(BASES['cosmetique']*m):>9.3f}{'—':>9}{'—':>9}{'—':>8}{'—':>8}{'—':>8}{'—':>8}")
    else:
        print(f"{i['nom']:<14}"
              f"{arrondi_jeu(BASES['cosmetique']*m):>9.3f}"
              f"{arrondi_jeu(BASES['legende']*m):>9.3f}"
              f"{arrondi_jeu(BASES['legende_animale']*m):>9.3f}"
              f"{arrondi_jeu(2*m):>8.1f}{arrondi_jeu(4*m):>8.1f}{arrondi_jeu(6*m):>8.1f}"
              f"{arrondi_jeu(0.67*m):>8.3f}")

# ---- Estimateur : combien de songes pour une légende ? ----
def songes_moyens(taux_base, mult, combats, joueurs, nb_items=1):
    p = (taux_base * mult) / 100.0
    p_any = 1 - (1 - p) ** nb_items      # au moins un item de la catégorie
    tirages = combats * joueurs
    p_songe = 1 - (1 - p_any) ** tirages
    return 1 / p_songe if p_songe else float("inf")

print("\n\nESTIMATION : nombre moyen de songes pour UNE légende (n'importe laquelle sur 26)\n")
head = f"{'Intensité':<14}" + "".join(f"{n} joueur{'s' if n>1 else ' '}".rjust(12) for n in (1,2,3,4))
print(head); print("-" * len(head))
for i in D["intensites"]:
    if not i["drop_legendes"]:
        continue
    ligne = f"{i['nom']:<14}"
    for n in (1, 2, 3, 4):
        s = songes_moyens(BASES["legende"], i["multiplicateur"], 14, n, nb_items=26)
        ligne += f"{s:>12.1f}"
    print(ligne)

print("\n\nESTIMATION : nombre moyen de songes pour UN Bouclirêve Étoile (22 combats)\n")
head = f"{'Intensité':<14}" + "".join(f"{n} joueur{'s' if n>1 else ' '}".rjust(12) for n in (1,2,3,4))
print(head); print("-" * len(head))
for i in D["intensites"]:
    ligne = f"{i['nom']:<14}"
    for n in (1, 2, 3, 4):
        s = songes_moyens(BASES["cosmetique"], i["multiplicateur"], 22, n)
        ligne += f"{s:>12.0f}"
    print(ligne)
