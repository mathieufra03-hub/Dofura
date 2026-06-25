contenu = open('scraper_complet.py', 'r', encoding='utf-8').read()

ancien = """# URLs à ignorer car elles bloquent
urls_blacklist = {
    urls_blacklist = {
    "https://duffus.fr/monstre/7958",
}
}"""

nouveau = """urls_blacklist = {
    "https://duffus.fr/monstre/7958",
}"""

contenu = contenu.replace(ancien, nouveau)
open('scraper_complet.py', 'w', encoding='utf-8').write(contenu)
print("Corrigé !")