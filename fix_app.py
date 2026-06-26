content = open("frontend/src/App.jsx", encoding="utf-8").read()
print(content[:200])
fichier = "frontend/src/App.jsx"
contenu = open(fichier, encoding="utf-8").read()

# Fix 1 : lang="fr" sur la div racine
contenu = contenu.replace(
    '<div style={{ minHeight: "100vh", background: C.bg }}>',
    '<div lang="fr" style={{ minHeight: "100vh", background: C.bg }}>'
)

# Fix 2 : durée en tours dans effects (e.texte > 0 → e.duration > 0)
contenu = contenu.replace(
    '{e.texte > 0 && <span style={{ color: C.muted, fontSize: 11 }}>{e.texte} tour{e.texte > 1 ? "s" : ""}</span>}',
    '{e.duration > 0 && <span style={{ color: C.muted, fontSize: 11 }}>{e.duration} tour{e.duration > 1 ? "s" : ""}</span>}'
)

open(fichier, "w", encoding="utf-8").write(contenu)
print("OK")
fichier = "frontend/src/App.jsx"
contenu = open(fichier, encoding="utf-8").read()

# Fix : translate="no" sur le span des effets pour bloquer la traduction auto
contenu = contenu.replace(
    '<span>{e.texte}</span>',
    '<span translate="no">{e.texte}</span>'
)

open(fichier, "w", encoding="utf-8").write(contenu)
print("OK")