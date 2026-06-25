from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    navigateur = p.chromium.launch(headless=True)
    page = navigateur.new_page()
    
    page.goto("https://dofensive.com/fr/monster/7987")
    page.wait_for_timeout(5000)
    
    html = page.content()
    with open("page_dofensive.html", "w", encoding="utf-8") as f:
        f.write(html)
    
    print("HTML sauvegardé dans page_dofensive.html")
    navigateur.close()