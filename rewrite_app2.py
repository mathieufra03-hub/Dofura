path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"

contenu = """import { useState, useEffect, useRef } from "react"

const API = "http://localhost:8000"

const STATS = [
  { key: "pv",         label: "PV",     icon: "/assets/icons/stats/health.webp"    },
  { key: "pa",         label: "PA",     icon: "/assets/icons/stats/ap.webp"        },
  { key: "pm",         label: "PM",     icon: "/assets/icons/stats/mp.webp"        },
  { key: "xp",         label: "XP",     icon: "/assets/icons/stats/experience.webp"},
  { key: "tacle",      label: "Tacle",  icon: "/assets/icons/stats/tackle.webp"    },
  { key: "fuite",      label: "Fuite",  icon: "/assets/icons/stats/evasion.webp"   },
  { key: "esquive_pa", label: "Esq.PA", icon: "/assets/icons/stats/dodge_ap.webp"  },
  { key: "esquive_pm", label: "Esq.PM", icon: "/assets/icons/stats/dodge_mp.webp"  },
]

const ELEM = [
  { key: "res_neutre", label: "Neutre", icon: "/assets/icons/elements/neutral.webp" },
  { key: "res_terre",  label: "Terre",  icon: "/assets/icons/elements/earth.webp"   },
  { key: "res_feu",    label: "Feu",    icon: "/assets/icons/elements/fire.webp"    },
  { key: "res_eau",    label: "Eau",    icon: "/assets/icons/elements/water.webp"   },
  { key: "res_air",    label: "Air",    icon: "/assets/icons/elements/air.webp"     },
]

const C = {
  bg:    "#06070f", bg2:   "#0a0c1a", bg3:   "#0e1225", bg4:   "#121830",
  gold:  "#f0c040", gold2: "#fad76a", goldf: "rgba(240,192,64,0.09)", goldb: "rgba(240,192,64,0.28)",
  cyan:  "#00d4ff", cyanf: "rgba(0,212,255,0.08)", cyanb: "rgba(0,212,255,0.22)",
  prp:   "#9b4de0", prp2:  "#c478ff", prpf:  "rgba(155,77,224,0.10)", prpb:  "rgba(155,77,224,0.28)",
  txt:   "#c8e4ff", txt2:  "#6888aa", txt3:  "#344a66",
  bdr:   "rgba(0,212,255,0.12)", bdr2:  "rgba(155,77,224,0.30)",
  green: "#5fbe6e", red:   "#e05555",
}

const navLinks = ["Monstres", "Qu\\u00eates", "Objets", "M\\u00e9tiers", "Zones", "Almanax"]
const quickChips = ["Bouftou", "Iop", "Dofus Turquoise", "Larves de Donjon", "Panoplie Kolosso"]

function Navbar({ onHome }) {
  return (
    <nav style={{ background:C.bg2, borderBottom:`0.5px solid ${C.bdr2}`, padding:"0 2rem", display:"flex", alignItems:"center", height:48, position:"sticky", top:0, zIndex:100 }}>
      <span onClick={onHome} style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:17, background:"linear-gradient(90deg,#f0c040,#c478ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"0.08em", marginRight:28, cursor:"pointer" }}>
        \\u00b7 DOFURA \\u00b7
      </span>
      <div style={{ display:"flex", gap:2, flex:1 }}>
        {navLinks.map(n => (
          <span key={n} onClick={n === "Monstres" ? onHome : undefined}
            style={{ fontSize:12, color:n==="Monstres"?C.cyan:C.txt2, padding:"6px 11px", borderRadius:6, cursor:"pointer", background:n==="Monstres"?C.cyanf:"transparent" }}
            onMouseEnter={e=>{e.currentTarget.style.color=C.cyan;e.currentTarget.style.background=C.cyanf}}
            onMouseLeave={e=>{e.currentTarget.style.color=n==="Monstres"?C.cyan:C.txt2;e.currentTarget.style.background=n==="Monstres"?C.cyanf:"transparent"}}
          >{n}</span>
        ))}
      </div>
      <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ background:C.bg3, border:`0.5px solid ${C.cyanb}`, borderRadius:6, padding:"5px 11px", fontSize:12, color:C.txt3 }}>Ctrl K</div>
        <div style={{ background:C.prpf, border:`0.5px solid ${C.prpb}`, borderRadius:6, padding:"5px 13px", fontSize:12, color:C.prp2, cursor:"pointer" }}>Connexion</div>
      </div>
    </nav>
  )
}

function StatsBar() {
  const items = [
    {val:"4 932",label:"monstres"},{val:"4 210",label:"qu\\u00eates"},
    {val:"18 900",label:"articles"},{val:"18",label:"classes"},
    {val:"1 430",label:"succ\\u00e8s"},{val:"18",label:"m\\u00e9tiers"},
  ]
  return (
    <div style={{ background:C.bg2, borderBottom:`0.5px solid ${C.bdr}`, padding:"7px 2rem", display:"flex", gap:28, justifyContent:"center", flexWrap:"wrap" }}>
      {items.map(i => (
        <span key={i.label} style={{ fontSize:12, color:C.txt3 }}>
          <span style={{ fontWeight:500, color:C.gold, fontSize:13 }}>{i.val}</span> {i.label}
        </span>
      ))}
    </div>
  )
}

function Hero({ query, setQuery, results, onSelect, loading }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setQuery("") }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [setQuery])

  return (
    <div style={{ background:C.bg3, borderBottom:`0.5px solid ${C.bdr}`, padding:"44px 2rem 36px", textAlign:"center", position:"relative", overflow:"visible", zIndex:10 }}>
      <div style={{ position:"absolute",width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,77,224,.22) 0%,transparent 70%)",top:-60,left:-60,pointerEvents:"none" }} />
      <div style={{ position:"absolute",width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,212,255,.15) 0%,transparent 70%)",top:-30,right:-40,pointerEvents:"none" }} />
      <div style={{ position:"absolute",width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,77,224,.12) 0%,transparent 70%)",bottom:-40,left:"40%",pointerEvents:"none" }} />
      <p style={{ fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color:C.prp2, marginBottom:12, position:"relative" }}>
        Encyclop\\u00e9die compl\\u00e8te \\u2013 Dofus 3.x
      </p>
      <h1 style={{ fontSize:26, fontWeight:500, color:C.txt, lineHeight:1.15, marginBottom:6, position:"relative" }}>
        Tout l'univers <span style={{ color:C.gold2 }}>DOFUS</span>,<br/>en un seul endroit.
      </h1>
      <p style={{ fontSize:13, color:C.txt2, marginBottom:24, lineHeight:1.7, position:"relative" }}>
        Monstres, qu\\u00eates, objets, classes, succ\\u00e8s \\u2013 fusionn\\u00e9s depuis les meilleures sources.
      </p>
      <div ref={ref} style={{ position:"relative", maxWidth:540, margin:"0 auto 16px" }}>
        <div style={{ background:"rgba(255,255,255,0.05)", border:`0.5px solid ${C.cyanb}`, borderRadius:10, padding:"11px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16, color:C.cyan }}>&#128269;</span>
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Cherche un monstre, une qu\\u00eate, un objet..."
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:C.txt, fontSize:13, caretColor:C.cyan }} />
          {loading && <span style={{ fontSize:11, color:C.txt3 }}>...</span>}
        </div>
        {results.length > 0 && (
          <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:C.bg2, border:`0.5px solid ${C.cyanb}`, borderRadius:10, overflow:"hidden", zIndex:200 }}>
            {results.map(m => (
              <div key={m.id} onClick={()=>onSelect(m.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 14px", cursor:"pointer", borderBottom:`0.5px solid ${C.bdr}` }}
                onMouseEnter={e=>e.currentTarget.style.background=C.bg3}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                {m.image_url
                  ? <img src={m.image_url} alt={m.nom} style={{ width:36, height:36, objectFit:"contain", borderRadius:6, background:C.bg4 }} />
                  : <div style={{ width:36, height:36, background:C.bg4, borderRadius:6 }} />
                }
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:C.txt }}>{m.nom}</div>
                  <div style={{ fontSize:11, color:C.txt3 }}>{m.famille || m.race || ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display:"flex", justifyContent:"center", gap:7, flexWrap:"wrap", position:"relative" }}>
        {quickChips.map(c => (
          <span key={c} onClick={()=>setQuery(c)}
            style={{ background:C.prpf, border:`0.5px solid ${C.prpb}`, borderRadius:16, padding:"4px 12px", fontSize:11, color:C.prp2, cursor:"pointer" }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(155,77,224,0.18)";e.currentTarget.style.borderColor=C.prp2}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.prpf;e.currentTarget.style.borderColor=C.prpb}}
          >{c}</span>
        ))}
      </div>
    </div>
  )
}

function AlmanaxBanner({ data }) {
  if (!data) return null
  return (
    <div style={{ background:C.bg4, borderTop:`0.5px solid ${C.bdr2}`, borderBottom:`0.5px solid ${C.bdr2}`, padding:"11px 2rem", display:"flex", alignItems:"center", gap:13 }}>
      <div style={{ width:36,height:36,background:C.goldf,border:`0.5px solid ${C.goldb}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>&#128197;</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:C.txt3, marginBottom:3 }}>Almanax du jour</div>
        <div style={{ fontSize:13, fontWeight:500, color:C.txt, marginBottom:2 }}>{data.offering?.item?.name?.fr || "Offrande du jour"}</div>
        <div style={{ fontSize:11, color:C.txt2 }}>{data.bonus?.description?.fr || "Bonus actif aujourd'hui"}</div>
      </div>
      <div style={{ background:C.goldf, border:`0.5px solid ${C.goldb}`, borderRadius:7, padding:"6px 13px", fontSize:12, color:C.gold, cursor:"pointer", whiteSpace:"nowrap" }}>Voir l'Almanax \\u2192</div>
    </div>
  )
}

function EncycloGrid({ onMonsters }) {
  const items = [
    { label:"Monstres",  count:"4 932",  action:onMonsters },
    { label:"Qu\\u00eates",    count:"4 210",  action:null },
    { label:"Objets",    count:"18 900", action:null },
    { label:"M\\u00e9tiers",   count:"18",     action:null },
    { label:"Zones",     count:"800+",   action:null },
    { label:"Donjons",   count:"120+",   action:null },
  ]
  return (
    <div style={{ padding:"18px 2rem 0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:500, color:C.txt }}>Encyclop\\u00e9die</span>
        <span style={{ fontSize:11, color:C.txt3 }}>Tout voir \\u2192</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:18 }}>
        {items.map(it => (
          <div key={it.label} onClick={it.action||undefined}
            style={{ background:C.bg3, border:`0.5px solid ${C.bdr}`, borderRadius:8, padding:"14px 6px", textAlign:"center", cursor:it.action?"pointer":"default" }}
            onMouseEnter={e=>{if(it.action){e.currentTarget.style.borderColor=C.cyan;e.currentTarget.style.background=C.cyanf}}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.bdr;e.currentTarget.style.background=C.bg3}}
          >
            <div style={{ fontSize:11, color:C.txt, fontWeight:500, marginBottom:4 }}>{it.label}</div>
            <div style={{ fontSize:10, color:C.txt3 }}>{it.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
      .then(r=>r.json())
      .then(d=>{ setSortData(prev=>({...prev,[s.sort_id]:d})); setLoadingId(null) })
      .catch(()=>setLoadingId(null))
  }

  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
      <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Sorts</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:6 }}>
        {sorts.map(s => {
          const isOpen = openId === s.sort_id
          return (
            <span key={s.sort_id||s.nom} onClick={()=>toggle(s)}
              style={{ background:isOpen?C.prpb:C.prpf, border:`0.5px solid ${isOpen?C.prp2:C.prpb}`, borderRadius:6, padding:"4px 10px", fontSize:12, color:isOpen?"#fff":C.prp2, cursor:"pointer", transition:"all .15s" }}
              onMouseEnter={e=>{if(!isOpen){e.currentTarget.style.background="rgba(155,77,224,0.18)";e.currentTarget.style.borderColor=C.prp2}}}
              onMouseLeave={e=>{if(!isOpen){e.currentTarget.style.background=C.prpf;e.currentTarget.style.borderColor=C.prpb}}}
            >{s.nom}</span>
          )
        })}
      </div>
      {openId && (
        <div style={{ marginTop:10, background:C.bg3, border:`0.5px solid ${C.prpb}`, borderRadius:8, padding:"14px 16px" }}>
          {loadingId===openId
            ? <div style={{ fontSize:12, color:C.txt3 }}>Chargement...</div>
            : sortData[openId]
              ? <SortDetail data={sortData[openId]} />
              : <div style={{ fontSize:12, color:C.txt3 }}>Donn\\u00e9es indisponibles</div>
          }
        </div>
      )}
    </div>
  )
}

function SortDetail({ data }) {
  const portee = data.min_range != null && data.range != null
    ? (data.min_range === data.range ? `${data.range}` : `${data.min_range} \\u00e0 ${data.range}`)
    : "\\u2014"

  const lignes = [
    `Co\\u00fbt ${data.ap_cost ?? 0} PA`,
    `Port\\u00e9e ${portee}`,
    `Critique ${data.critical_hit_probability ?? 0}%`,
    data.cast_test_los ? "N\\u00e9cessite une ligne de vue" : "Ne n\\u00e9cessite pas de ligne de vue",
    data.range_can_be_boosted ? "Port\\u00e9e modifiable" : null,
  ].filter(Boolean)

  if (data.max_cast_per_target > 0)      lignes.push(`Limitation par tour par cible : ${data.max_cast_per_target}`)
  if (data.max_cast_per_turn > 0)        lignes.push(`Limitation par tour : ${data.max_cast_per_turn}`)
  if (data.max_global_cast_per_turn > 0) lignes.push(`Limitation globale par tour : ${data.max_global_cast_per_turn}`)
  if (data.min_cast_interval > 0)        lignes.push(`Intervalle de relance : ${data.min_cast_interval}`)
  if (data.initial_cooldown > 0)         lignes.push(`Intervalle de relance initial : ${data.initial_cooldown}`)
  if (data.global_cooldown > 0)          lignes.push(`Intervalle de relance global : ${data.global_cooldown}`)

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        {data.img && <img src={data.img} alt={data.nom} style={{ width:40, height:40, objectFit:"contain", background:C.bg4, borderRadius:6, padding:2 }} />}
        <span style={{ fontSize:15, fontWeight:500, color:C.gold2 }}>{data.nom}</span>
      </div>
      <div style={{ marginBottom:14 }}>
        {lignes.map((l,i) => (
          <div key={i} style={{ fontSize:12, color:C.txt2, padding:"2px 0", lineHeight:1.7 }}>{l}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {data.effects?.length > 0 && (
          <div>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:8 }}>Effet</div>
            {data.effects.map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.prp2, fontSize:10 }}>\\u25c6</span> {e.texte}
              </div>
            ))}
          </div>
        )}
        {data.critical_effects?.length > 0 && (
          <div>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.gold, marginBottom:8 }}>Effet critique</div>
            {data.critical_effects.map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.gold, fontSize:10 }}>\\u25c6</span> {e.texte}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MonstrePage({ id, onBack }) {
  const [data, setData] = useState(null)
  const [gradeIdx, setGradeIdx] = useState(0)

  useEffect(() => {
    setData(null); setGradeIdx(0)
    fetch(`${API}/monstres/${id}`).then(r=>r.json()).then(setData)
  }, [id])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>Chargement...</div>

  const g = data.grades?.[gradeIdx] || {}
  const resVal = (v) => {
    const n = Number(v)
    if (isNaN(n)||n===0) return { color:C.txt, txt:"0" }
    return n > 0 ? { color:C.green, txt:`+${n}%` } : { color:C.red, txt:`${n}%` }
  }

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem", maxWidth:900, margin:"0 auto" }}>
      <button onClick={onBack} style={{ background:"transparent", border:`0.5px solid ${C.bdr2}`, borderRadius:6, padding:"5px 12px", fontSize:12, color:C.prp2, cursor:"pointer", marginBottom:20 }}>
        \\u2190 Retour
      </button>

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr2}`, borderRadius:12, padding:"18px 20px", display:"grid", gridTemplateColumns:"100px 1fr", gap:20, marginBottom:16 }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          {data.image_url
            ? <img src={data.image_url} alt={data.nom} style={{ width:90, height:90, objectFit:"contain" }} />
            : <div style={{ width:90, height:90, background:C.bg3, borderRadius:8 }} />
          }
          {data.agression && (
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(224,85,85,0.12)", border:`0.5px solid ${C.red}`, color:C.red }}>Agressif</span>
          )}
        </div>
        <div>
          <h2 style={{ fontSize:20, fontWeight:500, color:C.gold2, marginBottom:4 }}>{data.nom}</h2>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
            {data.race    && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.race}</span>}
            {data.famille && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.famille}</span>}
            {data.zones?.length > 0 && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.zones[0].nom}</span>}
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {data.grades?.map((gr,i) => (
              <button key={i} onClick={()=>setGradeIdx(i)} style={{
                background:i===gradeIdx?C.cyanf:C.bg4, border:`0.5px solid ${i===gradeIdx?C.cyan:C.bdr}`,
                borderRadius:6, padding:"4px 10px", fontSize:11, color:i===gradeIdx?C.cyan:C.txt2, cursor:"pointer",
              }}>Niv. {gr.niveau}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Stats</div>
          {STATS.map(s => (
            <div key={s.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:`0.5px solid rgba(0,212,255,0.06)` }}>
              <span style={{ fontSize:12, color:C.txt2, display:"flex", alignItems:"center", gap:6 }}>
                <img src={s.icon} alt={s.label} style={{ width:14, height:14, objectFit:"contain" }} />
                {s.label}
              </span>
              <span style={{ fontSize:13, fontWeight:500, color:C.txt }}>
                {(s.key==="tacle"||s.key==="fuite") ? (data[s.key]??"\\u2014") : (g[s.key]??"\\u2014")}
              </span>
            </div>
          ))}
        </div>

        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>R\\u00e9sistances</div>
          {ELEM.map(el => {
            const rv = resVal(g[el.key])
            return (
              <div key={el.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 0", borderBottom:`0.5px solid rgba(0,212,255,0.06)` }}>
                <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:C.txt2 }}>
                  <img src={el.icon} alt={el.label} style={{ width:16, height:16, objectFit:"contain" }} />
                  {el.label}
                </span>
                <span style={{ fontSize:13, fontWeight:500, color:rv.color }}>{rv.txt}</span>
              </div>
            )
          })}
        </div>
      </div>

      {data.sorts?.length > 0 && <SortsPanel sorts={data.sorts} />}

      {data.drops?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Drops</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {data.drops.map(d => (
              <div key={d.nom} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`0.5px solid rgba(0,212,255,0.06)` }}>
                <span style={{ fontSize:12, color:C.txt }}>{d.nom}</span>
                <span style={{ fontSize:12, color:C.gold }}>{d.pourcentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [query, setQuery]       = useState("")
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [almanax, setAlmanax]   = useState(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`${API}/monstres?search=${encodeURIComponent(query)}&limit=8`)
        .then(r=>r.json())
        .then(d=>{ setResults(d); setLoading(false) })
        .catch(()=>setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const today = new Date().toISOString().slice(0,10)
    fetch(`https://api.dofusdb.fr/almanax/${today}?lang=fr`)
      .then(r=>r.json()).then(setAlmanax).catch(()=>{})
  }, [])

  const handleSelect = (id) => { setSelected(id); setQuery(""); setResults([]) }
  const handleHome   = () => { setSelected(null); setQuery(""); setResults([]) }

  return (
    <div translate="no" style={{ minHeight:"100vh", background:C.bg, fontFamily:"sans-serif" }}>
      <div style={{ height:3, background:"linear-gradient(90deg,#9b4de0,#00d4ff,#f0c040,#c478ff,#00d4ff)", opacity:.7 }} />
      <Navbar onHome={handleHome} />
      <StatsBar />
      {selected ? (
        <MonstrePage id={selected} onBack={handleHome} />
      ) : (
        <>
          <Hero query={query} setQuery={setQuery} results={results} onSelect={handleSelect} loading={loading} />
          <AlmanaxBanner data={almanax} />
          <EncycloGrid onMonsters={handleHome} />
        </>
      )}
    </div>
  )
}
"""

with open(path, "w", encoding="utf-8") as f:
    f.write(contenu)

print("OK — App.jsx réécrit")