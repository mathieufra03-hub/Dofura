import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"

// Navbar (extraction du 18 août 2026, refonte 3 sections/dropdowns) —
// composant autonome comme les pages (frontend/src/pages/*.jsx) : son
// propre API, ses propres sous-composants. LoginPanel, MonComptePanel,
// NavSearch, DiscordLink, IconeDiscord vivent ici et nulle part ailleurs
// dans App.jsx avant cette extraction (vérifié : aucun autre point
// d'appel) — déplacés en bloc plutôt que dupliqués. IconeCompte n'a pas
// été repris : l'avatar (initiale du pseudo, carré arrondi violet) remplace
// l'icône+"Mon compte" de l'ancienne Navbar.
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

// Routes des 3 sections. "Sorts de Songe" pointe vers /bibliotheque (pas de
// route dédiée /sorts-de-songe pour l'instant — la section correspondante de
// /comprendre est elle-même masquée tant que les données ne sont pas
// scrapées, voir ComprendrePage.jsx/SORTS_DE_SONGE) : les deux liens du
// bloc Bibliothèque pointent donc temporairement au même endroit, à séparer
// le jour où les sorts de songe ont leur propre vue.
const SECTIONS = [
  {
    id: "outils", label: "Les outils", couleur: "#F0C040", icone: "⚙",
    liens: [
      { label: "L'Œil", to: "/songes" },
      { label: "Les Taux", to: "/taux" },
      { label: "Historique du Songeur", to: "/historique" },
    ],
  },
  {
    id: "bibliotheque", label: "La Bibliothèque", couleur: "#2CE7FF", icone: "📖",
    liens: [
      { label: "Bestiaire", to: "/bibliotheque" },
      { label: "Sorts de Songe", to: "/bibliotheque" },
    ],
  },
]
const COMPRENDRE = { label: "Comprendre", couleur: "#C478FF", icone: "✦", to: "/comprendre" }

function LoginPanel({ onLogin, onClose }) {
  const [identifiant, setIdentifiant] = useState("")
  const [password, setPassword] = useState("")
  const [erreur, setErreur] = useState("")
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const connecter = () => {
    if (!identifiant || !password) return
    setLoading(true); setErreur("")
    fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifiant, password }) })
      .then(async r => {
        if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || "Erreur de connexion") }
        return r.json()
      })
      .then(d => onLogin(d.token))
      .catch(e => { setErreur(e.message); setLoading(false) })
  }

  const connexionTest = () => {
    setLoading(true); setErreur("")
    fetch(`${API}/auth/dev-login`, { method: "POST" })
      .then(r => r.json())
      .then(d => onLogin(d.token))
      .catch(() => { setErreur("Compte de test indisponible"); setLoading(false) })
  }

  const champStyle = { width: "100%", boxSizing: "border-box", background: "rgba(20,26,46,0.9)", border: "1px solid rgba(77,216,230,0.3)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--df-text)", outline: "none", marginBottom: 8 }

  return (
    <div ref={ref} style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280, background: "var(--df-panel-bg)", border: "1px solid rgba(255,198,61,0.3)", borderRadius: 12, boxShadow: "0 14px 34px rgba(0,0,0,0.6)", padding: 18, zIndex: 200, textAlign: "left" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--df-gold)", textTransform: "uppercase", marginBottom: 12 }}>Connexion</div>
      <input value={identifiant} onChange={e => setIdentifiant(e.target.value)} placeholder="Pseudo ou email" style={champStyle} />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Mot de passe"
        onKeyDown={e => { if (e.key === "Enter") connecter() }} style={{ ...champStyle, marginBottom: 10 }} />
      {erreur && <div style={{ color: "var(--df-red)", fontSize: 12, marginBottom: 8 }}>{erreur}</div>}
      <button disabled={loading || !identifiant || !password} onClick={connecter}
        style={{ width: "100%", background: "rgba(255,198,61,0.08)", color: "var(--df-gold)", border: "1px solid rgba(255,198,61,0.7)", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer", marginBottom: 10, opacity: loading ? 0.6 : 1 }}>
        Se connecter
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 10px" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,198,61,0.15)" }} />
        <span style={{ fontSize: 10, color: "var(--df-text-3)" }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,198,61,0.15)" }} />
      </div>
      <button disabled={loading} onClick={connexionTest}
        style={{ width: "100%", background: "rgba(77,216,230,0.07)", color: "var(--df-cyan)", border: "1px solid rgba(77,216,230,0.6)", borderRadius: 8, padding: "9px", fontSize: 12.5, fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
        Connexion rapide (compte de test)
      </button>
    </div>
  )
}

function MonComptePanel({ user, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])
  return (
    <div ref={ref} style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220, background: "var(--df-panel-bg)", border: "1px solid var(--df-border-cyan)", borderRadius: 12, boxShadow: "0 14px 34px rgba(0,0,0,0.6)", padding: 16, zIndex: 200, textAlign: "left" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: "var(--df-text-3)", textTransform: "uppercase", marginBottom: 6 }}>Mon compte</div>
      <div style={{ fontSize: 14.5, color: "var(--df-text)", fontWeight: 600 }}>{user.pseudo}</div>
    </div>
  )
}

// Marque Discord simplifiée (tracé simple-icons, licence MIT).
function IconeDiscord(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.618-1.25.07.07 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.1 14.1 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.334-.946 2.419-2.157 2.419Z" />
    </svg>
  )
}

function NavSearch({ query, setQuery, results, loading, onSelectMonstre }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setQuery("") }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [setQuery])

  return (
    <div ref={ref} style={{ position: "relative", width: "min(190px, 22vw)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, background: "rgba(var(--df-card-bg),0.6)",
        border: "1px solid var(--df-border-cyan-soft)", borderRadius: 4, padding: "6px 12px", transition: "border-color .35s",
      }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5.4" stroke="var(--df-text-3)" strokeWidth="1.6" />
          <line x1="11" y1="11" x2="15" y2="15" stroke="var(--df-text-3)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher..."
          style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--df-text)", fontSize: 12.5 }} />
      </div>
      {query && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, maxHeight: 320, overflowY: "auto",
          background: "var(--df-panel-bg)", border: "1px solid var(--df-border-cyan)", borderRadius: 10,
          boxShadow: "0 14px 34px rgba(0,0,0,0.6)", zIndex: 200,
        }}>
          {loading ? (
            <div style={{ padding: 14, fontSize: 12.5, color: "var(--df-text-3)" }}>Recherche...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 14, fontSize: 12.5, color: "var(--df-text-3)" }}>Aucun résultat</div>
          ) : (
            results.map(m => (
              <div key={m.id} onClick={() => onSelectMonstre(m.id)} style={{
                padding: "9px 14px", fontSize: 13, color: "var(--df-text)", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>{m.nom}</div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function DiscordLink({ href }) {
  const [survol, setSurvol] = useState(false)
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setSurvol(true)} onMouseLeave={() => setSurvol(false)}>
      <a href={href} target="_blank" rel="noopener noreferrer" style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 999,
        color: survol ? "var(--df-cyan)" : "var(--df-text-2)", background: survol ? "rgba(var(--df-cyan-rgb),0.1)" : "transparent",
        transition: "color .35s, background .35s",
      }}>
        <IconeDiscord />
      </a>
      {survol && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, whiteSpace: "nowrap", zIndex: 200,
          background: "var(--df-panel-bg)", border: "1px solid var(--df-border-cyan)", borderRadius: 8,
          padding: "6px 12px", fontSize: 11.5, color: "var(--df-text-2)",
        }}>Rejoindre le Discord</div>
      )}
    </div>
  )
}

// Survol en opacité pure (consigne Popo, 18 août 2026 : "pas d'animation
// compliquée, juste opacity hover") — un :hover ne s'exprime pas en style
// inline, d'où cette balise <style> locale, même pattern que
// ComprendrePage.jsx (StyleSommaire). Le dropdown se révèle aussi en CSS
// pur (:hover sur le wrapper), aucun state JS pour l'ouverture/fermeture.
function StyleNavbar() {
  return (
    <style>{`
      .df-nav-trigger, .df-nav-cta { opacity: 0.9; cursor: pointer; text-align: center; transition: opacity .18s; }
      .df-nav-trigger:hover, .df-nav-cta:hover { opacity: 1; }
      .df-nav-dropdown { position: relative; }
      .df-nav-dropdown-panel {
        position: absolute; top: 100%; left: 0; margin-top: 10px; min-width: 220px; z-index: 200;
        background: #0B2531; border: 0.5px solid #2CE7FF; border-radius: 6px;
        padding: 8px 0; box-shadow: 0 14px 34px rgba(0,0,0,0.5);
        opacity: 0; visibility: hidden; transition: opacity .15s;
      }
      /* padding-top compense le margin-top du panel : le survol ne doit jamais
         retomber à zéro entre le déclencheur et le panneau. */
      .df-nav-dropdown::after { content: ""; position: absolute; top: 100%; left: 0; right: 0; height: 10px; }
      .df-nav-dropdown:hover .df-nav-dropdown-panel { opacity: 1; visibility: visible; }
      .df-nav-link { display: block; padding: 9px 12px; color: var(--df-text-2); text-decoration: none; font-size: 13px; text-align: center; opacity: .9; }
      .df-nav-link:hover { opacity: 1; color: var(--df-text); background: rgba(44, 231, 255, 0.1); }
    `}</style>
  )
}

function NavDropdown({ section, actif }) {
  return (
    <div className="df-nav-dropdown">
      <span className="df-nav-trigger" style={{
        display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500,
        color: actif ? section.couleur : "var(--df-text-2)", padding: "8px 0", whiteSpace: "nowrap",
        borderBottom: actif ? `1px solid ${section.couleur}` : "1px solid transparent",
        ...(actif ? { opacity: 1 } : {}),
      }}>
        <span aria-hidden="true">{section.icone}</span>{section.label}
      </span>
      <div className="df-nav-dropdown-panel">
        {section.liens.map(lien => (
          <Link key={lien.label} to={lien.to} className="df-nav-link">{lien.label}</Link>
        ))}
      </div>
    </div>
  )
}

export default function Navbar({ user, onLogin, onLogout, query, setQuery, results, loading, onSelectMonstre }) {
  const [showLogin, setShowLogin] = useState(false)
  const [showCompte, setShowCompte] = useState(false)
  const location = useLocation()

  // Lien actif dérivé de l'écran de FOND (pattern backgroundLocation
  // officiel react-router, voir App.jsx) : si une fiche est ouverte en
  // overlay par-dessus la Bibliothèque, la nav reste sur "La Bibliothèque"
  // plutôt que de suivre l'URL de la fiche — comportement identique à
  // l'ancienne Navbar (browsingActif), recalculé ici via useLocation()
  // seul, sans prop dédiée depuis App.jsx.
  const chemin = (location.state?.backgroundLocation || location).pathname

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
      padding: "0 clamp(18px,5vw,68px)", height: 78,
      background: "#030C11", borderBottom: "1px solid #0B2531",
    }}>
      <StyleNavbar />

      <Link to="/" onClick={() => { setQuery(""); setResults([]) }} style={{
        justifySelf: "start", fontFamily: "var(--df-font-logo)", fontWeight: 700, fontSize: 20, letterSpacing: "1px",
        background: "linear-gradient(90deg, #2CE7FF, #C478FF)", WebkitBackgroundClip: "text", backgroundClip: "text",
        color: "transparent", textDecoration: "none",
      }}>DOFURA</Link>

      <div style={{ justifySelf: "center", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        {SECTIONS.map(section => (
          <NavDropdown key={section.id} section={section}
            actif={section.liens.some(l => l.to === chemin)} />
        ))}
        <Link to={COMPRENDRE.to} className="df-nav-trigger" style={{
          display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, textDecoration: "none",
          color: chemin === COMPRENDRE.to ? COMPRENDRE.couleur : "var(--df-text-2)", padding: "8px 0", whiteSpace: "nowrap",
          borderBottom: chemin === COMPRENDRE.to ? `1px solid ${COMPRENDRE.couleur}` : "1px solid transparent",
          ...(chemin === COMPRENDRE.to ? { opacity: 1 } : {}),
        }}>
          <span aria-hidden="true">{COMPRENDRE.icone}</span>{COMPRENDRE.label}
        </Link>
      </div>

      <div style={{ justifySelf: "end", display: "flex", gap: 16, alignItems: "center" }}>
        <NavSearch query={query} setQuery={setQuery} results={results} loading={loading} onSelectMonstre={onSelectMonstre} />
        <DiscordLink href="https://discord.gg/TODO-lien-a-fournir" />
        {user ? (
          <>
            <div style={{ position: "relative" }}>
              <span onClick={() => setShowCompte(s => !s)} className="df-nav-cta" style={{
                display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 4,
                background: "rgba(196,120,255,0.15)", border: "1px solid #C478FF", color: "#C478FF",
                fontSize: 13, fontWeight: 700,
              }}>{(user.pseudo || "?")[0].toUpperCase()}</span>
              {showCompte && <MonComptePanel user={user} onClose={() => setShowCompte(false)} />}
            </div>
            <span onClick={onLogout} className="df-nav-cta" style={{
              border: "1px solid #2CE7FF", borderRadius: 4, padding: "7px 18px",
              background: "transparent", color: "#2CE7FF", fontSize: 12.5,
            }}>Déconnexion</span>
          </>
        ) : (
          <div style={{ position: "relative" }}>
            <span onClick={() => setShowLogin(s => !s)} className="df-nav-cta" style={{
              border: "1px solid #2CE7FF", borderRadius: 4, padding: "7px 18px",
              background: "transparent", color: "#2CE7FF", fontSize: 12.5,
            }}>Se connecter</span>
            {showLogin && <LoginPanel onLogin={(token) => { onLogin(token); setShowLogin(false) }} onClose={() => setShowLogin(false)} />}
          </div>
        )}
      </div>
    </nav>
  )
}
