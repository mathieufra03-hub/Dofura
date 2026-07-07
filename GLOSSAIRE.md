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

**README.md** — la page d'accueil du repo : c'est quoi le projet, comment le lancer. Pour les humains. *Le tien est vide, on le rédige au grand nettoyage.*

**Variable d'environnement** — un réglage stocké en dehors du code. Permet de changer une valeur sans toucher au code et de garder les secrets hors de GitHub. *VITE_API_URL contiendra l'adresse du backend : localhost en local, Railway en prod, automatiquement.*

**Déploiement** — publier ton code pour qu'il tourne sur internet. *Chez toi : git push → Railway (back) et Vercel (front) se mettent à jour seuls.*

**Volume persistant** — un espace de stockage qui survit aux redéploiements. Sans lui, les fichiers du serveur sont effacés et recréés à chaque push. *Le coffre-fort à vérifier en priorité pour dofura.db.*

**CORS** — le contrôle de sécurité du navigateur qui vérifie que le front a le droit de parler au back. *Ton erreur historique quand const API pointait vers localhost en prod, c'était ça.*

---
*Termes suivants : à ajouter au fil des sessions (règle 17).*
