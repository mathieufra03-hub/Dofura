import sqlite3
conn = sqlite3.connect("dofura.db")
cur = conn.cursor()
cur.execute("SELECT nom, image_url FROM monstres WHERE nom='Bouftou'")
print(cur.fetchone())
conn.close()