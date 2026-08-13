// Normalisation pour la recherche insensible aux accents (chantier
// Recherche normalisee, 13 aout 2026). A appliquer des DEUX cotes d'une
// comparaison (texte tape ET texte cherche) pour que "mer" trouve
// "Meriana" et que "Meriana" tape avec les bons accents continue de
// fonctionner (les deux cotes finissent normalises de la meme facon).
// Gere seulement accents/casse/apostrophes — PAS les fautes de frappe
// ("merianna" avec deux n ne doit rien trouver).
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
