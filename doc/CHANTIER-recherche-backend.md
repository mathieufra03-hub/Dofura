# Chantier suivant — recherche backend insensible aux accents

Note écrite le 13 août 2026, à la fin du chantier "Recherche normalisée +
ergonomie J'ai drop" (frontend). Concerne les deux points de recherche
signalés comme backend, non touchés à ce chantier-là :

1. Recherche navbar (`NavSearch`, `App.jsx`) → `GET /monstres?search=...`
2. La Bibliothèque, onglet Bestiaire (`GrimoirePage`, `App.jsx`) → même endpoint

## Le bug

`main.py`, fonction `liste_monstres` (ligne ~383) :

```python
conditions = ["m.nom LIKE ?"]
params = [f"%{search}%"]
```

`LIKE` en SQLite est insensible à la casse uniquement pour l'ASCII
(a-z/A-Z) — jamais aux accents. Taper "meriana" ne trouve donc pas
"Mériana" : `%meriana%` n'est pas une sous-chaîne de "Mériana" (le `e` ne
matche pas le `é`).

**Même bug, même ligne `nom LIKE ?`, dans les endpoints suivants** (pas
demandé pour ce chantier, mais à savoir si un chantier backend groupé
est plus efficace qu'un endpoint à la fois) :
- `liste_objets` (l.692)
- `liste_panoplies` (l.959)
- `liste_donjons` (l.1051)
- `liste_regions` (l.1217/1234)
- `recherche_sous_zones` (l.1260)
- `liste_quetes` (l.1373)
- `liste_succes` (l.1668)

## Piste de correctif (pour `/monstres?search=` uniquement, scope demandé)

Éviter une migration de schéma (colonne normalisée + réimport de tous
les JSON) — trop lourd pour le problème. Utiliser une **fonction SQLite
custom**, enregistrée sur la connexion, qui applique la même logique que
`frontend/src/texte.js` (`normaliserTexte`) : minuscules, accents retirés,
apostrophes ignorées.

1. Dans `main.py`, à côté de `get_db()` :

```python
import unicodedata

def normaliser_texte(s):
    if not s:
        return ""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("'", "").replace("’", "").replace("‘", "").replace("`", "")
```

2. Enregistrer la fonction sur chaque connexion, dans `get_db()` :

```python
conn.create_function("normaliser_texte", 1, normaliser_texte)
```

3. Dans `liste_monstres`, remplacer :

```python
conditions = ["m.nom LIKE ?"]
params = [f"%{search}%"]
```

par :

```python
conditions = ["normaliser_texte(m.nom) LIKE ?"]
params = [f"%{normaliser_texte(search)}%"]
```

## Points d'attention

- **Perf** : `LIKE '%...%'` ne peut déjà pas utiliser d'index aujourd'hui
  (wildcard des deux côtés) — passer par la fonction custom n'aggrave
  rien, mais n'accélère rien non plus. Sur 4 932 monstres, non testé mais
  a priori négligeable (déjà le comportement actuel).
- **Cohérence** : la logique de `normaliser_texte` (Python) doit rester
  identique à `normaliserTexte` (JS, `frontend/src/texte.js`) — mêmes
  règles, mêmes cas limites. Si l'une évolue, vérifier l'autre.
- **Test de non-régression à écrire** : les mêmes trois cas que le
  chantier frontend (`mer` → Mériana, `diplome` → Diplôme, `damayiro` →
  d'Amayiro) + vérifier qu'un texte tapé avec les bons accents continue
  de fonctionner.
