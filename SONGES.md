# SONGES.md — Suivi de Songes (Dofura)

> Spécification fonctionnelle et technique de la feature "Suivi de Songes".
> Destiné à Claude Code. Phase 1 uniquement (tracker personnel).
> Version 2 — juillet 2026. Toutes les données de jeu ont été relevées en jeu et vérifiées.

---

## 1. Objectif

Permettre à un joueur de **compter ses runs de Songes et d'enregistrer ses drops rares**, pour répondre à une question qu'aucun outil existant ne traite : *"ça fait combien de runs que je farme sans rien drop ?"*

Les taux sont extrêmement faibles. Pour une légende **précise** en Paradoxe I, il faut compter en moyenne **~1 400 runs en solo** ou **~350 runs en team de 4**. Avec des runs qui durent plus d'une heure, cela représente des centaines d'heures de jeu. Personne ne tient ce compte à la main.

**Différenciation Dofura** : le tracker est branché sur l'encyclopédie existante (~21 700 items). Chaque drop enregistré pointe vers une fiche item réelle et cliquable. Aucun concurrent (Dofzel, DofHub, DPLN, Dafous) ne propose de tracker — uniquement des guides statiques.

### Périmètre phase 1

| Inclus | Exclu (phases ultérieures) |
|---|---|
| Compteur personnel | Statistiques communautaires agrégées |
| Historique des drops | Comparaison entre joueurs |
| Sécheresse + moyennes | Partage Discord |
| Estimateur de runs restantes | Fenêtre flottante (PiP) |
| Multi-personnages et teams | — |

---

## 2. Prérequis Railway — ✅ FAIT (28 juillet 2026)

La persistance est en place et vérifiée. Rappel de la configuration pour référence :

- Projet Railway de production : **`faithful-delight`** (domaine `web-production-53f2b`)
- Volume monté sur `/data`, variable `DB_PATH = /data/dofura.db`
- `main.py`, `init_db.py` et les scripts lisent `os.getenv("DB_PATH", "dofura.db")`
- Au démarrage, l'API ne relance l'import que si la base est vide
- `init_db.py` protège explicitement `users`, `progression_joueur` et `favoris` du DROP (liste blanche vérifiée)

⚠️ **Conséquence en local** : `python main.py` ne régénère plus la base. Après modification d'un `dofura_*.json`, lancer `python init_db.py` à la main.

**Reste à faire** : sauvegardes automatiques (dump quotidien conservé hors Railway).

---

## 3. Règles du jeu (données vérifiées en jeu)

**Ne rien inventer au-delà de ce qui figure ici.**

### 3.1 Intensités — 10 au total

| Intensité | Bonus XP / Butin |
|---|---|
| Rêve I | 50 % |
| Rêve II | 75 % |
| Rêve III | 100 % |
| **Paradoxe I** | **120 %** |
| Paradoxe II | 140 % |
| Paradoxe III | 160 % |
| Paradoxe IV | 190 % |
| Cauchemar I | 220 % |
| Cauchemar II | 250 % |
| Cauchemar III | 300 % |

Les paliers ne sont pas symétriques (3 / 4 / 3). **Paradoxe I est l'intensité la plus jouée** — meilleur ratio temps/rentabilité. C'est la valeur par défaut de l'interface et la seule dont les taux sont actuellement relevés.

### 3.2 Structure d'une run

- **26 salles**, toujours. Mort définitive : une défaite termine le songe.
- Types de salles : Combat · Fontaine Onirique (achat de bonus) · Faveur Onirique (bonus aléatoire, salle "?") · Fin du rêve (boss final).
- Le boss final est un combat à vagues. Vagues à vaincre pour la victoire : 1 en Rêve, 3 en Paradoxe et Cauchemar. Les vagues supplémentaires rapportent davantage de Bribes de rêve.
- La progression suit une **carte en arbre** : à chaque étage le joueur choisit son chemin entre plusieurs salles.

**Sur les 26 salles, environ 21 sont des combats.** Les fontaines (une par transition de palier, plus une avant le boss) et les salles Faveur ne comptent pas. Le nombre exact varie légèrement d'une run à l'autre selon les chemins choisis — c'est un écart accepté, identique pour tous les joueurs.

### 3.3 Paliers et combats éligibles

| Palier | Nom | Salles | Combats (≈) |
|---|---|---|---|
| I | Les Pensées oniriques | 1 – 3 | 3 |
| II | Les Balades fantastiques | 4 – 9 | 5 |
| III | Les Espaces imaginaires | 10 – 15 | 5 |
| IV | Les Concepts brumeux | 16 – 21 | 4 à 5 |
| V | Les Abstractions chimériques | 22 – 26 | 4 |

### 3.4 Taux de drop — mécanique

Point vérifié et structurant : **le tableau des butins est identique pour toutes les salles d'un même palier**.

Un taux ne dépend donc que de deux variables : **l'intensité choisie** et **le palier**. Soit 10 × 5 = **50 combinaisons possibles**, une table de référence finie et exacte.

Autres constats :
- Le taux ne progresse pas linéairement avec la profondeur (le palier IV affiche des valeurs inférieures au III sur certains items) — la difficulté propre du palier prime sur l'étage.
- Le ratio entre catégories est constant (animale ≈ 2,85 × légende), ce qui confirme qu'un coefficient unique s'applique à tous les items d'une même salle.
- La prospection n'influe pas sur le drop des légendes.
- Le bonus d'XP reste fixe toute la run, contrairement au butin.

### 3.5 Table des taux — Paradoxe I (relevée en jeu)

| Item | Palier I | II | III | IV | V |
|---|---|---|---|---|---|
| Légendes (26) | — | — | 0,005 % | 0,005 % | 0,006 % |
| Légendes animales (4) | — | — | 0,016 % | 0,014 % | 0,017 % |
| Bouclirêve Étoile | 0,001 % | 0,003 % | 0,003 % | 0,002 % | 0,003 % |
| Bouclirêve du palier | 0,001 % | 0,003 % | 0,003 % | 0,002 % | 0,003 % |
| Diplôme de Feur | — | — | 0,003 % | 0,002 % | 0,003 % |
| Rune astrale légendaire | — | — | — | 0,965 % | 3,36 % |
| Rune astrale merveilleuse | — | — | — | 2,88 % | 6,72 % |
| Rune astrale épatante | — | — | 3,12 % | 5,76 % | — |
| Rune astrale majeure | — | — | 6,24 % | 8,64 % | — |
| Rune astrale moyenne | 2,4 % | 5,28 % | — | — | — |
| Rune astrale mineure | 4,8 % | 7,92 % | — | — | — |
| Reflet onirique | 100 % | 100 % | 100 % | 100 % | 100 % |

**Les 45 autres combinaisons (intensité × palier) sont inconnues.** Elles ne peuvent pas être déduites par calcul depuis les bonus de butin. L'interface doit afficher "données non disponibles" plutôt que d'extrapoler.

### 3.6 Règles d'éligibilité

- **Les légendes et légendes animales ne tombent qu'à partir du palier III**, et uniquement en intensité Paradoxe ou Cauchemar.
- Chaque palier a son Bouclirêve dédié : I Onirique · II Fantastique · III Imaginaire · IV Brumeux · V Infini. Le Bouclirêve Étoile tombe à tous les paliers.
- Les runes astrales sont segmentées par palier (mineure/moyenne en bas, légendaire/merveilleuse en haut).

### 3.7 Hors périmètre

Le mode **Souvenir** sert à rejouer des combats sans drop ni récompense : jamais tracké. Les **graines de songe** sont écartées (trop peu utilisées).

---

## 4. Items trackables

38 items. Recherche textuelle nécessaire, pas de grille de boutons.

### Légendes — 26 items, catégorie `legende`

Rykke Errel · Thanatena · Corruption · Mériana · Mille Lieues · Miroir · Helséphine · Cul Botté · Jahash Jurgen · Guerre · Oto Mustam · Servitude · Trompe-la-Mort · Crocobur · Henual · Brumaire · Brâm Barbe-Monde · Fallanster · Destin · Dame Jhessica · Misère · Buhorado · Menalt · Dodge · Ganymède · Amayiro

Toutes portent le préfixe "Légende de/du/d'" dans le jeu.

### Légendes animales — 4 items, catégorie `legende_animale`

Bakushana · Kwakarticho · Poukachi · Magicrabe

Toutes portent le préfixe fixe "Légende animale de" dans le jeu (contrairement aux légendes classiques, pas de variante de/du/d').

### Cosmétiques — 7 items, catégorie `cosmetique`

Bouclirêve Onirique (palier I) · Fantastique (II) · Imaginaire (III) · Brumeux (IV) · Infini (V) · Bouclirêve Étoile (tous paliers) · Diplôme de Feur (paliers III+, jeu de mots Ankama — pas une faute de frappe)

### Runes astrales — 1 item, catégorie `rune_astrale`

**Rune astrale légendaire** uniquement.

Les runes mineure, moyenne, majeure, épatante et merveilleuse tombent à des taux de 3 à 9 % : plusieurs fois par run. Les tracker n'a aucun intérêt statistique et alourdirait la saisie.

### Jamais trackable

Le **Reflet onirique** tombe à 100 % à chaque combat.

---

## 5. Modèle de données

Tables préfixées `songe_` pour ne pas polluer le schéma encyclopédique existant.

```sql
CREATE TABLE songe_personnages (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    nom           TEXT NOT NULL,
    classe        TEXT,
    serveur       TEXT,
    cree_le       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE songe_teams (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    nom           TEXT NOT NULL,
    cree_le       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE songe_team_membres (
    team_id       INTEGER NOT NULL REFERENCES songe_teams(id) ON DELETE CASCADE,
    perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, perso_id)
);

CREATE TABLE songe_runs (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id            INTEGER,
    date_run           TEXT DEFAULT (datetime('now')),
    intensite          TEXT NOT NULL,      -- 'reve' | 'paradoxe' | 'cauchemar'
    niveau             INTEGER NOT NULL,   -- 1..4 (max 3 pour reve et cauchemar)
    terminee           INTEGER NOT NULL DEFAULT 1,
    salle_atteinte     INTEGER NOT NULL DEFAULT 26,
    nb_combats         INTEGER NOT NULL,
    source_nb_combats  TEXT NOT NULL,      -- 'estime' | 'saisi'
    team_id            INTEGER,            -- indicatif, PAS la source de vérité
    note               TEXT
);

CREATE TABLE songe_run_participants (
    run_id        INTEGER NOT NULL REFERENCES songe_runs(id) ON DELETE CASCADE,
    perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id),
    PRIMARY KEY (run_id, perso_id)
);

CREATE TABLE songe_drops (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id        INTEGER NOT NULL REFERENCES songe_runs(id) ON DELETE CASCADE,
    perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id),
    item_id       INTEGER NOT NULL,        -- FK vers la table objets de l'encyclopédie
    quantite      INTEGER NOT NULL DEFAULT 1,
    palier        INTEGER,                 -- 1..5, optionnel
    cree_le       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE songe_items_trackables (
    item_id       INTEGER PRIMARY KEY,     -- FK vers la table objets
    categorie     TEXT NOT NULL,           -- 'legende' | 'legende_animale' | 'cosmetique' | 'rune_astrale'
    paliers       TEXT NOT NULL,           -- JSON, ex. "[3,4,5]"
    intensite_min TEXT                     -- 'paradoxe' pour les légendes, NULL sinon
);

CREATE TABLE songe_taux (
    intensite     TEXT NOT NULL,
    niveau        INTEGER NOT NULL,
    palier        INTEGER NOT NULL,
    categorie     TEXT NOT NULL,
    taux          REAL NOT NULL,           -- en pourcentage, ex. 0.006
    PRIMARY KEY (intensite, niveau, palier, categorie)
);
```

### Quatre règles de conception à ne pas contourner

**1. `songe_run_participants` est figé à la saisie.** La team n'est qu'un raccourci de remplissage. Si le joueur modifie sa team six mois plus tard, ses anciennes runs ne doivent pas changer.

**2. On stocke des faits bruts, jamais des résultats calculés.** Pas de colonne `secheresse_actuelle`. Tout se recalcule depuis l'historique.

**3. `source_nb_combats` est obligatoire.** Il distingue une valeur estimée d'une valeur saisie, pour permettre un recalcul propre si la constante change.

**4. `songe_taux` n'est pas rempli par extrapolation.** Seules les valeurs relevées en jeu y figurent. Une combinaison absente signifie "inconnu", jamais "estimé".

---

## 6. Configuration

Fichier `config/songes.py`. **Aucune de ces valeurs ne doit être écrite en dur ailleurs.**

```python
NB_SALLES_PAR_RUN = 26

# Nombre de salles de combat par palier sur une run complète.
# Les fontaines et salles Faveur ne sont pas des combats.
# Valeurs moyennes relevées en jeu — le chemin choisi fait légèrement varier le total.
COMBATS_PAR_PALIER = {1: 3, 2: 5, 3: 5, 4: 4, 5: 4}   # total ≈ 21

PALIERS = {
    1: {"nom": "Les Pensées oniriques",        "salles": (1, 3)},
    2: {"nom": "Les Balades fantastiques",     "salles": (4, 9)},
    3: {"nom": "Les Espaces imaginaires",      "salles": (10, 15)},
    4: {"nom": "Les Concepts brumeux",         "salles": (16, 21)},
    5: {"nom": "Les Abstractions chimériques", "salles": (22, 26)},
}

INTENSITES = {
    "reve":      {"niveaux": [1, 2, 3],    "bonus": {1: 50,  2: 75,  3: 100}},
    "paradoxe":  {"niveaux": [1, 2, 3, 4], "bonus": {1: 120, 2: 140, 3: 160, 4: 190}},
    "cauchemar": {"niveaux": [1, 2, 3],    "bonus": {1: 220, 2: 250, 3: 300}},
}

INTENSITE_DEFAUT = ("paradoxe", 1)
```

---

## 7. Calcul des tirages éligibles — point critique

**Un item ne peut pas être compté sur tous les combats d'une run.**

Le Bouclirêve Onirique ne tombe qu'au palier I, soit ~3 combats par run. Les légendes uniquement aux paliers III à V, soit ~13 combats. Compter la sécheresse sur le total des combats donnerait un chiffre faux, parfois d'un facteur 5.

**Règle** : pour chaque item, on ne compte que les combats des paliers où il est éligible.

```
tirages_eligibles(item, run) =
    somme des COMBATS_PAR_PALIER[p] pour chaque palier p où l'item est éligible
    ET atteint pendant la run
    × nombre de participants à la run
```

Deux conséquences :
- Une run avortée au palier II ne compte **aucun** tirage pour une légende.
- Chaque personnage a sa propre chance de drop : une run à 4 vaut 4 fois plus de tirages qu'une run solo. Ne jamais confondre "combats" et "tirages".

C'est le calcul qui distingue un tracker sérieux d'un compteur naïf, et aucun concurrent ne le fera correctement.

---

## 8. API (FastAPI)

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/songes/config` | Intensités, paliers, constantes — le frontend ne code rien en dur |
| GET | `/songes/items-trackables` | Items trackables enrichis (nom, image) depuis l'encyclopédie |
| GET / POST | `/songes/personnages` | Lister / créer un personnage |
| GET / POST / PUT / DELETE | `/songes/teams` | Gérer les préréglages de team |
| POST | `/songes/runs` | Enregistrer une run et ses drops |
| DELETE | `/songes/runs/{id}` | Annuler la dernière run saisie |
| GET | `/songes/historique` | Historique paginé des drops |
| GET | `/songes/stats` | Statistiques calculées (voir §9) |
| GET | `/songes/estimation` | Espérance de runs pour un item et une composition donnés |

`POST /songes/runs` — corps attendu :

```json
{
  "intensite": "paradoxe",
  "niveau": 1,
  "terminee": true,
  "salle_atteinte": 26,
  "participants": [1, 2, 3, 4],
  "drops": [
    { "perso_id": 2, "item_id": 12345, "quantite": 1, "palier": 5 }
  ]
}
```

Le backend calcule `nb_combats` depuis `salle_atteinte` et `COMBATS_PAR_PALIER`. `source_nb_combats` vaut `estime`, sauf saisie manuelle explicite.

---

## 9. Statistiques

Toutes segmentées par intensité, disponibles en deux vues : **par personnage** et **par team**.

- **Sécheresse actuelle** : tirages éligibles écoulés depuis le dernier drop, par item ou par catégorie
- **Record de sécheresse** : plus longue série de l'historique
- **Moyenne personnelle** : tirages / drops, par catégorie
- **Estimateur** : espérance du nombre de runs pour un item donné, calculée depuis `songe_taux` et la composition de team. Ne dépend d'aucune donnée communautaire, fonctionne dès le premier jour.
- **Indicateur de malchance** : comparaison entre la sécheresse actuelle et l'espérance théorique

### Ordres de grandeur (Paradoxe I, ~13 combats éligibles par run)

| Objectif | Solo | Team de 4 |
|---|---|---|
| Une légende, n'importe laquelle | ~55 runs | ~14 runs |
| Une légende précise | ~1 400 runs | ~350 runs |
| Une animale précise | ~450 runs | ~110 runs |
| Bouclirêve Étoile | ~2 300 runs | ~570 runs |

⚠️ Les compteurs afficheront naturellement des valeurs à quatre chiffres (`1 847 tirages sans légende`). C'est **attendu**, ce n'est pas un bug. L'interface doit le contextualiser, sinon l'utilisateur croit que le site est cassé.

---

## 10. Frontend

### Architecture

`App.jsx` est déjà très chargé. **Créer un composant séparé** `frontend/src/pages/SongesPage.jsx`. Réutiliser les tokens de `dofura-tokens.css`.

### Design (charte Krosmoz Espace)

| Usage | Couleur |
|---|---|
| Fond | `#0C0F1D` |
| Cartes / surfaces | `#141A2E` |
| Interactif, liens | `#4DD8E6` |
| Action positive | `#4CC98D` |
| Sécheresse, alerte | `#F26D6D` |
| Bordures | or + hover glow |

### Écran principal — une page, pas un formulaire

1. **Chiffre héros** — la sécheresse, en très grand. Le joueur peut épingler un item précis ; c'est alors sa sécheresse sur cet item qui s'affiche.
2. **Contexte** — deux pastilles compactes : team et intensité, conservant la dernière valeur utilisée.
3. **Action** — `Run terminée` (vert, le plus gros, cas à 95 %) et `J'ai drop quelque chose` (contour or).
4. **Historique** — liste chronologique, chaque entrée renvoyant vers la fiche item de l'encyclopédie.

### Écran d'ajout de drop

Champ de recherche + filtres par catégorie + sélection du personnage concerné.

### Deux exigences non négociables

- **Deux clics maximum** pour enregistrer une run sans drop
- **Bouton d'annulation** visible sur la dernière action enregistrée

---

## 11. Authentification

Dofura dispose déjà d'un système de comptes fonctionnel (`/auth/me`, tables `users`, `progression_joueur`, `favoris`), désormais persistant. **Le tracker s'appuie dessus** plutôt que sur un identifiant navigateur : le joueur retrouve ses données sur tous ses appareils.

Le champ `user_id` est présent sur toutes les tables du tracker.

---

## 12. À compléter

- [x] `item_id` réels des 38 items trackables dans la base encyclopédique — voir `dofura_songes_items.json`
- [ ] Taux des 45 autres combinaisons intensité × palier (relevé en jeu uniquement)
- [ ] Sauvegardes automatiques de la base
- [ ] Vérifier si le Diplôme de Feur appartient à la panoplie d'apparat ou aux costumes

---

## 13. Rappels projet

- L'URL de l'API vient de `import.meta.env.VITE_API_URL` (variable Vercel), plus de `const API` à modifier avant push
- `dofura.db` reste dans `.gitignore`
- Écriture de fichiers via scripts Python ou VS Code, jamais en commandes PowerShell multilignes
- Scripts lancés depuis la racine du projet
- Après modification d'un `dofura_*.json` en local : relancer `python init_db.py`
- Principe DRY : un composant paramétré plutôt que des duplications
