# IDENTITE.md — Refonte visuelle Dofura

> Chantier ouvert le 30 juillet 2026, sur deux passes successives. Fichier de référence :
> `maquette/dofura-maquette-v2.html` (lu intégralement, CSS repris comme source de vérité — voir
> CLAUDE.md règle 1, plan validé par Popo avant code à chaque fois).
>
> **Passe 1** (30 juillet, matin) : tokens + page d'accueil (v1) + navigation à 4 entrées +
> habillage du tracker Songes — faite en deux temps, pause après le premier, les deux validés,
> commit poussé.
> **Passe 2** (30 juillet, après-midi) : révision de la page d'accueil (hero centré, chiffres dans
> leur propre section, nouvelle section "trois intensités" avec phrases de caractérisation) +
> retravail complet de la navbar (recherche, icônes, Discord, "Mon compte") + spec d'animation au
> survol commune à toutes les cartes/vignettes.
> **Passe 3** (31 juillet – 1er août 2026) : rebranding "Le Puits" → "Le Registre des Songes"
> (partout, y compris le titre de la page du tracker elle-même) ; construction d'une vraie page
> "Les Taux" (avec nouvel endpoint backend `/songes/taux`) pour remplacer le lien mort laissé par
> la suppression de la bande d'intensités en passe 2 ; artwork de la section "Trois outils"
> retravaillé (opacité, ancrage) ; illustration 16:9 + repli propre + survol sur les 3 cartes.
> Faite par petits lots avec allers-retours de réglage fin (notamment la position du titre du
> hero, ajustée 3 fois de suite sur retour visuel direct de Popo).
> Ce fichier est mis à jour en place à chaque passe plutôt que dupliqué, pour rester une référence
> vivante de l'état ACTUEL de la charte, pas un journal chronologique (ce rôle-là est déjà tenu par
> CLAUDE.md, chantiers en cours/fermés).

## Ce que ce chantier a changé

1. **Tokens** (`frontend/src/tokens.css`) — nouvelle palette "astrale". Confirmée inchangée en
   passe 2 (déjà conforme à la demande dès la passe 1).
2. **Page d'accueil** (`frontend/src/pages/AccueilPage.jsx` + `frontend/src/pageAccueil.css`) —
   nouvelle page, remplace l'ancien Hero/EncycloGrid/ChasseDofus sur la route par défaut. Révisée
   en passe 2 (hero centré, section chiffres séparée, section intensités réécrite).
3. **Navigation** (`Navbar` dans `App.jsx`) — réduite à 4 entrées en passe 1, restructurée en
   passe 2 (recherche, icônes, Mon compte, Discord — voir §3).
4. **Tracker Songes** (`frontend/src/pages/SongesPage.jsx`) — habillage seulement (couleurs), 0
   changement de logique.
5. **Animations d'interaction** (§5, nouveau en passe 2) — règle commune de survol pour toutes les
   cartes/vignettes cliquables du site.

Ce que ce chantier n'a **pas** touché (volontairement, hors périmètre) : les pages Grimoire,
Donjons, Quêtes, Succès, Chasse au Dofus, ni le panneau de connexion (`LoginPanel`) — toutes
gardent l'ancienne palette (`#FFC63D` or / `#4DD8E6` cyan en littéraux `rgba(...)`, pas de
variables). Elles restent fonctionnelles et accessibles (liens croisés entre fiches, Grimoire),
seulement retirées de la barre de nav. Leur restylage complet est le chantier futur #1 de
CLAUDE.md ("Refonte graphique complète du site").

## 1. Palette (`tokens.css`)

Seules les **valeurs** des variables `--df-*` ont changé, jamais leurs noms — tout ce qui utilise
déjà `var(--df-*)` hérite donc automatiquement de la nouvelle palette, sans toucher chaque page
une par une. C'est ce qui fait que Grimoire/Donjons/Quêtes/Succès n'ont pas eu besoin d'édition
pour prendre au moins les fonds/textes/bordures de base — seuls leurs `rgba(...)` écrits en dur
(littéraux, pas des variables) sont restés à l'ancienne teinte.

| Rôle | Variable | Avant | Après |
|---|---|---|---|
| Fond principal | `--df-bg` | `#0C0F1D` | `#030C11` |
| Fond secondaire | `--df-bg-2` | — (nouveau) | `#051B29` |
| Fond carte (RGB) | `--df-card-bg` | `20, 26, 46` | `7, 26, 36` |
| Fond carte au survol | `--df-card-hi` | — (nouveau) | `#0B2531` |
| Cyan (accent principal) | `--df-cyan` | `#4DD8E6` | `#2CE7FF` |
| Cyan secondaire | `--df-cyan-2` | — (nouveau) | `#7FE9E0` |
| Or (accent secondaire) | `--df-gold` | `#FFC63D` | `#F0C040` |
| Violet (nouveau) | `--df-violet` | — (nouveau) | `#C478FF` |
| Texte principal | `--df-text` | `#E8EAF2` | `#DCF2F7` |
| Texte secondaire | `--df-text-2` | `#B8BFD6` | `#86A9B5` |
| Texte discret | `--df-text-3` | `#7F8AA6` | `#55757F` |
| Bordure cyan | `--df-border-cyan` | `rgba(77,216,230,.35)` | `rgba(44,231,255,.15)` |
| Bordure cyan discrète | `--df-border-cyan-soft` | — (nouveau) | `rgba(44,231,255,.07)` |

**Intensités du Puits** (nouveau, utilisées sur l'accueil et prêtes pour un futur restylage de la
page Songes elle-même) : `--df-reve: #4DA6FF`, `--df-paradoxe: #C478FF` (alias de `--df-violet`,
même teinte que la maquette), `--df-cauchemar: #FF6B4A`.

**Deux nouvelles variables "canaux RGB"** ajoutées pendant la phase 2, même mécanisme que
`--df-card-bg` : `--df-cyan-rgb: 44, 231, 255` et `--df-gold-rgb: 240, 192, 64` — permettent
d'écrire `rgba(var(--df-cyan-rgb), 0.35)` au lieu de recopier la couleur en dur, utilisées pour
réhabiller les `rgba(77,216,230,...)` / `rgba(255,198,61,...)` figés du tracker Songes (voir §4).

**Typo** : `--df-font-logo` passe de `'Cinzel Decorative'` à `'Cinzel', 'Cinzel Decorative', ...`
(Cinzel en premier essai, Decorative en repli) — `index.html` charge maintenant les deux familles.
`--df-font-body` reste Inter, poids par défaut 300 introduit uniquement sur `.df-home` (voir §2),
pas encore étendu au reste du site.

## 2. Page d'accueil

Nouveau composant `AccueilPage` (fichier séparé, même logique que `SongesPage` : n'importe rien
d'`App.jsx`), rendu sur la route par défaut (`browsing === null`) à la place de l'ancien
Hero/EncycloGrid/ChasseDofus (code de ces trois-là **conservé**, juste plus jamais appelé — voir
§3). CSS scopé sous la classe `.df-home` dans `frontend/src/pageAccueil.css`, pour ne jamais
fuiter sur les autres pages (le fichier maquette utilise des sélecteurs de balise nus comme `nav`,
`h1`, `section`, ce qui aurait cassé tout le reste du site sans ce scope).

**Images** : les 2 artworks encodés en base64 dans la maquette ont été extraits et convertis en
WebP dans `frontend/public/assets/hero/` :
- `draconiros-plate.webp` (80 Ko) — image du hero, **préchargée** (`<link rel="preload">` dans
  `index.html`, `fetchpriority="high"`) puisqu'elle est visible immédiatement au chargement.
- `draconiros-quote.webp` (16 Ko) — image de la section citation, plus bas sur la page. Chargée
  **en différé** via `IntersectionObserver` (React state `quoteVisible`), posée en CSS custom
  property (`--df-home-quote-img`) consommée par `.quote-sec::before` — pas de `<img>` ici
  puisque c'est un fond, donc `loading="lazy"` natif ne s'applique pas.

**Effets reproduits fidèlement** (liste "ne pas simplifier" de la demande initiale) :
- Masques dégradés superposés (`.plate::after`, deux `linear-gradient` empilés) qui fondent
  l'image dans le fond.
- Titre qui chevauche le bas de l'image (`.hero-in { margin-top: clamp(-190px, -24vw, -140px) }`).
- Zoom lent 32 s sur l'image (`@keyframes df-home-float`, `animation-duration: 32s`).
- Apparition au défilement (`.rise` + `IntersectionObserver`, seuil 0.14, délai en cascade par
  groupe de 3 — porté de JS vanilla à un `useEffect` React).
- Halo pulsant autour du bouton "Ouvrir le Puits" (`.cta::after`, `@keyframes df-home-halo`).
- Barre de chiffres translucide (`.figs`, `backdrop-filter: blur(16px) saturate(1.3)`).
- Dégradé or → cyan → violet sur le mot "légende" du titre ET sur le logo `DOFURA` de la navbar
  (voir §3) — même dégradé (`linear-gradient(100deg, gold, cyan, violet)`), deux endroits.
- `prefers-reduced-motion: reduce` désactive toutes les animations/transitions de `.df-home` et
  fige `.rise` en position finale — repris tel quel de la maquette.

**Particules d'étoiles** : la maquette a son propre champ d'étoiles (`.stars`/`.star`, 52
particules `position:fixed`). Le site a **déjà** un champ d'étoiles global (`StarField`, 90
particules, rendu une fois dans `App.jsx` derrière toutes les pages) — pas dupliqué pour
`.df-home`, ça aurait superposé deux calques redondants. Décision prise pendant l'implémentation,
pas dans la demande initiale.

**Navigation depuis la page** :
- CTA "Ouvrir le Puits" + carte "Le Puits" → tracker Songes (`onNav("songes")`).
- Carte "Le Grimoire" → `GrimoirePage` (`onNav("grimoire")`).
- Lien "Voir les taux relevés" + carte "Les Taux" → pas de page dédiée (voir §3), fait défiler
  jusqu'à la bande "Dix intensités" plus bas sur la même page (`id="df-home-tiers"`,
  `scrollIntoView({ behavior:"smooth" })`).

### Révision passe 2 : hero centré, chiffres détachés, intensités réécrites

**Hero centré** : `.hero-in` passe en `display:flex; flex-direction:column; align-items:center;
text-align:center`, kicker/cta-row en `justify-content:center`, `h1`/`.lede` en `margin:0 auto` —
le chevauchement titre/bas d'image (`margin-top` négatif sur `.hero-in`) est conservé tel quel,
seul l'alignement horizontal change.

**Chiffres détachés dans leur propre section** (`.stats-sec`, juste après `</header>`, avant la
section des 3 cartes) : ils ne vivent plus dans `.hero-in`. Chaque `--stats-note--` porte
désormais la mention obligatoire **"Statistiques relevées en Paradoxe I"** sous la barre de
chiffres (texte donné tel quel par Popo, pas une donnée à vérifier — c'est lui qui définit à quelle
intensité ces chiffres de référence se rapportent). Rangée en **zigzag** (`.fig:nth-child(2) {
margin-top: 26px }`, désactivé en dessous de 640px où les cartes s'empilent) plutôt qu'en barre
plate — lecture de "les trois chiffres... décalés" : chaque carte de chiffre garde son propre
traitement `backdrop-filter` (au lieu d'une seule barre continue avec séparateurs internes comme en
passe 1), section remontée par un `margin-top` négatif sur son `.wrap` pour rester visuellement
reliée au bas du hero sans redevenir "collée" au titre.

**Section "trois intensités" réécrite** (même bande `#df-home-tiers`, contenu changé) : les
descriptions factuelles ("Trois paliers. Ni légendes, ni runes astrales.") remplacées par les
phrases de caractérisation fournies par Popo (Rêve/Paradoxe/Cauchemar), la ligne de métriques
(`% de butin`) gardée sous chaque phrase. Le paragraphe d'intro de la section explique une fois le
mot **"run"** ("Une run correspond à un songe complet, du palier I jusqu'au combat final") — la
seule page du site où ce mot apparaît : le tracker Songes lui-même ne dit jamais que "songe" (voir
`SongesPage.jsx`, commentaire d'en-tête) — cette page d'accueil est une exception assumée et
volontaire à cette règle, pas un oubli.

## 3. Navigation (Navbar)

Réduite à 4 entrées : **Le Puits · Les Taux · Le Grimoire · Se connecter/Mon compte** — reprend
`nav`/`.brand`/`.links`/`.ghost` de la maquette (sticky, fond translucide `rgba(3,12,17,.7)` +
`backdrop-filter: blur(20px) saturate(1.4)`, lien actif souligné cyan).

**Disposition en grille CSS 3 colonnes** (`grid-template-columns: 1fr auto 1fr`) plutôt que
flex+space-between : le menu central reste vraiment centré même si les zones gauche (logo) et
droite (compte/Discord) n'ont pas la même largeur — un flex row n'aurait pas garanti ça.

- **Logo** : agrandi (22px→27px) et plus espacé (`letter-spacing` 0.16em→0.24em), dégradé
  or→cyan→violet inchangé (déjà fait en passe 1).
- **Le Puits / Les Taux / Le Grimoire** : agrandis (13.5px→15.5px), chacun avec une icône en trait
  fin (`stroke-width:1.6`, pas d'emoji) — **les mêmes tracés SVG que les 3 cartes de l'accueil**
  (`IconePuits`/`IconeTaux`/`IconeGrimoireNav`, dupliqués plutôt que partagés entre les deux
  fichiers pour rester cohérent avec le reste du style du projet — pas de dossier de composants
  partagés dans ce codebase). Comportements de clic inchangés (voir ci-dessous).
- **Recherche discrète** (`NavSearch`, à côté du menu) : réutilise le state `query`/`results`/
  `loading` déjà câblé dans `App()` pour l'ancien `Hero` (mort depuis la refonte de l'accueil,
  jamais supprimé — voir §2) — même endpoint `/monstres?search=`, donc **recherche monstres
  uniquement** pour l'instant, pas le Grimoire complet (équipements/ressources/panoplies). Clic sur
  un résultat → `MonstrePage` comme avant. Étendre au Grimoire complet serait un chantier à part
  (changerait l'API consommée), pas fait ici.
- **Mon compte** (visible seulement connecté) : petit panneau (`MonComptePanel`) affichant juste le
  pseudo — `/auth/me` ne renvoie que `id`/`pseudo` (vérifié dans `main.py`), la vraie gestion de
  compte est la Phase 4 de la roadmap CLAUDE.md, pas commencée. Panneau volontairement minimal,
  pas une anticipation de fonctionnalités qui n'existent pas côté backend.
- **Connexion/Déconnexion** : mécanisme inchangé (`LoginPanel`, JWT en `localStorage`) ; le panneau
  de connexion (formulaire) garde son ancienne palette dorée, **volontairement pas retouché** —
  seul son bouton déclencheur est à la charte, rough edge visuel assumé en attendant le chantier
  futur #1.
- **Discord** (extrême droite) : icône `IconeDiscord` (tracé simple-icons, licence MIT) — seule
  icône en aplat plutôt qu'en trait fin de tout le site, un contour fin de la marque Discord ne se
  reconnaîtrait plus. Infobulle custom au survol ("Discord — contact & signalement de bug"), même
  mécanique JS (état local `survol`) que le reste de la navbar plutôt qu'un `:hover` CSS.
  **⚠️ URL placeholder** (`https://discord.gg/TODO-lien-a-fournir`) : Popo n'a pas encore donné le
  vrai lien d'invitation, jamais deviné (règle 13 + consigne système anti-invention d'URL) — à
  remplacer avant la mise en prod.
- **Almanax** : supprimé de l'affichage (bandeau `AlmanaxBanner` plus rendu, ni son `useEffect` de
  fetch — contrairement à Hero/EncycloGrid/ChasseDofus, il n'y avait aucun autre consommateur de
  cette donnée à préserver, donc l'effet de fetch a été retiré, pas juste débranché ; la fonction
  `AlmanaxBanner` elle-même reste définie, comme les autres composants "sortis mais pas supprimés").

**Sortis de la nav, code intact** : Donjons, Quêtes, et tout ce que le chantier Grimoire (29
juillet 2026) fusionnait déjà (Équipements/Ressources/Bestiaire/Panoplies). Toujours accessibles
via le Grimoire et les liens croisés entre fiches (ex. fiche monstre → "Apparaît dans" → donjon).
`Hero`/`EncycloGrid`/`ChasseDofus` (ancien contenu de la page d'accueil) et leurs sous-composants
(`DofuraEggO`, `SearchIcon`) restent dans `App.jsx`, simplement plus jamais appelés — supprimés de
rien, réutilisables si besoin.

## 4. Tracker Songes — habillage

Aucune logique touchée (états, appels API, handlers identiques à avant ce chantier — voir
SONGES.md pour la logique elle-même). Seuls des remplacements mécaniques de couleur :

- Tout ce qui référençait déjà `var(--df-cyan)`, `var(--df-gold)`, `var(--df-text)`, etc. a hérité
  automatiquement de la nouvelle palette dès la phase 1 (mise à jour de `tokens.css`), sans
  édition de `SongesPage.jsx`.
- Les couleurs écrites en dur (littéraux `rgba(77,216,230,X)` pour l'ancien cyan,
  `rgba(255,198,61,X)` pour l'ancien or, `rgba(20,26,46,X)` pour l'ancien fond de carte) ont été
  remplacées une par une par leurs équivalents tokenisés : `rgba(var(--df-cyan-rgb), X)`,
  `rgba(var(--df-gold-rgb), X)`, `rgba(var(--df-card-bg), X)` — mêmes valeurs d'opacité `X`
  conservées à chaque fois, seule la couleur de base change.

## 5. Animations d'interaction (survol)

Règle commune à toutes les cartes/vignettes cliquables du site (nouveau en passe 2) : léger
agrandissement + translation vers le haut + surbrillance de l'accent, transition 400-600 ms,
`cubic-bezier(.2,.8,.2,1)`.

- **Accueil** : les 3 cartes (Le Puits/Les Taux/Le Grimoire) — `.df-home .card:hover` passe de
  `translateY(-6px)` seul à `translateY(-6px) scale(1.015)`, transition déjà à `.55s
  cubic-bezier(.2,.8,.2,1)` (dans la fourchette demandée, hérité de la passe 1 sans besoin d'y
  toucher), surbrillance de bordure/fond déjà présente (`border-color`, `background`).
- **Tracker Songes** : nouvelle classe utilitaire `.df-hover-lift` dans `tokens.css`
  (`translateY(-2px) scale(1.03)`, `.5s cubic-bezier(.2,.8,.2,1)`, neutralisée sur les boutons
  `:disabled` et sous `prefers-reduced-motion: reduce`) — ajoutée en `className` à côté du style
  existant sur les 30 pilules/boutons de `SongesPage.jsx` (`sp.pill(...)`, `sp.btnVert`,
  `sp.btnVertPetit`, `sp.btnOrContour`, `sp.btnFantome`) via une poignée de remplacements groupés
  sur les préfixes communs plutôt que 30 éditions une par une. CSS pur (`:hover` natif), pas de JS
  ajouté : la vérification par navigateur automatisé de ce chantier tourne avec
  `prefers-reduced-motion: reduce` actif au niveau OS (confirmé via `matchMedia` en JS), donc le
  mouvement ne s'est pas vu à l'écran pendant le test — comportement voulu (la règle
  reduced-motion coupe bien la transition), pas un bug ; un navigateur normal sans cette
  préférence verra l'animation. Aucune fonction/handler touché, purement visuel.
- **Pas encore fait** : les vignettes du Grimoire (`.df-tile` dans `tokens.css`, encore sur
  l'ancienne transition `0.15s ease` sans easing/scale) et les autres pages hors périmètre de ce
  chantier (Donjons, Quêtes, Succès...). La demande dit "sur toutes les cartes et vignettes
  d'images du site" — un balayage sitewide dépasserait le découpage en 3 temps validé pour ce
  chantier (accueil / nav / tracker) et toucherait des pages que la règle 2 de CLAUDE.md ("un
  chantier à la fois") place plutôt dans le chantier futur #1 ("Refonte graphique complète").
  Signalé à Popo plutôt que tranché seul.

## 6. Passe 3 — rebranding, page Taux, artwork/cartes de l'accueil

**Rebranding "Le Puits" → "Le Registre des Songes"** : toutes les occurrences de "Puits"
remplacées dans `frontend/src/` (nav, cartes, lede, CTA, commentaires) — y compris le titre `<h1>`
de la page du tracker elle-même (`SongesPage.jsx`, "Suivi de Songes" → "Le Registre des Songes",
sur les deux écrans où il apparaît : principal et "connexion requise"), qui n'avait pas été touché
en passe 2 (seul un sous-titre avait été ajouté dessous). Sous-titre "Compte tes songes, traque tes
légendes" conservé tel quel.

**Nouvelle page "Les Taux"** (`frontend/src/pages/TauxPage.jsx`, cible `browsing === "taux"`) —
construite après clarification avec Popo : la carte "Les Taux" et le lien "Voir les taux relevés"
de l'accueil pointaient vers la bande d'intensités supprimée en passe 2, il n'existait aucune vraie
page/route "Taux" avant cette passe (contrairement à ce qui était supposé au départ).
- Nouvel endpoint public `GET /songes/taux?intensite=X&niveau=Y` (`main.py`), réutilise
  `charger_taux`/`item_eligible_intensite` déjà existants (aucune donnée dupliquée, aucun nouveau
  calcul de probabilité). **Renvoie les items un par un, pas groupés par `cle_taux`** — vérifié sur
  la base réelle avant d'écrire la requête (leçon CLAUDE.md #4 : ne jamais supposer qu'un domaine
  suit les conventions d'un autre) : plusieurs items partageant la même `cle_taux` (les 5
  "Bouclirêve ...") ont en réalité des `paliers` éligibles différents chacun (un seul palier
  chacun, un cle_taux "réservoir commun" réutilisé par tranche) — un regroupement naïf aurait
  affiché les mauvais paliers pour 4 objets sur 5 de ce groupe.
- **Donnée réelle limitée à Paradoxe I** : `songe_taux` ne contient pour l'instant que des relevés
  pour Paradoxe niveau 1 (vérifié en base avant de coder l'UI) — cohérent avec la mention déjà
  affichée sur l'accueil ("Statistiques relevées en Paradoxe I"). La page affiche donc "Pas encore
  de taux relevés en jeu pour [Intensité] [Niveau]" pour toute autre combinaison plutôt qu'un
  tableau vide ou une estimation — jamais d'extrapolation (règle 13).
- UI : sélecteur intensité/niveau (source `/songes/config`, comme le tracker), filtre par
  catégorie (mêmes 4 catégories que le tracker), liste d'items avec taux par palier éligible
  ("—" si le palier est éligible mais absent de la base), clic sur un item → fiche objet
  (`onSelectObjet`, même cross-link que partout ailleurs sur le site).
- Nettoyage en passant : l'ancien mécanisme de défilement (`scrollTauxSignal`, `handleLesTaux`,
  `onLesTaux`, `allerAuxTaux`) entièrement retiré d'`App.jsx`/`AccueilPage.jsx` — obsolète
  maintenant qu'une vraie destination existe, pas juste "pas encore utilisé".
- **"Les Taux" reste absent de la barre de nav** (règle explicite de la passe 2, non remise en
  cause par l'existence de la page) — atteignable uniquement depuis l'accueil pour l'instant.

**Artwork "Trois outils"** (`.outils-art`, `pageAccueil.css`) : opacité 0.32 → 0.60, ancrage vertical
`bottom:0` → centré (`top:50%; transform:translateY(-50%)`) — la version en passe 2 se faisait
couper par le bas de la section, quasi invisible derrière les cartes. Masques en dégradé, position
absolute, pointer-events none et le masquage sous 900px inchangés.

**Illustrations 16:9 sur les 3 cartes** (`CardArt`, `AccueilPage.jsx` + `.card-art`,
`pageAccueil.css`) — remplace l'ancien `.vignette-placeholder` (un seul bloc statique, présent
uniquement sur la carte Registre) : c'était directement la cause du bug d'alignement signalé
("le texte de la carte Registre décalé vers le bas par rapport aux 2 autres") — les 3 cartes ont
maintenant exactement le même bloc `<CardArt>`, donc la même hauteur de départ, donc un alignement
identique quel que soit l'état de chargement de l'image.
- Chemins référencés : `/assets/carte-registre.webp`, `/assets/carte-taux.webp`,
  `/assets/carte-grimoire.webp` — aucun n'existait au moment d'écrire le code (vérifié avant),
  `carte-grimoire.webp` déposé par Popo en cours de session et testé avec succès (image réelle
  affichée, `object-fit:cover`, coins arrondis en haut) pendant que les 2 autres retombent
  proprement sur le dégradé neutre.
- **Repli propre** : `onError` sur l'`<img>` passe un état React à `true`, qui retire l'`<img>` du
  DOM (pas de `src` cassé laissé dans le HTML) — le fond dégradé de `.card-art` (toujours présent,
  indépendant de l'image) reste seul visible. Jamais d'icône d'image cassée, testé avec 2 des 3
  fichiers absents.
- `loading="lazy"` sur les 3 `<img>`.
- **Survol** : zoom de l'image (`scale(1.05)`, `.4s cubic-bezier(.2,.8,.2,1)`, `overflow:hidden`
  sur `.card-art` pour ne jamais déborder du cadre arrondi) + halo `box-shadow` dans la couleur
  d'accent de la carte (`var(--c)`, déjà posée par carte) + bordure supérieure qui s'intensifie
  (`.card::before`, déjà existant depuis la passe 1, aucun changement nécessaire). Le tout déjà
  couvert par la règle `prefers-reduced-motion` globale existante (`.df-home *`) — pas de nouvelle
  media query à ajouter.

## 6bis. Passe 3, retouches — bande de cartes, repli, artwork de fond

Trois ajustements demandés juste après la passe 3, survol volontairement non touché (déjà validé).

**Bande d'illustration des cartes** (`.card-art`) : ratio 16:9 → 21:9 (bande large et basse plutôt
qu'un carré massif) — un seul changement de `aspect-ratio`, la hauteur des 3 cartes rétrécit d'autant
sans toucher au padding (le calcul reste piloté par la largeur de la carte, identique aux 3, donc
les hauteurs restent égales entre elles).

**Repli sans image** : dégradé remonté de `rgba(255,255,255,.06/.015)` à `rgba(255,255,255,.025/.006)`
— quasiment invisible sur le fond de carte (`#071A24`), la zone "se devine" plutôt que de faire un
bloc franc. Mécanisme `onError` inchangé.

**Artwork de fond, bord net corrigé** : le fondu vertical du haut (`.outils-art::after`) s'arrêtait à
14% de la hauteur de la boîte — mathématiquement un vrai dégradé, mais sur une boîte à hauteur
modeste (~30vw) ça se voyait comme une coupure nette plutôt qu'un fondu. Remonté à 48%. Diagnostic
fait par inspection directe (`getComputedStyle` sur `::after` en JS) avant de toucher au CSS : la
recette à 2 couches de `linear-gradient` dans une seule propriété `background` se composait
correctement (confirmé, les 2 couches apparaissent bien dans le style calculé) — le problème n'était
donc pas un bug de superposition de masques, juste un pourcentage de fondu trop court pour la
hauteur réelle de l'élément. Pas besoin de `mask-composite` : deux `linear-gradient()` empilés dans
`background` se comportent déjà comme des masques superposés (couches peintes dans l'ordre, celle du
dessus laisse voir celle du dessous à travers ses zones transparentes) — la piste suggérée par Popo
n'était pas la cause réelle, mais la vérifier explicitement (plutôt que la supposer) a évité de
réécrire un système qui fonctionnait déjà.

**Artwork de fond, taille/position** : `width` 55vw → 75vw (max-width 900px → 1200px). Ancrage
vertical : abandon du bloc à `aspect-ratio` fixe centré verticalement (`top:50%;translateY(-50%)`),
remplacé par `top:0;bottom:0` — la boîte occupe maintenant toute la hauteur de `.outils-sec`
(qui gagne `overflow:hidden` en même temps, pour un clippage propre contre les bords de la section).
Consequence : `background-size` passe de `contain` à `cover` sur `.outils-art::before` (l'image
doit maintenant remplir une boîte dont le ratio ne correspond plus forcément à son ratio natif
596:335, comme le fait déjà `.plate::before` du hero) — `background-position` ajusté à `left center`.
Reste inchangé : `position:absolute`, `z-index:-1` (sous le contenu), `pointer-events:none`,
`opacity:.6`, masquée sous 900px.

## 6ter. Passe 3, 2e retouche — artwork pleine largeur + flou, cartes ~35% moins hautes

**Artwork pleine largeur** : `width:75vw;max-width:1200px` → `left:0;right:0` (occupe toute la
largeur de la section, plus une largeur fixe calée à gauche). `filter:blur(3px)` ajouté sur
`.outils-art::before` (le calque image uniquement, pas le masque `::after`) — voulu par Popo pour
masquer la basse résolution du fichier source vu l'agrandissement, effet de profondeur de champ.
Reste inchangé : `position:absolute`, `z-index:-1`, `pointer-events:none`, `opacity:.6`, masques
dégradés (recette inchangée depuis 6bis), masquée sous 900px.

**Fondu du haut raccourci, en 2 temps** (retour Popo, PNG annoté de flèches sur la limite entre la
section chiffres et "Trois outils") : le fondu à 48% (posé en 6bis pour corriger le bord net)
cachait l'image jusqu'à quasi la moitié de la section — elle ne "touchait" jamais visuellement la
limite avec la section au-dessus. Remonté à 22% une première fois, encore insuffisant au retour
suivant de Popo ("les 2 [bords] doivent se toucher" — l'image devait littéralement rejoindre la
limite) → remonté à 6% (`transparent 6%` sur la couche verticale de `.outils-art::after`), fondu
minimal plutôt que progressif sur une grande distance, tout en gardant un léger blend (pas un
retour au bord net corrigé en 6bis).

**Cartes resserrées** (objectif ~40% de réduction de hauteur, donné par Popo) : padding
`30px 28px 32px` → `16px 18px 18px`, icône 44px → 30px (svg 20px → 14px, marge sous l'icône
22px → 8px), titre 19.5px → 15px, description 13.8px → 12px avec interligne 1.7 → 1.35 et
`-webkit-line-clamp:2` (jamais plus de 2 lignes, quel que soit le texte), marge avant le lien bas
20px → 8px. Bande d'illustration 21:9 → 32:9 (valeur donnée par Popo), marges négatives de
`.card-art` ajustées au nouveau padding. **Résultat mesuré** (`getBoundingClientRect`, avant de
toucher au CSS puis après) : 434px → 281px, soit **-35 %** — légèrement en dessous du ~40% visé,
gardé tel quel plutôt que de pousser le ratio de bande au-delà des "~32:9" donnés par Popo pour
gratter les derniers points de pourcentage. Aucun changement aux règles `:hover` (`.card:hover`,
`.card:hover::before/::after`, `.card:hover .go`, `.card:hover .card-art img`), toutes intactes.
Les 3 cartes restent à hauteur strictement égale (mesuré : les 3 à 280.875px).

## 6quater. Passe 3, 3e retouche — vraie cause du vide entre les deux artworks

Après 3 tentatives de resserrer marges/padding (sans effet, voir 6ter), diagnostic demandé et
posé avant tout code : **le vide n'était pas un problème d'espacement**. Les deux fondus
(`.plate::after` en bas du hero, `.outils-art::after` en haut de la section "Trois outils")
se terminaient chacun À L'INTÉRIEUR de leur propre boîte — jamais jusqu'au bord partagé. Mesuré en
direct dans le navigateur (`getBoundingClientRect`) : 110px d'écart net entre le bas de `.plate`
(déjà 100% invisible à ce point, son propre dégradé atteint `var(--df-bg)` plein à 100% de sa
hauteur) et le haut de `.outils-art` (dont le fondu ne commençait qu'à 6% de SA hauteur).

**Fix** (chevauchement réel entre les deux boîtes, pas juste réduction de l'espace) :
- `overflow: hidden` retiré de `.outils-sec` (c'est lui qui aurait coupé tout débordement vers le
  haut) — gardé sur `.plate` (pas concerné, l'image qui bouge est celle du bas). Pas besoin de
  `overflow-x` de secours : `.df-home` a déjà `overflow-x: hidden` en racine, aucune barre de
  défilement horizontale possible même sans le `overflow:hidden` retiré ici (vérifié :
  `scrollWidth === clientWidth` avant/après).
- `.outils-art` (le calque image, PAS `.outils-sec`) reçoit `margin-top: -200px` — déborde
  maintenant au-dessus de sa propre section, jusqu'à chevaucher la fin du fondu du hero.
- **z-index — piège réel rencontré** : `.outils-sec` héritait de `z-index: 1` via la règle
  générique `.df-home section`, ce qui en fait sa PROPRE pile d'empilement CSS. Un enfant à
  `z-index: -1` (`.outils-art`) ne peut réordonner sa position QUE dans la pile de son parent
  direct — il ne peut jamais "sortir" pour passer derrière une pile SŒUR (`.stats-sec`, elle aussi
  à `z-index: 1`) : deux piles à z-index égal se peignent dans l'ordre du DOM, entièrement l'une
  après l'autre, quel que soit ce qui se passe à l'intérieur. Sans correction, `.outils-art`
  aurait chevauché le bas de `.stats-sec` en s'affichant PAR-DESSUS ses cartes de chiffres.
  Fix : `.df-home .outils-sec { z-index: 0 }` (override, spécificité 0,2,0 > 0,1,1 de la règle
  générique) — fait passer toute la section derrière `.stats-sec` (z-index 1), sans effet visuel
  ailleurs puisque rien d'autre dans `.outils-sec` ne chevauche réellement `.stats-sec`.
  `.outils-art` garde son `z-index:-1` local pour rester sous le contenu de sa propre section.
- Fondu haut de `.outils-art::after` rallongé à ~26% avec un palier intermédiaire
  (`var(--df-bg) 0%, rgba(...,.7) 10%, rgba(...,.3) 18%, transparent 26%`) — un chevauchement de
  200px avec un fondu à 6% (~44px) se serait vu comme une bordure nette au milieu de la zone de
  recouvrement.

**Vérifié** : les 3 encadrés de chiffres restent parfaitement lisibles (fond translucide +
`backdrop-filter` déjà en place, inchangé) ; "Statistiques relevées en Paradoxe I" tombe presque
exactement sur le point le plus sombre du croisement des deux dégradés, donc reste lisible sans
voile supplémentaire ; les boutons "Ouvrir le Registre des Songes" et "Voir les taux relevés"
testés cliquables (`pointer-events:none` sur `.outils-art` seulement, jamais sur le contenu) ;
aucune barre de défilement horizontale. **Non vérifié visuellement à 1280px** : l'outil de
redimensionnement de fenêtre de cet environnement de test ne change pas réellement la largeur du
viewport rendu (limitation connue de la session) — vérifié en revanche qu'aucune valeur touchée
aujourd'hui (`margin-top`, les paliers du dégradé, le z-index) n'est en `vw`/`%` dépendant de la
largeur ; seul le seuil `@media (max-width:900px)` change le comportement, et il n'a pas été
modifié — donc le rendu à 1280px devrait être identique en proportion à celui vérifié à 1665px,
mais Popo devra confirmer à l'œil sur son propre écran.

## 6quinquies. Passe 3, 4e retouche — voile de couleur vs masque alpha

Le fix de 6quater (chevauchement des deux boîtes) a fait apparaître un nouveau symptôme : une
**bande sombre à bords francs** exactement à la jonction. Diagnostic donné par Popo, confirmé
correct : `.plate::after` et `.outils-art::after` étaient des **voiles de couleur** (dégradés vers
`var(--df-bg)`, un fond OPAQUE peint par-dessus l'image) plutôt que des masques de transparence
réelle. Superposés dans la zone de chevauchement, les deux voiles opaques recouvraient les DEUX
images en même temps — un voile ne "fond" pas une image dans une autre, il peint dessus.

**Fix** : la partie VERTICALE de chaque fondu est passée en `mask-image`/`-webkit-mask-image`
directement sur le calque (`.plate`, `.outils-art`) — un masque alpha rend l'image elle-même
transparente à cet endroit, laissant voir ce qu'il y a DERRIÈRE (l'autre image, ou le fond plein
là où il n'y a rien) plutôt que de peindre une couleur par-dessus.
- `.plate` : `mask-image: linear-gradient(to bottom, black 0%, black 55%, transparent 100%)`.
- `.outils-art` : `mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 80%,
  transparent 100%)`, et `margin-top` remonté de `-200px` à `-370px` — un masque a besoin d'une
  zone de croisement nettement plus large qu'un simple raccord de teinte pour ne pas se voir
  (**vérifié : chevauchement mesuré à 260px**, au-dessus du minimum de 250px demandé).
- Les fondus HORIZONTAUX (vignette gauche/droite de `.plate`, disparition à droite de
  `.outils-art`) restent des voiles de couleur dans leurs `::after` respectifs — gardés tels
  quels : ils ne posent pas ce problème (ils s'effacent vers le fond plein, jamais vers une autre
  image superposée, l'axe horizontal n'a jamais été concerné par la bande sombre).
- `filter: blur(3px)` reste sur `.outils-art::before` (l'image), `mask-image` sur `.outils-art`
  (le parent) — combinaison qui fonctionne sans conflit ici (flou et masque appliqués à des
  niveaux différents de l'arbre de rendu), pas eu besoin de les séparer davantage.

**Effet de bord assumé, pas corrigé** : `.plate::after` faisait auparavant DOUBLE usage — fondu du
bas ET assombrissement général de l'image pour la lisibilité du titre par-dessus (voir 6bis/passe
2 : "assombri de façon plus uniforme sur toute la hauteur... pour que le texte reste lisible
partout où il tombe"). Le masque alpha ne fait QUE rendre transparent, il n'assombrit rien tant
qu'il est à `black` (opaque) — entre 0% et 55%, l'image est donc maintenant **plus lumineuse/plus
détaillée derrière le titre qu'avant** cette passe. Reste lisible (ombre portée du texte déjà en
place), mais plus proche de la limite qu'avant. Pas retouché sans validation — signalé à Popo,
pas un problème que la consigne de cette passe demandait de résoudre.

**Vérifié** : plus aucune ligne horizontale sur toute la jonction (testé par capture d'écran,
zoom sur la zone exacte) ; chiffres et "Statistiques relevées..." toujours lisibles ; boutons
"Ouvrir le Registre des Songes"/"Voir les taux relevés" testés cliquables (pointer-events:none
inchangé sur les deux calques) ; aucune barre de défilement horizontale (mesuré :
`scrollWidth === clientWidth`). **1280px toujours pas vérifiable visuellement** dans cet
environnement de test (même limitation qu'en 6quater) — les valeurs touchées aujourd'hui
(`margin-top`, les paliers des masques) sont toutes en px fixes ou en % relatifs à la hauteur
propre de l'élément, aucune en `vw`, donc le comportement devrait suivre proportionnellement.

## 7. Passe 4 — nouveau rebranding, page /comprendre, stats remplacées

**"Le Registre des Songes" change de sens.** Ce nom désignait le tracker (rebrandé ainsi le
31 juillet, lui-même ex-"Le Puits"). Il désigne maintenant un AUTRE concept : une future page
d'historique des descentes (pas encore construite). Le tracker, lui, devient **"L'Œil de
Draconiros"** — nav (affiché en raccourci "L'Œil" seulement, pour ne pas alourdir le menu),
`SongesPage.jsx` (titre `<h1>` sur les deux écrans où il apparaît), hero de l'accueil (kicker
inchangé "Le grimoire de Draconiros" — accroche différente, pas concernée), CTA, carte 1 de
"Trois outils". Sous-titre du tracker inchangé : "Compte tes songes, traque tes légendes".
Icône de nav renommée en conséquence (`IconeRegistre` → `IconeOeil`, même tracé).

**Carte 2 de "Trois outils"** récupère le nom "Le Registre des Songes" pour ce nouveau sens
(historique), avec sa propre icône (`IconeHistorique`, nouveau — un cadran, plus adapté à
"historique" que l'ancien signe %). Elle **pointe vers le tracker en attendant** : aucune page
d'historique séparée n'existe (le tracker a bien un bloc "Historique des songes" intégré à son
écran principal, mais pas de page dédiée standalone) — signalé explicitement dans ce message
plutôt que d'inventer une route. Image `/assets/carte-historique.webp` référencée mais pas encore
déposée (repli neutre attendu, comme pour Les Taux/Le Grimoire avant que leurs fichiers arrivent).

**"Les Taux" remis dans la nav** (en était sorti le 31 juillet, sur demande explicite à l'époque)
— sa carte disparaît en revanche de la grille "Trois outils" (remplacée par "Le Registre des
Songes" ci-dessus) : elle vit maintenant dans le nouveau duo d'encadrés cliquables sous le hero
(voir plus bas) en plus de la nav.

**Stats de l'accueil supprimées** ("ces chiffres étaient faux", retour Popo) : `.stats-sec`,
`.figs`/`.fig`, la note "Statistiques relevées en Paradoxe I", et le lien secondaire "Voir les
taux relevés" du hero — tous retirés du JSX et de `pageAccueil.css` (CSS mort supprimé, pas juste
caché). CTA du hero réduit au bouton principal seul, texte adapté au nouveau nom du tracker.

**Deux encadrés cliquables** à la place, même emplacement, même traitement visuel que les anciens
encadrés de stats (fond translucide + `backdrop-filter`, bordure, arrondi — nouvelles classes
`.shortcut-sec`/`.shortcuts`/`.shortcut`, grille 2 colonnes, hauteur égale par défaut CSS Grid) :
- **"Calcule ton taux"** (+ sous-texte italique discret "En espérant qu'Ecaflip soit avec toi.")
  → `TauxPage` (`onNav("taux")`).
- **"Comprendre les Songes"** → nouvelle page `ComprendrePage.jsx` (cible `"comprendre"`,
  structure minimale : titre + "Page en cours de rédaction.", volontairement PAS dans la nav —
  atteignable uniquement via cet encadré). Contenu réel à venir, rien inventé en attendant
  (règle 13).
- Toute la surface de chaque encadré est cliquable (`<button>` englobant titre + sous-texte,
  même pattern que les cartes "Trois outils"), survol ajouté (translateY + bordure/fond, nouveau
  pour ces encadrés — les survols déjà validés ailleurs, cartes/artworks, n'ont pas été touchés).

## 8. Passe 5 — page Les Taux, cœur fonctionnel (31 juillet 2026)

Le squelette (tableau simple, filtre catégorie mono-sélection, sélecteur d'intensité) existait déjà.
Cette passe ajoute la partie demandée par Popo comme "le cœur de la page".

**Runes affichées sans être trackées.** 6 des 7 taux de runes/reliques (`dofura_songes_taux.json`)
n'ont pas d'item correspondant dans `songe_items_trackables` (pas de tracker joueur pour eux, décision
volontaire de Popo). Backend : `RUNES_HORS_TRACKER` (dict `cle_taux → nom en dur`) dans `main.py`,
fusionné dans la réponse `/songes/taux` avec `item_id: null`, `img: null`, `"synthetique": true`
(paliers éligibles dérivés dynamiquement des paliers réellement présents dans `songe_taux` pour cette
`cle_taux`, jamais codés en dur). "Rune astrale légendaire" volontairement exclue de ce dict : déjà
couverte par `songe_items_trackables`, l'ajouter aurait dupliqué la ligne. Catégorie `rune_astrale`
assignée aussi à "Reflet onirique" faute de catégorie dédiée — supposition à corriger si Popo en veut
une distincte. Frontend : pastille neutre (petit rond) à la place de l'image manquante, ligne non
cliquable (pas de fiche objet à ouvrir pour un item synthétique).

**Sélecteur de personnages (1-4, défaut 4)** : état local pur, ne redéclenche jamais de fetch — il ne
pilote que le calcul client de la colonne "1 tous les X songes", jamais les taux affichés eux-mêmes.

**Colonne calculée et lignes agrégées** : formule donnée par Popo, implémentée telle quelle côté
client (`calculerSonges()`, `TauxPage.jsx`) à partir des taux déjà reçus + `config.combats_par_palier`
(`/songes/config`) — pas de nouvel appel serveur au changement du sélecteur. Trois repères de contrôle
vérifiés avant publication (règle : ne rien publier si un contrôle ne tombe pas) : Légende d'Amayiro
seule (338 songes), agrégat "N'importe quelle légende" ×26 (13,5), agrégat "N'importe quelle légende
animale" ×4 (29). Les deux derniers chiffres donnés initialement par Popo (~350 et ~38) étaient des
estimations à la main non calculées — confirmés faux par Popo lui-même via une preuve croisée
indépendante (probabilité combinée légende OU légende animale, team de 4 = 9,5 songes, cohérent
uniquement avec 29 et pas 38). **`config/songes.py` corrigé en conséquence** : `COMBATS_PAR_PALIER`
palier 4 passe de 4 à 5 (total ~22 au lieu de ~21) — c'est cette valeur qui reproduit les repères,
l'ancienne ne les reproduisait pas. Lue par tout le reste du code (`estimer_esperance_runs`,
`/songes/config`) : une seule source de vérité, pas de table dupliquée pour ce chantier seul.
Arrondi d'affichage : 1 décimale sous 20 songes (distingue 13,5 de 14), entier au-dessus.

**Intensités sans données** : le `<select>` listait déjà les 10 intensités (bug perçu par Popo,
en réalité juste un message d'état vide trop générique) — texte remplacé par le message explicite +
bouton "Rejoindre le Discord" (lien placeholder, à remplacer par Popo).

**Mobile — défilement horizontal plutôt que tassement** (exigence explicite) : la carte objet (icône
+ nom, troncature par `…` au-delà de 180px) reste fixe, seule la zone numérique (paliers + colonne
songes) est `overflow-x: auto` / `flexWrap: nowrap` et scrolle indépendamment. Vérifié par un test
JS forçant un conteneur à 360px (scrollWidth 171 > clientWidth 90 → défilement confirmé, pas de
saut à la ligne) — pas de redimensionnement réel de fenêtre possible dans cet environnement de test
(limite déjà rencontrée aux passes précédentes).

## 9. Passe 6 — page Les Taux, regroupement par catégorie (2 août 2026)

26 lignes de légendes strictement identiques jugées trop répétitives. Compacté en une ligne par
catégorie, repliée par défaut, dépliable pour le détail item par item — remplace entièrement les
lignes agrégées ad hoc de la passe 5 (`LigneCategorie`/`LigneItem`, `TauxPage.jsx`).

**Généralisation de la formule.** L'ancien paramètre `multiplicateur` (valable uniquement quand
tous les items partagent le même profil de taux, ex. les 26 légendes identiques) est remplacé par
`calculerSongesItems(items[], ...)` qui boucle sur une LISTE d'items — mathématiquement identique
pour les profils homogènes, mais généralise aussi aux profils hétérogènes (Cosmétiques, où chaque
Bouclirêve a son propre taux par palier). Un seul chemin de calcul pour item seul / catégorie
agrégée, plus de logique dupliquée.

**Catégories uniformes vs variables** (`CATEGORIES_UNIFORMES`) : Légendes/Légendes animales ont un
taux identique pour tous leurs items → la ligne repliée affiche directement les pourcentages, plus
une ligne discrète "Si tu vises une [légende/animale] précise : ~X songes" (recalculée avec le
sélecteur de personnages). Cosmétiques/Runes ont des taux différents d'un item à l'autre (vérifié :
chaque Bouclirêve nommé a son propre palier et sa propre valeur) → "taux variables" affiché à la
place d'un chiffre qui n'existerait pas vraiment ; le détail par item reste la seule source des
vrais chiffres. Colonne "1 tous les X songes" agrégée calculable pour Cosmétiques (probabilité
qu'un cosmétique quelconque tombe) mais pas pour les Runes ("—" volontaire) : taux trop hétérogènes
(0,965 % à 6,72 %) pour qu'une agrégation ait un sens, décision explicite de Popo.

**Avertissement prospection**, sur la ligne Cosmétiques uniquement (jamais Légendes/Animales/Runes,
qui n'y sont pas soumises) : "⚠️ Ces taux varient selon la prospection de chaque personnage,
individuellement. Les valeurs ci-dessous sont les taux bruts affichés en jeu, sans prospection."
(texte corrigé le 3 août 2026 — "prospection du groupe" était factuellement faux, la prospection
qui influe sur les cosmétiques est celle du personnage individuel ; rendu en double avant cette même
date — un exemplaire toujours visible + un second dans le détail déplié — corrigé à un seul, toujours
visible.)

**Noms raccourcis** (`nomCourt()`, `PREFIXES_A_RETIRER`) : le préfixe "Légende de/du/d'" (Légendes)
et "Légende animale de " (Légendes animales) retiré à l'affichage seulement — jamais dans les
données ni dans le lien vers la fiche objet (toujours basé sur `item_id`, pas le nom affiché).
Corrige au passage la troncature par `…` de la passe précédente (noms devenus assez courts pour
tenir sans coupure). Extension à "Légendes animales" décidée par analogie avec la consigne explicite
sur "Légendes" (même rationnel : "la catégorie le dit déjà") — à confirmer avec Popo si ce n'était
pas voulu.

**Vérifié avant tout code (règle 13) : l'orthographe "Diplôme de Feur" était déjà correcte** dans
`dofura_songes_taux.json`, `dofura_items.json` et la base (`cle_taux: "diplome_feur"`, nom "Diplôme
de Feur") — aucune correction nécessaire, contrairement à ce que Popo craignait.

Six repères de contrôle vérifiés avant publication (4 personnages, Paradoxe I), tous exacts :
Légendes agrégées 13,5 · légende précise 338 · Animales agrégées 29 · animale précise 115 ·
Cosmétiques agrégés 171 · Bouclirêve Étoile seul 455.

## 10. Passe 7 — image carte 2, encadrés du hero translucides (2 août 2026)

**Image "Le Registre des Songes" déposée** (`/assets/carte-registre-songes.webp`, plateformes de
pierre + bassins cyan) — branchée sur `CardArt` (composant étendu avec un `className` optionnel,
`AccueilPage.jsx`) comme les cartes 1/3. Nettement plus claire que ses deux voisines (très sombres) :
essai à `brightness(.85)` jugé insuffisant à l'œil (toujours nettement plus lumineuse une fois les
3 cartes cote à cote), passé à **`brightness(.65) saturate(.9)`** (`.card-art--claire`,
`pageAccueil.css`) — grille visuellement équilibrée, comparé les deux versions avant de trancher
comme demandé.

**Encadrés du hero ("Calcule ton taux"/"Comprendre les Songes") retravaillés** — masquaient trop
l'artwork de Draconiros derrière eux :
- Hauteur réduite (~-30%) : padding 20px→14px, marge titre/sous-texte 8px→5px.
- Fond très translucide : `rgba(var(--df-card-bg), .35)` (token de surface existant, pas de couleur
  en dur) + `backdrop-filter: blur(8px)` — suffisant pour la lisibilité même sur les zones les plus
  claires de l'artwork (vérifié à l'écran, pas eu besoin de renforcer le blur au-delà de ce qui était
  demandé). Bordure `rgba(var(--df-cyan-rgb), .20)`.
- Barre d'accent à gauche par encadré (`::before`, couleur pilotée par la variable `--c` injectée en
  style inline sur chaque `<button>` — même mécanisme déjà en place pour `.card`) : cyan pour
  "Calcule ton taux", violet pour "Comprendre les Songes".
- Survol : bordure pleine couleur `--c`, halo (`box-shadow: 0 0 28px -8px var(--c)`), translation
  -2px (réduite depuis -4px). Transition déjà coupée sous `prefers-reduced-motion` par la règle
  globale `.df-home *` existante (ligne ~286) — rien à ajouter spécifiquement pour ces encadrés.

## 11. Passe 8 — accent orangé sur la carte Grimoire (2 août 2026)

Carte "Le Grimoire de Draconiros" (accueil) : accent violet (`var(--df-violet)`) remplacé par
`#FF6B4A` (bordure supérieure, halo de survol, icône, lien "Feuilleter →" — tous pilotés par la même
variable `--c` injectée en style inline sur la carte, un seul point de changement). **En dur, pas
`var(--df-cauchemar)`** (même teinte utilisée pour l'intensité Cauchemar sur la page Taux/le
tracker) : coïncidence visuelle uniquement, aucun lien sémantique entre les deux — les coupler
aurait fait dépendre le style de cette carte d'accueil d'un token d'intensité de jeu, risque de
régression croisée si l'un des deux change un jour indépendamment de l'autre.

## 12. Refonte du Grimoire des Secrets — focus Songes (2 août 2026)

Dofura est un outil de suivi des Songes : le Grimoire ne montre plus que ce qui sert en plein songe.
**Règle absolue tenue** : aucune donnée supprimée en base ni en JSON, uniquement de l'affichage masqué.

**Diagnostic avant tout code (validé par Popo avant d'écrire quoi que ce soit).** `categorie` monstre
n'est pas une colonne stockée mais calculée (`famille = 'Créatures Archimonstres'`/`'Créatures de
quête'`, ou jointure `donjons_monstres.est_boss`) — 4 932 monstres au total : 1 727 Monstre, 2 764
Créatures de quête, 306 Archimonstres, 135 Boss, **0 chevauchement** boss∩archi et boss∩quête. Effet
de bord vérifié avant de coder (mise en garde explicite de Popo) : un archimonstre/monstre de quête
est déjà une ligne distincte en base de son "monstre de base" (ex. Bouftou id 101 vs Bouftou Royal id
147 vs Bouftou transformé id 4746, trois lignes séparées, trois `famille` différentes) — masquer une
`famille` ne peut donc jamais masquer accidentellement une autre ligne.

**Masquage fait dans la construction de la requête, jamais dans `/monstres` lui-même** :
`grimoireParams` force `categorie=boss,monstre` par défaut (App.jsx). L'endpoint `/monstres` reste
inchangé et capable de renvoyer archi/quête — **partagé avec l'Archidex de la Chasse aux Dofus**
(`fetch ${API}/monstres?categorie=archi...`, App.jsx ~ligne 780) qui a explicitement besoin de ces
catégories ; les modifier au niveau de l'endpoint aurait cassé cette autre fonctionnalité. Filtre
"Catégorie" de l'aside réduit aux 2 valeurs autorisées (`categoriesDispo` filtré côté client après
l'appel à `/monstres/filtres`, lui aussi laissé générique). **1 862 monstres affichés** (135+1727),
confirmé à l'écran (pagination "Page 1/39", 48/page).

**Onglets Équipements/Ressources/Panoplies retirés** de `GRIMOIRE_TYPES` (App.jsx) — `ObjetsPage`/
`BestiairePage`/`PanopliesPage` et leurs routes backend intacts, juste plus atteignables depuis le
Grimoire (déjà le cas pour les 3 premières depuis le chantier Grimoire initial, seul le point d'accès
change ici). Toute la logique de filtres équipement/ressource/panoplie (états, effets, JSX de l'aside)
devenue morte a été retirée du corps de `GrimoirePage` — laisser ~15 states et 3 branches JSX mortes
aurait été plus fragile à maintenir que les retirer proprement.

**Nouvel onglet "Items de songe"** : les 38 items de `songe_items_trackables`, via l'endpoint déjà
existant `GET /songes/items-trackables` — aucun nouvel endpoint. Chargé une seule fois au montage
(ensemble fixe), recherche filtrée côté client (`songeFiltres`, `useMemo`). `item_id` renommé en `id`
à la réception pour matcher la forme attendue par `GrimoireTuile`/`onClicResultat` (même contrat que
`/objets`/`/monstres`/`/panoplies`). Clic sur un item de songe → panneau type "objet" (réutilise
`ObjetDetailPage` telle quelle, fiche + recette déjà là où elles existent).

**Découverte en testant (pas dans le diagnostic initial) : les 26 légendes/4 légendes animales sont
en réalité classées `super_type_nom = "Ressource"` (type "Ressource des Songes"), pas Équipement** —
la prémisse de Popo ("les légendes sont des équipements") ne correspond pas aux données réelles.
Signalé tel quel (règle 13) : ça ne change rien au résultat (l'onglet "Items de songe" les rend
accessibles indépendamment de leur catégorie objet réelle), juste une précision factuelle.

**Deux bugs préexistants trouvés en vérifiant les compteurs et en testant les fiches, corrigés au
passage (hors périmètre strict de la demande mais découverts en la vérifiant) :**
- `grimoireParams` plafonnait `niveau_max` à 999 par défaut pour les monstres — 4 monstres vont
  jusqu'au niveau 1600, le total du mode "Tout" affichait 1858 au lieu de 1862 (l'onglet "Monstres"
  dédié, qui recharge les vraies bornes via `/monstres/filtres`, affichait déjà le bon chiffre). Repli
  remonté à 9999.
- `has_recipe` renvoyé par `/objets/{id}` comme entier SQLite (0/1) au lieu d'un booléen (contrairement
  à `legendaire`, casté juste à côté) — `data.obtention?.length > 0 || data.has_recipe` évalue à `0`
  (pas `false`) pour un objet sans recette, et React affiche un `0 && (...)` littéralement comme texte
  "0" au lieu de rien. Repéré en ouvrant la fiche d'une légende (ressource sans recette propre,
  exactement le cas qui déclenche le bug) — `has_recipe` casté en `bool()` comme `legendaire`.

**Fond de page** (`/assets/fond-grimoire.webp`, déposé par Popo) : recette plus simple que
`.outils-art` de l'accueil (pas de jonction avec une autre image à gérer) — un seul calque
`.df-grimoire-bg` (`tokens.css`), vignette en `mask-image: radial-gradient` sur les 4 bords plutôt que
deux dégradés linéaires. `saturate(.6)` ajouté au filtre après comparaison à l'écran : l'image tire
vers le violet/rose, une tache assez visible à côté de la charte cyan du site une fois en place —
nettement mieux équilibrée avec le filtre. Conteneur (`GrimoirePage`, style inline) : `position:
relative` + `zIndex:0` pour contenir le `z-index:-1` du fond (même piège de pile d'empilement que
`.outils-art` à l'accueil, évité d'entrée cette fois).

## 13. Filtre Catégorie disponible depuis l'onglet "Tout" (2 août 2026)

Retour Popo : le filtre Catégorie (Boss de donjon/Monstre) n'existait que dans l'aside de l'onglet
Monstres dédié — `montrerFiltres` était figé à `activeTab === "monstre"`, donc aucun panneau Filtres
n'apparaissait en mode "Tout" (le point de départ par défaut de la page). Diagnostic express avant
correction (question posée à Popo pour confirmer) : la fonctionnalité était déjà bien codée, juste
invisible depuis "Tout" — pas un bug de logique, un trou de couverture d'un onglet.

`montrerFiltres` étendu à `"monstre" || "tout"`, mais Zone/Sous-zone/Niveau restent réservés à
l'onglet Monstres (aucun sens commun avec Items de songe, décision déjà actée) — seule la section
Catégorie s'affiche aussi en "Tout". Nécessite que `categoriesDispo` soit peuplé dès l'arrivée sur
"Tout" (onglet par défaut au chargement) : la requête `/monstres/filtres` de l'effet de changement
d'onglet se déclenche donc aussi pour `"tout"`, pas seulement `"monstre"`. `categoriesMonstre` propagé
à la requête de l'aperçu "Tout" (`grimoireParams("monstre", { categoriesMonstre })`, avant appelée
avec `{}` vide). Testé : filtre "Boss de donjon" depuis "Tout" → 135 résultats, badge BOSS correct,
chip + "Tout effacer" fonctionnels.

## 14. Renommage carte 3 + page Grimoire → "La Bibliothèque" (2 août 2026)

Carte 3 de l'accueil ("Le Grimoire de Draconiros" → "La Bibliothèque") et la page qu'elle ouvre,
renommées ensemble : titre `<h1>`, sous-titre, entrée de nav (`navLinks`/`NAV_LABEL_VERS_CIBLE`/
`NAV_ICONS`, App.jsx), `document.title`. Le surtitre du hero "LE GRIMOIRE DE DRACONIROS" (nom du site)
n'a pas été touché — vérifié qu'aucune des chaînes modifiées ne le recoupe. `EncycloGrid` (App.jsx
~ligne 543) garde encore "Grimoire des Secrets" en dur : composant jamais rendu nulle part (vérifié,
mort depuis la refonte visuelle) — non touché, hors du périmètre "ce qui est affiché".

**`document.title` : premier mécanisme du genre sur le site.** Aucune autre page ne pilote le titre
d'onglet aujourd'hui (le `<title>` statique d'`index.html` reste "frontend", jamais changé) — pas de
convention existante à réutiliser, `useEffect(() => { document.title = "..." }, [])` ajouté directement
dans `GrimoirePage`, sans nettoyage au démontage (aucune autre page ne réclame encore le titre après).

**Image `/assets/carte-bibliotheque.webp`** (bois, chandelles, tapis rouge) très chaude à côté des deux
cartes froides (cyan/bleu nuit) voisines — écart jugé trop violent même avec les valeurs suggérées
(`saturate(.85) brightness(.9)`, quasi invisible à l'écran une fois comparé). Poussé plus loin après
comparaison : **`saturate(.5) brightness(.75)`** (`.card-art--chaude`, `pageAccueil.css`) — l'image
reste identifiable comme une bibliothèque chaleureuse (différenciation volontaire, cohérente avec son
propos) mais ne "crie" plus à côté de ses voisines. Accent `#FF6B4A` de la carte (posé au chantier
précédent) conservé tel quel — devient cohérent avec l'image maintenant que celle-ci est chaude.

**`/assets/carte-grimoire.webp` (ancienne image) confirmée orpheline** — recherchée dans tout `src/`,
aucune référence restante (seule mention : celle-ci et le journal historique de sa mise en place).
Signalée à Popo, pas supprimée (il s'en charge).

## 15. Catégorie "Avis de recherche" (2 août 2026)

Diagnostic en deux temps demandé avant tout code : familles (`famille`) vérifiées une à une, aucune
ne correspond — mais le champ `race` (228 valeurs, jamais exploité pour les catégories jusqu'ici)
contient bien la donnée, éclatée en 5 variantes réelles (`Avis de recherche`, `de Frigost`, `alignés`,
`des Dimensions`, `de Sufokia` — 95 monstres au total, tous `famille = 'Créatures de quête'`, 0
chevauchement avec boss). Trouvé en local, l'étape B (DofusDB) n'a pas été nécessaire.

`main.py` : `"avis": "m.race LIKE 'Avis de recherche%'"` ajouté à `CATEGORIE_CONDITIONS`, et la
condition `"quete"` corrigée pour exclure ces 95 monstres (`AND m.race NOT LIKE 'Avis de recherche%'`)
— sans ça ils auraient compté dans les deux catégories à la fois, alors que le but est justement de
les extraire de "masqué" vers "visible". La condition `"monstre"` n'a pas eu besoin d'être touchée :
elle exclut déjà `famille = 'Créatures de quête'` en bloc, donc les avis (qui ont cette famille) en
étaient déjà exclus avant même l'ajout de la catégorie. `m.race` ajouté au `SELECT` de `liste_monstres`
(absent jusqu'ici, jamais utile) pour que `categorie_de()` puisse la lire — priorité badge boss > avis
> archi > quête > monstre. `CATEGORIES_MONSTRE_GRIMOIRE` (App.jsx) étendu à `["boss","monstre","avis"]`
— 1 862 → **1 957** confirmé (135+1727+95).

**Bug préexistant trouvé en testant le badge** (invisible jusqu'ici, jamais un 2e badge coloré
n'était apparu dans la Bibliothèque) : `GrimoireTuile` posait `<span className="df-tile-badge">`
sans jamais ajouter le modificateur de couleur (`CATEGORIE_BADGE_CLASSE[item.categorie]`) — un badge
non-"monstre" retombait donc toujours sur le style par défaut (doré, celui de BOSS). "AVIS" apparaissait
donc doré au lieu de vert. Corrigé (`badgeClasse` ajouté à la classe du span) — BOSS reste doré comme
avant (comportement inchangé), AVIS devient bien vert. Badge "AVIS" vert (`#8FE38A`→`#4CAF50`, texte
`#0A2A0C`), distinct de BOSS (doré), ARCHI (cyan), QUÊTE (magenta) — `.df-tile-badge-avis` (`tokens.css`).

**"Les deux pages" du §4 de la demande** : le filtre Catégorie était déjà unifié entre l'onglet "Tout"
et l'onglet "Monstres" de `GrimoirePage` depuis le chantier §13 (même `categoriesDispo`, même bloc
JSX) — aucune page séparée à dupliquer. `BestiairePage` (l'"ancienne page monstres avec pagination")
reste confirmée morte (jamais rendue nulle part, vérifié) — non touchée, hors périmètre "ce qui est
affiché". Vérifié à l'écran que les 3 cases (Boss de donjon/Avis de recherche/Monstre) sont identiques
sur les deux onglets de la Bibliothèque.

**Vérifications finales** (via `/monstres` direct + écran) : 95 (avis seul), 1727 (monstre seul, aucun
avis dedans), 1862 (boss+monstre sans avis), 1957 (les trois, = comportement par défaut sans aucune
case cochée) — tous exacts. Archimonstres/créatures de quête restent invisibles dans les deux cas.

## 16. La Bibliothèque devient un bestiaire pur — onglet Monstres retiré (2 août 2026)

Retour Popo : "La Bibliothèque doit être un bestiaire pur : monstres, boss, avis de recherche. Rien
d'autre." Les Items de songe ne s'affichent plus par défaut (hors recherche) — mais restent
accessibles via leur propre onglet et remontent avec les monstres dès qu'une recherche est saisie.

**Conséquence directe actée avec Popo (option (a) de son message) : l'onglet "Monstres" est retiré.**
Sans la section Items de songe affichée par défaut, "Tout" hors recherche et "Monstres" affichaient
exactement la même chose — deux onglets identiques, du bruit plutôt qu'un choix délibéré. "Tout"
reprend directement la pagination complète + les filtres (Zone/Sous-zone/Niveau/Catégorie) qu'avait
"Monstres" : un seul effet de fetch au lieu de deux (l'ancien aperçu "Tout" à 6 résultats + l'ancienne
pagination complète de "Monstres" fusionnés), un seul jeu de conditions `activeTab === "tout"` partout
(regions/sous-zones/niveau/catégorie, plus besoin de gérer "monstre" et "tout" comme deux cas
parallèles). `GRIMOIRE_TYPES`/`GRIMOIRE_PREVIEW`/`toutResultats`/`grimoireListe` devenus inutiles
(n'avaient de sens que pour l'ancien mécanisme à aperçus multiples) — supprimés plutôt que laissés
morts, conséquence mécanique directe de la fusion, pas un nettoyage à part.

**Items de songe en recherche uniquement, sans troncature** : la liste ne dépasse jamais 38 items, donc
plus besoin du plafond `GRIMOIRE_PREVIEW`/lien "Voir tout →" — tous les résultats correspondant à la
recherche s'affichent directement dans la section "Items de songe" au-dessus du bestiaire.

**Titre neutre** (§3 de la demande) : `Monstres {total}` → `Bestiaire {total}` — évite l'ambiguïté
relevée par Popo (filtrer sur "Avis de recherche" seul affichait "Monstres 95", alors que ce ne sont
pas des "Monstre" au sens du filtre Catégorie).

**Pagination vérifiée** (§4) : `PAGE_SIZE` reste 48 (pas 50 — la demande de Popo semble être une
valeur approximative dans son message, pas une consigne explicite de changement ; signalé, pas changé
sans confirmation). Total après filtrage confirmé à l'écran : 1 957 non filtré (page 1/41), 6 sur une
recherche texte ("bouclir" → 6 items de songe, bestiaire vide avec message "Aucun résultat"). Filtre
Catégorie/badges non touchés comme demandé.

## 17. Panneau resserré à Catégorie seule + 3e onglet "Sorts de songe" (2 août 2026)

**Filtres Zone/Sous-zone/Niveau retirés de l'interface** (pas du backend, demande explicite) : états
`niveauMin/niveauMax/niveauBounds/regions/sousZones/regionsDispo/sousZonesDispo`, l'effet de cascade
région→sous-zones et les blocs JSX correspondants supprimés de `GrimoirePage` — devenus morts dès lors
que plus aucun contrôle ne les alimentait. `grimoireParams("monstre", {...})` n'envoie simplement plus
`niveauMin/niveauMax/regions/sousZones` : ses repos par défaut (`niveau_min:1, niveau_max:9999`,
`region`/`sous_zone` vides) donnent exactement "aucun filtre", donc le bestiaire reste complet.
**Vérifié avant de toucher au backend** : `/monstres` et `/monstres/filtres` gardent tous leurs
paramètres intacts, aucune ligne backend modifiée. Seule consommatrice restante de ces paramètres
côté frontend : `BestiairePage`, confirmée morte (jamais rendue nulle part, vérifié par recherche
exhaustive) — aucune autre page live n'en dépend.

**Catégorie réordonnée à l'affichage** (`ORDRE_CATEGORIE_FILTRE = ["monstre","boss","avis"]`, distinct
de l'ordre de `CATEGORIE_LABELS` qui reflète la priorité des badges, boss en tête) — tri appliqué
côté client sur la réponse de `/monstres/filtres`, aucun changement d'ordre côté API.

**Panneau resserré** : largeur de la colonne aside réduite de 260px à 190px en style inline sur le
`div.df-list-wrap` (pas touché à la règle CSS globale, partagée avec d'autres pages) — la grille
récupère les ~70px libérés. Padding vertical de l'aside 20px→16px. Plus de grande boîte vide
maintenant que le contenu tient en 3 cases à cocher.

**Onglets renommés/réorganisés** : "Tout" → "Bestiaire" (id interne `activeTab` renommé `"tout"` →
`"bestiaire"` par cohérence — un futur lecteur du code n'aurait pas dû lire `activeTab === "tout"`
sous un bouton qui affiche "Bestiaire"). Nouvel onglet "Sorts de songe" entre Bestiaire et Items de
songe : `<button disabled>` natif (pas un style grisé appliqué à un bouton actif) — un bouton
`disabled` est automatiquement retiré du tab order par le navigateur, donc ni cliquable à la souris
ni focusable au clavier, sans piège de focus à gérer à la main. Vérifié à l'écran (Tab depuis
"Bestiaire" atterrit directement sur "Items de songe", jamais sur le bouton désactivé). Badge
"Bientôt" discret intégré au bouton, `aria-label` explicite pour les lecteurs d'écran. Aucune page
créée derrière — juste la place réservée, comme demandé.

## 18. Avis de recherche — liste blanche explicite (2 août 2026)

Signalement Popo : "Ilyzaelle n'apparaît pas dans le bestiaire" — diagnostic complet (voir échange),
conclusion : Ilyzaelle est en réalité correctement taguée boss (vérifié DB + API + capture d'écran),
le signalement ne s'est pas reproduit. En creusant la question plus large (bosses non rattachés à un
donjon), découverte séparée mais réelle : `race LIKE 'Avis de recherche%'` remontait **95 monstres**
alors que Popo confirme **24 avis de recherche réels en jeu** — heuristique trop large (5 variantes de
race, mais toutes les créatures qui les portent ne sont pas forcément encore actives/pertinentes).

**Liste blanche** : nouveau fichier `dofura_songes_avis.json` (24 noms, racine du projet, ajouté à la
liste des sources JSON de la règle 9 de CLAUDE.md) — contenu éditorial validé par Popo à la main, un
par un, pas un scrape. Chargé au démarrage comme `DONJONS_GUIDES_DATA`/`QUETES_GUIDES_DATA`
(`AVIS_RECHERCHE_NOMS`/`AVIS_RECHERCHE_SET`, `main.py`).

**Script de contrôle avant tout code** (demande explicite) : correspondance exacte testée un par un
contre `monstres.nom`, 21/24 trouvés du premier coup, 3 écarts typographiques identifiés et proposés à
Popo sans correction automatique (règle explicite "ne corrige pas tout seul") : `Culbutoeuf` →
**Culbutœuf** (ligature œ), `Homar Medali` → **Homard Medali** (lettre manquante), `Maxi-malle` →
**Maxi-Malle** (casse). Confirmés par Popo avant application.

**Collision trouvée en testant après application** (25 résultats au lieu de 24) : deux monstres
distincts nommés "Vengeuse Masquée" en base (id 2905 et 7949) — `m.nom IN (...)` les confondait tous
les deux. Vérifié sur `api.dofusdb.fr` (JSON brut, pas résumé) avant de trancher, à la demande de
Popo : les deux existent réellement et portent `isBounty: true`, mais seul l'id 2905 a la race
`Avis de recherche de Frigost` (raceId 90 chez DofusDB, "Frigost Wanted Notices") — le 7949 est classé
race générique `Monstres de quête` (raceId 50) malgré son flag `isBounty`. Condition finale :
`m.nom IN (liste blanche) AND m.race LIKE 'Avis de recherche%'` — la race sert ici de désambiguïsation
à l'intérieur de la liste blanche, pas de filtre principal (ne peut jamais réintroduire les 71 autres
exclus). Même correctif appliqué à `categorie_de()` (calcul du badge) pour rester cohérent.

**Découverte annexe, non exploitée pour l'instant** : `isBounty` est un champ officiel de l'API
DofusDB, potentiellement une source plus directe que la race pour identifier les avis de recherche à
l'avenir — mais son usage semble plus large que la seule race "Avis de recherche" (le 7949 l'a aussi).
À investiguer si un futur écart de comptage se reproduit.

**Vérifié après correctif** : avis seul → 24 (les 24 bons noms, aucun de plus) ; boss+monstre+avis →
**1 886** (confirmé, objectif de la demande) ; monstre seul et boss+monstre (sans avis) inchangés
(1727 et 1862) — la liste blanche n'a touché aucune autre catégorie.

## 19. Nettoyage des fiches monstre/boss — retrait Zone/Drops/Apparaît dans (2 août 2026)

Retour Popo : une fiche doit contenir ce qu'on vérifie en plein combat, rien de plus — Zone, Drops et
"Apparaît dans" n'ont pas de sens en songe (pas de zone d'origine, pas les drops habituels, seuls les
taux de songe comptent).

**Confirmé avant toute modification (précaution demandée) : un seul composant partagé.** `MonstrePage`
(App.jsx) sert identiquement les fiches monstre et boss — deux points d'appel (`GrimoirePanel` et
l'ancien accès direct), même fonction, même JSX. Retirer les trois blocs dans `MonstrePage` s'applique
donc automatiquement aux deux, comme voulu. Vérifié aussi qu'aucune autre page ne réutilise ce même
code : `DonjonDetailPage` a son propre bloc "Drops" totalement indépendant (tableau agrégé par donjon,
pas par monstre) — non touché, hors périmètre de cette demande.

**Retiré** : badge zone dans l'en-tête (`data.zones[0].nom`), bloc "Drops" (`data.drops`), bloc
"Apparaît dans" (`data.donjons`, liens vers les fiches donjon). **Conservé** : nom, image, badges
race/famille, sélecteur de grade, Stats, Résistances, Sorts (`SortsPanel`) — élément jugé le plus
important par Popo, non touché.

**Affichage uniquement, comme demandé** : `main.py` intact (endpoint `/monstres/{id}` continue de
renvoyer `zones`/`drops`/`donjons`, juste plus consommés par le JSX) — aucune donnée supprimée,
réaffichable un jour sans migration.

**Mise en page vérifiée à l'écran** sur un boss (Ilyzaelle) et deux monstres (un sans zone/drops
réels, un avec — "Bouftou des cavernes", pour confirmer que le retrait n'est pas juste une absence de
données) : rendu équilibré tel quel, aucun grand vide, espacements existants (`marginBottom:16` sur la
grille Stats/Résistances) suffisants sans resserrement supplémentaire.

## 20. Modifications de boss en songe — table + encadré "EN SONGE" + badge (2 août 2026)

Fichier `dofura_songes_boss_modifs.json` déposé par Popo (16 boss/zones, 34 lignes) : contenu éditorial
décrivant comment certains boss se comportent différemment en songe par rapport à leur version
classique. Demande explicite : **contrôle de correspondance en premier, montré avant tout affichage**,
avec 4 clés en doute (`Osavora`, `Chaloeil`, `Roi Nidas`, `Capitaine Meno`) — aucune corrigée seule.

**Résultat du contrôle** : `Roi Nidas` et `Capitaine Meno` correspondaient exactement. `Chaloeil` → pas
de correspondance exacte, candidat `Chalœil` (id 4263, même ligature œ que `Culbutœuf` au round Avis
de recherche) proposé et confirmé par Popo. `Osavora` → pas de correspondance monstre du tout, confirmé
par Popo être une zone : la modification s'applique à tous ses monstres, pas à un boss unique — ajout
d'un marqueur `"zone": true` dans le JSON, résolu via `zones`/`zones_areas` (16 monstres trouvés).

**Table `songe_boss_modifs`** (`init_db.py`) : volontairement classée table ENCYCLOPÉDIQUE (DROP
autorisé à chaque démarrage) malgré son préfixe `songe_`, qui d'habitude signale une table de données
joueur protégée — celle-ci ne contient aucune progression, uniquement du contenu régénéré depuis le
JSON source, donc n'appartient pas à `TABLES_UTILISATEUR_INTERDITES`. Contrôle de correspondance
automatique à **chaque** démarrage (pas seulement cette vérification manuelle) : toute clé future sans
correspondance déclenche un `⚠️ ATTENTION` au lieu de disparaître silencieusement. 49 lignes insérées
au final (34 lignes source − 1 ligne Osavora + 16 copies zone-étendues).

**Frontend** : encadré "EN SONGE" en haut de `MonstrePage` (accent violet Paradoxe `#C478FF`, masqué
si `data.modif_songe` est `null`) ; pastille violette discrète en coin haut-droit des tuiles du
bestiaire (`GrimoireTuile`) pour les monstres modifiés. **Vérifié à l'écran** sur Ilyzaelle (boss direct,
encadré + pastille) et Amphibouc (membre de la zone Osavora, confirme le mécanisme d'expansion par
zone) — rendu correct dans les deux cas, console propre.

## 21. Retrait du blur sur l'artwork "Trois outils" + fichier mal nommé (1er août 2026)

Popo a remplacé l'artwork basse résolution (596×335) de la section "Trois outils, aucun bavardage" par
une version haute résolution (~1456×819, proche du 1920×1081 annoncé — écart probablement dû à la
compression webp). Le `filter: blur(3px)` sur `.df-home .outils-art::before` (`pageAccueil.css`)
n'existait que pour masquer l'agrandissement d'une image basse résolution (voir round "Flou volontaire"
du 1er août) — retiré, plus nécessaire avec le nouveau fichier.

**Bug trouvé en vérifiant, sans rapport avec le blur lui-même** : le remplacement de fichier a atterri
sous `frontend/public/assets/acceuil-heros-portail.webp` (faute de frappe, "acceuil"), et dans
l'opération le fichier correctement nommé `accueil-heros-portail.webp` (référencé par la CSS) a été
supprimé (confirmé via `git status` : `D` sur le nom correct, `??` sur le nom fautif). Résultat :
l'artwork était en 404 silencieux sur le serveur de dev, invisible flou ou pas — impossible de juger le
retrait du blur avant de corriger ça. Fichier renommé pour retrouver le nom attendu par la CSS.

**Vérifié à l'écran** : artwork visible et net (scène de portail, deux personnages), comparé côte à
côte avec la bannière du haut (`hero/draconiros-plate.webp`, qui vérifié n'a jamais eu de `filter`
dans son CSS) — aucune différence de netteté perceptible entre les deux.

## Pièges rencontrés pendant ce chantier

- **Édition de `config/songes.py` sans effet observé en local** : le backend tournait via
  `python main.py` lancé en tout début de session, sans rechargement automatique — modifier un
  fichier `.py` importé au démarrage (`COMBATS_PAR_PALIER`) n'a aucun effet tant que le process n'est
  pas redémarré. Piège classique de ce projet (contrairement au frontend Vite, qui a du HMR) : après
  toute modification d'un fichier Python lu au démarrage, vérifier qu'un redémarrage du serveur a bien
  eu lieu avant de juger un résultat correct ou faux — le repéré ici via un chiffre affiché (363)
  correspondant exactement à l'ancienne constante, pas la nouvelle.
- **Texte du titre invisible au premier test** : `.df-home` n'avait pas de `color` explicite. La
  maquette s'appuie sur `body { color: var(--txt) }` (règle globale du fichier maquette, jamais
  vue tant que je n'ai pas relu la section `body{...}` de son CSS) — ajouté `color: var(--df-text)`
  directement sur `.df-home`, plutôt que de toucher le `body` global du site (aurait dépassé le
  périmètre "page d'accueil" de la phase 1).
