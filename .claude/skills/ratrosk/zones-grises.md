# Zones grises et conflits

Cette fiche liste ce que Dofura **ne sait pas encore**. Rien ici ne peut être
affirmé. C'est aussi une section éditoriale à part entière de la page
"Comprendre les Songes" : dire ce qu'on ignore est un argument de crédibilité,
pas une faiblesse.

## Conflits de sources non tranchés

### Taux de base des légendes classiques ⚠️

| Source | Base | Minimum Paradoxe I |
|---|---|---|
| Dofura (28 relevés en jeu) | 0,003667 % | 0,0044 % |
| Source externe | 0,0035 % | 0,0042 % |

Les deux valeurs sont cohérentes en interne — c'est bien le taux affiché en jeu
qui diffère. Dofura privilégie ses propres relevés (0,003667 % confirmé comme
base par Popo). L'affichage en jeu arrondit à 3 décimales (0,004 % en
Paradoxe I), ce qui ne permet pas de départager les deux valeurs à la simple
lecture d'une capture d'écran — c'est ce qui explique que le conflit persiste.

### Taux de base du Diplôme de Feur ⚠️

Dofura : 0,002 %. Source externe : 0,001 %. Non tranché.

### Nombre d'objets légendaires ajoutés en 3.3 ⚠️

Le devblog 3.3 annonce **7** nouveaux objets légendaires. Le fait ✅ actuel
(`butin.md`) en compte **8**. Écart non expliqué — à confirmer si un objet a
été ajouté après l'annonce initiale.

### Nombre de cartes de combat ⚠️

Le devblog 3.3 annonce **environ 30** cartes de combat dédiées aux Songes. Le
fait ✅ actuel (`structure.md`) en compte **environ 60**. Écart probablement
dû à des ajouts progressifs au fil des mises à jour, non confirmé.

### Rôle des gobelins Bog et Gobledore ⚠️

Le devblog 3.5 attribue au gobelin **Bog** le fait de "revenir en arrière"
pour bénéficier d'un second portail sans effort. Le fait ✅ actuel
(`structure.md`) attribue ce rôle à **Gobledore**, et donne à Bog la relance
des objets de fontaine. Les deux sources se contredisent sur le rôle de
Bog — à vérifier en jeu.

### Ressources de départ en Paradoxe et Cauchemar ⚠️

Le devblog 3.3 annonce **aucun** point de rêve ni Sable de Draconiros de
départ à partir de l'intensité Paradoxe, et **aucune** Tempête astrale de
départ dans toutes les intensités. Le fait ✅ actuel (`intensites.md`) donne
pourtant **5 points de rêve** de départ en Paradoxe et **1 Tempête astrale**
de départ dans toutes les catégories (Rêve, Paradoxe, Cauchemar). Écart non
résolu.

## Incertitudes techniques

### Multiplicateur de palier sur les runes ⚠️

Nos relevés suggèrent que les runes astrales subissent un multiplicateur lié au
palier **en plus** du multiplicateur d'intensité — ratios observés ×1,1 (II),
×1,3 (III), ×1,2 (IV), ×1,4 (V). Non confirmé. **Spécifique aux runes** : pour
les autres familles d'objets, le palier n'agit qu'indirectement, via la
difficulté croissante des salles (voir `intensites.md` et `butin.md`).

Conséquence : nos taux de runes sont un **plancher**, pas une estimation
centrale. Test proposé : comparer un Bouclirêve Étoile obtenu au palier I et au
palier V dans une même run.

### Sorts de fontaine ❌

La liste complète des bonus de fontaine n'est pas relevée. Seuls quelques
exemples sont connus (Abjuration, Absolution, Acrobate, Acuité de Crâ,
Affûtage, Ardeur, Vent Arrière). À relever en jeu.

⚠️ (annoncé en 3.5, non vérifié en jeu) Effet annoncé pour Vent Arrière : le
joueur avec le plus d'Initiative de l'équipe jouerait toujours en premier
dans un tour, le reste des règles d'ordre de jeu étant conservé. Ne pas
promouvoir en ✅ sans relevé en jeu.

## Ce qui a été tranché récemment

Pour mémoire, ces points **ne sont plus** des zones grises :

- ✅ **Le boss final compte pour 1 combat**, quel que soit le nombre de vagues.
  Le total reste à au plus 22 occasions de drop par run. Vérifié en jeu par
  Popo.
- ✅ **Les Souvenirs et le mode Entraînement ne donnent aucune récompense.**
  Ils ne doivent jamais compter dans les statistiques de Dofura.
- ✅ **Le combat final n'est plus "3 vagues de 4 boss"** — c'était le format
  d'avant la 3.5. Depuis, ce sont des vagues successives avec un seuil de
  validation, plafonnées à 5 / 15 / illimité selon la catégorie.
- ✅ **Les Bouclirêves sont exclusifs à leur palier.** Seul l'Étoile traverse
  toute la run.
- ✅ **La prospection ne touche que les cosmétiques** (boucliers, Diplôme de
  Feur) et les objets de quête, individuellement par personnage. Pas les
  reflets, ni les runes, ni les légendes.
- ✅ **Chaque légende tire indépendamment des 25 autres** — confirmé en jeu
  par Popo (tableau des butins de la salle, une ligne par légende). Le
  nombre de runs pour n'importe laquelle des 26 est donc environ 26 fois
  plus bas que pour une légende précise.
- ✅ **La Rune Légendaire est bien dropable aux paliers IV et V** (9 combats
  éligibles), pas seulement au palier IV. Tranché par Popo — le tableau
  `butin.md` était déjà correct.
- ✅ **Le nombre de combats par run est plafonné à 22, jamais un nombre
  fixe** — une Faveur Onirique ou le gobelin Gobséric peuvent le réduire.
  Leur fréquence d'apparition n'étant pas publiée par Ankama, aucun plancher
  fiable n'est calculable — voir `structure.md`.

## Comment lever une zone grise

1. Popo relève l'information en jeu, capture à l'appui.
2. Le fait passe en ✅ dans la fiche concernée.
3. Il sort de cette liste et rejoint la section "Ce qui a été tranché".

Ne jamais promouvoir un fait de ⚠️ à ✅ sur la base d'un raisonnement ou d'une
source secondaire. Seul un relevé en jeu compte.
