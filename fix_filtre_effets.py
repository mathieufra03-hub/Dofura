path = r'frontend\src\App.jsx'
with open(path, encoding='utf-8') as f:
    src = f.read()

ancien = '''            {data.effects.map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.prp2, fontSize:9, flexShrink:0 }}>◆</span> {e.texte}
              </div>
            ))}'''

nouveau = '''            {data.effects.filter(e=>e.texte).map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.prp2, fontSize:9, flexShrink:0 }}>◆</span> {e.texte}
              </div>
            ))}'''

ancien2 = '''            {data.critical_effects.map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.gold, fontSize:9, flexShrink:0 }}>◆</span> {e.texte}
              </div>
            ))}'''

nouveau2 = '''            {data.critical_effects.filter(e=>e.texte).map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.gold, fontSize:9, flexShrink:0 }}>◆</span> {e.texte}
              </div>
            ))}'''

ok = 0
if ancien in src:
    src = src.replace(ancien, nouveau)
    ok += 1
if ancien2 in src:
    src = src.replace(ancien2, nouveau2)
    ok += 1

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print(f"OK — {ok}/2 filtres appliqués")