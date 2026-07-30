# IDENTITE.md — Refonte visuelle Dofura

> Chantier du 30 juillet 2026. Fichier de référence : `maquette/dofura-maquette-v2.html`
> (lu intégralement, CSS repris comme source de vérité — voir CLAUDE.md règle 1, plan validé par
> Popo avant code). Fait en deux temps, pause après le premier, les deux validés par Popo.

## Ce que ce chantier a changé

1. **Tokens** (`frontend/src/tokens.css`) — nouvelle palette "astrale".
2. **Page d'accueil** (`frontend/src/pages/AccueilPage.jsx` + `frontend/src/pageAccueil.css`) —
   nouvelle page, remplace l'ancien Hero/EncycloGrid/ChasseDofus sur la route par défaut.
3. **Navigation** (`Navbar` dans `App.jsx`) — réduite à 4 entrées.
4. **Tracker Songes** (`frontend/src/pages/SongesPage.jsx`) — habillage seulement (couleurs), 0
   changement de logique.

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

## 3. Navigation (Navbar)

Réduite à 4 entrées : **Le Puits · Les Taux · Le Grimoire · Se connecter** — reprend
`nav`/`.brand`/`.links`/`.ghost` de la maquette (sticky, `height:68px`, fond translucide
`rgba(3,12,17,.7)` + `backdrop-filter: blur(20px) saturate(1.4)`, lien actif souligné cyan).

- **Le Puits** → tracker Songes (`browsing === "songes"`).
- **Les Taux** → pas de page dédiée. Clic déclenche `handleLesTaux` (`App.jsx`) : retour à
  l'accueil + incrémente un compteur `scrollTauxSignal` passé en prop à `AccueilPage`, qui fait
  défiler jusqu'à `#df-home-tiers` dans un `useEffect` (fonctionne même si on est déjà sur
  l'accueil, contrairement à un simple `scrollIntoView` synchrone qui n'aurait rien à attendre).
- **Le Grimoire** → `GrimoirePage`, inchangé.
- **Se connecter** → même mécanisme qu'avant (`LoginPanel`, JWT en `localStorage`), seul le
  bouton déclencheur est restylé en pilule cyan translucide (`.ghost` de la maquette) ; le
  panneau de connexion lui-même (formulaire) garde son ancienne palette dorée, **volontairement
  pas retouché** — hors périmètre de "nav + tracker Songes" (voir intro), rough edge visuel connu
  et assumé en attendant le chantier futur #1.

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

## Pièges rencontrés pendant ce chantier

- **Texte du titre invisible au premier test** : `.df-home` n'avait pas de `color` explicite. La
  maquette s'appuie sur `body { color: var(--txt) }` (règle globale du fichier maquette, jamais
  vue tant que je n'ai pas relu la section `body{...}` de son CSS) — ajouté `color: var(--df-text)`
  directement sur `.df-home`, plutôt que de toucher le `body` global du site (aurait dépassé le
  périmètre "page d'accueil" de la phase 1).
