import { useState, useEffect, useRef, useMemo } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

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

// Structure de nav validée (§2 des specs) : 5 catégories fusionnées.
// Équipements englobe Panoplies, Métiers englobe Ressources (+ future carte),
// Bestiaire fusionne Monstres + Zones. Ces pages existent toujours (accès
// via la grille Encyclopédie de l'accueil ou les liens croisés des fiches),
// elles ne sont juste plus des onglets de premier niveau. Quêtes n'a pas
// encore de page : lien inerte. "Métiers" pointe vers Ressources en
// attendant le vrai hub Métiers (chantier futur #11 CLAUDE.md) — sans ça,
// les 3 639 ressources deviendraient injoignables depuis l'interface.
const navLinks = ["Équipements", "Métiers", "Donjons", "Bestiaire", "Quêtes"]
const NAV_LABEL_VERS_CIBLE = { "Équipements":"equipement", "Donjons":"donjon", "Bestiaire":"monstres", "Métiers":"ressource" }

function Navbar({ onHome, onNav, browsing }) {
  return (
    <nav style={{ background:"var(--df-panel-bg)", borderBottom:"1px solid var(--df-border-gold)", padding:"0 2rem", display:"flex", alignItems:"center", height:56, position:"sticky", top:0, zIndex:100 }}>
      <span onClick={onHome} className="df-title-gold" style={{ fontSize:19, letterSpacing:"0.06em", marginRight:28, cursor:"pointer" }}>
        DOFURA
      </span>
      <div style={{ display:"flex", gap:2, flex:1, overflowX:"auto" }}>
        {navLinks.map(n => {
          const cible = NAV_LABEL_VERS_CIBLE[n]
          const actif = cible && browsing === cible
          return (
            <span key={n} onClick={cible ? () => onNav(cible) : undefined}
              style={{ fontSize:14.5, color:actif?"var(--df-gold)":"var(--df-text)", padding:"18px 13px", cursor:cible?"pointer":"default", whiteSpace:"nowrap" }}
              onMouseEnter={e=>{if(cible)e.currentTarget.style.color="var(--df-gold)"}}
              onMouseLeave={e=>{e.currentTarget.style.color=actif?"var(--df-gold)":"var(--df-text)"}}
            >{n}</span>
          )
        })}
      </div>
      <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
        <button style={{
          background:"rgba(255,198,61,0.08)", color:"var(--df-gold)", border:"1px solid rgba(255,198,61,0.7)",
          borderRadius:10, padding:"8px 18px", fontSize:13.5, fontWeight:600, cursor:"pointer",
        }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,198,61,0.18)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,198,61,0.08)"}
        >Connexion</button>
      </div>
    </nav>
  )
}

function StatsBar() {
  const items = [
    {val:"4 932",label:"monstres"},{val:"4 210",label:"quêtes"},
    {val:"18 900",label:"articles"},{val:"18",label:"classes"},
    {val:"1 430",label:"succès"},{val:"18",label:"métiers"},
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

// Tracé exact de maquette/dofura-home-v4.jsx (composant DofuraHomeV4 > df-egg-logo) :
// œuf de dragon doré + spirale creusée, SVG original (aucun asset Ankama).
// Taille en "em" pour rester alignée sur la taille du titre (clamp responsive).
function DofuraEggO() {
  return (
    <svg viewBox="0 0 100 126" aria-label="O" style={{ height:"0.72em", width:"auto", margin:"0 0.03em", transform:"translateY(0.02em)" }}>
      <defs>
        <linearGradient id="df-egg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--df-gold-grad-1)" />
          <stop offset="1" stopColor="var(--df-gold-grad-2)" />
        </linearGradient>
      </defs>
      <path d="M50 4 C74 4 92 44 92 78 C92 106 74 122 50 122 C26 122 8 106 8 78 C8 44 26 4 50 4 Z" fill="url(#df-egg-grad)" />
      <path d="M60 42 C72 52 72 72 60 80 C50 87 37 82 35 71" fill="none" stroke="var(--df-bg)" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.4" stroke="var(--df-cyan)" strokeWidth="2" />
      <line x1="11" y1="11" x2="15" y2="15" stroke="var(--df-cyan)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const DOFUS_PRIMORDIAUX = [
  { key:"emeraude",  color:"var(--df-dofus-emeraude)" },
  { key:"pourpre",   color:"var(--df-dofus-pourpre)" },
  { key:"turquoise", color:"var(--df-dofus-turquoise)" },
  { key:"ocre",      color:"var(--df-dofus-ocre)" },
  { key:"ebene",     color:"var(--df-dofus-ebene)" },
  { key:"ivoire",    color:"var(--df-dofus-ivoire)" },
]

// Ligne continue avec un segment entre chaque Dofus (pas juste deux traits
// flanquant un paquet de pastilles) + pastilles en forme d'œuf, comme la maquette.
function DofusSeparator() {
  return (
    <div style={{ display:"flex", alignItems:"center", width:"min(440px, 76%)", margin:"54px auto" }}>
      <span style={{ flex:1, height:1, background:"rgba(255,198,61,0.25)" }} />
      {DOFUS_PRIMORDIAUX.map((d, i) => (
        <span key={d.key} style={{ display:"flex", alignItems:"center" }}>
          {i > 0 && <span style={{ width:60, height:1, background:"rgba(255,198,61,0.25)" }} />}
          <span title={d.key} style={{
            width:9, height:12, margin:"0 3px", display:"block",
            borderRadius:"50% 50% 50% 50% / 62% 62% 38% 38%",
            background:d.color, boxShadow:`0 0 8px ${d.color}`,
          }} />
        </span>
      ))}
      <span style={{ flex:1, height:1, background:"rgba(255,198,61,0.25)" }} />
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
    <div style={{ padding:"64px 2rem 8px", textAlign:"center", position:"relative", zIndex:1 }}>
      <h1 className="df-title-gold" style={{ fontSize:"clamp(46px, 9vw, 92px)", lineHeight:1.1, letterSpacing:"0.02em", margin:0, display:"inline-flex", alignItems:"baseline" }}>
        D<DofuraEggO />FURA
      </h1>
      <p style={{ fontSize:"clamp(15px, 2.5vw, 21px)", color:"var(--df-text-2)", margin:"14px 0 38px" }}>
        L'encyclopédie Dofus 3.0
      </p>
      <div ref={ref} style={{ position:"relative", width:"min(680px, 94%)", margin:"0 auto" }}>
        <div className="df-search-glow" style={{
          background:"rgba(20,26,46,0.97)", border:"2px solid rgba(77,216,230,0.85)", borderRadius:"var(--df-radius-pill)",
          padding:"18px 26px", display:"flex", alignItems:"center", gap:12,
        }}>
          <SearchIcon />
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Rechercher un monstre, un objet, un donjon..."
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--df-text)", fontSize:16, caretColor:"var(--df-cyan)" }} />
          {loading && <span style={{ fontSize:11, color:"var(--df-text-3)" }}>...</span>}
        </div>
        {results.length > 0 && (
          <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, right:0, background:"var(--df-panel-bg)", border:"1px solid var(--df-border-cyan)", borderRadius:14, overflow:"hidden", zIndex:200, textAlign:"left" }}>
            {results.map(m => (
              <div key={m.id} onClick={()=>onSelect(m.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 16px", cursor:"pointer", borderBottom:"1px solid var(--df-border-gold)" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(77,216,230,0.06)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                {m.image_url
                  ? <img src={m.image_url} alt={m.nom} style={{ width:36, height:36, objectFit:"contain", borderRadius:6, background:"var(--df-bg)" }} />
                  : <div style={{ width:36, height:36, background:"var(--df-bg)", borderRadius:6 }} />
                }
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:"var(--df-text)" }}>{m.nom}</div>
                  <div style={{ fontSize:11, color:"var(--df-text-3)" }}>{m.famille || m.race || ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <DofusSeparator />
    </div>
  )
}

function AlmanaxBanner({ data }) {
  if (!data) return null
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
  const dateCapitalisee = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)
  return (
    <div style={{ background:"var(--df-panel-bg)", borderBottom:"1px solid rgba(255,198,61,0.2)", padding:"9px 2rem", display:"flex", alignItems:"center", gap:18, overflowX:"auto", whiteSpace:"nowrap" }}>
      <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"var(--df-gold)" }}>
        <span style={{ fontSize:13 }}>&#128197;</span> ALMANAX
      </span>
      <span style={{ fontSize:12, color:"var(--df-text-2)" }}>{dateCapitalisee}</span>
      {data.bonus?.description?.fr && (
        <span style={{ fontSize:12, color:"var(--df-text-2)" }}>
          Bonus du jour : <span style={{ color:"var(--df-text)" }}>{data.bonus.description.fr}</span>
        </span>
      )}
      {data.offering?.item?.name?.fr && (
        <span style={{ fontSize:12, color:"var(--df-text-2)" }}>
          Offrande : <span style={{ color:"var(--df-text)" }}>{data.offering.item.name.fr}</span>
        </span>
      )}
      <span style={{ marginLeft:"auto", fontSize:12, color:"var(--df-cyan)", cursor:"pointer", whiteSpace:"nowrap", fontWeight:600 }}>Voir l'Almanax →</span>
    </div>
  )
}

// 90 étoiles à position/taille/opacité aléatoires, générées une seule fois
// (useMemo) puis animées en CSS pur (.df-star) — reprend StarField de la
// maquette/dofura-home-v4.jsx, remplace l'ancienne tuile CSS répétée.
function StarField() {
  const stars = useMemo(() => Array.from({ length:90 }, (_, i) => ({
    id:i,
    left:Math.random()*100,
    top:Math.random()*100,
    size:Math.random()*2.2+0.8,
    opacity:Math.random()*0.55+0.2,
    delay:Math.random()*6,
  })), [])
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
      {stars.map(s => (
        <div key={s.id} className="df-star" style={{
          left:s.left+"%", top:s.top+"%", width:s.size, height:s.size,
          opacity:s.opacity, animationDelay:s.delay+"s",
        }} />
      ))}
    </div>
  )
}

function Footer() {
  return (
    <footer style={{ background:"var(--df-panel-bg)", borderTop:"1px solid var(--df-border-gold)", padding:"18px 2rem", textAlign:"center" }}>
      <p style={{ fontSize:11, color:"var(--df-text-3)", lineHeight:1.6, margin:0 }}>
        DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games.<br/>
        Certaines illustrations sont la propriété d'Ankama.
      </p>
    </footer>
  )
}

// Les 6 cartes reprennent exactement les 5 catégories de la navbar (§2) +
// Carte interactive (chantier futur, voir CLAUDE.md). Équipements/Donjons/
// Bestiaire ont déjà une page (Panoplies/Zones fusionnées dedans, voir
// navLinks) ; Quêtes/Carte interactive n'en ont pas encore — carte affichée
// à l'identique (cohérence visuelle avec la maquette) mais non cliquable,
// comme le lien inerte de la navbar. Métiers pointe vers Ressources en
// attendant le vrai hub Métiers (même raison que NAV_LABEL_VERS_CIBLE).
function EncycloGrid({ onNav }) {
  const items = [
    { label:"Équipements",       desc:"Armes, coiffes, capes... et leurs panoplies",    action:()=>onNav("equipement") },
    { label:"Métiers",           desc:"Récolte, craft et ressources",                   action:()=>onNav("ressource") },
    { label:"Donjons",           desc:"Boss, salles, stratégies et succès",             action:()=>onNav("donjon") },
    { label:"Bestiaire",         desc:"Toutes les créatures, par zone et sous-zone",    action:()=>onNav("monstres") },
    { label:"Quêtes",            desc:"Étapes, prérequis et récompenses",               action:null },
    { label:"Carte interactive", desc:"Positions des ressources et métiers", lit:true,  action:null },
  ]
  return (
    <div style={{ padding:"0 2rem 60px", maxWidth:1240, margin:"0 auto" }}>
      <div className="df-section-title" style={{ fontSize:"clamp(22px, 3.5vw, 28px)", marginBottom:24 }}>Explorer l'encyclopédie</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:22 }}>
        {items.map(it => (
          <div key={it.label} onClick={it.action||undefined} className={"df-card" + (it.lit?" df-card-lit":"")}
            style={{ padding:26, cursor:it.action?"pointer":"default" }}
          >
            <div style={{ fontSize:19, fontWeight:700, color:"var(--df-gold)", marginBottom:8 }}>{it.label}</div>
            <div style={{ fontSize:13.5, color:"var(--df-text-2)", lineHeight:1.5, marginBottom:18 }}>{it.desc}</div>
            <div style={{ fontSize:13.5, color:"var(--df-cyan)", fontWeight:600 }}>Explorer →</div>
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
  const [fetchTs, setFetchTs] = useState({})

  const toggle = (s) => {
    if (openId === s.sort_id) { setOpenId(null); return }
    setOpenId(s.sort_id)
    setLoadingId(s.sort_id)
    setSortData(prev => { const n = {...prev}; delete n[s.sort_id]; return n })
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
              : <div style={{ fontSize:12, color:C.txt3 }}>Données indisponibles</div>
          }
        </div>
      )}
    </div>
  )
}

function SortDetail({ data }) {
  const portee = data.min_range != null && data.range != null
    ? (data.min_range === data.range ? `${data.range}` : `${data.min_range} à ${data.range}`)
    : "—"

  const badges = [
    { label: `${data.ap_cost ?? 0} PA`, color: C.cyan },
    { label: portee === '0' ? 'Corps-à-corps' : `Portée ${portee}`, color: C.txt2 },
    { label: `Critique ${data.critical_hit_probability ?? 0}%`, color: C.gold },
  ]
  if (data.global_cooldown > 0)    badges.push({ label: `Relance ${data.global_cooldown}`, color: C.txt2 })
  if (data.min_cast_interval > 0)  badges.push({ label: `Intervalle ${data.min_cast_interval}`, color: C.txt2 })
  if (data.initial_cooldown > 0)   badges.push({ label: `Cooldown init. ${data.initial_cooldown}`, color: C.txt2 })
  if (data.max_cast_per_turn > 0)  badges.push({ label: `${data.max_cast_per_turn}x/tour`, color: C.txt2 })
  if (data.cast_test_los)          badges.push({ label: "Ligne de vue", color: C.txt3 })
  if (data.range_can_be_boosted)   badges.push({ label: "Portée modifiable", color: C.txt3 })

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        {data.img && <img src={data.img} alt={data.nom} style={{ width:36, height:36, objectFit:"contain", background:C.bg4, borderRadius:6, padding:2 }} />}
        <span style={{ fontSize:14, fontWeight:500, color:C.gold2 }}>{data.nom}</span>
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
        {badges.map((b,i) => (
          <span key={i} style={{ fontSize:11, padding:"3px 9px", borderRadius:5, background:C.bg4, border:`0.5px solid rgba(255,255,255,0.07)`, color:b.color }}>
            {b.label}
          </span>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {data.effects?.length > 0 && (
          <div style={{ background:C.bg4, borderRadius:7, padding:"10px 12px" }}>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.prp2, marginBottom:8 }}>Effet</div>
            {data.effects.map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.prp2, fontSize:9, flexShrink:0 }}>◆</span> {e.texte ?? data.nom}
              </div>
            ))}
          </div>
        )}
        {data.critical_effects?.length > 0 && (
          <div style={{ background:C.bg4, borderRadius:7, padding:"10px 12px" }}>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.gold, marginBottom:8 }}>Effet critique</div>
            {data.critical_effects.filter(e=>e.texte).map((e,i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.gold, fontSize:9, flexShrink:0 }}>◆</span> {e.texte}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MonstrePage({ id, onSelectDonjon, onBack }) {
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
        ← Retour
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
                {(s.key==="tacle"||s.key==="fuite") ? (data[s.key]??"—") : (g[s.key]??"—")}
              </span>
            </div>
          ))}
        </div>

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

      {data.sorts?.length > 0 && <SortsPanel sorts={data.sorts} />}

      {data.drops?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
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

      {data.donjons?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Apparaît dans</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {data.donjons.map(d => (
              <span key={d.id} onClick={()=>onSelectDonjon(d.id)}
                style={{ fontSize:11, padding:"3px 9px", borderRadius:6, cursor:"pointer",
                  background:d.est_boss?C.goldf:C.bg4, border:`0.5px solid ${d.est_boss?C.goldb:C.bdr}`, color:d.est_boss?C.gold:C.txt2 }}>
                {d.nom}{d.est_boss?" (Boss)":""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const SANS_VALEUR = "__aucune__"
const PAGE_SIZE = 48
const TRANCHES_NIVEAU = [
  { valeur:"1-50",   label:"Niveau 1 à 50" },
  { valeur:"51-100", label:"Niveau 51 à 100" },
  { valeur:"101-150",label:"Niveau 101 à 150" },
  { valeur:"151-200",label:"Niveau 151 à 200" },
]

// Styles regroupes ici (plutot qu'eparpilles dans le JSX) pour que la
// refonte graphique complete a venir (design actuel provisoire) n'ait
// qu'un seul endroit a modifier pour cette page.
const mp = {
  page: { padding:"1.5rem 2rem", maxWidth:1100, margin:"0 auto" },
  backBtn: { background:"transparent", border:`0.5px solid ${C.bdr2}`, borderRadius:6, padding:"5px 12px", fontSize:12, color:C.prp2, cursor:"pointer", marginBottom:20 },
  filtreBar: { display:"flex", flexWrap:"wrap", gap:10, alignItems:"center", marginBottom:18 },
  searchInput: { background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.txt, outline:"none", minWidth:220 },
  select: { background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.txt, outline:"none", cursor:"pointer" },
  resetBtn: { background:"transparent", border:`0.5px solid ${C.bdr2}`, borderRadius:8, padding:"8px 14px", fontSize:12, color:C.prp2, cursor:"pointer" },
  compteur: { fontSize:12, color:C.txt3, marginLeft:"auto" },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:12, marginBottom:20 },
  card: { background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"12px 10px", textAlign:"center", cursor:"pointer" },
  cardImg: { width:56, height:56, objectFit:"contain", marginBottom:8 },
  cardImgVide: { width:56, height:56, background:C.bg3, borderRadius:8, margin:"0 auto 8px" },
  cardNom: { fontSize:12, color:C.txt, fontWeight:500, marginBottom:3 },
  cardFamille: { fontSize:10, color:C.txt3 },
  pagination: { display:"flex", gap:8, alignItems:"center", justifyContent:"center", marginTop:8 },
  pageBtn: (disabled) => ({ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:6, padding:"6px 12px", fontSize:12, color:disabled?C.txt3:C.cyan, cursor:disabled?"default":"pointer", opacity:disabled?0.5:1 }),
  pageLabel: { fontSize:12, color:C.txt2 },
  videEtat: { textAlign:"center", padding:"3rem 1rem", color:C.txt2, fontSize:13 },
  comboboxWrap: { position:"relative" },
  comboboxButton: (open) => ({ background:C.bg2, border:`0.5px solid ${open?C.cyan:C.bdr}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.txt, cursor:"pointer", display:"flex", alignItems:"center", gap:6, minWidth:180, justifyContent:"space-between" }),
  comboboxPanel: { position:"absolute", top:"calc(100% + 4px)", left:0, minWidth:240, background:C.bg2, border:`0.5px solid ${C.cyanb}`, borderRadius:8, zIndex:50, overflow:"hidden" },
  comboboxInput: { width:"100%", boxSizing:"border-box", background:C.bg3, border:"none", borderBottom:`0.5px solid ${C.bdr}`, padding:"8px 12px", fontSize:12, color:C.txt, outline:"none" },
  comboboxList: { maxHeight:240, overflowY:"auto" },
  comboboxOption: (active) => ({ padding:"7px 12px", fontSize:12, color:active?C.cyan:C.txt2, background:active?C.cyanf:"transparent", cursor:"pointer" }),
  comboboxEmpty: { padding:"10px 12px", fontSize:12, color:C.txt3 },
}

function ZoneCombobox({ zones, sansZoneDispo, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [filtre, setFiltre] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const label = value === "" ? "Toutes les zones" : value === SANS_VALEUR ? "Sans zone" : value
  const zonesFiltrees = zones.filter(z => z.toLowerCase().includes(filtre.toLowerCase()))

  const choisir = (v) => { onChange(v); setOpen(false); setFiltre("") }

  return (
    <div ref={ref} style={mp.comboboxWrap}>
      <button type="button" onClick={()=>setOpen(o=>!o)} style={mp.comboboxButton(open)}>
        {label} <span style={{ fontSize:10, opacity:0.6 }}>▾</span>
      </button>
      {open && (
        <div style={mp.comboboxPanel}>
          <input autoFocus value={filtre} onChange={e=>setFiltre(e.target.value)}
            placeholder="Rechercher une zone..." style={mp.comboboxInput} />
          <div style={mp.comboboxList}>
            <div onClick={()=>choisir("")} style={mp.comboboxOption(value==="")}>Toutes les zones</div>
            {sansZoneDispo && <div onClick={()=>choisir(SANS_VALEUR)} style={mp.comboboxOption(value===SANS_VALEUR)}>Sans zone</div>}
            {zonesFiltrees.map(z => (
              <div key={z} onClick={()=>choisir(z)} style={mp.comboboxOption(value===z)}>{z}</div>
            ))}
            {zonesFiltrees.length === 0 && <div style={mp.comboboxEmpty}>Aucune zone ne correspond</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function MonstresPage({ onSelect, onBack }) {
  const [monstres, setMonstres] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [famille, setFamille] = useState("")
  const [zone, setZone] = useState("")
  const [familles, setFamilles] = useState([])
  const [zones, setZones] = useState([])
  const [sansFamilleDispo, setSansFamilleDispo] = useState(true)
  const [sansZoneDispo, setSansZoneDispo] = useState(true)
  const [loading, setLoading] = useState(true)
  const filtresRequeteId = useRef(0)

  // Filtres en cascade : les familles proposees dependent de la zone active
  // (et vice versa), jamais de leur propre valeur — sinon la selection en
  // cours pourrait disparaitre de son propre menu. Si la famille ou la zone
  // choisie devient incompatible avec l'autre filtre, on la reinitialise
  // plutot que de laisser le joueur sur une combinaison impossible.
  useEffect(() => {
    const requeteId = ++filtresRequeteId.current
    const params = new URLSearchParams()
    if (famille) params.set("famille", famille)
    if (zone) params.set("zone", zone)
    fetch(`${API}/monstres/filtres?${params}`).then(r=>r.json()).then(d => {
      if (requeteId !== filtresRequeteId.current) return // reponse perimee (filtre change entre-temps)
      setFamilles(d.familles); setZones(d.zones)
      setSansFamilleDispo(d.sans_famille); setSansZoneDispo(d.sans_zone)

      if (famille === SANS_VALEUR && !d.sans_famille) { setFamille(""); setPage(1) }
      else if (famille && famille !== SANS_VALEUR && !d.familles.includes(famille)) { setFamille(""); setPage(1) }

      if (zone === SANS_VALEUR && !d.sans_zone) { setZone(""); setPage(1) }
      else if (zone && zone !== SANS_VALEUR && !d.zones.includes(zone)) { setZone(""); setPage(1) }
    })
  }, [famille, zone])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const monstresRequeteId = useRef(0)
  useEffect(() => {
    const requeteId = ++monstresRequeteId.current
    setLoading(true)
    const params = new URLSearchParams({ search, famille, zone, page, page_size: PAGE_SIZE })
    fetch(`${API}/monstres?${params}`)
      .then(r=>r.json())
      .then(d => {
        if (requeteId !== monstresRequeteId.current) return // reponse perimee (filtre change entre-temps)
        setMonstres(d.monstres); setTotal(d.total); setLoading(false)
      })
      .catch(()=>{ if (requeteId === monstresRequeteId.current) setLoading(false) })
  }, [search, famille, zone, page])

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const filtresActifs = search || famille || zone

  const reinitialiser = () => {
    setSearchInput(""); setSearch(""); setFamille(""); setZone(""); setPage(1)
  }

  return (
    <div style={mp.page}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={mp.filtreBar}>
        <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
          placeholder="Rechercher un monstre..." style={mp.searchInput} />

        <select value={famille} onChange={e=>{ setFamille(e.target.value); setPage(1) }} style={mp.select}>
          <option value="">Toutes les familles</option>
          {sansFamilleDispo && <option value={SANS_VALEUR}>Sans famille</option>}
          {familles.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <ZoneCombobox zones={zones} sansZoneDispo={sansZoneDispo} value={zone} onChange={(v)=>{ setZone(v); setPage(1) }} />

        {filtresActifs && <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser</button>}

        <span style={mp.compteur}>{total} monstre{total!==1?"s":""}</span>
      </div>

      {!loading && monstres.length === 0 ? (
        <div style={mp.videEtat}>
          Aucun monstre ne correspond à ces filtres.
          {filtresActifs && <div style={{ marginTop:10 }}>
            <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser les filtres</button>
          </div>}
        </div>
      ) : (
        <div style={mp.grid}>
          {monstres.map(m => (
            <div key={m.id} onClick={()=>onSelect(m.id)} style={mp.card}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.bdr}
            >
              {m.image_url
                ? <img src={m.image_url} alt={m.nom} style={mp.cardImg} />
                : <div style={mp.cardImgVide} />
              }
              <div style={mp.cardNom}>{m.nom}</div>
              <div style={mp.cardFamille}>{m.famille || "—"}</div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={mp.pagination}>
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={mp.pageBtn(page<=1)}>← Précédent</button>
          <span style={mp.pageLabel}>Page {page} / {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={mp.pageBtn(page>=totalPages)}>Suivant →</button>
        </div>
      )}
    </div>
  )
}

const TRI_OPTIONS = [
  { valeur:"az",          label:"A → Z" },
  { valeur:"niveau_desc", label:"Niveau ↓" },
  { valeur:"niveau_asc",  label:"Niveau ↑" },
  { valeur:"type",        label:"Par type" },
]

// Regroupement sous en-tetes : depend du tri actif (lettres / types / tranches
// de 50 niveaux), calcule sur la page courante uniquement — comme le tri et
// les filtres, la pagination reste geree cote serveur (voir CLAUDE.md §5).
function grouperObjets(objets, tri) {
  const cleDe = (o) => {
    if (tri === "type") return o.type_nom || "—"
    if (tri === "niveau_desc" || tri === "niveau_asc") {
      const base = Math.floor((o.niveau - 1) / 50) * 50 + 1
      return `Niv. ${base} à ${base + 49}`
    }
    return (o.nom.charAt(0) || "?").toUpperCase()
  }
  const groupes = []
  objets.forEach(o => {
    const cle = cleDe(o)
    const dernier = groupes[groupes.length - 1]
    if (dernier && dernier.cle === cle) dernier.items.push(o)
    else groupes.push({ cle, items:[o] })
  })
  return groupes
}

const fchk = { display:"flex", alignItems:"center", gap:9, padding:"4px 0", fontSize:13.5, color:"var(--df-text-2)", cursor:"pointer" }
const fchkInput = { accentColor:"var(--df-gold)", width:15, height:15, cursor:"pointer" }
const ftitle = { fontSize:11.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", margin:"18px 0 10px" }

// Composant unique reutilise pour /equipements et /ressources (DRY) : seule
// la prop "categorie" change le perimetre interroge cote backend. Les filtres
// avances (effets recherches / avec panoplie / legendaire) n'ont de sens que
// pour les equipements — masques pour les ressources plutot que devines.
function ObjetsPage({ categorie, titre, placeholder, videMessage, compteurSingulier, compteurPluriel, onSelect, onBack }) {
  const [objets, setObjets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [tri, setTri] = useState("az")
  const [types, setTypes] = useState([])
  const [typesDispo, setTypesDispo] = useState([])
  const [niveauBounds, setNiveauBounds] = useState(null)
  const [niveauMin, setNiveauMin] = useState(1)
  const [niveauMax, setNiveauMax] = useState(200)
  const [effets, setEffets] = useState([])
  const [effetsDispo, setEffetsDispo] = useState([])
  const [panoplie, setPanoplie] = useState(false)
  const [legendaire, setLegendaire] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [tip, setTip] = useState(null)
  const [loading, setLoading] = useState(true)

  // Categorie fixee par la page : les filtres ne dependent que d'elle,
  // recharges au changement de categorie (navigation directe equipement <-> ressource).
  useEffect(() => {
    setSearchInput(""); setSearch(""); setTypes([]); setEffets([])
    setPanoplie(false); setLegendaire(false); setTri("az"); setPage(1); setNiveauBounds(null)
    fetch(`${API}/objets/filtres?categorie=${categorie}`).then(r=>r.json()).then(d => {
      setTypesDispo(d.types); setEffetsDispo(d.effets)
      setNiveauBounds({ min:d.niveau_min, max:d.niveau_max })
      setNiveauMin(d.niveau_min); setNiveauMax(d.niveau_max)
    })
  }, [categorie])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const objetsRequeteId = useRef(0)
  useEffect(() => {
    if (!niveauBounds) return // attend les vraies bornes de niveau avant le premier appel
    const requeteId = ++objetsRequeteId.current
    setLoading(true)
    const params = new URLSearchParams({
      categorie, search, tri, page, page_size: PAGE_SIZE,
      type: types.join(","), niveau_min: niveauMin, niveau_max: niveauMax,
      effets: effets.join(","), panoplie, legendaire,
    })
    fetch(`${API}/objets?${params}`)
      .then(r=>r.json())
      .then(d => {
        if (requeteId !== objetsRequeteId.current) return
        setObjets(d.objets); setTotal(d.total); setLoading(false)
      })
      .catch(()=>{ if (requeteId === objetsRequeteId.current) setLoading(false) })
  }, [categorie, search, tri, types, niveauMin, niveauMax, effets, panoplie, legendaire, page, niveauBounds])

  const toggleType = (t) => { setTypes(ts => ts.includes(t) ? ts.filter(x=>x!==t) : [...ts, t]); setPage(1) }
  const toggleEffet = (e) => { setEffets(es => es.includes(e) ? es.filter(x=>x!==e) : [...es, e]); setPage(1) }

  const chips = [
    ...types.map(t => ({ label:t, off:()=>toggleType(t) })),
    ...(niveauBounds && (niveauMin > niveauBounds.min || niveauMax < niveauBounds.max)
      ? [{ label:`Niv. ${niveauMin}-${niveauMax}`, off:()=>{ setNiveauMin(niveauBounds.min); setNiveauMax(niveauBounds.max); setPage(1) } }]
      : []),
    ...effets.map(e => ({ label:e, off:()=>toggleEffet(e) })),
    ...(panoplie ? [{ label:"Avec panoplie", off:()=>{ setPanoplie(false); setPage(1) } }] : []),
    ...(legendaire ? [{ label:"Légendaire", off:()=>{ setLegendaire(false); setPage(1) } }] : []),
  ]

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const groupes = useMemo(() => grouperObjets(objets, tri), [objets, tri])

  const reinitialiser = () => {
    setSearchInput(""); setSearch(""); setTypes([]); setEffets([])
    setPanoplie(false); setLegendaire(false)
    if (niveauBounds) { setNiveauMin(niveauBounds.min); setNiveauMax(niveauBounds.max) }
    setPage(1)
  }

  return (
    <div style={mp.page}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={{ display:"flex", alignItems:"baseline", gap:14, flexWrap:"wrap", marginBottom:18 }}>
        <h1 className="df-section-title" style={{ fontSize:"clamp(24px, 4vw, 32px)", margin:0 }}>{titre}</h1>
        <span style={{ color:"var(--df-text-3)", fontSize:13.5 }}>{total} {total!==1?compteurPluriel:compteurSingulier}</span>
      </div>

      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", gap:10, background:"rgba(20,26,46,0.95)", border:"1px solid rgba(77,216,230,0.5)", borderRadius:12, padding:"11px 16px" }}>
          <SearchIcon />
          <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder={placeholder}
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--df-text)", fontSize:14 }} />
        </div>
        <select value={tri} onChange={e=>{ setTri(e.target.value); setPage(1) }}
          style={{ background:"rgba(20,26,46,0.95)", color:"var(--df-text)", border:"1px solid rgba(255,198,61,0.35)", borderRadius:12, padding:"11px 14px", fontSize:13.5, cursor:"pointer" }}>
          {TRI_OPTIONS.map(o => <option key={o.valeur} value={o.valeur}>{o.label}</option>)}
        </select>
        <button className="df-filters-toggle" onClick={()=>setShowFilters(s=>!s)}
          style={{ background:"rgba(255,198,61,0.08)", color:"var(--df-gold)", border:"1px solid rgba(255,198,61,0.6)", borderRadius:12, padding:"11px 16px", fontSize:13.5, fontWeight:600, cursor:"pointer" }}>
          Filtres{chips.length>0?` (${chips.length})`:""}
        </button>
      </div>

      {chips.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16, alignItems:"center" }}>
          {chips.map((c,i) => (
            <button key={i} className="df-chip-filter" onClick={c.off}>{c.label} <span className="x">✕</span></button>
          ))}
          <button onClick={reinitialiser} style={{ background:"none", border:"none", color:"var(--df-text-3)", fontSize:12.5, cursor:"pointer", textDecoration:"underline" }}>
            Tout effacer
          </button>
        </div>
      )}

      <div className="df-list-wrap">
        <aside className={"df-filters-panel" + (showFilters?" df-filters-open":"")}
          style={{ background:"rgba(20,26,46,0.92)", border:"1px solid rgba(255,198,61,0.2)", borderRadius:16, padding:20 }}>
          <div className="df-section-title" style={{ ...ftitle, marginTop:0 }}>Type</div>
          {typesDispo.map(t => (
            <label key={t} style={fchk}>
              <input type="checkbox" checked={types.includes(t)} onChange={()=>toggleType(t)} style={fchkInput} />
              {t}
            </label>
          ))}

          {niveauBounds && (
            <>
              <div className="df-section-title" style={ftitle}>Niveau</div>
              <input type="range" min={niveauBounds.min} max={niveauBounds.max} value={niveauMin}
                onChange={e=>{ setNiveauMin(Math.min(Number(e.target.value), niveauMax)); setPage(1) }}
                style={{ width:"100%", accentColor:"var(--df-cyan)" }} />
              <input type="range" min={niveauBounds.min} max={niveauBounds.max} value={niveauMax}
                onChange={e=>{ setNiveauMax(Math.max(Number(e.target.value), niveauMin)); setPage(1) }}
                style={{ width:"100%", accentColor:"var(--df-cyan)" }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--df-text-3)", marginTop:2 }}>
                <span>Min : {niveauMin}</span><span>Max : {niveauMax}</span>
              </div>
            </>
          )}

          {categorie === "equipement" && effetsDispo.length > 0 && (
            <>
              <div className="df-section-title" style={ftitle}>Effets recherchés</div>
              <div>
                {effetsDispo.map(e => (
                  <button key={e} className={"df-chip-fx" + (effets.includes(e)?" on":"")} onClick={()=>toggleEffet(e)}>{e}</button>
                ))}
              </div>
            </>
          )}

          {categorie === "equipement" && (
            <>
              <div className="df-section-title" style={ftitle}>Options</div>
              <label style={fchk}>
                <input type="checkbox" checked={panoplie} onChange={()=>{ setPanoplie(p=>!p); setPage(1) }} style={fchkInput} />
                Avec panoplie
              </label>
              <label style={fchk}>
                <input type="checkbox" checked={legendaire} onChange={()=>{ setLegendaire(l=>!l); setPage(1) }} style={fchkInput} />
                Légendaire uniquement
              </label>
            </>
          )}
        </aside>

        <div>
          {!loading && objets.length === 0 ? (
            <div style={mp.videEtat}>
              {videMessage}
              {chips.length > 0 && <div style={{ marginTop:10 }}>
                <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser les filtres</button>
              </div>}
            </div>
          ) : groupes.map((g, gi) => (
            <div key={g.cle + gi}>
              <div style={{ display:"flex", alignItems:"center", gap:12, margin: gi===0 ? "0 0 12px" : "24px 0 12px" }}>
                <span style={{ color:"var(--df-gold)", fontWeight:700, fontSize:18 }}>{g.cle}</span>
                <span style={{ flex:1, height:1, background:"rgba(255,198,61,0.2)" }} />
                <span style={{ color:"var(--df-text-3)", fontSize:11.5 }}>{g.items.length} item{g.items.length>1?"s":""}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(136px, 1fr))", gap:12 }}>
                {g.items.map(o => (
                  <div key={o.id} className="df-tile" onClick={()=>onSelect(o.id)}
                    onMouseEnter={()=>setTip(o.id)} onMouseLeave={()=>setTip(null)}
                  >
                    {o.img
                      ? <img src={o.img} alt={o.nom} style={{ width:44, height:44, objectFit:"contain", margin:"0 auto 10px", display:"block" }} />
                      : <div style={{ width:44, height:44, borderRadius:10, margin:"0 auto 10px", background:"rgba(12,15,29,0.8)", border:"1px solid rgba(255,198,61,0.3)" }} />
                    }
                    <div style={{ color:"var(--df-gold)", fontWeight:700, fontSize:12.5, lineHeight:1.25, minHeight:31, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>{o.nom}</div>
                    <div style={{ color:"var(--df-text-3)", fontSize:11, marginTop:4 }}>Niv. {o.niveau} — {o.type_nom || "—"}</div>
                    {o.legendaire && <span className="df-tile-badge">LÉG.</span>}
                    {tip === o.id && (
                      <div className="df-tooltip">
                        {o.effects.length > 0
                          ? o.effects.slice(0,6).map((e,i) => (
                              <div key={i} style={{ fontSize:12.5, padding:"2px 0", color: e.polarite==="malus" ? "var(--df-red)" : e.polarite==="bonus" ? "var(--df-green)" : "var(--df-text-2)" }}>{e.texte}</div>
                            ))
                          : <div style={{ fontSize:12, color:"var(--df-text-3)" }}>Pas d'effet notable</div>
                        }
                        {o.panoplie && <div style={{ color:"var(--df-text-2)", fontSize:11.5, marginTop:7, paddingTop:7, borderTop:"1px solid rgba(255,198,61,0.15)" }}>Fait partie d'une panoplie</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div style={mp.pagination}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={mp.pageBtn(page<=1)}>← Précédent</button>
              <span style={mp.pageLabel}>Page {page} / {totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={mp.pageBtn(page>=totalPages)}>Suivant →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Couleur de polarite : vert bonus / rouge malus / texte normal si sans
// rapport (ex. "401 a 500 Initiative", ni bonus ni malus au sens strict).
const couleurPolarite = (p) => p === "bonus" ? "var(--df-green)" : p === "malus" ? "var(--df-red)" : "var(--df-text-2)"

function ObjetDetailPage({ id, onSelect, onSelectDonjon, onSelectPanoplie, onSelectMonstre, onBack }) {
  const [data, setData] = useState(null)
  const [tip, setTip] = useState(null)

  useEffect(() => {
    setData(null); setTip(null)
    fetch(`${API}/objets/${id}`).then(r=>r.json()).then(setData)
  }, [id])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:"var(--df-text-2)", fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:"var(--df-text-2)", fontSize:14 }}>{data.erreur}</div>

  const paliers = data.panoplie
    ? Object.entries(data.panoplie.effets_par_palier).sort((a,b)=>Number(a[0])-Number(b[0]))
    : []

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem 3rem", maxWidth:1240, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      {data.categorie_nom && (
        <div style={{ fontSize:12.5, color:"var(--df-text-3)", marginBottom:18 }}>
          {data.categorie_nom} {data.type_nom && <>› {data.type_nom} </>}› <b style={{ color:"var(--df-text-2)", fontWeight:600 }}>{data.nom}</b>
        </div>
      )}

      <header className={"df-block" + (data.legendaire ? " df-block-leg" : "")} style={{ display:"flex", gap:22, alignItems:"center", flexWrap:"wrap", padding:24 }}>
        <div style={{ width:96, height:96, borderRadius:16, flexShrink:0, background:"rgba(12,15,29,0.8)", border:"1px solid rgba(255,198,61,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {data.img
            ? <img src={data.img} alt={data.nom} style={{ width:64, height:64, objectFit:"contain" }} />
            : null
          }
        </div>
        <div>
          <h1 className="df-title-gold" style={{ fontSize:"clamp(24px, 4vw, 32px)", margin:0, display:"inline" }}>
            {data.nom}
          </h1>
          {data.legendaire && <span className="df-tile-badge" style={{ marginLeft:12, fontSize:11, padding:"4px 12px" }}>LÉGENDAIRE</span>}
          <div style={{ color:"var(--df-text-2)", fontSize:14, marginTop:5 }}>
            Niv. {data.niveau}{data.type_nom ? ` — ${data.type_nom}` : ""}
          </div>
          {data.description && <div style={{ color:"#8B96B2", fontSize:13, fontStyle:"italic", marginTop:10, maxWidth:640 }}>{data.description}</div>}
        </div>
      </header>

      <div className="df-detail-wrap">
        {/* ---- Colonne principale ---- */}
        <div>
          {data.effects?.length > 0 && (
            <section className="df-block">
              <h2 className="df-block-title">Effets</h2>
              {data.effects.map((e,i) => (
                <div key={i} style={{ fontSize:15, padding:"5px 0", color:couleurPolarite(e.polarite) }}>{e.texte}</div>
              ))}
            </section>
          )}

          {data.legendaire && data.sort_accorde && (
            <section className="df-block df-block-leg">
              <h2 className="df-block-title">⭐ Sorts intégrés</h2>
              <div style={{ color:"var(--df-gold)", fontWeight:700, fontSize:15, marginBottom:6 }}>{data.sort_accorde.nom}</div>
              {data.sort_accorde.description && (
                <p style={{ color:"var(--df-text-2)", fontSize:13.5, lineHeight:1.5, whiteSpace:"pre-line", margin:0 }}>{data.sort_accorde.description}</p>
              )}
              {data.sort_accorde.effects?.length > 0 && (
                <div style={{ marginTop:8 }}>
                  {data.sort_accorde.effects.map((e,i) => (
                    <div key={i} style={{ fontSize:13.5, padding:"3px 0", color:couleurPolarite(e.polarite) }}>{e.texte}</div>
                  ))}
                </div>
              )}
            </section>
          )}

          {(data.obtention?.length > 0 || data.has_recipe) && (
            <section className="df-block">
              <h2 className="df-block-title">Obtention</h2>
              {data.obtention.map(o => (
                <div key={o.monstre_id} className="df-row" onClick={()=>onSelectMonstre(o.monstre_id)}>
                  {o.monstre_img
                    ? <img src={o.monstre_img} alt={o.monstre_nom} style={{ width:28, height:28, objectFit:"contain" }} />
                    : <div style={{ width:28, height:28, borderRadius:6, background:"var(--df-bg)" }} />
                  }
                  <span style={{ color:"var(--df-cyan)", fontWeight:600 }}>{o.monstre_nom}</span>
                  <span style={{ color:"var(--df-text-3)", fontSize:12.5, marginLeft:"auto" }}>{o.pourcentage}%</span>
                </div>
              ))}
              {data.obtention.length === 0 && data.has_recipe && (
                <div style={{ color:"var(--df-text-2)", fontSize:14 }}>Obtenu par artisanat — voir la recette ci-contre.</div>
              )}
            </section>
          )}
        </div>

        {/* ---- Colonne contextuelle ---- */}
        <div>
          {data.recette?.length > 0 && (
            <section className="df-block">
              <h2 className="df-block-title">Recette</h2>
              {data.recette.map((ing,i) => (
                <div key={i} className="df-row"
                  onMouseEnter={()=>setTip(i)} onMouseLeave={()=>setTip(null)}
                  onClick={()=> ing.ingredient_id && onSelect(ing.ingredient_id)}
                >
                  {ing.img
                    ? <img src={ing.img} alt={ing.nom} style={{ width:28, height:28, objectFit:"contain" }} />
                    : <div style={{ width:28, height:28, borderRadius:6, background:"var(--df-bg)" }} />
                  }
                  <span style={{ color:"var(--df-gold)", fontWeight:700, minWidth:34 }}>{ing.quantite} ×</span>
                  <span style={{ color:"var(--df-cyan)", fontWeight:600 }}>{ing.nom || `Objet #${ing.ingredient_id}`}</span>
                  {tip === i && (
                    <div className="df-tooltip" style={{ left:12, transform:"none", top:"calc(100% + 4px)" }}>
                      <div style={{ color:"var(--df-gold)", fontWeight:700, fontSize:14 }}>{ing.nom}</div>
                      <div style={{ color:"var(--df-text-2)", fontSize:12, margin:"3px 0 8px" }}>
                        {ing.type_nom || "Ressource"}{ing.niveau ? ` · Niv. ${ing.niveau}` : ""}
                      </div>
                      {ing.sources?.length > 0
                        ? <div style={{ color:"var(--df-text)", fontSize:12.5 }}>Droppé sur : {ing.sources.map(s=>s.monstre_nom).join(", ")}</div>
                        : <div style={{ color:"var(--df-text-3)", fontSize:11.5 }}>Source inconnue</div>
                      }
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {data.panoplie && (
            <section className="df-block">
              <h2 className="df-block-title" onClick={()=>onSelectPanoplie(data.panoplie.id)} style={{ cursor:"pointer", width:"fit-content" }}>
                {data.panoplie.nom}
              </h2>
              <div style={{ marginBottom:14 }}>
                {data.panoplie.membres.map(m => (
                  <span key={m.id} onClick={()=>onSelect(m.id)} className={"df-pill" + (m.id===data.id?" on":"")}>
                    {m.nom}
                  </span>
                ))}
              </div>
              {paliers.map(([palier, effets]) => (
                <div key={palier} style={{ display:"flex", gap:12, fontSize:13.5, padding:"6px 0", flexWrap:"wrap" }}>
                  <span style={{ color:"var(--df-gold)", fontWeight:700, minWidth:60 }}>{palier} pièce{Number(palier)>1?"s":""}</span>
                  <span>
                    {effets.map((e,i) => (
                      <span key={i} style={{ color:couleurPolarite(e.polarite) }}>{e.texte}{i<effets.length-1?" · ":""}</span>
                    ))}
                  </span>
                </div>
              ))}
            </section>
          )}

          {data.donjons_requis?.length > 0 && (
            <section className="df-block">
              <h2 className="df-block-title">Nécessaire pour</h2>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {data.donjons_requis.map(d => (
                  <span key={d.id} onClick={()=>onSelectDonjon(d.id)} className="df-pill">{d.nom}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function PanopliesPage({ onSelect, onBack }) {
  const [panoplies, setPanoplies] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [trancheNiveau, setTrancheNiveau] = useState("")
  const [sansNiveauDispo, setSansNiveauDispo] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/panoplies/filtres`).then(r=>r.json()).then(d => {
      setSansNiveauDispo(d.sans_niveau)
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const panopliesRequeteId = useRef(0)
  useEffect(() => {
    const requeteId = ++panopliesRequeteId.current
    setLoading(true)
    const params = new URLSearchParams({ search, type, tranche_niveau: trancheNiveau, page, page_size: PAGE_SIZE })
    fetch(`${API}/panoplies?${params}`)
      .then(r=>r.json())
      .then(d => {
        if (requeteId !== panopliesRequeteId.current) return
        setPanoplies(d.panoplies); setTotal(d.total); setLoading(false)
      })
      .catch(()=>{ if (requeteId === panopliesRequeteId.current) setLoading(false) })
  }, [search, type, trancheNiveau, page])

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const filtresActifs = search || type || trancheNiveau

  const reinitialiser = () => {
    setSearchInput(""); setSearch(""); setType(""); setTrancheNiveau(""); setPage(1)
  }

  return (
    <div style={mp.page}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={mp.filtreBar}>
        <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
          placeholder="Rechercher une panoplie..." style={mp.searchInput} />

        <select value={type} onChange={e=>{ setType(e.target.value); setPage(1) }} style={mp.select}>
          <option value="">Toutes</option>
          <option value="bonus">Avec bonus</option>
          <option value="cosmetique">Cosmétiques</option>
        </select>

        <select value={trancheNiveau} onChange={e=>{ setTrancheNiveau(e.target.value); setPage(1) }} style={mp.select}>
          <option value="">Tous niveaux</option>
          {TRANCHES_NIVEAU.map(tr => <option key={tr.valeur} value={tr.valeur}>{tr.label}</option>)}
          {sansNiveauDispo && <option value={SANS_VALEUR}>Sans niveau</option>}
        </select>

        {filtresActifs && <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser</button>}

        <span style={mp.compteur}>{total} panoplie{total!==1?"s":""}</span>
      </div>

      {!loading && panoplies.length === 0 ? (
        <div style={mp.videEtat}>
          Aucune panoplie ne correspond à ces filtres.
          {filtresActifs && <div style={{ marginTop:10 }}>
            <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser les filtres</button>
          </div>}
        </div>
      ) : (
        <div style={mp.grid}>
          {panoplies.map(p => (
            <div key={p.id} onClick={()=>onSelect(p.id)} style={mp.card}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.bdr}
            >
              {p.img
                ? <img src={p.img} alt={p.nom} style={mp.cardImg} />
                : <div style={mp.cardImgVide} />
              }
              <div style={mp.cardNom}>{p.nom}</div>
              <div style={mp.cardFamille}>
                Niv. {p.niveau} — {p.nb_objets} pièce{p.nb_objets!==1?"s":""}{p.cosmetique?" · Cosmétique":""}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={mp.pagination}>
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={mp.pageBtn(page<=1)}>← Précédent</button>
          <span style={mp.pageLabel}>Page {page} / {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={mp.pageBtn(page>=totalPages)}>Suivant →</button>
        </div>
      )}
    </div>
  )
}

function PanoplieDetailPage({ id, onSelectObjet, onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(null)
    fetch(`${API}/panoplies/${id}`).then(r=>r.json()).then(setData)
  }, [id])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>{data.erreur}</div>

  const couleurPolarite = (p) => p === "bonus" ? C.green : p === "malus" ? C.red : C.txt
  const paliers = Object.entries(data.effets_par_palier).sort((a,b)=>Number(a[0])-Number(b[0]))

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem", maxWidth:900, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr2}`, borderRadius:12, padding:"18px 20px", display:"grid", gridTemplateColumns:"100px 1fr", gap:20, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-start" }}>
          {data.img
            ? <img src={data.img} alt={data.nom} style={{ width:90, height:90, objectFit:"contain" }} />
            : <div style={{ width:90, height:90, background:C.bg3, borderRadius:8 }} />
          }
        </div>
        <div>
          <h2 style={{ fontSize:20, fontWeight:500, color:C.gold2, marginBottom:4 }}>{data.nom}</h2>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>Niv. {data.niveau}</span>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.membres.length} pièce{data.membres.length!==1?"s":""}</span>
            {data.cosmetique && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.goldf, border:`0.5px solid ${C.goldb}`, color:C.gold }}>Cosmétique</span>}
          </div>
        </div>
      </div>

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
        <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Objets de la panoplie</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {data.membres.map(m => (
            <div key={m.id} onClick={()=>onSelectObjet(m.id)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:6, cursor:"pointer",
                background:C.bg4, border:`0.5px solid ${C.bdr}` }}
            >
              {m.img
                ? <img src={m.img} alt={m.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                : <div style={{ width:22, height:22, background:C.bg3, borderRadius:4 }} />
              }
              <span style={{ fontSize:12, color:C.txt }}>{m.nom}</span>
            </div>
          ))}
        </div>
      </div>

      {paliers.length > 0 ? (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Bonus par palier</div>
          {paliers.map(([palier, effets]) => (
            <div key={palier} style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, color:C.prp2, marginBottom:3 }}>{palier} pièce{Number(palier)>1?"s":""}</div>
              {effets.map((e,i) => (
                <div key={i} style={{ fontSize:12, color:couleurPolarite(e.polarite), paddingLeft:10 }}>{e.texte}</div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize:12, color:C.txt3, padding:"8px 4px" }}>Panoplie cosmétique, sans bonus statistique.</div>
      )}
    </div>
  )
}

const DIFFICULTE_ETOILES = (n) => "★".repeat(Math.max(n, 0)) + "☆".repeat(Math.max(4 - n, 0))

function DonjonsPage({ onSelect, onBack }) {
  const [donjons, setDonjons] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [zone, setZone] = useState("")
  const [zones, setZones] = useState([])
  const [sansZoneDispo, setSansZoneDispo] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/donjons/filtres`).then(r=>r.json()).then(d => {
      setZones(d.zones); setSansZoneDispo(d.sans_zone)
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const donjonsRequeteId = useRef(0)
  useEffect(() => {
    const requeteId = ++donjonsRequeteId.current
    setLoading(true)
    const params = new URLSearchParams({ search, zone, page, page_size: PAGE_SIZE })
    fetch(`${API}/donjons?${params}`)
      .then(r=>r.json())
      .then(d => {
        if (requeteId !== donjonsRequeteId.current) return
        setDonjons(d.donjons); setTotal(d.total); setLoading(false)
      })
      .catch(()=>{ if (requeteId === donjonsRequeteId.current) setLoading(false) })
  }, [search, zone, page])

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const filtresActifs = search || zone

  const reinitialiser = () => {
    setSearchInput(""); setSearch(""); setZone(""); setPage(1)
  }

  return (
    <div style={mp.page}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={mp.filtreBar}>
        <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
          placeholder="Rechercher un donjon..." style={mp.searchInput} />

        <select value={zone} onChange={e=>{ setZone(e.target.value); setPage(1) }} style={mp.select}>
          <option value="">Toutes les zones</option>
          {sansZoneDispo && <option value={SANS_VALEUR}>Sans zone</option>}
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        {filtresActifs && <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser</button>}

        <span style={mp.compteur}>{total} donjon{total!==1?"s":""}</span>
      </div>

      {!loading && donjons.length === 0 ? (
        <div style={mp.videEtat}>
          Aucun donjon ne correspond à ces filtres.
          {filtresActifs && <div style={{ marginTop:10 }}>
            <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser les filtres</button>
          </div>}
        </div>
      ) : (
        <div style={mp.grid}>
          {donjons.map(d => (
            <div key={d.id} onClick={()=>onSelect(d.id)} style={mp.card}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.bdr}
            >
              {d.boss_img
                ? <img src={d.boss_img} alt={d.boss_nom} style={mp.cardImg} />
                : <div style={mp.cardImgVide} />
              }
              <div style={mp.cardNom}>{d.nom}</div>
              <div style={mp.cardFamille}>Niv. {d.niveau_min}-{d.niveau_optimal} — {d.zone || "—"}</div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={mp.pagination}>
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={mp.pageBtn(page<=1)}>← Précédent</button>
          <span style={mp.pageLabel}>Page {page} / {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={mp.pageBtn(page>=totalPages)}>Suivant →</button>
        </div>
      )}
    </div>
  )
}

function DonjonDetailPage({ id, onSelectMonstre, onSelectObjet, onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(null)
    fetch(`${API}/donjons/${id}`).then(r=>r.json()).then(setData)
  }, [id])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>{data.erreur}</div>

  const acces = []
  if (data.recherche_groupe) acces.push("Recherche de groupe")
  if (data.disponible_hall) acces.push("Hall des Souvenirs")
  if (data.disponible_trousseau) acces.push("Trousseau")

  const aGuide = data.guide && (data.guide.mecaniques?.length > 0 || data.guide.salles?.length > 0 || data.guide.compo_conseillee)

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem", maxWidth:900, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr2}`, borderRadius:12, padding:"18px 20px", display:"grid", gridTemplateColumns:"100px 1fr", gap:20, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-start" }}>
          {data.boss_principal?.img
            ? <img src={data.boss_principal.img} alt={data.nom} style={{ width:90, height:90, objectFit:"contain" }} />
            : <div style={{ width:90, height:90, background:C.bg3, borderRadius:8 }} />
          }
        </div>
        <div>
          <h2 style={{ fontSize:20, fontWeight:500, color:C.gold2, marginBottom:4 }}>{data.nom}</h2>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>Niv. {data.niveau_min}-{data.niveau_optimal}</span>
            {data.zone && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.zone}</span>}
            {data.difficulte > 0 && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.goldf, border:`0.5px solid ${C.goldb}`, color:C.gold }}>{DIFFICULTE_ETOILES(data.difficulte)}</span>}
          </div>
          {acces.length > 0 && <div style={{ fontSize:12, color:C.txt2 }}>Accès : {acces.join(" · ")}</div>}
        </div>
      </div>

      {data.objets_requis?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Accès / Clé requise</div>
          {data.objets_requis.map((o,i) => (
            <div key={i} onClick={()=>o.id && onSelectObjet(o.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", cursor:o.id?"pointer":"default" }}>
              {o.img
                ? <img src={o.img} alt={o.nom} style={{ width:24, height:24, objectFit:"contain" }} />
                : <div style={{ width:24, height:24, background:C.bg4, borderRadius:4 }} />
              }
              <span style={{ fontSize:12, color:o.id?C.cyan:C.txt }}>{o.nom || `Objet #${o.id}`}</span>
              <span style={{ fontSize:12, color:C.gold, marginLeft:"auto" }}>x{o.quantite}</span>
            </div>
          ))}
        </div>
      )}

      {aGuide && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Guide du boss</div>
          {data.guide.mecaniques?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              {data.guide.mecaniques.map((m,i) => (
                <div key={i} style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ color:C.prp2, fontSize:9, flexShrink:0 }}>◆</span> {m}
                </div>
              ))}
            </div>
          )}
          {data.guide.salles?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:C.prp2, marginBottom:4 }}>Monstres par salle</div>
              {data.guide.salles.map((s,i) => (
                <div key={i} style={{ fontSize:12, color:C.txt2, paddingLeft:10, marginBottom:2 }}>
                  <span style={{ color:C.txt }}>{s.salle}</span> — {(s.monstres||[]).join(", ")}
                </div>
              ))}
            </div>
          )}
          {data.guide.compo_conseillee && (
            <div style={{ fontSize:12, color:C.txt2 }}>
              <span style={{ color:C.prp2 }}>Composition conseillée : </span>{data.guide.compo_conseillee}
            </div>
          )}
        </div>
      )}

      {data.monstres?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Monstres du donjon</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {data.monstres.map(m => (
              <div key={m.id} onClick={()=>onSelectMonstre(m.id)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:6, cursor:"pointer",
                  background:m.est_boss?C.goldf:C.bg4, border:`0.5px solid ${m.est_boss?C.goldb:C.bdr}` }}
              >
                {m.img
                  ? <img src={m.img} alt={m.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                  : <div style={{ width:22, height:22, background:C.bg3, borderRadius:4 }} />
                }
                <span style={{ fontSize:12, color:m.est_boss?C.gold:C.txt }}>{m.nom}{m.est_boss?" (Boss)":""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.drops?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Drops</div>
          {data.drops.map((d,i) => (
            <div key={i} onClick={()=>d.objet_id && onSelectObjet(d.objet_id)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", cursor:d.objet_id?"pointer":"default" }}>
              {d.img
                ? <img src={d.img} alt={d.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                : <div style={{ width:22, height:22, background:C.bg4, borderRadius:4 }} />
              }
              <span style={{ fontSize:12, color:d.objet_id?C.cyan:C.txt }}>{d.nom}</span>
              <span style={{ fontSize:11, color:C.txt3, marginLeft:"auto" }}>{d.pourcentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RegionsPage({ onSelect, onSelectSousZone, onBack }) {
  const [regions, setRegions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [sousZones, setSousZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const regionsRequeteId = useRef(0)
  useEffect(() => {
    const requeteId = ++regionsRequeteId.current
    setLoading(true)
    const params = new URLSearchParams({ search, page, page_size: PAGE_SIZE })
    fetch(`${API}/zones?${params}`)
      .then(r=>r.json())
      .then(d => {
        if (requeteId !== regionsRequeteId.current) return
        setRegions(d.regions); setTotal(d.total); setLoading(false)
      })
      .catch(()=>{ if (requeteId === regionsRequeteId.current) setLoading(false) })
  }, [search, page])

  // Recherche globale sous-zones (en plus du filtre sur la grille regions) :
  // sans elle, les 2 sous-zones orphelines (sans region resolue, voir
  // CLAUDE.md chantier Zones) seraient introuvables.
  useEffect(() => {
    if (!search) { setSousZones([]); return }
    fetch(`${API}/sous-zones?search=${encodeURIComponent(search)}&limite=8`)
      .then(r=>r.json())
      .then(d => setSousZones(d.sous_zones))
      .catch(()=>{})
  }, [search])

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const filtresActifs = !!search

  const reinitialiser = () => { setSearchInput(""); setSearch(""); setPage(1) }

  return (
    <div style={mp.page}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={mp.filtreBar}>
        <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
          placeholder="Rechercher une région ou une sous-zone..." style={mp.searchInput} />

        {filtresActifs && <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser</button>}

        <span style={mp.compteur}>{total} région{total!==1?"s":""}</span>
      </div>

      {sousZones.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Sous-zones correspondantes</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {sousZones.map(z => (
              <div key={z.nom} onClick={()=>onSelectSousZone(z.nom)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:6, cursor:"pointer",
                  background:C.bg4, border:`0.5px solid ${C.bdr}` }}>
                {z.img
                  ? <img src={z.img} alt={z.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                  : <div style={{ width:22, height:22, background:C.bg3, borderRadius:4 }} />
                }
                <span style={{ fontSize:12, color:C.txt }}>{z.nom}</span>
                {z.area && <span style={{ fontSize:10, color:C.txt3 }}>({z.area})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && regions.length === 0 ? (
        <div style={mp.videEtat}>
          Aucune région ne correspond à ces filtres.
          {filtresActifs && <div style={{ marginTop:10 }}>
            <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser les filtres</button>
          </div>}
        </div>
      ) : (
        <div style={mp.grid}>
          {regions.map(r => (
            <div key={r.nom} onClick={()=>onSelect(r.nom)} style={mp.card}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.bdr}
            >
              {r.img
                ? <img src={r.img} alt={r.nom} style={mp.cardImg} />
                : <div style={mp.cardImgVide} />
              }
              <div style={mp.cardNom}>{r.nom}</div>
              <div style={mp.cardFamille}>{r.nb_sous_zones} sous-zone{r.nb_sous_zones!==1?"s":""} — {r.nb_donjons} donjon{r.nb_donjons!==1?"s":""}</div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={mp.pagination}>
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={mp.pageBtn(page<=1)}>← Précédent</button>
          <span style={mp.pageLabel}>Page {page} / {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={mp.pageBtn(page>=totalPages)}>Suivant →</button>
        </div>
      )}
    </div>
  )
}

function RegionDetailPage({ nom, onSelectSousZone, onSelectDonjon, onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(null)
    fetch(`${API}/zones/${encodeURIComponent(nom)}`).then(r=>r.json()).then(setData)
  }, [nom])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>{data.erreur}</div>

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem", maxWidth:900, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr2}`, borderRadius:12, padding:"18px 20px", display:"grid", gridTemplateColumns:"100px 1fr", gap:20, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-start" }}>
          {data.img
            ? <img src={data.img} alt={data.nom} style={{ width:90, height:90, objectFit:"contain" }} />
            : <div style={{ width:90, height:90, background:C.bg3, borderRadius:8 }} />
          }
        </div>
        <div>
          <h2 style={{ fontSize:20, fontWeight:500, color:C.gold2, marginBottom:4 }}>{data.nom}</h2>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.sous_zones.length} sous-zone{data.sous_zones.length!==1?"s":""}</span>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>{data.donjons.length} donjon{data.donjons.length!==1?"s":""}</span>
          </div>
        </div>
      </div>

      {data.donjons.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Donjons</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {data.donjons.map(d => (
              <span key={d.id} onClick={()=>onSelectDonjon(d.id)}
                style={{ fontSize:11, padding:"3px 9px", borderRadius:6, cursor:"pointer",
                  background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>
                {d.nom} <span style={{ color:C.txt3 }}>(niv. {d.niveau_min}-{d.niveau_optimal})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
        <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Sous-zones</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {data.sous_zones.map(z => (
            <div key={z.nom} onClick={()=>onSelectSousZone(z.nom)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:6, cursor:"pointer",
                background:C.bg4, border:`0.5px solid ${C.bdr}` }}>
              {z.img
                ? <img src={z.img} alt={z.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                : <div style={{ width:22, height:22, background:C.bg3, borderRadius:4 }} />
              }
              <span style={{ fontSize:12, color:C.txt }}>{z.nom}</span>
              <span style={{ fontSize:11, color:C.txt3 }}>Niv. {z.niveau_min}-{z.niveau_max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SousZoneDetailPage({ nom, onSelectRegion, onSelectMonstre, onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(null)
    fetch(`${API}/sous-zones/${encodeURIComponent(nom)}`).then(r=>r.json()).then(setData)
  }, [nom])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>{data.erreur}</div>

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem", maxWidth:900, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr2}`, borderRadius:12, padding:"18px 20px", marginBottom:16 }}>
        <h2 style={{ fontSize:20, fontWeight:500, color:C.gold2, marginBottom:4 }}>{data.nom}</h2>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {data.niveau_min != null && (
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt2 }}>Niv. {data.niveau_min}-{data.niveau_max}</span>
          )}
          {data.area ? (
            <span onClick={()=>onSelectRegion(data.area)}
              style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.cyanf, border:`0.5px solid ${C.cyanb}`, color:C.cyan, cursor:"pointer" }}>
              {data.area}
            </span>
          ) : (
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:C.bg4, border:`0.5px solid ${C.bdr}`, color:C.txt3 }}>Région inconnue</span>
          )}
        </div>
      </div>

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px" }}>
        <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Monstres</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {data.monstres.map(m => (
            <div key={m.id} onClick={()=>onSelectMonstre(m.id)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:6, cursor:"pointer",
                background:C.bg4, border:`0.5px solid ${C.bdr}` }}>
              {m.img
                ? <img src={m.img} alt={m.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                : <div style={{ width:22, height:22, background:C.bg3, borderRadius:4 }} />
              }
              <span style={{ fontSize:12, color:C.txt }}>{m.nom}</span>
              <span style={{ fontSize:11, color:C.txt3 }}>Niv. {m.niveau_base}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [query, setQuery]       = useState("")
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [selectedMonstre, setSelectedMonstre]   = useState(null)
  const [selectedObjet, setSelectedObjet]       = useState(null)
  const [selectedDonjon, setSelectedDonjon]     = useState(null)
  const [selectedPanoplie, setSelectedPanoplie] = useState(null)
  const [selectedRegion, setSelectedRegion]     = useState(null)
  const [selectedSousZone, setSelectedSousZone] = useState(null)
  const [browsing, setBrowsing] = useState(null) // null | "monstres" | "equipement" | "ressource" | "donjon" | "panoplie" | "zone"
  const [almanax, setAlmanax]   = useState(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`${API}/monstres?search=${encodeURIComponent(query)}&page_size=8`)
        .then(r=>r.json())
        .then(d=>{ setResults(d.monstres); setLoading(false) })
        .catch(()=>setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const today = new Date().toISOString().slice(0,10)
    fetch(`https://api.dofusdb.fr/almanax/${today}?lang=fr`)
      .then(r=>r.json()).then(setAlmanax).catch(()=>{})
  }, [])

  const resetNav = () => { setSelectedMonstre(null); setSelectedObjet(null); setSelectedDonjon(null); setSelectedPanoplie(null); setSelectedRegion(null); setSelectedSousZone(null); setBrowsing(null); setQuery(""); setResults([]) }
  const handleSelectMonstre  = (id) => { resetNav(); setSelectedMonstre(id) }
  const handleSelectObjet    = (id) => { resetNav(); setSelectedObjet(id) }
  const handleSelectDonjon   = (id) => { resetNav(); setSelectedDonjon(id) }
  const handleSelectPanoplie = (id) => { resetNav(); setSelectedPanoplie(id) }
  const handleSelectRegion   = (nom) => { resetNav(); setSelectedRegion(nom) }
  const handleSelectSousZone = (nom) => { resetNav(); setSelectedSousZone(nom) }
  const handleHome          = () => { resetNav() }
  const handleNav            = (cible) => { resetNav(); setBrowsing(cible) }

  return (
    <div translate="no" style={{ position:"relative", minHeight:"100vh", overflow:"hidden", background:"var(--df-bg)", display:"flex", flexDirection:"column" }}>
      {/* Fond Krosmoz : absolute (jamais fixed, voir CLAUDE.md piège fantômes de texte au scroll) */}
      <div className="df-nebula" />
      <StarField />
      <div style={{ position:"absolute", inset:0, background:"rgba(12,15,29,0.32)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", flex:1 }}>
        <AlmanaxBanner data={almanax} />
        <Navbar onHome={handleHome} onNav={handleNav} browsing={browsing} />
        <StatsBar />
        <div style={{ flex:1 }}>
      {selectedMonstre ? (
        <MonstrePage id={selectedMonstre} onSelectDonjon={handleSelectDonjon} onBack={handleHome} />
      ) : selectedObjet ? (
        <ObjetDetailPage id={selectedObjet} onSelect={handleSelectObjet} onSelectDonjon={handleSelectDonjon} onSelectPanoplie={handleSelectPanoplie} onSelectMonstre={handleSelectMonstre} onBack={handleHome} />
      ) : selectedDonjon ? (
        <DonjonDetailPage id={selectedDonjon} onSelectMonstre={handleSelectMonstre} onSelectObjet={handleSelectObjet} onBack={handleHome} />
      ) : selectedPanoplie ? (
        <PanoplieDetailPage id={selectedPanoplie} onSelectObjet={handleSelectObjet} onBack={handleHome} />
      ) : selectedSousZone ? (
        <SousZoneDetailPage nom={selectedSousZone} onSelectRegion={handleSelectRegion} onSelectMonstre={handleSelectMonstre} onBack={handleHome} />
      ) : selectedRegion ? (
        <RegionDetailPage nom={selectedRegion} onSelectSousZone={handleSelectSousZone} onSelectDonjon={handleSelectDonjon} onBack={handleHome} />
      ) : browsing === "monstres" ? (
        <MonstresPage onSelect={handleSelectMonstre} onBack={handleHome} />
      ) : browsing === "donjon" ? (
        <DonjonsPage onSelect={handleSelectDonjon} onBack={handleHome} />
      ) : browsing === "panoplie" ? (
        <PanopliesPage onSelect={handleSelectPanoplie} onBack={handleHome} />
      ) : browsing === "zone" ? (
        <RegionsPage onSelect={handleSelectRegion} onSelectSousZone={handleSelectSousZone} onBack={handleHome} />
      ) : browsing === "equipement" ? (
        <ObjetsPage categorie="equipement" titre="Équipements"
          placeholder="Rechercher un équipement..."
          videMessage="Aucun équipement ne correspond à ces filtres."
          compteurSingulier="équipement" compteurPluriel="équipements"
          onSelect={handleSelectObjet} onBack={handleHome} />
      ) : browsing === "ressource" ? (
        <ObjetsPage categorie="ressource" titre="Ressources"
          placeholder="Rechercher une ressource..."
          videMessage="Aucune ressource ne correspond à ces filtres."
          compteurSingulier="ressource" compteurPluriel="ressources"
          onSelect={handleSelectObjet} onBack={handleHome} />
      ) : (
        <>
          <Hero query={query} setQuery={setQuery} results={results} onSelect={handleSelectMonstre} loading={loading} />
          <EncycloGrid onNav={handleNav} />
        </>
      )}
        </div>
        <Footer />
      </div>
    </div>
  )
}
