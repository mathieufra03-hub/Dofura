path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

remplacements = [
    ("\u00b7", "·"),
    ("\u00ea", "ê"),
    ("\u00e9", "é"),
    ("\u00e8", "è"),
    ("\u00e0", "à"),
    ("\u00f4", "ô"),
    ("\u00fb", "û"),
    ("\u2013", "–"),
    ("\u2014", "—"),
    ("\u2192", "→"),
    ("\u2190", "←"),
    ("\u25c6", "◆"),
    ("\u00ef", "ï"),
    ("\u00ee", "î"),
    ("\u00e2", "â"),
    ("\u00f9", "ù"),
    ("\u00a0", "\u00a0"),
    ("\u00fc", "ü"),
    ("\u00e4", "ä"),
]

compte = 0
for old, new in remplacements:
    n = content.count(old)
    if n > 0:
        content = content.replace(old, new)
        print(f"OK — {repr(old)} → {new} ({n} fois)")
        compte += n

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nTerminé — {compte} remplacements")