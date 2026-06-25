import urllib.request
import os

os.makedirs("frontend/public/assets/icons/stats", exist_ok=True)
os.makedirs("frontend/public/assets/icons/elements", exist_ok=True)

icones = {
    "frontend/public/assets/icons/stats/health.webp": "https://dofensive.com/asset/dofensive/hud/health.webp",
    "frontend/public/assets/icons/stats/ap.webp": "https://dofensive.com/asset/dofensive/hud/ap.webp",
    "frontend/public/assets/icons/stats/mp.webp": "https://dofensive.com/asset/dofensive/hud/mp.webp",
    "frontend/public/assets/icons/stats/tackle.webp": "https://dofensive.com/asset/dofensive/characteristics/tackle.webp",
    "frontend/public/assets/icons/stats/evasion.webp": "https://dofensive.com/asset/dofensive/characteristics/evasion.webp",
    "frontend/public/assets/icons/stats/dodge_ap.webp": "https://dofensive.com/asset/dofensive/characteristics/dodge_ap.webp",
    "frontend/public/assets/icons/stats/dodge_mp.webp": "https://dofensive.com/asset/dofensive/characteristics/dodge_mp.webp",
    "frontend/public/assets/icons/stats/experience.webp": "https://dofensive.com/asset/dofensive/rewards/experience.webp",
    "frontend/public/assets/icons/elements/neutral.webp": "https://dofensive.com/asset/dofensive/characteristics/resfix_neutral.webp",
    "frontend/public/assets/icons/elements/earth.webp": "https://dofensive.com/asset/dofensive/characteristics/resfix_earth.webp",
    "frontend/public/assets/icons/elements/fire.webp": "https://dofensive.com/asset/dofensive/characteristics/resfix_fire.webp",
    "frontend/public/assets/icons/elements/water.webp": "https://dofensive.com/asset/dofensive/characteristics/resfix_water.webp",
    "frontend/public/assets/icons/elements/air.webp": "https://dofensive.com/asset/dofensive/characteristics/resfix_air.webp",
}

headers = {"User-Agent": "Mozilla/5.0"}

for chemin, url in icones.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as r:
            with open(chemin, "wb") as f:
                f.write(r.read())
        print(f"OK : {chemin}")
    except Exception as e:
        print(f"ERREUR {chemin} : {e}")

print("Terminé !")