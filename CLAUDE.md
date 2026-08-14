# CLAUDE.md — Projet Dofura

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient tout ce qu'il faut savoir pour travailler sur Dofura sans casser l'existant.

## Reprise (dernière session : 2026-08-03)

**Dernière session : 2026-08-03.** Ménage complet du projet (phases 0, 1a, 1b).

**Prochain chantier : L'Œil de Draconiros (n°1 de la roadmap).**

## Le projet

**Dofura** est un outil de suivi des Songes pour Dofus 3.0 : compter ses songes, traquer ses drops de légendes, connaître ses vraies chances. Le site EST le guide — un guide-outil, pas un guide-texte.

## Vision

**Pivot stratégique du 30-31 juillet 2026 :** Dofura se recentre sur le suivi des Songes après analyse de la concurrence.

**Positionnement :** seul site à donner des taux chiffrés sur les Songes. Duffus a l'audience et le suivi généraliste, Picofus track sans comptes, DofusPourLesNoobs écrit les guides — personne ne fait les chiffres.

Le tracker s'appelle **"L'Œil de Draconiros"**.

**Nav actuelle :** DOFURA · L'Œil · Les Taux · La Bibliothèque · recherche · Mon compte · Discord.

**ABANDONNÉS (ne plus jamais proposer) :** encyclopédie généraliste comme produit principal, quêtes, succès, équipements/objets comme domaine à part entière, chasse au Dofus, carte interactive, portails, simulateur de stuff, commerce/HdV, compagnon de farm/craft, calculateur DD.

**CONSERVÉ EN BASE :** les 21 700 items encyclopédiques restent, ne rien supprimer. La Bibliothèque est réduite à monstres, sorts, et items dropables en songe.

## Environnement de travail

- **OS :** Windows + PowerShell
- **VS Code** = l'éditeur : Popo y ouvre le dossier, regarde les fichiers, lit le code
- **Claude Code** = l'ouvrier : lancé dans le terminal intégré de VS Code (`claude` depuis la racine du projet). C'est lui qui lit, écrit et modifie les fichiers avec ses propres outils.
- **Répartition :** Claude Code fait le travail, Popo observe dans VS Code et valide les plans.

## 📜 LES 18 RÈGLES DE POPO (non négociables)

### Méthode de travail
1. **Plan avant code.** Claude propose un plan, Popo valide, Claude exécute. Jamais de modification directe sans accord.
2. **Un chantier à la fois.** Pas de "j'en profite pour aussi refactorer X". On finit, on teste, on passe au suivant.
3. **Commit Git avant toute grosse modification.** Si ça casse, on revient en arrière en 10 secondes.
4. **Fin de session = local et GitHub synchro.** Commit + push systématique avant de fermer.

### Propreté du code
5. **Jamais de fichier "v2".** Pas de fix_icones2.py ni rewrite_app2.py : on modifie le fichier existant, Git garde l'historique.
6. **Scripts jetables → dossier `scripts/`, supprimés après usage.** La racine ne contient que ce qui fait tourner le site.
7. **Une seule source de vérité par donnée.** Pas de doublons type dofura_sorts.json / dofura_sorts_complet.json.
8. **URL d'API en variable d'environnement** (`VITE_API_URL`). Plus de changer_api.py, plus d'oubli avant push.

### Protection des données
9. **dofura.db hors Git** (régénéré uniquement si absent/vide par `init_db.py`, via `.gitignore` — le volume Railway existe et le persiste entre redéploiements depuis le 28 juillet 2026, voir Stack & infrastructure). **Exception : tous les JSON sources lus par `init_db.py`/`main.py` au démarrage restent DANS Git** — le déploiement Railway build depuis GitHub, donc c'est leur seule source lors du tout premier démarrage sur un volume vide. Liste à jour (2026-08-02) : `dofura_monstres.json`, `dofura_sorts.json`, `dofura_effects.json`, `dofura_effets_speciaux.json`, `dofura_etats_speciaux.json`, `dofura_items.json`, `dofura_recipes.json`, `dofura_item_sets.json`, `dofura_sorts_objets.json`, `dofura_donjons.json`, `dofura_donjons_guides.json`, `dofura_zones_areas.json`, `dofura_quetes.json`, `dofura_quetes_guides.json`, `dofura_succes.json`, `dofura_songes_items.json`, `dofura_songes_taux.json`, `dofura_songes_avis.json`, `dofura_songes_boss_modifs.json`. Voir piège #8.
10. **Backup de dofura.db avant tout script qui écrit dedans.** Une copie de fichier, c'est gratuit ; des semaines de scraping perdu, non.
11. **Scraping avec pauses entre les requêtes.** Pour ne pas se faire bloquer par dofusdb ou Dofensive.
12. **Jamais de mot de passe, clé API ou secret dans le code ou sur GitHub.** Variables d'environnement uniquement (onglet Variables de Railway).

### Communication
13. **Ne JAMAIS inventer.** Data de jeu vérifiée uniquement (leçon fondatrice : la fiche Koutoulou hallucinée). Si Claude n'est pas sûr, il le dit au lieu de deviner.
14. **Pour tout choix, Popo veut : (1) les options avec avantages/inconvénients de chacune, présentées de façon neutre, puis (2) la recommandation personnelle de Claude avec son pourquoi.** Concret, pas de blabla.
15. **Chaque galère résolue s'ajoute à ce fichier** (section Pièges connus). Une erreur ne doit jamais se produire deux fois.

### Apprentissage
16. **Mode apprentissage.** Claude explique ses modifications importantes en termes simples : Popo apprend le développement web avec ce projet. Après chaque changement significatif, un court "ce qu'on vient de faire et pourquoi".
17. **Glossaire vivant.** Chaque nouveau terme technique rencontré s'ajoute à `GLOSSAIRE.md` avec une définition simple et un exemple tiré de Dofura.

### Validation
18. **Validation intelligente (révisée 2026-07-09).** Popo ne sait pas lire les commandes qu'on lui demande de valider — cliquer "accepter" sans comprendre ne protège de rien. La sécurité vit donc dans les règles ci-dessous et dans le jugement de Claude, pas dans des clics de validation systématiques. Claude avance sans interrompre sur : tout le travail du chantier en cours (code, tests, lectures, requêtes SQL), commit Git (systématique avant modification, règle 3), push Git, modification de `main.py`/`init_db.py`, choix d'architecture (documentés dans le plan validé en amont — règle 1 — mais pas re-validés à chaque micro-décision). Backup automatique de `dofura.db` avant tout script qui écrit dedans (règle 10) : fait sans demander, silencieusement. Claude marque une pause et demande validation explicite UNIQUEMENT avant : suppression de fichiers de données ou de backups, `git push --force`, `DROP TABLE` en dehors d'un `init_db.py` déjà validé, et toute autre action irréversible ou coûteuse (ex. achat, appel API payant). **Quand une validation est demandée, elle tient en une phrase simple, niveau débutant : ce que l'action fait concrètement et ce que Popo risque s'il valide.**

## ⚠️ Leçons apprises (données) — à relire avant tout nouveau domaine scrapé

Ces 4 règles viennent de bugs réels (le "+0" et l'effet 1175 manquants au chantier #7/#8bis, le "--100 Force" au chantier #8 — détail de ces chantiers : voir `doc/HISTORIQUE-CHANTIERS.md`). Elles s'appliquent dès le prochain domaine (Classes, Zones, Donjons...), pas seulement aux objets.

1. **Ne jamais écarter un champ des données brutes sur intuition ("ça a l'air redondant").** Avant toute suppression dans un script de nettoyage : prouver par script que le champ est 100% reconstructible depuis les champs conservés, sur TOUTE la base — pas un échantillon. `possibleEffects` avait été jugé pur doublon d'`effects` au chantier #7 ; il portait en réalité le champ `value` manquant (le bug "+0") ET un effet entier absent d'`effects` (le sort accordé par les objets légendaires, chantier #8bis) — les deux fois découverts après coup, pas avant.
2. **Après tout nettoyage/import : audit automatique brut vs nettoyé.** Compter les infos par entité des deux côtés (ex. nombre d'effets par objet dans `possibleEffects` vs `effects`) et signaler tout écart. C'est ce test précis qui aurait attrapé l'effet 1175 dès le chantier #7 au lieu d'attendre un signalement utilisateur.
3. **Chaque domaine Dofus encode différemment (signes, emplacements numériques, effets).** Ne jamais supposer qu'un nouveau domaine suit les conventions du précédent : mini-inspection des données brutes AVANT d'écrire le nettoyage. Les sorts/monstres stockent toujours une magnitude positive + signe dans le texte ; les objets stockent le signe directement dans le nombre — mélanger les deux conventions a produit "--100 Force" (chantier #8).
4. **Quand un bug de données est trouvé sur un cas signalé, toujours vérifier si le motif généralise au-delà.** Le signalement portait sur les 25 objets légendaires ; le même trou touchait en réalité 344 objets toutes catégories confondues (chantier #8bis). Un correctif qui ne couvre que le cas signalé laisse une dette identique ailleurs, prête à ressurgir au prochain signalement.

## Stack & infrastructure

| Élément | Détail |
|---|---|
| Backend | Python / FastAPI (`main.py`) |
| Frontend | React / Vite — tout dans `frontend/src/App.jsx` |
| DB | SQLite `dofura.db` — tables encyclopédie : `monstres`, `grades`, `drops`, `sorts` (colonne `sort_id` = vrai ID Dofusdb), `zones`, `objets`, `objets_effets`, `recettes`, `panoplies`, `panoplies_effets`, `donjons`, `donjons_monstres`, `donjons_objets_requis` — tables Songes (produit principal) : `songe_items_trackables`, `songe_taux`, `songe_boss_modifs`, `songe_personnages`, `songe_teams`, `songe_team_membres`, `songe_runs`, `songe_run_participants`, `songe_drops`, `songe_journal` |
| Back déployé | Railway → https://web-production-53f2b.up.railway.app |
| Projet Railway | `faithful-delight` — seul projet Railway du compte (les projets `exemplary-wisdom` et `worthy-smile` ont été supprimés le 3 août 2026) |
| Volume Railway | Existe, monté sur `/data`, `DB_PATH=/data/dofura.db` — en place depuis le 28 juillet 2026, revérifié le 3 août 2026 |
| Front déployé | Vercel → https://dofura.vercel.app |
| GitHub | mathieufra03-hub/Dofura |
| Dossier local | C:\Users\mathi\Documents\dofura |

**Pages actuelles (`frontend/src/pages/`) :** `AccueilPage.jsx`, `SongesPage.jsx` (L'Œil de Draconiros), `TauxPage.jsx` (Les Taux), `ComprendrePage.jsx`.

**`App.jsx` (4 144 lignes — découpage prévu, voir Roadmap → Chantiers hors roadmap) :** contient encore 46 composants + le composant racine `App()`, vérifiés sur le disque le 2026-08-03. Nav/UI commune : `Navbar`, `LoginPanel`, `MonComptePanel`, `NavSearch`, `DiscordLink`, `Footer`, `StarField`, `DofuraEggO`, `SearchIcon`, `DofusSeparator`, icônes (`IconeOeil`, `IconeTaux`, `IconeGrimoireNav`, `IconeHistorique`, `IconeCompte`, `IconeDiscord`, `IconeAction`), `BoutonTravel`. Bibliothèque/Grimoire : `GrimoirePage`, `GrimoirePanel`, `GrimoireTuile`, `BestiairePage`, `MonstrePage`, `SortsPanel`, `SortDetail`, `ObjetsPage`, `ObjetDetailPage`, `PanopliesPage`, `PanoplieDetailPage`, `DonjonsPage`, `DonjonDetailPage`, `RegionsPage`, `RegionDetailPage`, `SousZoneDetailPage`. Domaines abandonnés au pivot, code encore présent mais non relié à la nav : `Hero`, `AlmanaxBanner`, `EncycloGrid`, `OeufJauge`, `CarreDofus`, `DofusPanel`, `ChasseDofus`, `ArchidexSection`, `DofusDetailPage`, `QuetesPage`, `QuetePage`, `SuccesPage`, `SuccePage`.

**Data Songes (produit principal) :** `dofura_songes_items.json` (items trackables par catégorie/palier) · `dofura_songes_taux.json` (taux de base × multiplicateurs par intensité, chantier 21) · `dofura_songes_boss_modifs.json` (modifications de boss en songe) · `dofura_songes_avis.json` (avis de recherche). Migrés en tables plates au démarrage par `taux_songes.py` (racine du projet, PAS `scripts/` — `init_db.py` en dépend au démarrage, voir chantier 21 dans `doc/HISTORIQUE-CHANTIERS.md`). Non-régression : `verifier_taux.py` (racine), 28/28 relevés attendus, à relancer après toute modification des taux.

**Data encyclopédie (conservée en base, hors périmètre produit — voir Vision) :** `dofura_monstres.json` (4 932 monstres fusionnés Dofensive + Dofusdb + Duffus) · `dofura_sorts.json` (8 019 sorts) · `dofura_effects.json` (302 effets) · `dofura_effets_speciaux.json` (1577 résolutions diceNum→nom pour les effets sans description propre, ex. invocations) · `dofura_items.json`/`dofura_recipes.json`/`dofura_item_sets.json` (objets, chantier #7) · `dofura_sorts_objets.json` (sorts accordés par les objets, chantier #8ter) · `dofura_donjons.json` (187 donjons) · `dofura_donjons_guides.json` (guides de boss éditoriaux, vide pour l'instant — voir chantier Donjons) · `dofura_quetes.json` (1 976 quêtes, chantier Quêtes) · icônes `.webp` locales dans `frontend/public/assets/icons/` — détail des chantiers cités (#7, #8ter, Donjons, Quêtes) : voir `doc/HISTORIQUE-CHANTIERS.md`

## Charte graphique — "Le Grimoire de Draconiros"

- Fond `#030C11` · cyan `#2CE7FF` · or `#F0C040` · violet `#C478FF`
- Typo : Cinzel (titres) + Inter (corps)
- Intensités : Rêve `#4DA6FF` · Paradoxe `#C478FF` · Cauchemar `#FF6B4A`
- Maquette de référence : `maquette/dofura-maquette-v2.html`
- L'ancienne charte dorée ("Krosmoz Espace") est archivée dans `maquette/archive-krosmoz/`, morte — ne pas s'en inspirer.

**LA RÉFÉRENCE COMPLÈTE ET À JOUR EST `IDENTITE.md`** — toujours la consulter avant tout travail visuel, ne jamais se fier à une couleur citée ailleurs (y compris ci-dessus).

## ⛔ PIÈGES TOUJOURS VALABLES

1. **Édition simultanée VS Code / Claude Code :** ne jamais avoir de modifications non sauvegardées dans VS Code pendant que Claude Code édite le même fichier — l'un écrase l'autre. Si un fichier semble "bizarre" dans VS Code après une édition de Claude Code : le fermer et le rouvrir. **Un onglet resté ouvert peut écraser le fichier tout seul, sans aucune action de Popo** — une restauration de session VS Code (redémarrage, reload de fenêtre) peut réappliquer le contenu périmé de l'onglet par-dessus la version propre sur le disque. Arrivé une fois sur `frontend/src/App.jsx` (13 août 2026) : un vieil onglet a fait réapparaître ~1900 lignes de code mort (dont `ChasseDofus`, `ArchidexSection`, `QuetesPage`, `SuccesPage`) et effacé toute la migration react-router, sans que Popo n'ait rien tapé. Détecté avant commit grâce à `git diff --stat`, restauré avec `git checkout -- <fichier>`. Deux parades, désormais permanentes :
   - **Avant de lancer un chantier sur un fichier : fermer son onglet dans VS Code.** Pas seulement éviter d'y toucher — fermé, pour qu'aucune restauration de session ne puisse le faire réapparaître pendant que Claude Code travaille dessus.
   - **Avant tout `git commit` : Claude Code vérifie systématiquement l'état réel du disque** (nombre de lignes du/des fichier(s) concerné(s) + `git status`/`git diff --stat`) et ne commite que si c'est cohérent avec ce qui vient d'être fait. En cas d'écart : `git checkout -- <fichier>` et le signaler à Popo avant de committer quoi que ce soit.
2. **PowerShell :** attention aux `$` non échappés (bug historique : `$PORT` vide dans le Procfile) et aux commandes multi-lignes. Claude Code doit privilégier ses outils d'édition natifs plutôt que des commandes shell complexes.
3. **Traduction navigateur :** `lang="fr"` sur la div racine + `translate="no"` sur les spans d'effets sont DÉJÀ en place. Ne pas retoucher. (Bug historique : "PM" traduit en "14h".)
4. **Cache Vercel :** si la prod affiche l'ancienne version après push → Redeploy SANS cocher "Clear build cache".
5. **sort_id :** le front appelle `/sorts/{s.sort_id}` (vrai ID Dofusdb), jamais le row_id SQLite. FIXÉ — ne pas régresser.
6. **Tacle/Fuite :** valeurs à lire depuis `data[s.key]` (niveau monstre), pas `g[s.key]` (grade). FIXÉ.
7. **AssetRipper :** abandonné (compression Unity propriétaire). Icônes = webp Dofensive uniquement. Ne pas retenter.
8. **JSON sources vs Git :** ne jamais sortir un JSON source lu par `init_db.py`/`main.py` (liste à jour dans la règle 9) du suivi Git — **ce n'est plus une contrainte technique temporaire (le volume Railway existe désormais, voir Stack & infrastructure), c'est un choix assumé** : Railway build depuis GitHub, donc les JSON sources y restent par commodité (le volume ne stocke que `dofura.db`, jamais les JSON, et les retirer de Git casserait quand même le tout premier peuplement d'un volume vide — `init_db.py` plante sans `dofura_monstres.json`, `/sorts` renvoie du vide sans `dofura_sorts.json`). Seul `dofura.db` peut sortir du suivi sans risque, car régénéré à chaque démarrage. Erreur commise puis corrigée le 2026-07-08 pendant le grand nettoyage (chantier #2, voir `doc/HISTORIQUE-CHANTIERS.md`) — cf. règle 9 amendée. **Réflexe à chaque nouveau domaine :** si un nouveau fichier JSON est ajouté au chargement du backend (ex. `dofura_donjons_guides.json` au chantier Donjons, même fichier), l'ajouter aussi à la liste de la règle 9 dans le même commit.
9. **`PRAGMA foreign_keys` n'est activé nulle part dans ce projet** (vérifié : 0 occurrence dans `main.py`/`init_db.py`). Conséquence directe : tous les `ON DELETE CASCADE` déclarés dans les `CREATE TABLE` (ex. `songe_team_membres`→`songe_teams`, `songe_run_participants`/`songe_drops`→`songe_runs`, chantier Songes) sont **ignorés silencieusement par SQLite** — supprimer une ligne parente ne supprime PAS ses lignes filles automatiquement, elles restent orphelines. Toute suppression touchant une table avec des enfants doit gérer la cascade à la main (DELETE des lignes filles avant la ligne parente), comme le font `DELETE /songes/teams/{id}` et `DELETE /songes/runs/{id}`. Voir SONGES.md §5 règle 5. Activer le pragma globalement (et vérifier l'impact sur toutes les tables `REFERENCES` déjà existantes) est un chantier séparé, volontairement non fait — ne pas l'activer à la légère en cours de route.
10. **Un déploiement Railway synchronise le CODE, jamais le SCHÉMA de la base.** `base_deja_peuplee()` (`main.py`) ne relance `init_db.py` que si la table `monstres` est vide — sur un déploiement déjà en place, toute table ajoutée au schéma d'`init_db.py` après la toute première mise en ligne n'est donc **jamais créée**, même aux redéploiements suivants (le code évolue, le volume Railway persistant non). Trouvé le 2026-08-03 : `songe_items_trackables` et 9 autres tables manquaient en prod depuis leur création dans le code, sans jamais avoir été rattrapées (chantier 22, voir `doc/HISTORIQUE-CHANTIERS.md`). **Réflexe à chaque nouvelle table ajoutée au schéma :** pousser le code, PUIS appeler `POST /admin/refresh-encyclopedie` (voir Manips de référence) — sinon la table reste invisible en prod jusqu'au prochain rappel manuel de l'endpoint. Ne jamais importer `init_db.py` depuis `main.py` pour contourner ça : son code de haut niveau (chargement JSON + connexion à `DB_PATH` + DROP/CREATE/INSERT) s'exécuterait dès l'import, sur la vraie base.
11. **`CREATE TABLE` n'est pas annulé par un `conn.rollback()` sous sqlite3/Python.** Contrairement à l'intuition d'une transaction classique tout-ou-rien, une table déjà créée par un `cur.execute("CREATE TABLE ...")` peut survivre à un rollback appelé plus tard suite à une erreur ailleurs dans la même fonction — comportement du driver Python (implicite commit avant certains types de statements), pas de SQLite lui-même. Trouvé en testant l'endpoint `/admin/refresh-encyclopedie` (chantier 22, voir `doc/HISTORIQUE-CHANTIERS.md`) : une table s'était créée malgré l'échec global de l'appel. Ne jamais compter sur un rollback pour annuler un `CREATE TABLE` déjà exécuté — valider tout ce qui peut échouer (gardes, vérifications SQL) **avant** la moindre écriture plutôt que de faire confiance à un rollback en cas d'erreur en cours de route.
12. **`SONGES.md` contient les données de référence des Songes** (taux, conditions d'éligibilité, combats par palier). Toujours le lire avant tout travail touchant aux Songes. Ne jamais raisonner de mémoire sur les taux.
13. **Vocabulaire : les joueurs disent RUN.** L'interface dit "run" partout où le joueur manipule ses parties (compteurs, boutons, lignes d'historique, confirmations). "Songe" est réservé aux titres de section et à l'habillage éditorial (ex. "Historique des songes", la phrase d'ambiance sous le titre de L'Œil). **Ne jamais faire de remplacement global run→songe.** Erreur commise et intégralement annulée le 14 août 2026 (chantier Historique général) : une passe de vocabulaire avait remplacé "run" par "songe" dans tous les libellés de `SongesPage.jsx`/`SongesPartages.jsx`/`HistoriquePage.jsx` (boutons "Run terminée"→"Songe terminé", "Run #12"→"Songe n°12", etc.), corrigée à l'accord près (run est féminin, songe est masculin) — puis intégralement repassée en "run" sur retour de Popo : la règle avait été appliquée sans vérifier l'usage réel des joueurs. Cette règle prime sur toute intuition de cohérence terminologique interne au code.

Historique : chantiers fermés et leçons de l'ancienne méthode de travail → voir doc/HISTORIQUE-CHANTIERS.md

## Manips de référence

1. **Tester en local :** `python main.py` (backend) + `npm run dev` dans `frontend/` (front)
2. **Tester l'API :** navigateur (localhost:8000 ou URL Railway)
3. **Déployer :** `git add` / `commit` / `push` → Railway + Vercel redéploient automatiquement
4. **Forcer redéploiement Railway :** interface web → Deployments → Redeploy
5. **Vider cache Vercel :** Redeploy SANS "Clear build cache"
6. **Reconstruire la DB :** `python init_db.py` (relit `dofura_monstres.json`)
7. **Lancer un script :** `python scripts\nom.py` depuis la RACINE, jamais depuis `frontend/`
8. **Après tout ajout de table au schéma d'`init_db.py` :** pousser le code, PUIS appeler `POST /admin/refresh-encyclopedie` (header `X-Admin-Token`, jamais en query param) — le déploiement seul ne crée pas la table en prod (piège #10).
9. **Après chaque push touchant le backend :** ouvrir une URL de l'API en prod (ex. `/songes/taux?intensite=paradoxe&niveau=1`) avant de considérer le déploiement terminé. Un déploiement marqué "Success" par Railway peut quand même livrer du code qui plante à l'usage (chantier 22, voir `doc/HISTORIQUE-CHANTIERS.md`).

## 🤖 Agents Dofuriens (sous-agents dans .claude/agent/)

- **Krag** — boss de donjons (8 fiches Frigost 3 validées, +40 donjons restants). Seul agent réellement créé (`.claude/agent/krag.md`).

**Lorn, Vex, Drakar, Roam** (quêtes, succès, objets/équipements, zones/donjons) avaient été annoncés dans une version précédente de ce fichier mais n'ont jamais été créés — aucun fichier correspondant n'a jamais existé sur le disque. Domaines abandonnés au pivot Songes de toute façon (voir Vision).

**Prévu, pas encore créé :** un agent rédacteur spécialisé Songes, pour le contenu éditorial de la page "Comprendre les Songes".

Règle commune : règle 13 (ne jamais inventer) + validation Popo avant intégration.

## Chantiers en cours / problèmes ouverts

0. **⚠️ SITE EN NOINDEX — RETIRER AU LANCEMENT.** Ajouté le 2026-07-09 (`frontend/index.html`, `<meta name="robots" content="noindex, nofollow" />`) : le site est en construction, Popo veut rester discret jusqu'au lancement. **Vérifié le même jour : le repo GitHub `mathieufra03-hub/Dofura` est PUBLIC** — le noindex empêche l'indexation Google du site déployé (Vercel) mais ne cache PAS le code source ni l'historique Git, visibles par quiconque a l'URL du repo. Passer le repo en privé est une décision et une manipulation qui appartiennent à Popo (Settings GitHub), pas à Claude Code. **Avant le lancement : retirer la balise `noindex` de `frontend/index.html`.**
6. **Phase 4 (anticipation) :** front et back sur deux domaines → cookies impossibles proprement → prévoir JWT dans le header `Authorization`.

## Roadmap

1. **L'Œil de Draconiros** — bribes dans l'historique, total obtenu vs solde dépensable, rattrapage "vague terminée" oubliée, vocabulaire run/songe, graphisme.
2. **Les Taux** — expliquer les vides (runes avant Paradoxe IV, cosmétiques variables selon prospection), exploiter l'écart cosmétiques/légendes (25-30x plus rares), documenter la méthode de calcul et la réserve du multiplicateur de palier, angle SEO.
3. **La Bibliothèque** — allégée + page Classes & Sorts (vérifier d'abord si les sorts de classes sont en base, les 8 019 sorts actuels sont des sorts de monstres).
4. **Dashboard du compte** — bribes (total obtenu qui ne descend jamais + solde dépensable), réglages teams, stats personnages.
5. **Page d'accueil** — 2 encadrés : "Comprendre les Songes" et "Team partagée".
6. **Team partagée entre comptes** — le mécanisme viral : un joueur logue la run, les 4 en profitent.

**MÉTHODE DE TRAVAIL VALIDÉE :** un chantier à la fois, complet, avec son graphisme, testé et validé avant de passer au suivant. Plus jamais cinq choses en parallèle à 70%.

### Chantiers hors roadmap (à faire quand l'occasion se présente)

- Retirer le noindex de `frontend/index.html` avant le lancement public.
- Renommer `carte-registre.webp` en `carte-oeil-draconiros.webp` (le nom ne correspond pas à la carte).
- Découper `App.jsx` (4000+ lignes) par morceaux, un commit par extraction.
- Nettoyer les scripts jetables de `scripts/` (garder `diag_tables_prod.py` et `verifier_endpoints_taux.py`, ce sont des outils de diagnostic réutilisables).
- Remonter la note "étendre les résumés Lorn zone par zone" enterrée dans `doc/HISTORIQUE-CHANTIERS.md` — à trancher : encore pertinent après le pivot ?

## Ressources

- **APIs :** api.dofusdb.fr (monstres, sorts, zones, items) · api.dofusdu.de (DofusDude — Dofus 3 + Almanax, SDK Python) · cdn.api.dofensive.com
- **Sites référence :** dofuspourlesnoobs.com · dofusdb.fr · dofensive.com · duffus.fr · picofus.fr (tracker multi-contenus, données navigateur uniquement, pas de comptes)
