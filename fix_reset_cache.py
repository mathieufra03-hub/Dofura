path = r'frontend\src\App.jsx'
with open(path, encoding='utf-8') as f:
    src = f.read()

ancien = '''function SortsPanel({ sorts }) {
  const [openId, setOpenId] = useState(null)
  const [sortData, setSortData] = useState({})
  const [loadingId, setLoadingId] = useState(null)'''

nouveau = '''function SortsPanel({ sorts }) {
  const [openId, setOpenId] = useState(null)
  const [sortData, setSortData] = useState({})
  const [loadingId, setLoadingId] = useState(null)
  const [fetchTs, setFetchTs] = useState({})'''

ancien2 = '''    setOpenId(s.sort_id)
    setLoadingId(s.sort_id)
    fetch(`${API}/sorts/${s.sort_id}`)'''

nouveau2 = '''    setOpenId(s.sort_id)
    setLoadingId(s.sort_id)
    setSortData(prev => { const n = {...prev}; delete n[s.sort_id]; return n })
    fetch(`${API}/sorts/${s.sort_id}`)'''

ok = 0
if ancien in src:
    src = src.replace(ancien, nouveau)
    ok += 1
if ancien2 in src:
    src = src.replace(ancien2, nouveau2)
    ok += 1

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print(f"OK — {ok}/2 patches appliqués")