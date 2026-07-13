# 🐞 BUGS.md — Dofura

*Liste des bugs et petits réglages repérés pendant la construction du socle, à corriger en phase polissage (on finit d'abord toutes les fondations, on revient ensuite tout corriger d'un coup plutôt que d'interrompre le chantier en cours — règle 2).*

- [ ] **Filtre "Effets recherchés" (page Équipements)** : cocher "Intelligence" (et peut-être d'autres effets) ne filtre rien, alors que le filtre par type (ex. "Cape") fonctionne. Probablement un souci d'`effect_id` qui ne matche pas — même famille de piège que le filtre PA déjà corrigé (voir `EFFETS_RECHERCHABLES` dans `main.py`).
- [ ] **Fiche donjon** : la recette de la clé (ressources) doit s'afficher juste en dessous, dans l'encadré Accès.
