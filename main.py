from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import uvicorn
import os
import json
import re
import subprocess
import tempfile
import shutil
import hmac
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from config import songes as songes_config
from taux_songes import migrer as migrer_taux_songes, calculer_bribes

# Chemin de la base en variable d'environnement (SONGES.md §2) : sur Railway,
# DB_PATH pointe vers le volume persistant monte sur /data. En local, aucune
# variable n'est definie donc on retombe sur l'ancien chemin relatif.
DB_PATH = os.getenv("DB_PATH", "dofura.db")

def base_deja_peuplee(chemin_db):
    """Vrai si le fichier existe et contient au moins une table encyclopedique
    peuplee. Les tables encyclopediques sont toutes remplies dans la meme
    passe par init_db.py (un seul commit final) : verifier 'monstres' suffit
    a savoir si tout l'import a eu lieu."""
    if not os.path.exists(chemin_db):
        return False
    try:
        conn = sqlite3.connect(chemin_db)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM monstres")
        count = cur.fetchone()[0]
        conn.close()
        return count > 0
    except sqlite3.Error:
        return False

print(f"[DB] Chemin de la base : {DB_PATH}")
if base_deja_peuplee(DB_PATH):
    print(f"[DB] Base existante et deja peuplee trouvee sur {DB_PATH} — import ignore (donnees preservees).")
else:
    print(f"[DB] Base absente ou vide sur {DB_PATH} — creation du schema et import depuis les JSON sources...")
    subprocess.run(["python", "init_db.py"])
    print("[DB] Schema cree et import termine.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cle de signature JWT en variable d'environnement (regle 12 CLAUDE.md,
# jamais de secret en dur) — le defaut ne sert qu'au dev local, a definir
# dans les Variables Railway avant tout déploiement reel avec des comptes.
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-local-secret-a-changer-en-prod")
JWT_ALGO = "HS256"
JWT_DUREE_JOURS = 30

# Jeton de sauvegarde admin (regle 12 CLAUDE.md, jamais de secret en dur) —
# AUCUNE valeur par defaut ici, contrairement a JWT_SECRET : sans ADMIN_TOKEN
# defini dans l'environnement, /admin/backup doit rester desactive plutot
# que de retomber sur une valeur devinable.
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN")

# Definis ici (avant toute route) car detail_donjon() plus bas utilise deja
# utilisateur_optionnel — les dependances FastAPI sont resolues a la
# definition de la route, pas seulement a l'appel.
def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verifier_password(password, password_hash):
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

def creer_jwt(user_id, pseudo):
    payload = {
        "user_id": user_id, "pseudo": pseudo,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_DUREE_JOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def decoder_token(authorization):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(authorization.removeprefix("Bearer "), JWT_SECRET, algorithms=[JWT_ALGO])
        return {"id": payload["user_id"], "pseudo": payload["pseudo"]}
    except jwt.InvalidTokenError:
        return None

def utilisateur_courant(authorization: str = Header(None)):
    """Dependance stricte : leve 401 si pas connecte — endpoints qui
    exigent un compte (ecriture de progression/favoris)."""
    user = decoder_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Non connecte")
    return user

def utilisateur_optionnel(authorization: str = Header(None)):
    """Variante souple : renvoie None si pas connecte, ne bloque jamais —
    pages publiques consultables sans compte qui affichent juste l'etat
    du favori/de la progression quand un utilisateur EST connecte."""
    return decoder_token(authorization)

SORTS_DATA = {}
EFFECTS_DATA = {}
EFFETS_SPECIAUX_DATA = {}

if os.path.exists("dofura_sorts.json"):
    with open("dofura_sorts.json", "r", encoding="utf-8") as f:
        for s in json.load(f):
            SORTS_DATA[s["id"]] = s

if os.path.exists("dofura_effects.json"):
    with open("dofura_effects.json", "r", encoding="utf-8") as f:
        raw = json.load(f)
        for k, v in raw.items():
            EFFECTS_DATA[int(k)] = v

if os.path.exists("dofura_effets_speciaux.json"):
    with open("dofura_effets_speciaux.json", "r", encoding="utf-8") as f:
        EFFETS_SPECIAUX_DATA = json.load(f)

ETATS_SPECIAUX_DATA = {}
if os.path.exists("dofura_etats_speciaux.json"):
    with open("dofura_etats_speciaux.json", "r", encoding="utf-8") as f:
        ETATS_SPECIAUX_DATA = json.load(f)

# Detail des sorts accordes par les objets (chantier #8ter) : cle "sortId_grade"
# car un meme sort peut etre accorde a un grade different selon l'objet
# (verifie sur 16 cas au chantier #8ter, une cle par seul sortId aurait ete fausse).
SORTS_OBJETS_DATA = {}
if os.path.exists("dofura_sorts_objets.json"):
    with open("dofura_sorts_objets.json", "r", encoding="utf-8") as f:
        SORTS_OBJETS_DATA = json.load(f)

# Guides de boss des donjons (mecaniques/salles/composition conseillee),
# cle "donjon_id" : contenu 100% editorial (jamais scrape ni invente),
# rempli progressivement par Popo/Krag. Absent de la DB (regeneree a
# chaque demarrage par init_db.py, voir regle 9) pour ne pas perdre ce
# travail au prochain redeploiement.
DONJONS_GUIDES_DATA = {}
if os.path.exists("dofura_donjons_guides.json"):
    with open("dofura_donjons_guides.json", "r", encoding="utf-8") as f:
        DONJONS_GUIDES_DATA = json.load(f)

# Contenu editorial des quetes (resume + points cles), redige par Lorn a
# partir des etapes officielles deja en base (jamais depuis DPLN/Papycha —
# voir CLAUDE.md chantier Quetes). Meme logique que DONJONS_GUIDES_DATA :
# fichier separe des donnees scrapees, {} tant qu'une zone n'a pas ete
# rediger et validee par Popo, jamais dans dofura_quetes.json.
QUETES_GUIDES_DATA = {}
if os.path.exists("dofura_quetes_guides.json"):
    with open("dofura_quetes_guides.json", "r", encoding="utf-8") as f:
        QUETES_GUIDES_DATA = json.load(f)

# Liste blanche des Avis de recherche reellement rencontres en songe (2 août
# 2026) — remplace l'ancienne heuristique "race LIKE 'Avis de recherche%'"
# qui remontait 95 monstres alors que seuls 24 existent reellement en jeu.
# Contenu editorial verifie a la main par Popo (noms exacts, un par un,
# apostrophes/accents/ligature œ inclus) — meme famille de fichier que
# DONJONS_GUIDES_DATA/QUETES_GUIDES_DATA (donnee de validation, pas un scrape).
AVIS_RECHERCHE_NOMS = []
if os.path.exists("dofura_songes_avis.json"):
    with open("dofura_songes_avis.json", "r", encoding="utf-8") as f:
        AVIS_RECHERCHE_NOMS = json.load(f)["noms"]
AVIS_RECHERCHE_SET = set(AVIS_RECHERCHE_NOMS)

# Effets dont un placeholder brut (#1/#2/#3) est en realite un ID a resoudre,
# pas un nombre (chantier #6) :
# - EFFECTS_ETAT_VALEUR : "Etat #3"/"Enleve l'etat #3"/"Desactive l'etat #3",
#   le champ "value" est un ID d'etat (api.dofusdb.fr/spell-states/{id})
# - EFFECTS_ETAT_DICE : "Chatiment de #2 #1 sur #3 tours", diceNum et diceSide
#   sont aussi des IDs d'etat
# - motif structurel "#1 : ..." (regex ci-dessous, plutot qu'une liste figee
#   d'effect_id) : diceNum est l'ID d'un sort du jeu (deja dans SORTS_DATA,
#   pas besoin de resolution externe). Trouve initialement sur 15 effect_id
#   cote sorts/monstres (chantier #6), mais motif general confirme sur les
#   objets (chantier #7) qui en utilisent 5 de plus (ex. 289 "#1 : ligne de
#   vue desactivee", sans #3) — une liste figee aurait rate ces variantes.
EFFECTS_ETAT_VALEUR = {950, 951, 952}
EFFECTS_ETAT_DICE = {788}
MOTIF_SORT_CONDITION = re.compile(r'^#1\s*:')

def formater_effet(effet):
    effect_id = effet.get("effectId")
    dice_num = effet.get("diceNum", 0)
    dice_side = effet.get("diceSide", 0)
    value_brut = effet.get("value", 0)
    duration = effet.get("duration", 0)

    effect_def = EFFECTS_DATA.get(effect_id, {})
    template = effect_def.get("description", f"Effet {effect_id}")

    # Polarite issue des champs Ankama (characteristic_operator/boost), pas d'une
    # supposition sur le texte : sert au "+" explicite ci-dessous et a la future
    # coloration vert/rouge cote frontend.
    if effect_def.get("boost") and effect_def.get("characteristic_operator") == "+":
        polarite = "bonus"
    elif effect_def.get("boost") and effect_def.get("characteristic_operator") == "-":
        polarite = "malus"
    else:
        polarite = None

    # Certains effect_id (ex. invocation) n'ont pas de vraie description : le
    # diceNum est en realite l'ID d'un sort dont le nom est le vrai libelle.
    if template.strip() in ("#1", "#2", "#1#2", ""):
        nom = EFFETS_SPECIAUX_DATA.get(str(dice_num))
        if nom:
            # Certains noms resolus contiennent encore une balise <sprite> brute
            # copiee depuis la description Ankama d'origine.
            nom = re.sub(r'<sprite[^>]*>', '', nom)
            nom = re.sub(r'\s{2,}', ' ', nom).strip()
        return {
            "texte": nom,
            "valeur": str(dice_num),
            "duration": duration,
            "effect_id": effect_id,
            "polarite": polarite,
        }

    desc = template

    # Resolution des placeholders qui sont en realite des IDs (etat ou sort)
    # plutot que des nombres (chantier #6). Par defaut #1/#2/#3 restent des
    # nombres bruts ; ces trois familles remplacent l'un ou l'autre par un nom.
    remplacement_1 = remplacement_2 = remplacement_3 = None
    introuvable = False
    if effect_id in EFFECTS_ETAT_VALEUR:
        remplacement_3 = ETATS_SPECIAUX_DATA.get(str(value_brut))
        introuvable = remplacement_3 is None
    elif effect_id in EFFECTS_ETAT_DICE:
        remplacement_1 = ETATS_SPECIAUX_DATA.get(str(dice_num))
        remplacement_2 = ETATS_SPECIAUX_DATA.get(str(dice_side))
        introuvable = remplacement_1 is None or remplacement_2 is None
    elif MOTIF_SORT_CONDITION.match(template.strip()):
        sort = SORTS_DATA.get(dice_num)
        remplacement_1 = sort.get("nom") if sort else None
        introuvable = remplacement_1 is None

    if introuvable:
        return {
            "texte": None,
            "valeur": str(dice_num),
            "duration": duration,
            "effect_id": effect_id,
            "polarite": polarite,
        }

    try:
        dn, ds = int(dice_num), int(dice_side)
        pluriel = (dn != 1) if (ds == 0 or dn == ds) else (ds > 1)
    except (TypeError, ValueError):
        pluriel = None  # valeur non numerique : filet de securite, pas de pluriel devine

    # Nettoyage des marqueurs de pluriel AVANT le nettoyage generique de "}}"
    # ci-dessous (qui sinon mange leur accolade fermante en premier).
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

    # Le retrait de la balise laisse l'espace qui l'entourait des deux cotes
    # (ex. "1 <sprite name=\"PA\"> PA" -> "1  PA") : on les recollapse a un seul.
    desc = re.sub(r'<sprite[^>]*>', '', desc)
    desc = re.sub(r'\s{2,}', ' ', desc).strip()

    # "+" explicite pour les bonus dont le texte demarre par la valeur brute
    # (ex. "2 PM" -> "+2 PM"), symetrique du "-" deja integre par Ankama dans
    # le texte des malus. Le garde-fou "#" absent exclut les rares templates
    # a placeholders au-dela de #3 (non geres), et startswith(valeur) exclut
    # les tournures verbales ("Vole 2 PM") qui n'ont
    # pas besoin de signe.
    if polarite == "bonus" and "#" not in desc and desc.startswith(str(dice_num)):
        desc = "+" + desc

    # Filet de securite general : un placeholder au-dela de #1/#2/#3 (ex.
    # #4, jamais gere) laisserait un texte casse — on masque plutot que
    # d'afficher un residu (trouve sur des objets : "Emballe par : #4",
    # "Renommer la guilde : #4" referencent une donnee dynamique par
    # instance de jeu, impossible a resoudre statiquement).
    if "#" in desc:
        desc = None
    # Si la description source était juste '#1', le texte final est un nombre brut — on le masque
    elif desc.strip().lstrip('-+').isdigit():
        desc = None

    return {
        "texte": desc,
        "valeur": valeur,
        "duration": duration,
        "effect_id": effect_id,
        "polarite": polarite,
    }

def effet_visible(effet):
    # Si Ankama marque un effet invisible partout (tooltip/UI de buff/log de
    # combat), il n'est pas cense etre montre au joueur en jeu non plus.
    return bool(effet.get("visibleInTooltip") or effet.get("visibleInBuffUi") or effet.get("visibleInFightLog"))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

SANS_VALEUR = "__aucune__"

# Bestiaire (fusion Monstres + Zones) : categories calculees, pas stockees.
# "Boss de donjon" et "Archimonstre"/"Monstre de quete" viennent de deux
# mecanismes differents (jointure donjons_monstres.est_boss vs famille) —
# verifie sur la base (135 monstres boss, familles "Creatures Archimonstres"/
# "Creatures de quete" deja connues du chantier Zones). Un monstre peut
# cumuler plusieurs categories (ex. boss ET archimonstre) : priorite
# d'affichage boss > archi > quete pour le badge (une seule pastille par
# vignette), mais le filtre matche sur l'union (OR) des cases cochees.
CATEGORIE_LABELS = {"boss": "Boss de donjon", "avis": "Avis de recherche", "archi": "Archimonstre", "quete": "Monstre de quête", "monstre": "Monstre"}
# "avis" (corrige le 2 août 2026) : liste blanche explicite AVIS_RECHERCHE_NOMS
# (24 noms, voir plus haut) au lieu de "race LIKE 'Avis de recherche%'" —
# l'heuristique par race remontait 95 monstres, verifie a la main par Popo
# que seuls 24 existent reellement en jeu. Condition parametree (m.nom IN
# (?,?,...)) : ces noms contiennent des apostrophes (Aermyne 'Braco'
# Scalptaras) qu'un simple format-string aurait casse, d'ou le placeholder —
# voir liste_monstres, ou les valeurs sont ajoutees a `params` a la main des
# que "avis" (ou "quete", meme raison) est choisi. "quete" exclut les memes
# 24 noms pour rester coherente (pas de double-compte) — jamais selectionne
# depuis l'interface actuelle (CATEGORIES_MONSTRE_GRIMOIRE ne l'inclut pas),
# gardee correcte quand meme. "monstre" exclut deja Créatures de quête en
# bloc (test sur famille) — rien a changer de ce cote.
_AVIS_IN_SQL = "(" + ",".join(["?"] * len(AVIS_RECHERCHE_NOMS)) + ")" if AVIS_RECHERCHE_NOMS else "(NULL)"
# Collision trouvee en testant (2 août 2026) : deux monstres differents
# partagent le nom "Vengeuse Masquée" (id 2905 et 7949) — verifie sur
# api.dofusdb.fr, les deux existent reellement et ont isBounty=true, mais
# seul l'id 2905 a la race "Avis de recherche de Frigost" (raceId 90,
# "Frigost Wanted Notices") ; le 7949 est classe race "Monstres de quête"
# (raceId 50, generique) malgre son isBounty. m.nom IN (...) seul les
# confondait tous les deux (25 au lieu de 24) — race LIKE en filtre
# supplementaire les distingue, sans revenir a l'ancienne heuristique
# (qui balayait TOUTE la base, ici c'est une restriction a l'INTERIEUR
# de la liste blanche, ne peut jamais reintroduire les 71 autres).
CATEGORIE_CONDITIONS = {
    "boss":    "m.id IN (SELECT monstre_id FROM donjons_monstres WHERE est_boss = 1)",
    "avis":    f"m.nom IN {_AVIS_IN_SQL} AND m.race LIKE 'Avis de recherche%'",
    "archi":   "m.famille = 'Créatures Archimonstres'",
    "quete":   f"m.famille = 'Créatures de quête' AND m.nom NOT IN {_AVIS_IN_SQL}",
    "monstre": "m.id NOT IN (SELECT monstre_id FROM donjons_monstres WHERE est_boss = 1) AND (m.famille IS NULL OR m.famille NOT IN ('Créatures Archimonstres', 'Créatures de quête'))",
}
# Reutilise partout : niveau "naturel" de rencontre = grade le plus bas du
# monstre (deja la convention du chantier Zones, pas la plage complete).
SQL_NIVEAU_BASE = "(SELECT monstre_id, MIN(niveau) AS niveau_base FROM grades GROUP BY monstre_id)"

@app.get("/monstres")
def liste_monstres(search: str = "", region: str = "", sous_zone: str = "", categorie: str = "",
                    niveau_min: int = 1, niveau_max: int = 999, tri: str = "az",
                    page: int = 1, page_size: int = 48,
                    user: dict = Depends(utilisateur_optionnel)):
    page = max(page, 1)
    # Plafond releve 200->400 pour l'Archidex (chantier Dofus, 306
    # archimonstres a afficher sans pagination pour l'usage "checklist" —
    # jamais un total en dur, juste une marge technique de pagination).
    page_size = min(max(page_size, 1), 400)

    conditions = ["m.nom LIKE ?"]
    params = [f"%{search}%"]

    regions_choisies = [r for r in region.split(",") if r]
    if regions_choisies:
        conditions.append(f"""m.id IN (
            SELECT z.monstre_id FROM zones z JOIN zones_areas za ON za.nom = z.nom
            WHERE za.area IN ({','.join('?' for _ in regions_choisies)})
        )""")
        params.extend(regions_choisies)

    sous_zones_choisies = [s for s in sous_zone.split(",") if s]
    if sous_zones_choisies:
        conditions.append(f"m.id IN (SELECT monstre_id FROM zones WHERE nom IN ({','.join('?' for _ in sous_zones_choisies)}))")
        params.extend(sous_zones_choisies)

    categories_choisies = [c for c in categorie.split(",") if c in CATEGORIE_CONDITIONS]
    if categories_choisies:
        conditions.append("(" + " OR ".join(CATEGORIE_CONDITIONS[c] for c in categories_choisies) + ")")
        # "avis"/"quete" contiennent chacune un IN (?,?,...) sur
        # AVIS_RECHERCHE_NOMS (voir CATEGORIE_CONDITIONS) — params ajoutes ici
        # dans le meme ordre que le OR-join ci-dessus, seules categories du
        # dict a porter des placeholders.
        for c in categories_choisies:
            if c in ("avis", "quete") and AVIS_RECHERCHE_NOMS:
                params.extend(AVIS_RECHERCHE_NOMS)

    conditions.append("base.niveau_base BETWEEN ? AND ?")
    params.extend([niveau_min, niveau_max])

    where_clause = " AND ".join(conditions)
    # Region "principale" (premiere par ordre alpha) : utilisee pour le tri/
    # regroupement "Par zone" et affichee en tooltip — un monstre peut avoir
    # plusieurs zones, on ne peut en montrer qu'une sur la vignette.
    sql_region_principale = """(
        SELECT MIN(za.area) FROM zones z JOIN zones_areas za ON za.nom = z.nom WHERE z.monstre_id = m.id
    )"""
    sql_sous_zone_principale = "(SELECT MIN(z.nom) FROM zones z WHERE z.monstre_id = m.id)"

    ordres = {
        "az": "m.nom",
        "zone": f"(region_principale IS NULL), region_principale, m.nom",
    }
    order_by = ordres.get(tri, ordres["az"])

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT COUNT(*) FROM monstres m JOIN {SQL_NIVEAU_BASE} base ON base.monstre_id = m.id
        WHERE {where_clause}
    """, params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT m.id, m.nom, m.image_url, m.famille, m.race, base.niveau_base,
               {sql_region_principale} AS region_principale,
               {sql_sous_zone_principale} AS sous_zone_principale,
               (m.id IN (SELECT monstre_id FROM donjons_monstres WHERE est_boss = 1)) AS est_boss,
               (m.id IN (SELECT monstre_id FROM songe_boss_modifs)) AS modif_songe
        FROM monstres m
        JOIN {SQL_NIVEAU_BASE} base ON base.monstre_id = m.id
        WHERE {where_clause}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()

    # Suivi "chasse" (Archidex, chantier Dofus) : reutilise progression_joueur
    # avec un nouveau element_type 'archimonstre' (table generique deja concue
    # pour ca, aucune migration necessaire). chasses_total = nombre de
    # monstres COCHES parmi tout l'ensemble filtre (pas seulement la page
    # affichee), pour un compteur global juste sans devoir tout charger cote
    # front — jamais un chiffre en dur, toujours recalcule depuis la base.
    chasses_ids = set()
    chasses_total = None
    if user:
        cur.execute("""
            SELECT element_id FROM progression_joueur
            WHERE user_id = ? AND element_type = 'archimonstre' AND fait = 1
        """, (user["id"],))
        chasses_ids = {r["element_id"] for r in cur.fetchall()}
        cur.execute(f"""
            SELECT m.id FROM monstres m JOIN {SQL_NIVEAU_BASE} base ON base.monstre_id = m.id
            WHERE {where_clause}
        """, params)
        ids_filtres = {str(r["id"]) for r in cur.fetchall()}
        chasses_total = len(chasses_ids & ids_filtres)

    conn.close()

    def categorie_de(r):
        # Priorite d'affichage (badge) : boss > avis > archi > quete > monstre
        # — 0 chevauchement boss/avis constate en base, ordre fixe quand meme.
        # nom ET race : meme garde-fou que CATEGORIE_CONDITIONS["avis"] contre
        # la collision "Vengeuse Masquée" (id 2905 vs 7949, meme nom, races
        # differentes — un seul est reellement classe "Avis de recherche").
        if r["est_boss"]: return "boss"
        if r["nom"] in AVIS_RECHERCHE_SET and r["race"] and r["race"].startswith("Avis de recherche"): return "avis"
        if r["famille"] == "Créatures Archimonstres": return "archi"
        if r["famille"] == "Créatures de quête": return "quete"
        return "monstre"

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "chasses_total": chasses_total,
        "monstres": [
            {
                "id": r["id"], "nom": r["nom"], "image_url": r["image_url"],
                "niveau": r["niveau_base"], "region": r["region_principale"], "sous_zone": r["sous_zone_principale"],
                "categorie": categorie_de(r),
                "chasse": str(r["id"]) in chasses_ids,
                "modif_songe": bool(r["modif_songe"]),
            }
            for r in rows
        ],
    }

@app.get("/monstres/filtres")
def filtres_monstres(region: str = ""):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT DISTINCT area FROM zones_areas WHERE area IS NOT NULL ORDER BY area")
    regions = [r[0] for r in cur.fetchall()]

    # Sous-zones disponibles : filtrees par les regions cochees (cascade —
    # cocher une region revele ses sous-zones). Sans region cochee, aucune
    # sous-zone proposee (comme la maquette : "Coche une zone pour affiner").
    sous_zones = []
    regions_choisies = [r for r in region.split(",") if r]
    if regions_choisies:
        cur.execute(f"""
            SELECT nom FROM zones_areas WHERE area IN ({','.join('?' for _ in regions_choisies)}) ORDER BY nom
        """, regions_choisies)
        sous_zones = [r[0] for r in cur.fetchall()]

    cur.execute(f"SELECT MIN(niveau_base), MAX(niveau_base) FROM {SQL_NIVEAU_BASE}")
    niveau_min_dispo, niveau_max_dispo = cur.fetchone()

    conn.close()
    return {
        "regions": regions,
        "sous_zones": sous_zones,
        "categories": [{"valeur": k, "label": v} for k, v in CATEGORIE_LABELS.items()],
        "niveau_min": niveau_min_dispo or 1, "niveau_max": niveau_max_dispo or 200,
    }

@app.get("/monstres/{monstre_id}")
def detail_monstre(monstre_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM monstres WHERE id = ?", (monstre_id,))
    monstre = cur.fetchone()
    if not monstre:
        return {"erreur": "Monstre introuvable"}
    cur.execute("SELECT * FROM grades WHERE monstre_id = ? ORDER BY niveau", (monstre_id,))
    grades = cur.fetchall()
    cur.execute("SELECT * FROM drops WHERE monstre_id = ?", (monstre_id,))
    drops = cur.fetchall()
    cur.execute("SELECT id, monstre_id, nom, sort_id FROM sorts WHERE monstre_id = ?", (monstre_id,))
    sorts = cur.fetchall()
    cur.execute("SELECT * FROM zones WHERE monstre_id = ?", (monstre_id,))
    zones = cur.fetchall()
    cur.execute("""
        SELECT d.id, d.nom, dm.est_boss
        FROM donjons_monstres dm
        JOIN donjons d ON d.id = dm.donjon_id
        WHERE dm.monstre_id = ?
        ORDER BY d.nom
    """, (monstre_id,))
    donjons = cur.fetchall()
    # Modification en songe (2 août 2026, table songe_boss_modifs) : "titre"
    # est repete sur chaque ligne (denormalise, une ligne = un point de la
    # liste a puces), on ne garde que la 1ere occurrence pour la reponse.
    cur.execute("SELECT titre, ligne FROM songe_boss_modifs WHERE monstre_id = ? ORDER BY ordre", (monstre_id,))
    modif_lignes = cur.fetchall()
    modif_songe = {"titre": modif_lignes[0]["titre"], "lignes": [r["ligne"] for r in modif_lignes]} if modif_lignes else None
    conn.close()
    return {
        **dict(monstre),
        "grades": [dict(g) for g in grades],
        "drops": [dict(d) for d in drops],
        "sorts": [dict(s) for s in sorts],
        "zones": [dict(z) for z in zones],
        "donjons": [{"id": d["id"], "nom": d["nom"], "est_boss": bool(d["est_boss"])} for d in donjons],
        "modif_songe": modif_songe,
    }

@app.get("/sorts/{sort_id}")
def detail_sort(sort_id: int):
    sort = SORTS_DATA.get(sort_id)
    if not sort:
        return {"erreur": "Sort introuvable"}
    return {
        "id": sort["id"],
        "nom": sort.get("nom", ""),
        "img": sort.get("img", ""),
        "ap_cost": sort.get("ap_cost"),
        "range": sort.get("range"),
        "min_range": sort.get("min_range"),
        "critical_hit_probability": sort.get("critical_hit_probability"),
        "cast_test_los": sort.get("cast_test_los"),
        "range_can_be_boosted": sort.get("range_can_be_boosted"),
        "max_cast_per_turn": sort.get("max_cast_per_turn"),
        "max_cast_per_target": sort.get("max_cast_per_target"),
        "max_global_cast_per_turn": sort.get("max_global_cast_per_turn"),
        "min_cast_interval": sort.get("min_cast_interval"),
        "initial_cooldown": sort.get("initial_cooldown"),
        "global_cooldown": sort.get("global_cooldown"),
        "cast_in_line": sort.get("cast_in_line"),
        "cast_in_diagonal": sort.get("cast_in_diagonal"),
        "effects": [f for e in sort.get("effects", []) if effet_visible(e) and (f:=formater_effet(e))["texte"] is not None],
        "critical_effects": [f for e in sort.get("critical_effects", []) if effet_visible(e) and (f:=formater_effet(e))["texte"] is not None],
    }

# Templates a #3 seul (sans #1 ni #2) rencontres sur des objets/panoplies ou
# #3 est en realite l'ID d'un sort accorde par l'objet, resolu via SORTS_DATA
# comme EFFECTS_SORT_CONDITION (memes garde-fous : introuvable -> masque).
EFFECTS_OBJET_SORT_3 = {604, 2864}

def formater_effet_objet(row):
    effect_id = row["effect_id"]
    dice_num = row["dice_num"]  # = champ "from" cote objets
    template = EFFECTS_DATA.get(effect_id, {}).get("description", "")

    if effect_id in EFFECTS_OBJET_SORT_3:
        sort = SORTS_DATA.get(dice_num)
        if not sort:
            return {"texte": None, "valeur": str(dice_num), "duration": 0,
                    "effect_id": effect_id, "polarite": None}
        return {"texte": template.replace("#3", sort["nom"]), "valeur": str(dice_num),
                "duration": 0, "effect_id": effect_id, "polarite": None}

    # Contrairement aux sorts/monstres (diceNum toujours une magnitude
    # positive, le signe ne vivant que dans le texte du template), les objets
    # encodent le signe DANS le nombre brut (confirme sur 953+68 effets :
    # les templates bonus n'ont jamais de from negatif, les templates malus
    # jamais de from positif). Un template malus a deja son "-" en dur
    # ("-#1...") : lui donner un diceNum deja negatif produirait "--100".
    # On neutralise donc le signe cote objets, le template porte le sien.
    dice_num_abs = abs(dice_num)
    dice_side_abs = abs(row["dice_side"])

    # Les objets n'ont que 2 emplacements numeriques (from/to, ici diceNum/
    # diceSide) contre 3 pour les sorts/monstres (diceNum/diceSide/value).
    # Quand un template n'utilise QUE #3 (ex. "+#3 Points d'experience"),
    # c'est diceNum (from) qui porte la vraie valeur, pas "value" (absent
    # des effets d'objets pour ce cas — value ne sert que pour la famille
    # etat du chantier #6, jamais utilisee par les objets).
    trois_seul = "#3" in template and "#1" not in template and "#2" not in template
    if trois_seul:
        return formater_effet({
            "effectId": effect_id, "diceNum": 0, "diceSide": 0,
            "value": dice_num_abs, "duration": 0,
        })

    return formater_effet({
        "effectId": effect_id,
        "diceNum": dice_num_abs,
        "diceSide": dice_side_abs,
        "value": row["value"],
        "duration": 0,
    })

# Perimetre verifie le 2026-07-09 (chantier Equipements/Ressources) : ces
# valeurs de super_type_nom sont les seules a representer un objet que le
# joueur porte reellement (slot d'equipement classique). Volontairement
# exclu : Suiveur/Compagnon/Equipement de percepteur (mecaniques annexes,
# pas un slot d'equipement joueur) — voir CLAUDE.md pour le detail.
CATEGORIES_OBJETS = {
    "equipement": ("Arme", "Amulette", "Anneau", "Bottes", "Ceinture", "Chapeau",
                   "Cape", "Bouclier", "Dofus / Trophée / Prysmaradite", "Familier"),
    "ressource": ("Ressource",),
}

TRANCHES_NIVEAU = {
    "1-50": (1, 50), "51-100": (51, 100), "101-150": (101, 150), "151-200": (151, 200),
}

# Filtre "Effets recherchés" des équipements (§5 CLAUDE.md, "le filtre tueur").
# Chaque effect_id a ete verifie individuellement dans dofura_effects.json
# (boost=true, characteristic_operator="+", description au mot entier) —
# PAS un simple substring sur le nom, qui aurait aussi remonte des mecaniques
# homonymes sans rapport avec un vrai bonus de stat portee par l'objet :
# "Esquive PA"(160)/"Retrait PA"(410)/"Vole PA"(84) pour PA, meme piege pour PM.
# Seule Vitalite a plusieurs effect_id verifies (valeur fixe + 2 variantes %).
EFFETS_RECHERCHABLES = {
    "Force":        (118,),
    "Agilité":      (119,),
    "Chance":       (123,),
    "Sagesse":      (124,),
    "Vitalité":     (125, 1078, 2844),
    "Intelligence": (126,),
    "PA":           (111,),
    "PM":           (128,),
}

@app.get("/objets")
def liste_objets(categorie: str = "equipement", search: str = "", type: str = "",
                  niveau_min: int = 1, niveau_max: int = 999,
                  effets: str = "", panoplie: bool = False, legendaire: bool = False,
                  tri: str = "az", page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)
    super_types = CATEGORIES_OBJETS.get(categorie, CATEGORIES_OBJETS["equipement"])

    conditions = [f"super_type_nom IN ({','.join('?' for _ in super_types)})", "nom LIKE ?"]
    params = list(super_types) + [f"%{search}%"]

    # Multi-selection (checkboxes, pas un menu deroulant) : plusieurs types
    # a la fois, "__aucune__" mele aux vrais types possible (OR, pas AND).
    types_choisis = [t for t in type.split(",") if t]
    if types_choisis:
        sous_conditions = []
        if SANS_VALEUR in types_choisis:
            sous_conditions.append("(type_nom IS NULL OR type_nom = '')")
            types_choisis = [t for t in types_choisis if t != SANS_VALEUR]
        if types_choisis:
            sous_conditions.append(f"type_nom IN ({','.join('?' for _ in types_choisis)})")
            params.extend(types_choisis)
        conditions.append("(" + " OR ".join(sous_conditions) + ")")

    conditions.append("niveau BETWEEN ? AND ?")
    params.extend([niveau_min, niveau_max])

    if panoplie:
        conditions.append("panoplie_id IS NOT NULL")
    if legendaire:
        conditions.append("legendaire = 1")

    # Effets recherches : logique ET (l'objet doit porter TOUS les effets
    # coches, ex. Force + Vitalite en meme temps), un EXISTS par effet choisi.
    effets_choisis = [e for e in effets.split(",") if e in EFFETS_RECHERCHABLES]
    for e in effets_choisis:
        ids = EFFETS_RECHERCHABLES[e]
        conditions.append(f"""EXISTS (
            SELECT 1 FROM objets_effets oe
            WHERE oe.objet_id = objets.id AND oe.effect_id IN ({','.join('?' for _ in ids)})
        )""")
        params.extend(ids)

    where_clause = " AND ".join(conditions)

    ordres = {
        "az": "nom",
        "niveau_desc": "niveau DESC, nom",
        "niveau_asc": "niveau ASC, nom",
        "type": "type_nom, niveau DESC",
    }
    order_by = ordres.get(tri, ordres["az"])

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM objets WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT id, nom, img, niveau, type_nom, legendaire, panoplie_id FROM objets
        WHERE {where_clause}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()

    # Effets formates par objet (pour le tooltip au survol des vignettes) :
    # une seule requete groupee sur la page courante (max page_size lignes),
    # pas une par objet — meme fonction de formatage que la fiche detail
    # (formater_effet_objet), une seule source de verite pour le texte.
    effets_par_objet = {}
    ids_page = [r["id"] for r in rows]
    if ids_page:
        cur.execute(f"""
            SELECT * FROM objets_effets WHERE objet_id IN ({','.join('?' for _ in ids_page)})
        """, ids_page)
        for e in cur.fetchall():
            f = formater_effet_objet(e)
            if f["texte"] is not None:
                effets_par_objet.setdefault(e["objet_id"], []).append(f)
    conn.close()

    objets_resultat = []
    for r in rows:
        d = dict(r)
        d["effects"] = effets_par_objet.get(r["id"], [])
        d["legendaire"] = bool(d["legendaire"])
        d["panoplie"] = d.pop("panoplie_id") is not None
        objets_resultat.append(d)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "objets": objets_resultat,
    }

@app.get("/objets/filtres")
def filtres_objets(categorie: str = "equipement"):
    super_types = CATEGORIES_OBJETS.get(categorie, CATEGORIES_OBJETS["equipement"])
    placeholders = ",".join("?" for _ in super_types)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT DISTINCT type_nom FROM objets
        WHERE super_type_nom IN ({placeholders}) AND type_nom IS NOT NULL AND type_nom != ''
        ORDER BY type_nom
    """, super_types)
    types = [r[0] for r in cur.fetchall()]

    cur.execute(f"""
        SELECT COUNT(*) FROM objets
        WHERE super_type_nom IN ({placeholders}) AND (type_nom IS NULL OR type_nom = '')
    """, super_types)
    sans_type = cur.fetchone()[0] > 0

    cur.execute(f"""
        SELECT COUNT(*) FROM objets
        WHERE super_type_nom IN ({placeholders}) AND (niveau IS NULL OR niveau = 0)
    """, super_types)
    sans_niveau = cur.fetchone()[0] > 0

    # Bornes reelles du curseur de niveau (pas de valeur en dur type 200 :
    # Dofus 3.0 a des objets au-dela selon les extensions live).
    cur.execute(f"""
        SELECT MIN(niveau), MAX(niveau) FROM objets
        WHERE super_type_nom IN ({placeholders}) AND niveau IS NOT NULL AND niveau > 0
    """, super_types)
    niveau_min_dispo, niveau_max_dispo = cur.fetchone()

    conn.close()
    return {
        "types": types, "sans_type": sans_type, "sans_niveau": sans_niveau,
        "niveau_min": niveau_min_dispo or 1, "niveau_max": niveau_max_dispo or 200,
        "effets": list(EFFETS_RECHERCHABLES.keys()) if categorie == "equipement" else [],
    }

@app.get("/objets/{objet_id}")
def detail_objet(objet_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM objets WHERE id = ?", (objet_id,))
    objet = cur.fetchone()
    if not objet:
        conn.close()
        return {"erreur": "Objet introuvable"}

    cur.execute("SELECT * FROM objets_effets WHERE objet_id = ?", (objet_id,))
    effets_bruts = cur.fetchall()

    # Sort accorde par l'objet (effect_id 1175, chantier #8ter) : sorti a part
    # de la liste generique "effects" pour avoir sa propre section dediee
    # (sinon le nom du sort apparaitrait deux fois).
    effets_sort_accorde = [e for e in effets_bruts if e["effect_id"] == 1175]
    effets_bruts = [e for e in effets_bruts if e["effect_id"] != 1175]

    sort_accorde = None
    if effets_sort_accorde:
        e = effets_sort_accorde[0]
        spell_id = e["dice_num"]
        grade = e["dice_side"] or 1
        detail = SORTS_OBJETS_DATA.get(f"{spell_id}_{grade}")
        if detail:
            sort_accorde = {
                "nom": detail["nom"],
                "description": detail["description"],
                "effects": [
                    f for eff in detail["effects"]
                    if effet_visible(eff) and (f := formater_effet(eff))["texte"] is not None
                ],
            }

    cur.execute("""
        SELECT r.ingredient_id, r.quantite, r.job_id, o.nom AS ingredient_nom, o.img AS ingredient_img,
               o.niveau AS ingredient_niveau, o.type_nom AS ingredient_type_nom
        FROM recettes r
        LEFT JOIN objets o ON o.id = r.ingredient_id
        WHERE r.objet_id = ?
    """, (objet_id,))
    ingredients = cur.fetchall()

    # Obtention : monstres qui droppent cet objet (table drops, sourcee
    # Dofensive, liee par NOM — meme mecanisme deja utilise par la fiche
    # donjon pour son propre tableau de butins). Egalement calcule pour
    # chaque ingredient de la recette, pour le tooltip "source" au survol.
    def sources_drop(nom_objet):
        cur.execute("""
            SELECT m.id AS monstre_id, m.nom AS monstre_nom, m.image_url AS monstre_img, d.pourcentage
            FROM drops d JOIN monstres m ON m.id = d.monstre_id
            WHERE d.nom = ?
            ORDER BY d.pourcentage DESC
        """, (nom_objet,))
        return [dict(r) for r in cur.fetchall()]

    obtention = sources_drop(objet["nom"])
    sources_ingredients = {i["ingredient_nom"]: sources_drop(i["ingredient_nom"]) for i in ingredients if i["ingredient_nom"]}

    panoplie = None
    if objet["panoplie_id"] is not None:
        cur.execute("SELECT * FROM panoplies WHERE id = ?", (objet["panoplie_id"],))
        p = cur.fetchone()
        if p:
            cur.execute("SELECT id, nom FROM objets WHERE panoplie_id = ?", (objet["panoplie_id"],))
            membres = cur.fetchall()
            cur.execute("SELECT * FROM panoplies_effets WHERE panoplie_id = ? ORDER BY palier", (objet["panoplie_id"],))
            effets_paliers_bruts = cur.fetchall()
            paliers = {}
            for e in effets_paliers_bruts:
                f = formater_effet_objet(e)
                if f["texte"] is not None:
                    paliers.setdefault(e["palier"], []).append(f)
            panoplie = {
                "id": p["id"],
                "nom": p["nom"],
                "niveau": p["niveau"],
                "membres": [dict(m) for m in membres],
                "effets_par_palier": paliers,
            }

    cur.execute("""
        SELECT d.id, d.nom, dor.quantite
        FROM donjons_objets_requis dor
        JOIN donjons d ON d.id = dor.donjon_id
        WHERE dor.objet_id = ?
        ORDER BY d.nom
    """, (objet_id,))
    donjons_requis = cur.fetchall()

    conn.close()

    # Fil d'Ariane : categorie humaine deduite de super_type_nom, reutilise
    # CATEGORIES_OBJETS (meme mapping que les listes /equipements et /ressources)
    # plutot qu'une nouvelle table de correspondance. Libelles explicites
    # (pas de pluriel calcule) pour eviter toute grammaire fragile.
    LIBELLES_CATEGORIES = {"equipement": "Équipements", "ressource": "Ressources"}
    categorie_nom = next(
        (LIBELLES_CATEGORIES[cle] for cle, super_types in CATEGORIES_OBJETS.items() if objet["super_type_nom"] in super_types),
        None
    )

    return {
        **dict(objet),
        "legendaire": bool(objet["legendaire"]),
        # SQLite stocke les booleens en INTEGER (0/1) — sans ce cast, un objet
        # sans recette renvoie has_recipe:0 et la condition JSX
        # "data.obtention?.length > 0 || data.has_recipe" evalue a 0 (pas
        # false), que React affiche litteralement comme texte "0" sur la
        # fiche (trouve en testant les items de songe, 2 août 2026 — les
        # legendes/legendes animales sont des ressources sans recette,
        # exactement le cas qui declenche le bug).
        "has_recipe": bool(objet["has_recipe"]),
        "categorie_nom": categorie_nom,
        "effects": [f for e in effets_bruts if (f := formater_effet_objet(e))["texte"] is not None],
        "recette": [
            {
                "ingredient_id": i["ingredient_id"], "quantite": i["quantite"],
                "nom": i["ingredient_nom"], "img": i["ingredient_img"],
                "niveau": i["ingredient_niveau"], "type_nom": i["ingredient_type_nom"],
                "sources": sources_ingredients.get(i["ingredient_nom"], []),
            }
            for i in ingredients
        ],
        "obtention": obtention,
        "panoplie": panoplie,
        "sort_accorde": sort_accorde,
        "donjons_requis": [{"id": d["id"], "nom": d["nom"], "quantite": d["quantite"]} for d in donjons_requis],
    }

@app.get("/panoplies")
def liste_panoplies(search: str = "", type: str = "", tranche_niveau: str = "",
                     page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conditions = ["p.nom LIKE ?"]
    params = [f"%{search}%"]

    if type == "cosmetique":
        conditions.append("p.cosmetique = 1")
    elif type == "bonus":
        conditions.append("p.cosmetique = 0")

    if tranche_niveau == SANS_VALEUR:
        conditions.append("(p.niveau IS NULL OR p.niveau = 0)")
    elif tranche_niveau in TRANCHES_NIVEAU:
        borne_min, borne_max = TRANCHES_NIVEAU[tranche_niveau]
        conditions.append("p.niveau BETWEEN ? AND ?")
        params.extend([borne_min, borne_max])

    where_clause = " AND ".join(conditions)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM panoplies p WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT p.id, p.nom, p.niveau, p.cosmetique, o.img,
               (SELECT COUNT(*) FROM objets o2 WHERE o2.panoplie_id = p.id) AS nb_objets
        FROM panoplies p
        LEFT JOIN objets o ON o.id = p.image_objet_id
        WHERE {where_clause}
        ORDER BY p.nom
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()
    conn.close()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "panoplies": [dict(r) for r in rows],
    }

@app.get("/panoplies/filtres")
def filtres_panoplies():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM panoplies WHERE niveau IS NULL OR niveau = 0")
    sans_niveau = cur.fetchone()[0] > 0
    conn.close()
    return {"sans_niveau": sans_niveau}

@app.get("/panoplies/{panoplie_id}")
def detail_panoplie(panoplie_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.*, o.img
        FROM panoplies p
        LEFT JOIN objets o ON o.id = p.image_objet_id
        WHERE p.id = ?
    """, (panoplie_id,))
    panoplie = cur.fetchone()
    if not panoplie:
        conn.close()
        return {"erreur": "Panoplie introuvable"}

    cur.execute("SELECT id, nom, img, niveau, type_nom FROM objets WHERE panoplie_id = ? ORDER BY nom", (panoplie_id,))
    membres = cur.fetchall()

    cur.execute("SELECT * FROM panoplies_effets WHERE panoplie_id = ? ORDER BY palier", (panoplie_id,))
    effets_paliers_bruts = cur.fetchall()
    paliers = {}
    for e in effets_paliers_bruts:
        f = formater_effet_objet(e)
        if f["texte"] is not None:
            paliers.setdefault(e["palier"], []).append(f)

    conn.close()
    return {
        "id": panoplie["id"],
        "nom": panoplie["nom"],
        "niveau": panoplie["niveau"],
        "cosmetique": bool(panoplie["cosmetique"]),
        "img": panoplie["img"],
        "membres": [dict(m) for m in membres],
        "effets_par_palier": paliers,
    }

@app.get("/donjons")
def liste_donjons(search: str = "", zone: str = "", page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conditions = ["d.nom LIKE ?"]
    params = [f"%{search}%"]

    if zone == SANS_VALEUR:
        conditions.append("(d.zone IS NULL OR d.zone = '')")
    elif zone:
        conditions.append("d.zone = ?")
        params.append(zone)

    where_clause = " AND ".join(conditions)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM donjons d WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT d.id, d.nom, d.niveau_min, d.niveau_optimal, d.difficulte, d.zone,
               m.nom AS boss_nom, m.image_url AS boss_img
        FROM donjons d
        LEFT JOIN monstres m ON m.id = d.boss_principal_id
        WHERE {where_clause}
        ORDER BY d.nom
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()
    conn.close()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "donjons": [dict(r) for r in rows],
    }

@app.get("/donjons/filtres")
def filtres_donjons():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT zone FROM donjons WHERE zone IS NOT NULL AND zone != '' ORDER BY zone")
    zones = [r[0] for r in cur.fetchall()]
    cur.execute("SELECT COUNT(*) FROM donjons WHERE zone IS NULL OR zone = ''")
    sans_zone = cur.fetchone()[0] > 0
    conn.close()
    return {"zones": zones, "sans_zone": sans_zone}

@app.get("/donjons/{donjon_id}")
def detail_donjon(donjon_id: int, user: dict = Depends(utilisateur_optionnel)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM donjons WHERE id = ?", (donjon_id,))
    donjon = cur.fetchone()
    if not donjon:
        conn.close()
        return {"erreur": "Donjon introuvable"}

    favori = False
    if user:
        cur.execute("SELECT 1 FROM favoris WHERE user_id = ? AND element_type = 'donjon' AND element_id = ?",
                    (user["id"], str(donjon_id)))
        favori = cur.fetchone() is not None

    cur.execute("""
        SELECT dm.monstre_id, dm.est_boss, m.nom, m.image_url
        FROM donjons_monstres dm
        JOIN monstres m ON m.id = dm.monstre_id
        WHERE dm.donjon_id = ?
        ORDER BY dm.est_boss DESC, m.nom
    """, (donjon_id,))
    monstres_rows = cur.fetchall()

    boss_principal = None
    if donjon["boss_principal_id"] is not None:
        cur.execute("SELECT id, nom, image_url FROM monstres WHERE id = ?", (donjon["boss_principal_id"],))
        bp = cur.fetchone()
        if bp:
            boss_principal = {"id": bp["id"], "nom": bp["nom"], "img": bp["image_url"]}

    cur.execute("""
        SELECT dor.objet_id, dor.quantite, o.nom, o.img
        FROM donjons_objets_requis dor
        LEFT JOIN objets o ON o.id = dor.objet_id
        WHERE dor.donjon_id = ?
    """, (donjon_id,))
    objets_requis_rows = cur.fetchall()

    # Table de drops du donjon : agrege les drops (table existante, sourcee
    # Dofensive, liee par NOM et non par ID) de tous les monstres du donjon.
    # Jointure sur le nom vers objets pour l'image/le lien — pas garantie a
    # 100% (pas de cle commune), repli propre (objet_id/img a None) sinon.
    monstre_ids = [r["monstre_id"] for r in monstres_rows]
    drops = []
    if monstre_ids:
        placeholders = ",".join("?" for _ in monstre_ids)
        cur.execute(f"""
            SELECT d.nom, MAX(d.pourcentage) AS pourcentage, o.id AS objet_id, o.img
            FROM drops d
            LEFT JOIN objets o ON o.nom = d.nom
            WHERE d.monstre_id IN ({placeholders})
            GROUP BY d.nom
            ORDER BY pourcentage DESC
        """, monstre_ids)
        drops = [dict(r) for r in cur.fetchall()]

    # Quetes associees (lien croisé chantier Quetes, cout marginal quasi nul
    # grace a la table de jonction quetes_donjons deja construite au scraping).
    cur.execute("""
        SELECT q.id, q.nom, q.niveau_min
        FROM quetes_donjons qd
        JOIN quetes q ON q.id = qd.quete_id
        WHERE qd.donjon_id = ?
        ORDER BY q.nom
    """, (donjon_id,))
    quetes_associees = [dict(r) for r in cur.fetchall()]

    # Succes du donjon (reciproque du lien croisé du chantier Succes, meme
    # table de jonction succes_donjons — cout marginal quasi nul).
    cur.execute("""
        SELECT s.id, s.nom, s.points
        FROM succes_donjons sd
        JOIN succes s ON s.id = sd.succes_id
        WHERE sd.donjon_id = ?
        ORDER BY s.nom
    """, (donjon_id,))
    succes_du_donjon = [dict(r) for r in cur.fetchall()]

    conn.close()

    # Guide de boss (mecaniques/salles/composition) : contenu 100% editorial,
    # jamais scrape. Absent tant que Popo/Krag ne l'a pas rempli -> section
    # masquee cote frontend (pas de "a completer" qui ferait croire a du contenu).
    guide_brut = DONJONS_GUIDES_DATA.get(str(donjon_id), {})
    mecaniques = guide_brut.get("mecaniques", [])
    salles = guide_brut.get("salles", [])
    compo_conseillee = guide_brut.get("compo_conseillee", "")
    guide = None
    if mecaniques or salles or compo_conseillee:
        guide = {"mecaniques": mecaniques, "salles": salles, "compo_conseillee": compo_conseillee}

    return {
        **dict(donjon),
        "favori": favori,
        "boss_principal": boss_principal,
        "monstres": [
            {"id": r["monstre_id"], "nom": r["nom"], "img": r["image_url"], "est_boss": bool(r["est_boss"])}
            for r in monstres_rows
        ],
        "objets_requis": [
            {"id": r["objet_id"], "nom": r["nom"], "img": r["img"], "quantite": r["quantite"]}
            for r in objets_requis_rows
        ],
        "drops": drops,
        "quetes_associees": quetes_associees,
        "succes_du_donjon": succes_du_donjon,
        "guide": guide,
    }

@app.get("/zones")
def liste_regions(search: str = "", page: int = 1, page_size: int = 48):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(DISTINCT area) FROM zones_areas
        WHERE area IS NOT NULL AND area LIKE ?
    """, (f"%{search}%",))
    total = cur.fetchone()[0]

    cur.execute("""
        SELECT za.area AS nom,
               COUNT(DISTINCT za.nom) AS nb_sous_zones,
               (SELECT COUNT(*) FROM donjons d WHERE d.zone = za.area) AS nb_donjons,
               (SELECT m.image_url FROM monstres m
                JOIN zones z2 ON z2.monstre_id = m.id
                JOIN zones_areas za2 ON za2.nom = z2.nom
                WHERE za2.area = za.area
                ORDER BY m.nom LIMIT 1) AS img
        FROM zones_areas za
        WHERE za.area IS NOT NULL AND za.area LIKE ?
        GROUP BY za.area
        ORDER BY za.area
        LIMIT ? OFFSET ?
    """, (f"%{search}%", page_size, (page - 1) * page_size))
    rows = cur.fetchall()
    conn.close()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "regions": [dict(r) for r in rows],
    }

@app.get("/sous-zones")
def recherche_sous_zones(search: str = "", limite: int = 20):
    limite = min(max(limite, 1), 50)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT za.nom, za.area,
               (SELECT m.image_url FROM monstres m
                JOIN zones z2 ON z2.monstre_id = m.id
                WHERE z2.nom = za.nom
                ORDER BY m.nom LIMIT 1) AS img
        FROM zones_areas za
        WHERE za.nom LIKE ?
        ORDER BY za.nom
        LIMIT ?
    """, (f"%{search}%", limite))
    rows = cur.fetchall()
    conn.close()
    return {"sous_zones": [dict(r) for r in rows]}

@app.get("/zones/{region}")
def detail_region(region: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM zones_areas WHERE area = ?", (region,))
    if cur.fetchone()[0] == 0:
        conn.close()
        return {"erreur": "Région introuvable"}

    cur.execute("""
        SELECT id, nom, niveau_min, niveau_optimal, difficulte
        FROM donjons WHERE zone = ? ORDER BY nom
    """, (region,))
    donjons_rows = cur.fetchall()

    cur.execute("""
        SELECT m.image_url FROM monstres m
        JOIN zones z ON z.monstre_id = m.id
        JOIN zones_areas za ON za.nom = z.nom
        WHERE za.area = ?
        ORDER BY m.nom LIMIT 1
    """, (region,))
    img_row = cur.fetchone()
    img = img_row["image_url"] if img_row else None

    cur.execute("""
        SELECT za.nom,
               COUNT(DISTINCT z.monstre_id) AS nb_monstres,
               MIN(base.niveau_base) AS niveau_min,
               MAX(base.niveau_base) AS niveau_max,
               (SELECT m.image_url FROM monstres m
                JOIN zones z2 ON z2.monstre_id = m.id
                WHERE z2.nom = za.nom
                ORDER BY m.nom LIMIT 1) AS img
        FROM zones_areas za
        JOIN zones z ON z.nom = za.nom
        JOIN (SELECT monstre_id, MIN(niveau) AS niveau_base FROM grades GROUP BY monstre_id) base
             ON base.monstre_id = z.monstre_id
        WHERE za.area = ?
        GROUP BY za.nom
        ORDER BY za.nom
    """, (region,))
    sous_zones_rows = cur.fetchall()
    conn.close()

    return {
        "nom": region,
        "img": img,
        "donjons": [dict(r) for r in donjons_rows],
        "sous_zones": [dict(r) for r in sous_zones_rows],
    }

@app.get("/sous-zones/{nom}")
def detail_sous_zone(nom: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT nom, area FROM zones_areas WHERE nom = ?", (nom,))
    zone = cur.fetchone()
    if not zone:
        conn.close()
        return {"erreur": "Zone introuvable"}

    cur.execute("""
        SELECT m.id, m.nom, m.image_url, base.niveau_base
        FROM zones z
        JOIN monstres m ON m.id = z.monstre_id
        JOIN (SELECT monstre_id, MIN(niveau) AS niveau_base FROM grades GROUP BY monstre_id) base
             ON base.monstre_id = m.id
        WHERE z.nom = ?
        ORDER BY m.nom
    """, (nom,))
    monstres_rows = cur.fetchall()
    conn.close()

    niveaux = [r["niveau_base"] for r in monstres_rows]

    return {
        "nom": zone["nom"],
        "area": zone["area"],
        "niveau_min": min(niveaux) if niveaux else None,
        "niveau_max": max(niveaux) if niveaux else None,
        "monstres": [
            {"id": r["id"], "nom": r["nom"], "img": r["image_url"], "niveau_base": r["niveau_base"]}
            for r in monstres_rows
        ],
    }

# ============================================================
# Quetes (chantier Quetes, encyclopedie)
# Categorie a seulement 2 valeurs reelles ("repetable"/"autre") : la
# categorie "quete de dofus" imaginee au depart a ete abandonnee (verifie
# que seuls 3 Dofus reels sur 34 sont donnes directement par une quete —
# les autres passent par un SUCCES, relève du futur chantier Succes/Chasse
# aux Dofus, pas de celui-ci).
# XP/Kamas ne sont que des booleens (a_xp/a_kamas) : DofusDB ne stocke que
# des ratios, jamais de montant absolu — afficher un chiffre serait invente.
# ============================================================

CATEGORIE_QUETE_LABELS = {"repetable": "Répétable", "autre": "Quête"}

@app.get("/quetes")
def liste_quetes(search: str = "", categorie: str = "", zone: str = "",
                  tri: str = "zone", page: int = 1, page_size: int = 48,
                  user: dict = Depends(utilisateur_optionnel)):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conditions = ["q.nom LIKE ?"]
    params = [f"%{search}%"]

    categories_choisies = [c for c in categorie.split(",") if c in CATEGORIE_QUETE_LABELS]
    if categories_choisies:
        conditions.append(f"q.categorie IN ({','.join('?' for _ in categories_choisies)})")
        params.extend(categories_choisies)

    zones_choisies = [z for z in zone.split(",") if z]
    if SANS_VALEUR in zones_choisies:
        autres_zones = [z for z in zones_choisies if z != SANS_VALEUR]
        clause = "(q.zone IS NULL OR q.zone = '')"
        if autres_zones:
            clause += f" OR q.zone IN ({','.join('?' for _ in autres_zones)})"
        conditions.append(f"({clause})")
        params.extend(autres_zones)
    elif zones_choisies:
        conditions.append(f"q.zone IN ({','.join('?' for _ in zones_choisies)})")
        params.extend(zones_choisies)

    where_clause = " AND ".join(conditions)
    ordre_sql = {
        "niveau": "q.niveau_min, q.nom",
        "az": "q.nom",
    }.get(tri, "q.zone, q.niveau_min, q.nom")  # "zone" = defaut, voir §5 specs

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM quetes q WHERE {where_clause}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT q.id, q.nom, q.niveau_min, q.categorie, q.zone,
               (SELECT COUNT(*) FROM quetes_etapes qe WHERE qe.quete_id = q.id) AS nb_etapes
        FROM quetes q
        WHERE {where_clause}
        ORDER BY {ordre_sql}
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()

    favoris_ids = set()
    if user and rows:
        ids = [str(r["id"]) for r in rows]
        placeholders = ",".join("?" for _ in ids)
        cur.execute(f"""
            SELECT element_id FROM favoris
            WHERE user_id = ? AND element_type = 'quete' AND element_id IN ({placeholders})
        """, [user["id"]] + ids)
        favoris_ids = {r["element_id"] for r in cur.fetchall()}
    conn.close()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "quetes": [
            {**dict(r), "favori": str(r["id"]) in favoris_ids}
            for r in rows
        ],
    }

@app.get("/quetes/filtres")
def filtres_quetes():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT zone FROM quetes WHERE zone IS NOT NULL AND zone != '' ORDER BY zone")
    zones = [r[0] for r in cur.fetchall()]
    cur.execute("SELECT COUNT(*) FROM quetes WHERE zone IS NULL OR zone = ''")
    sans_zone = cur.fetchone()[0] > 0
    conn.close()
    return {
        "categories": [{"valeur": k, "label": v} for k, v in CATEGORIE_QUETE_LABELS.items()],
        "zones": zones,
        "sans_zone": sans_zone,
    }

@app.get("/quetes/{quete_id}")
def detail_quete(quete_id: int, user: dict = Depends(utilisateur_optionnel)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM quetes WHERE id = ?", (quete_id,))
    quete = cur.fetchone()
    if not quete:
        conn.close()
        return {"erreur": "Quête introuvable"}

    favori = False
    progression_utilisateur = {}
    if user:
        cur.execute("SELECT 1 FROM favoris WHERE user_id = ? AND element_type = 'quete' AND element_id = ?",
                    (user["id"], str(quete_id)))
        favori = cur.fetchone() is not None
        cur.execute("SELECT element_id, fait FROM progression_joueur WHERE user_id = ? AND element_type = 'quete_etape'",
                    (user["id"],))
        progression_utilisateur = {r["element_id"]: bool(r["fait"]) for r in cur.fetchall()}

    cur.execute("SELECT id, nom, description, a_xp, a_kamas FROM quetes_etapes WHERE quete_id = ? ORDER BY ordre",
                (quete_id,))
    etapes_rows = cur.fetchall()
    etape_ids = [r["id"] for r in etapes_rows]
    items_par_etape = {}
    actions_par_etape = {}
    if etape_ids:
        placeholders = ",".join("?" for _ in etape_ids)
        cur.execute(f"""
            SELECT qei.etape_id, qei.objet_id, qei.quantite, o.nom, o.img
            FROM quetes_etapes_items qei
            LEFT JOIN objets o ON o.id = qei.objet_id
            WHERE qei.etape_id IN ({placeholders})
        """, etape_ids)
        for r in cur.fetchall():
            items_par_etape.setdefault(r["etape_id"], []).append(
                {"id": r["objet_id"], "nom": r["nom"], "img": r["img"], "quantite": r["quantite"]})

        cur.execute(f"""
            SELECT etape_id, icone, verbe, cible, cible_secondaire, lieu, coord_x, coord_y, carte_img
            FROM quetes_etapes_actions
            WHERE etape_id IN ({placeholders})
            ORDER BY etape_id, ordre
        """, etape_ids)
        for r in cur.fetchall():
            actions_par_etape.setdefault(r["etape_id"], []).append({
                "icone": r["icone"], "verbe": r["verbe"], "cible": r["cible"],
                "cible_secondaire": r["cible_secondaire"], "lieu": r["lieu"],
                "coord_x": r["coord_x"], "coord_y": r["coord_y"], "carte_img": r["carte_img"],
            })

    etapes = [{
        "id": r["id"],
        "nom": r["nom"],
        "description": r["description"],
        "actions": actions_par_etape.get(r["id"], []),
        "a_xp": bool(r["a_xp"]),
        "a_kamas": bool(r["a_kamas"]),
        "items": items_par_etape.get(r["id"], []),
        "fait": progression_utilisateur.get(str(r["id"]), False),
    } for r in etapes_rows]

    cur.execute("""
        SELECT ppq.quete_requise_id, q.nom, q.niveau_min,
               (SELECT COUNT(*) FROM quetes_etapes WHERE quete_id = q.id) AS nb_etapes_total
        FROM quetes_prerequis_quetes ppq
        JOIN quetes q ON q.id = ppq.quete_requise_id
        WHERE ppq.quete_id = ?
    """, (quete_id,))
    prerequis_quetes = []
    for r in cur.fetchall():
        nb_fait = 0
        if user:
            cur.execute("""
                SELECT COUNT(*) FROM quetes_etapes qe
                JOIN progression_joueur pj ON pj.element_type = 'quete_etape' AND pj.element_id = CAST(qe.id AS TEXT)
                WHERE qe.quete_id = ? AND pj.user_id = ? AND pj.fait = 1
            """, (r["quete_requise_id"], user["id"]))
            nb_fait = cur.fetchone()[0]
        prerequis_quetes.append({
            "id": r["quete_requise_id"],
            "nom": r["nom"],
            "niveau_min": r["niveau_min"],
            "ok": r["nb_etapes_total"] > 0 and nb_fait >= r["nb_etapes_total"],
        })

    cur.execute("""
        SELECT ppo.objet_id, ppo.quantite, o.nom, o.img
        FROM quetes_prerequis_objets ppo
        LEFT JOIN objets o ON o.id = ppo.objet_id
        WHERE ppo.quete_id = ?
    """, (quete_id,))
    prerequis_objets = [dict(r) for r in cur.fetchall()]

    cur.execute("""
        SELECT d.id, d.nom, d.niveau_optimal
        FROM quetes_donjons qd
        JOIN donjons d ON d.id = qd.donjon_id
        WHERE qd.quete_id = ?
        LIMIT 1
    """, (quete_id,))
    donjon_row = cur.fetchone()
    donjon_lie = dict(donjon_row) if donjon_row else None

    # Ressources a prevoir : liste de courses agregee sur toute la quete
    # (pas seulement le prerequis de depart), calculee au scraping depuis
    # tous les objectifs "ramener un objet" (scraper_quetes.py).
    cur.execute("""
        SELECT qr.objet_id, qr.quantite, o.nom, o.img
        FROM quetes_ressources qr
        LEFT JOIN objets o ON o.id = qr.objet_id
        WHERE qr.quete_id = ?
    """, (quete_id,))
    ressources = [dict(r) for r in cur.fetchall()]

    conn.close()

    # Guide editorial (resume + points cles + astuce dialogue optionnelle) :
    # contenu redige par Lorn/Popo, absent tant qu'une zone/quete n'a pas ete
    # traitee -> section masquee cote frontend (meme logique que le guide de
    # boss des donjons). L'astuce dialogue est au compte-goutte, quete par
    # quete, jamais generee automatiquement (aucune donnee de dialogue
    # disponible publiquement — voir CLAUDE.md).
    guide_brut = QUETES_GUIDES_DATA.get(str(quete_id), {})
    resume = guide_brut.get("resume", "")
    points_cles = guide_brut.get("points_cles", [])
    astuce_dialogue = guide_brut.get("astuce_dialogue", "")
    guide = {"resume": resume, "points_cles": points_cles, "astuce_dialogue": astuce_dialogue} \
        if (resume or points_cles or astuce_dialogue) else None

    return {
        **dict(quete),
        "favori": favori,
        "etapes": etapes,
        "prerequis_quetes": prerequis_quetes,
        "prerequis_objets": prerequis_objets,
        "ressources": ressources,
        "donjon_lie": donjon_lie,
        "guide": guide,
    }

# ============================================================
# Succes (chantier Succes, encyclopedie)
# Scope volontairement restreint aux 6 categories qui correspondent a la
# maquette (Donjons/Quetes/Exploration/Bestiaire/Elevage/Metiers, 1572/2774
# succes reels — decision Popo, voir scraper_succes.py). Un objectif est de
# type "quete" (auto-coche des que la quete liee est entierement validee,
# meme calcul que les prerequis de la fiche quete) ou "manuel" (coche a la
# main, stocke dans progression_joueur comme un element_type distinct
# 'succes_objectif', element_id = id de la ligne succes_objectifs).
# ============================================================

CATEGORIES_SUCCES_ORDRE = ["Quêtes", "Donjons", "Bestiaire", "Métiers", "Exploration", "Élevage"]


def _etat_objectifs_succes(cur, user_id, succes_ids):
    """{succes_id: {'fait': int, 'total': int}} pour l'utilisateur donne
    (tout a 0 si non connecte). Reutilise pour la liste (barres de
    progression) et pour le compteur global de points."""
    if not succes_ids:
        return {}
    placeholders = ",".join("?" for _ in succes_ids)
    cur.execute(f"SELECT id, succes_id, type, quete_id FROM succes_objectifs WHERE succes_id IN ({placeholders})",
                succes_ids)
    objectifs = cur.fetchall()

    total = {}
    fait = {}
    for o in objectifs:
        total[o["succes_id"]] = total.get(o["succes_id"], 0) + 1

    if not user_id:
        return {sid: {"fait": 0, "total": t} for sid, t in total.items()}

    manuel_ids = [str(o["id"]) for o in objectifs if o["type"] == "manuel"]
    manuel_faits = set()
    if manuel_ids:
        ph = ",".join("?" for _ in manuel_ids)
        cur.execute(f"""
            SELECT element_id FROM progression_joueur
            WHERE user_id = ? AND element_type = 'succes_objectif' AND element_id IN ({ph}) AND fait = 1
        """, [user_id] + manuel_ids)
        manuel_faits = {r["element_id"] for r in cur.fetchall()}

    quete_ids = sorted({o["quete_id"] for o in objectifs if o["type"] == "quete" and o["quete_id"]})
    quetes_completes = set()
    if quete_ids:
        ph = ",".join("?" for _ in quete_ids)
        cur.execute(f"""
            SELECT qe.quete_id, COUNT(*) AS total_etapes,
                   SUM(CASE WHEN pj.fait = 1 THEN 1 ELSE 0 END) AS etapes_faites
            FROM quetes_etapes qe
            LEFT JOIN progression_joueur pj
                ON pj.element_type = 'quete_etape' AND pj.element_id = CAST(qe.id AS TEXT) AND pj.user_id = ?
            WHERE qe.quete_id IN ({ph})
            GROUP BY qe.quete_id
        """, [user_id] + quete_ids)
        for r in cur.fetchall():
            if r["total_etapes"] > 0 and r["etapes_faites"] >= r["total_etapes"]:
                quetes_completes.add(r["quete_id"])

    for o in objectifs:
        done = (str(o["id"]) in manuel_faits) if o["type"] == "manuel" else (o["quete_id"] in quetes_completes)
        if done:
            fait[o["succes_id"]] = fait.get(o["succes_id"], 0) + 1

    return {sid: {"fait": fait.get(sid, 0), "total": t} for sid, t in total.items()}


@app.get("/succes")
def liste_succes(search: str = "", categorie: str = "", masquer_accomplis: bool = False,
                  page: int = 1, page_size: int = 48,
                  user: dict = Depends(utilisateur_optionnel)):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 400)
    conn = get_db()
    cur = conn.cursor()

    conditions = ["nom LIKE ?"]
    params = [f"%{search}%"]
    categories_choisies = [c for c in categorie.split(",") if c in CATEGORIES_SUCCES_ORDRE]
    if categories_choisies:
        conditions.append(f"categorie IN ({','.join('?' for _ in categories_choisies)})")
        params.extend(categories_choisies)
    where_clause = " AND ".join(conditions)

    ordre_categorie = "CASE categorie " + " ".join(
        f"WHEN ? THEN {i}" for i in range(len(CATEGORIES_SUCCES_ORDRE))) + " ELSE 99 END"
    cur.execute(f"""
        SELECT id, nom, categorie, points, niveau, img
        FROM succes
        WHERE {where_clause}
        ORDER BY {ordre_categorie}, nom
    """, params + CATEGORIES_SUCCES_ORDRE)
    rows = cur.fetchall()
    succes_ids = [r["id"] for r in rows]

    etats = _etat_objectifs_succes(cur, user["id"] if user else None, succes_ids)

    favoris_ids = set()
    if user and succes_ids:
        ph = ",".join("?" for _ in succes_ids)
        cur.execute(f"""
            SELECT element_id FROM favoris
            WHERE user_id = ? AND element_type = 'succes' AND element_id IN ({ph})
        """, [user["id"]] + [str(i) for i in succes_ids])
        favoris_ids = {r["element_id"] for r in cur.fetchall()}

    resultats = []
    for r in rows:
        etat = etats.get(r["id"], {"fait": 0, "total": 0})
        accompli = user is not None and etat["total"] > 0 and etat["fait"] >= etat["total"]
        if masquer_accomplis and user and accompli:
            continue
        resultats.append({
            **dict(r), "fait": etat["fait"], "total": etat["total"], "accompli": accompli,
            "favori": str(r["id"]) in favoris_ids,
        })

    points_gagnes = None
    points_total = None
    if user:
        # Compteur global : calcule sur TOUS les succes du perimetre (pas
        # seulement la recherche/filtre courant), voir §5 specs.
        cur.execute("SELECT id, points FROM succes")
        tous = cur.fetchall()
        etats_tous = _etat_objectifs_succes(cur, user["id"], [r["id"] for r in tous])
        points_total = sum(r["points"] for r in tous)
        points_gagnes = sum(
            r["points"] for r in tous
            if etats_tous.get(r["id"], {"fait": 0, "total": 0})["total"] > 0
            and etats_tous[r["id"]]["fait"] >= etats_tous[r["id"]]["total"]
        )

    conn.close()
    total = len(resultats)
    debut = (page - 1) * page_size
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "succes": resultats[debut:debut + page_size],
        "points_gagnes": points_gagnes,
        "points_total": points_total,
    }


@app.get("/succes/filtres")
def filtres_succes():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT categorie FROM succes")
    presentes = {r["categorie"] for r in cur.fetchall()}
    conn.close()
    return {"categories": [c for c in CATEGORIES_SUCCES_ORDRE if c in presentes]}


@app.get("/succes/{succes_id}")
def detail_succes(succes_id: int, user: dict = Depends(utilisateur_optionnel)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM succes WHERE id = ?", (succes_id,))
    succes = cur.fetchone()
    if not succes:
        conn.close()
        return {"erreur": "Succès introuvable"}

    favori = False
    if user:
        cur.execute("SELECT 1 FROM favoris WHERE user_id = ? AND element_type = 'succes' AND element_id = ?",
                    (user["id"], str(succes_id)))
        favori = cur.fetchone() is not None

    cur.execute("SELECT id, ordre, nom, type, quete_id FROM succes_objectifs WHERE succes_id = ? ORDER BY ordre",
                (succes_id,))
    objectifs_rows = cur.fetchall()
    objectif_ids = [r["id"] for r in objectifs_rows]

    etat_par_objectif = {}
    if user and objectif_ids:
        manuel_ids = [str(r["id"]) for r in objectifs_rows if r["type"] == "manuel"]
        if manuel_ids:
            ph = ",".join("?" for _ in manuel_ids)
            cur.execute(f"""
                SELECT element_id FROM progression_joueur
                WHERE user_id = ? AND element_type = 'succes_objectif' AND element_id IN ({ph}) AND fait = 1
            """, [user["id"]] + manuel_ids)
            faits = {r["element_id"] for r in cur.fetchall()}
            for r in objectifs_rows:
                if r["type"] == "manuel":
                    etat_par_objectif[r["id"]] = str(r["id"]) in faits

        quete_ids = sorted({r["quete_id"] for r in objectifs_rows if r["type"] == "quete" and r["quete_id"]})
        if quete_ids:
            ph = ",".join("?" for _ in quete_ids)
            cur.execute(f"""
                SELECT qe.quete_id, COUNT(*) AS total_etapes,
                       SUM(CASE WHEN pj.fait = 1 THEN 1 ELSE 0 END) AS etapes_faites
                FROM quetes_etapes qe
                LEFT JOIN progression_joueur pj
                    ON pj.element_type = 'quete_etape' AND pj.element_id = CAST(qe.id AS TEXT) AND pj.user_id = ?
                WHERE qe.quete_id IN ({ph})
                GROUP BY qe.quete_id
            """, [user["id"]] + quete_ids)
            quetes_completes = {r["quete_id"] for r in cur.fetchall()
                                 if r["total_etapes"] > 0 and r["etapes_faites"] >= r["total_etapes"]}
            for r in objectifs_rows:
                if r["type"] == "quete":
                    etat_par_objectif[r["id"]] = r["quete_id"] in quetes_completes

    objectifs = [{
        "id": r["id"], "nom": r["nom"], "type": r["type"], "quete_id": r["quete_id"],
        "fait": etat_par_objectif.get(r["id"], False),
    } for r in objectifs_rows]
    nb_faits = sum(1 for o in objectifs if o["fait"])

    cur.execute("""
        SELECT sri.objet_id, sri.quantite, o.nom, o.img
        FROM succes_recompenses_items sri
        LEFT JOIN objets o ON o.id = sri.objet_id
        WHERE sri.succes_id = ?
    """, (succes_id,))
    recompense_items = [dict(r) for r in cur.fetchall()]

    cur.execute("""
        SELECT d.id, d.nom, d.niveau_optimal
        FROM succes_donjons sd
        JOIN donjons d ON d.id = sd.donjon_id
        WHERE sd.succes_id = ?
        ORDER BY d.nom
    """, (succes_id,))
    donjons_lies = [dict(r) for r in cur.fetchall()]

    conn.close()
    return {
        **dict(succes),
        "favori": favori,
        "objectifs": objectifs,
        "objectifs_faits": nb_faits,
        "objectifs_total": len(objectifs),
        "recompense_items": recompense_items,
        "donjons_lies": donjons_lies,
    }

# ============================================================
# Chasse aux Dofus (home, §6 specs)
# Perimetre : objets.type_nom = 'Dofus' (34 objets), Kaliptus (id 8072)
# retire sur demande Popo (deja documente CLAUDE.md). 6 primordiaux
# identifies par ID (verifie sans ecart : Emeraude 737, Pourpre 694,
# Turquoise 739, Ocre 7754, Ebene 7114, Ivoire 7115), couleur reprise des
# tokens CSS deja definis (--df-dofus-*), pas de nouvelle couleur inventee.
# Relation Dofus<->quete/succes : PAS une nouvelle donnee scrapee, deduite
# des tables deja en base (quetes_etapes_items + succes_recompenses_items,
# liees par objet_id — memes tables que les recompenses de quete/succes
# deja affichees ailleurs). 9 Dofus sur 33 (hors Kaliptus) n'ont aucune
# source reconnue dans les donnees DofusDB (dont le Dofus Ocre, pourtant
# primordial — verifie : ni questsThatReward, ni achievementsThatReward,
# ni recette, ni drop sur cet item cote DofusDB) : gap reel, jamais
# invente, expose via "trackable": false plutot que de fausser un 0%
# permanent qui laisserait croire a un bug (decision Popo).
#
# Doublon "Dofus Sylvestre" signale par Popo (2 entrees au meme nom) :
# PAS un doublon de scraping (contrairement au precedent "Panoplie d'apparat
# de Stroud", chantier Panoplies) — verifie sur l'API DofusDB en direct.
# 3 objets distincts existent : 29134 "Dofus Sylvestre" et 29135 "Dofus
# Verdoyant" portent un champ `criterions` non vide (ex. "Qa=2488|Qa=2489")
# et ZERO recompense (ni quete, ni succes) -> ce sont des variantes
# d'AFFICHAGE conditionnelles (icone "verrouillee" selon la progression
# d'une quete), jamais elles-memes obtenues. 29136 "Dofus Sylvestre" n'a
# aucun `criterions` et EST recompense par le succes 7761 -> c'est le seul
# vrai Dofus obtenable de cette chaine. Motif verifie generalisable : sur
# les 34 Dofus, CES DEUX-LA sont les seuls avec un `criterions` non vide
# (champ absent de dofura_items.json/objets, verifie directement sur
# l'API brute) -> exclusion ciblee, pas un hasard.
# ============================================================

DOFUS_IDS_EXCLUS = {
    8072,   # Kaliptus, retire sur demande Popo (voir CLAUDE.md)
    29134,  # "Dofus Sylvestre" verrouille (criterions non vide, 0 recompense) — voir 29136
    29135,  # "Dofus Verdoyant" verrouille (criterions non vide, 0 recompense) — variante de la meme chaine
    30356,  # "Jyfus" — Dofus anniversaire offert par les gardiens Ankama (texte de l'objet),
            # jamais obtenable par le jeu normal, meme nature que Kaliptus — retire sur demande Popo.
    20987,  # "Dofus Cacao" en double (chantier style global) : 20833 et 20987 partagent nom/niveau/
            # image identiques, seule la description differe legerement — aucun champ distinctif
            # trouve (ni criterions, ni recompense de quete/succes des deux cotes), doublon de
            # donnees assume comme tel. 20833 garde comme entree canonique (plus petit ID).
}
DOFUS_PRIMORDIAUX_COULEURS = {
    737: "var(--df-dofus-emeraude)",
    694: "var(--df-dofus-pourpre)",
    739: "var(--df-dofus-turquoise)",
    7754: "var(--df-dofus-ocre)",
    7114: "var(--df-dofus-ebene)",
    7115: "var(--df-dofus-ivoire)",
}

# Positionnement manuel demande par Popo (chantier style global, 29 juillet 2026) :
# le Dofus Sylvestre (29136) doit apparaitre en toute derniere position de la liste,
# juste a cote du Dom de Pin (27803) — ORDER BY niveau, nom seul ne le permet pas
# (les deux sont niveau 180, mais "Dofus Sylvestre" < "Dom de Pin" alphabetiquement,
# donc pas adjacents). Le troisieme critere de tri pousse specifiquement cet ID
# apres tous les autres de son palier de niveau, sans toucher au tri des 30 autres.
DOFUS_ID_TRI_DERNIER = 29136


def _etat_etapes_quetes(cur, user_id, quete_ids):
    """{quete_id: {'fait': int, 'total': int}} — meme calcul que la barre
    de progression de la fiche quete, reutilise ici pour les Dofus lies a
    une quete plutot qu'a un succes."""
    if not quete_ids:
        return {}
    ph = ",".join("?" for _ in quete_ids)
    cur.execute(f"""
        SELECT qe.quete_id, COUNT(*) AS total, SUM(CASE WHEN pj.fait = 1 THEN 1 ELSE 0 END) AS fait
        FROM quetes_etapes qe
        LEFT JOIN progression_joueur pj
            ON pj.element_type = 'quete_etape' AND pj.element_id = CAST(qe.id AS TEXT) AND pj.user_id = ?
        WHERE qe.quete_id IN ({ph})
        GROUP BY qe.quete_id
    """, [user_id] + quete_ids)
    return {r["quete_id"]: {"fait": r["fait"] or 0, "total": r["total"]} for r in cur.fetchall()}


@app.get("/dofus")
def liste_dofus(user: dict = Depends(utilisateur_optionnel)):
    conn = get_db()
    cur = conn.cursor()
    placeholders_exclus = ",".join("?" for _ in DOFUS_IDS_EXCLUS)
    cur.execute(f"""SELECT id, nom, niveau, img FROM objets
                    WHERE type_nom = 'Dofus' AND id NOT IN ({placeholders_exclus})
                    ORDER BY niveau, (id = ?), nom""",
                list(DOFUS_IDS_EXCLUS) + [DOFUS_ID_TRI_DERNIER])
    dofus_rows = cur.fetchall()
    dofus_ids = [r["id"] for r in dofus_rows]

    quete_par_dofus = {}
    succes_par_dofus = {}
    if dofus_ids:
        ph = ",".join("?" for _ in dofus_ids)
        cur.execute(f"""
            SELECT qei.objet_id, qe.quete_id
            FROM quetes_etapes_items qei
            JOIN quetes_etapes qe ON qe.id = qei.etape_id
            WHERE qei.objet_id IN ({ph})
        """, dofus_ids)
        for r in cur.fetchall():
            quete_par_dofus.setdefault(r["objet_id"], set()).add(r["quete_id"])

        cur.execute(f"SELECT objet_id, succes_id FROM succes_recompenses_items WHERE objet_id IN ({ph})",
                    dofus_ids)
        for r in cur.fetchall():
            succes_par_dofus.setdefault(r["objet_id"], set()).add(r["succes_id"])

    user_id = user["id"] if user else None
    tous_quete_ids = sorted({q for s in quete_par_dofus.values() for q in s})
    tous_succes_ids = sorted({s for s in succes_par_dofus.values() for s in s})
    etats_quetes = _etat_etapes_quetes(cur, user_id, tous_quete_ids)
    etats_succes = _etat_objectifs_succes(cur, user_id, tous_succes_ids)

    resultats = []
    obtenus = 0
    for r in dofus_rows:
        quete_ids = quete_par_dofus.get(r["id"], set())
        succes_ids = succes_par_dofus.get(r["id"], set())
        trackable = bool(quete_ids or succes_ids)

        fait = total = 0
        for qid in quete_ids:
            e = etats_quetes.get(qid, {"fait": 0, "total": 0})
            fait += e["fait"]; total += e["total"]
        for sid in succes_ids:
            e = etats_succes.get(sid, {"fait": 0, "total": 0})
            fait += e["fait"]; total += e["total"]

        pct = round(fait / total * 100) if total else 0
        obtenu = user is not None and trackable and total > 0 and fait >= total
        if obtenu:
            obtenus += 1

        resultats.append({
            "id": r["id"], "nom": r["nom"], "niveau": r["niveau"], "img": r["img"],
            "primordial": r["id"] in DOFUS_PRIMORDIAUX_COULEURS,
            "couleur": DOFUS_PRIMORDIAUX_COULEURS.get(r["id"]),
            "trackable": trackable,
            "pct": pct if user else 0,
            "obtenu": obtenu,
            "quete_id": sorted(quete_ids)[0] if quete_ids else None,
            "succes_id": sorted(succes_ids)[0] if succes_ids else None,
        })

    conn.close()
    return {
        "dofus": resultats,
        "total": len(resultats),
        "obtenus": obtenus if user else None,
    }


def _itineraire_pour_dofus(cur, quete_ids_directs, succes_ids, user_id):
    """Liste chronologique des quetes menant a un Dofus (chantier Dofus,
    demande Popo — refonte façon Duffus). Deux cas, aucune donnee inventee :
    - Dofus lie a un succes : les objectifs de type "quete" du succes,
      DEJA ordonnes par succes_objectifs.ordre (liste curatee par Ankama
      elle-meme, pas une reconstruction). Les succes purement "manuel"
      (aucun objectif quete) donnent un itineraire vide, gere par l'appelant.
    - Dofus recompense directement par une quete (pas de succes) : cette
      seule quete, sans remonter recursivement SES propres prerequis (deja
      visibles sur sa fiche via le bloc Prerequis existant — remonter plus
      loin serait une frontiere arbitraire que rien dans les donnees ne
      justifie, contrairement a la liste d'un succes qui est, elle, bornee
      par Ankama).
    Prerequis affiches en ligne UNIQUEMENT s'ils pointent vers une AUTRE
    quete de ce meme itineraire (table quetes_prerequis_quetes deja
    existante) — un prerequis hors-liste n'a rien a quoi se lier ici.
    Donjon lie intercale via quetes_donjons (deja existante, meme donnee
    que le bloc "Donjon lie" de la fiche quete).
    """
    if succes_ids:
        cur.execute("""
            SELECT quete_id FROM succes_objectifs
            WHERE succes_id = ? AND type = 'quete' AND quete_id IS NOT NULL
            ORDER BY ordre
        """, (succes_ids[0],))
        quete_ids = [r["quete_id"] for r in cur.fetchall()]
    else:
        quete_ids = list(quete_ids_directs)

    if not quete_ids:
        return []

    etats = _etat_etapes_quetes(cur, user_id, quete_ids)

    ph = ",".join("?" for _ in quete_ids)
    cur.execute(f"SELECT id, nom, niveau_min FROM quetes WHERE id IN ({ph})", quete_ids)
    infos = {r["id"]: r for r in cur.fetchall()}

    cur.execute(f"SELECT quete_id, quete_requise_id FROM quetes_prerequis_quetes WHERE quete_id IN ({ph})", quete_ids)
    prereqs_par_quete = {}
    for r in cur.fetchall():
        prereqs_par_quete.setdefault(r["quete_id"], []).append(r["quete_requise_id"])

    cur.execute(f"""
        SELECT qd.quete_id, d.id AS donjon_id, d.nom AS donjon_nom, d.niveau_optimal
        FROM quetes_donjons qd JOIN donjons d ON d.id = qd.donjon_id
        WHERE qd.quete_id IN ({ph})
    """, quete_ids)
    donjons_par_quete = {
        r["quete_id"]: {"id": r["donjon_id"], "nom": r["donjon_nom"], "niveau_optimal": r["niveau_optimal"]}
        for r in cur.fetchall()
    }

    ensemble_itineraire = set(quete_ids)
    itineraire = []
    for qid in quete_ids:
        info = infos.get(qid)
        if not info:
            continue
        e = etats.get(qid, {"fait": 0, "total": 0})
        prereqs_dans_liste = [
            {"id": pid, "nom": infos[pid]["nom"]}
            for pid in prereqs_par_quete.get(qid, [])
            if pid in ensemble_itineraire and pid in infos
        ]
        itineraire.append({
            "id": qid, "nom": info["nom"], "niveau_min": info["niveau_min"],
            "etapes_faites": e["fait"], "etapes_total": e["total"],
            "fait": e["total"] > 0 and e["fait"] >= e["total"],
            "prerequis": prereqs_dans_liste,
            "donjon_lie": donjons_par_quete.get(qid),
        })
    return itineraire


class QueteCompleteBody(BaseModel):
    quete_id: int
    fait: bool


@app.post("/progression/quete-complete")
def marquer_quete_complete(body: QueteCompleteBody, user: dict = Depends(utilisateur_courant)):
    """Coche/decoche TOUTES les etapes d'une quete d'un coup (itineraire
    d'un Dofus, chantier Dofus) — ecrit dans la MEME table/cles que la
    fiche quete (progression_joueur, element_type='quete_etape'), donc
    une seule source de verite : coche ici = coche sur la fiche quete."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM quetes_etapes WHERE quete_id = ?", (body.quete_id,))
    etape_ids = [r["id"] for r in cur.fetchall()]
    for etape_id in etape_ids:
        cur.execute("""
            INSERT INTO progression_joueur (user_id, element_type, element_id, fait, date_maj)
            VALUES (?, 'quete_etape', ?, ?, datetime('now'))
            ON CONFLICT(user_id, element_type, element_id)
            DO UPDATE SET fait = excluded.fait, date_maj = excluded.date_maj
        """, (user["id"], str(etape_id), int(body.fait)))
    conn.commit()
    conn.close()
    return {"quete_id": body.quete_id, "fait": body.fait, "etapes_total": len(etape_ids)}


@app.get("/dofus/{dofus_id}")
def detail_dofus(dofus_id: int, user: dict = Depends(utilisateur_optionnel)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, nom, niveau, img FROM objets WHERE id = ? AND type_nom = 'Dofus'", (dofus_id,))
    d = cur.fetchone()
    if not d:
        conn.close()
        return {"erreur": "Dofus introuvable"}

    cur.execute("""
        SELECT DISTINCT qe.quete_id FROM quetes_etapes_items qei
        JOIN quetes_etapes qe ON qe.id = qei.etape_id WHERE qei.objet_id = ?
    """, (dofus_id,))
    quete_ids = sorted({r["quete_id"] for r in cur.fetchall()})
    cur.execute("SELECT succes_id FROM succes_recompenses_items WHERE objet_id = ?", (dofus_id,))
    succes_ids = sorted({r["succes_id"] for r in cur.fetchall()})

    user_id = user["id"] if user else None
    etats_quetes = _etat_etapes_quetes(cur, user_id, quete_ids)
    etats_succes = _etat_objectifs_succes(cur, user_id, succes_ids)

    fait = total = 0
    for qid in quete_ids:
        e = etats_quetes.get(qid, {"fait": 0, "total": 0})
        fait += e["fait"]; total += e["total"]
    for sid in succes_ids:
        e = etats_succes.get(sid, {"fait": 0, "total": 0})
        fait += e["fait"]; total += e["total"]

    trackable = bool(quete_ids or succes_ids)
    pct = round(fait / total * 100) if total else 0
    obtenu = user is not None and trackable and total > 0 and fait >= total

    quete_liee = None
    if quete_ids:
        cur.execute("SELECT id, nom, niveau_min FROM quetes WHERE id = ?", (quete_ids[0],))
        r = cur.fetchone()
        if r:
            quete_liee = dict(r)
    succes_lie = None
    if succes_ids:
        cur.execute("SELECT id, nom, points FROM succes WHERE id = ?", (succes_ids[0],))
        r = cur.fetchone()
        if r:
            succes_lie = dict(r)

    itineraire = _itineraire_pour_dofus(cur, quete_ids, succes_ids, user_id)
    quetes_faites = sum(1 for e in itineraire if e["fait"])

    conn.close()
    return {
        "id": d["id"], "nom": d["nom"], "niveau": d["niveau"], "img": d["img"],
        "primordial": d["id"] in DOFUS_PRIMORDIAUX_COULEURS,
        "couleur": DOFUS_PRIMORDIAUX_COULEURS.get(d["id"]),
        "trackable": trackable,
        "pct": pct if user else 0,
        "obtenu": obtenu,
        "quete_liee": quete_liee,
        "succes_lie": succes_lie,
        "itineraire": itineraire,
        "itineraire_fait": quetes_faites,
        "itineraire_total": len(itineraire),
    }


# ============================================================
# Comptes utilisateurs / progression / favoris (chantier Phase 4)
# ⚠️ Teste en local uniquement pour l'instant — voir la note dans
# init_db.py sur le volume persistant Railway absent (CLAUDE.md,
# "Chantiers en cours #1"). Session en JWT via header Authorization,
# pas de cookies (deja decide au §6 du CLAUDE.md — front/back sur deux
# domaines a terme).
# ============================================================

class InscriptionBody(BaseModel):
    pseudo: str
    email: str
    password: str

class ConnexionBody(BaseModel):
    identifiant: str  # pseudo ou email
    password: str

class ProgressionBody(BaseModel):
    element_type: str
    element_id: str
    fait: bool

class FavoriBody(BaseModel):
    element_type: str
    element_id: str

@app.post("/auth/register")
def inscription(body: InscriptionBody):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Mot de passe trop court (8 caractères minimum)")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE pseudo = ? OR email = ?", (body.pseudo, body.email))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Pseudo ou email déjà utilisé")
    cur.execute("INSERT INTO users (pseudo, email, password_hash) VALUES (?, ?, ?)",
                (body.pseudo, body.email, hash_password(body.password)))
    user_id = cur.lastrowid
    conn.commit()
    conn.close()
    return {"token": creer_jwt(user_id, body.pseudo), "pseudo": body.pseudo}

@app.post("/auth/login")
def connexion(body: ConnexionBody):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, pseudo, password_hash FROM users WHERE pseudo = ? OR email = ?",
                (body.identifiant, body.identifiant))
    user = cur.fetchone()
    conn.close()
    if not user or not verifier_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    return {"token": creer_jwt(user["id"], user["pseudo"]), "pseudo": user["pseudo"]}

@app.post("/auth/dev-login")
def connexion_test():
    """Connexion en un clic au compte de test seme par init_db.py — outil
    de dev local le temps que l'inscription publique n'est pas construite."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, pseudo FROM users WHERE pseudo = 'PopoTest'")
    user = cur.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="Compte de test introuvable")
    return {"token": creer_jwt(user["id"], user["pseudo"]), "pseudo": user["pseudo"]}

@app.get("/auth/me")
def moi(user: dict = Depends(utilisateur_courant)):
    return user

@app.get("/progression")
def liste_progression(element_type: str = "", user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    if element_type:
        cur.execute("SELECT element_type, element_id, fait FROM progression_joueur WHERE user_id = ? AND element_type = ?",
                    (user["id"], element_type))
    else:
        cur.execute("SELECT element_type, element_id, fait FROM progression_joueur WHERE user_id = ?", (user["id"],))
    rows = cur.fetchall()
    conn.close()
    return {"progression": [dict(r) for r in rows]}

@app.post("/progression")
def marquer_progression(body: ProgressionBody, user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO progression_joueur (user_id, element_type, element_id, fait, date_maj)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, element_type, element_id)
        DO UPDATE SET fait = excluded.fait, date_maj = excluded.date_maj
    """, (user["id"], body.element_type, body.element_id, int(body.fait)))
    conn.commit()
    conn.close()
    return {"element_type": body.element_type, "element_id": body.element_id, "fait": body.fait}

@app.get("/favoris")
def liste_favoris(element_type: str = "", user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    if element_type:
        cur.execute("SELECT element_type, element_id FROM favoris WHERE user_id = ? AND element_type = ?",
                    (user["id"], element_type))
    else:
        cur.execute("SELECT element_type, element_id FROM favoris WHERE user_id = ?", (user["id"],))
    rows = cur.fetchall()
    conn.close()
    return {"favoris": [dict(r) for r in rows]}

@app.post("/favoris")
def ajouter_favori(body: FavoriBody, user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT OR IGNORE INTO favoris (user_id, element_type, element_id) VALUES (?, ?, ?)",
                (user["id"], body.element_type, body.element_id))
    conn.commit()
    conn.close()
    return {"favori": True}

@app.delete("/favoris")
def retirer_favori(element_type: str, element_id: str, user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM favoris WHERE user_id = ? AND element_type = ? AND element_id = ?",
                (user["id"], element_type, element_id))
    conn.commit()
    conn.close()
    return {"favori": False}


# ============================================================
# Suivi de Songes (SONGES.md §8) — etape 2 : endpoints uniquement
# ============================================================
# Regle de securite (demande explicite Popo) : user_id vient TOUJOURS du
# token JWT (Depends(utilisateur_courant)), jamais d'un champ de la requete
# client. Chaque acces a un personnage/team/run verifie explicitement
# "AND user_id = ?" (ou une jointure equivalente) — un ID d'un autre joueur
# renvoie 404, jamais les donnees. Pas de PRAGMA foreign_keys actif dans ce
# projet (verifie : aucune occurrence dans le code) => ON DELETE CASCADE du
# schema SQL n'est PAS applique automatiquement par SQLite, toutes les
# suppressions en cascade (team->membres, run->participants/drops) sont
# faites a la main ci-dessous.

ORDRE_INTENSITE = {"reve": 0, "paradoxe": 1, "cauchemar": 2}

def item_eligible_intensite(intensite_min, intensite_demandee):
    """SONGES.md §3.6 : legendes/legendes animales exigent Paradoxe ou
    Cauchemar (jamais Reve). intensite_min=None = eligible partout."""
    if not intensite_min:
        return True
    return ORDRE_INTENSITE.get(intensite_demandee, -1) >= ORDRE_INTENSITE.get(intensite_min, 99)

def paliers_atteints(salle_atteinte):
    """Un palier compte comme 'atteint' des que le joueur y entre, meme mort
    en cours de palier : SONGES.md §3.3 ne donne que des totaux par palier
    (valeurs '≈'), rien de plus fin — credit le palier entame au complet
    plutot que de sous-estimer systematiquement les tirages reels."""
    return [p for p, info in songes_config.PALIERS.items() if salle_atteinte >= info["salles"][0]]

def calculer_nb_combats(salle_atteinte):
    return sum(songes_config.COMBATS_PAR_PALIER[p] for p in paliers_atteints(salle_atteinte))

def tirages_eligibles(item_paliers, salle_atteinte, nb_participants_scope):
    """SONGES.md §7 : formule des tirages eligibles — seuls les paliers ou
    l'item est eligible ET que la run a atteints comptent, multiplies par le
    nombre de participants du perimetre demande (chaque personnage a sa
    propre chance de drop)."""
    paliers_run = set(paliers_atteints(salle_atteinte))
    return sum(songes_config.COMBATS_PAR_PALIER[p] for p in item_paliers if p in paliers_run) * nb_participants_scope

def charger_taux(conn, intensite, niveau, cle_taux):
    cur = conn.cursor()
    cur.execute("SELECT palier, taux FROM songe_taux WHERE intensite = ? AND niveau = ? AND cle_taux = ?",
                (intensite, niveau, cle_taux))
    return {row["palier"]: row["taux"] for row in cur.fetchall()}

def estimer_esperance_runs(items, nb_participants):
    """Esperance du nombre de runs pour qu'AU MOINS UN des items donnes drop,
    en supposant des runs completes (tous les paliers eligibles atteints) —
    SONGES.md §9. `items` est une liste de (item_paliers, taux_par_palier) ;
    un seul item = cas normal (estimation precise), plusieurs = reference
    "n'importe lequel de cette categorie" (les drops sont supposes
    independants entre items, hypothese raisonnable pour une table de butin).
    Retourne None si le taux d'AU MOINS UN palier eligible d'AU MOINS UN item
    est absent de songe_taux : jamais d'estimation partielle/extrapolee
    (regle 4 §5), l'endpoint doit alors annoncer "donnees non disponibles"."""
    p_aucun_drop_un_participant = 1.0
    for item_paliers, taux_par_palier in items:
        if any(p not in taux_par_palier for p in item_paliers):
            return None
        for p in item_paliers:
            probabilite = taux_par_palier[p] / 100  # taux stocke "en pourcentage" (ex. 0.006 = 0,006 %)
            combats = songes_config.COMBATS_PAR_PALIER[p]
            p_aucun_drop_un_participant *= (1 - probabilite) ** combats
    p_au_moins_un_drop = 1 - (p_aucun_drop_un_participant ** nb_participants)
    if p_au_moins_un_drop <= 0:
        return None
    return 1 / p_au_moins_un_drop

def _perso_ids_appartiennent(conn, perso_ids, user_id):
    """Verifie que TOUS les perso_ids donnes appartiennent a user_id — jamais
    de confiance aveugle dans des IDs envoyes par le client (regle de securite
    demandee explicitement pour ce chantier)."""
    uniques = set(perso_ids)
    if not uniques:
        return True
    placeholders = ",".join("?" * len(uniques))
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM songe_personnages WHERE id IN ({placeholders}) AND user_id = ?",
                (*uniques, user_id))
    return cur.fetchone()[0] == len(uniques)

def _team_detail(conn, team_id):
    cur = conn.cursor()
    cur.execute("SELECT id, nom, cree_le FROM songe_teams WHERE id = ?", (team_id,))
    team = cur.fetchone()
    cur.execute("""
        SELECT p.id, p.nom FROM songe_team_membres tm
        JOIN songe_personnages p ON p.id = tm.perso_id
        WHERE tm.team_id = ? ORDER BY p.nom
    """, (team_id,))
    membres = cur.fetchall()
    return {"id": team["id"], "nom": team["nom"], "cree_le": team["cree_le"],
            "membres": [{"perso_id": m["id"], "nom": m["nom"]} for m in membres]}

class PersonnageBody(BaseModel):
    nom: str
    classe: Optional[str] = None
    serveur: Optional[str] = None

class TeamBody(BaseModel):
    nom: str
    perso_ids: List[int] = []

class DropBody(BaseModel):
    perso_id: int
    item_id: int
    quantite: int = 1
    palier: Optional[int] = None

class DepenseBribesBody(BaseModel):
    perso_id: int
    montant: int
    note: Optional[str] = None

class VagueFinaleBody(BaseModel):
    vague_finale: int

class RunBody(BaseModel):
    intensite: str
    niveau: int
    terminee: bool = True
    salle_atteinte: int = songes_config.NB_SALLES_PAR_RUN
    participants: List[int]
    drops: List[DropBody] = []
    team_id: Optional[int] = None
    note: Optional[str] = None
    nb_combats: Optional[int] = None  # saisie manuelle explicite, sinon estime
    duree_secondes: Optional[int] = None  # chronometre optionnel, refonte interface
    vague_finale: Optional[int] = None    # combat final a vagues, optionnel
    nombre_tours: Optional[int] = None    # optionnel, sans lien avec vague_finale

@app.get("/songes/config")
def songes_recuperer_config():
    """Toutes les constantes de config/songes.py (SONGES.md §6) — le
    frontend ne code rien en dur, tout vient d'ici. bribes_par_vague vient de
    dofura_songes_taux.json (via _songes_taux_v2(), chantier 1 passe 1b) : la
    aussi, jamais recopie en dur cote frontend."""
    taux_v2 = _songes_taux_v2()
    return {
        "nb_salles_par_run": songes_config.NB_SALLES_PAR_RUN,
        "combats_par_palier": songes_config.COMBATS_PAR_PALIER,
        "paliers": songes_config.PALIERS,
        "intensites": songes_config.INTENSITES,
        "intensite_defaut": {
            "intensite": songes_config.INTENSITE_DEFAUT[0],
            "niveau": songes_config.INTENSITE_DEFAUT[1],
        },
        "vagues_max": songes_config.VAGUES_MAX,
        "bribes_par_vague": {e["id"]: e["bribes_par_vague"] for e in taux_v2["intensites"]},
        "vagues_requises": songes_config.VAGUES_REQUISES,
    }

@app.get("/songes/items-trackables")
def songes_items_trackables():
    """Les 38 items trackables (SONGES.md §4), enrichis nom/image depuis
    l'encyclopedie. Public : donnee de reference, pas de donnee joueur."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT si.item_id, o.nom, o.img, si.categorie, si.paliers, si.intensite_min
        FROM songe_items_trackables si
        JOIN objets o ON o.id = si.item_id
        ORDER BY si.categorie, o.nom
    """)
    rows = cur.fetchall()
    conn.close()
    return {"items": [
        {
            "item_id": r["item_id"], "nom": r["nom"], "img": r["img"],
            "categorie": r["categorie"], "paliers": json.loads(r["paliers"]),
            "intensite_min": r["intensite_min"],
        } for r in rows
    ]}

# Runes/reliques dont le taux est relevé (present dans songe_taux) mais
# l'objet n'est volontairement PAS suivi dans songe_items_trackables (pas de
# tracker cote joueur pour ceux-la) — nom en dur faute d'item_id/image a
# resoudre par jointure, demande explicite Popo (31 juillet 2026). Categorie
# "rune_astrale" choisie par defaut (pas de categorie dediee existante) — a
# corriger si Popo en veut une distincte.
# "rune_astrale_legendaire" volontairement absent d'ici : deja couvert par
# songe_items_trackables (item "Rune astrale legendaire"), l'ajouter ici le
# dupliquerait dans le tableau.
# "reflet_onirique" retire (2 aout 2026, migration dofura_songes_taux.json
# v2.0) : sa valeur (100 sur les 5 paliers) etait un placeholder, aucune
# source dans le nouveau fichier — decision Popo, ne pas reintroduire sans
# une vraie mesure en jeu.
RUNES_HORS_TRACKER = {
    "rune_astrale_merveilleuse": "Rune astrale merveilleuse",
    "rune_astrale_epatante": "Rune astrale épatante",
    "rune_astrale_majeure": "Rune astrale majeure",
    "rune_astrale_moyenne": "Rune astrale moyenne",
    "rune_astrale_mineure": "Rune astrale mineure",
}

@app.get("/songes/taux")
def songes_taux(intensite: str, niveau: int):
    """Taux de drop par palier pour tous les items trackables, a une
    intensite x niveau donnes — alimente la page "Les Taux" (accueil).
    Public, aucune donnee joueur. Retourne les items PAR ITEM (pas groupes
    par cle_taux) : verifie sur les donnees reelles que des items partageant
    la meme cle_taux (ex. les 5 "Bouclireve ...") peuvent avoir des paliers
    eligibles differents chacun — un regroupement naif aurait affiche des
    paliers faux pour certains d'entre eux. Jamais d'extrapolation : un
    palier absent de songe_taux reste `null`, jamais une estimation
    (regle 4 §5, voir charger_taux). Inclut aussi les runes/reliques
    RUNES_HORS_TRACKER (item_id null, "synthetique": true cote frontend)."""
    if intensite not in songes_config.INTENSITES:
        raise HTTPException(status_code=400, detail=f"Intensite inconnue : {intensite}")
    if niveau not in songes_config.INTENSITES[intensite]["niveaux"]:
        raise HTTPException(status_code=400, detail=f"Niveau {niveau} invalide pour {intensite}")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT si.item_id, o.nom, o.img, si.categorie, si.paliers, si.cle_taux, si.intensite_min
        FROM songe_items_trackables si
        JOIN objets o ON o.id = si.item_id
        ORDER BY si.categorie, o.nom
    """)
    items = cur.fetchall()

    resultat = []
    for it in items:
        if not item_eligible_intensite(it["intensite_min"], intensite):
            continue
        paliers_item = json.loads(it["paliers"])
        taux = charger_taux(conn, intensite, niveau, it["cle_taux"])
        resultat.append({
            "item_id": it["item_id"], "nom": it["nom"], "img": it["img"], "categorie": it["categorie"],
            "paliers_eligibles": paliers_item,
            "taux_par_palier": {str(p): taux.get(p) for p in paliers_item},
        })

    for cle_taux, nom in RUNES_HORS_TRACKER.items():
        # 3 aout 2026 : l'ancienne requete ("SELECT DISTINCT palier FROM
        # songe_taux WHERE cle_taux = ?") ne filtrait PAS par intensite/niveau
        # — un cle_taux avec des lignes a d'AUTRES intensites (ex. Paradoxe)
        # passait le test meme a une intensite sans aucune donnee (Reve),
        # affichant une rune fantome a taux null partout. charger_taux() est
        # deja filtre par intensite/niveau — ses cles sont les seuls paliers
        # reellement disponibles ICI, jamais None (colonne taux NOT NULL).
        taux = charger_taux(conn, intensite, niveau, cle_taux)
        paliers_possibles = sorted(taux.keys())
        if not paliers_possibles:
            continue
        resultat.append({
            "item_id": None, "nom": nom, "img": None, "categorie": "rune_astrale",
            "paliers_eligibles": paliers_possibles,
            "taux_par_palier": {str(p): taux.get(p) for p in paliers_possibles},
            "synthetique": True,
        })

    conn.close()
    return {"intensite": intensite, "niveau": niveau, "items": resultat}

@app.get("/songes/personnages")
def songes_liste_personnages(user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, nom, classe, serveur, cree_le FROM songe_personnages WHERE user_id = ? ORDER BY nom",
                (user["id"],))
    rows = cur.fetchall()
    conn.close()
    return {"personnages": [dict(r) for r in rows]}

@app.post("/songes/personnages")
def songes_creer_personnage(body: PersonnageBody, user: dict = Depends(utilisateur_courant)):
    if not body.nom.strip():
        raise HTTPException(status_code=400, detail="Nom requis")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO songe_personnages (user_id, nom, classe, serveur) VALUES (?, ?, ?, ?)",
                (user["id"], body.nom.strip(), body.classe, body.serveur))
    perso_id = cur.lastrowid
    conn.commit()
    cur.execute("SELECT id, nom, classe, serveur, cree_le FROM songe_personnages WHERE id = ?", (perso_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row)

@app.get("/songes/teams")
def songes_liste_teams(user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM songe_teams WHERE user_id = ? ORDER BY nom", (user["id"],))
    ids = [r["id"] for r in cur.fetchall()]
    teams = [_team_detail(conn, tid) for tid in ids]
    conn.close()
    return {"teams": teams}

@app.post("/songes/teams")
def songes_creer_team(body: TeamBody, user: dict = Depends(utilisateur_courant)):
    if not body.nom.strip():
        raise HTTPException(status_code=400, detail="Nom requis")
    conn = get_db()
    if not _perso_ids_appartiennent(conn, body.perso_ids, user["id"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Un des personnages ne vous appartient pas")
    cur = conn.cursor()
    cur.execute("INSERT INTO songe_teams (user_id, nom) VALUES (?, ?)", (user["id"], body.nom.strip()))
    team_id = cur.lastrowid
    for perso_id in set(body.perso_ids):
        cur.execute("INSERT INTO songe_team_membres (team_id, perso_id) VALUES (?, ?)", (team_id, perso_id))
    conn.commit()
    detail = _team_detail(conn, team_id)
    conn.close()
    return detail

@app.put("/songes/teams/{team_id}")
def songes_modifier_team(team_id: int, body: TeamBody, user: dict = Depends(utilisateur_courant)):
    if not body.nom.strip():
        raise HTTPException(status_code=400, detail="Nom requis")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM songe_teams WHERE id = ? AND user_id = ?", (team_id, user["id"]))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Team introuvable")
    if not _perso_ids_appartiennent(conn, body.perso_ids, user["id"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Un des personnages ne vous appartient pas")
    cur.execute("UPDATE songe_teams SET nom = ? WHERE id = ?", (body.nom.strip(), team_id))
    cur.execute("DELETE FROM songe_team_membres WHERE team_id = ?", (team_id,))
    for perso_id in set(body.perso_ids):
        cur.execute("INSERT INTO songe_team_membres (team_id, perso_id) VALUES (?, ?)", (team_id, perso_id))
    conn.commit()
    detail = _team_detail(conn, team_id)
    conn.close()
    return detail

@app.delete("/songes/teams/{team_id}")
def songes_supprimer_team(team_id: int, user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM songe_teams WHERE id = ? AND user_id = ?", (team_id, user["id"]))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Team introuvable")
    cur.execute("DELETE FROM songe_team_membres WHERE team_id = ?", (team_id,))
    cur.execute("DELETE FROM songe_teams WHERE id = ?", (team_id,))
    conn.commit()
    conn.close()
    return {"supprime": True}

@app.post("/songes/runs")
def songes_creer_run(body: RunBody, user: dict = Depends(utilisateur_courant)):
    if body.intensite not in songes_config.INTENSITES:
        raise HTTPException(status_code=400, detail=f"Intensite inconnue : {body.intensite}")
    if body.niveau not in songes_config.INTENSITES[body.intensite]["niveaux"]:
        raise HTTPException(status_code=400, detail=f"Niveau {body.niveau} invalide pour {body.intensite}")
    if not (1 <= body.salle_atteinte <= songes_config.NB_SALLES_PAR_RUN):
        raise HTTPException(status_code=400, detail=f"salle_atteinte doit etre entre 1 et {songes_config.NB_SALLES_PAR_RUN}")
    if not body.participants:
        raise HTTPException(status_code=400, detail="Au moins un participant requis")
    if body.duree_secondes is not None and body.duree_secondes < 0:
        raise HTTPException(status_code=400, detail="duree_secondes doit etre >= 0")
    if body.vague_finale is not None and body.vague_finale < 1:
        raise HTTPException(status_code=400, detail="vague_finale doit etre >= 1")
    if body.nombre_tours is not None and body.nombre_tours < 1:
        raise HTTPException(status_code=400, detail="nombre_tours doit etre >= 1")

    conn = get_db()
    cur = conn.cursor()

    if not _perso_ids_appartiennent(conn, body.participants, user["id"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Un des participants ne vous appartient pas")

    if body.team_id is not None:
        cur.execute("SELECT id FROM songe_teams WHERE id = ? AND user_id = ?", (body.team_id, user["id"]))
        if not cur.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Team introuvable")

    participants_set = set(body.participants)
    for drop in body.drops:
        if drop.perso_id not in participants_set:
            conn.close()
            raise HTTPException(status_code=400, detail=f"Le drop du personnage {drop.perso_id} ne fait pas partie des participants")
        if drop.quantite < 1:
            conn.close()
            raise HTTPException(status_code=400, detail="quantite doit etre >= 1")
        if drop.palier is not None and drop.palier not in songes_config.PALIERS:
            conn.close()
            raise HTTPException(status_code=400, detail=f"palier invalide : {drop.palier}")
        # Valide contre songe_items_trackables, PAS contre objets (l'encyclopedie
        # entiere) : un item hors des 38 trackables n'a ni cle_taux ni paliers
        # d'eligibilite, tous les calculs de tirages/estimation seraient faux.
        cur.execute("SELECT 1 FROM songe_items_trackables WHERE item_id = ?", (drop.item_id,))
        if not cur.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail=f"item_id non trackable (absent de songe_items_trackables) : {drop.item_id}")

    if body.nb_combats is not None:
        if body.nb_combats < 0:
            conn.close()
            raise HTTPException(status_code=400, detail="nb_combats doit etre >= 0")
        nb_combats = body.nb_combats
        source_nb_combats = "saisi"
    else:
        nb_combats = calculer_nb_combats(body.salle_atteinte)
        source_nb_combats = "estime"

    cur.execute("""
        INSERT INTO songe_runs (user_id, intensite, niveau, terminee, salle_atteinte,
                                 nb_combats, source_nb_combats, team_id, note,
                                 duree_secondes, vague_finale, nombre_tours)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user["id"], body.intensite, body.niveau, int(body.terminee), body.salle_atteinte,
          nb_combats, source_nb_combats, body.team_id, body.note,
          body.duree_secondes, body.vague_finale, body.nombre_tours))
    run_id = cur.lastrowid

    for perso_id in participants_set:
        cur.execute("INSERT INTO songe_run_participants (run_id, perso_id) VALUES (?, ?)", (run_id, perso_id))

    for drop in body.drops:
        cur.execute("""
            INSERT INTO songe_drops (run_id, perso_id, item_id, quantite, palier)
            VALUES (?, ?, ?, ?, ?)
        """, (run_id, drop.perso_id, drop.item_id, drop.quantite, drop.palier))

    conn.commit()
    conn.close()
    return {
        "id": run_id, "intensite": body.intensite, "niveau": body.niveau,
        "terminee": body.terminee, "salle_atteinte": body.salle_atteinte,
        "nb_combats": nb_combats, "source_nb_combats": source_nb_combats,
        "participants": sorted(participants_set),
        "drops": [d.model_dump() for d in body.drops],
        "duree_secondes": body.duree_secondes, "vague_finale": body.vague_finale, "nombre_tours": body.nombre_tours,
    }

@app.delete("/songes/runs/{run_id}")
def songes_supprimer_run(run_id: int, user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM songe_runs WHERE id = ? AND user_id = ?", (run_id, user["id"]))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Run introuvable")
    cur.execute("DELETE FROM songe_drops WHERE run_id = ?", (run_id,))
    cur.execute("DELETE FROM songe_run_participants WHERE run_id = ?", (run_id,))
    cur.execute("DELETE FROM songe_runs WHERE id = ?", (run_id,))
    conn.commit()
    conn.close()
    return {"supprime": True}

@app.put("/songes/runs/{run_id}/vague-finale")
def songes_corriger_vague_finale(run_id: int, body: VagueFinaleBody, user: dict = Depends(utilisateur_courant)):
    """Rattrapage (chantier 1, passe 1b, 2026-08-04) : renseigne ou corrige
    UNIQUEMENT vague_finale sur une run passee (ex. run enregistree avant le
    compteur "Combat final", ou valeur mal saisie sur le coup) — consigne
    explicite : rien d'autre n'est modifiable par cet endpoint, ni ici ni
    plus tard sans nouvelle demande (intensite, niveau, participants, drops
    restent figes)."""
    if body.vague_finale < 1:
        raise HTTPException(status_code=400, detail="vague_finale doit etre >= 1")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM songe_runs WHERE id = ? AND user_id = ?", (run_id, user["id"]))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Run introuvable")
    cur.execute("UPDATE songe_runs SET vague_finale = ? WHERE id = ?", (body.vague_finale, run_id))
    conn.commit()
    conn.close()
    return {"id": run_id, "vague_finale": body.vague_finale}

@app.get("/songes/historique")
def songes_historique(page: int = 1, page_size: int = 20, user: dict = Depends(utilisateur_courant)):
    """Historique des SONGES (vocabulaire interface, chantier 1 passe 1a :
    "songe" pour le recit/titres, "run" pour compter/agir — voir CLAUDE.md ;
    "run" reste par ailleurs le terme du code/BDD, cf. songe_runs), du plus
    recent au plus ancien, drops eventuels imbriques. Les id de songe ne sont
    JAMAIS renumerotes apres suppression — un trou dans la numerotation est
    normal. bribes = calculer_bribes(vague_finale x bribes_par_vague), 0 si
    vague_finale absente (chantier 1 passe 1b)."""
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM songe_runs WHERE user_id = ?", (user["id"],))
    total = cur.fetchone()[0]

    cur.execute("""
        SELECT r.id, r.date_run, r.intensite, r.niveau, r.terminee, r.salle_atteinte,
               r.nb_combats, r.source_nb_combats, t.nom AS team_nom,
               r.duree_secondes, r.vague_finale, r.nombre_tours
        FROM songe_runs r
        LEFT JOIN songe_teams t ON t.id = r.team_id
        WHERE r.user_id = ?
        ORDER BY r.date_run DESC, r.id DESC
        LIMIT ? OFFSET ?
    """, (user["id"], page_size, (page - 1) * page_size))
    runs = cur.fetchall()

    drops_par_run = {}
    run_ids = [r["id"] for r in runs]
    if run_ids:
        placeholders = ",".join("?" * len(run_ids))
        cur.execute(f"""
            SELECT d.id, d.run_id, d.item_id, o.nom AS item_nom, o.img AS item_img,
                   d.perso_id, p.nom AS perso_nom, d.quantite, d.palier
            FROM songe_drops d
            JOIN objets o ON o.id = d.item_id
            JOIN songe_personnages p ON p.id = d.perso_id
            WHERE d.run_id IN ({placeholders})
            ORDER BY d.id
        """, run_ids)
        for row in cur.fetchall():
            drops_par_run.setdefault(row["run_id"], []).append({
                "id": row["id"], "item_id": row["item_id"], "item_nom": row["item_nom"],
                "item_img": row["item_img"], "perso_id": row["perso_id"], "perso_nom": row["perso_nom"],
                "quantite": row["quantite"], "palier": row["palier"],
            })

    conn.close()
    taux_v2 = _songes_taux_v2()
    songes = [{
        "id": r["id"], "date_run": r["date_run"], "intensite": r["intensite"], "niveau": r["niveau"],
        "terminee": bool(r["terminee"]), "salle_atteinte": r["salle_atteinte"],
        "nb_combats": r["nb_combats"], "source_nb_combats": r["source_nb_combats"],
        "team_nom": r["team_nom"], "drops": drops_par_run.get(r["id"], []),
        "duree_secondes": r["duree_secondes"], "vague_finale": r["vague_finale"], "nombre_tours": r["nombre_tours"],
        "bribes": calculer_bribes(taux_v2, r["intensite"], r["niveau"], r["vague_finale"]),
    } for r in runs]
    return {"total": total, "page": page, "page_size": page_size, "songes": songes}

@app.get("/songes/drops")
def songes_liste_drops(categorie: Optional[str] = None, perso_id: Optional[int] = None,
                        page: int = 1, page_size: int = 20, user: dict = Depends(utilisateur_courant)):
    """Page dediee "Mes drops" (refonte interface) : liste plate de tous
    les drops de l'utilisateur, plus recent d'abord, filtrable par
    categorie et par personnage. Distincte de /songes/historique (qui
    reste groupe par songe, sur l'ecran principal)."""
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    conn = get_db()
    cur = conn.cursor()

    conditions = ["r.user_id = ?"]
    params = [user["id"]]
    if categorie:
        conditions.append("si.categorie = ?")
        params.append(categorie)
    if perso_id:
        conditions.append("d.perso_id = ?")
        params.append(perso_id)
    where_clause = " AND ".join(conditions)

    cur.execute(f"""
        SELECT COUNT(*)
        FROM songe_drops d
        JOIN songe_runs r ON r.id = d.run_id
        LEFT JOIN songe_items_trackables si ON si.item_id = d.item_id
        WHERE {where_clause}
    """, params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT d.id, d.item_id, o.nom AS item_nom, o.img AS item_img, si.categorie,
               d.perso_id, p.nom AS perso_nom, d.quantite, d.palier, d.cree_le,
               d.run_id, r.intensite, r.niveau
        FROM songe_drops d
        JOIN songe_runs r ON r.id = d.run_id
        JOIN songe_personnages p ON p.id = d.perso_id
        JOIN objets o ON o.id = d.item_id
        LEFT JOIN songe_items_trackables si ON si.item_id = d.item_id
        WHERE {where_clause}
        ORDER BY d.cree_le DESC, d.id DESC
        LIMIT ? OFFSET ?
    """, params + [page_size, (page - 1) * page_size])
    rows = cur.fetchall()
    conn.close()

    return {"total": total, "page": page, "page_size": page_size, "drops": [
        {
            "id": r["id"], "item_id": r["item_id"], "item_nom": r["item_nom"], "item_img": r["item_img"],
            "categorie": r["categorie"], "perso_id": r["perso_id"], "perso_nom": r["perso_nom"],
            "quantite": r["quantite"], "palier": r["palier"], "date_drop": r["cree_le"],
            "run_id": r["run_id"], "intensite": r["intensite"], "niveau": r["niveau"],
        } for r in rows
    ]}

@app.delete("/songes/drops/{drop_id}")
def songes_supprimer_drop(drop_id: int, user: dict = Depends(utilisateur_courant)):
    """Suppression d'un drop individuel (pas tout le songe) — SONGES.md
    refonte interface point 3. Ne touche pas songe_journal : contrairement a
    "tout supprimer", une correction ponctuelle n'a pas vocation a etre
    archivee."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT d.id FROM songe_drops d JOIN songe_runs r ON r.id = d.run_id
        WHERE d.id = ? AND r.user_id = ?
    """, (drop_id, user["id"]))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Drop introuvable")
    cur.execute("DELETE FROM songe_drops WHERE id = ?", (drop_id,))
    conn.commit()
    conn.close()
    return {"supprime": True}

@app.get("/songes/journal")
def songes_journal(page: int = 1, page_size: int = 20, user: dict = Depends(utilisateur_courant)):
    """Entrees archivees par "Tout supprimer" (songe_journal) — lecture
    seule, ne rentrent dans AUCUN calcul de stats/estimation."""
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM songe_journal WHERE user_id = ?", (user["id"],))
    total = cur.fetchone()[0]
    cur.execute("""
        SELECT j.id, j.item_id, o.nom AS item_nom, o.img AS item_img, j.palier, j.date_drop
        FROM songe_journal j
        JOIN objets o ON o.id = j.item_id
        WHERE j.user_id = ?
        ORDER BY j.date_drop DESC, j.id DESC
        LIMIT ? OFFSET ?
    """, (user["id"], page_size, (page - 1) * page_size))
    rows = cur.fetchall()
    conn.close()
    return {"total": total, "page": page, "page_size": page_size, "entrees": [dict(r) for r in rows]}

@app.delete("/songes/tout")
def songes_tout_supprimer(user: dict = Depends(utilisateur_courant)):
    """Supprime tous les songes/participants/drops de l'utilisateur, ET ses
    depenses de bribes de reve (chantier 1, passe 1b, 2026-08-04 : sans ca,
    total_obtenu retombe a 0 mais total_depense resterait, solde negatif) —
    PAS ses personnages ni ses teams (le panneau de gestion n'est pas
    concerne). Chaque drop est d'abord archive dans songe_journal (user_id,
    item_id, palier, date du drop original) avant suppression : ces entrees ne
    comptent plus dans aucun calcul, elles restent juste consultables
    (SONGES.md, refonte interface point 4). PRAGMA foreign_keys n'est pas
    active dans ce projet (piege #9 CLAUDE.md) : chaque suppression liee est
    faite a la main, aucun ON DELETE CASCADE a esperer."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO songe_journal (user_id, item_id, palier, date_drop)
        SELECT r.user_id, d.item_id, d.palier, d.cree_le
        FROM songe_drops d JOIN songe_runs r ON r.id = d.run_id
        WHERE r.user_id = ?
    """, (user["id"],))
    cur.execute("""
        DELETE FROM songe_bribes_depenses
        WHERE perso_id IN (SELECT id FROM songe_personnages WHERE user_id = ?)
    """, (user["id"],))
    cur.execute("DELETE FROM songe_drops WHERE run_id IN (SELECT id FROM songe_runs WHERE user_id = ?)", (user["id"],))
    cur.execute("DELETE FROM songe_run_participants WHERE run_id IN (SELECT id FROM songe_runs WHERE user_id = ?)", (user["id"],))
    cur.execute("DELETE FROM songe_runs WHERE user_id = ?", (user["id"],))
    conn.commit()
    conn.close()
    return {"supprime": True}

def _songes_taux_v2():
    """Charge dofura_songes_taux.json (v2.0) a la demande — meme format que
    taux_songes.migrer()/calculer_bribes() attendent. Aucune valeur en dur ici
    (chantier 1, passe 1b, 2026-08-04)."""
    with open("dofura_songes_taux.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/songes/bribes")
def songes_bribes(user: dict = Depends(utilisateur_courant)):
    """Bribes de reve par personnage. total_obtenu n'est JAMAIS stocke : il
    est recalcule a chaque appel depuis les runs de l'utilisateur (vague_finale
    x bribes_par_vague, voir taux_songes.calculer_bribes — une run sans
    vague_finale compte 0, jamais une estimation). Gagnees PAR PERSONNAGE :
    chaque participant d'une run touche le montant complet, pas une part.
    Seules les DEPENSES sont stockees (songe_bribes_depenses)."""
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id, nom FROM songe_personnages WHERE user_id = ? ORDER BY nom", (user["id"],))
    personnages = cur.fetchall()
    if not personnages:
        conn.close()
        return {"personnages": [], "total_obtenu": 0, "total_depense": 0, "solde": 0}

    data = _songes_taux_v2()

    cur.execute("""
        SELECT rp.perso_id, r.intensite, r.niveau, r.vague_finale
        FROM songe_run_participants rp
        JOIN songe_runs r ON r.id = rp.run_id
        WHERE r.user_id = ?
    """, (user["id"],))
    obtenu_par_perso = {}
    for row in cur.fetchall():
        bribes = calculer_bribes(data, row["intensite"], row["niveau"], row["vague_finale"])
        obtenu_par_perso[row["perso_id"]] = obtenu_par_perso.get(row["perso_id"], 0) + bribes

    cur.execute("""
        SELECT perso_id, COALESCE(SUM(montant), 0) AS total
        FROM songe_bribes_depenses
        WHERE perso_id IN (SELECT id FROM songe_personnages WHERE user_id = ?)
        GROUP BY perso_id
    """, (user["id"],))
    depense_par_perso = {row["perso_id"]: row["total"] for row in cur.fetchall()}

    conn.close()

    resultat = []
    total_obtenu = 0
    total_depense = 0
    for p in personnages:
        obtenu = obtenu_par_perso.get(p["id"], 0)
        depense = depense_par_perso.get(p["id"], 0)
        total_obtenu += obtenu
        total_depense += depense
        resultat.append({
            "perso_id": p["id"], "nom": p["nom"],
            "total_obtenu": obtenu, "total_depense": depense, "solde": obtenu - depense,
        })

    return {
        "personnages": resultat,
        "total_obtenu": total_obtenu, "total_depense": total_depense,
        "solde": total_obtenu - total_depense,
    }

@app.post("/songes/bribes/depense")
def songes_creer_depense_bribes(body: DepenseBribesBody, user: dict = Depends(utilisateur_courant)):
    if body.montant <= 0:
        raise HTTPException(status_code=400, detail="montant doit etre > 0")
    conn = get_db()
    if not _perso_ids_appartiennent(conn, [body.perso_id], user["id"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Le personnage ne vous appartient pas")
    cur = conn.cursor()
    cur.execute("INSERT INTO songe_bribes_depenses (perso_id, montant, note) VALUES (?, ?, ?)",
                (body.perso_id, body.montant, body.note))
    depense_id = cur.lastrowid
    conn.commit()
    cur.execute("SELECT id, perso_id, montant, date, note FROM songe_bribes_depenses WHERE id = ?", (depense_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row)

@app.delete("/songes/bribes/depense/{depense_id}")
def songes_supprimer_depense_bribes(depense_id: int, user: dict = Depends(utilisateur_courant)):
    conn = get_db()
    cur = conn.cursor()
    # Verifie que la depense appartient a un personnage de l'utilisateur, pas
    # seulement que l'id existe (point de vigilance explicite, chantier 1
    # passe 1b) : jointure sur songe_personnages.user_id, jamais de confiance
    # aveugle dans un id envoye par le client.
    cur.execute("""
        SELECT d.id FROM songe_bribes_depenses d
        JOIN songe_personnages p ON p.id = d.perso_id
        WHERE d.id = ? AND p.user_id = ?
    """, (depense_id, user["id"]))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Depense introuvable")
    cur.execute("DELETE FROM songe_bribes_depenses WHERE id = ?", (depense_id,))
    conn.commit()
    conn.close()
    return {"supprime": True}

@app.get("/songes/stats")
def songes_stats(intensite: str, niveau: int, perso_id: Optional[int] = None,
                  team_id: Optional[int] = None, user: dict = Depends(utilisateur_courant)):
    if intensite not in songes_config.INTENSITES:
        raise HTTPException(status_code=400, detail=f"Intensite inconnue : {intensite}")
    if niveau not in songes_config.INTENSITES[intensite]["niveaux"]:
        raise HTTPException(status_code=400, detail=f"Niveau {niveau} invalide pour {intensite}")
    if perso_id is not None and team_id is not None:
        raise HTTPException(status_code=400, detail="Choisir perso_id OU team_id, pas les deux")

    conn = get_db()
    cur = conn.cursor()

    if perso_id is not None:
        cur.execute("SELECT id FROM songe_personnages WHERE id = ? AND user_id = ?", (perso_id, user["id"]))
        if not cur.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Personnage introuvable")
        scope_perso_ids = [perso_id]
        scope_type = "perso"
    elif team_id is not None:
        cur.execute("SELECT id FROM songe_teams WHERE id = ? AND user_id = ?", (team_id, user["id"]))
        if not cur.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Team introuvable")
        cur.execute("SELECT perso_id FROM songe_team_membres WHERE team_id = ?", (team_id,))
        scope_perso_ids = [r["perso_id"] for r in cur.fetchall()]
        scope_type = "team"
    else:
        cur.execute("SELECT id FROM songe_personnages WHERE user_id = ?", (user["id"],))
        scope_perso_ids = [r["id"] for r in cur.fetchall()]
        scope_type = "tous"

    scope_set = set(scope_perso_ids)

    cur.execute("""
        SELECT r.id, r.salle_atteinte, r.date_run
        FROM songe_runs r
        WHERE r.user_id = ? AND r.intensite = ? AND r.niveau = ?
        ORDER BY r.date_run ASC, r.id ASC
    """, (user["id"], intensite, niveau))
    runs = cur.fetchall()

    participants_par_run = {}
    if runs and scope_set:
        run_ids = [r["id"] for r in runs]
        placeholders = ",".join("?" * len(run_ids))
        cur.execute(f"SELECT run_id, perso_id FROM songe_run_participants WHERE run_id IN ({placeholders})", run_ids)
        for row in cur.fetchall():
            participants_par_run.setdefault(row["run_id"], set()).add(row["perso_id"])

    # Runs enrichies (ordre chronologique), restreintes a celles ou au moins
    # un personnage du perimetre demande a participe.
    runs_enrichies = []
    for r in runs:
        nb_scope = len(participants_par_run.get(r["id"], set()) & scope_set)
        if nb_scope == 0:
            continue
        runs_enrichies.append({"id": r["id"], "salle_atteinte": r["salle_atteinte"], "nb_scope": nb_scope})

    drops_par_item = {}
    if scope_set:
        placeholders = ",".join("?" * len(scope_set))
        cur.execute(f"""
            SELECT d.item_id, d.run_id, d.quantite
            FROM songe_drops d
            JOIN songe_runs r ON r.id = d.run_id
            WHERE r.user_id = ? AND r.intensite = ? AND r.niveau = ?
              AND d.perso_id IN ({placeholders})
        """, (user["id"], intensite, niveau, *scope_set))
        for row in cur.fetchall():
            drops_par_item.setdefault(row["item_id"], []).append(row)

    cur.execute("SELECT item_id, categorie, cle_taux, paliers, intensite_min FROM songe_items_trackables")
    items_trackables = cur.fetchall()

    item_ids = [it["item_id"] for it in items_trackables]
    objets_info = {}
    if item_ids:
        placeholders = ",".join("?" * len(item_ids))
        cur.execute(f"SELECT id, nom, img FROM objets WHERE id IN ({placeholders})", item_ids)
        objets_info = {r["id"]: {"nom": r["nom"], "img": r["img"]} for r in cur.fetchall()}

    resultats = []
    par_categorie = {}

    for it in items_trackables:
        if not item_eligible_intensite(it["intensite_min"], intensite):
            continue
        item_paliers = json.loads(it["paliers"])
        taux = charger_taux(conn, intensite, niveau, it["cle_taux"])

        drops_par_run = {}
        for d in drops_par_item.get(it["item_id"], []):
            drops_par_run[d["run_id"]] = drops_par_run.get(d["run_id"], 0) + d["quantite"]

        tirages_total = 0
        courant_tirages = 0
        courant_songes = 0
        record_secheresse = 0
        for r in runs_enrichies:
            t = tirages_eligibles(item_paliers, r["salle_atteinte"], r["nb_scope"])
            if t == 0:
                continue  # run non eligible pour cet item (palier pas atteint) : ne compte pas comme "songe joue"
            tirages_total += t
            courant_tirages += t
            courant_songes += 1
            if r["id"] in drops_par_run:
                record_secheresse = max(record_secheresse, courant_tirages)
                courant_tirages = 0
                courant_songes = 0
        record_secheresse = max(record_secheresse, courant_tirages)
        tirages_depuis_dernier_drop = courant_tirages
        songes_depuis_dernier_drop = courant_songes

        drops_total = sum(d["quantite"] for d in drops_par_item.get(it["item_id"], []))
        moyenne = (tirages_total / drops_total) if drops_total > 0 else None

        esperance = estimer_esperance_runs([(item_paliers, taux)], len(scope_set)) if scope_set else None
        indicateur = None
        if esperance is not None:
            tirages_par_run_moyen = tirages_eligibles(item_paliers, songes_config.NB_SALLES_PAR_RUN, len(scope_set))
            if tirages_par_run_moyen:
                esperance_tirages = esperance * tirages_par_run_moyen
                ratio = tirages_depuis_dernier_drop / esperance_tirages
                if ratio >= 1.5:
                    indicateur = "mauvaise_passe"
                elif ratio <= 0.5:
                    indicateur = "bonne_forme"
                else:
                    indicateur = "normal"

        info_objet = objets_info.get(it["item_id"], {})
        resultats.append({
            "item_id": it["item_id"], "nom": info_objet.get("nom"), "img": info_objet.get("img"),
            "categorie": it["categorie"],
            "songes_depuis_dernier_drop": songes_depuis_dernier_drop,
            "tirages_depuis_dernier_drop": tirages_depuis_dernier_drop,
            "record_secheresse_tirages": record_secheresse,
            "tirages_total": tirages_total,
            "drops_total": drops_total,
            "moyenne_tirages_par_drop": moyenne,
            "estimation_runs_theorique": round(esperance, 1) if esperance is not None else None,
            "indicateur_malchance": indicateur,
        })

        cat = it["categorie"]
        agg = par_categorie.setdefault(cat, {"tirages_total": 0, "drops_total": 0})
        agg["tirages_total"] += tirages_total
        agg["drops_total"] += drops_total

    moyennes_par_categorie = [
        {"categorie": cat, "tirages_total": v["tirages_total"], "drops_total": v["drops_total"],
         "moyenne": (v["tirages_total"] / v["drops_total"]) if v["drops_total"] > 0 else None}
        for cat, v in par_categorie.items()
    ]

    # Secheresse PAR CATEGORIE (compteur principal, refonte interface) : un
    # songe compte pour la categorie s'il a atteint au moins un palier
    # eligible pour AU MOINS UN item de la categorie, et le compteur
    # reinitialise des que N'IMPORTE QUEL item de la categorie y dropped.
    # Necessaire en plus du detail par item : les 7 cosmetiques n'ont pas
    # tous les memes paliers eligibles (contrairement aux legendes/legendes
    # animales, homogenes) — un simple min() sur les items sous-estimerait
    # la secheresse "cosmetique" reelle.
    items_par_categorie = {}
    for it in items_trackables:
        if not item_eligible_intensite(it["intensite_min"], intensite):
            continue
        items_par_categorie.setdefault(it["categorie"], []).append(it)

    categories_secheresse = []
    for cat, items_cat in items_par_categorie.items():
        item_ids_cat = {it["item_id"] for it in items_cat}
        paliers_cat = {it["item_id"]: json.loads(it["paliers"]) for it in items_cat}

        drops_par_run_cat = {}
        for iid in item_ids_cat:
            for d in drops_par_item.get(iid, []):
                drops_par_run_cat[d["run_id"]] = drops_par_run_cat.get(d["run_id"], 0) + d["quantite"]

        courant_tirages_cat = 0
        courant_songes_cat = 0
        for r in runs_enrichies:
            t_cat = sum(tirages_eligibles(paliers_cat[iid], r["salle_atteinte"], r["nb_scope"]) for iid in item_ids_cat)
            if t_cat == 0:
                continue
            courant_tirages_cat += t_cat
            courant_songes_cat += 1
            if r["id"] in drops_par_run_cat:
                courant_tirages_cat = 0
                courant_songes_cat = 0

        categories_secheresse.append({
            "categorie": cat, "songes_depuis_dernier_drop": courant_songes_cat,
        })

    conn.close()
    return {
        "intensite": intensite, "niveau": niveau,
        "scope": {"type": scope_type, "perso_ids": sorted(scope_set)},
        "items": resultats,
        "moyennes_par_categorie": moyennes_par_categorie,
        "categories_secheresse": categories_secheresse,
    }

@app.get("/songes/estimation")
def songes_estimation(item_id: Optional[int] = None, categorie: Optional[str] = None,
                       intensite: str = "", niveau: int = 0, nb_participants: int = 1):
    """Public, aucune donnee joueur : calcul pur depuis songe_taux + config.
    Fournir item_id (un item precis) OU categorie (n'importe quel item de la
    categorie — ex. 'legende' agrege les 26, pour la reference "n'importe
    laquelle" du compteur principal, SONGES.md refonte interface point 1),
    jamais les deux. Doit repondre explicitement "donnees non disponibles"
    (disponible=False) si la combinaison intensite x palier est inconnue
    pour au moins un item concerne — jamais d'extrapolation (regle 4 §5)."""
    if (item_id is None) == (categorie is None):
        raise HTTPException(status_code=400, detail="Fournir item_id OU categorie (un seul des deux)")
    if intensite not in songes_config.INTENSITES:
        raise HTTPException(status_code=400, detail=f"Intensite inconnue : {intensite}")
    if niveau not in songes_config.INTENSITES[intensite]["niveaux"]:
        raise HTTPException(status_code=400, detail=f"Niveau {niveau} invalide pour {intensite}")
    if nb_participants < 1:
        raise HTTPException(status_code=400, detail="nb_participants doit etre >= 1")

    conn = get_db()
    cur = conn.cursor()

    if item_id is not None:
        cur.execute("SELECT categorie, cle_taux, paliers, intensite_min FROM songe_items_trackables WHERE item_id = ?", (item_id,))
        item = cur.fetchone()
        if not item:
            conn.close()
            raise HTTPException(status_code=404, detail="Item non trackable")
        items = [item]
        reponse_base = {"item_id": item_id, "categorie": None, "intensite": intensite, "niveau": niveau, "nb_participants": nb_participants}
    else:
        cur.execute("SELECT categorie, cle_taux, paliers, intensite_min FROM songe_items_trackables WHERE categorie = ?", (categorie,))
        items = cur.fetchall()
        if not items:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Categorie inconnue ou sans item trackable : {categorie}")
        reponse_base = {"item_id": None, "categorie": categorie, "intensite": intensite, "niveau": niveau, "nb_participants": nb_participants}

    items_eligibles = [it for it in items if item_eligible_intensite(it["intensite_min"], intensite)]
    if not items_eligibles:
        conn.close()
        return {**reponse_base, "disponible": False, "esperance_runs": None,
                "message": f"Aucun item de cette sélection n'est éligible en intensité {intensite}."}

    items_taux = [(json.loads(it["paliers"]), charger_taux(conn, intensite, niveau, it["cle_taux"])) for it in items_eligibles]
    conn.close()

    esperance = estimer_esperance_runs(items_taux, nb_participants)
    if esperance is None:
        return {**reponse_base, "disponible": False, "esperance_runs": None,
                "message": "Données non disponibles pour cette combinaison intensité × palier."}
    return {**reponse_base, "disponible": True, "esperance_runs": round(esperance, 1), "message": None}

@app.get("/admin/backup")
def sauvegarde_admin(x_admin_token: str = Header(default="", alias="X-Admin-Token")):
    """Sauvegarde manuelle de la base (regle 10 CLAUDE.md). Protegee par
    ADMIN_TOKEN : si la variable n'est pas definie sur ce deploiement,
    l'endpoint reste desactive quel que soit le token fourni — jamais de
    comparaison qui pourrait accidentellement matcher un token vide.
    Token passe en en-tete (X-Admin-Token) plutot qu'en parametre d'URL :
    un query param finit facilement dans les logs d'acces serveur/proxy et
    l'historique du navigateur, un en-tete non."""
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Sauvegarde desactivee : ADMIN_TOKEN non configure sur ce deploiement.")
    # Comparaison a temps constant (hmac.compare_digest) : une comparaison
    # '!=' normale sort plus vite des le premier caractere different, ce qui
    # fuit en theorie la longueur du prefixe correct via le temps de reponse.
    if not hmac.compare_digest(x_admin_token, ADMIN_TOKEN):
        raise HTTPException(status_code=403, detail="Token invalide.")
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=404, detail="Base de donnees introuvable.")

    nom_fichier = f"dofura-backup-{datetime.now().strftime('%Y-%m-%d')}.db"
    # Repertoire prive par appel (mkdtemp = 0700 sur POSIX, non liste/traversable
    # par un autre utilisateur du serveur) plutot qu'un fichier directement dans
    # le dossier temp partage : la sauvegarde contient les hash de mots de passe.
    dossier_backup = tempfile.mkdtemp(prefix="dofura-backup-")
    chemin_backup = os.path.join(dossier_backup, nom_fichier)

    # API de sauvegarde sqlite3 (conn.backup()) plutot qu'une copie de
    # fichier brute : produit une copie coherente meme si la base source
    # est en cours d'ecriture au moment de l'appel.
    source = sqlite3.connect(DB_PATH)
    destination = sqlite3.connect(chemin_backup)
    with destination:
        source.backup(destination)
    source.close()
    destination.close()
    os.chmod(chemin_backup, 0o600)

    return FileResponse(
        chemin_backup,
        filename=nom_fichier,
        media_type="application/octet-stream",
        background=BackgroundTask(shutil.rmtree, dossier_backup, ignore_errors=True),
    )

# ============================================================
# /admin/refresh-encyclopedie (3 aout 2026, diagnostic prod : 500 sur
# /songes/taux, "no such table: songe_items_trackables")
# ============================================================
# Cause : base_deja_peuplee() (haut de ce fichier) ne relance init_db.py
# QUE si 'monstres' est vide — sur un deploiement deja en place, toute
# table AJOUTEE au schema d'init_db.py APRES la toute premiere mise en
# ligne n'a donc jamais ete creee, meme aux redeploiements suivants (le
# schema evolue, le volume Railway persistant non). Diagnostic du meme
# jour, sur une copie de la base de prod ouverte en lecture seule : 10
# tables dans ce cas exact — 3 encyclopediques du Suivi de Songes
# (songe_items_trackables, songe_taux, songe_boss_modifs) + les 7 tables
# de progression joueur du meme chantier (jamais creees, donc jamais
# utilisees : aucune donnee joueur a preserver dessus AUJOURD'HUI, mais
# ce sera faux des le premier joueur qui utilise le tracker — l'endpoint
# est ecrit comme si elles contenaient deja de vraies donnees).
#
# Registre volontairement LIMITE a ces 10 tables (pas un mecanisme
# generique pour "toute table future manquante") : si le schema
# d'init_db.py gagne encore une table plus tard et qu'elle subit le meme
# sort, TABLES_ENDPOINT_CREATE devra etre mis a jour a la main. Prefere a
# une solution generique qui aurait du importer/deriver dynamiquement le
# schema d'init_db.py — risque ecarte plus bas.
#
# Copies (pas import) des whitelists d'init_db.py : importer init_db.py
# executerait tout son code de haut niveau (chargement JSON + connexion a
# DB_PATH + DROP/CREATE/INSERT) des l'import, ce qui ecraserait la vraie
# base au demarrage de main.py — inacceptable. Ces deux sets sont donc
# des copies independantes, a tenir synchronisees a la main avec
# TABLES_ENCYCLOPEDIE / TABLES_UTILISATEUR_INTERDITES d'init_db.py.
TABLES_ENCYCLOPEDIQUES_REFRESH = {
    "monstres", "grades", "drops", "sorts", "zones", "objets", "objets_effets",
    "recettes", "panoplies", "panoplies_effets", "donjons", "donjons_monstres",
    "donjons_objets_requis", "zones_areas", "quetes", "quetes_etapes",
    "quetes_etapes_items", "quetes_etapes_actions", "quetes_ressources",
    "quetes_prerequis_quetes", "quetes_prerequis_objets", "quetes_donjons",
    "succes", "succes_objectifs", "succes_recompenses_items", "succes_donjons",
    "songe_items_trackables", "songe_taux", "songe_boss_modifs",
}
TABLES_INTERDITES_REFRESH = {
    "users", "progression_joueur", "favoris",
    "songe_personnages", "songe_teams", "songe_team_membres",
    "songe_runs", "songe_run_participants", "songe_drops", "songe_journal",
    "songe_bribes_depenses",
}

# SQL de creation des 10 tables manquantes identifiees le 3 aout 2026,
# copie verbatim depuis le schema actuel d'init_db.py (IF NOT EXISTS ajoute
# partout ici : contrairement a init_db.py, cet endpoint ne DROP jamais,
# donc chaque CREATE doit etre idempotent par lui-meme). songe_runs recoit
# directement duree_secondes/vague_finale/nombre_tours dans le CREATE
# (dans init_db.py ces 3 colonnes arrivent par une migration ALTER TABLE
# a part, parce que cette table PEUT deja exister sans elles en prod — ici
# la table est neuve a 100% si on la cree, donc le schema final complet
# directement, pas de migration a rejouer).
TABLES_ENDPOINT_CREATE = {
    "songe_items_trackables": """
        CREATE TABLE IF NOT EXISTS songe_items_trackables (
            item_id       INTEGER PRIMARY KEY,
            categorie     TEXT NOT NULL,
            cle_taux      TEXT NOT NULL,
            paliers       TEXT NOT NULL,
            intensite_min TEXT
        )
    """,
    "songe_taux": """
        CREATE TABLE IF NOT EXISTS songe_taux (
            intensite     TEXT NOT NULL,
            niveau        INTEGER NOT NULL,
            palier        INTEGER NOT NULL,
            cle_taux      TEXT NOT NULL,
            taux          REAL NOT NULL,
            PRIMARY KEY (intensite, niveau, palier, cle_taux)
        )
    """,
    "songe_boss_modifs": """
        CREATE TABLE IF NOT EXISTS songe_boss_modifs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            monstre_id INTEGER NOT NULL,
            titre      TEXT NOT NULL,
            ligne      TEXT NOT NULL,
            ordre      INTEGER NOT NULL
        )
    """,
    "songe_personnages": """
        CREATE TABLE IF NOT EXISTS songe_personnages (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER,
            nom           TEXT NOT NULL,
            classe        TEXT,
            serveur       TEXT,
            cree_le       TEXT DEFAULT (datetime('now'))
        )
    """,
    "songe_teams": """
        CREATE TABLE IF NOT EXISTS songe_teams (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER,
            nom           TEXT NOT NULL,
            cree_le       TEXT DEFAULT (datetime('now'))
        )
    """,
    "songe_team_membres": """
        CREATE TABLE IF NOT EXISTS songe_team_membres (
            team_id       INTEGER NOT NULL REFERENCES songe_teams(id) ON DELETE CASCADE,
            perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id) ON DELETE CASCADE,
            PRIMARY KEY (team_id, perso_id)
        )
    """,
    "songe_runs": """
        CREATE TABLE IF NOT EXISTS songe_runs (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id            INTEGER,
            date_run           TEXT DEFAULT (datetime('now')),
            intensite          TEXT NOT NULL,
            niveau             INTEGER NOT NULL,
            terminee           INTEGER NOT NULL DEFAULT 1,
            salle_atteinte     INTEGER NOT NULL DEFAULT 26,
            nb_combats         INTEGER NOT NULL,
            source_nb_combats  TEXT NOT NULL,
            team_id            INTEGER,
            note               TEXT,
            duree_secondes     INTEGER,
            vague_finale       INTEGER,
            nombre_tours       INTEGER
        )
    """,
    "songe_run_participants": """
        CREATE TABLE IF NOT EXISTS songe_run_participants (
            run_id        INTEGER NOT NULL REFERENCES songe_runs(id) ON DELETE CASCADE,
            perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id),
            PRIMARY KEY (run_id, perso_id)
        )
    """,
    "songe_drops": """
        CREATE TABLE IF NOT EXISTS songe_drops (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id        INTEGER NOT NULL REFERENCES songe_runs(id) ON DELETE CASCADE,
            perso_id      INTEGER NOT NULL REFERENCES songe_personnages(id),
            item_id       INTEGER NOT NULL,
            quantite      INTEGER NOT NULL DEFAULT 1,
            palier        INTEGER,
            cree_le       TEXT DEFAULT (datetime('now'))
        )
    """,
    "songe_journal": """
        CREATE TABLE IF NOT EXISTS songe_journal (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL,
            item_id       INTEGER NOT NULL,
            palier        INTEGER,
            date_drop     TEXT
        )
    """,
    "songe_bribes_depenses": """
        CREATE TABLE IF NOT EXISTS songe_bribes_depenses (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            perso_id  INTEGER NOT NULL REFERENCES songe_personnages(id),
            montant   INTEGER NOT NULL,
            date      TEXT DEFAULT (datetime('now')),
            note      TEXT
        )
    """,
}

# (?<!ON ) exclut "ON DELETE CASCADE"/"ON UPDATE ..." (clauses FK standard,
# legitimes dans un CREATE TABLE, pas des verbes destructeurs) sans exclure
# un vrai DELETE/UPDATE en debut de statement — bug trouve en testant (3
# aout 2026) : la 1ere version de cette regex refusait a tort le CREATE de
# songe_team_membres/songe_run_participants/songe_drops, qui portent tous
# "REFERENCES ... ON DELETE CASCADE".
_VERBE_DESTRUCTEUR_REFRESH = re.compile(r"\bDROP\b|(?<!ON )\bDELETE\b|(?<!ON )\bUPDATE\b", re.IGNORECASE)

def _verifier_sql_sans_verbe_destructeur_refresh(sql):
    """Garde statique en plus de la garde par operation ci-dessous : meme si
    TABLES_ENDPOINT_CREATE etait un jour modifie par erreur, aucun SQL
    contenant DROP/DELETE/UPDATE ne peut etre execute par cet endpoint."""
    trouve = _VERBE_DESTRUCTEUR_REFRESH.search(sql)
    if trouve:
        raise RuntimeError(
            f"SQL refuse : verbe destructeur '{trouve.group()}' detecte — "
            f"/admin/refresh-encyclopedie est limite a CREATE/INSERT."
        )

def _autoriser_operation_refresh(table, operation):
    """Garde explicite (tache 5, 3 aout 2026) : verifiee AVANT chaque
    ecriture, jamais apres coup. Porte sur l'OPERATION, pas seulement sur
    le nom de la table : create et fill n'ont pas la meme portee (creer une
    table vide ne detruit rien ; la remplir depuis les JSON n'a de sens que
    pour les tables encyclopediques, et est un danger direct sur toute
    table de progression joueur, qui doit rester create-only pour
    toujours)."""
    if operation == "create":
        if table in TABLES_ENCYCLOPEDIQUES_REFRESH or table in TABLES_INTERDITES_REFRESH:
            return
        raise RuntimeError(f"CREATE refuse : {table!r} hors des tables connues de cet endpoint.")
    if operation == "fill":
        if table in TABLES_INTERDITES_REFRESH:
            raise RuntimeError(
                f"REMPLISSAGE REFUSE : {table!r} est une table de progression joueur protegee — "
                f"jamais de reimport JSON dessus, meme si elle vient d'etre creee vide."
            )
        if table not in TABLES_ENCYCLOPEDIQUES_REFRESH:
            raise RuntimeError(f"REMPLISSAGE REFUSE : {table!r} hors whitelist encyclopedique.")
        return
    raise RuntimeError(f"Operation inconnue : {operation!r}")

def _remplir_songe_items_trackables_refresh(cur):
    with open("dofura_songes_items.json", "r", encoding="utf-8") as f:
        songes_items = json.load(f)
    for it in songes_items:
        cur.execute("""
            INSERT OR REPLACE INTO songe_items_trackables (item_id, categorie, cle_taux, paliers, intensite_min)
            VALUES (?, ?, ?, ?, ?)
        """, (it.get("item_id"), it.get("categorie"), it.get("cle_taux"),
              json.dumps(it.get("paliers")), it.get("intensite_min")))

def _remplir_songe_taux_refresh(cur):
    with open("dofura_songes_taux.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    for t in migrer_taux_songes(data):
        cur.execute("""
            INSERT OR REPLACE INTO songe_taux (intensite, niveau, palier, cle_taux, taux)
            VALUES (?, ?, ?, ?, ?)
        """, (t.get("intensite"), t.get("niveau"), t.get("palier"), t.get("cle_taux"), t.get("taux")))

def _remplir_songe_boss_modifs_refresh(cur):
    with open("dofura_songes_boss_modifs.json", "r", encoding="utf-8") as f:
        songes_boss_modifs = json.load(f)
    for cle, entree in songes_boss_modifs.items():
        titre = entree.get("titre")
        lignes = entree.get("modifs", [])
        if entree.get("zone"):
            cur.execute("""
                SELECT DISTINCT m.id FROM monstres m
                JOIN zones z ON z.monstre_id = m.id
                JOIN zones_areas za ON za.nom = z.nom
                WHERE za.area = ?
            """, (cle,))
            monstre_ids = [r[0] for r in cur.fetchall()]
        else:
            cur.execute("SELECT id FROM monstres WHERE nom = ?", (cle,))
            row = cur.fetchone()
            monstre_ids = [row[0]] if row else []
        if not monstre_ids:
            print(f"[ADMIN] refresh-encyclopedie : cle sans correspondance dans dofura_songes_boss_modifs.json ignoree : {cle!r}")
            continue
        for monstre_id in monstre_ids:
            for ordre, ligne in enumerate(lignes):
                cur.execute("""
                    INSERT INTO songe_boss_modifs (monstre_id, titre, ligne, ordre)
                    VALUES (?, ?, ?, ?)
                """, (monstre_id, titre, ligne, ordre))

FILL_FUNCTIONS_REFRESH = {
    "songe_items_trackables": _remplir_songe_items_trackables_refresh,
    "songe_taux": _remplir_songe_taux_refresh,
    "songe_boss_modifs": _remplir_songe_boss_modifs_refresh,
}

def _compter_lignes_refresh(cur, table):
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    return cur.fetchone()[0]

def _sauvegarder_avant_ecriture_refresh(chemin_db):
    """Backup via l'API sqlite3 conn.backup() (coherente meme si la base
    source est en cours d'ecriture, meme principe que /admin/backup) —
    PAS une simple copie de fichier. Si quoi que ce soit echoue, ou si le
    fichier produit est absent/vide, leve RuntimeError : l'appelant doit
    alors annuler l'operation entiere sans ecrire quoi que ce soit."""
    horodatage = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    chemin_backup = f"{chemin_db}.avant-refresh-{horodatage}.db"
    try:
        source = sqlite3.connect(chemin_db)
        destination = sqlite3.connect(chemin_backup)
        with destination:
            source.backup(destination)
        source.close()
        destination.close()
    except Exception as e:
        raise RuntimeError(f"Echec de la sauvegarde automatique : {e}")
    if not os.path.exists(chemin_backup) or os.path.getsize(chemin_backup) == 0:
        raise RuntimeError("La sauvegarde automatique a produit un fichier absent ou vide.")
    return chemin_backup

@app.post("/admin/refresh-encyclopedie")
def refresh_encyclopedie(x_admin_token: str = Header(default="", alias="X-Admin-Token")):
    """Cree (CREATE TABLE IF NOT EXISTS) puis remplit les tables
    encyclopediques manquantes en prod — voir le commentaire au-dessus de
    TABLES_ENCYCLOPEDIQUES_REFRESH pour le diagnostic complet (3 aout 2026).

    - CREATE TABLE IF NOT EXISTS : autorise sur les 11 tables du registre,
      encyclopediques ET progression joueur (creer une table absente ne
      detruit rien).
    - Remplissage depuis les JSON sources : UNIQUEMENT sur les 3 tables
      encyclopediques (songe_items_trackables, songe_taux,
      songe_boss_modifs), a CHAQUE appel (INSERT OR REPLACE, idempotent
      par item_id/palier — rejouer le remplissage ne duplique jamais rien,
      "refresh" au sens propre : normalise vers l'etat courant des JSON).
    - Les 8 tables de progression joueur ne sont JAMAIS remplies par cet
      endpoint, qu'elles viennent d'etre creees ou qu'elles existent deja
      avec de vraies donnees — seule leur CREATE IF NOT EXISTS peut se
      produire, jamais un INSERT dessus.
    - Aucun DROP/DELETE/UPDATE nulle part : verifie par la garde par
      operation (_autoriser_operation_refresh) ET par une verification
      statique du texte SQL avant chaque execution.
    - Transaction unique : soit toutes les tables du registre sont
      traitees avec succes et commit une seule fois a la fin, soit la
      moindre erreur declenche un rollback complet (CREATE TABLE est
      transactionnel sous SQLite, contrairement a d'autres SGBD)."""
    if not ADMIN_TOKEN or not hmac.compare_digest(x_admin_token, ADMIN_TOKEN):
        raise HTTPException(status_code=401)

    print("[ADMIN] POST /admin/refresh-encyclopedie : debut.")

    # Validation COMPLETE de tout le registre AVANT le backup et avant la
    # moindre connexion en ecriture (3 aout 2026, trouve en testant : un bug
    # dans la garde elle-meme, sur UNE table en fin de registre, avait quand
    # meme laisse une ecriture partielle se produire sur les tables
    # precedentes avant de planter — CREATE TABLE se comporte de façon
    # surprenante vis-a-vis de conn.rollback() sous sqlite3/Python, mieux
    # vaut ne rien ecrire du tout si UNE SEULE table du registre est mal
    # configuree, plutot que de compter sur un rollback fiable a 100%).
    for table, sql_create in TABLES_ENDPOINT_CREATE.items():
        _autoriser_operation_refresh(table, "create")
        _verifier_sql_sans_verbe_destructeur_refresh(sql_create)
        if table in TABLES_ENCYCLOPEDIQUES_REFRESH:
            _autoriser_operation_refresh(table, "fill")
    print(f"[ADMIN] refresh-encyclopedie : {len(TABLES_ENDPOINT_CREATE)} table(s) du registre validees (garde + SQL), aucune ecriture encore effectuee.")

    try:
        chemin_backup = _sauvegarder_avant_ecriture_refresh(DB_PATH)
    except RuntimeError as e:
        print(f"[ADMIN] refresh-encyclopedie : ANNULE avant toute ecriture — {e}")
        raise HTTPException(status_code=500, detail="Sauvegarde automatique echouee, operation annulee.")
    print(f"[ADMIN] refresh-encyclopedie : sauvegarde ok -> {chemin_backup}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    resultats = []
    try:
        for table, sql_create in TABLES_ENDPOINT_CREATE.items():
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", (table,))
            existait_deja = cur.fetchone() is not None
            lignes_avant = _compter_lignes_refresh(cur, table) if existait_deja else 0

            cur.execute(sql_create)

            if table in TABLES_ENCYCLOPEDIQUES_REFRESH:
                _autoriser_operation_refresh(table, "fill")
                FILL_FUNCTIONS_REFRESH[table](cur)
                action = "remplie"
            elif existait_deja:
                action = "deja_presente_ignoree"
            else:
                action = "creee"

            lignes_apres = _compter_lignes_refresh(cur, table)
            resultats.append({
                "table": table, "action": action,
                "lignes_avant": lignes_avant, "lignes_apres": lignes_apres,
            })
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[ADMIN] refresh-encyclopedie : ECHEC, rollback complet — {e}")
        raise HTTPException(status_code=500, detail=f"Echec pendant l'operation, rollback effectue : {e}")

    conn.commit()
    conn.close()
    print(f"[ADMIN] refresh-encyclopedie : succes. {resultats}")
    return {"backup": chemin_backup, "tables": resultats}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)