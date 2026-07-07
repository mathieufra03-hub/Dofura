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

## 📜 LES 17 RÈGLES DE POPO (non négociables)

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
9. **dofura.db et les JSON regénérables hors Git** (via .gitignore).
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

**Data :** `dofura_monstres.json` (4 932 monstres fusionnés Dofensive + Dofusdb + Duffus) · `dofura_sorts.json` (8 019 sorts) · `dofura_effects.json` (302 effets) · icônes `.webp` locales dans `frontend/public/assets/icons/`

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
2. **Grand nettoyage du repo** (application des règles 5-9) : supprimer les ~25 scripts jetables de la racine, sortir dofura.db de Git, trancher sorts vs sorts_complet, clarifier src/ vs frontend/, mettre en place VITE_API_URL, supprimer changer_api.py et app_dump.txt.
3. **Effets spéciaux sorts** : certains `effect_id` (ex. 1160, 792, 793) ont `description: '#1'` — le `diceNum` est en réalité un ID de sort dont le `name.fr` est le vrai label. `scripts/fix_effets_speciaux.py` à finaliser via `api.dofusdb.fr/spell-levels`. Match par nom (`/spells?lang=fr&name=...`) à tester.
4. **Filtres zone/famille** sur l'encyclopédie : à développer.
5. **README.md** : vide, à rédiger (présentation + comment lancer le projet).
6. **URL dofura.fr** : à acheter/configurer.
7. **Phase 4 (anticipation) :** front et back sur deux domaines → cookies impossibles proprement → prévoir JWT dans le header `Authorization`.

## Ressources

- **APIs :** api.dofusdb.fr (monstres, sorts, zones, items) · api.dofusdu.de (DofusDude — Dofus 3 + Almanax, SDK Python) · cdn.api.dofensive.com
- **Sites référence :** dofuspourlesnoobs.com · dofusdb.fr · dofensive.com · dofusplanet.fr · duffus.fr · dofusbook.net
- **Inspiration archi :** KaellyBot (GitHub, Go)
- **Concurrent à surveiller :** Tougli (tougli.barbofus.com) — guidage in-game live, pas encyclopédique.
