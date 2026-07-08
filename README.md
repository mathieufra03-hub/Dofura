# Dofura

Encyclopédie + hub d'outils pour Dofus 3.0 — data exhaustive (monstres, sorts, objets, zones...) combinée à des outils interactifs.

- **Front** : https://dofura.vercel.app
- **API** : https://web-production-53f2b.up.railway.app

## Stack

| Élément | Détail |
|---|---|
| Backend | Python / FastAPI (`main.py`) |
| Frontend | React / Vite (`frontend/`) |
| Base de données | SQLite `dofura.db`, régénérée depuis `dofura_monstres.json` |
| Backend déployé | Railway |
| Frontend déployé | Vercel |

## Lancer le projet en local

**Backend** (depuis la racine) :

```bash
pip install -r requirements.txt
python main.py
```

L'API tourne sur `http://localhost:8000`. Elle régénère `dofura.db` à chaque démarrage à partir de `dofura_monstres.json`.

**Frontend** (depuis `frontend/`) :

```bash
npm install
npm run dev
```

Copie `frontend/.env.example` en `frontend/.env.local` et adapte `VITE_API_URL` si besoin (par défaut : `http://localhost:8000`, donc le backend local ci-dessus).

## Déploiement

Un push sur `main` redéploie automatiquement Railway (backend) et Vercel (frontend). Sur Vercel, la variable d'environnement `VITE_API_URL` doit pointer vers l'URL Railway de production (configurée dans Project Settings → Environment Variables).

## Données

Les fichiers `dofura.db` et les JSON de data (`dofura_monstres.json`, `dofura_sorts.json`, `dofura_effects.json`) sont régénérables via scraping et **hors suivi Git** (voir `.gitignore`). Les scripts de scraping réutilisables sont dans `scripts/`.
