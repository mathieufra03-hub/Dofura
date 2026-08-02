"""
Migration dofura_songes_taux.json v2.0 -> songe_taux (audit du 2-3 aout 2026).

A LA RACINE, PAS dans scripts/ (deplace le 3 aout 2026) : ce n'est pas un
script jetable, init_db.py en depend pour demarrer (import direct plus bas,
sans sys.path.insert — un chemin relatif dependrait du repertoire courant,
non garanti quand Railway lance le backend au demarrage, cf. main.py).

Fonction pure : lit le nouveau fichier (structure taux_base + multiplicateur)
et reconstruit une liste de dicts {intensite, niveau, palier, cle_taux, taux},
EXACTEMENT le format de l'ancien dofura_songes_taux.json (v1, liste plate) que
songe_items_trackables/main.py attendent via la colonne cle_taux (SONGES.md
"categorie vs cle_taux — ne pas confondre" : toute jointure item -> taux DOIT
utiliser cle_taux, jamais categorie).

Decisions validees par Popo (2-3 aout 2026) :
- Le nouveau fichier fait autorite sur toute la ligne (l'ancien = releves
  ponctuels non reproductibles).
- Reserve connue sur les runes (voir _meta.reserve_connue du JSON) : PAS
  implementee ici, volontairement — mesure en jeu a venir.
- reflet_onirique n'a aucune source dans le nouveau fichier : absent d'ici,
  retire de RUNES_HORS_TRACKER (main.py).
- Diplome de Feur (3 aout 2026) : restriction d'intensite cachee dans son
  seul champ texte condition_jeu ("Niveau d'intensite du Songe > 3"), sans
  equivalent machine-readable — corrige en ajoutant "intensite_rang_min": 4
  au JSON, verifie ici via COSMETIQUE_CLE_TAUX/intensite_rang_min. Aucun
  autre item du fichier n'a de restriction cachee equivalente (verifie
  exhaustivement sur les 11 champs condition_jeu du fichier).

Aucune ecriture en base par ce module : sortie console uniquement (usage en
script direct) ou liste en memoire (import par init_db.py).
"""
import json
import sys
import unicodedata

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def _slug(nom_rune):
    """'Rune astrale épatante' -> 'rune_astrale_epatante' — accents retires,
    espaces en underscore. Verifie a l'appel contre la liste attendue des 6
    anciens cle_taux (piege connu du projet : ne jamais faire confiance a une
    normalisation de texte sans la verifier sur les cas reels, cf. Culbutoeuf/
    Culbutœuf, Chaloeil/Chalœil dans CLAUDE.md)."""
    sans_accents = "".join(
        c for c in unicodedata.normalize("NFKD", nom_rune) if not unicodedata.combining(c)
    )
    return sans_accents.lower().replace(" ", "_").replace("'", "")


# Mapping nom d'item cosmetique -> ancien cle_taux (les 5 Bouclireve a palier
# unique partagent tous "bouclireve_palier", distingues par paliers_eligibles).
COSMETIQUE_CLE_TAUX = {
    "Bouclirêve Onirique": "bouclireve_palier",
    "Bouclirêve Fantastique": "bouclireve_palier",
    "Bouclirêve Imaginaire": "bouclireve_palier",
    "Bouclirêve Brumeux": "bouclireve_palier",
    "Bouclirêve Infini": "bouclireve_palier",
    "Bouclirêve Étoile": "bouclireve_etoile",
    "Diplôme de Feur": "diplome_feur",
}

ANCIENS_SLUGS_RUNES_ATTENDUS = {
    "rune_astrale_mineure", "rune_astrale_moyenne", "rune_astrale_majeure",
    "rune_astrale_epatante", "rune_astrale_merveilleuse", "rune_astrale_legendaire",
}


def migrer(data):
    """data = dict charge depuis dofura_songes_taux.json (v2.0).
    Retourne une liste de dicts {intensite, niveau, palier, cle_taux, taux}.

    taux = taux_base * multiplicateur, SANS arrondi (3 aout 2026, correction
    suite a une passe visuelle Popo). Arrondir ici a 3 decimales — comme le
    fait le jeu pour l'AFFICHAGE — collisionnait plusieurs intensites entre
    elles des que leurs produits exacts tombaient dans le meme intervalle de
    0.0005 (ex. Paradoxe II 0.0028 et Paradoxe III 0.0032 arrondissaient
    tous deux a 0.003) : l'estimation "1 tous les X songes" (agregat de
    categorie ET item individuel, cote frontend calculerSongesItems ET
    backend estimer_esperance_runs) utilisait alors la MEME valeur pour deux
    intensites reellement differentes. Le pourcentage AFFICHE sur la page
    Les Taux n'est pas concerne : formaterTaux() (TauxPage.jsx) re-arrondit
    a 3 decimales pour l'affichage quel que soit ce qui est stocke ici."""
    lignes = []

    base_legende = data["categories"]["legende"]["taux_base"]
    base_legende_animale = data["categories"]["legende_animale"]["taux_base"]

    runes_par_nom = {r["nom"]: r for r in data["runes_astrales"]}
    slugs_generes = set()

    # Verifie une fois pour toutes que chaque cosmetique connu a un cle_taux
    # (piege du 3 aout 2026 : Diplome de Feur a une restriction d'intensite
    # cachee dans son seul champ texte condition_jeu, sans drapeau machine-
    # readable — corrige en ajoutant "intensite_rang_min" au JSON. Verifie ici
    # que plus aucun item de cosmetiques[] n'echappe au mapping explicite).
    for item in data["cosmetiques"]:
        if item["nom"] not in COSMETIQUE_CLE_TAUX:
            raise RuntimeError(
                f"Cosmetique sans cle_taux connu : {item['nom']!r} — "
                f"completer COSMETIQUE_CLE_TAUX avant de continuer."
            )

    for intensite_entry in data["intensites"]:
        intensite_id = intensite_entry["id"]              # ex. "paradoxe_1"
        famille, niveau_str = intensite_id.split("_", 1)   # "paradoxe", "1"
        niveau = int(niveau_str)
        mult = intensite_entry["multiplicateur"]

        def ajoute(cle_taux, palier, taux_base):
            lignes.append({
                "intensite": famille, "niveau": niveau, "palier": palier,
                "cle_taux": cle_taux, "taux": taux_base * mult,
            })

        # --- Cosmetiques : generees a TOUTES les intensites SAUF si l'item a
        # sa propre restriction (intensite_rang_min, ex. Diplome de Feur >= 4,
        # i.e. Paradoxe+ — absent en Reve I-III). paliers_eligibles et
        # taux_base lus directement du JSON, pas recopies en dur ici. ---
        for item in data["cosmetiques"]:
            rang_min = item.get("intensite_rang_min")
            if rang_min is not None and intensite_entry["rang"] < rang_min:
                continue
            slug = COSMETIQUE_CLE_TAUX[item["nom"]]
            for palier in item["paliers_eligibles"]:
                ajoute(slug, palier, item["taux_base"])

        # --- Legendes / legendes animales / runes : seulement si l'intensite
        # les propose (drop_legendes / drop_runes) — Reve I-III exclues. ---
        if intensite_entry["drop_legendes"]:
            for palier in (3, 4, 5):
                ajoute("legende", palier, base_legende)
                ajoute("legende_animale", palier, base_legende_animale)

        if intensite_entry["drop_runes"]:
            for nom_rune, rune in runes_par_nom.items():
                slug = _slug(nom_rune)
                slugs_generes.add(slug)
                for entree in rune["entrees"]:
                    ajoute(slug, entree["palier"], entree["taux_base"])

    if slugs_generes != ANCIENS_SLUGS_RUNES_ATTENDUS:
        raise RuntimeError(
            f"Slugs de runes generes {slugs_generes} != attendus "
            f"{ANCIENS_SLUGS_RUNES_ATTENDUS} — la normalisation _slug() a produit "
            f"un resultat inattendu, ne pas continuer sans verifier."
        )

    return lignes


# Les 36 lignes de l'ancien dofura_songes_taux.json v1 (Paradoxe I uniquement),
# gardees ici en dur UNIQUEMENT pour le diff visuel de cette etape d'audit —
# pas une source de verite a reutiliser ailleurs, le fichier v1 n'existe plus
# comme source active (regle 7 CLAUDE.md, une seule source de verite).
ANCIENNES_LIGNES_PARADOXE_1 = [
    {"intensite": "paradoxe", "niveau": 1, "palier": 3, "cle_taux": "legende", "taux": 0.005},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "legende", "taux": 0.005},
    {"intensite": "paradoxe", "niveau": 1, "palier": 5, "cle_taux": "legende", "taux": 0.006},
    {"intensite": "paradoxe", "niveau": 1, "palier": 3, "cle_taux": "legende_animale", "taux": 0.016},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "legende_animale", "taux": 0.014},
    {"intensite": "paradoxe", "niveau": 1, "palier": 5, "cle_taux": "legende_animale", "taux": 0.017},
    {"intensite": "paradoxe", "niveau": 1, "palier": 1, "cle_taux": "bouclireve_etoile", "taux": 0.001},
    {"intensite": "paradoxe", "niveau": 1, "palier": 2, "cle_taux": "bouclireve_etoile", "taux": 0.003},
    {"intensite": "paradoxe", "niveau": 1, "palier": 3, "cle_taux": "bouclireve_etoile", "taux": 0.003},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "bouclireve_etoile", "taux": 0.002},
    {"intensite": "paradoxe", "niveau": 1, "palier": 5, "cle_taux": "bouclireve_etoile", "taux": 0.003},
    {"intensite": "paradoxe", "niveau": 1, "palier": 1, "cle_taux": "bouclireve_palier", "taux": 0.001},
    {"intensite": "paradoxe", "niveau": 1, "palier": 2, "cle_taux": "bouclireve_palier", "taux": 0.003},
    {"intensite": "paradoxe", "niveau": 1, "palier": 3, "cle_taux": "bouclireve_palier", "taux": 0.003},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "bouclireve_palier", "taux": 0.002},
    {"intensite": "paradoxe", "niveau": 1, "palier": 5, "cle_taux": "bouclireve_palier", "taux": 0.003},
    {"intensite": "paradoxe", "niveau": 1, "palier": 3, "cle_taux": "diplome_feur", "taux": 0.003},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "diplome_feur", "taux": 0.002},
    {"intensite": "paradoxe", "niveau": 1, "palier": 5, "cle_taux": "diplome_feur", "taux": 0.003},
    {"intensite": "paradoxe", "niveau": 1, "palier": 1, "cle_taux": "rune_astrale_mineure", "taux": 4.8},
    {"intensite": "paradoxe", "niveau": 1, "palier": 2, "cle_taux": "rune_astrale_mineure", "taux": 7.92},
    {"intensite": "paradoxe", "niveau": 1, "palier": 1, "cle_taux": "rune_astrale_moyenne", "taux": 2.4},
    {"intensite": "paradoxe", "niveau": 1, "palier": 2, "cle_taux": "rune_astrale_moyenne", "taux": 5.28},
    {"intensite": "paradoxe", "niveau": 1, "palier": 3, "cle_taux": "rune_astrale_majeure", "taux": 6.24},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "rune_astrale_majeure", "taux": 8.64},
    {"intensite": "paradoxe", "niveau": 1, "palier": 3, "cle_taux": "rune_astrale_epatante", "taux": 3.12},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "rune_astrale_epatante", "taux": 5.76},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "rune_astrale_merveilleuse", "taux": 2.88},
    {"intensite": "paradoxe", "niveau": 1, "palier": 5, "cle_taux": "rune_astrale_merveilleuse", "taux": 6.72},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "rune_astrale_legendaire", "taux": 0.965},
    {"intensite": "paradoxe", "niveau": 1, "palier": 5, "cle_taux": "rune_astrale_legendaire", "taux": 3.36},
    {"intensite": "paradoxe", "niveau": 1, "palier": 1, "cle_taux": "reflet_onirique", "taux": 100},
    {"intensite": "paradoxe", "niveau": 1, "palier": 2, "cle_taux": "reflet_onirique", "taux": 100},
    {"intensite": "paradoxe", "niveau": 1, "palier": 3, "cle_taux": "reflet_onirique", "taux": 100},
    {"intensite": "paradoxe", "niveau": 1, "palier": 4, "cle_taux": "reflet_onirique", "taux": 100},
    {"intensite": "paradoxe", "niveau": 1, "palier": 5, "cle_taux": "reflet_onirique", "taux": 100},
]


def _rapport(lignes):
    print(f"Total lignes generees : {len(lignes)}\n")

    print("--- Par intensite ---")
    par_intensite = {}
    for l in lignes:
        cle = f"{l['intensite']}_{l['niveau']}"
        par_intensite[cle] = par_intensite.get(cle, 0) + 1
    for cle in sorted(par_intensite, key=lambda c: (c.split("_")[0], int(c.split("_")[1]))):
        print(f"  {cle:<14} {par_intensite[cle]:>3} lignes")

    print("\n--- Par cle_taux ---")
    par_cle = {}
    for l in lignes:
        par_cle[l["cle_taux"]] = par_cle.get(l["cle_taux"], 0) + 1
    for cle in sorted(par_cle):
        print(f"  {cle:<28} {par_cle[cle]:>3} lignes")

    print("\n--- Paradoxe I : nouveau vs ancien (cote a cote) ---")
    nouvelles_p1 = {(l["cle_taux"], l["palier"]): l["taux"]
                     for l in lignes if l["intensite"] == "paradoxe" and l["niveau"] == 1}
    anciennes_p1 = {(l["cle_taux"], l["palier"]): l["taux"] for l in ANCIENNES_LIGNES_PARADOXE_1}
    toutes_cles = sorted(set(nouvelles_p1) | set(anciennes_p1))
    print(f"  {'cle_taux':<28}{'palier':>7}{'ancien':>10}{'nouveau':>10}{'ecart':>10}")
    for cle_taux, palier in toutes_cles:
        anc = anciennes_p1.get((cle_taux, palier))
        nouv = nouvelles_p1.get((cle_taux, palier))
        anc_s = f"{anc}" if anc is not None else "absent"
        nouv_s = f"{nouv}" if nouv is not None else "ABSENT"
        ecart = f"{nouv - anc:+.3f}" if (anc is not None and nouv is not None) else "-"
        print(f"  {cle_taux:<28}{palier:>7}{anc_s:>10}{nouv_s:>10}{ecart:>10}")


if __name__ == "__main__":
    with open("dofura_songes_taux.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    lignes = migrer(data)
    _rapport(lignes)
