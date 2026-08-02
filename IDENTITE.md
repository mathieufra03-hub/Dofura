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

Historique des passes 3 à 8 (sections 6 à 21) : voir doc/HISTORIQUE-REFONTE.md

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
