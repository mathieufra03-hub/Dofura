"""
Deduplique et distille les fichiers bruts scrapes par scraper_items.py.

Probleme : dofura_items.json/dofura_recipes.json/dofura_item_sets.json
bruts embarquent des objets complets a chaque reference (une recette
reembarque l'objet entier de chaque ingredient, une panoplie reembarque
l'objet entier de chaque membre, un item reembarque sa panoplie ET son
type entiers) -> 211+244+55.7 Mo, invendable a Git (limite 100 Mo/fichier).

Ce script ne garde que le francais (name/description), les IDs de
reference (itemSetId, resultId, ingredientId, typeId) au lieu des objets
imbriques, et renomme "from"/"to" en "diceNum"/"diceSide" pour reutiliser
formater_effet() tel quel (memes noms de champs que sorts/monstres).

Renomme les fichiers bruts en *_brut.json (backup local, jamais commite)
avant d'ecrire les versions nettoyees sous les noms canoniques.
"""
import json
import os

FICHIERS = {
    "items": "dofura_items.json",
    "recipes": "dofura_recipes.json",
    "item_sets": "dofura_item_sets.json",
}


def renommer_en_brut(fichier):
    brut = fichier.replace(".json", "_brut.json")
    if os.path.exists(brut):
        print(f"  {brut} existe deja, on ne l'ecrase pas (reprise apres un run precedent).")
        return brut
    os.rename(fichier, brut)
    print(f"  {fichier} -> {brut}")
    return brut


def index_value_par_cle(effets_possibles):
    """possibleEffects porte un champ 'value' absent de 'effects' (necessaire
    pour les templates '#3' seul type '#1 : +#3 Portee maximale', ou #3 est
    le vrai bonus). Cle (effectId, diceNum) car possibleEffects est un
    sur-ensemble de effects (contient des variantes potentielles en plus)."""
    return {(e.get("effectId"), e.get("diceNum")): e.get("value", 0) for e in effets_possibles}


def nettoyer_effets(effets_bruts, valeurs_par_cle=None):
    """Renomme from/to en diceNum/diceSide pour reutiliser formater_effet()."""
    valeurs_par_cle = valeurs_par_cle or {}
    resultat = []
    for e in effets_bruts:
        dice_num = e.get("from", 0)
        resultat.append({
            "effectId": e.get("effectId"),
            "diceNum": dice_num,
            "diceSide": e.get("to", 0),
            "value": valeurs_par_cle.get((e.get("effectId"), dice_num), 0),
            "elementId": e.get("elementId"),
            "characteristic": e.get("characteristic"),
        })
    return resultat


# effectId 1175 = "sort accorde par l'objet" (ex. legendaires, certains Dofus
# et armes) : Ankama ne le duplique JAMAIS dans "effects", il n'existe que
# dans "possibleEffects" (verifie sur 344 objets, chantier #8bis). Liste
# volontairement restreinte a ce seul effectId confirme : possibleEffects
# contient aussi des marqueurs internes (ex. "Echangeable", "Attitude") qui
# ne sont pas des effets de jeu et ne doivent pas etre affiches.
EFFECTS_A_RECUPERER_DE_POSSIBLE = {1175}


def extraire_effets_manquants(effets_bruts, effets_possibles):
    """possibleEffects utilise deja les noms diceNum/diceSide/value (contrairement
    a effects qui utilise from/to) : pas besoin de renommage, juste un filtre."""
    ids_deja_presents = {e.get("effectId") for e in effets_bruts}
    manquants = []
    for e in effets_possibles:
        eid = e.get("effectId")
        if eid in EFFECTS_A_RECUPERER_DE_POSSIBLE and eid not in ids_deja_presents:
            visible = e.get("visibleInTooltip") or e.get("visibleInBuffUi") or e.get("visibleInFightLog")
            if visible:
                manquants.append({
                    "effectId": eid,
                    "diceNum": e.get("diceNum", 0),
                    "diceSide": e.get("diceSide", 0),
                    "value": e.get("value", 0),
                    "elementId": e.get("elementId"),
                    "characteristic": e.get("characteristic"),
                })
    return manquants


def nettoyer_items(items_bruts, types_par_id):
    items = []
    for it in items_bruts:
        type_obj = it.get("type") or {}
        type_id = it.get("typeId")
        type_nom = (type_obj.get("name") or {}).get("fr", "")
        super_type_nom = ((type_obj.get("superType") or {}).get("name") or {}).get("fr", "")
        if not type_nom and type_id in types_par_id:
            type_nom = types_par_id[type_id]

        possible = it.get("possibleEffects", [])
        valeurs_par_cle = index_value_par_cle(possible)
        effets = nettoyer_effets(it.get("effects", []), valeurs_par_cle)
        effets += extraire_effets_manquants(it.get("effects", []), possible)

        items.append({
            "id": it["id"],
            "nom": (it.get("name") or {}).get("fr", ""),
            "img": it.get("img", ""),
            "level": it.get("level", 0),
            "type_id": type_id,
            "type_nom": type_nom,
            "super_type_nom": super_type_nom,
            "description": (it.get("description") or {}).get("fr", ""),
            "effects": effets,
            "item_set_id": it.get("itemSetId") if it.get("itemSetId", -1) != -1 else None,
            "has_recipe": bool(it.get("hasRecipe")),
            "price": it.get("price", 0),
            "legendaire": bool(it.get("isLegendary")),
        })
    return items


def nettoyer_recipes(recipes_bruts):
    recipes = []
    for r in recipes_bruts:
        ingredient_ids = r.get("ingredientIds", [])
        quantites = r.get("quantities", [])
        ingredients = [
            {"item_id": iid, "quantite": q}
            for iid, q in zip(ingredient_ids, quantites)
        ]
        recipes.append({
            "result_id": r.get("resultId"),
            "job_id": r.get("jobId"),
            "ingredients": ingredients,
        })
    return recipes


def nettoyer_item_sets(sets_bruts):
    sets_ = []
    for s in sets_bruts:
        item_ids = [it["id"] for it in s.get("items", [])]
        possible_par_palier = s.get("possibleEffects", [])
        effects_par_palier = []
        for i, palier in enumerate(s.get("effects", [])):
            valeurs_par_cle = index_value_par_cle(possible_par_palier[i]) if i < len(possible_par_palier) else {}
            effects_par_palier.append(nettoyer_effets(palier, valeurs_par_cle))
        sets_.append({
            "id": s["id"],
            "nom": (s.get("name") or {}).get("fr", ""),
            "level": s.get("level", 0),
            "item_ids": item_ids,
            "effects": effects_par_palier,
        })
    return sets_


def main():
    print("Chargement de dofura_item_types.json (deja propre, sert de reference type_id -> nom)...")
    with open("dofura_item_types.json", "r", encoding="utf-8") as f:
        types_bruts = json.load(f)
    types_par_id = {t["id"]: (t.get("name") or {}).get("fr", "") for t in types_bruts}

    print("\n=== items ===")
    brut = renommer_en_brut(FICHIERS["items"])
    with open(brut, "r", encoding="utf-8") as f:
        items_bruts = json.load(f)
    items = nettoyer_items(items_bruts, types_par_id)
    with open(FICHIERS["items"], "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"  {len(items)} items nettoyes -> {FICHIERS['items']}")

    print("\n=== recipes ===")
    brut = renommer_en_brut(FICHIERS["recipes"])
    with open(brut, "r", encoding="utf-8") as f:
        recipes_bruts = json.load(f)
    recipes = nettoyer_recipes(recipes_bruts)
    with open(FICHIERS["recipes"], "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    print(f"  {len(recipes)} recettes nettoyees -> {FICHIERS['recipes']}")

    print("\n=== item_sets ===")
    brut = renommer_en_brut(FICHIERS["item_sets"])
    with open(brut, "r", encoding="utf-8") as f:
        sets_bruts = json.load(f)
    sets_ = nettoyer_item_sets(sets_bruts)
    with open(FICHIERS["item_sets"], "w", encoding="utf-8") as f:
        json.dump(sets_, f, ensure_ascii=False, indent=2)
    print(f"  {len(sets_)} panoplies nettoyees -> {FICHIERS['item_sets']}")

    print("\nTermine.")


if __name__ == "__main__":
    main()
