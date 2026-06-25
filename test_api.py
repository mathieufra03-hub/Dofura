from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    nav = p.chromium.launch(headless=False)
    page = nav.new_page()
    
    def capturer(request):
        url = request.url
        if "cdn.api" in url or "cdn.static" in url or "dofensive" in url:
            print("REQ:", url)
    
    page.on("request", capturer)
    
    page.goto("https://dofensive.com/fr/monster/101")
    page.wait_for_timeout(10000)
    
    input("Appuie Entree pour fermer")
    nav.close()