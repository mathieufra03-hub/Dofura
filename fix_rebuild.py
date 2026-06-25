with open(r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx", "r", encoding="utf-8") as f:
    contenu = f.read()

contenu = contenu.replace(
    'width: 90, height: 90, objectFit: "contain"',
    'width: 88, height: 88, objectFit: "contain"'
)

with open(r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx", "w", encoding="utf-8") as f:
    f.write(contenu)

print("Fait !")