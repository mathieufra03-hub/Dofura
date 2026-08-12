"""
Detoure cercle-neon-lumineux.avif : l'image n'a pas de canal alpha, son
"fond" est un quasi-noir uniforme (~17,18,20) plutot qu'un vrai transparent.
mix-blend-mode:screen en CSS laissait un carre residuel visible (le fond
n'est jamais parfaitement (0,0,0)). Corrige ici par un vrai canal alpha :
seuil sur la valeur max(r,g,b) de chaque pixel, transparence progressive
entre les deux seuils (evite un bord net).

Histogramme mesure sur la source : gros pic de fond vers 20-29, montee
progressive du halo/anneau des 2026-08-06.

Ne touche jamais au fichier source : Image.open(...).convert("RGB") cree
une image en memoire, aucun .save() n'est fait dessus.
"""
from PIL import Image

SOURCE = "frontend/public/assets/oeil/cercle-neon-lumineux.avif"
DEST = "frontend/public/assets/oeil/cercle-neon-lumineux-detoure.png"

SEUIL_BAS = 28   # sous cette valeur (max des 3 canaux) : transparent
SEUIL_HAUT = 55  # au-dessus : opaque


def alpha_pour(r, g, b):
    m = max(r, g, b)
    if m <= SEUIL_BAS:
        return 0
    if m >= SEUIL_HAUT:
        return 255
    return round((m - SEUIL_BAS) / (SEUIL_HAUT - SEUIL_BAS) * 255)


def main():
    im = Image.open(SOURCE).convert("RGB")
    w, h = im.size
    pixels = im.load()
    resultat = Image.new("RGBA", (w, h))
    rpix = resultat.load()
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            rpix[x, y] = (r, g, b, alpha_pour(r, g, b))
    resultat.save(DEST)
    print(f"Sauvegarde : {DEST} ({w}x{h})")


if __name__ == "__main__":
    main()
