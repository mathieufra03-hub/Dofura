# SONGES.md — Suivi de Songes (Dofura)

> Spécification fonctionnelle et technique de la feature "Suivi de Songes".
> Destiné à Claude Code. Phase 1 uniquement (tracker personnel).
> Version 2 — juillet 2026. Toutes les données de jeu ont été relevées en jeu et vérifiées.
> Version 3 (29 juillet 2026) : refonte interface suite aux retours d'usage — voir §9/§10 et le changelog en bas de fichier.

**⚠️ Vocabulaire (règle absolue depuis la refonte interface) : dans toute l'interface, on ne dit jamais "run" mais "songe".** Un songe = la partie complète (26 salles). "Run" reste uniquement en base (`songe_runs`, `run_id`...) et dans le code (variables, noms de fonctions) — jamais dans un texte visible par le joueur.

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
    note               TEXT,
    duree_secondes     INTEGER,            -- chronomètre optionnel, refonte interface (29 juillet 2026)
    vague_finale       INTEGER,            -- combat final à vagues, optionnel, bornée par VAGUES_REQUISES[intensite]
    nombre_tours       INTEGER             -- optionnel, sans lien avec vague_finale
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
    categorie     TEXT NOT NULL,           -- 'legende' | 'legende_animale' | 'cosmetique' | 'rune_astrale' — AFFICHAGE uniquement
    cle_taux      TEXT NOT NULL,           -- FK logique vers songe_taux.cle_taux — CALCUL uniquement
    paliers       TEXT NOT NULL,           -- JSON, ex. "[3,4,5]"
    intensite_min TEXT                     -- 'paradoxe' pour les légendes, NULL sinon
);

CREATE TABLE songe_taux (
    intensite     TEXT NOT NULL,
    niveau        INTEGER NOT NULL,
    palier        INTEGER NOT NULL,
    cle_taux      TEXT NOT NULL,
    taux          REAL NOT NULL,           -- en pourcentage, ex. 0.006
    PRIMARY KEY (intensite, niveau, palier, cle_taux)
);

-- Refonte interface (29 juillet 2026) : archive alimentee UNIQUEMENT par
-- "Tout supprimer" (§10). Donnee utilisateur reelle, protegee au meme titre
-- que les 6 tables songe_* ci-dessus (jamais de DROP, voir regle 5 plus bas).
CREATE TABLE songe_journal (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    item_id       INTEGER NOT NULL,        -- FK vers la table objets
    palier        INTEGER,
    date_drop     TEXT                     -- date du drop ORIGINAL (songe_drops.cree_le conserve), pas la date d'archivage
);
```

**`categorie` vs `cle_taux` — ne pas confondre :**
- `categorie` (4 valeurs) sert à l'**affichage** et aux filtres de l'interface (légende / légende animale / cosmétique / rune astrale) — c'est le regroupement que voit le joueur.
- `cle_taux` (plus fin, une valeur par profil de taux réellement distinct dans la table 3.5 : `legende`, `legende_animale`, `bouclireve_palier`, `bouclireve_etoile`, `diplome_feur`, `rune_astrale_legendaire`) sert au **calcul** — c'est la clé de jointure vers `songe_taux`. Elle existe parce que plusieurs items d'une même `categorie` affichée (les 5 Bouclirêve de palier + le Bouclirêve Étoile, tous en `cosmetique`) n'ont pas le même taux : une jointure sur `categorie` mélangerait leurs profils.
- Toute jointure item → taux **doit** utiliser `cle_taux`, jamais `categorie`.

### Six règles de conception à ne pas contourner

**1. `songe_run_participants` est figé à la saisie.** La team n'est qu'un raccourci de remplissage. Si le joueur modifie sa team six mois plus tard, ses anciennes runs ne doivent pas changer.

**2. On stocke des faits bruts, jamais des résultats calculés.** Pas de colonne `secheresse_actuelle`. Tout se recalcule depuis l'historique.

**3. `source_nb_combats` est obligatoire.** Il distingue une valeur estimée d'une valeur saisie, pour permettre un recalcul propre si la constante change.

**4. `songe_taux` n'est pas rempli par extrapolation.** Seules les valeurs relevées en jeu y figurent. Une combinaison absente signifie "inconnu", jamais "estimé".

**5. ⚠️ `ON DELETE CASCADE` du schéma ci-dessus n'est PAS appliqué par SQLite sur ce projet.** `PRAGMA foreign_keys` n'est activé nulle part dans le code (vérifié : 0 occurrence dans `main.py`/`init_db.py`) — SQLite ignore alors silencieusement toutes les clauses `ON DELETE CASCADE`, y compris `songe_team_membres`→`songe_teams` et `songe_run_participants`/`songe_drops`→`songe_runs`. **Toute suppression doit donc gérer la cascade à la main** (supprimer les lignes filles avant la ligne parente), comme le font `DELETE /songes/teams/{id}` et `DELETE /songes/runs/{id}` dans `main.py`. Activer le pragma globalement est un chantier séparé (impact sur toutes les tables `REFERENCES` existantes, pas seulement Songes) — volontairement non fait ici.

**6. `songe_journal` n'entre dans AUCUN calcul.** Ni sécheresse, ni tirages, ni moyenne, ni estimation — ces entrées archivées sont un simple souvenir consultable (section "Journal" distincte de l'interface), jamais une donnée statistique. Les endpoints `/songes/stats` et `/songes/estimation` ne la lisent jamais.

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

# Combat final à vagues (§3.2) : nombre de vagues à vaincre pour la victoire,
# selon l'intensité. Sert à borner le champ optionnel "vague finale"
# (refonte interface, 29 juillet 2026).
VAGUES_REQUISES = {"reve": 1, "paradoxe": 3, "cauchemar": 3}
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
| POST | `/songes/runs` | Enregistrer un songe et ses drops |
| DELETE | `/songes/runs/{id}` | Supprimer un songe (n'importe lequel, pas que le dernier — voir §10) |
| DELETE | `/songes/drops/{id}` | Supprimer un drop individuel, sans toucher au reste du songe |
| GET | `/songes/historique` | Songes enregistrés, paginés, du plus récent au plus ancien, drops imbriqués (voir §10) |
| GET | `/songes/drops` | Liste plate de tous les drops de l'utilisateur, paginée, filtrable par `categorie`/`perso_id` — page dédiée "Mes drops" (voir §10) |
| GET | `/songes/journal` | Entrées archivées par "Tout supprimer" — lecture seule (voir §10) |
| DELETE | `/songes/tout` | Supprime tous les songes/participants/drops de l'utilisateur, archive les drops dans `songe_journal` au préalable (voir §10) |
| GET | `/songes/stats` | Statistiques calculées (voir §9) |
| GET | `/songes/estimation` | Espérance de songes pour un item **ou une catégorie entière** et une composition donnés (voir §9) |

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
  ],
  "duree_secondes": 1140,
  "vague_finale": 3,
  "nombre_tours": 18
}
```

Le backend calcule `nb_combats` depuis `salle_atteinte` et `COMBATS_PAR_PALIER`. `source_nb_combats` vaut `estime`, sauf saisie manuelle explicite.

`duree_secondes`, `vague_finale`, `nombre_tours` sont **tous optionnels** (`null` si non renseignés, refonte interface du 29 juillet 2026) : chronomètre de base, vague atteinte au combat final et nombre de tours. Validés côté backend (`duree_secondes >= 0`, `vague_finale >= 1`, `nombre_tours >= 1`) sans jamais bloquer leur absence. **`vague_finale` n'est volontairement pas plafonnée** (retour d'usage du 29 juillet 2026, revenant sur un plafond initial à `VAGUES_REQUISES[intensite]`) : le combat final comporte des vagues bonus au-delà du minimum requis pour gagner (ex. Paradoxe I peut aller bien au-delà de 3), le joueur choisit librement la valeur qu'il a réellement atteinte. `VAGUES_REQUISES`/`vagues_requises` (config et `GET /songes/config`) restent en place à titre documentaire (le minimum réel pour gagner, §3.2) mais ne bornent plus aucune saisie. `GET /songes/historique` renvoie les 3 champs sur chaque songe (affichés dans la ligne de résumé de l'historique s'ils sont renseignés).

`GET /songes/drops` — page dédiée "Mes drops" (liste plate, pas groupée par songe), paramètres `categorie`/`perso_id` optionnels + `page`/`page_size` :

```json
{
  "total": 12, "page": 1, "page_size": 20,
  "drops": [
    { "id": 12, "item_id": 20658, "item_nom": "...", "item_img": "...", "categorie": "cosmetique",
      "perso_id": 1, "perso_nom": "Krosaure", "quantite": 1, "palier": 5, "date_drop": "...",
      "run_id": 7, "intensite": "paradoxe", "niveau": 1 }
  ]
}
```

`GET /songes/historique` — réponse (un "songe" = une ligne de `songe_runs`, drops imbriqués) :

```json
{
  "total": 42, "page": 1, "page_size": 20,
  "songes": [
    {
      "id": 7, "date_run": "...", "intensite": "paradoxe", "niveau": 1,
      "terminee": true, "salle_atteinte": 26, "team_nom": "Team farm",
      "drops": [
        { "id": 12, "item_id": 20658, "item_nom": "...", "item_img": "...",
          "perso_id": 1, "perso_nom": "Krosaure", "quantite": 1, "palier": 5 }
      ]
    }
  ]
}
```

`id` (le "numéro de songe" affiché) n'est **jamais renuméroté** après une suppression — un trou dans la numérotation est normal et attendu (§10).

`GET /songes/estimation` — accepte `item_id` **ou** `categorie` (jamais les deux) :
- `item_id=20658` → espérance pour cet item précis (ex. ~1400 songes solo pour une légende précise).
- `categorie=legende` → espérance pour **n'importe lequel** des 26 items de la catégorie (ex. ~55 songes solo) — hypothèse de drops indépendants entre items, cf. table 3.5. `disponible: false` si un seul item de la catégorie manque de données de taux pour la combinaison intensité × palier demandée.

---

## 9. Statistiques

Toutes segmentées par intensité, disponibles en deux vues : **par personnage** et **par team**.

- **Sécheresse actuelle** : `/songes/stats` renvoie, par item trackable, à la fois `songes_depuis_dernier_drop` (nombre de songes éligibles écoulés) et `tirages_depuis_dernier_drop` (le détail plus fin). Un songe ne compte que s'il a atteint au moins un palier où l'item est éligible (§7) — un songe avorté avant palier III ne compte pas pour une légende.
- **Record de sécheresse** : plus longue série de l'historique (en tirages)
- **Moyenne personnelle** : tirages / drops, par catégorie
- **Estimateur** : espérance du nombre de songes pour un item **ou une catégorie entière** (§8), calculée depuis `songe_taux` et la composition de team. Ne dépend d'aucune donnée communautaire, fonctionne dès le premier jour.
- **Indicateur de malchance** : comparaison entre la sécheresse actuelle et l'espérance théorique

### Compteur principal (refonte interface, §10)

Le chiffre affiché en gros sur l'écran principal est le **nombre de songes** depuis le dernier drop de la **catégorie sélectionnée** (pas d'un item précis — l'item épinglé reste hors périmètre de cette passe), renvoyé par `/songes/stats` dans `categories_secheresse`. Un songe compte pour la catégorie s'il a atteint au moins un palier éligible pour **au moins un** item de la catégorie, et le compteur repart de zéro dès que **n'importe quel** item de la catégorie y dropped. Calcul dédié (pas un simple minimum par item) car les 7 cosmétiques n'ont pas tous les mêmes paliers éligibles (contrairement aux légendes/légendes animales, homogènes) — un minimum sous-estimerait la sécheresse "cosmétique" réelle. Les tirages passent en information secondaire, plus petits, sous le chiffre (dérivés du détail par item de `/songes/stats`, minimum sur la catégorie — approximation acceptée pour cette info secondaire).

Sous le compteur, la référence théorique vient de `/songes/estimation?categorie=...` — **jamais affichée sans elle**, un chiffre de sécheresse seul ne veut rien dire. Si `disponible: false` (combinaison intensité × palier inconnue), afficher explicitement "référence non disponible", jamais une extrapolation.

### Ordres de grandeur (Paradoxe I, ~13 combats éligibles par run)

| Objectif | Solo | Team de 4 |
|---|---|---|
| Une légende, n'importe laquelle | ~55 runs | ~14 runs |
| Une légende précise | ~1 400 runs | ~350 runs |
| Une animale précise | ~450 runs | ~110 runs |
| Bouclirêve Étoile | ~2 300 runs | ~570 runs |

⚠️ Les compteurs afficheront naturellement des valeurs à quatre chiffres en tirages (`1 847 tirages sans légende`). C'est **attendu**, ce n'est pas un bug — le compteur principal en nombre de songes (ci-dessus) reste lui à des ordres de grandeur bien plus lisibles (dizaines à centaines).

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

1. **Bouton retour** — flèche `← Retour` en haut à gauche de l'encadré principal, vers l'accueil du site. En haut à droite : lien `🎁 Mes drops` (nouvelle page dédiée, voir plus bas) et `⚙ Personnages & teams`.
2. **Sélecteur de catégorie** — Légendes / Légendes animales / Cosmétiques / Runes, au-dessus du compteur. Change le compteur.
3. **Compteur principal** — titre adapté à la catégorie ("Sans légende depuis", "Sans cosmétique depuis"...) ; **uniquement le chiffre géant** (nombre de songes depuis le dernier drop de la catégorie, §9), rien d'autre en dessous. Le sous-titre "songes · X tirages" et la référence théorique ("il en faut ~X en moyenne...") ont tous deux été retirés (retours d'usage du 29 juillet 2026, jugés pas assez lisibles/fiables en pratique) — `/songes/estimation` reste disponible côté API mais n'est plus consommée par cet écran.
4. **Contexte** — team et intensité à gauche, puis un **chronomètre optionnel** aligné à la limite droite de la ligne (`margin-left: auto`) : Démarrer (bouton vert) / Pause (bouton rouge, une fois lancé) + réinitialiser. Les joueurs l'utilisent librement ; il s'arrête (et se réinitialise) automatiquement quand le songe est validé via `Songe terminé`. Sa valeur est envoyée en `duree_secondes` si non nulle, sinon `null` (jamais imposé).
5. **Champs optionnels, au-dessus du bouton `Songe terminé`** — "Vague finale" et "Nombre de tours", deux champs numériques libres (`min 1`, **sans plafond** — voir §8 sur la raison), disponibles à chaque validation et pas seulement en cas d'interruption, sans influence l'un sur l'autre.
6. **Action** — `Songe terminé` (vert, le plus gros, cas à 95 %) et `J'ai drop` (contour or, texte raccourci lors de la refonte du 29 juillet 2026 — anciennement "J'ai drop quelque chose"). Un indicateur `X drop(s) en attente` apparaît sous les actions dès qu'au moins un drop a été ajouté sur l'écran d'ajout de drop sans que le songe ait encore été validé.
7. **Si le songe n'est pas terminé** : un seul champ, la salle atteinte (1-26).
8. **Historique des songes** — tous les songes enregistrés, du plus récent au plus ancien (pas seulement les drops) : numéro, date, intensité, team, salle atteinte, drops éventuels, plus durée/vague finale/nombre de tours quand renseignés (ex. `Paradoxe I · farm songe · 29/07/26 16:06 · durée : 19 min · Vague finale : 3`). Chaque songe est supprimable individuellement (pas que le dernier) ; chaque drop d'un songe a sa propre croix de suppression, avec confirmation. Les numéros de songe ne sont **jamais renumérotés** après suppression — un trou est normal. Pagination ou défilement (la liste peut devenir longue).
9. **Annulation rapide** — lien visible pour annuler le tout dernier songe enregistré (raccourci ; l'historique du point 8 permet aussi de supprimer n'importe quel autre songe).

### Écran d'ajout de drop

Titre `J'ai drop` (raccourci depuis "J'ai drop quelque chose", 29 juillet 2026). Champ de recherche + filtres par catégorie (Légendes/Légendes animales/Cosmétiques/Rune astrale, avec leurs comptes réels) + sélection du personnage parmi les participants du songe + palier optionnel, jamais bloquant + plusieurs drops possibles sur un même songe.

**Ajouter un drop ne valide plus le songe** (refonte du 29 juillet 2026) : le bouton `Valider le drop` (ex-`Valider le songe`) et le lien `← Retour` (ex-`← Retour sans enregistrer`) ramènent tous les deux à l'écran principal **sans rien envoyer au backend** — les drops ajoutés restent en mémoire (`dropsEnCours`), affichés par l'indicateur "X drop(s) en attente" du point 6 ci-dessus. Seul `Songe terminé` sur l'écran principal envoie réellement `POST /songes/runs` avec les drops accumulés.

**Le lien "Le songe s'est arrêté en cours de route ?" n'apparaît plus sur cet écran** (retiré le 29 juillet 2026 — un drop suppose que le songe continue, la bascule "songe interrompu" n'a de sens que sur l'écran principal où elle reste disponible).

### Page dédiée "Mes drops"

Nouvelle page (29 juillet 2026), accessible depuis le lien `🎁 Mes drops` en haut de l'écran principal. Liste **plate** de tous les drops de l'utilisateur (pas groupée par songe, contrairement à l'historique des songes ci-dessus) — icône, nom cliquable vers la fiche objet, personnage, intensité/palier, date. Barre de filtre en haut : pastilles de catégorie (Toutes/Légendes/Légendes animales/Cosmétiques/Runes, même composant que le sélecteur de catégorie de l'écran principal) + menu déroulant personnage. Pagination (20/page). Alimentée par `GET /songes/drops` (§8) — endpoint dédié plutôt qu'un simple aplatissement de `/songes/historique`, pour une pagination correcte indépendante du nombre de songes.

### Panneau de gestion (personnages/teams inchangé — voir ci-dessous)

Le panneau de création/édition de personnages et teams n'est pas concerné par cette refonte. Deux ajouts, dans ce même panneau, jamais sur l'écran principal :

- **"Tout supprimer"** — bouton dans une zone dédiée, confirmation explicite OUI/NON avec un texte annonçant clairement l'irréversibilité. Supprime tous les songes/participants/drops de l'utilisateur (jamais les personnages ni les teams). Chaque drop est archivé dans `songe_journal` avant suppression (§5 règle 6).
- **Section "Journal"** — lecture seule, visuellement séparée du reste (grisée/atténuée), avec une mention explicite que ces entrées ne comptent plus dans aucune statistique. Alimentée par `GET /songes/journal`.

### Messages d'ambiance (préparation, pas encore actifs)

`config/messages_songes.py` : structure prête (tranches de sécheresse en **nombre de songes** — `0_20`, `20_60`, `60_150`, `150_plus`, `drop_recent`, `drop_en_avance`), listes **vides**. Textes à rédiger par Popo plus tard ; ne pas inventer de message. Le fichier n'est pas encore branché à l'interface.

### Deux exigences non négociables

- **Deux clics maximum** pour enregistrer un songe sans drop
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
- [ ] Icônes de classe sur le sélecteur de personnage (écran d'ajout de drop) — dès que les fichiers d'icônes sont disponibles
- [ ] Rédiger les messages d'ambiance de `config/messages_songes.py` (actuellement vide, structure prête)

---

## 13. Rappels projet

- L'URL de l'API vient de `import.meta.env.VITE_API_URL` (variable Vercel), plus de `const API` à modifier avant push
- `dofura.db` reste dans `.gitignore`
- Écriture de fichiers via scripts Python ou VS Code, jamais en commandes PowerShell multilignes
- Scripts lancés depuis la racine du projet
- Après modification d'un `dofura_*.json` en local : relancer `python init_db.py`
- Principe DRY : un composant paramétré plutôt que des duplications

---

## 14. Changelog

- **29 juillet 2026 — Refonte interface (v3)** : vocabulaire "songe" partout côté utilisateur ("run" reste interne) ; compteur principal en nombre de songes (plus tirages en secondaire) avec sélecteur de catégorie et référence théorique obligatoire ; historique des songes complet (pas seulement les drops), suppression individuelle d'un songe ou d'un drop ; "Tout supprimer" avec archivage préalable dans `songe_journal` (nouvelle table protégée) ; préparation (structure vide) des messages d'ambiance dans `config/messages_songes.py`. Le panneau de gestion personnages/teams n'a pas changé.
- **29 juillet 2026 — Refonte interface (v4)** : bouton retour en haut à gauche de l'écran principal ; suppression de la référence théorique affichée dans le compteur (jugée pas assez fiable en pratique après usage réel) ; chronomètre optionnel (Démarrer/Pause/Réinitialiser) à côté des pastilles team/intensité, arrêté et réinitialisé automatiquement à la validation du songe, durée affichée dans l'historique ; deux champs optionnels supplémentaires disponibles à chaque validation — "Vague finale" (bornée par la nouvelle constante `VAGUES_REQUISES`, §6) et "Nombre de tours" ; l'ajout d'un drop ne valide plus le songe (boutons renommés `Valider le drop`/`← Retour`), seul `Songe terminé` sur l'écran principal envoie réellement la requête, avec un indicateur "X drop(s) en attente" tant que ce n'est pas fait. Colonnes `duree_secondes`/`vague_finale`/`nombre_tours` ajoutées à `songe_runs` par migration idempotente dans `init_db.py` (`PRAGMA table_info` + `ALTER TABLE ADD COLUMN`), appliquée à la base locale après backup.
- **29 juillet 2026 — Refonte interface (v5)** : retour d'usage sur le v4, corrigé le jour même. "Vague finale" déplafonnée (le combat final comporte des vagues bonus au-delà du minimum requis pour gagner — `VAGUES_REQUISES` reste en config à titre documentaire mais ne borne plus la saisie, qui devient un champ numérique libre comme "Nombre de tours") ; chronomètre déplacé à la limite droite de sa ligne (`margin-left: auto`), bouton vert "Démarrer"/rouge "Pause" selon l'état ; "Vague finale"/"Nombre de tours" remontés au-dessus du bouton `Songe terminé` (au lieu d'être après la bascule "songe interrompu") ; bouton/titre "J'ai drop quelque chose" raccourci en "J'ai drop" ; toggle "Le songe s'est arrêté en cours de route ?" retiré de l'écran d'ajout de drop (n'a de sens que sur l'écran principal) ; suppression du sous-titre "songe · X tirages" sous le compteur principal, qui n'affiche plus que le chiffre. Nouvelle page dédiée **"Mes drops"** (lien `🎁 Mes drops` sur l'écran principal) : liste plate de tous les drops, filtrable par catégorie et personnage, alimentée par le nouvel endpoint `GET /songes/drops` (§8) — distincte de l'historique des songes, qui reste groupé par songe et inchangé sur l'écran principal.
