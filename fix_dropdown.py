with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    contenu = f.read()

# Fix zIndex du hero pour qu'il passe devant tout
ancien = """    position: "relative",
      overflow: "hidden",
    }}>"""

nouveau = """    position: "relative",
      overflow: "visible",
      zIndex: 10,
    }}>"""

contenu = contenu.replace(ancien, nouveau)

# Fix zIndex du dropdown
ancien2 = """            zIndex: 50,"""
nouveau2 = """            zIndex: 200,"""

contenu = contenu.replace(ancien2, nouveau2)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(contenu)

print("OK - dropdown fixe")