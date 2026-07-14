# 📖 GLOSSAIRE — Dofura
*Le dictionnaire personnel de Popo. Chaque nouveau terme technique rencontré s'ajoute ici (règle 17). Format : terme → explication simple → exemple tiré de Dofura.*

## L'atelier (les outils de travail)

**VS Code (Visual Studio Code)** — l'éditeur de code : le logiciel où tu ouvres ton dossier et vois tous les fichiers. *Chez toi : tu y ouvres C:\Users\mathi\Documents\dofura et tu peux lire App.jsx.*

**Terminal (ou ligne de commande)** — la fenêtre texte où on tape des commandes au lieu de cliquer. VS Code en a un intégré (menu Terminal → New Terminal). *C'est là que tu tapes `python main.py` pour lancer ton serveur.*

**Claude Code** — moi, version ouvrier : un programme qui tourne dans le terminal et qui peut lire, écrire et modifier tes fichiers directement. *Tu le lances en tapant `claude` dans le terminal, depuis le dossier dofura.*

**Commande slash** — une commande qui commence par `/` tapée dans Claude Code. *`/plugin install superpowers` installe le plugin superpowers.*

**Plugin** — un module qu'on installe pour ajouter une capacité à Claude Code. *claude-mem ajoute la mémoire automatique entre les sessions.*

**Skill** — une fiche d'instructions qui donne une expertise à Claude. *frontend-design lui apprend à faire de belles interfaces.*

**Sous-agent** — un spécialiste avec son propre rôle, délégué par l'agent principal. *Krag, ton spécialiste des boss de donjons, vit dans .claude/agents/krag.md.*

**CLAUDE.md** — les instructions de travail lues automatiquement par Claude Code au début de chaque session. *Le tien contient tes 17 règles et les pièges connus du projet.*

## Plugins Claude Code installés

*On gère les plugins avec la commande `/plugin` (installer, lister, désinstaller), puis `/reload-plugins` pour les activer. Règle : on n'installe que des plugins de confiance — priorité au marketplace officiel `claude-plugins-official` (Anthropic/GitHub), jamais un plugin tiers inconnu sans avoir vérifié ce qu'il fait.*

**commit-commands** (officiel) — ajoute des commandes toutes prêtes pour le workflow Git courant : committer, pousser sur GitHub, ouvrir une pull request. *Pourquoi : évite de retaper la même série de commandes git à chaque fin de chantier (règle 4 : commit + push systématique en fin de session).* Installation : `/plugin install commit-commands@claude-plugins-official`.

**security-guidance** (officiel) — relit le code généré à la recherche de failles de sécurité (injections, XSS, SSRF, secrets codés en dur, et une vingtaine d'autres familles de vulnérabilités) : alertes automatiques pendant l'édition + relecture plus poussée avant de committer. *Pourquoi : un filet de sécurité supplémentaire, dans l'esprit de la règle 12 (jamais de secret dans le code).* Installation : `/plugin install security-guidance@claude-plugins-official`.

**github (MCP)** — connecte Claude Code directement à l'API GitHub : créer des issues, gérer des pull requests, relire du code, chercher dans des dépôts. *À confirmer : l'étendue exacte de ce qu'il peut faire sur le repo Dofura (accès en écriture ?) — à vérifier via `/plugin` avant de s'en servir pour de vrai.* Installation : `/plugin install github@claude-plugins-official`.

**pr-review-toolkit** (pas encore installé, à étudier plus tard) — des sous-agents spécialisés pour la relecture de pull requests (commentaires, tests, gestion d'erreurs, conception des types, qualité et simplification du code). *Pourquoi attendre : Dofura n'a pas encore de vraies pull requests (tout part directement sur `main`) — utile le jour où le workflow Git se complexifie.*

## Les langages du projet (qui fait quoi)

**Python** — le langage du backend. Se lit presque comme de l'anglais. *Chez toi : main.py (le serveur) et tous les scrapers.*

**JavaScript (JS)** — le langage qui rend les pages web interactives. *Chez toi : tout App.jsx — les clics, les panneaux de sorts qui s'ouvrent.*

**HTML** — le squelette d'une page web : titres, boutons, images. *Chez toi : frontend/index.html, qui charge aussi la police Cinzel.*

**CSS** — l'habillage : couleurs, tailles, positions. *C'est là que vivent ton fond #06070f et ton cyan #00d4ff.*

**SQL** — le langage pour parler à une base de données. *"Donne-moi tous les monstres de la zone Frigost" se dit en SQL.*

## La symbologie de base (ce que veulent dire les signes)

**`#06070f`** — un code couleur hexadécimal : # suivi de 6 caractères qui décrivent le mélange rouge/vert/bleu. *#000000 = noir, #ffffff = blanc, #00d4ff = ton cyan Krosmoz.*

**`{ }` (accolades)** — délimitent un bloc : "tout ça va ensemble". *Dans dofura_monstres.json, chaque monstre est un bloc entre accolades.*

**`( )` (parenthèses)** — contiennent ce qu'on donne à une fonction. *print("salut") = exécute print avec le texte "salut".*

**`[ ]` (crochets)** — une liste. *["Krag", "Lorn", "Vex"] = une liste de 3 agents.*

**`=`** — attribution, pas égalité : "je range cette valeur dans cette boîte". *const API = "https://..." range l'adresse du backend dans la boîte API.*

**`//` ou `#`** — un commentaire : ligne ignorée par la machine, écrite pour les humains. *// en JavaScript, # en Python.*

**Extensions de fichiers** — la fin du nom dit ce que contient le fichier : *.py = script Python · .jsx = composant React · .md = texte formaté (comme ce glossaire) · .json = données structurées · .db = base de données.*

## Le vocabulaire du projet

**Backend** — la partie invisible côté serveur : reçoit les demandes, interroge la base, renvoie les réponses. *Chez toi : Python/FastAPI hébergé sur Railway.*

**Frontend** — la partie visible dans le navigateur. *Chez toi : React hébergé sur Vercel — ce que voient les visiteurs de dofura.vercel.app.*

**API** — le guichet entre les deux : le front demande, le back répond. *Ton front demande /sorts/42, ton back renvoie les données du sort 42.*

**Endpoint** — une adresse précise de l'API. */sorts/{sort_id} est un endpoint de Dofura.*

**Base de données (db)** — l'entrepôt organisé des données. *dofura.db : un fichier SQLite avec les tables monstres, sorts, drops, zones.*

**JSON** — un format texte pour stocker des données structurées. *dofura_monstres.json contient tes 4 932 monstres.*

**Scraper** — un script qui visite des pages web et en extrait les données automatiquement. *Tes scrapers ont récupéré 8 019 sorts.*

**Repo (repository)** — ton projet hébergé sur GitHub avec tout son historique. *github.com/mathieufra03-hub/Dofura.*

**Git** — l'outil qui enregistre chaque version du code. **Commit** = prendre une photo de l'état actuel. **Push** = envoyer ces photos sur GitHub. *Ta règle 3 : commit avant toute grosse modif = photo de secours.*

**.gitignore** — la liste des fichiers que Git doit ignorer (ne jamais envoyer sur GitHub). *C'est là qu'on mettra dofura.db pour la sortir du repo.*

**README.md** — la page d'accueil du repo : c'est quoi le projet, comment le lancer. Pour les humains. *Rédigé au grand nettoyage du 2026-07-08 : présentation, stack, lancement local, déploiement.*

**Variable d'environnement** — un réglage stocké en dehors du code. Permet de changer une valeur sans toucher au code et de garder les secrets hors de GitHub. *VITE_API_URL contient l'adresse du backend : localhost en local (`.env.local`), Railway en prod. Côté Vercel, ça se règle dans Project Settings → Environment Variables — une valeur stockée sur le serveur de Vercel, pas dans le code, appliquée au prochain build.*

**Déploiement** — publier ton code pour qu'il tourne sur internet. *Chez toi : git push → Railway (back) et Vercel (front) se mettent à jour seuls.*

**Volume persistant** — un espace de stockage qui survit aux redéploiements. Sans lui, les fichiers du serveur sont effacés et recréés à chaque push. *Vérifié absent sur Railway le 2026-07-08 — c'est pour ça que dofura_monstres.json/dofura_sorts.json/dofura_effects.json doivent rester dans Git en attendant : c'est leur seule source au déploiement.*

**diff** — la différence entre deux versions d'un fichier : ce qui a été ajouté (en vert) et supprimé (en rouge). *`git diff` montre les lignes changées avant un commit.*

**PATH** — la liste des dossiers où le système va chercher un programme quand tu tapes son nom dans le terminal. *Si `railway` répond "command not found", c'est que la CLI Railway n'est pas installée ou pas dans le PATH.*

**`git rm --cached`** — retire un fichier du suivi Git SANS le supprimer du disque (contrairement à `git rm` tout court, ou à un `rm` classique). *Utilisé pour sortir dofura.db du dépôt tout en le gardant sur ton ordinateur.*

**CORS** — le contrôle de sécurité du navigateur qui vérifie que le front a le droit de parler au back. *Ton erreur historique quand const API pointait vers localhost en prod, c'était ça.*

**Pagination** — au lieu de renvoyer toutes les lignes d'un coup, l'API en renvoie un petit paquet ("page") à la fois, avec le nombre total pour savoir combien de pages restent. *`/monstres?page=2&page_size=48` : la 2e page de 48 monstres sur les 4 932.*

**Sous-requête SQL (`IN (SELECT ...)` / `NOT IN (SELECT ...)`)** — une requête SQL imbriquée dans une autre, utilisée ici pour filtrer une table à partir d'une autre sans vraie jointure. *`id IN (SELECT monstre_id FROM zones WHERE nom = ?)` : tous les monstres présents dans une zone donnée.*

**Debounce** — attendre que l'utilisateur arrête de taper avant de lancer une action (ex. une requête réseau), pour ne pas en envoyer une à chaque lettre tapée. *La recherche de la page Monstres attend 250ms sans frappe avant d'interroger le backend.*

**Combobox** — un champ qui combine une liste déroulante et une recherche texte, utile quand la liste est trop longue pour un menu classique. *Le filtre zone (372 valeurs) : un `<select>` natif aurait été illisible, donc combobox maison avec un champ "Rechercher une zone...".*

**Réponse périmée (race condition réseau)** — quand deux requêtes partent à la suite mais reviennent dans le désordre (la 2e revient avant la 1re), et que l'appli affiche bêtement la dernière REÇUE au lieu de la dernière ENVOYÉE. *Corrigé sur la page Monstres avec un numéro de requête : chaque fetch se compare à "suis-je toujours le dernier demandé ?" avant d'afficher son résultat.*

**État (spell-state)** — un statut temporaire appliqué à un personnage en combat (buff ou debuff : "Affaibli", "Insoignable", "Pesanteur"...), distinct d'un sort. DofusDB les stocke dans une collection séparée (`api.dofusdb.fr/spell-states/{id}`) avec ses propres IDs — **qui se recoupent avec ceux des sorts sans rapport** (ex. l'ID 298 est à la fois le sort "Totem du Feu" ET l'état "Djim", deux choses différentes). *Chantier #6 : les templates "État #3" résolvent ce genre d'ID.*

**Normalisation (base de données)** — ranger chaque donnée à un seul endroit (une fiche par item, un numéro de référence partout ailleurs) plutôt que de la recopier en entier à chaque usage. Évite qu'une même donnée dupliquée 300 fois devienne 300 versions à corriger si elle change. *Chantier #7 : une recette disait "ingrédient n°303, quantité 3" plutôt que de recopier la fiche complète de l'objet 303 à chaque recette qui l'utilise — sans ça, `dofura_recipes.json` pesait 244 Mo au lieu de 2 Mo.*

**Composant paramétré (React)** — un seul composant qui change de comportement/affichage selon les props qu'on lui passe, plutôt que de copier-coller le composant pour chaque variante (principe DRY : "Don't Repeat Yourself"). *Chantier #8 : `ObjetsPage` sert à la fois pour `/equipements` et `/ressources` — seule la prop `categorie` change, le code de la grille/pagination/filtres est écrit une seule fois.*

**Audit brut vs nettoyé** — après tout script qui simplifie des données (retrait de champs jugés redondants, dédoublonnage...), comparer un compte de contrôle entre la version brute et la version nettoyée (ex. nombre d'effets par objet) pour détecter tout écart au lieu de supposer que rien n'a été perdu. *Chantier #8bis : un tel audit aurait révélé dès le chantier #7 que 344 objets perdaient un effet entier (le sort accordé par l'objet) au nettoyage — découvert seulement plus tard, sur signalement.*

**Magnitude signée vs magnitude + signe séparé** — deux façons de stocker "combien" et "dans quel sens" (bonus ou malus). Soit le nombre porte déjà son signe (-100 = un malus de 100), soit le nombre est toujours positif et un texte à côté dit "c'est un malus". Mélanger les deux fait doubler le signe. *Chantier #8 : les sorts/monstres utilisent toujours un nombre positif + signe dans le texte, mais les objets stockent le signe directement dans le nombre — un item avait affiché "--100 Force" (deux fois le signe) avant qu'on harmonise les deux conventions.*

**Clé composite** — une clé de stockage formée de PLUSIEURS valeurs collées ensemble plutôt qu'une seule, utile quand une seule valeur ne suffit pas à identifier une donnée de façon unique. *Chantier #8ter : un même sort peut être accordé à un grade différent selon l'objet qui le donne, donc `dofura_sorts_objets.json` utilise la clé `"{spell_id}_{grade}"` (ex. `"25293_2"`) plutôt que juste `spell_id`, qui aurait mélangé le contenu de plusieurs grades sous un seul sort.*

**Jointure par nom** — relier deux données par leur texte (ex. `"Cuir de Bouftou Royal" == "Cuir de Bouftou Royal"`) plutôt que par un identifiant numérique dédié. Ça marche dans l'immense majorité des cas mais n'est jamais garanti à 100% (accents, doublons de nom, source différente) — toujours prévoir un repli propre (afficher le texte seul, sans lien ni image) plutôt qu'un plantage si rien ne correspond. *Chantier Donjons : la table `drops` (sourcée Dofensive, un nom de texte) est reliée à la table `objets` (sourcée Dofusdb, chantier #7) par le nom, pour afficher l'image des drops d'un donjon — 2 items sur des dizaines n'ont pas trouvé de correspondance, affichés sans image plutôt que de bloquer toute la page.*

**Table de jonction (junction table)** — une table qui ne sert qu'à relier deux autres tables entre elles quand une donnée peut avoir plusieurs liens (un donjon a plusieurs monstres, un monstre peut apparaître dans plusieurs donjons — impossible à ranger dans une seule colonne). *`donjons_monstres` relie `donjons` et `monstres`, avec en plus un drapeau `est_boss` pour savoir lequel est le boss principal.*

**Expression régulière (regex)** — un motif de texte qui décrit "à quoi doit ressembler" une chaîne de caractères, pour la reconnaître ou en extraire un bout, plutôt que de comparer lettre à lettre. *Chantier Succès : `Q[fF][>=](\d+)` reconnaît un critère du type `QF>690,0` ou `Qf=134` et en extrait l'ID de quête (690, 134...) sans avoir à écrire un cas par variante.*

**Objectif dérivé (auto-coché)** — une case à cocher dont l'état n'est pas stocké directement, mais recalculé à chaque affichage à partir d'une autre donnée déjà suivie ailleurs — impossible à cocher à la main, elle "regarde" simplement si l'autre condition est déjà remplie. *Chantier Succès : un objectif "quête" d'un succès ne se coche jamais lui-même en base — il est marqué fait dès que toutes les étapes de la quête liée le sont, recalculé à chaque chargement de la fiche.*

---
*Termes suivants : à ajouter au fil des sessions (règle 17).*
