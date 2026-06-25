import urllib.request
import os

base = r"C:\Users\mathi\Documents\dofura\frontend\public\assets\icons"
os.makedirs(base + r"\stats", exist_ok=True)
os.makedirs(base + r"\elements", exist_ok=True)

icones = {
    base + r"\stats\health.webp":   "https://dofensive.com/asset/dofensive/hud/health.webp",
    base + r"\stats\ap.webp":       "https://dofensive.com/asset/dofensive/hud/ap.webp",
    base + r"\stats\mp.webp":       "https://dofensive.com/asset/dofensive/hud/mp.webp",
    base + r"\stats\tackle.webp":   "https://dofensive.com/asset/dofensive/characteristics/tackle.webp",
    base + r"\stats\evasion.webp":  "https://dofensive.com/asset/dofensive/characteristics/evasion.webp",
    base + r"\stats\dodge_ap.webp": "https://dofensive.com/asset/dofensive/characteristics/dodge_ap.webp",
    base + r"\stats\dodge_mp.webp": "https://dofensive.com/asset/dofensive/characteristics/dodge_mp.webp",
    base + r"\stats\experience.webp":"https://dofensive.com/asset/dofensive/rewards/experience.webp",
    base + r"\elements\neutral.webp":"https://dofensive.com/asset/dofensive/characteristics/resfix_neutral.webp",
    base + r"\elements\earth.webp": "https://dofensive.com/asset/dofensive/characteristics/resfix_earth.webp",
    base + r"\elements\fire.webp":  "https://dofensive.com/asset/dofensive/characteristics/resfix_fire.webp",
    base + r"\elements\water.webp": "https://dofensive.com/asset/dofensive/characteristics/resfix_water.webp",
    base + r"\elements\air.webp":   "https://dofensive.com/asset/dofensive/characteristics/resfix_air.webp",
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
        print(f"ERREUR : {e}")

print("Terminé !")