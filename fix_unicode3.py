path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

remplacements = [
    (r"\u00b7", "·"),
    (r"\u00ea", "ê"),
    (r"\u00e9", "é"),
    (r"\u00e8", "è"),
    (r"\u00e0", "à"),
    (r"\u00f4", "ô"),
    (r"\u00fb", "û"),
    (r"\u00fc", "ü"),
    (r"\u2013", "–"),
    (r"\u2014", "—"),
    (r"\u2192", "→"),
    (r"\u2190", "←"),
    (r"\u25c6", "◆"),
    (r"\u00ef", "ï"),
    (r"\u00ee", "î"),
    (r"\u00e2", "â"),
    (r"\u00f9", "ù"),
    (r"\u00a0", " "),
    (r"\u00e4", "ä"),
    (r"\u00f6", "ö"),
]

compte = 0
for old, new in remplacements:
    n = content.count(old)
    if n > 0:
        content = content.replace(old, new)
        print(f"OK — {old} → {new} ({n} fois)")
        compte += n

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nTerminé — {compte} remplacements")