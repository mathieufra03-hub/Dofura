import urllib.request
import json

url = "https://api.dofusdb.fr/effects/99?lang=fr"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())

print(json.dumps(data, indent=2, ensure_ascii=False))