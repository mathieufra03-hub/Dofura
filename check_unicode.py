path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"
with open(path, encoding="utf-8") as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if "u00" in l or "u2013" in l or "u2190" in l or "u2192" in l or "u25c6" in l:
        print(f"ligne {i+1}: {l.rstrip()}")