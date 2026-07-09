"""
Audit en lecture seule : fait passer TOUS les effets de TOUS les sorts par
formater_effet() (copie fidele de la version actuelle dans main.py) et
detecte tout texte final anormal. Ne modifie ni ne re-ecrit aucune donnee.

Sortie : rapport texte groupe par type de probleme, imprime et sauvegarde
dans scripts/audit_affichage_resultat.txt
"""
import json
import re
from collections import defaultdict

with open("dofura_sorts.json", "r", encoding="utf-8") as f:
    SORTS = json.load(f)

EFFECTS_DATA = {}
with open("dofura_effects.json", "r", encoding="utf-8") as f:
    for k, v in json.load(f).items():
        EFFECTS_DATA[int(k)] = v

with open("dofura_effets_speciaux.json", "r", encoding="utf-8") as f:
    EFFETS_SPECIAUX_DATA = json.load(f)

with open("dofura_etats_speciaux.json", "r", encoding="utf-8") as f:
    ETATS_SPECIAUX_DATA = json.load(f)

SORTS_DATA = {s["id"]: s for s in SORTS}

EFFECTS_ETAT_VALEUR = {950, 951, 952}
EFFECTS_ETAT_DICE = {788}
EFFECTS_SORT_CONDITION = {280, 281, 283, 284, 285, 286, 287, 290, 291, 293, 296, 1036, 1045, 2905, 2935}

with open("dofura_monstres.json", "r", encoding="utf-8") as f:
    MONSTRES = json.load(f)

# sort_id (reel, Dofusdb) -> noms des monstres qui l'utilisent
SORT_VERS_MONSTRES = defaultdict(set)
for m in MONSTRES:
    for s in m.get("sorts", []):
        sid = s.get("id")
        if sid is not None:
            SORT_VERS_MONSTRES[sid].add(m.get("nom", "?"))


def formater_effet(effet):
    """Copie fidele de formater_effet() dans main.py (2026-07-09).
    Si main.py change, revalider cette copie avant de refier ce script."""
    effect_id = effet.get("effectId")
    dice_num = effet.get("diceNum", 0)
    dice_side = effet.get("diceSide", 0)
    value_brut = effet.get("value", 0)
    duration = effet.get("duration", 0)

    effect_def = EFFECTS_DATA.get(effect_id, {})
    template = effect_def.get("description", f"Effet {effect_id}")

    if effect_def.get("boost") and effect_def.get("characteristic_operator") == "+":
        polarite = "bonus"
    elif effect_def.get("boost") and effect_def.get("characteristic_operator") == "-":
        polarite = "malus"
    else:
        polarite = None

    if template.strip() in ("#1", "#2", "#1#2", ""):
        nom = EFFETS_SPECIAUX_DATA.get(str(dice_num))
        if nom:
            nom = re.sub(r'<sprite[^>]*>', '', nom)
            nom = re.sub(r'\s{2,}', ' ', nom).strip()
        return {"texte": nom, "valeur": str(dice_num), "duration": duration,
                "effect_id": effect_id, "polarite": polarite}

    desc = template

    remplacement_1 = remplacement_2 = remplacement_3 = None
    introuvable = False
    if effect_id in EFFECTS_ETAT_VALEUR:
        remplacement_3 = ETATS_SPECIAUX_DATA.get(str(value_brut))
        introuvable = remplacement_3 is None
    elif effect_id in EFFECTS_ETAT_DICE:
        remplacement_1 = ETATS_SPECIAUX_DATA.get(str(dice_num))
        remplacement_2 = ETATS_SPECIAUX_DATA.get(str(dice_side))
        introuvable = remplacement_1 is None or remplacement_2 is None
    elif effect_id in EFFECTS_SORT_CONDITION:
        sort = SORTS_DATA.get(dice_num)
        remplacement_1 = sort.get("nom") if sort else None
        introuvable = remplacement_1 is None

    if introuvable:
        return {"texte": None, "valeur": str(dice_num), "duration": duration,
                "effect_id": effect_id, "polarite": polarite}

    try:
        dn, ds = int(dice_num), int(dice_side)
        pluriel = (dn != 1) if (ds == 0 or dn == ds) else (ds > 1)
    except (TypeError, ValueError):
        pluriel = None

    desc = desc.replace("{{~ps}}", "s" if pluriel else "")
    desc = desc.replace("{{~zs}}", "")

    if dice_side == 0 or dice_num == dice_side:
        valeur = str(dice_num)
        desc = re.sub(r'\{\{~1~2[^}]*\}\}', '', desc)
    else:
        valeur = f"{dice_num} à {dice_side}"
        desc = re.sub(r'\{\{~1~2\s*', ' ', desc)
        desc = re.sub(r'\}\}', '', desc)

    desc = desc.replace("#1", remplacement_1 if remplacement_1 is not None else str(dice_num))
    if dice_side != 0:
        desc = desc.replace("#2", remplacement_2 if remplacement_2 is not None else str(dice_side))
    else:
        desc = desc.replace("#2", remplacement_2 if remplacement_2 is not None else "")
    desc = desc.replace("#3", remplacement_3 if remplacement_3 is not None else str(value_brut))

    desc = re.sub(r'<sprite[^>]*>', '', desc)
    desc = re.sub(r'\s{2,}', ' ', desc).strip()

    if polarite == "bonus" and "#" not in desc and desc.startswith(str(dice_num)):
        desc = "+" + desc

    if desc.strip().lstrip('-+').isdigit():
        desc = None

    return {"texte": desc, "valeur": valeur, "duration": duration,
            "effect_id": effect_id, "polarite": polarite}


def effet_visible(effet):
    return bool(effet.get("visibleInTooltip") or effet.get("visibleInBuffUi") or effet.get("visibleInFightLog"))


def classifier(texte):
    if texte is None:
        return "texte_masque_none"
    t = texte.strip()
    if t == "":
        return "texte_vide"
    if re.search(r'#\d', t):
        return "placeholder_residuel"
    if re.search(r'\{\{|\}\}|~ps\b|~zs\b', t):
        return "marqueur_template_residuel"
    if re.search(r'\bNone\b', t):
        return "texte_none_litteral"
    if t.lstrip('-+').isdigit():
        return "nombre_brut_non_masque"
    if re.match(r'^Effet -?\d+$', t):
        return "effect_id_inconnu"
    if "<sprite" in t:
        return "sprite_residuel"
    if t.startswith("à ") or t.endswith(" à") or t == "à":
        return "ponctuation_orpheline"
    if "  " in t:
        return "double_espace"
    return None


# categorie -> liste de (sort_id, sort_nom, source, texte, monstres)
PROBLEMES = defaultdict(list)
sorts_touches = defaultdict(set)
monstres_touches = defaultdict(set)
total_effets = 0
masques_invisibles = 0  # filtres par effet_visible(), donc jamais montres au joueur

for sort in SORTS:
    if "erreur" in sort:
        continue
    sort_id = sort["id"]
    sort_nom = sort.get("nom", "?")
    monstres = SORT_VERS_MONSTRES.get(sort_id, set())
    for source, effets in (("effet", sort.get("effects", [])), ("effet critique", sort.get("critical_effects", []))):
        for e in effets:
            total_effets += 1
            if not effet_visible(e):
                masques_invisibles += 1
                continue  # /sorts/{id} ne les affiche plus (fix visibilite Ankama)
            resultat = formater_effet(e)
            cat = classifier(resultat["texte"])
            if cat is None:
                continue
            sorts_touches[cat].add(sort_id)
            monstres_touches[cat].update(monstres)
            PROBLEMES[cat].append({
                "sort_id": sort_id,
                "sort_nom": sort_nom,
                "source": source,
                "texte": resultat["texte"],
                "monstres": sorted(monstres)[:3],
            })

# ---------- Rapport ----------
LIBELLES = {
    "placeholder_residuel": "Placeholder non remplacé (#3, #4, #5...)",
    "marqueur_template_residuel": "Marqueur de template résiduel ({{ }}, ~ps, ~zs)",
    "texte_vide": "Texte vide après nettoyage",
    "texte_masque_none": "Texte masqué (None) — effet invisible pour le joueur",
    "texte_none_litteral": "Le mot \"None\" dans le texte affiché",
    "nombre_brut_non_masque": "Nombre brut affiché tel quel",
    "effect_id_inconnu": "effect_id absent de dofura_effects.json",
    "sprite_residuel": "Balise <sprite> résiduelle",
    "ponctuation_orpheline": "\"à\" orphelin en début/fin de texte",
    "double_espace": "Double espace dans le texte",
}

lignes = []
lignes.append(f"=== AUDIT AFFICHAGE DES EFFETS ===")
lignes.append(f"{len(SORTS)} sorts, {total_effets} effets (effet + effet critique) au total")
lignes.append(f"{masques_invisibles} effets masqués par le filtre de visibilité Ankama (jamais montrés au joueur, exclus du reste de l'audit)")
lignes.append(f"{total_effets - masques_invisibles} effets passés par formater_effet()\n")

ordre = sorted(PROBLEMES.keys(), key=lambda c: -len(PROBLEMES[c]))
for cat in ordre:
    occs = PROBLEMES[cat]
    lignes.append(f"--- {LIBELLES.get(cat, cat)} ---")
    lignes.append(f"{len(occs)} effets touchés · {len(sorts_touches[cat])} sorts concernés · {len(monstres_touches[cat])} monstres concernés")
    for ex in occs[:3]:
        mons = ", ".join(ex["monstres"]) if ex["monstres"] else "(aucun monstre ne l'utilise actuellement)"
        lignes.append(f"  ex: sort \"{ex['sort_nom']}\" (id {ex['sort_id']}, {ex['source']}) -> texte={ex['texte']!r} | monstres: {mons}")
    lignes.append("")

if not PROBLEMES:
    lignes.append("Aucun texte anormal détecté.")

texte_rapport = "\n".join(lignes)
print(texte_rapport)
with open("scripts/audit_affichage_resultat.txt", "w", encoding="utf-8") as f:
    f.write(texte_rapport)
