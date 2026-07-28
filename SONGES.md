# SONGES.md — Suivi de Songes (Dofura)

> Spécification fonctionnelle et technique de la feature "Suivi de Songes".
> Destiné à Claude Code. Phase 1 uniquement (tracker personnel).
> Dernière mise à jour : juillet 2026.

---

## 1. Objectif

Permettre à un joueur de **compter ses runs de Songes et d'enregistrer ses drops rares**, pour répondre à la question qu'aucun outil existant ne traite : *"ça fait combien de runs que je farme sans rien drop ?"*

Les taux de drop des légendes sont extrêmement faibles (0,0035 % à 0,01 % de base). Un joueur peut enchaîner des centaines de runs sans rien. Personne ne tient ce compte à la main.

**Différenciation Dofura** : le tracker est branché sur l'encyclopédie existante (~21 700 items). Chaque drop enregistré pointe vers une fiche item réelle, cliquable. Aucun concurrent (Dofzel, DofHub, DPLN, Dafous) ne propose de tracker — ils ne font que des guides statiques.

### Périmètre phase 1

| Inclus | Exclu (phases ultérieures) |
|---|---|
| Compteur personnel | Statistiques communautaires agrégées |
| Historique des drops | Comparaison entre joueurs |
| Sécheresse + moyennes | Partage Discord / screenshots |
| Estimateur de runs restantes | Fenêtre flottante (PiP) |
| Multi-personnages et teams | Authentification (voir §9) |

---

## 2. PRÉREQUIS BLOQUANT — Volume persistant Railway

**Ne pas écrire une ligne de code de cette feature avant que ce point soit réglé.**

Aujourd'hui `dofura.db` vit dans le système de fichiers éphémère de Railway : **chaque redéploiement écrase la base**. Pour l'encyclopédie ce n'est qu'un désagrément (les données sont régénérables depuis les JSON). Pour le tracker, c'est fatal : les données saisies par les joueurs sont **irremplaçables**. Un joueur qui perd 200 runs loggées ne revient jamais.

À faire, dans l'ordre :

1. Créer un volume persistant sur le service Railway, monté sur `/data`
2. Déplacer la base vers `/data/dofura.db` via une variable d'environnement `DB_PATH` (défaut local : `./dofura.db`)
3. Vérifier après un redéploiement que les données survivent (test : insérer une ligne, redéployer, relire)
4. Mettre en place une **sauvegarde automatique** : dump quotidien de la base, conservé hors du serveur

⚠️ Au moment du basculement, la base sur le volume sera vide. Il faudra relancer l'import des données encyclopédiques (`init_db.py` + les `dofura_*.json`). Prévoir ce temps de rechargement.

---

## 3. Règles du jeu (données vérifiées)

Fournies par Popo, vérifiées en jeu. **Ne rien inventer au-delà de ce tableau.**

### Intensités — 10 au total, réparties en 3 catégories

| Intensité | Bonus XP / Butin |
|---|---|
| Rêve I | 50 % |
| Rêve II | 75 % |
| Rêve III | 100 % |
| Paradoxe I | 120 % |
| Paradoxe II | 140 % |
| Paradoxe III | 160 % |
| Paradoxe IV | 190 % |
| Cauchemar I | 220 % |
| Cauchemar II | 250 % |
| Cauchemar III | 300 % |

Attention : **les paliers ne sont pas symétriques** (3 / 4 / 3, pas 4 / 4 / 4). Paradoxe I est l'intensité la plus jouée (meilleur ratio temps/rentabilité) — c'est la valeur par défaut de l'interface.

### Structure d'une run

- **26 salles**, toujours. Mort définitive : une défaite termine le songe.
- Types de salles : Combat · Fontaine Onirique (achat de bonus) · Faveur Onirique (bonus aléatoire d'un PNJ) · Fin du rêve (boss final).
- Le boss final est un combat à vagues (3 vagues de 4 boss de donjon). Vagues à vaincre pour la victoire : 1 en Rêve, 3 en Paradoxe et Cauchemar.
- Toutes les salles ne sont pas des combats → **le nombre de combats par run est inférieur à 26 et probablement variable**.

### Paliers

| Palier | Nom | Salles |
|---|---|---|
| I | Les Pensées oniriques | 1 – 3 |
| II | Les Balades fantastiques | 4 – 9 |
| III | Les Espaces imaginaires | 10 – 15 |
| IV | Les Concepts brumeux | 16 – 21 |
| V | Les Abstractions chimériques | 22 – 26 |

### Taux de drop — point critique

Le taux **n'est pas constant sur une run**. Il fonctionne ainsi :

- Un **taux de base** est fixé par l'intensité choisie
- Il **augmente avec le numéro de salle** (maximum proche de la salle 26)
- Il **augmente aussi selon la difficulté propre de chaque salle**
- Il ne redescend jamais sous le taux de base
- Le bonus d'XP, lui, reste fixe toute la run

Le jeu affiche le taux exact salle par salle. Vérification faite sur deux captures : le taux affiché = taux de base × un coefficient unique appliqué à tous les items de la salle (coefficient observé : 2,375).

**Conséquences pour l'implémentation :**
- Toutes les statistiques doivent être **segmentées par intensité**. Un compteur global toutes intensités confondues n'a aucun sens.
- La salle du drop est une donnée utile → champ optionnel.

### Items dropables

| Catégorie | Nombre | Taux de base | Disponibilité |
|---|---|---|---|
| Légende (équipement) | 26 | 0,0035 % | Palier III+, Paradoxe et Cauchemar uniquement |
| Légende animale (croquettes familiers) | 4 | 0,01 % | Palier III+, Paradoxe et Cauchemar uniquement |
| Runes astrales | à compléter | à compléter | Tous paliers, Paradoxe et Cauchemar |
| Cosmétiques | 6 boucliers + 1 panoplie d'apparat + 3 costumes | ~0,0033 % | voir ci-dessous |

Précisions :
- Tous les items d'un même type ont **exactement le même taux**.
- La **prospection n'influe pas** sur le drop des légendes.
- Taux minimum effectif (Paradoxe I, bonus +20 %) : légende animale 0,012 %, légende 0,0042 %.
- Runes astrales par palier : I et II → Mineure, Moyenne · III → Majeure, Épatante · IV → Majeure, Épatante, Merveilleuse, Légendaire · V → Merveilleuse, Légendaire.
- Bouclirêve Étoile : tous paliers. Puis un Bouclirêve spécifique par palier — I Onirique · II Fantastique · III Imaginaire · IV Brumeux · V Infini.

### Non pertinent

Le mode **Souvenir** sert à rejouer des combats sans drop ni récompense. Il n'est jamais tracké. Les **graines de songe** sont écartées (trop peu utilisées).

---

## 4. Modèle de données

Tables préfixées `songe_` pour ne pas polluer le schéma encyclopédique existant.

```sql
CREATE TABLE songe_personnages (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,                 -- NULL en phase 1, rempli en phase 4
    nom           TEXT NOT NULL,
    classe        TEXT,
    serveur       TEXT,
    cree_le       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE songe_teams (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    nom           TEXT NOT NULL,           -- ex. "Team farm Paradoxe"
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
    salle         INTEGER,                 -- optionnel
    cree_le       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE songe_items_trackables (
    item_id       INTEGER PRIMARY KEY,     -- FK vers la table objets
    categorie     TEXT NOT NULL,           -- 'legende' | 'legende_animale' | 'rune_astrale' | 'cosmetique'
    taux_base     REAL,
    palier_min    INTEGER,                 -- 1..5
    intensite_min TEXT                     -- 'paradoxe' pour les légendes
);
```

### Trois règles de conception à ne pas contourner

**1. `songe_run_participants` est figé à la saisie.**
La team n'est qu'un raccourci de remplissage du formulaire. Si le joueur modifie sa team six mois plus tard, ses anciennes runs ne doivent pas changer. Ne jamais recalculer les participants d'une run passée depuis `songe_teams`.

**2. On stocke des faits bruts, jamais des résultats calculés.**
Pas de colonne `secheresse_actuelle` en base. Tout se recalcule à la volée depuis l'historique. Le jour où la formule change, tout l'historique reste valide.

**3. `source_nb_combats` est obligatoire.**
Il distingue une valeur estimée d'une valeur saisie par le joueur. Sans lui, impossible de recalculer proprement si la constante de combats par run est corrigée plus tard.

---

## 5. Configuration

Fichier `config/songes.py` (ou équivalent). **Aucune de ces valeurs ne doit être écrite en dur ailleurs dans le code.**

```python
NB_SALLES_PAR_RUN = 26

# Nombre estimé de salles de combat sur une run complète.
# VALEUR PROVISOIRE — à corriger après relevé en jeu.
NB_COMBATS_ESTIME_RUN_COMPLETE = 22

PALIERS = {
    1: {"nom": "Les Pensées oniriques",      "salles": (1, 3)},
    2: {"nom": "Les Balades fantastiques",   "salles": (4, 9)},
    3: {"nom": "Les Espaces imaginaires",    "salles": (10, 15)},
    4: {"nom": "Les Concepts brumeux",       "salles": (16, 21)},
    5: {"nom": "Les Abstractions chimériques","salles": (22, 26)},
}

INTENSITES = {
    "reve":      {"niveaux": [1, 2, 3],       "bonus": {1: 50,  2: 75,  3: 100}},
    "paradoxe":  {"niveaux": [1, 2, 3, 4],    "bonus": {1: 120, 2: 140, 3: 160, 4: 190}},
    "cauchemar": {"niveaux": [1, 2, 3],       "bonus": {1: 220, 2: 250, 3: 300}},
}

INTENSITE_DEFAUT = ("paradoxe", 1)

TAUX_BASE = {
    "legende": 0.0035,
    "legende_animale": 0.01,
}
```

---

## 6. API (FastAPI)

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/songes/config` | Intensités, paliers, constantes — le frontend ne code rien en dur |
| GET | `/songes/items-trackables` | Liste des items trackables, avec nom et image depuis l'encyclopédie |
| GET / POST | `/songes/personnages` | Lister / créer un personnage |
| GET / POST / PUT / DELETE | `/songes/teams` | Gérer les préréglages de team |
| POST | `/songes/runs` | Enregistrer une run (+ ses drops éventuels) |
| DELETE | `/songes/runs/{id}` | Annuler la dernière run saisie |
| GET | `/songes/historique` | Historique paginé des drops, avec item enrichi |
| GET | `/songes/stats` | Toutes les stats calculées (voir §7) |

`POST /songes/runs` — corps attendu :

```json
{
  "intensite": "paradoxe",
  "niveau": 1,
  "terminee": true,
  "salle_atteinte": 26,
  "participants": [1, 2, 3, 4],
  "drops": [
    { "perso_id": 2, "item_id": 12345, "quantite": 1, "salle": 23 }
  ]
}
```

Le backend calcule `nb_combats` : `NB_COMBATS_ESTIME_RUN_COMPLETE` si la run est terminée, sinon une valeur dérivée de `salle_atteinte`. `source_nb_combats` vaut `estime` dans les deux cas, `saisi` uniquement si le joueur a renseigné le champ optionnel.

---

## 7. Calculs

Tous les calculs sont **segmentés par intensité** et disponibles en deux vues : **par personnage** et **par team** (agrégat des personnages).

- **Tirages** = somme des `nb_combats` × nombre de participants. C'est l'unité statistique réelle : chaque personnage a sa propre chance de drop, une run à 4 vaut 4 fois plus de chances qu'une run solo. Ne jamais confondre avec le nombre de combats.
- **Sécheresse actuelle** (par item ou par catégorie) : nombre de combats et de runs écoulés depuis le dernier drop.
- **Record de sécheresse** : la plus longue série sans drop de tout l'historique.
- **Moyenne personnelle** : nombre de tirages / nombre de drops, par catégorie.
- **Estimateur** : espérance du nombre de runs pour obtenir un item donné, calculé depuis les taux théoriques et la composition de team. Ne dépend d'aucune donnée communautaire — fonctionne dès le premier jour.
- **Indicateur de malchance** : comparaison entre la sécheresse actuelle et l'espérance théorique, pour afficher "c'est statistiquement normal" ou "tu es dans une mauvaise passe".

⚠️ Avec des taux à 0,0042 %, les compteurs affichent naturellement des valeurs à quatre chiffres (`1 847 combats sans légende`). C'est **attendu**, ce n'est pas un bug. L'interface doit le contextualiser, sinon l'utilisateur croit que le site est cassé.

---

## 8. Frontend

### Architecture

`App.jsx` est déjà un fichier unique très chargé. **Créer un composant séparé** `frontend/src/pages/SongesPage.jsx` plutôt que d'y ajouter cette feature. Réutiliser les tokens de `dofura-tokens.css`.

### Design (charte Krosmoz Espace)

| Usage | Couleur |
|---|---|
| Fond | `#0C0F1D` |
| Cartes / surfaces | `#141A2E` |
| Interactif, liens | `#4DD8E6` (cyan) |
| Action positive, validation | `#4CC98D` (vert) |
| Sécheresse, alerte | `#F26D6D` (rouge) |
| Bordures, accents | or + hover glow |

### Écran principal — une seule page, pas un formulaire

Ordre vertical, mobile-first :

1. **Le chiffre héros** — la sécheresse, en très grand. Le joueur peut épingler un item précis (ex. Légende de Rykke Errel) : c'est alors sa sécheresse sur cet item qui s'affiche.
2. **Contexte** — deux pastilles compactes : team et intensité. Elles conservent la dernière valeur utilisée, on n'y touche presque jamais.
3. **Action** — deux boutons. `Run terminée` (vert, le plus gros, cas à 95 %) et `J'ai drop quelque chose` (contour or).
4. **Historique** — liste chronologique. Chaque entrée affiche l'item, le numéro de run et la salle, et **renvoie vers la fiche item de l'encyclopédie**.

### Écran d'ajout de drop

Champ de recherche + filtres par catégorie (légendes / runes / cosmétiques) + sélection du personnage concerné. Environ 50 items trackables au total — la recherche est nécessaire, une grille de boutons serait trop dense.

### Deux exigences non négociables

- **Deux clics maximum** pour enregistrer une run sans drop. C'est le chiffre qui décide si l'outil est utilisé ou abandonné.
- **Bouton d'annulation** visible sur la dernière action enregistrée. Sans ça, un double-clic accidentel détruit la confiance du joueur dans ses propres chiffres.

---

## 9. Authentification

Phase 1 peut fonctionner **sans comptes utilisateurs**, avec un identifiant local stocké côté navigateur. C'est acceptable pour tester l'usage, mais fragile : le joueur perd tout s'il change d'appareil ou vide son cache.

Le schéma prévoit déjà `user_id` partout pour permettre la bascule vers JWT (phase 4 de la roadmap) sans migration douloureuse.

**Si l'objectif est de garder les utilisateurs, l'authentification devrait être traitée avant l'ouverture publique du tracker, pas après.**

---

## 10. À compléter avant implémentation

- [ ] Volume persistant Railway actif et testé (§2) — **bloquant**
- [ ] Liste exacte des items trackables, avec leur `item_id` dans la base encyclopédique
- [ ] Taux de drop des runes astrales
- [ ] Nombre réel de salles de combat sur une run complète, et sa variabilité
- [ ] Relevé des taux salle par salle en Paradoxe I, pour reconstituer la courbe du coefficient
- [ ] Confirmer que les cosmétiques sont bien à tracker

---

## 11. Rappels projet

- `const API` dans le frontend doit pointer vers l'URL Railway avant tout push (manip 5, étape 0)
- `dofura.db` reste dans `.gitignore` — ne jamais pousser la base
- Écriture de fichiers via scripts Python ou VS Code, jamais en commandes PowerShell multilignes
- Scripts lancés depuis la racine du projet
- Principe DRY : un composant paramétré plutôt que des duplications
