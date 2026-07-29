// Couleur dominante de chaque Dofus (chantier Chasse au Dofus, 30 juillet
// 2026), utilisee pour le degrade de fond discret + le halo lumineux de sa
// carte/panneau. Valeurs extraites de l'artwork REEL de chaque Dofus (pas
// inventees, regle 13) via scripts/extraire_couleurs_dofus.py (supprime
// apres usage, regle 6) : telecharge l'icone officielle DofusDB, regroupe
// les pixels opaques par nuance proche (exclut les tons neutres du contour
// noir/blanc/gris sauf s'il n'y a rien d'autre), garde la nuance la plus
// frequente restante, puis remonte la LUMINOSITE a un plancher de 0.32
// (teinte/saturation inchangees) pour les oeufs aux tons tres sombres
// (Cacao, Vulbis, Sylvestre...) qui donnaient sinon un quasi-noir inutile
// pour un halo visible.
//
// Exception assumee, PAS extraite : les 6 Dofus primordiaux reprennent leurs
// couleurs officielles deja validees (tokens.css --df-dofus-*, memes que les
// pastilles de l'en-tete) plutot que la valeur extraite — l'algorithme se
// trompe sur les teintes tres vives/saturees (ex. Emeraude extrayait un
// jaune-vert #e0f000 au lieu du vert emeraude attendu, un reflet de l'oeuf
// plus "extreme" statistiquement que sa vraie couleur dominante). Ebene
// reprend sa couleur de halo dediee (--df-dofus-ebene-glow, chantier style
// global) plutot que son remplissage volontairement quasi noir, qui ne
// donnerait aucun degrade/halo visible.
export const DOFUS_COULEURS = {
  "7113": "#8f5214",   // Dofawa
  "19629": "#a0a080",  // Dofus Argenté
  "20833": "#a30000",  // Dofus Cacao
  "972": "#d05000",    // Dofus Cawotte
  "10907": "#a0d0f0",  // Dokille
  "17078": "#6d3636",  // Dokoko
  "21186": "#a30000",  // Dofus Vulbis (niv. 100)
  "16061": "#40e0b0",  // Dofus des Veilleurs
  "737": "#3FCF8A",    // Dofus Émeraude (primordial, couleur officielle)
  "13344": "#d06040",  // Dolmanax
  "694": "#E0485E",    // Dofus Pourpre (primordial, couleur officielle)
  "15235": "#f0d0c0",  // Dotruche
  "23237": "#66523d",  // Domakuro
  "23408": "#d0c0a0",  // Dorigami
  "7754": "#E8A33D",   // Dofus Ocre (primordial, couleur officielle)
  "739": "#3FC9E0",    // Dofus Turquoise (primordial, couleur officielle)
  "31794": "#a31b00",  // Dofoozbz
  "18043": "#4090a0",  // Dofus Abyssal
  "20286": "#f0f0d0",  // Dofus Argenté Scintillant
  "19398": "#6d5236",  // Dofus Forgelave
  "7115": "#F0EBDD",   // Dofus Ivoire (primordial, couleur officielle)
  "8698": "#a0a0d0",   // Dofus Nébuleux
  "7112": "#e0d0c0",   // Dofus Tacheté
  "6980": "#a30000",   // Dofus Vulbis (niv. 180)
  "7043": "#d0f0f0",   // Dofus des Glaces
  "26066": "#6d5236",  // Dofus du Cauchemar
  "7114": "#9B7BFF",   // Dofus Ébène (primordial, couleur de halo dédiée)
  "27803": "#88361b",  // Dom de Pin
  "29136": "#a33600",  // Dofus Sylvestre
}
