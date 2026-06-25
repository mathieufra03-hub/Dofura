import urllib.request
import json

url = "https://cdn.api.dofensive.com/dofus2/bestiary/monsters/101?lang=fr"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())

monstre = data["Data"][0]

print("=== NOM ===")
print(monstre["Name"])

print("\n=== TYPE/FAMILLE ===")
print("Race:", monstre["Race"])
print("Family:", monstre["Family"])

print("\n=== AGGRESSION ===")
print(monstre["Aggression"])

print("\n=== GRADES (stats par niveau) ===")
for g in monstre["Grades"]:
    print(g)

print("\n=== DROPS ===")
for d in monstre["Drops"]:
    print(d)

print("\n=== SORTS ===")
for s in monstre["Spells"]:
    print(s)

print("\n=== ZONES ===")
for z in monstre["Subareas"]:
    print(z)