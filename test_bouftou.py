from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    nav = p.chromium.launch(headless=True)
    page = nav.new_page()
    page.goto("https://dofensive.com/fr/monster/101")
    page.wait_for_timeout(6000)
    html = page.content()
    open("bouftou.html", "w", encoding="utf-8").write(html)
    print("Sauvegarde OK")
    nav.close()