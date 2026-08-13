// Normalisation pour la recherche insensible aux accents (chantier
// Recherche normalisee, 13 aout 2026). A appliquer des DEUX cotes d'une
// comparaison (texte tape ET texte cherche) pour que "mer" trouve
// "Meriana" et que "Meriana" tape avec les bons accents continue de
// fonctionner (les deux cotes finissent normalises de la meme facon).
// Gere seulement accents/casse/apostrophes — PAS les fautes de frappe
// ("merianna" avec deux n ne doit rien trouver).
//
// MIROIR de normaliser_texte (main.py) — chantier recherche backend,
// 13 aout 2026. Les deux DOIVENT produire exactement le meme resultat
// caractere pour caractere. Si l'une evolue, repercuter le changement
// dans l'autre — sinon meme requete tapee donne des resultats differents
// selon qu'elle passe par l'API (recherche navbar, Bibliotheque >
// Bestiaire) ou par ce fichier (Items de songe, "J'ai drop"), bug
// silencieux et penible a diagnostiquer.
const DIACRITIQUES = /[̀-ͯ]/g
const APOSTROPHES = /['’‘`]/g

export function normaliserTexte(texte) {
  if (!texte) return ""
  return texte
    .normalize("NFD")
    .replace(DIACRITIQUES, "")
    .toLowerCase()
    .replace(APOSTROPHES, "")
}
