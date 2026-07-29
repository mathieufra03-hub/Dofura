"""Messages d'ambiance humoristiques pour le Suivi de Songes — STRUCTURE
UNIQUEMENT, a remplir plus tard par Popo. Aucun texte invente ici (regle 13
CLAUDE.md : ne jamais inventer) — chaque liste reste vide tant que les
messages n'ont pas ete rediges et valides par Popo.

Cle = tranche de secheresse en NOMBRE DE SONGES depuis le dernier drop de la
categorie affichee (le chiffre principal du compteur — voir SONGES.md,
refonte interface point 1 —, pas les tirages, qui restent une info
secondaire). Deux cles supplementaires pour les moments de drop.

Pas encore branche a l'interface : ce fichier ne sera consomme par
main.py/SongesPage.jsx qu'une fois rempli.
"""

MESSAGES_SECHERESSE = {
    "0_20": [],           # secheresse faible, rien d'inquietant
    "20_60": [],           # dans la moyenne
    "60_150": [],           # ca commence a trainer
    "150_plus": [],         # grosse secheresse
    "drop_recent": [],      # un drop vient d'arriver
    "drop_en_avance": [],   # drop obtenu nettement avant la reference theorique (coup de chance)
}
