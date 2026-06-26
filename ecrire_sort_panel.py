import os

path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# On remplace la section sorts dans MonstrePage
old = """      {/* sorts */}
      {data.sorts?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Sorts</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {data.sorts.map(s => (
              <span key={s.sort_id || s.nom} style={{
                background: C.prpf,
                border: `0.5px solid ${C.prpb}`,
                borderRadius:6, padding:"4px 10px",
                fontSize:12, color:C.prp2, cursor:"pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(155,77,224,0.18)"; e.currentTarget.style.borderColor=C.prp2 }}
              onMouseLeave={e => { e.currentTarget.style.background=C.prpf; e.currentTarget.style.borderColor=C.prpb }}
              >{s.nom}</span>
            ))}
          </div>
        </div>
      )}"""

new = """      {/* sorts */}
      {data.sorts?.length > 0 && (
        <SortsPanel sorts={data.sorts} />
      )}"""

content = content.replace(old, new)

# On ajoute le composant SortsPanel juste avant MonstrePage
sorts_panel = '''// ── SORTS PANEL ──────────────────────────────────────────────────────────────
function SortsPanel({ sorts }) {
  const [openId, setOpenId] = useState(null)
  const [sortData, setSortData] = useState({})
  const [loadingId, setLoadingId] = useState(null)

  const toggle = (s) => {
    if (openId === s.sort_id) { setOpenId(null); return }
    setOpenId(s.sort_id)
    if (sortData[s.sort_id]) return
    setLoadingId(s.sort_id)
    fetch(`${API}/sorts/${s.sort_id}`)
      .then(r => r.json())
      .then(d => { setSortData(prev => ({ ...prev, [s.sort_id]: d })); setLoadingId(null) })
      .catch(() => setLoadingId(null))
  }

  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
      <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Sorts</div>

      {/* chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:6 }}>
        {sorts.map(s => {
          const isOpen = openId === s.sort_id
          return (
            <span key={s.sort_id || s.nom}
              onClick={() => toggle(s)}
              style={{
                background: isOpen ? C.prpb : C.prpf,
                border: `0.5px solid ${isOpen ? C.prp2 : C.prpb}`,
                borderRadius:6, padding:"4px 10px",
                fontSize:12, color: isOpen ? "#fff" : C.prp2,
                cursor:"pointer", transition:"all .15s",
              }}
              onMouseEnter={e => { if(!isOpen){ e.currentTarget.style.background="rgba(155,77,224,0.18)"; e.currentTarget.style.borderColor=C.prp2 }}}
              onMouseLeave={e => { if(!isOpen){ e.currentTarget.style.background=C.prpf; e.currentTarget.style.borderColor=C.prpb }}}
            >{s.nom}</span>
          )
        })}
      </div>

      {/* panneau détail */}
      {openId && (
        <div style={{
          marginTop:10,
          background: C.bg3,
          border: `0.5px solid ${C.prpb}`,
          borderRadius:8,
          padding:"14px 16px",
          animation:"fadeIn .15s ease",
        }}>
          {loadingId === openId ? (
            <div style={{ fontSize:12, color:C.txt3 }}>Chargement...</div>
          ) : sortData[openId] ? (
            <SortDetail data={sortData[openId]} />
          ) : (
            <div style={{ fontSize:12, color:C.txt3 }}>Données indisponibles</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── SORT DETAIL ───────────────────────────────────────────────────────────────
function SortDetail({ data }) {
  const infos = [
    { label:"Coût",    val: data.ap_cost ? `${data.ap_cost} PA` : "—" },
    { label:"Portée",  val: data.min_range != null && data.range != null
        ? (data.min_range === data.range ? `${data.range}` : `${data.min_range} à ${data.range}`)
        : "—" },
    { label:"Critique", val: data.critical_hit_probability ? `${data.critical_hit_probability}%` : "—" },
    { label:"Ligne de vue", val: data.cast_test_los ? "Oui" : "Non" },
    { label:"Portée modifiable", val: data.range_can_be_boosted ? "Oui" : "Non" },
  ]
  if (data.max_cast_per_turn > 0)   infos.push({ label:"Lancer/tour", val: `${data.max_cast_per_turn}` })
  if (data.global_cooldown > 0)     infos.push({ label:"Cooldown",    val: `${data.global_cooldown} tours` })

  return (
    <div>
      {/* header sort */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        {data.img && (
          <img src={data.img} alt={data.nom} style={{ width:40, height:40, objectFit:"contain", background:C.bg4, borderRadius:6, padding:2 }} />
        )}
        <span style={{ fontSize:14, fontWeight:500, color:C.gold2 }}>{data.nom}</span>
      </div>

      {/* infos en ligne */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
        {infos.map(i => (
          <span key={i.label} style={{
            background:C.bg4,
            border:`0.5px solid ${C.bdr}`,
            borderRadius:6, padding:"3px 9px",
            fontSize:11, color:C.txt2,
          }}>
            <span style={{ color:C.cyan }}>{i.label}</span>{" "}{i.val}
          </span>
        ))}
      </div>

      {/* effets normaux */}
      {data.effects?.length > 0 && (
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:6 }}>Effets</div>
          {data.effects.map((e, i) => (
            <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:C.prp2, fontSize:10 }}>▸</span> {e.texte}
            </div>
          ))}
        </div>
      )}

      {/* effets critiques */}
      {data.critical_effects?.length > 0 && (
        <div>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.gold, marginBottom:6 }}>Effets critiques</div>
          {data.critical_effects.map((e, i) => (
            <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:C.gold, fontSize:10 }}>★</span> {e.texte}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'''

# Insérer avant "// ── PAGE MONSTRE"
target = "// ── PAGE MONSTRE"
content = content.replace(target, sorts_panel + target)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK — SortsPanel + SortDetail injectés dans App.jsx")