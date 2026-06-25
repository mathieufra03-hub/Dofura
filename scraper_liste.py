from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    navigateur = p.chromium.launch(headless=True)
    page = navigateur.new_page()
    
    urls = set()
    numero_page = 1
    
    while True:
        url_page = f"https://duffus.fr/monstres?page={numero_page}"
        print(f"Page {numero_page} : {url_page}")
        
        page.goto(url_page)
        page.wait_for_timeout(3000)
        
        # Récupère les liens monstres
        liens = page.query_selector_all('a[href^="/monstre/"]')
        avant = len(urls)
        
        for lien in liens:
            href = lien.get_attribute("href")
            if href and href.startswith("/monstre/"):
                urls.add("https://duffus.fr" + href)
        
        apres = len(urls)
        nouveaux = apres - avant
        print(f"  → {nouveaux} nouveaux | Total: {apres}")
        
        # Si aucun nouveau monstre, on a fini
        if nouveaux == 0:
            print("Plus de monstres, fin du scraping.")
            break
        
        numero_page += 1
    
    navigateur.close()

urls_liste = sorted(list(urls))
with open("monstres_urls.json", "w", encoding="utf-8") as f:
    json.dump(urls_liste, f, ensure_ascii=False, indent=2)

print(f"\nTerminé — {len(urls_liste)} URLs sauvegardées dans monstres_urls.json")