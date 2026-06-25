from playwright.sync_api import sync_playwright
import json
import os

urls_blacklist = {
    "https://duffus.fr/monstre/7958",
}

with open("monstres_urls.json", "r", encoding="utf-8") as f:
    urls = json.load(f)

fichier_sortie = "monstres_session1.json"
if os.path.exists(fichier_sortie):
    with open(fichier_sortie, "r", encoding="utf-8") as f:
        monstres = json.load(f)
    urls_deja_faites = {m["url"] for m in monstres}
    print(f"Reprise — {len(monstres)} monstres déjà scrapés")
else:
    monstres = []
    urls_deja_faites = set()

urls_restantes = [u for u in urls if u not in urls_deja_faites and u not in urls_blacklist]
print(f"{len(urls_restantes)} monstres restants à scraper")

def scraper_monstre(page, url):
    page.goto(url, timeout=15000)
    page.wait_for_timeout(3000)
    nom = page.title().replace(" | Duffus.fr", "").strip()
    famille = "Inconnue"
    lien_famille = page.query_selector('a[href*="?race="]')
    if lien_famille:
        famille = lien_famille.inner_text().strip()
    zones = []
    for s in page.query_selector_all('span[style*="rgba(255, 255, 255, 0.4)"]'):
        t = s.inner_text().strip()
        if t:
            zones.append(t)
    stats = {}
    for titre in ["PV", "PA", "PM", "Tacle", "Fuite", "Esquive PA", "Esquive PM"]:
        el = page.query_selector(f'div[title="{titre}"] b')
        if el:
            stats[titre] = el.inner_text().strip()
    el_xp = page.query_selector('div[title="Expérience gagnée"] b')
    if el_xp:
        stats["XP"] = el_xp.inner_text().strip()
    sorts = []
    for b in page.query_selector_all('button[title]'):
        img = b.query_selector('img[src*="/dofus-data/img/spell/"]')
        if img:
            t = b.get_attribute("title")
            if t:
                sorts.append(t)
    drops = []
    for lien in page.query_selector_all('a[href^="/objet/"]'):
        img = lien.query_selector("img[alt]")
        if img:
            nom_item = img.get_attribute("alt").strip()
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

with sync_playwright() as p:
    navigateur = p.chromium.launch(headless=True)
    page = navigateur.new_page()

    for i, url in enumerate(urls_restantes):
        try:
            monstre = scraper_monstre(page, url)
            monstres.append(monstre)
            print(f"[{len(monstres)}/{len(urls)}] {monstre['nom']}")

            if len(monstres) % 50 == 0:
                with open(fichier_sortie, "w", encoding="utf-8") as f:
                    json.dump(monstres, f, ensure_ascii=False, indent=2)
                print(f"  ✓ Sauvegarde intermédiaire — {len(monstres)} monstres")

        except Exception as e:
            print(f"  ✗ Erreur sur {url} : {e}")
            try:
                navigateur.close()
            except:
                pass
            navigateur = p.chromium.launch(headless=True)
            page = navigateur.new_page()
            continue

    navigateur.close()

with open(fichier_sortie, "w", encoding="utf-8") as f:
    json.dump(monstres, f, ensure_ascii=False, indent=2)

print(f"\nTerminé — {len(monstres)} monstres sauvegardés dans {fichier_sortie}")