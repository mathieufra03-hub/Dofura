import { useState, useEffect, useRef } from "react"

const API = "https://web-production-53f2b.up.railway.app"

const STATS = [
  { key: "pv",        label: "PV",      icon: "/assets/icons/stats/pv.webp"       },
  { key: "pa",        label: "PA",      icon: "/assets/icons/stats/pa.webp"       },
  { key: "pm",        label: "PM",      icon: "/assets/icons/stats/pm.webp"       },
  { key: "xp",        label: "XP",      icon: "/assets/icons/stats/xp.webp"       },
  { key: "tacle",     label: "Tacle",   icon: "/assets/icons/stats/tacle.webp"    },
  { key: "fuite",     label: "Fuite",   icon: "/assets/icons/stats/fuite.webp"    },
  { key: "esquive_pa",label: "Esq.PA",  icon: "/assets/icons/stats/esquive_pa.webp"},
  { key: "esquive_pm",label: "Esq.PM",  icon: "/assets/icons/stats/esquive_pm.webp"},
]

const ELEM = [
  { key: "res_neutre", label: "Neutre", dot: "#B4B2A9", icon: "/assets/icons/elements/neutre.webp"  },
  { key: "res_terre",  label: "Terre",  dot: "#639922", icon: "/assets/icons/elements/terre.webp"   },
  { key: "res_feu",    label: "Feu",    dot: "#D85A30", icon: "/assets/icons/elements/feu.webp"     },
  { key: "res_eau",    label: "Eau",    dot: "#378ADD", icon: "/assets/icons/elements/eau.webp"     },
  { key: "res_air",    label: "Air",    dot: "#1D9E75", icon: "/assets/icons/elements/air.webp"     },
]

const C = {
  bg:     "#06070f",
  bg2:    "#0a0c1a",
  bg3:    "#0e1225",
  bg4:    "#121830",
  gold:   "#f0c040",
  gold2:  "#fad76a",
  goldf:  "rgba(240,192,64,0.09)",
  goldb:  "rgba(240,192,64,0.28)",
  cyan:   "#00d4ff",
  cyanf:  "rgba(0,212,255,0.08)",
  cyanb:  "rgba(0,212,255,0.22)",
  prp:    "#9b4de0",
  prp2:   "#c478ff",
  prpf:   "rgba(155,77,224,0.10)",
  prpb:   "rgba(155,77,224,0.28)",
  txt:    "#c8e4ff",
  txt2:   "#6888aa",
  txt3:   "#344a66",
  bdr:    "rgba(0,212,255,0.12)",
  bdr2:   "rgba(155,77,224,0.30)",
  green:  "#5fbe6e",
  red:    "#e05555",
}

const navLinks = ["Monstres", "Quêtes", "Objets", "Métiers", "Zones", "Almanax"]
const quickChips = ["Bouftou", "Iop", "Dofus Turquoise", "Larves de Donjon", "Panoplie Kolosso"]

// ── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ onHome }) {
  return (
    <nav style={{
      background: C.bg2,
      borderBottom: `0.5px solid ${C.bdr2}`,
      padding: "0 2rem",
      display: "flex",
      alignItems: "center",
      height: 48,
      position: "sticky",
      top: 0,
      zIndex: 100,
      gap: 0,
    }}>
      <span
        onClick={onHome}
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 900,
          fontSize: 17,
          background: "linear-gradient(90deg,#f0c040,#c478ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "0.08em",
          marginRight: 28,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >· DOFURA ·</span>

      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {navLinks.map(n => (
          <span key={n}
            onClick={n === "Monstres" ? onHome : undefined}
            style={{
              fontSize: 12,
              color: n === "Monstres" ? C.cyan : C.txt2,
              padding: "6px 11px",
              borderRadius: 6,
              cursor: "pointer",
              background: n === "Monstres" ? C.cyanf : "transparent",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.cyanf }}
            onMouseLeave={e => { e.currentTarget.style.color = n === "Monstres" ? C.cyan : C.txt2; e.currentTarget.style.background = n === "Monstres" ? C.cyanf : "transparent" }}
          >{n}</span>
        ))}
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{
          background: C.bg3,
          border: `0.5px solid ${C.cyanb}`,
          borderRadius: 6,
          padding: "5px 11px",
          fontSize: 12,
          color: C.txt3,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}>
          <span>🔍</span> Ctrl K
        </div>
        <div style={{
          background: C.prpf,
          border: `0.5px solid ${C.prpb}`,
          borderRadius: 6,
          padding: "5px 13px",
          fontSize: 12,
          color: C.prp2,
          cursor: "pointer",
        }}>Connexion</div>
      </div>
    </nav>
  )
}

// ── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
  const items = [
    { val: "4 932", label: "monstres" },
    { val: "4 210", label: "quêtes" },
    { val: "18 900", label: "articles" },
    { val: "18", label: "classes" },
    { val: "1 430", label: "succès" },
    { val: "18", label: "métiers" },
  ]
  return (
    <div style={{
      background: C.bg2,
      borderBottom: `0.5px solid ${C.bdr}`,
      padding: "7px 2rem",
      display: "flex",
      gap: 28,
      justifyContent: "center",
      flexWrap: "wrap",
    }}>
      {items.map(i => (
        <span key={i.label} style={{ fontSize: 12, color: C.txt3 }}>
          <span style={{ fontWeight: 500, color: C.gold, fontSize: 13 }}>{i.val}</span> {i.label}
        </span>
      ))}
    </div>
  )
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ query, setQuery, results, onSelect, loading }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setQuery("") }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [setQuery])

  return (
    <div style={{
      background: C.bg3,
      borderBottom: `0.5px solid ${C.bdr}`,
      padding: "44px 2rem 36px",
      textAlign: "center",
      position: "relative",
      overflow: "visible",
      zIndex: 10,
    }}>
      {/* orbes nébuleuses */}
      <div style={{ position:"absolute",width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,77,224,.22) 0%,transparent 70%)",top:-60,left:-60,pointerEvents:"none" }} />
      <div style={{ position:"absolute",width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,212,255,.15) 0%,transparent 70%)",top:-30,right:-40,pointerEvents:"none" }} />
      <div style={{ position:"absolute",width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,77,224,.12) 0%,transparent 70%)",bottom:-40,left:"40%",pointerEvents:"none" }} />

      <p style={{ fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color: C.prp2, marginBottom:12, position:"relative" }}>
        Encyclopédie complète — Dofus 3.x
      </p>
      <h1 style={{ fontSize:26, fontWeight:500, color: C.txt, lineHeight:1.15, marginBottom:6, position:"relative" }}>
        Tout l'univers <span style={{ color: C.gold2 }}>DOFUS</span>,<br/>en un seul endroit.
      </h1>
      <p style={{ fontSize:13, color: C.txt2, marginBottom:24, lineHeight:1.7, position:"relative" }}>
        Monstres, quêtes, objets, classes, succès — fusionnés depuis les meilleures sources.
      </p>

      {/* barre de recherche */}
      <div ref={ref} style={{ position:"relative", maxWidth:540, margin:"0 auto 16px" }}>
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: `0.5px solid ${C.cyanb}`,
          borderRadius: 10,
          padding: "11px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontSize:16, color: C.cyan }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cherche un monstre, une quête, un objet..."
            style={{
              flex:1, background:"transparent", border:"none", outline:"none",
              color: C.txt, fontSize:13, caretColor: C.cyan,
            }}
          />
          {loading && <span style={{ fontSize:11, color: C.txt3 }}>...</span>}
        </div>

        {/* dropdown autocomplete */}
        {results.length > 0 && (
          <div style={{
            position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
            background: C.bg2,
            border: `0.5px solid ${C.cyanb}`,
            borderRadius: 10,
            overflow:"hidden",
            zIndex: 200,
          }}>
            {results.map(m => (
              <div key={m.id}
                onClick={() => onSelect(m.id)}
                style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"8px 14px",
                  cursor:"pointer",
                  borderBottom: `0.5px solid ${C.bdr}`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {m.image_url
                  ? <img src={m.image_url} alt={m.nom} style={{ width:36, height:36, objectFit:"contain", borderRadius:6, background: C.bg4 }} />
                  : <div style={{ width:36, height:36, background: C.bg4, borderRadius:6 }} />
                }
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color: C.txt }}>{m.nom}</div>
                  <div style={{ fontSize:11, color: C.txt3 }}>{m.famille || m.race || ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* chips recherche rapide */}
      <div style={{ display:"flex", justifyContent:"center", gap:7, flexWrap:"wrap", position:"relative" }}>
        {quickChips.map(c => (
          <span key={c}
            onClick={() => setQuery(c)}
            style={{
              background: C.prpf,
              border: `0.5px solid ${C.prpb}`,
              borderRadius: 16,
              padding: "4px 12px",
              fontSize: 11,
              color: C.prp2,
              cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(155,77,224,0.18)"; e.currentTarget.style.borderColor=C.prp2 }}
            onMouseLeave={e => { e.currentTarget.style.background=C.prpf; e.currentTarget.style.borderColor=C.prpb }}
          >{c}</span>
        ))}
      </div>
    </div>
  )
}

// ── ALMANAX ──────────────────────────────────────────────────────────────────
function AlmanaxBanner({ data }) {
  if (!data) return null
  return (
    <div style={{
      background: C.bg4,
      borderTop: `0.5px solid ${C.bdr2}`,
      borderBottom: `0.5px solid ${C.bdr2}`,
      padding: "11px 2rem",
      display: "flex",
      alignItems: "center",
      gap: 13,
    }}>
      <div style={{
        width:36, height:36,
        background: C.goldf,
        border: `0.5px solid ${C.goldb}`,
        borderRadius: 8,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, flexShrink:0,
      }}>📅</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color: C.txt3, marginBottom:3 }}>
          Almanax du jour
        </div>
        <div style={{ fontSize:13, fontWeight:500, color: C.txt, marginBottom:2 }}>
          {data.offering?.item?.name?.fr || "Offrande du jour"}
        </div>
        <div style={{ fontSize:11, color: C.txt2 }}>
          {data.bonus?.description?.fr || "Bonus actif aujourd'hui"}
        </div>
      </div>
      <div style={{
        background: C.goldf,
        border: `0.5px solid ${C.goldb}`,
        borderRadius: 7,
        padding: "6px 13px",
        fontSize: 12,
        color: C.gold,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}>Voir l'Almanax →</div>
    </div>
  )
}

// ── ENCYCLOPEDIE GRID ────────────────────────────────────────────────────────
function EncycloGrid({ onMonsters }) {
  const items = [
    { icon:"🐾", label:"Monstres",  count:"4 932",  action: onMonsters },
    { icon:"📜", label:"Quêtes",    count:"4 210",  action: null },
    { icon:"🛡️", label:"Objets",    count:"18 900", action: null },
    { icon:"🔨", label:"Métiers",   count:"18",     action: null },
    { icon:"🗺️", label:"Zones",     count:"800+",   action: null },
    { icon:"🚪", label:"Donjons",   count:"120+",   action: null },
  ]
  return (
    <div style={{ padding:"18px 2rem 0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:500, color: C.txt, display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ color: C.cyan }}>📚</span> Encyclopédie
        </span>
        <span style={{ fontSize:11, color: C.txt3 }}>Tout voir →</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:18 }}>
        {items.map(it => (
          <div key={it.label}
            onClick={it.action || undefined}
            style={{
              background: C.bg3,
              border: `0.5px solid ${C.bdr}`,
              borderRadius: 8,
              padding:"14px 6px",
              textAlign:"center",
              cursor: it.action ? "pointer" : "default",
              transition:"border-color .15s",
            }}
            onMouseEnter={e => { if(it.action){ e.currentTarget.style.borderColor=C.cyan; e.currentTarget.style.background=C.cyanf }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.bdr; e.currentTarget.style.background=C.bg3 }}
          >
            <div style={{ fontSize:20, marginBottom:6 }}>{it.icon}</div>
            <div style={{ fontSize:11, color: C.txt, fontWeight:500 }}>{it.label}</div>
            <div style={{ fontSize:10, color: C.txt3, marginTop:2 }}>{it.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SORTS PANEL ──────────────────────────────────────────────────────────────
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
  const portee = data.min_range != null && data.range != null
    ? (data.min_range === data.range ? `${data.range}` : `${data.min_range} à ${data.range}`)
    : "—"

  const lignes = [
    `Coût ${data.ap_cost ?? 0} PA`,
    `Portée ${portee}`,
    `Critique ${data.critical_hit_probability ?? 0}%`,
    data.cast_test_los ? "Nécessite une ligne de vue" : "Ne nécessite pas de ligne de vue",
    data.range_can_be_boosted ? "Portée modifiable" : null,
  ].filter(Boolean)

  if (data.max_cast_per_target > 0)      lignes.push(`Limitation par tour par cible : ${data.max_cast_per_target}`)
  if (data.max_cast_per_turn > 0)        lignes.push(`Limitation par tour : ${data.max_cast_per_turn}`)
  if (data.max_global_cast_per_turn > 0) lignes.push(`Limitation globale par tour : ${data.max_global_cast_per_turn}`)
  if (data.min_cast_interval > 0)        lignes.push(`Intervalle de relance : ${data.min_cast_interval}`)
  if (data.initial_cooldown > 0)         lignes.push(`Intervalle de relance initial : ${data.initial_cooldown}`)
  if (data.global_cooldown > 0)          lignes.push(`Intervalle de relance global : ${data.global_cooldown}`)

  return (
    <div>
      {/* header sort */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        {data.img && (
          <img src={data.img} alt={data.nom} style={{ width:40, height:40, objectFit:"contain", background:C.bg4, borderRadius:6, padding:2 }} />
        )}
        <span style={{ fontSize:15, fontWeight:500, color:C.gold2 }}>{data.nom}</span>
      </div>

      {/* infos verticales comme dofusdb */}
      <div style={{ marginBottom:14 }}>
        {lignes.map((l, i) => (
          <div key={i} style={{ fontSize:12, color:C.txt2, padding:"2px 0", lineHeight:1.7 }}>
            {l}
          </div>
        ))}
      </div>

      {/* effets en deux colonnes */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {data.effects?.length > 0 && (
          <div>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:8 }}>Effet</div>
            {data.effects.map((e, i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.prp2, fontSize:10 }}>◆</span> {e.texte}
              </div>
            ))}
          </div>
        )}
        {data.critical_effects?.length > 0 && (
          <div>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.gold, marginBottom:8 }}>Effet critique</div>
            {data.critical_effects.map((e, i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.gold, fontSize:10 }}>◆</span> {e.texte}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── PAGE MONSTRE ─────────────────────────────────────────────────────────────
function MonstrePage({ id, onBack }) {
  const [data, setData] = useState(null)
  const [gradeIdx, setGradeIdx] = useState(0)

  useEffect(() => {
    setData(null)
    setGradeIdx(0)
    fetch(`${API}/monstres/${id}`)
      .then(r => r.json())
      .then(setData)
  }, [id])

  if (!data) return (
    <div style={{ padding:"3rem 2rem", textAlign:"center", color: C.txt2, fontSize:14 }}>
      Chargement...
    </div>
  )

  const g = data.grades?.[gradeIdx] || {}
  const resVal = (v) => {
    const n = Number(v)
    if (isNaN(n) || n === 0) return { color: C.txt, txt: "0" }
    return n > 0
      ? { color: C.green, txt: `+${n}%` }
      : { color: C.red,   txt: `${n}%` }
  }

  return (
    <div style={{ padding:"1.5rem 2rem", maxWidth:900, margin:"0 auto" }}>
      {/* bouton retour */}
      <button onClick={onBack} style={{
        background:"transparent", border:`0.5px solid ${C.bdr2}`,
        borderRadius:6, padding:"5px 12px", fontSize:12,
        color: C.prp2, cursor:"pointer", marginBottom:20,
      }}>← Retour</button>

      {/* header monstre */}
      <div style={{
        background: C.bg2,
        border: `0.5px solid ${C.bdr2}`,
        borderRadius:12,
        padding:"18px 20px",
        display:"grid",
        gridTemplateColumns:"100px 1fr",
        gap:20,
        marginBottom:16,
      }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          {data.image_url
            ? <img src={data.image_url} alt={data.nom} style={{ width:90, height:90, objectFit:"contain" }} />
            : <div style={{ width:90, height:90, background:C.bg3, borderRadius:8 }} />
          }
          {data.agression && (
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(224,85,85,0.12)", border:`0.5px solid ${C.red}`, color: C.red }}>
              Agressif
            </span>
          )}
        </div>
        <div>
          <h2 style={{ fontSize:20, fontWeight:500, color: C.gold2, marginBottom:4 }}>{data.nom}</h2>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
            {data.race    && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.race}</span>}
            {data.famille && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.famille}</span>}
            {data.zones?.length > 0 && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.zones[0].nom}</span>}
          </div>
          {/* onglets grades */}
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {data.grades?.map((gr, i) => (
              <button key={i} onClick={() => setGradeIdx(i)} style={{
                background: i === gradeIdx ? C.cyanf : C.bg4,
                border: `0.5px solid ${i === gradeIdx ? C.cyan : C.bdr}`,
                borderRadius:6, padding:"4px 10px", fontSize:11,
                color: i === gradeIdx ? C.cyan : C.txt2,
                cursor:"pointer",
              }}>Niv. {gr.niveau}</button>
            ))}
          </div>
        </div>
      </div>

      {/* stats + résistances */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        {/* stats */}
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Stats</div>
          {STATS.map(s => (
            <div key={s.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:`0.5px solid rgba(0,212,255,0.06)` }}>
              <span style={{ fontSize:12, color:C.txt2, display:"flex", alignItems:"center", gap:6 }}>
                <img src={s.icon} alt={s.label} style={{ width:14, height:14, objectFit:"contain" }} />
                {s.label}
              </span>
              <span style={{ fontSize:13, fontWeight:500, color:C.txt }}>
                {(s.key === "tacle" || s.key === "fuite") ? (data[s.key] ?? "—") : (g[s.key] ?? "—")}
              </span>
            </div>
          ))}
        </div>

        {/* résistances */}
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Résistances</div>
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

      {/* sorts */}
      {data.sorts?.length > 0 && (
        <SortsPanel sorts={data.sorts} />
      )}

      {/* drops */}
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

// ── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [query, setQuery]       = useState("")
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [almanax, setAlmanax]   = useState(null)

  // recherche live
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`${API}/monstres?search=${encodeURIComponent(query)}&limit=8`)
        .then(r => r.json())
        .then(d => { setResults(d); setLoading(false) })
        .catch(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  // almanax
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`https://api.dofusdb.fr/almanax/${today}?lang=fr`)
      .then(r => r.json())
      .then(setAlmanax)
      .catch(() => {})
  }, [])

  const handleSelect = (id) => { setSelected(id); setQuery(""); setResults([]) }
  const handleHome   = () => { setSelected(null); setQuery(""); setResults([]) }

  return (
    <div translate="no" style={{ minHeight:"100vh", background:C.bg, fontFamily:"sans-serif" }}>
      {/* bande néon en haut */}
      <div style={{ height:3, background:"linear-gradient(90deg,#9b4de0,#00d4ff,#f0c040,#c478ff,#00d4ff)", opacity:.7 }} />

      <Navbar onHome={handleHome} />
      <StatsBar />

      {selected ? (
        <MonstrePage id={selected} onBack={handleHome} />
      ) : (
        <>
          <Hero
            query={query} setQuery={setQuery}
            results={results} onSelect={handleSelect}
            loading={loading}
          />
          <AlmanaxBanner data={almanax} />
          <EncycloGrid onMonsters={handleHome} />
        </>
      )}
    </div>
  )
}