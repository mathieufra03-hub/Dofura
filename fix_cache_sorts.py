path = r'frontend\src\App.jsx'
with open(path, encoding='utf-8') as f:
    src = f.read()

ancien = '''  const toggle = (s) => {
    if (openId === s.sort_id) { setOpenId(null); return }
    setOpenId(s.sort_id)
    if (sortData[s.sort_id]) return
    setLoadingId(s.sort_id)'''

nouveau = '''  const toggle = (s) => {
    if (openId === s.sort_id) { setOpenId(null); return }
    setOpenId(s.sort_id)
    setLoadingId(s.sort_id)'''

if ancien not in src:
    print("ERREUR — texte non trouvé")
else:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src.replace(ancien, nouveau))
    print("OK — cache désactivé, re-fetch à chaque clic")