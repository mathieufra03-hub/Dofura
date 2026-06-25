import urllib.request
import json

# Tester l'API zones avec l'ID 30 (Tainéla du Bouftou)
url = "https://api.dofusdb.fr/subareas/30?lang=fr"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())

print("Cles:", list(data.keys()))
print("Nom:", data.get("name"))
print("Zone parente:", data.get("area"))