from playwright.sync_api import sync_playwright
import json

def scraper_monstre(page, url):
    page.goto(url)
    page.wait_for_timeout(4000)
    
    nom = page.title().replace(" | Duffus.fr", "").strip()
    
    # Famille : lien avec href contenant ?race=
    famille = "Inconnue"
    lien_famille = page.query_selector('a[href*="?race="]')
    if lien_famille:
        famille = lien_famille.inner_text().strip()
    
    # Zones : spans avec style inline dans la zone hero (couleur opacity 0.4)
    zones = []
    spans_zones = page.query_selector_all('a[href^="/monstres?zone"] span, span[style*="rgba(255, 255, 255, 0.4)"]')
    for s in spans_zones:
        t = s.inner_text().strip()
        if t:
            zones.append(t)
    
    # Stats : divs avec attribut title
    stats = {}
    for titre in ["PV", "PA", "PM", "Tacle", "Fuite", "Esquive PA", "Esquive PM"]:
        el = page.query_selector(f'div[title="{titre}"] b')
        if el:
            stats[titre] = el.inner_text().strip()
    
    # XP
    el_xp = page.query_selector('div[title="Expérience gagnée"] b')
    if el_xp:
        stats["XP"] = el_xp.inner_text().strip()
    
    # Sorts : boutons avec title dans la section sorts
    sorts = []
    boutons_sorts = page.query_selector_all('button[title]')
    for b in boutons_sorts:
        img = b.query_selector('img[src*="/dofus-data/img/spell/"]')
        if img:
            t = b.get_attribute("title")
            if t:
                sorts.append(t)
    
    # Drops : liens /objet/ avec img alt
    drops = []
    liens_drops = page.query_selector_all('a[href^="/objet/"]')
    for lien in liens_drops:
        img = lien.query_selector("img[alt]")
        if img:
            nom_item = img.get_attribute("alt").strip()
            # Taux : div avec le pourcentage
            div_taux = lien.query_selector("div[style*='position: absolute']")
            taux = div_taux.inner_text().strip() if div_taux else "?"
            if nom_item:
                drops.append({"item": nom_item, "taux": taux})
    
    return {
        "nom": nom,
        "url": url,
        "famille": famille,
        "zones": zones,
        "stats": stats,
        "sorts": sorts,
        "drops": drops,
        "source": "duffus.fr"
    }

urls_test = [
    "https://duffus.fr/monstre/31",
    "https://duffus.fr/monstre/34",
    "https://duffus.fr/monstre/36",
]

with sync_playwright() as p:
    navigateur = p.chromium.launch(headless=True)
    page = navigateur.new_page()
    
    monstres = []
    for url in urls_test:
        print(f"Scraping : {url}")
        monstre = scraper_monstre(page, url)
        print(f"  → {monstre['nom']} | Famille: {monstre['famille']} | Sorts: {len(monstre['sorts'])} | Drops: {len(monstre['drops'])}")
        monstres.append(monstre)
    
    navigateur.close()

with open("monstres_test.json", "w", encoding="utf-8") as f:
    json.dump(monstres, f, ensure_ascii=False, indent=2)

print(f"\nTerminé — {len(monstres)} monstres sauvegardés dans monstres_test.json")