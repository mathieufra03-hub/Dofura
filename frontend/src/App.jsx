import { useState, useEffect } from "react"

const API = "https://web-production-53f2b.up.railway.app"

const ELEM = [
  { key: "res_neutre", label: "Neutre", dot: "#B4B2A9" },
  { key: "res_terre",  label: "Terre",  dot: "#639922" },
  { key: "res_feu",    label: "Feu",    dot: "#D85A30" },
  { key: "res_eau",    label: "Eau",    dot: "#378ADD" },
  { key: "res_air",    label: "Air",    dot: "#1D9E75" },
]

const C = {
  bg:     "#1a1208",
  bg2:    "#241a08",
  border: "#3d2e0e",
  gold:   "#c9a84c",
  text:   "#e8d5a3",
  muted:  "#8a7540",
  green:  "#7fbf7f",
  red:    "#e05555",
}

function Navbar({ onHome }) {
  return (
    <nav style={{ background: "#0f0a04", borderBottom: `1px solid ${C.border}`, padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
      <div onClick={onHome} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.gold, fontSize: 18, fontWeight: 700 }}>•</span>
        <span style={{ color: C.gold, fontSize: 16, fontWeight: 700, letterSpacing: 2, fontFamily: "Georgia, serif" }}>DOFURA</span>
      </div>
      <div style={{ display: "flex", gap: 28, fontFamily: "sans-serif", fontSize: 13 }}>
        {["Monstres", "Quêtes", "Items", "Classes", "Succès", "Carte", "Almanax"].map(n => (
          <span key={n} style={{ cursor: "pointer", color: C.muted }}
            onMouseEnter={e => e.target.style.color = C.gold}
            onMouseLeave={e => e.target.style.color = C.muted}>
            {n}
          </span>
        ))}
        <span style={{ background: C.gold, color: "#0f0a04", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Aujourd\'hui</span>
      </div>
    </nav>
  )
}

function StatsBand() {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e5e0d5", padding: "10px 2rem", display: "flex", justifyContent: "center", gap: 48, fontFamily: "sans-serif" }}>
      {[["4 932", "monstres"], ["4 210", "quêtes"], ["18 900", "items"], ["18", "classes"], ["1 430", "succès"]].map(([n, l]) => (
        <span key={l} style={{ fontSize: 13, color: "#666" }}>
          <span style={{ color: C.gold, fontWeight: 700, fontSize: 15 }}>{n}</span> {l}
        </span>
      ))}
    </div>
  )
}

function Hero({ onSelect }) {
  const [val, setVal] = useState("")
  const [resultats, setResultats] = useState([])
  const suggestions = ["Bouftou", "Dofus Turquoise", "Iop", "Donjon Larves", "Panoplie Kolosso"]

  useEffect(() => {
    if (val.length < 1) { setResultats([]); return }
    fetch(`${API}/monstres?search=${val}`)
      .then(r => r.json())
      .then(setResultats)
  }, [val])

  return (
    <div style={{ background: C.bg, padding: "80px 2rem 60px", textAlign: "center" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: C.gold, fontFamily: "sans-serif", marginBottom: 20, textTransform: "uppercase" }}>
        Encyclopédie complète — Dofus 3.x
      </div>
      <h1 style={{ fontSize: 52, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1.15, marginBottom: 20, textTransform: "uppercase" }}>
        Tout l\'univers <span style={{ color: C.gold }}>Dofus</span>,<br />en un seul endroit.
      </h1>
      <p style={{ color: C.muted, fontSize: 16, fontFamily: "sans-serif", marginBottom: 36, lineHeight: 1.7 }}>
        Monstres, quêtes, items, classes, succès — fusionnés depuis<br />les meilleures sources. Toujours à jour.
      </p>

      <div style={{ maxWidth: 620, margin: "0 auto 20px", position: "relative" }}>
        <div style={{ display: "flex", background: "#fff", borderRadius: resultats.length > 0 ? "8px 8px 0 0" : 8, overflow:"hidden", border: "2px solid #fff" }}>
          <span style={{ padding: "0 14px", display: "flex", alignItems: "center", color: "#378ADD", fontSize: 18 }}>🔍</span>
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="Cherche un monstre, une quête, un item..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, padding: "14px 0", fontFamily: "sans-serif", color: "#333" }}
          />
          {val && (
            <button onClick={() => { setVal(""); setResultats([]) }} style={{ background: "none", border: "none", color: "#aaa", fontSize: 18, cursor: "pointer", padding: "0 12px" }}>✕</button>
          )}
        </div>

        {resultats.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderRadius: "0 0 8px 8px", borderTop: "1px solid #eee", maxHeight: 320, overflowY: "auto", zIndex: 50, textAlign: "left", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            {resultats.slice(0, 12).map(m => (
              <div key={m.id} onClick={() => { onSelect(m.id); setVal(""); setResultats([]) }}
                style={{ padding: "10px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5px solid #f0ebe0", fontFamily: "sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background = "#faf5e8"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {m.image_url && (
                    <img src={m.image_url} alt={m.nom} style={{ width: 32, height: 32, objectFit: "contain" }} />
                  )}
                  <div>
                    <span style={{ fontWeight: 500, color: "#1a1208", fontSize: 14 }}>{m.nom}</span>
                    <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>{m.race}</span>
                  </div>
                </div>
                <span style={{ color: C.gold, fontSize: 12 }}>→</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {suggestions.map(s => (
          <span key={s} style={{ fontSize: 12, padding: "4px 14px", borderRadius: 20, background: "#ffffff15", color: C.muted, border: `0.5px solid ${C.border}`, cursor: "pointer", fontFamily: "sans-serif" }}
            onMouseEnter={e => e.target.style.color = C.gold}
            onMouseLeave={e => e.target.style.color = C.muted}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function Almanax() {
  return (
    <div style={{ background: "#f5f0e8", padding: "40px 2rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 36 }}>📅</div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 4 }}>Almanax du jour — 24 juin</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: "Georgia, serif", marginBottom: 4 }}>Offrande : 3× Plume de Bouftou Royal</div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "sans-serif" }}>Bonus : +50% XP en donjon pendant 24h — Autel de Xélorium</div>
          </div>
        </div>
        <button style={{ background: C.gold, border: "none", color: "#0f0a04", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
          Voir l\'Almanax →
        </button>
      </div>
    </div>
  )
}

function MonstrePage({ monstre, onBack }) {
  const [grade, setGrade] = useState(0)
  const g = monstre.grades[grade]

  return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        <div style={{ fontSize: 12, color: "#888", marginBottom: 16, fontFamily: "sans-serif" }}>
          <span style={{ color: C.gold, cursor: "pointer" }} onClick={onBack}>← Retour</span>
        </div>

        {/* HEADER MONSTRE */}
        <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 20 }}>

          {/* IMAGE */}
          <div style={{ width: 100, height: 100, background: "#f0ebe0", border: `0.5px solid ${C.border}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {monstre.image_url ? (
              <img src={monstre.image_url} alt={monstre.nom} style={{ width: 90, height: 90, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 40 }}>👾</span>
            )}
          </div>

          {/* NOM + TAGS */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: "Georgia, serif" }}>{monstre.nom}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: "#3d2e0e", color: C.gold, border: `0.5px solid #5a4418`, fontFamily: "sans-serif" }}>{monstre.race}</span>
              {monstre.zones.map((z, i) => (
                <span key={i} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: "#1e1a10", color: C.muted, border: `0.5px solid #3d3010`, fontFamily: "sans-serif" }}>{z.nom}</span>
              ))}
              {monstre.famille && (
                <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: "#2a200a", color: C.gold, border: `0.5px solid #5a4418`, fontFamily: "sans-serif" }}>🏰 {monstre.famille}</span>
              )}
            </div>

            {/* GRADES */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {monstre.grades.map((gr, i) => (
                <button key={i} onClick={() => setGrade(i)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, border: `0.5px solid ${C.border}`, background: grade === i ? C.gold : C.bg, color: grade === i ? "#0f0a04" : C.muted, cursor: "pointer", fontFamily: "sans-serif", fontWeight: grade === i ? 700 : 400 }}>
                  Niv. {gr.niveau}
                </button>
              ))}
            </div>

            {/* STATS */}
            {g && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, marginBottom: 5 }}>
                  {[
                    ["❤ PV",      g.pv],
                    ["⚡ PA",      g.pa],
                    ["👟 PM",      g.pm],
                    ["✨ XP",      g.xp?.toLocaleString("fr-FR")],
                    ["🥾 Tacle",   monstre.tacle],
                    ["🚪 Fuite",   monstre.fuite],
                    ["🛡 Esq.PA",  g.esquive_pa],
                    ["🛡 Esq.PM",  g.esquive_pm],
                  ].map(([label, val], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", fontFamily: "sans-serif" }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* RESISTANCES */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
                  {ELEM.map(e => {
                    const v = g[e.key]
                    const color = v < 0 ? C.red : v === 0 ? C.muted : C.green
                    return (
                      <div key={e.key} style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.dot, flexShrink: 0, display: "inline-block" }}></span>
                        <span style={{ fontSize: 12, fontWeight: 500, color, fontFamily: "sans-serif" }}>{v > 0 ? "+" : ""}{v}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* SORTS */}
        <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: `0.5px solid ${C.border}`, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1.5px", color: C.gold, fontFamily: "sans-serif" }}>Sorts</div>
          <div style={{ padding: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {monstre.sorts.map((s, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.text, fontFamily: "sans-serif" }}>
                <div style={{ width: 26, height: 26, borderRadius: 4, background: C.bg2, border: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔮</div>
                {s.nom}
              </div>
            ))}
          </div>
        </div>

        {/* DROPS */}
        <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: `0.5px solid ${C.border}`, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1.5px", color: C.gold, fontFamily: "sans-serif" }}>Drops</div>
          <div style={{ padding: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {monstre.drops.map((d, i) => {
              const pct = parseFloat(d.pourcentage)
              const color = pct >= 50 ? C.green : pct >= 5 ? C.gold : C.muted
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 70 }}>
                  <div style={{ width: 54, height: 54, background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎁</div>
                  <span style={{ fontSize: 12, fontWeight: 500, color, fontFamily: "sans-serif" }}>{pct}%</span>
                  <span style={{ fontSize: 10, color: "#6a5a30", textAlign: "center", lineHeight: 1.3, fontFamily: "sans-serif" }}>{d.nom}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState("home")
  const [monstre, setMonstre] = useState(null)

  function ouvrirMonstre(id) {
    fetch(`${API}/monstres/${id}`)
      .then(r => r.json())
      .then(m => { setMonstre(m); setPage("monstre") })
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Navbar onHome={() => setPage("home")} />
      <StatsBand />
      {page === "home" && (
        <>
          <Hero onSelect={ouvrirMonstre} />
          <Almanax />
        </>
      )}
      {page === "monstre" && monstre && (
        <MonstrePage monstre={monstre} onBack={() => setPage("home")} />
      )}
    </div>
  )
}