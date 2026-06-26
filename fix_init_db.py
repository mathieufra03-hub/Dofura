f = open('init_db.py', 'r', encoding='utf-8').read()
old = 'INSERT INTO sorts (monstre_id, nom)\n            VALUES (?, ?)\n        """, (m.get("id"), s.get("nom")))'
new = 'INSERT INTO sorts (monstre_id, nom, sort_id)\n            VALUES (?, ?, ?)\n        """, (m.get("id"), s.get("nom"), s.get("id")))'
f = f.replace(old, new)
open('init_db.py', 'w', encoding='utf-8').write(f)
print('sort_id dans INSERT:', 'sort_id' in f)