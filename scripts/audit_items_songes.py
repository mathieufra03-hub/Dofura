"""
Audit — items trackables du futur Suivi de Songes (SONGES.md §4).

Verifie que les items lites dans SONGES.md existent bien dans la base
encyclopedique, et recupere leur id/nom exact pour un futur remplissage de
songe_items_trackables. Script de LECTURE SEULE : aucun INSERT, UPDATE,
DROP ni CREATE TABLE.

Table interrogee : objets (seule table contenant tous les items du jeu,
legendaires/cosmetiques/runes inclus — chantier #7).

Correspondance EXACTE du nom (normalise), pas de sous-chaine : une
recherche par sous-chaine avait produit de faux positifs (ex. "Crocobur"
matchait aussi "La Légende de Crocoburio", un objet different). Seuls
les accents et variantes d'apostrophe sont tolerés via normalisation.
"""
import os
import sqlite3
import unicodedata

DB_PATH = os.getenv("DB_PATH", "dofura.db")

# Source : SONGES.md, section 4 "Items trackables" (copie fidele, aucune
# valeur inventee). 26 + 4 + 7 + 1 = 38 items au total.
LEGENDES = [
    "Rykke Errel", "Thanatena", "Corruption", "Mériana", "Mille Lieues",
    "Miroir", "Helséphine", "Cul Botté", "Jahash Jurgen", "Guerre",
    "Oto Mustam", "Servitude", "Trompe-la-Mort", "Crocobur", "Henual",
    "Brumaire", "Brâm Barbe-Monde", "Fallanster", "Destin", "Dame Jhessica",
    "Misère", "Buhorado", "Menalt", "Dodge", "Ganymède", "Amayiro",
]
# Prefixe variable ("de"/"du"/"d'") selon l'item — on tente les 3 variantes
# et on exige une correspondance EXACTE avec l'une d'elles, jamais une
# sous-chaine.
PREFIXES_LEGENDE = ["Légende de {}", "Légende du {}", "Légende d'{}"]

# Prefixe fixe confirme par l'audit precedent (contrairement aux légendes
# classiques, pas de variante de/du/d').
LEGENDES_ANIMALES = ["Bakushana", "Kwakarticho", "Poukachi", "Magicrabe"]
PREFIXE_LEGENDE_ANIMALE = "Légende animale de {}"

# Noms complets, deja exacts, aucun prefixe a deviner.
COSMETIQUES = [
    "Bouclirêve Onirique", "Bouclirêve Fantastique", "Bouclirêve Imaginaire",
    "Bouclirêve Brumeux", "Bouclirêve Infini", "Bouclirêve Étoile",
    "Diplôme de Feur",  # jeu de mots Ankama, pas une faute de frappe
]
RUNES_ASTRALES = ["Rune astrale légendaire"]


def normaliser(texte):
    """Minuscules, accents retires, apostrophes unifiees — pour comparer
    'Légende de Brâm Barbe-Monde' et une eventuelle variante d'accent/
    apostrophe en base sans dependre de la collation SQLite (accent-sensible
    par defaut)."""
    if texte is None:
        return ""
    texte = texte.replace("’", "'").replace("`", "'")
    texte = unicodedata.normalize("NFKD", texte)
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    return texte.lower().strip()


def chercher_exact(index_par_nom_normalise, candidats):
    """Retourne toutes les lignes (id, nom) dont le nom normalise est
    EGAL a l'un des candidats normalises (union, pas de sous-chaine)."""
    resultats = []
    for candidat in candidats:
        resultats.extend(index_par_nom_normalise.get(normaliser(candidat), []))
    return resultats


def auditer_categorie(titre, libelles_et_candidats, index_par_nom_normalise):
    """libelles_et_candidats : liste de (libelle_affiche, [candidats exacts])."""
    print(f"\n--- {titre} ({len(libelles_et_candidats)} items) ---")
    trouves, introuvables = [], []
    for libelle, candidats in libelles_et_candidats:
        resultats = chercher_exact(index_par_nom_normalise, candidats)
        if len(resultats) == 0:
            print(f"  {libelle:<28} INTROUVABLE")
            introuvables.append(libelle)
        elif len(resultats) == 1:
            objet_id, nom_db = resultats[0]
            print(f"  {libelle:<28} id={objet_id:<8} nom_db=\"{nom_db}\"")
            trouves.append((libelle, objet_id, nom_db))
        else:
            print(f"  {libelle:<28} AMBIGU ({len(resultats)} correspondances) :")
            for objet_id, nom_db in resultats:
                print(f"      id={objet_id:<8} nom_db=\"{nom_db}\"")
    return trouves, introuvables


def construire_index(lignes):
    index = {}
    for objet_id, nom in lignes:
        index.setdefault(normaliser(nom), []).append((objet_id, nom))
    return index


def main():
    print(f"[audit_items_songes] Connexion (lecture seule) : {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, nom FROM objets")
    lignes = cur.fetchall()
    conn.close()
    print(f"[audit_items_songes] {len(lignes)} objets charges depuis la table 'objets'.")
    index = construire_index(lignes)

    categories = [
        ("Légendes", [(base, [p.format(base) for p in PREFIXES_LEGENDE]) for base in LEGENDES]),
        ("Légendes animales", [(base, [PREFIXE_LEGENDE_ANIMALE.format(base)]) for base in LEGENDES_ANIMALES]),
        ("Cosmétiques", [(nom, [nom]) for nom in COSMETIQUES]),
        ("Runes astrales", [(nom, [nom]) for nom in RUNES_ASTRALES]),
    ]

    total_trouves, total_introuvables, total_items = 0, [], 0
    for titre, libelles_et_candidats in categories:
        t, i = auditer_categorie(titre, libelles_et_candidats, index)
        total_trouves += len(t)
        total_introuvables += i
        total_items += len(libelles_et_candidats)

    total_ambigus = total_items - total_trouves - len(total_introuvables)

    print(f"\n=== Résumé ===")
    print(f"Table interrogée : objets")
    print(f"{total_trouves} trouvés / {total_items} (dont {total_ambigus} ambigus, non comptés comme trouvés)")
    if total_introuvables:
        print("Introuvables :")
        for nom in total_introuvables:
            print(f"  - {nom}")
    else:
        print("Aucun introuvable.")


if __name__ == "__main__":
    main()
