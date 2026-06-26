import re

path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remplace juste les chemins un par un
remplacements = [
    ("/assets/icons/stats/pv.webp",       "/assets/icons/stats/health.webp"),
    ("/assets/icons/stats/pa.webp",       "/assets/icons/stats/ap.webp"),
    ("/assets/icons/stats/pm.webp",       "/assets/icons/stats/mp.webp"),
    ("/assets/icons/stats/xp.webp",       "/assets/icons/stats/experience.webp"),
    ("/assets/icons/stats/tacle.webp",    "/assets/icons/stats/tackle.webp"),
    ("/assets/icons/stats/fuite.webp",    "/assets/icons/stats/evasion.webp"),
    ("/assets/icons/stats/esquive_pa.webp","/assets/icons/stats/dodge_ap.webp"),
    ("/assets/icons/stats/esquive_pm.webp","/assets/icons/stats/dodge_mp.webp"),
    ("/assets/icons/elements/neutre.webp", "/assets/icons/elements/neutral.webp"),
    ("/assets/icons/elements/terre.webp",  "/assets/icons/elements/earth.webp"),
    ("/assets/icons/elements/feu.webp",    "/assets/icons/elements/fire.webp"),
    ("/assets/icons/elements/eau.webp",    "/assets/icons/elements/water.webp"),
]

for old, new in remplacements:
    if old in content:
        content = content.replace(old, new)
        print(f"OK — {old} -> {new}")
    else:
        print(f"PAS TROUVE — {old}")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Terminé")