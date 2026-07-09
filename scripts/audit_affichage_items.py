"""
Audit en lecture seule (meme principe que audit_affichage_effets.py, chantier
Monstres) applique aux objets AVANT de construire l'endpoint dessus : fait
passer tous les effets d'items et de panoplies par une copie fidele de
formater_effet() et detecte tout texte final anormal, groupe par type.

Objectif : verifier qu'aucune nouvelle surprise de template n'apparait sur
les objets avant integration (demande explicite Popo, chantier #7).
"""
import json
import re
from collections import defaultdict

with open("dofura_items.json", "r", encoding="utf-8") as f:
    ITEMS = json.load(f)

with open("dofura_item_sets.json", "r", encoding="utf-8") as f:
    ITEM_SETS = json.load(f)

EFFECTS_DATA = {}
with open("dofura_effects.json", "r", encoding="utf-8") as f:
    for k, v in json.load(f).items():
        EFFECTS_DATA[int(k)] = v

with open("dofura_effets_speciaux.json", "r", encoding="utf-8") as f:
    EFFETS_SPECIAUX_DATA = json.load(f)

with open("dofura_etats_speciaux.json", "r", encoding="utf-8") as f:
    ETATS_SPECIAUX_DATA = json.load(f)

with open("dofura_sorts.json", "r", encoding="utf-8") as f:
    SORTS_DATA = {s["id"]: s for s in json.load(f)}

EFFECTS_ETAT_VALEUR = {950, 951, 952}
EFFECTS_ETAT_DICE = {788}
EFFECTS_SORT_CONDITION = {280, 281, 283, 284, 285, 286, 287, 290, 291, 293, 296, 1036, 1045, 2905, 2935}


def formater_effet(effet):
    """Copie fidele de formater_effet() dans main.py (chantier #6, 2026-07-09)."""
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


LIBELLES = {
    "placeholder_residuel": "Placeholder non remplacé (#N)",
    "marqueur_template_residuel": "Marqueur de template résiduel ({{ }}, ~ps, ~zs)",
    "texte_vide": "Texte vide après nettoyage",
    "texte_masque_none": "Texte masqué (None)",
    "texte_none_litteral": "Le mot \"None\" dans le texte affiché",
    "nombre_brut_non_masque": "Nombre brut affiché tel quel",
    "effect_id_inconnu": "effect_id absent de dofura_effects.json",
    "sprite_residuel": "Balise <sprite> résiduelle",
    "ponctuation_orpheline": "\"à\" orphelin en début/fin de texte",
    "double_espace": "Double espace dans le texte",
}

PROBLEMES = defaultdict(list)
touches = defaultdict(set)
total_effets = 0

for it in ITEMS:
    for e in it.get("effects", []):
        total_effets += 1
        resultat = formater_effet(e)
        cat = classifier(resultat["texte"])
        if cat is None:
            continue
        touches[cat].add(it["nom"])
        PROBLEMES[cat].append({"origine": f"item \"{it['nom']}\" (id {it['id']})",
                                "texte": resultat["texte"], "effect_id": e.get("effectId")})

for s in ITEM_SETS:
    for i, palier in enumerate(s.get("effects", [])):
        for e in palier:
            total_effets += 1
            resultat = formater_effet(e)
            cat = classifier(resultat["texte"])
            if cat is None:
                continue
            touches[cat].add(s["nom"])
            PROBLEMES[cat].append({"origine": f"panoplie \"{s['nom']}\" (id {s['id']}, palier {i+1})",
                                    "texte": resultat["texte"], "effect_id": e.get("effectId")})

lignes = []
lignes.append("=== AUDIT AFFICHAGE DES EFFETS D'OBJETS/PANOPLIES ===")
lignes.append(f"{len(ITEMS)} items, {len(ITEM_SETS)} panoplies, {total_effets} effets passés par formater_effet()\n")

ordre = sorted(PROBLEMES.keys(), key=lambda c: -len(PROBLEMES[c]))
for cat in ordre:
    occs = PROBLEMES[cat]
    lignes.append(f"--- {LIBELLES.get(cat, cat)} ---")
    lignes.append(f"{len(occs)} effets touchés · {len(touches[cat])} items/panoplies concernés")
    for ex in occs[:5]:
        lignes.append(f"  ex: {ex['origine']} — effectId={ex['effect_id']} -> texte={ex['texte']!r}")
    lignes.append("")

if not PROBLEMES:
    lignes.append("Aucun texte anormal détecté.")

texte_rapport = "\n".join(lignes)
print(texte_rapport)
with open("scripts/audit_affichage_items_resultat.txt", "w", encoding="utf-8") as f:
    f.write(texte_rapport)
