import requests, json, time

print("Chargement dofura_sorts.json...")
sorts = json.load(open("dofura_sorts.json", encoding="utf-8"))
print(f"{len(sorts)} sorts chargés")

resultats = []
erreurs = []

for i, s in enumerate(sorts):
    spell_id = s["id"]
    try:
        r = requests.get(
            f"https://api.dofusdb.fr/spell-levels?lang=fr&spellId={spell_id}",
            timeout=10
        )
        data = r.json()
        if data["total"] == 0:
            erreurs.append(spell_id)
            continue

        sl = data["data"][0]

        # Effets
        def formater_effets(effets, effects_data):
            result = []
            for e in effets:
                eid = e.get("effectId")
                desc = effects_data.get(str(eid), {}).get("description", f"Effet {eid}")
                diceNum = e.get("diceNum", 0)
                diceSide = e.get("diceSide", 0)
                if diceNum > 0 and diceSide > 0:
                    valeur = f"{diceNum} à {diceSide}"
                elif diceNum > 0:
                    valeur = str(diceNum)
                else:
                    valeur = ""
                texte = f"{valeur} {desc}".strip() if valeur else desc
                result.append({
                    "effectId": eid,
                    "effectElement": e.get("effectElement", -1),
                    "texte": texte,
                    "valeur": valeur,
                    "duration": e.get("duration", 0),
                    "diceNum": diceNum,
                    "diceSide": diceSide,
                })
            return result

        sort_complet = {
            "id": spell_id,
            "nom": s["nom"],
            "img": s.get("img", ""),
            "ap_cost": sl.get("apCost", 0),
            "min_range": sl.get("minRange", 0),
            "range": sl.get("range", 0),
            "critical_hit_probability": sl.get("criticalHitProbability", 0),
            "max_stack": sl.get("maxStack", 0),
            "max_cast_per_turn": sl.get("maxCastPerTurn", 0),
            "max_cast_per_target": sl.get("maxCastPerTarget", 0),
            "max_global_cast_per_turn": sl.get("maxGlobalCastPerTurn", 0),
            "min_cast_interval": sl.get("minCastInterval", 0),
            "initial_cooldown": sl.get("initialCooldown", 0),
            "global_cooldown": sl.get("globalCooldown", 0),
            "cast_test_los": sl.get("castTestLos", False),
            "range_can_be_boosted": sl.get("rangeCanBeBoosted", False),
            "cast_in_line": sl.get("castInLine", False),
            "cast_in_diagonal": sl.get("castInDiagonal", False),
            "effects_raw": sl.get("effects", []),
            "critical_effects_raw": sl.get("criticalEffect", []),
        }
        resultats.append(sort_complet)

        if (i+1) % 100 == 0:
            print(f"{i+1}/{len(sorts)}...")
            json.dump(resultats, open("dofura_sorts_complet.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    except Exception as ex:
        print(f"Erreur sort {spell_id}: {ex}")
        erreurs.append(spell_id)
        time.sleep(1)

json.dump(resultats, open("dofura_sorts_complet.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"\nTerminé : {len(resultats)} sorts, {len(erreurs)} erreurs")
print(f"Erreurs : {erreurs[:20]}")