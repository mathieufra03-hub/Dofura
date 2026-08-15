# Le butin

## Le modèle à deux verrous

C'est le concept central, et le plus mal expliqué ailleurs. **Deux conditions
indépendantes** doivent être remplies pour qu'un objet puisse tomber.

1. **L'intensité** décide quelles *familles* sont accessibles.
   En Rêve : reflets et cosmétiques seulement. À partir de Paradoxe I : tout.
2. **Le palier** décide quelle *variante* de chaque famille, et si les légendes
   sont accessibles.

✅ Conséquence contre-intuitive : un joueur en Cauchemar III mais au palier II
**ne peut pas** drop de légende. L'intensité maximale ne remplace pas le palier.

✅ Chaque personnage tire son drop **indépendamment** des autres. Dans un
groupe de 4, ce sont donc 4 jets séparés par combat, pas un jet partagé pour
le groupe — c'est ce qui justifie de multiplier par le nombre de personnages
dans le calcul du nombre de runs.

## Tableau par palier

| Palier | Ce qui peut tomber |
|---|---|
| I | Reflets · Bouclirêve Onirique · Bouclirêve Étoile · Runes Mineure et Moyenne |
| II | Reflets · Bouclirêve Fantastique · Bouclirêve Étoile · Runes Mineure et Moyenne |
| III | Reflets · Bouclirêve Imaginaire · Bouclirêve Étoile · Runes Majeure et Épatante · Diplôme de Feur · Légendes · Légendes animales |
| IV | Reflets · Bouclirêve Brumeux · Bouclirêve Étoile · Runes Majeure, Épatante, Merveilleuse et Légendaire · Diplôme de Feur · Légendes · Légendes animales |
| V | Reflets · Bouclirêve Infini · Bouclirêve Étoile · Runes Merveilleuse et Légendaire · Diplôme de Feur · Légendes · Légendes animales |

Runes astrales et légendes : ✅ **Paradoxe et Cauchemar uniquement**, jamais en Rêve.

## Progression du taux selon l'intensité

- ⚠️ (annoncé en 3.3, non vérifié en jeu) Le taux de drop des ressources à
  taux variable (hors reflets, qui suivent le bonus de butin — voir plus bas)
  augmenterait avec l'intensité selon un ordre de grandeur communiqué au
  lancement de la refonte : Rêve III ≈ 2× Rêve I, Paradoxe IV ≈ 2× Rêve III,
  Cauchemar III ≈ 1,15× Paradoxe IV.
- Valeur pré-lancement 3.3, jamais recoupée depuis avec nos relevés.
  Mécanisme voisin mais distinct de l'incertitude sur le multiplicateur de
  palier des runes (voir `zones-grises.md`).

## Bonus de drop par salle

✅ Le taux affiché en jeu grimpe aussi avec la profondeur et la difficulté de
la salle choisie, sans jamais redescendre sous le plancher de l'intensité.
Constaté en jeu, captures à l'appui : en Paradoxe IV (plancher 190 %), au
palier III, une salle de difficulté 32 affichait un taux de **238 %**.

Dofura **choisit de ne pas modéliser ce bonus** : il varie trop d'une run à
l'autre selon les salles traversées. Nos chiffres de taux et de nombre de
runs restent donc un **plancher assumé** — une décision de méthode, pas une
lacune de données. Voir aussi `intensites.md`.

## Combats éligibles par objet

📊 Calculé depuis la répartition des paliers (3 / 5 / 5 / 5 / 4 combats).

| Objet | Paliers | Combats éligibles (au plus 22) |
|---|---|---|
| Reflets oniriques | I → V | jusqu'à 22 |
| Bouclirêve Étoile | I → V | jusqu'à 22 |
| Bouclirêve Onirique | I | 3 |
| Bouclirêve Fantastique | II | 5 |
| Bouclirêve Imaginaire | III | 5 |
| Bouclirêve Brumeux | IV | 5 |
| Bouclirêve Infini | V | 4 |
| Légendes · légendes animales · Diplôme de Feur | III → V | jusqu'à 14 |
| Rune Mineure · Moyenne | I → II | 8 |
| Rune Majeure · Épatante | III → IV | 10 |
| Rune Merveilleuse · Légendaire | IV → V | 9 |

> Le Bouclirêve Onirique a **jusqu'à sept fois moins** d'occasions que
> l'Étoile dans une même run — l'Onirique ne peut pas être réduit (palier I,
> jamais de Faveur), l'Étoile si. C'est le genre de chiffre que personne ne
> publie.

## Les reflets oniriques

Ressource de base, obtenue à la fin de chaque combat.

- ✅ **10 reflets de base par combat**, multipliés par le bonus de butin de la
  salle, **arrondi au supérieur**.
- ✅ Par personnage et par combat.
- ✅ Exemple : bonus de butin à 160 % → 16 reflets. À 185 % → 19 reflets.
- ✅ La prospection **n'influe pas**.
- ✅ Achetables auprès de Neru Stalar à 2 bribes l'unité.

📊 Estimation par run, au plancher de l'intensité, sur au plus 22 combats :

| Intensité | Reflets / combat | Reflets / run |
|---|---|---|
| Paradoxe I (120 %) | 12 | 264 |
| Paradoxe II (140 %) | 14 | 308 |
| Paradoxe III (160 %) | 16 | 352 |
| Paradoxe IV (190 %) | 19 | 418 |
| Cauchemar III (300 %) | 30 | 660 |

Ces valeurs sont des **planchers** : le bonus de butin monte avec la profondeur
et la difficulté des salles.

## Les runes astrales

- ✅ Paradoxe et Cauchemar uniquement. Rareté déterminée par le palier
  (voir tableau ci-dessus).
- ✅ Le taux évolue selon le palier et la difficulté des combats.
- ✅ Le palier agit ici **directement** sur le taux, au-delà du simple
  déblocage de rareté — c'est le seul mécanisme du genre : pour les autres
  familles d'objets, le palier n'influence le taux qu'**indirectement**, via
  la difficulté croissante des salles (voir `intensites.md`).
- ✅ La prospection **n'influe pas**.
- ✅ 6 raretés : Mineure, Moyenne, Majeure, Épatante, Merveilleuse, Légendaire.
- ✅ Servent à craft les **runes de transcendance** : 100 % de réussite, mais
  l'objet ne peut plus être forgemagé ensuite. **5 runes astrales pour 1 rune
  de transcendance.**
- ✅ Les runes Légendaires donnent 1 % de dommages supplémentaires.
- ⚠️ Nos taux de base internes (2 / 4 / 6 % selon palier, rune légendaire à
  0,67 %) laissent supposer un multiplicateur de palier en plus du
  multiplicateur d'intensité — ratios observés ×1,1 / ×1,3 / ×1,2 / ×1,4.
  Non confirmé. Nos taux actuels sont donc un plancher.

## Les légendes

- ✅ Palier III minimum **et** Paradoxe/Cauchemar. Les deux conditions.
- ✅ Deux types : les **légendes** (26 au total, dont 8 ajoutées en 3.3) pour
  les équipements légendaires, et les **légendes animales** (4) pour les
  croquettes de familier légendaire.
- ✅ Toutes les légendes d'un même type ont **exactement** le même taux.
- ✅ La prospection **n'influe pas**.
- ✅ Les 8 légendes de la 3.3 : Amayiro, Helséphine, Henual, Oto Mustam,
  Menalt, Mériana, Miroir, Thanatena.
- ✅ Chaque légende tire **indépendamment** des 25 autres : le tableau des
  butins affiché en jeu à la fin d'un combat liste chaque légende sur sa
  propre ligne, avec son propre pourcentage. Il n'y a pas de tirage
  "légende" unique qui se répartirait ensuite.

**Conséquence directe** : un nombre de runs calculé sur le taux d'une seule
légende ne vaut que pour **cette légende précise**. Pour obtenir n'importe
laquelle des 26, le nombre de runs nécessaire est environ **26 fois plus
bas**.

Taux de base :

| Type | Dofura (28 relevés) | Source externe | Statut |
|---|---|---|---|
| Légende animale | 0,01 % | 0,01 % | ✅ concordant |
| Légende | 0,003667 % | 0,0035 % | ⚠️ **conflit** |

✅ Popo confirme **0,003667 %** comme taux de base retenu par Dofura (nos
relevés donnent 0,0044 % au minimum en Paradoxe I).

⚠️ Le conflit avec la source externe (0,0035 % de base, 0,0042 % au minimum
Paradoxe I) reste néanmoins ouvert : l'affichage en jeu arrondit à 3
décimales (0,004 % en Paradoxe I), ce qui ne permet pas de départager les
deux valeurs à la simple lecture d'une capture d'écran. Nous continuons de
privilégier nos 28 relevés en jeu. **Ne jamais présenter ce chiffre sans la
nuance.**

## Les cosmétiques

- ✅ Les **6 Bouclirêves** peuvent tomber dans toutes les intensités, y compris
  en Rêve, à un taux extrêmement bas.
- ✅ Contrairement à toutes les autres ressources, **la prospection influe sur
  les boucliers**. Elle joue individuellement, par personnage, pas au niveau
  du groupe.
- ✅ Seul le Bouclirêve Étoile est colorable.
- ✅ La prospection influe aussi sur les **objets de quête** obtenus en
  Songe — même mécanique que pour les Bouclirêves.
- ✅ Les boucliers sont aussi échangeables contre des reflets d'antan ou
  oubliés (anciens Songes) auprès de Gobastrale et Coco Rupe — ces monnaies
  disparaîtront en 3.7.

## Le Diplôme de Feur

- ✅ Titre, dropable à partir du palier III.
- ✅ La prospection **influe** sur son taux.
- ⚠️ Taux de base : **0,002 %** chez nous, **0,001 %** selon la source externe.
  Conflit non tranché.

## Ce qui ne se drop pas

- ✅ **Fragments de prysmaradite** : jamais en drop. Uniquement à l'achat chez
  Neru Stalar, 50 bribes l'unité.
- ✅ **Panoplie d'apparat** (Cape, Coiffe, Bouclier de la Fontaine Onirique) :
  achat uniquement, contre des bribes.
- ✅ **Compagnons** (Phong Huss, Grouillot) : achat uniquement contre des
  bribes. Ne tombent plus en drop depuis la mise à jour du 7 octobre.
- ✅ **Costumes** : récompenses de succès uniquement, un par catégorie de
  difficulté — Costume du rêveur (Rêve), Paradoxal, Cauchemardesque.
- ✅ **Ornements et titres** hors Diplôme de Feur : succès ou achat.
