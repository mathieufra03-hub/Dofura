path = r'frontend\src\App.jsx'
with open(path, encoding='utf-8') as f:
    src = f.read()

ancien = '''            {data.effects.filter(e=>e.texte).map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.prp2, fontSize:9, flexShrink:0 }}>◆</span> {e.texte}
              </div>
            ))}'''

nouveau = '''            {data.effects.map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.prp2, fontSize:9, flexShrink:0 }}>◆</span> {e.texte ?? data.nom}
              </div>
            ))}'''

if ancien not in src:
    print("ERREUR — texte non trouvé")
else:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src.replace(ancien, nouveau))
    print("OK")