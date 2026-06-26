with open("frontend/index.html", "r", encoding="utf-8") as f:
    contenu = f.read()

ligne = '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@900&display=swap" rel="stylesheet">'

if "Cinzel" in contenu:
    print("Cinzel deja present, rien a faire")
else:
    contenu = contenu.replace("</head>", f"  {ligne}\n  </head>")
    with open("frontend/index.html", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("OK - Cinzel ajoute dans index.html")