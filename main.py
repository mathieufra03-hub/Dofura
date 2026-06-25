from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect("dofura.db")
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/monstres")
def liste_monstres(search: str = ""):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM monstres
        WHERE nom LIKE ?
        ORDER BY nom
    """, (f"%{search}%",))
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/monstres/{monstre_id}")
def detail_monstre(monstre_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM monstres WHERE id = ?", (monstre_id,))
    monstre = cur.fetchone()
    if not monstre:
        return {"erreur": "Monstre introuvable"}

    cur.execute("SELECT * FROM grades WHERE monstre_id = ? ORDER BY niveau", (monstre_id,))
    grades = cur.fetchall()

    cur.execute("SELECT * FROM drops WHERE monstre_id = ?", (monstre_id,))
    drops = cur.fetchall()

    cur.execute("SELECT * FROM sorts WHERE monstre_id = ?", (monstre_id,))
    sorts = cur.fetchall()

    cur.execute("SELECT * FROM zones WHERE monstre_id = ?", (monstre_id,))
    zones = cur.fetchall()

    conn.close()

    return {
        **dict(monstre),
        "grades": [dict(g) for g in grades],
        "drops": [dict(d) for d in drops],
        "sorts": [dict(s) for s in sorts],
        "zones": [dict(z) for z in zones],
    }