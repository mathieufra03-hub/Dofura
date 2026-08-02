# DOFURA — Cahier de refonte graphique & fonctionnelle

> Document de référence à donner à Claude Code pour implémenter la refonte.
> **Ne pas copier-coller les maquettes `.jsx` telles quelles** : elles contiennent du code jetable
> (barres de test, fausses données, chargement de police bricolé). Ce document décrit le QUOI ;
> Claude Code écrit le COMMENT proprement dans le vrai projet, en respectant le `CLAUDE.md`.

---

## 0. Comment utiliser ce document

1. Donner ce fichier + `dofura-tokens.css` à Claude Code.
2. Lui montrer les captures d'écran des maquettes correspondantes.
3. Lui demander d'implémenter **une page à la fois**, en validant au fur et à mesure.
4. Rappeler à chaque fois : « respecte mon `CLAUDE.md`, ne crée pas de fichier v2, mets les scripts dans `scripts/` ».

---

## 1. Direction artistique (identité visuelle validée)

### Couleurs (voir `dofura-tokens.css`)
| Rôle | Hex |
|---|---|
| Fond principal | `#0C0F1D` |
| Cartes / blocs (fond) | `#141A2E` à ~92 % d'opacité |
| Doré titres/logo (dégradé) | `#FFE08A` → `#DE9B1F` |
| Doré accent plein | `#FFC63D` |
| Cyan interactif (liens, boutons secondaires) | `#4DD8E6` |
| Magenta accent (rappel nébuleuses) | `#C44BC7` |
| Vert bonus (stats +) | `#4CC98D` |
| Rouge malus (stats −) | `#F26D6D` |
| Texte courant | `#E8EAF2` |
| Texte secondaire | `#B8BFD6` |
| Texte discret | `#7F8AA6` |

### Typographie
- **Logo + très grands titres** : `Cinzel Decorative` (Bold), en dégradé doré. Uniquement pour l'identité, JAMAIS pour le texte courant.
- **Titres de section** : doré **plein** `#FFC63D` (⚠️ pas de dégradé clippé sur mobile — voir §7 bug connu).
- **Tout le reste** : `Inter` (400 / 600 / 700).
- Charger les polices via Google Fonts (`<link>` dans le `<head>`), pas en `@import` fragile.

### Le fond « Krosmoz »
- Base `#0C0F1D` + nébuleuses diffuses (dégradés radiaux cyan / magenta / violet) + champ d'étoiles.
- **100 % CSS, aucune image** (dégradés radiaux + petits points pour les étoiles). Zéro souci de droits, ultra léger.
- Un voile sombre semi-transparent par-dessus la nébuleuse pour garantir la lisibilité.
- ⚠️ **Position `absolute`, pas `fixed`** (voir §7).

### Éléments d'identité Dofus
- Le **O de DOFURA** est un **œuf de dragon doré** avec une spirale (SVG original, aucun asset Ankama).
- Séparateurs / accents : les **6 Dofus primordiaux** dans leurs couleurs (Émeraude, Pourpre, Turquoise, Ocre, Ébène, Ivoire).

### Composants récurrents (à créer une fois, réutiliser partout)
- **Carte** : fond `#141A2E`/92 %, bordure dorée à 20 %, radius 16px. **Survol** : la bordure passe à 90 %, halo doré (`box-shadow`), léger `translateY(-3px)`.
- **Vignette carrée** (items, créatures, Dofus) : `minmax(136px, 1fr)` en grille auto-fill, icône centrée + nom + méta.
- **Tooltip** : au survol (desktop) / tap (mobile), mini-fiche flottante fond `#10152A`, bordure cyan.
- **Bouton primaire** : dégradé doré, texte sombre. **Bouton secondaire** : « fantôme » cyan (bordure + fond très léger).
- **Case à cocher de progression** : carré radius 7px, bordure dorée → cochée = fond dégradé doré + `✓` sombre.
- **Badge** : LÉGENDAIRE / BOSS = dégradé doré ; ARCHI = cyan ; QUÊTE = magenta.
- **Pastille de filtre actif** : dorée avec un `✕` pour retirer.
- **Barre de progression** : track `#1B2138`, remplissage dégradé doré (ou vert si 100 %).

---

## 2. Layout global (présent sur toutes les pages)

De haut en bas :
1. **Barre Almanax** (pleine largeur, tout en haut) : date du jour + bonus du jour + offrande + lien « Voir l'Almanax ». Données dynamiques quotidiennes (voir §5 point Almanax).
2. **Navbar** : liens de navigation à gauche, bouton **Connexion** (ou avatar/pseudo si connecté) à droite. Liseré doré fin en bas.
3. **Contenu de la page**.
4. **Footer** : mention obligatoire « DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games. » + « Certaines illustrations sont la propriété d'Ankama. »

### Navigation — 5 catégories (structure validée)
- **Équipements** (les panoplies sont une sous-section DEDANS, pas un onglet séparé)
- **Métiers** (contient ressources + la carte interactive des récoltes)
- **Donjons**
- **Bestiaire** (fusion des anciens Monstres + Zones : recherche par zone / sous-zone)
- **Quêtes**

> **Succès** n'est PAS dans la navbar : c'est une couche transversale (voir §4). Il a sa propre page accessible
> depuis l'espace perso et les liens contextuels, mais n'encombre pas le menu principal.
>
> Deux variantes de navbar ont été maquettées (menu à plat vs menu déroulant « Encyclopédie »).
> **Choix à trancher** selon le retour des testeurs — implémenter la variante retenue.

---

## 3. Page d'accueil (home)

- **Barre Almanax** en haut.
- **Hero** : logo `DOFURA` géant (œuf-O + Cinzel Decorative dégradé) + sous-titre « L'encyclopédie Dofus 3.0 ».
- **Barre de recherche globale** proéminente (halo cyan pulsant léger) avec **suggestions en direct** (autocomplétion sur la base). C'est l'outil n°1 du site.
- ~~Boutons sous la recherche~~ : **supprimés** (la recherche règne seule).
- Séparateur : les 6 Dofus primordiaux.
- **Mes favoris** (si connecté) : pastilles des quêtes/succès/donjons épinglés + lien « Tous mes favoris dans mon espace ». Si déconnecté : encart d'invitation à se connecter.
- **Grille « Explorer l'encyclopédie »** : cartes des catégories (Équipements, Métiers, Donjons, Bestiaire, Quêtes, Carte interactive).
- **La Chasse aux Dofus** (voir §6) : la section signature.

---

## 4. Le système de progression (LE cœur fonctionnel)

### Principe : une donnée, une seule source de vérité
Le joueur coche un élément **une seule fois**, et TOUTES les pages qui le référencent reflètent l'état.

**Table centrale `progression_joueur`** (à créer) :
```
progression_joueur (
  user_id,
  element_type,   -- 'quete_etape' | 'succes_objectif' | 'dofus_etape' | 'donjon_succes' ...
  element_id,
  fait,           -- booléen
  date_maj
)
```
Chaque page lit dans cette table pour afficher l'état des cases, et écrit dedans quand on coche.

### Règles de propagation
- **Quête** : chaque étape est cochable. Le % de la quête = étapes cochées / total.
- **Succès** : composé d'**objectifs**. Deux types :
  - `objectif_quete` → **auto-coché** dès que la quête liée est validée (lecture de `progression_joueur`, pas de coche manuelle possible). Case à **bordure pointillée**.
  - `objectif_manuel` → coché à la main par le joueur (« vaincre sans allié à terre »…). Case pleine.
- **Donjon** : ses succès et quêtes associés sont cochables sur la fiche donjon → se répercutent sur la fiche succès / quête correspondante, et inversement.
- **Dofus (Chasse aux Dofus)** : le % d'un Dofus se calcule automatiquement depuis les quêtes + succès liés cochés.

### Cross-linking (relations bidirectionnelles)
La force de la base relationnelle : **une seule relation en SQL, affichée des deux côtés.**
- Fiche **quête** → encadré « Donjon lié » + « Succès parent ».
- Fiche **donjon** → encadrés « Quêtes associées » + « Succès du donjon ».
- Fiche **succès** → objectifs-quêtes cliquables vers leur fiche.
- Fiche **item** → recette (ressources cliquables), panoplie, obtention (créatures cliquables → Bestiaire).

---

## 5. Pages liste (Équipements, Bestiaire, Quêtes, Succès)

**Structure commune** (créer un composant liste paramétrable, façon `ObjetsPage` existant) :
- Titre + compteur de résultats.
- Barre de recherche locale + menu de tri.
- Panneau de filtres (colonne gauche desktop / volet « Filtres (n) » sur mobile).
- **Pastilles de filtres actifs** supprimables au-dessus des résultats + « Tout effacer ».
- Résultats **classés sous des en-têtes** (le regroupement dépend du tri).
- Pagination classique en bas (meilleure pour le SEO que le scroll infini).

### Spécificités par page

**Équipements** (liste)
- Résultats en **vignettes carrées** (pas en lignes — trop dense sinon). Effets dans un **tooltip** au survol/tap.
- Tri : **A→Z** (défaut, en-têtes de lettres) / Niveau ↓ / Niveau ↑ / Par type. Le regroupement suit le tri (lettres, ou types, ou tranches de 50 niveaux).
- Filtres : Type (coiffe, cape…), Niveau (curseurs min/max), **Effets recherchés** (multi-sélection : Force, Vita, PA… → le filtre tueur), Avec panoplie, Légendaire.
- ⚠️ Panoplies fusionnées dans Équipements : la page item affiche la panoplie liée ; pas d'onglet Panoplies séparé.

**Bestiaire** (liste)
- Vignettes carrées + tooltip (zone, sous-zone, catégorie).
- Tri : **A→Z** / Par zone (en-têtes de zones). **Pas de tri par niveau.**
- Filtres : **Zone → sous-zone en cascade** (cocher une zone révèle ses sous-zones), **Catégorie** (4 cases : Boss de donjon / Archimonstre / Monstre de quête / **Monstre**), Niveau (curseurs, optionnel), recherche.
- Badges de catégorie sur les vignettes (BOSS doré, ARCHI cyan, QUÊTE magenta).

**Quêtes** (liste)
- Résultats en **lignes** (avec ★ favori, niveau, zone, nb d'étapes, badge catégorie).
- Tri : **Par zone** (défaut, en-têtes de régions) / Par niveau (tranches de 20) / A→Z. **Pas d'alphabétique par défaut.**
- Filtres : Catégorie (Principale / Secondaire / Répétable / Quête de Dofus) + Zone.

**Succès** (liste)
- Résultats en **lignes** avec **barre de progression** (succès = plusieurs objectifs), points, ★.
- Regroupé **par catégorie** (Quêtes, Donjons, Bestiaire, Métiers, Exploration, Élevage…).
- **Compteur global de points** en haut (si connecté).
- Filtres : Catégorie + case **« Masquer les succès accomplis »**.

---

## 6. La Chasse aux Dofus (section home + page dédiée)

- **Sur la home** : les 6 Primordiaux en vitrine + les autres Dofus, en **petits carrés**.
- **L'œuf EST la jauge** : il se remplit par le bas selon la progression (0 % = contour vide, 100 % = plein + halo + ✓). Pas de barre séparée.
- **Tri par niveau requis pour équiper** (pas par couleur). Ligne « Primordiaux » (les 6) puis tout le reste par niveau croissant.
- Compteur global « X / N Dofus » + case « Masquer les Dofus obtenus » (si connecté).
- Déconnecté : œufs grisés + invitation à se connecter.
- **Sur le vrai site : vraies images officielles des Dofus** (champ `img` depuis la base) + centrage dans le carré.
- **Page dédiée d'un Dofus** (à faire) : fond thématique ambiance (ex. Dokoko → décor Moon, léger, en transparence) + toutes les étapes à cocher (quêtes + succès liés) → calcule le %.
- ⚠️ Liste exacte des Dofus + niveaux requis : **à sortir de la base** (ne jamais inventer). Kaliptus retiré de la liste sur demande.

---

## 7. Fiches détail

**Fiche item** : en-tête (image + nom dégradé + niv/type + badge Légendaire) ; colonne principale = Effets (vert/rouge, fourchettes de jets), Conditions, Obtention (créatures cliquables) ; colonne contexte = Recette (ressources cliquables + tooltips), Panoplie (pièces + bonus par nombre d'items). Encadré **Sorts intégrés** (liseré doré) uniquement si légendaire. **Pas de ★ favori sur les items.**

**Fiche quête** : en-tête + ★ favori + barre de progression ; **étapes numérotées à cocher** ; colonne contexte = Prérequis, Récompenses (XP cyan / Kamas doré / item vert cliquable), **encadré « Donjon lié »** + **« Succès parent »** (cross-linking, liseré cyan, seulement s'ils existent).

**Fiche donjon** :
- En-tête (image boss + nom dégradé + niveau conseillé + zone + pierre d'âme). **Position PAS ici** (elle est dans Accès).
- **Accès** (juste sous l'en-tête) : position en encadré cyan qui ressort + description + recette de clé (ressources cliquables).
- **⚔️ Salle du boss = le bloc star** (encadré doré + halo) : **carte de la salle** (image depuis la base) + **stats du boss** (PV, PA, PM, résistances élémentaires, en grille) + résumé + mécaniques.
- **Monstres du donjon** : listing complet cliquable → Bestiaire (boss badgé).
- Colonne contexte = **Quêtes associées** (cochables) + **Succès du donjon** (cochables) + Butins (drops + taux).
- ⚠️ Le 4/6/8 joueurs a été **abandonné** (trop lourd en base pour peu d'utilité).
- ⚠️ **Mécaniques de boss** : rédigées par Popo / sous-agent Krag à partir de connaissances générales. **JAMAIS copier un autre site** (DPLN, Papycha… = contenu protégé).

**Fiche succès** : en-tête + ★ + points + barre de progression ; **objectifs mixtes** (objectif-quête auto-coché bordure pointillée / objectif-manuel case pleine) ; Récompenses (points, titre, kamas).

---

## 8. Espace perso (connecté) — à concevoir

Hub du joueur connecté : ses favoris (onglet complet), sa progression globale (Dofus, quêtes, succès), ses points de succès. Réutilise les composants de coche existants.
**Pour tester : simuler un compte connecté avec accès à toutes les fonctionnalités.**

---

## 9. Points de contrôle techniques (à vérifier pour que ça tourne bien)

### Bug connu à ne PAS reproduire
- **Fantômes de texte au scroll sur Android** : causé par `position: fixed` sur le fond + titres en dégradé clippé (`background-clip: text`).
  - ✅ Fond en `position: absolute`.
  - ✅ Titres de section en doré **plein** (garder le dégradé uniquement pour le grand logo, avec `-webkit-text-fill-color: transparent`).

### Performance
- Fond CSS pur (pas d'images de nébuleuse) → léger.
- Images d'items/créatures/Dofus : lazy-loading, format optimisé (webp), tailles adaptées aux vignettes.
- Pagination plutôt que scroll infini (SEO + perf).

### Base de données / relations
- Table `progression_joueur` centrale (§4) — indexer sur `(user_id, element_type, element_id)`.
- Les relations de cross-linking (quête↔donjon, succès↔quête, item↔ressource↔créature) existent déjà côté données : les exposer dans l'API pour affichage bidirectionnel.
- Filtre « effets recherchés » des équipements = jointure sur la table des effets (déjà relationnelle).

### Comptes utilisateurs (chantier à part)
- Auth sécurisée (hash des mots de passe, sessions/JWT, HTTPS).
- Table favoris : `(user_id, element_type, element_id)`.
- La progression et les favoris sont **par compte** → jamais en `localStorage` seul (le vrai suivi doit survivre au changement d'appareil).

### Almanax
- Données quotidiennes (bonus + offrande + Méryde du jour) : **source à brancher** (API ou table mise à jour chaque jour). ⚠️ Ne jamais afficher de valeurs en dur — elles changent chaque jour.

### Droits Ankama (rappel)
- Footer avec mention « fan-site non officiel » + « illustrations propriété d'Ankama » : **obligatoire, déjà prévu**.
- Ne pas redistribuer les assets en masse. Retirer tout contenu sur demande d'Ankama.
- Contenu rédactionnel (mécaniques, guides) : **100 % original**, jamais copié d'un autre fan-site.

### SEO (encyclopédie = trafic Google)
- URLs propres et lisibles (`/equipements/coiffe-du-bouftou`).
- Titres `<h1>` uniques par page, meta-descriptions générées depuis les données.
- Données structurées (schema.org) sur les fiches si possible.

---

## 10. Ordre d'implémentation conseillé

1. **Design tokens + layout global** (navbar, footer, fond, barre Almanax) — la fondation.
2. **Composants réutilisables** (carte, vignette, tooltip, case à cocher, barre de progression, filtres).
3. **Page liste générique** paramétrable → décliner Équipements, Bestiaire.
4. **Fiche item** (la plus vue).
5. **Système de progression** (`progression_joueur`) + comptes utilisateurs.
6. **Quêtes** (liste + fiche à cocher) → pose le pattern.
7. **Succès** (liste + fiche à objectifs mixtes).
8. **Donjons** (fiche + cross-linking).
9. **Chasse aux Dofus** + **pages Dofus** dédiées.
10. **Espace perso**.
11. **Métiers** + carte interactive.
