# CLAUDE.md — Projet Dofura

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient tout ce qu'il faut savoir pour travailler sur Dofura sans casser l'existant.

## Reprise (dernière session : 2026-08-03)

**Chantiers Migration des taux de Songes + Diagnostic tables manquantes en prod fermés le 2026-08-03** (voir chantiers 21 et 22 pour le détail complet). Popo a fourni `dofura_songes_taux.json` v2.0 (formule taux_base × multiplicateur, remplace les relevés ponctuels Paradoxe I uniquement de l'ancien fichier) — la migration a mis au jour, en la testant en prod, un bug de production sans rapport direct avec la migration elle-même : `/songes/taux` renvoyait 500, 10 tables (dont toute la partie donnée-joueur du tracker Songes) n'ayant jamais été créées sur le volume Railway. Nouvel endpoint `/admin/refresh-encyclopedie` créé pour ce cas et les suivants du même genre — voir piège #12.

**Chantier Grimoire fermé le 2026-07-29** (fusion Équipements/Ressources/Bestiaire/Panoplies en une page unique avec recherche globale et panneau latéral — voir chantier 20 pour le détail complet). Entre le chantier Quêtes (17, 2026-07-13) et celui-ci : le Suivi de Songes (SONGES.md, plusieurs refontes d'interface) et un chantier style global (ambiance Krosmoz renforcée, jauge de progression des Dofus) ont aussi été faits mais pas encore documentés en détail dans cette section — voir SONGES.md et l'historique Git pour ces deux-là en attendant un futur passage de mise à jour de ce fichier.

**Phase 1 de la roadmap (encyclopédie : Donjons → Panoplies → Zones) terminée**, puis **chantier Quêtes fait le 2026-07-13** (liste + fiche, demandé directement par Popo hors de la liste des candidats ci-dessous — voir chantier 17 pour le détail complet).

**Premier feedback visuel de Popo (2026-07-10), toujours pas traité :** les pages Panoplies et Zones sont jugées pas claires, organisation à revoir — détails à venir dans `REFONTE.md` (à créer, voir ci-dessous).

**Candidats pour la prochaine session, à trancher avec Popo avant tout code (règle 1) :**
1. **Cadrage du compagnon farm/craft** — chantier stratégique (prochaine étape de la Vision après l'encyclopédie), pas un simple chantier technique : périmètre, écrans, données déjà disponibles vs manquantes à définir ensemble avant d'écrire quoi que ce soit.
2. **Mini-chantier Krag** — remplir `dofura_donjons_guides.json` (mécaniques de boss, actuellement vide, voir chantier Donjons).
3. **Création de `REFONTE.md`** — consigner le feedback visuel de Popo (Panoplies/Zones pas claires, organisation à revoir) et cadrer la refonte graphique complète déjà notée en chantier futur #1.

## Le projet

**Dofura** = encyclopédie + hub d'outils Dofus 3.0. Objectif : devenir LA référence combinant data exhaustive, outils interactifs, suivi quêtes/succès, puis comptes utilisateurs.

## Vision (2026-07-09)

Dofura vise à terme : **encyclopédie complète Dofus 3.0 + accompagnement du joueur** (suivi de progression, outils pratiques), pour rivaliser avec l'écosystème des fan-sites existants.

**Concurrents de référence :**
- [dofusdb.fr](https://dofusdb.fr) — encyclopédie exhaustive : c'est notre **source de données**, pas notre cible.
- [duffus.fr](https://duffus.fr) — guides + suivi de progression (cases à cocher) + comptes. Le modèle de notre future partie "accompagnement".
- [tougli.barbofus.com](https://tougli.barbofus.com) — guides de quêtes + overlay in-game + multilingue.
- [dofusyelle.com](https://dofusyelle.com) — curation d'expert, info directe.
- [dafous.app](https://dafous.app) — boîte à outils tout-en-un (appli Unity).

**Positionnement Dofura :** exploiter notre base relationnelle propre (monstres↔drops↔zones↔recettes↔objets↔panoplies) pour proposer des outils croisés qu'un site éditorial classique ne peut pas offrir aussi facilement. Première brique d'accompagnement visée : **compagnon de farm/craft** (objet → ingrédients → où les farmer → progression cochable).

**Retiré définitivement :** Simulateur de stuff · Commerce/HdV · Portails.

**Roadmap révisée (2026-07-09, react-router reporté) :**
1. Compléter l'encyclopédie : **Donjons ✅** → **Panoplies ✅** → **Zones ✅** (encyclopédie complète — pas de carte interactive à ce stade, voir point 7)
2. react-router (socle SEO/partage, vraies URLs) — reporté, voir Chantiers futurs
3. Compagnon de farm/craft (première brique d'accompagnement)
4. Comptes utilisateurs (Phase 4 — nécessite le volume persistant Railway, voir chantiers en cours #1)
5. Refonte graphique complète
6. Lancement — **penser à retirer le `noindex` (voir Chantiers en cours) avant cette étape**
7. **Carte interactive du monde** (référence : [dofus-map.com](https://dofus-map.com)) — maps assemblées + positions des ressources récoltables. Feature finale phare, projet majeur. **Prérequis avant tout code : mini-chantier d'étude de faisabilité données** — les positions de ressources existent-elles en structuré chez DofusDB pour Dofus 3/Unity ? Une session d'inspection pure, zéro code, avant d'engager quoi que ce soit.

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
9. **dofura.db hors Git** (régénéré uniquement si absent/vide par `init_db.py`, via `.gitignore` — voir "Prérequis Railway" ci-dessous, volume persistant en place depuis le 28 juillet 2026). **Exception : tous les JSON sources lus par `init_db.py`/`main.py` au démarrage restent DANS Git** — le déploiement Railway build depuis GitHub, donc c'est leur seule source lors du tout premier démarrage sur un volume vide. Liste à jour (2026-08-02) : `dofura_monstres.json`, `dofura_sorts.json`, `dofura_effects.json`, `dofura_effets_speciaux.json`, `dofura_etats_speciaux.json`, `dofura_items.json`, `dofura_recipes.json`, `dofura_item_sets.json`, `dofura_sorts_objets.json`, `dofura_donjons.json`, `dofura_donjons_guides.json`, `dofura_zones_areas.json`, `dofura_quetes.json`, `dofura_quetes_guides.json`, `dofura_succes.json`, `dofura_songes_items.json`, `dofura_songes_taux.json`, `dofura_songes_avis.json`, `dofura_songes_boss_modifs.json`. Voir piège #10.
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

Ces 4 règles viennent de bugs réels (le "+0" et l'effet 1175 manquants au chantier #7/#8bis, le "--100 Force" au chantier #8). Elles s'appliquent dès le prochain domaine (Classes, Zones, Donjons...), pas seulement aux objets.

1. **Ne jamais écarter un champ des données brutes sur intuition ("ça a l'air redondant").** Avant toute suppression dans un script de nettoyage : prouver par script que le champ est 100% reconstructible depuis les champs conservés, sur TOUTE la base — pas un échantillon. `possibleEffects` avait été jugé pur doublon d'`effects` au chantier #7 ; il portait en réalité le champ `value` manquant (le bug "+0") ET un effet entier absent d'`effects` (le sort accordé par les objets légendaires, chantier #8bis) — les deux fois découverts après coup, pas avant.
2. **Après tout nettoyage/import : audit automatique brut vs nettoyé.** Compter les infos par entité des deux côtés (ex. nombre d'effets par objet dans `possibleEffects` vs `effects`) et signaler tout écart. C'est ce test précis qui aurait attrapé l'effet 1175 dès le chantier #7 au lieu d'attendre un signalement utilisateur.
3. **Chaque domaine Dofus encode différemment (signes, emplacements numériques, effets).** Ne jamais supposer qu'un nouveau domaine suit les conventions du précédent : mini-inspection des données brutes AVANT d'écrire le nettoyage. Les sorts/monstres stockent toujours une magnitude positive + signe dans le texte ; les objets stockent le signe directement dans le nombre — mélanger les deux conventions a produit "--100 Force" (chantier #8).
4. **Quand un bug de données est trouvé sur un cas signalé, toujours vérifier si le motif généralise au-delà.** Le signalement portait sur les 25 objets légendaires ; le même trou touchait en réalité 344 objets toutes catégories confondues (chantier #8bis). Un correctif qui ne couvre que le cas signalé laisse une dette identique ailleurs, prête à ressurgir au prochain signalement.

## Stack & infrastructure

| Élément | Détail |
|---|---|
| Backend | Python / FastAPI (`main.py`) |
| Frontend | React / Vite — tout dans `frontend/src/App.jsx` |
| DB | SQLite `dofura.db` — tables : `monstres`, `grades`, `drops`, `sorts` (colonne `sort_id` = vrai ID Dofusdb), `zones`, `objets`, `objets_effets`, `recettes`, `panoplies`, `panoplies_effets`, `donjons`, `donjons_monstres`, `donjons_objets_requis` |
| Back déployé | Railway → https://web-production-53f2b.up.railway.app |
| Front déployé | Vercel → https://dofura.vercel.app |
| GitHub | mathieufra03-hub/Dofura |
| Dossier local | C:\Users\mathi\Documents\dofura |

**Composants App.jsx :** Navbar, StatsBar, Hero, AlmanaxBanner, EncycloGrid, SortsPanel, SortDetail, MonstrePage

**Data :** `dofura_monstres.json` (4 932 monstres fusionnés Dofensive + Dofusdb + Duffus) · `dofura_sorts.json` (8 019 sorts) · `dofura_effects.json` (302 effets) · `dofura_effets_speciaux.json` (1577 résolutions diceNum→nom pour les effets sans description propre, ex. invocations) · `dofura_items.json`/`dofura_recipes.json`/`dofura_item_sets.json` (objets, chantier #7) · `dofura_sorts_objets.json` (sorts accordés par les objets, chantier #8ter) · `dofura_donjons.json` (187 donjons) · `dofura_donjons_guides.json` (guides de boss éditoriaux, vide pour l'instant — voir chantier Donjons) · `dofura_quetes.json` (1 976 quêtes, chantier Quêtes) · icônes `.webp` locales dans `frontend/public/assets/icons/`

## Charte graphique — Krosmoz Espace (validée, ne pas modifier sans accord)

- Fond `#06070f` · surfaces `#0a0c1a` / `#0e1225` / `#121830`
- Cyan `#00d4ff` · violet `#c478ff` · or `#f0c040` · texte `#c8e4ff`
- Logo `· DOFURA ·` en Cinzel Black 900 (Google Fonts, chargée dans index.html), dégradé or→violet

## ⛔ PIÈGES TOUJOURS VALABLES

1. **Édition simultanée VS Code / Claude Code :** ne jamais avoir de modifications non sauvegardées dans VS Code pendant que Claude Code édite le même fichier — l'un écrase l'autre. Popo sauvegarde (Ctrl+S) ou ferme le fichier avant de lancer une tâche d'édition. Si un fichier semble "bizarre" dans VS Code après une édition de Claude Code : le fermer et le rouvrir.
2. **PowerShell :** attention aux `$` non échappés (bug historique : `$PORT` vide dans le Procfile) et aux commandes multi-lignes. Claude Code doit privilégier ses outils d'édition natifs plutôt que des commandes shell complexes.
3. **Traduction navigateur :** `lang="fr"` sur la div racine + `translate="no"` sur les spans d'effets sont DÉJÀ en place. Ne pas retoucher. (Bug historique : "PM" traduit en "14h".)
4. **Cache Vercel :** si la prod affiche l'ancienne version après push → Redeploy SANS cocher "Clear build cache".
5. **sort_id :** le front appelle `/sorts/{s.sort_id}` (vrai ID Dofusdb), jamais le row_id SQLite. FIXÉ — ne pas régresser.
6. **Tacle/Fuite :** valeurs à lire depuis `data[s.key]` (niveau monstre), pas `g[s.key]` (grade). FIXÉ.
7. **AssetRipper :** abandonné (compression Unity propriétaire). Icônes = webp Dofensive uniquement. Ne pas retenter.
8. **Chasse au trésor :** wrapper dofusdb.fr uniquement. Jamais de rebuild des 13 000+ indices.
9. **Dofus 3.0 : les idoles sont supprimées** — ne jamais en parler (exception : quête du Dofus Turquoise).
10. **JSON sources vs Git :** ne jamais sortir un JSON source lu par `init_db.py`/`main.py` (liste à jour dans la règle 9) du suivi Git tant que le volume persistant Railway (chantier #1) n'existe pas — Railway build depuis GitHub, donc les retirer casse le déploiement (`init_db.py` plante sans `dofura_monstres.json`, `/sorts` renvoie du vide sans `dofura_sorts.json`). Seul `dofura.db` peut sortir du suivi sans risque, car régénéré à chaque démarrage. Erreur commise puis corrigée le 2026-07-08 pendant le grand nettoyage (chantier #2) — cf. règle 9 amendée. **Réflexe à chaque nouveau domaine :** si un nouveau fichier JSON est ajouté au chargement du backend (ex. `dofura_donjons_guides.json` au chantier Donjons), l'ajouter aussi à la liste de la règle 9 dans le même commit.
11. **`PRAGMA foreign_keys` n'est activé nulle part dans ce projet** (vérifié : 0 occurrence dans `main.py`/`init_db.py`). Conséquence directe : tous les `ON DELETE CASCADE` déclarés dans les `CREATE TABLE` (ex. `songe_team_membres`→`songe_teams`, `songe_run_participants`/`songe_drops`→`songe_runs`, chantier Songes) sont **ignorés silencieusement par SQLite** — supprimer une ligne parente ne supprime PAS ses lignes filles automatiquement, elles restent orphelines. Toute suppression touchant une table avec des enfants doit gérer la cascade à la main (DELETE des lignes filles avant la ligne parente), comme le font `DELETE /songes/teams/{id}` et `DELETE /songes/runs/{id}`. Voir SONGES.md §5 règle 5. Activer le pragma globalement (et vérifier l'impact sur toutes les tables `REFERENCES` déjà existantes) est un chantier séparé, volontairement non fait — ne pas l'activer à la légère en cours de route.
12. **Un déploiement Railway synchronise le CODE, jamais le SCHÉMA de la base.** `base_deja_peuplee()` (`main.py`) ne relance `init_db.py` que si la table `monstres` est vide — sur un déploiement déjà en place, toute table ajoutée au schéma d'`init_db.py` après la toute première mise en ligne n'est donc **jamais créée**, même aux redéploiements suivants (le code évolue, le volume Railway persistant non). Trouvé le 2026-08-03 : `songe_items_trackables` et 9 autres tables manquaient en prod depuis leur création dans le code, sans jamais avoir été rattrapées (chantier 22). **Réflexe à chaque nouvelle table ajoutée au schéma :** pousser le code, PUIS appeler `POST /admin/refresh-encyclopedie` (voir Manips de référence) — sinon la table reste invisible en prod jusqu'au prochain rappel manuel de l'endpoint. Ne jamais importer `init_db.py` depuis `main.py` pour contourner ça : son code de haut niveau (chargement JSON + connexion à `DB_PATH` + DROP/CREATE/INSERT) s'exécuterait dès l'import, sur la vraie base.
13. **`CREATE TABLE` n'est pas annulé par un `conn.rollback()` sous sqlite3/Python.** Contrairement à l'intuition d'une transaction classique tout-ou-rien, une table déjà créée par un `cur.execute("CREATE TABLE ...")` peut survivre à un rollback appelé plus tard suite à une erreur ailleurs dans la même fonction — comportement du driver Python (implicite commit avant certains types de statements), pas de SQLite lui-même. Trouvé en testant l'endpoint `/admin/refresh-encyclopedie` (chantier 22) : une table s'était créée malgré l'échec global de l'appel. Ne jamais compter sur un rollback pour annuler un `CREATE TABLE` déjà exécuté — valider tout ce qui peut échouer (gardes, vérifications SQL) **avant** la moindre écriture plutôt que de faire confiance à un rollback en cas d'erreur en cours de route.

Historique : chantiers fermés et leçons de l'ancienne méthode de travail → voir doc/HISTORIQUE-CHANTIERS.md

## Manips de référence

1. **Tester en local :** `python main.py` (backend) + `npm run dev` dans `frontend/` (front)
2. **Tester l'API :** navigateur (localhost:8000 ou URL Railway)
3. **Déployer :** `git add` / `commit` / `push` → Railway + Vercel redéploient automatiquement
4. **Forcer redéploiement Railway :** interface web → Deployments → Redeploy
5. **Vider cache Vercel :** Redeploy SANS "Clear build cache"
6. **Reconstruire la DB :** `python init_db.py` (relit `dofura_monstres.json`)
7. **Lancer un script :** `python scripts\nom.py` depuis la RACINE, jamais depuis `frontend/`
8. **Après tout ajout de table au schéma d'`init_db.py` :** pousser le code, PUIS appeler `POST /admin/refresh-encyclopedie` (header `X-Admin-Token`, jamais en query param) — le déploiement seul ne crée pas la table en prod (piège #12).
9. **Après chaque push touchant le backend :** ouvrir une URL de l'API en prod (ex. `/songes/taux?intensite=paradoxe&niveau=1`) avant de considérer le déploiement terminé. Un déploiement marqué "Success" par Railway peut quand même livrer du code qui plante à l'usage (chantier 22).

## 🤖 Agents Dofuriens (sous-agents dans .claude/agents/)

- **Krag** — boss de donjons (8 fiches Frigost 3 validées, +40 donjons restants)
- **Lorn** — quêtes
- **Vex** — succès
- **Drakar** — objets/équipements
- **Roam** — zones/donjons

Règle commune : règle 13 (ne jamais inventer) + validation Popo avant intégration.

## Chantiers en cours / problèmes ouverts

0. **⚠️ SITE EN NOINDEX — RETIRER AU LANCEMENT.** Ajouté le 2026-07-09 (`frontend/index.html`, `<meta name="robots" content="noindex, nofollow" />`) : le site est en construction, Popo veut rester discret jusqu'au lancement. **Vérifié le même jour : le repo GitHub `mathieufra03-hub/Dofura` est PUBLIC** — le noindex empêche l'indexation Google du site déployé (Vercel) mais ne cache PAS le code source ni l'historique Git, visibles par quiconque a l'URL du repo. Passer le repo en privé est une décision et une manipulation qui appartiennent à Popo (Settings GitHub), pas à Claude Code. **Avant le lancement (voir Vision → Roadmap révisée) : retirer la balise `noindex` de `frontend/index.html`.**
1. **Volume persistant Railway VÉRIFIÉ (2026-07-08) : absent.** Vue d'ensemble Railway → un seul service web, pas de volume attaché (clic droit propose "Attach Volume"). Acceptable pour l'instant car `dofura.db` est regénérable via `init_db.py` (pas de perte définitive en cas de redéploiement). **Volume OBLIGATOIRE avant la Phase 4 (comptes utilisateurs)** — sans ça, les données de progression des utilisateurs seraient perdues à chaque redéploiement.
6. **Phase 4 (anticipation) :** front et back sur deux domaines → cookies impossibles proprement → prévoir JWT dans le header `Authorization`.

## Chantiers futurs (pas encore commencés)

1. **Refonte graphique complète du site (design actuel provisoire).** La charte Krosmoz Espace en place est fonctionnelle mais pas définitive — ne pas passer de temps à la peaufiner d'ici là. En attendant, tout nouveau composant doit grouper ses styles proprement (objet de styles centralisé, pas de valeurs magiques éparpillées inline) pour que ce restyling futur soit simple à faire.
2. **Migration vers react-router** (vraies URLs, corrige le retour fiche→accueil au lieu de la grille filtrée — limite connue depuis le chantier #4 —, liens partageables). **Reporté le 2026-07-09** (décision Popo) : passe après l'encyclopédie (Donjons/Panoplies/Zones), pas avant.
3. **Page Élevage/Montures.** Catégorie `super_type_nom = "Certificat de monture"` (267 objets : Dragodinde/Volkorne/Muldo) — vérifiée le 2026-07-09, c'est la bonne catégorie pour ça (pas "Certificat" tout court, qui ne contient que des objets de quête invisibles sans rapport).
4. **Filtre "Légendaires" sur la page Équipements.** Colonne `legendaire` déjà en base depuis le chantier #8bis (25 objets), juste un filtre à brancher côté `/objets` + `/objets/filtres` sur le modèle des filtres existants.
5. **Classes.** Retiré de la roadmap encyclopédie principale le 2026-07-09 (décision Popo) — utile seulement si un outil de build voit le jour un jour. Pas de valeur encyclopédique autonome suffisante pour justifier sa place dans l'ordre Donjons → Panoplies → Zones.

## Ressources

- **APIs :** api.dofusdb.fr (monstres, sorts, zones, items) · api.dofusdu.de (DofusDude — Dofus 3 + Almanax, SDK Python) · cdn.api.dofensive.com
- **Sites référence :** dofuspourlesnoobs.com · dofusdb.fr · dofensive.com · dofusplanet.fr · duffus.fr · dofusbook.net
- **Inspiration archi :** KaellyBot (GitHub, Go)
- **Concurrent à surveiller :** Tougli (tougli.barbofus.com) — guidage in-game live, pas encyclopédique.
