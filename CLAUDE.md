# CLAUDE.md — Projet Dofura

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient tout ce qu'il faut savoir pour travailler sur Dofura sans casser l'existant.

## Le projet

**Dofura** = encyclopédie + hub d'outils Dofus 3.0. Objectif : devenir LA référence combinant data exhaustive, outils interactifs, suivi quêtes/succès, puis comptes utilisateurs.

**Roadmap (Structure C — Portail modulaire) :**
- **Phase 1 — Encyclopédie :** Monstres ✅ → Sorts (en cours) → Objets/Équipements → Classes → Zones → Donjons
- **Phase 2 — Outils légers :** Chasses au trésor (wrapper dofusdb, PAS de rebuild) · Calculateur DD · Carte interactive
- **Phase 3 — Outils lourds :** Suivi quêtes/succès (nécessite compte)
- **Phase 4 — Compte utilisateur :** Auth JWT, profil, sauvegarde progression
- **Retiré définitivement :** Simulateur de stuff · Commerce/HdV · Portails

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
9. **dofura.db hors Git** (régénéré à chaque démarrage par `init_db.py`, via `.gitignore`). **Exception : les JSON sources (`dofura_monstres.json`, `dofura_sorts.json`, `dofura_effects.json`) restent DANS Git** tant que Railway n'a pas de volume persistant (chantier #1) — le déploiement Railway build depuis GitHub, donc c'est actuellement leur seule source au démarrage. Voir piège #10. À revoir une fois le volume en place.
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

## Stack & infrastructure

| Élément | Détail |
|---|---|
| Backend | Python / FastAPI (`main.py`) |
| Frontend | React / Vite — tout dans `frontend/src/App.jsx` |
| DB | SQLite `dofura.db` — tables : `monstres`, `grades`, `drops`, `sorts` (colonne `sort_id` = vrai ID Dofusdb), `zones` |
| Back déployé | Railway → https://web-production-53f2b.up.railway.app |
| Front déployé | Vercel → https://dofura.vercel.app |
| GitHub | mathieufra03-hub/Dofura |
| Dossier local | C:\Users\mathi\Documents\dofura |

**Composants App.jsx :** Navbar, StatsBar, Hero, AlmanaxBanner, EncycloGrid, SortsPanel, SortDetail, MonstrePage

**Data :** `dofura_monstres.json` (4 932 monstres fusionnés Dofensive + Dofusdb + Duffus) · `dofura_sorts.json` (8 019 sorts) · `dofura_effects.json` (302 effets) · `dofura_effets_speciaux.json` (1577 résolutions diceNum→nom pour les effets sans description propre, ex. invocations) · icônes `.webp` locales dans `frontend/public/assets/icons/`

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
10. **JSON sources vs Git :** ne jamais sortir `dofura_monstres.json` / `dofura_sorts.json` / `dofura_effects.json` du suivi Git tant que le volume persistant Railway (chantier #1) n'existe pas — Railway build depuis GitHub, donc les retirer casse le déploiement (`init_db.py` plante sans `dofura_monstres.json`, `/sorts` renvoie du vide sans `dofura_sorts.json`). Seul `dofura.db` peut sortir du suivi sans risque, car régénéré à chaque démarrage. Erreur commise puis corrigée le 2026-07-08 pendant le grand nettoyage (chantier #2) — cf. règle 9 amendée.

## 📜 Leçons historiques (ancienne méthode chat + copier-coller)

*Ces galères venaient du workflow d'avant (scripts Python copiés-collés pour écrire les fichiers). Avec Claude Code qui édite directement, elles ne devraient plus se produire — mais leur esprit reste :*
- App.jsx a déjà été vidé par un script de remplacement mal ciblé → **toujours vérifier le résultat d'une grosse édition avant de continuer**, et commit avant (règle 3).
- Bugs Unicode (`\u00e9` interprétés) dans les scripts de remplacement → si un script Python doit générer du texte, préférer l'UTF-8 propre.
- "Sauvegardes fantômes" VS Code (Vite compilait une ancienne version) → si le comportement du site ne colle pas au code, vérifier le contenu réel du fichier sur le disque avant de débugger la logique.

## Manips de référence

1. **Tester en local :** `python main.py` (backend) + `npm run dev` dans `frontend/` (front)
2. **Tester l'API :** navigateur (localhost:8000 ou URL Railway)
3. **Déployer :** `git add` / `commit` / `push` → Railway + Vercel redéploient automatiquement
4. **Forcer redéploiement Railway :** interface web → Deployments → Redeploy
5. **Vider cache Vercel :** Redeploy SANS "Clear build cache"
6. **Reconstruire la DB :** `python init_db.py` (relit `dofura_monstres.json`)
7. **Lancer un script :** `python scripts\nom.py` depuis la RACINE, jamais depuis `frontend/`

## 🤖 Agents Dofuriens (sous-agents dans .claude/agents/)

- **Krag** — boss de donjons (8 fiches Frigost 3 validées, +40 donjons restants)
- **Lorn** — quêtes
- **Vex** — succès
- **Drakar** — objets/équipements
- **Roam** — zones/donjons

Règle commune : règle 13 (ne jamais inventer) + validation Popo avant intégration.

## Chantiers en cours / problèmes ouverts

1. **Volume persistant Railway VÉRIFIÉ (2026-07-08) : absent.** Vue d'ensemble Railway → un seul service web, pas de volume attaché (clic droit propose "Attach Volume"). Acceptable pour l'instant car `dofura.db` est regénérable via `init_db.py` (pas de perte définitive en cas de redéploiement). **Volume OBLIGATOIRE avant la Phase 4 (comptes utilisateurs)** — sans ça, les données de progression des utilisateurs seraient perdues à chaque redéploiement.
2. **Grand nettoyage du repo — FERMÉ (2026-07-08).** ~35 scripts jetables supprimés, outils réutilisables déplacés dans `scripts/`, `dofura_sorts_complet.json` supprimé (orphelin), `dofura.db` sorti du suivi Git (JSON sources restés en Git, voir règle 9 et piège #10), `src/` mort et `frontend/frontend/` résiduel supprimés, `VITE_API_URL` en place (code + Vercel), `changer_api.py`/`app_dump.txt` supprimés, README rédigé. Backup complet (local + Drive de Popo) fait avant toute suppression.
3. **Effets spéciaux sorts — FERMÉ (2026-07-08).** `dofura_effets_speciaux.json` complété (1577 résolutions diceNum→nom, 20 introuvables car contenu retiré du jeu) et branché dans `formater_effet()` : les effets `description: '#1'`/vide résolvent désormais le vrai nom du sort au lieu d'être masqués. Marqueurs `{{~ps}}`/`{{~zs}}` nettoyés avec vraie pluralisation (`{{~ps}}` → "s" si la valeur ou le max de la plage ≠ 1, filet de sécurité si non numérique). Testé sur Bêlement (non affecté, inchangé), Tornade (singulier "1 case") et Rage (plage "6 à 10 Dommages").
4. **Chantier #4 — Filtres zone/famille sur l'encyclopédie des monstres — FERMÉ (2026-07-09).** Enquête initiale : `famille` propre pour 4 930/4 932 monstres (32 valeurs, dont "Créatures de quête" = 56% du total à elle seule) ; `zones` (table séparée, un monstre a 0 à N zones) propre pour 1 590/4 932 (372 valeurs distinctes) — les 3 342 sans zone sont presque tous des créatures de quête/invoquées, cohérent. Découverte importante : aucune page de liste/grille de monstres n'existait avant ce chantier (juste un menu de recherche typeahead) — construite dans la foulée. Backend : `/monstres` accepte désormais `famille`/`zone`/`page`/`page_size` (garde `search`), réponse passée de liste brute à `{total, page, page_size, monstres}` (Hero, la recherche existante, adaptée en conséquence), valeur spéciale `__aucune__` pour "sans famille"/"sans zone" ; nouvel endpoint `/monstres/filtres` pour peupler les menus. Frontend : nouveau composant `MonstresPage` (grille paginée 48/page, recherche, menu famille natif, combobox zone maison avec recherche intégrée pour les 372 valeurs, bouton Réinitialiser, état vide explicite), styles regroupés dans un objet dédié pour préparer la refonte graphique à venir. Tuile EncycloGrid et lien Navbar "Monstres" branchés vers la vraie page (ils ne faisaient que revenir à l'accueil jusqu'ici). Testé en local (frontend+backend, navigateur) : grille complète, zone seule, famille+zone combinés, clic→détail, recherche 0 résultat + reset, sans-famille (2 monstres, image/famille manquantes affichées sans planter), recherche Hero toujours fonctionnelle. Limite connue non bloquante : le retour depuis une fiche détail ramène à l'accueil plutôt qu'à la grille filtrée (état des filtres non conservé) — amélioration possible plus tard, pas un bug.
4bis. **Filtres famille/zone en cascade — FERMÉ (2026-07-09).** Retour utilisateur sur le chantier #4 : les menus famille/zone étaient indépendants, un joueur pouvait choisir une combinaison sans aucun monstre (page vide sans explication). `/monstres/filtres` calcule désormais chaque liste à partir de l'AUTRE filtre uniquement (familles filtrées par la zone active, zones filtrées par la famille active — jamais par soi-même, sinon la valeur choisie disparaîtrait de son propre menu), plus `sans_famille`/`sans_zone` pour n'afficher ces options que si un monstre y correspond vraiment. **Bug trouvé et corrigé en testant :** les fetchs `/monstres` et `/monstres/filtres` n'ignoraient pas les réponses périmées — un changement de famille suivi d'un autre juste après (avant la fin du premier fetch) pouvait afficher des résultats ne correspondant plus au filtre affiché (ex. sélectionner "Créatures d'Amakna" affichait parfois "Créatures Archimonstres" en résultat). Corrigé par un identifiant de requête incrémental sur les deux effets frontend, qui ignore toute réponse qui n'est plus la dernière demandée — un piège de concurrence à surveiller pour tout futur fetch dépendant d'un filtre qui change vite. Testé dans les deux sens (famille→zones, zone→familles), combo compatible conservée, Réinitialiser restaure les listes complètes.
5. **URL dofura.fr** : à acheter/configurer.
6. **Phase 4 (anticipation) :** front et back sur deux domaines → cookies impossibles proprement → prévoir JWT dans le header `Authorization`.
7. **Chantier #5 — Lisibilité bonus/malus des effets — FERMÉ (2026-07-08).** Signalement initial : Bêlement affichait "2 PM" sans signe, soupçonné d'être un malus (devrait être "-2 PM"). Enquête sur `api.dofusdb.fr/effects/{id}` : chaque effet a `characteristicOperator` ("+"/"-"), `boost`, `bonusType` et un `oppositeId` — des champs qu'on ne stockait pas dans `dofura_effects.json` (seuls `description`/`is_in_percent` gardés jusqu'ici). **Bêlement utilise l'effet 128, confirmé en jeu par Popo : +2/+3 PM, un vrai bonus, pas un malus** — le signalement initial était une fausse alerte. Le vrai besoin qui en ressort : Ankama écrit le "-" en dur dans le texte des malus mais jamais de "+" pour les bonus → ambiguïté de lisibilité. Corrigé : `dofura_effects.json` enrichi (`characteristic_operator`/`boost`/`bonus_type`/`opposite_id`, script `scripts/enrichir_effets.py` supprimé après usage, backup pris avant modif) ; `formater_effet()` (main.py) ajoute un "+" explicite devant les bonus dont le texte démarre par la valeur brute, et expose un champ `polarite` ("bonus"/"malus"/`None`) prêt pour une future coloration vert/rouge côté frontend. Testé sur Bêlement (+2/+3 PM), Ralentissement Araknéen (-2 PA, inchangé), Ralenti (-2 PM, inchangé), vol de PA (inchangé, pas de + erroné). **Audit complémentaire (règle 13) :** échantillon de 30 sorts + 15 monstres comparés champ par champ à l'API DofusDB en direct → **0 écart trouvé**, toutes les valeurs stockées (stats, résistances, coûts de sorts, effets) correspondent à la source. Deux points mineurs notés en passant (non bloquants) : 14 sorts sur 8019 ont une erreur de scraping (IDs placeholder négatifs, 404 sur l'API) ; les champs `max_cast_per_target`/`max_global_cast_per_turn`/`min_cast_interval`/`initial_cooldown`/`cast_in_line`/`cast_in_diagonal` renvoyés par `/sorts/{id}` dans main.py ne sont jamais alimentés par `scripts/scraper_sorts.py` (toujours `null`) — à nettoyer un jour, sans urgence.

8. **Audit complet d'affichage des effets + 4 corrections — FERMÉ (2026-07-09).** Script `scripts/audit_affichage_effets.py` (gardé, pas jetable — réutilisable pour revalider après tout changement de `formater_effet()` ou des JSON d'effets) : fait passer les 34 159 effets de tous les sorts par une copie de `formater_effet()` et classe tout texte anormal par type. Corrigé (un commit par correction) : **double espace** résiduel après retrait des balises `<sprite>` (514→0) ; **balise `<sprite>` brute** dans les noms résolus via `EFFETS_SPECIAUX_DATA` — cette branche spéciale ne passait jamais par le nettoyage sprite (56→0, concentré sur Huppermage) ; **16 marqueurs `{{spell,ID,N::Label}}`** restés bruts dans `dofura_effets_speciaux.json`, échappés à l'extraction du chantier #3 (80→0 effets touchés) ; **effets masqués invisibles par Ankama** — `/sorts/{id}` exclut désormais tout effet dont `visibleInTooltip`/`visibleInBuffUi`/`visibleInFightLog` sont tous `false` (3 519 effets sur 34 159 concernés, dont les 575 qui causaient une partie du placeholder `#3` non résolu). **Comportement confirmé et assumé, ne plus se reposer la question :** le texte masqué (`None`) pour un `diceNum` non résolu dans `dofura_effets_speciaux.json` (contenu retiré du jeu) est un choix voulu, pas un bug — rien à corriger, c'est fini. Reste ouvert : voir chantier #6 ci-dessous, désormais FERMÉ.
9. **Chantier #6 — Résolution des IDs d'état (placeholder `#3`) — FERMÉ (2026-07-09).** Sur l'exemple concret demandé (Fourniture, Soryo Givrefoux) : `#3` s'est révélé être un nombre brut (champ `value`), pas un ID — bonne surprise qui a évité de généraliser une hypothèse fausse. En creusant les 21 templates utilisant `#3`, **3 familles distinctes confirmées par tests API réels** : (1) `EFFECTS_ETAT_VALEUR` `{950,951,952}` ("État #3"/"Enlève l'état #3"/"Désactive l'état #3", 1 788 instances) — le champ `value` est un ID d'état résolu via `api.dofusdb.fr/spell-states/{id}` (endpoint trouvé par exploration, pas deviné) → `dofura_etats_speciaux.json` (564 IDs, 0 introuvable) ; (2) `EFFECTS_ETAT_DICE` `{788}` ("Châtiment de #2 #1 sur #3 tours") — `diceNum`/`diceSide` aussi des IDs d'état, même résolution ; (3) `EFFECTS_SORT_CONDITION` (15 templates `"#1 : +#3 X"`, 329 instances) — `diceNum` est l'ID d'un sort déjà dans `dofura_sorts.json`, **aucun appel API nécessaire**. **Piège réel évité par vérification directe :** certains IDs (298, 2105) existent à la fois comme sort ET comme spell-state avec des noms sans rapport (298 = sort "Totem du Feu" mais état "Djim") — utiliser la mauvaise collection aurait produit un texte faux avec confiance. Un 2e lot de 74 marqueurs `{{spell,ID,N::Label}}` résiduels trouvé et corrigé dans `dofura_etats_speciaux.json` lui-même (même bug que le chantier #5, cette fois dans le nouveau fichier). Testé sur Fourniture, Flèche Douloureuse ("État Affaibli"), Châtiment Sanguin ("Châtiment de Kwavent Magnétor sur 5"), Épée du destin du Dopeul (nom de sort résolu). **Audit final : placeholder `#3` 2 743→0.** Reste 25 textes masqués (`None`) sur 30 640 effets : 13 déjà connus (contenu retiré du jeu) + 12 nouveaux légitimes (sorts référencés absents de `dofura_sorts.json`, qui n'est pas un catalogue exhaustif — construit à partir des seuls sorts utilisés par des monstres) — amélioration nette, ces 12 affichaient avant un ID brut cassé. **Domaine "affichage des effets sur les monstres" considéré clos.**

10. **Chantier #7 — Objets/Équipements (Phase 1 roadmap) — FERMÉ (2026-07-09).** Session nocturne autonome (scraping) puis session normale (dédoublonnage + intégration).
    **Scraping (nuit) :** 4 endpoints DofusDB identifiés et testés : `/items` (21 738), `/recipes` (4 858, `ingredientIds`+`quantities`+`jobId`), `/item-sets` (928 panoplies, bonus progressifs par nombre de pièces), `/item-types` (239 catégories). Pagination en liste ($limit/$skip, plafond 50/page) au lieu de requêtes individuelles. Bug trouvé et corrigé pendant la nuit : la fonction de log elle-même plantait tout le script sur une erreur `Permission denied` transitoire, corrigé en la rendant increvable (retry puis abandon silencieux de cette seule ligne). Reprise sur incident validée en conditions réelles (crash à skip=3000, redémarrage reparti pile de là, 0 perte). Résultat : 4 collections à 100%, 0 erreur, 0 doublon.
    **Dédoublonnage :** `dofura_recipes.json` (244 Mo) et `dofura_item_sets.json` (55,7 Mo) intégraient l'objet complet de chaque item référencé au lieu d'un simple ID (la même ressource utilisée dans des centaines de recettes était dupliquée intégralement à chaque fois) ; `dofura_items.json` (211 Mo) embarquait aussi sa panoplie et son type en entier en plus de sa propre description multilingue. `scripts/nettoyer_items.py` (gardé, réutilisable) : ne garde que le français, les IDs de référence, retire les métadonnées techniques → items 211→15,7 Mo, recipes 233→2 Mo, item-sets 53→1,4 Mo, tous sous la limite GitHub de 100 Mo. Effets renommés `from`/`to`→`diceNum`/`diceSide` pour réutiliser `formater_effet()`.
    **Audit avant endpoint (`scripts/audit_affichage_items.py`, demande explicite Popo) :** a révélé 18 066 effets sur 47 547 (38%) avec un `effectId` totalement absent de `dofura_effects.json` (jamais construit qu'à partir des sorts de monstres) — 164 IDs distincts récupérés via `api.dofusdb.fr/effects/{id}`, 0 introuvable.
    **Bug majeur trouvé en testant l'endpoint (au-delà de ce que l'audit textuel pouvait détecter — le texte produit était syntaxiquement valide, juste numériquement faux) :** les objets n'ont que 2 emplacements numériques (`from`/`to`) contre 3 pour sorts/monstres (`diceNum`/`diceSide`/`value`). Pour la famille de templates `"#1 : +#3 X"` (bonus lié à un sort connu, ex. "Fracture : +2 Portée maximale"), le champ `effects` (déjà simplifié par Ankama) ne porte pas le 3e nombre — il n'existe que dans `possibleEffects`, jugé à tort pur doublon et supprimé lors du dédoublonnage. Résultat avant correction : tous les objets de cette famille affichaient "+0" au lieu du vrai bonus. Corrigé : `nettoyer_items.py` reconstruit un index `(effectId, diceNum)→value` depuis `possibleEffects` (confirmé : `value` vaut 0 partout pour les stats classiques Force/Dommages/etc., donc aucune régression sur la simplification initiale — le trou ne concernait que cette famille précise). `formater_effet()` généralisé : la détection "sort-condition" passe d'une liste figée de 15 `effectId` (issue du seul chantier #6 monstres/sorts) à une détection par motif structurel (`^#1\s*:`) sur le template — 5 `effectId` supplémentaires découverts en testant les objets (ex. 289 "#1 : ligne de vue désactivée", sans `#3`) auraient été ratés par la liste figée. Nouveau filet de sécurité général : tout texte avec un `#` résiduel est masqué plutôt qu'affiché cassé. Correction annexe : numérotation des paliers de panoplie décalée d'un cran (palier stocké = nombre réel de pièces équipées, pas +1).
    **Endpoints de base :** `GET /objets` (liste, recherche par nom), `GET /objets/{id}` (détail : effets formatés, recette avec noms d'ingrédients résolus, panoplie avec bonus par palier). Nouvelles tables `init_db.py` : `objets`, `objets_effets`, `recettes`, `panoplies`, `panoplies_effets` — 0,73s pour régénérer toute la db, aucun souci de démarrage Railway malgré ~470 Mo de sources désormais en Git.
    **Testé** (avant/après le fix `value`) : Épée de Boisaille (44, témoin non affecté), Casque Keutumedi (8619, "+0"→"+2/+3/+1" corrigé), Panoplie du Bouftou (2411, palier 1 = 1 pièce confirmé), Flèche Douloureuse/Châtiment Sanguin/Bêlement/Ralenti (non-régression sorts/monstres). **Audit final : 0 anomalie restante hors "texte masqué" assumé** (3 665 sur 47 547 effets objets, mêmes causes déjà acceptées côté monstres : templates vides sans valeur ou IDs non résolvables statiquement).
    Fichiers bruts (`dofura_items_brut.json` etc., ~500 Mo cumulés) gardés localement en sécurité, jamais commités.
11. **Chantier #8 — Pages Équipements et Ressources — FERMÉ (2026-07-09).** État des lieux avant code : `super_type_nom` a survécu au dédoublonnage du chantier #7 (26 valeurs, 0 objet sans catégorie). Vérification contenu par contenu (pas de suppositions) pour trancher le périmètre "équipement portable" : Familier = vrais familiers équipables (Volkorne/Dragodinde/Montilier), mais Suiveur ("Personnage suiveur"), Compagnon ("Signe de X") et Équipement de percepteur (Tunique/Fers/Bannière de Percepteur) sont des mécaniques annexes, pas un slot d'équipement joueur — exclus après validation Popo. Périmètre final : Arme/Amulette/Anneau/Bottes/Ceinture/Chapeau/Cape/Bouclier/Dofus-Trophée-Prysmaradite/Familier (3 826 objets) pour `/equipements`, `Ressource` seul (3 639) pour `/ressources`. Les 3 072 "Certificat" enquêtés pour un chantier futur Élevage se sont révélés être des objets de quête invisibles sans rapport — la vraie catégorie montures est "Certificat de monture" (267, Dragodinde/Volkorne/Muldo), corrigée avant d'être notée en chantier futur.
    Backend : `/objets` généralisé avec `categorie` (mappée vers une liste fixe de `super_type_nom`, pas de saisie libre), `type`, `tranche_niveau` (1-50/51-100/101-150/151-200), `search`, pagination — même format `{total,page,page_size,objets}` que `/monstres`. Nouvel endpoint `/objets/filtres?categorie=...` : pas de cascade à double sens nécessaire ici (contrairement à famille/zone des monstres) puisque la catégorie est fixée par la page et ne dépend jamais du type choisi.
    Frontend : composant unique `ObjetsPage` paramétré par `categorie` (DRY, aucun copier-coller de page) réutilisé pour les deux pages — seuls titre/placeholder/messages changent, injectés depuis le point d'appel plutôt que devinés par grammaire à l'intérieur du composant. **Lacune découverte en écrivant le composant, pas anticipée au plan initial :** contrairement aux monstres (fiche détail déjà existante avant le chantier #4), aucune fiche détail objet n'existait côté frontend malgré l'endpoint `/objets/{id}` prêt depuis le chantier #7 — question posée à Popo plutôt que décidée seule, résolue par l'ajout d'`ObjetDetailPage` (effets colorés bonus/malus, recette, panoplie avec navigation croisée entre pièces). Navigation : `navLinks`/`EncycloGrid` mis à jour ("Objets"→"Équipements" + nouvelle entrée "Ressources", comptes réels), `App()` passe d'un état booléen `browsing` à trois destinations distinctes (`selectedMonstre`/`selectedObjet`/`browsing`).
    **Bug réel trouvé en testant dans le navigateur** (l'audit textuel du chantier #7 ne l'avait pas détecté — le texte produit était syntaxiquement valide, juste faux) : contrairement aux sorts/monstres où `diceNum` est toujours une magnitude positive (le signe ne vit que dans le texte du template), **les objets encodent le signe directement dans le nombre brut** (confirmé sur 953 effets bonus + 68 malus : jamais de `from` négatif côté bonus, jamais positif côté malus). Un template malus déjà préfixé `"-#1..."` recevait donc un `diceNum` déjà négatif → `"--100 Force"` au lieu de `"-100 Force"` (repro : Abranneau). Corrigé en neutralisant le signe (`abs()`) dans `formater_effet_objet()` avant l'appel au formateur partagé — `formater_effet()` lui-même non touché, aucune régression sorts/monstres. Vérifié au passage : `"-11 à -40 Force"` (plage malus, les deux bornes signées) est le rendu correct du template Ankama, pas un bug.
    **Testé** : Abrarc (témoin complet), Abranneau (malus corrigé), La Baguette des Limbes (plage malus confirmée correcte), navigation croisée entre membres de panoplie, Ressources (recherche, tranche 101-150 → 737, reset), cas 0 résultat, navigation directe Ressources→Équipements via navbar (filtres réinitialisés au changement de catégorie).

## Chantiers futurs (pas encore commencés)

1. **Refonte graphique complète du site (design actuel provisoire).** La charte Krosmoz Espace en place est fonctionnelle mais pas définitive — ne pas passer de temps à la peaufiner d'ici là. En attendant, tout nouveau composant doit grouper ses styles proprement (objet de styles centralisé, pas de valeurs magiques éparpillées inline) pour que ce restyling futur soit simple à faire.
2. **Migration vers react-router** (vraies URLs, corrige le retour fiche→accueil au lieu de la grille filtrée — limite connue depuis le chantier #4 —, liens partageables).
3. **Page Élevage/Montures.** Catégorie `super_type_nom = "Certificat de monture"` (267 objets : Dragodinde/Volkorne/Muldo) — vérifiée le 2026-07-09, c'est la bonne catégorie pour ça (pas "Certificat" tout court, qui ne contient que des objets de quête invisibles sans rapport).

## Ressources

- **APIs :** api.dofusdb.fr (monstres, sorts, zones, items) · api.dofusdu.de (DofusDude — Dofus 3 + Almanax, SDK Python) · cdn.api.dofensive.com
- **Sites référence :** dofuspourlesnoobs.com · dofusdb.fr · dofensive.com · dofusplanet.fr · duffus.fr · dofusbook.net
- **Inspiration archi :** KaellyBot (GitHub, Go)
- **Concurrent à surveiller :** Tougli (tougli.barbofus.com) — guidage in-game live, pas encyclopédique.
