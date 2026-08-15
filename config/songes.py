"""Constantes du Suivi de Songes — source unique (SONGES.md §6).

Aucune de ces valeurs ne doit etre ecrite en dur ailleurs dans le code
(backend ou frontend) : tout doit lire ce module ou l'endpoint qui
l'expose (/songes/config, a construire dans une etape ulterieure).
"""

NB_SALLES_PAR_RUN = 26

# Nombre de salles de combat par palier sur une run complete.
# Les fontaines et salles Faveur ne sont pas des combats.
# Valeurs moyennes relevees en jeu — le chemin choisi fait legerement varier le total.
# Palier 4 corrige de 4 a 5 le 31 juillet 2026 (page Les Taux) : c'est cette
# valeur qui reproduit les reperes donnes par Popo (~13,5 songes pour
# "n'importe quelle legende", 4 personnages, Paradoxe I) — l'ancienne valeur
# (4) donnait ~14,45, ecart trop grand pour etre du seul arrondi.
COMBATS_PAR_PALIER = {1: 3, 2: 5, 3: 5, 4: 5, 5: 4}   # total ~ 22

PALIERS = {
    1: {"nom": "Les Pensées oniriques",        "salles": (1, 3)},
    2: {"nom": "Les Balades fantastiques",     "salles": (4, 9)},
    3: {"nom": "Les Espaces imaginaires",      "salles": (10, 15)},
    4: {"nom": "Les Concepts brumeux",         "salles": (16, 21)},
    5: {"nom": "Les Abstractions chimériques", "salles": (22, 26)},
}

# "libelle" est le nom affiché (avec accents), distinct de la cle interne
# ("reve") qui sert d'identifiant partout ailleurs (DB, query params) et ne
# doit pas etre touchee. Ajoute le 15 aout 2026 : "reve" affiche sans son
# accent circonflexe cote frontend (capitaliser(cle) ne fait que mettre en
# majuscule, il ne restitue pas l'accent) — "paradoxe"/"cauchemar" n'ont pas
# ce probleme, aucun accent en francais correct sur ces deux mots.
INTENSITES = {
    "reve":      {"niveaux": [1, 2, 3],    "bonus": {1: 50,  2: 75,  3: 100}, "libelle": "Rêve"},
    "paradoxe":  {"niveaux": [1, 2, 3, 4], "bonus": {1: 120, 2: 140, 3: 160, 4: 190}, "libelle": "Paradoxe"},
    "cauchemar": {"niveaux": [1, 2, 3],    "bonus": {1: 220, 2: 250, 3: 300}, "libelle": "Cauchemar"},
}

INTENSITE_DEFAUT = ("paradoxe", 1)

# Combat final a vagues (SONGES.md §3.2) : nombre de vagues a vaincre pour
# la victoire, selon l'intensite. Sert a borner le champ optionnel
# "vague finale" (refonte interface, 29 juillet 2026).
VAGUES_REQUISES = {"reve": 1, "paradoxe": 3, "cauchemar": 3}

# Plafond du compteur "Combat final" (chantier 1, passe 1b, 2026-08-04) —
# None = illimite. Rêve/Paradoxe bornes (nombre de vagues realistement
# atteignables, retour Popo) ; Cauchemar laisse libre.
VAGUES_MAX = {"reve": 5, "paradoxe": 15, "cauchemar": None}
