from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    nav = p.chromium.launch(headless=False)
    page = nav.new_page()
    print("Chargement...")
    page.goto("https://dofensive.com/fr/monsters")
    page.wait_for_timeout(8000)
    liens = page.query_selector_all("a[href]")
    urls = set()
    for l in liens:
        href = l.get_attribute("href") or ""
        if "/fr/monster/" in href and "/fr/monsters" not in href:
            if href.startswith("http"):
                urls.add(href.split("?")[0])
            else:
                urls.add("https://dofensive.com" + href.split("?")[0])
    print(f"URLs trouvees: {len(urls)}")
    liste = sorted(list(urls))
    if liste:
        print("Exemple:", liste[0])
    json.dump(liste, open("dofensive_urls.json","w",encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Sauvegarde OK")
    input("Appuie Entree pour fermer")
    nav.close()