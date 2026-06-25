from playwright.sync_api import sync_playwright
import json

def scraper_monstre_dofensive(url):
    with sync_playwright() as p:
        navigateur = p.chromium.launch(headless=True)
        page = navigateur.new_page()
        page.goto(url)
        page.wait_for_timeout(5000)

        donnees = {}

        # Nom
        try:
            donnees["nom"] = page.query_selector("header h1").inner_text().strip()
        except:
            donnees["nom"] = None

        # Types/familles
        types = page.query_selector_all(".category .type ul li")
        donnees["types"] = [t.inner_text().strip() for t in types]

        # Agression
        try:
            donnees["agression"] = page.query_selector(".aggression div").inner_text().strip()
        except:
            donnees["agression"] = None

        # Stats principales
        for stat in ["health", "ap", "mp"]:
            try:
                donnees[stat] = page.query_selector(f".icon.{stat}").inner_text().strip()
            except:
                donnees[stat] = None

        # Stats secondaires
        for stat in ["strength", "intelligence", "chance", "agility", "wisdom",
                     "initiative", "tackle", "evasion", "impede-ap", "impede-mp",
                     "dodge-ap", "dodge-mp", "experience"]:
            try:
                donnees[stat] = page.query_selector(f".icon.{stat}").inner_text().strip()
            except:
                donnees[stat] = None

        # Résistances %
        for elem in ["res-per-neutral", "res-per-earth", "res-per-fire", "res-per-water", "res-per-air"]:
            try:
                donnees[elem] = page.query_selector(f".icon.{elem}").inner_text().strip()
            except:
                donnees[elem] = None

        # Sorts
        sorts = page.query_selector_all("section .content ul li button .title")
        donnees["sorts"] = [s.inner_text().strip() for s in sorts]

        navigateur.close()
        return donnees

# Test sur la Larve Bleue
url = "https://dofensive.com/fr/monster/7987"
resultat = scraper_monstre_dofensive(url)
print(json.dumps(resultat, ensure_ascii=False, indent=2))