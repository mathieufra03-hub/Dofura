with open(r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx", "r", encoding="utf-8") as f:
    contenu = f.read()

contenu = contenu.replace(
    'width: 100, height: 100, background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 10',
    'width: 100, height: 100, background: "#f0ebe0", border: `0.5px solid ${C.border}`, borderRadius: 10'
)

with open(r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx", "w", encoding="utf-8") as f:
    f.write(contenu)

print("Corrigé !")