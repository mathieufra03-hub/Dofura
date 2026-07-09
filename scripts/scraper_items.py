"""
Scraper objets/equipements/recettes/panoplies (api.dofusdb.fr).
Concu pour tourner sans surveillance (nuit) : reprise sur incident,
jamais de crash sur une requete en echec, log clair, pauses polies.

Ecrit UNIQUEMENT ses propres fichiers de donnees (dofura_items.json,
dofura_recipes.json, dofura_item_sets.json, dofura_item_types.json) et
son log/etat (scripts/scraper_items_log.txt, scripts/scraper_items_progress.json).
Ne touche ni a main.py, ni a dofura.db, ni au frontend.
"""
import urllib.request
import json
import os
import time
from datetime import datetime

PAUSE = 0.3
MAX_TENTATIVES = 5

LOG_FILE = "scripts/scraper_items_log.txt"
PROGRESS_FILE = "scripts/scraper_items_progress.json"

COLLECTIONS = [
    ("item-types", "dofura_item_types.json"),
    ("item-sets", "dofura_item_sets.json"),
    ("recipes", "dofura_recipes.json"),
    ("items", "dofura_items.json"),
]


def log(msg):
    ligne = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(ligne, flush=True)
    # Ecrire le log ne doit JAMAIS faire planter le script (ex. fichier
    # verrouille momentanement par un autre programme qui le lit) : on
    # retente une fois apres une courte pause, sinon on abandonne juste
    # cette ligne de log sans interrompre le scraping.
    for tentative in (1, 2):
        try:
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(ligne + "\n")
            return
        except Exception:
            if tentative == 2:
                return
            time.sleep(0.5)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return json.loads(urllib.request.urlopen(req, timeout=15).read())


def fetch_avec_retry(url):
    delai = 0.5
    for tentative in range(1, MAX_TENTATIVES + 1):
        try:
            return fetch(url)
        except Exception as e:
            if tentative == MAX_TENTATIVES:
                log(f"  ECHEC definitif apres {MAX_TENTATIVES} tentatives sur {url} : {e}")
                return None
            log(f"  tentative {tentative}/{MAX_TENTATIVES} echouee ({e}) — nouvel essai dans {delai}s")
            time.sleep(delai)
            delai *= 2
    return None


def charger_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def sauver_progress(progress):
    # Meme filet de securite que log() : un verrou fichier transitoire ne
    # doit jamais interrompre le scraping, juste retarder la sauvegarde de
    # l'etat de reprise (le prochain passage reessaiera).
    for tentative in (1, 2):
        try:
            with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
                json.dump(progress, f, ensure_ascii=False, indent=2)
            return
        except Exception as e:
            if tentative == 2:
                log(f"  AVERTISSEMENT : progress non sauvegarde ({e})")
                return
            time.sleep(0.5)


def charger_donnees(fichier):
    if os.path.exists(fichier):
        with open(fichier, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def sauver_donnees(fichier, donnees):
    # Ecriture atomique (fichier temporaire puis remplacement) pour ne
    # jamais laisser un fichier de sortie a moitie ecrit si ca plante.
    # Meme filet de securite qu'ailleurs : un verrou transitoire ne doit
    # jamais interrompre le scraping (les donnees restent en memoire et
    # seront sauvegardees au prochain lot).
    tmp = fichier + ".tmp"
    for tentative in (1, 2):
        try:
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(donnees, f, ensure_ascii=False, indent=2)
            os.replace(tmp, fichier)
            return
        except Exception as e:
            if tentative == 2:
                log(f"  AVERTISSEMENT : sauvegarde de {fichier} echouee ({e}), on continue quand meme")
                return
            time.sleep(0.5)


def scraper_collection(nom_endpoint, fichier_sortie, progress):
    log(f"=== {nom_endpoint} -> {fichier_sortie} ===")
    donnees = charger_donnees(fichier_sortie)
    etat = progress.get(nom_endpoint, {"skip": 0, "termine": False, "erreurs": []})

    if etat.get("termine"):
        log(f"  deja termine ({len(donnees)} enregistrements) — on passe.")
        return

    if "total" not in etat:
        d = fetch_avec_retry(f"https://api.dofusdb.fr/{nom_endpoint}?lang=fr&$limit=1")
        etat["total"] = d["total"] if d else 0
        log(f"  total annonce par l'API : {etat['total']}")

    total = etat["total"]
    skip = etat["skip"]
    if skip > 0:
        log(f"  reprise a skip={skip} ({len(donnees)} deja en memoire)")

    dernier_log_page = skip // 50

    while skip < total:
        url = f"https://api.dofusdb.fr/{nom_endpoint}?lang=fr&$limit=50&$skip={skip}"
        d = fetch_avec_retry(url)
        if d is None:
            etat["erreurs"].append(skip)
            log(f"  page skip={skip} SAUTEE apres echecs repetes")
        else:
            donnees.extend(d.get("data", []))

        skip += 50
        etat["skip"] = skip
        sauver_donnees(fichier_sortie, donnees)
        progress[nom_endpoint] = etat
        sauver_progress(progress)

        page_actuelle = skip // 50
        if page_actuelle - dernier_log_page >= 20:
            log(f"  {min(skip, total)}/{total} recuperes")
            dernier_log_page = page_actuelle

        time.sleep(PAUSE)

    etat["termine"] = True
    progress[nom_endpoint] = etat
    sauver_progress(progress)
    suffixe_erreurs = f" — pages en erreur : {etat['erreurs']}" if etat["erreurs"] else ""
    log(f"  TERMINE : {len(donnees)} enregistrements, {len(etat['erreurs'])} pages en erreur{suffixe_erreurs}")


def main():
    log("=== DEBUT SCRAPING OBJETS/EQUIPEMENTS/RECETTES/PANOPLIES ===")
    progress = charger_progress()
    for nom_endpoint, fichier_sortie in COLLECTIONS:
        try:
            scraper_collection(nom_endpoint, fichier_sortie, progress)
        except Exception as e:
            log(f"ERREUR INATTENDUE sur la collection {nom_endpoint} : {e} — on passe a la suivante")

    try:
        log("=== RESUME FINAL ===")
        for nom_endpoint, fichier_sortie in COLLECTIONS:
            etat = progress.get(nom_endpoint, {})
            n = len(charger_donnees(fichier_sortie))
            log(f"  {nom_endpoint}: {n} enregistrements — termine={etat.get('termine', False)} — erreurs={len(etat.get('erreurs', []))}")
    except Exception as e:
        log(f"ERREUR sur le resume final : {e}")
    log("=== FIN DU SCRAPING ===")


if __name__ == "__main__":
    # Derniere ligne de defense : rien, absolument rien, ne doit faire
    # planter le script sans laisser de trace (exigence de la nuit sans
    # surveillance).
    try:
        main()
    except Exception as e:
        try:
            log(f"CRASH INATTENDU AU NIVEAU PRINCIPAL : {e}")
        except Exception:
            print(f"CRASH INATTENDU (log illisible) : {e}")
