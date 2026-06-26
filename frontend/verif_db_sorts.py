import sqlite3
conn = sqlite3.connect("dofura.db")
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("SELECT * FROM sorts WHERE monstre_id = 101 LIMIT 5")
for r in cur.fetchall():
    print(dict(r))
conn.close()