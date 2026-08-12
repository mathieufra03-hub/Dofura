import { useState, useEffect, useRef, useMemo } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom"
import SongesPage from "./pages/SongesPage"
import AccueilPage from "./pages/AccueilPage"
import TauxPage from "./pages/TauxPage"
import ComprendrePage from "./pages/ComprendrePage"
import { DOFUS_COULEURS } from "./dofusCouleurs"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

// "#rrggbb" -> "rgba(r, g, b, alpha)" — chantier Chasse au Dofus (fonds
// thematiques par Dofus, 30 juillet 2026).
function hexVersRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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

// Structure de nav (retour Popo, 1er août 2026) : le tracker Songes
// (cible "songes" inchangée) est rebrandé "L'Œil de Draconiros" partout,
// mais la nav affiche juste "L'Œil" (raccourci volontaire pour ne pas
// alourdir le menu — voir IDENTITE.md). "Les Taux" remis dans la barre
// (en était sorti le 31 juillet, une passe précédente) — sa page existe
// réellement (TauxPage.jsx, cible "taux"). Donjons, Quêtes, et tout ce que
// fusionnait déjà le Grimoire (chantier Grimoire, 29 juillet 2026 :
// Équipements/Ressources/Bestiaire/Panoplies) restent hors nav — SANS
// supprimer leur code/routes, le Grimoire s'appuie dessus et ils restent
// atteignables par les liens croisés entre fiches.
const navLinks = ["L'Œil", "Les Taux", "La Bibliothèque"]
const NAV_LABEL_VERS_CIBLE = { "L'Œil":"songes", "Les Taux":"taux", "La Bibliothèque":"grimoire" }

// Panneau de connexion (formulaire pseudo/mdp + raccourci compte de test),
// ouvert depuis le bouton Connexion de la navbar. Pas d'inscription publique
// ici (endpoint /auth/register pret cote backend, formulaire a construire
// plus tard) — le compte de test suffit pour explorer favoris/progression
// avant que l'inscription publique n'existe.
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
    fetch(`${API}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ identifiant, password }) })
      .then(async r => {
        if (!r.ok) { const d = await r.json().catch(()=>({})); throw new Error(d.detail || "Erreur de connexion") }
        return r.json()
      })
      .then(d => onLogin(d.token))
      .catch(e => { setErreur(e.message); setLoading(false) })
  }

  const connexionTest = () => {
    setLoading(true); setErreur("")
    fetch(`${API}/auth/dev-login`, { method:"POST" })
      .then(r => r.json())
      .then(d => onLogin(d.token))
      .catch(() => { setErreur("Compte de test indisponible"); setLoading(false) })
  }

  const champStyle = { width:"100%", boxSizing:"border-box", background:"rgba(20,26,46,0.9)", border:"1px solid rgba(77,216,230,0.3)", borderRadius:8, padding:"9px 12px", fontSize:13, color:"var(--df-text)", outline:"none", marginBottom:8 }

  return (
    <div ref={ref} style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:280, background:"var(--df-panel-bg)", border:"1px solid rgba(255,198,61,0.3)", borderRadius:12, boxShadow:"0 14px 34px rgba(0,0,0,0.6)", padding:18, zIndex:200, textAlign:"left" }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:"var(--df-gold)", textTransform:"uppercase", marginBottom:12 }}>Connexion</div>
      <input value={identifiant} onChange={e=>setIdentifiant(e.target.value)} placeholder="Pseudo ou email" style={champStyle} />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Mot de passe"
        onKeyDown={e=>{ if (e.key==="Enter") connecter() }} style={{ ...champStyle, marginBottom:10 }} />
      {erreur && <div style={{ color:"var(--df-red)", fontSize:12, marginBottom:8 }}>{erreur}</div>}
      <button disabled={loading || !identifiant || !password} onClick={connecter}
        style={{ width:"100%", background:"rgba(255,198,61,0.08)", color:"var(--df-gold)", border:"1px solid rgba(255,198,61,0.7)", borderRadius:8, padding:"9px", fontSize:13, fontWeight:600, cursor:loading?"default":"pointer", marginBottom:10, opacity:loading?0.6:1 }}>
        Se connecter
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 10px" }}>
        <div style={{ flex:1, height:1, background:"rgba(255,198,61,0.15)" }} />
        <span style={{ fontSize:10, color:"var(--df-text-3)" }}>ou</span>
        <div style={{ flex:1, height:1, background:"rgba(255,198,61,0.15)" }} />
      </div>
      <button disabled={loading} onClick={connexionTest}
        style={{ width:"100%", background:"rgba(77,216,230,0.07)", color:"var(--df-cyan)", border:"1px solid rgba(77,216,230,0.6)", borderRadius:8, padding:"9px", fontSize:12.5, fontWeight:600, cursor:loading?"default":"pointer" }}>
        Connexion rapide (compte de test)
      </button>
    </div>
  )
}

// Icônes de nav — trait fin, pas d'emoji (refonte visuelle, phase 2 nav).
// Œil/Taux/Grimoire reprennent exactement les tracés déjà utilisés sur les
// 3 cartes de l'accueil (AccueilPage.jsx) : même symbole aux deux endroits,
// cohérence délibérée plutôt que 2 jeux d'icônes différents pour la même
// idée.
function IconeOeil(props) {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><path d="M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-4-4-5-4-9z" /><path d="M8 21h8" /></svg>
}
function IconeTaux(props) {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><path d="M19 5 5 19" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg>
}
function IconeGrimoireNav(props) {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><path d="M4 5v14a2 2 0 0 1 2-2h14V3H6a2 2 0 0 0-2 2z" /><path d="M9 8h7" /></svg>
}
// Registre (historique), même famille de tracé simple qu'un cadran —
// nouveau (1er août 2026), remplace l'icône % de l'ancienne carte "Les
// Taux" à cet emplacement de la grille de l'accueil.
function IconeHistorique(props) {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
}
function IconeCompte(props) {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></svg>
}
// Marque Discord simplifiée (tracé simple-icons, licence MIT) — seule icône
// en aplat plutôt qu'en trait fin : un logo de marque tracé en contour fin
// ne se reconnaît plus comme "Discord", exception assumée à la règle des
// icônes de nav.
function IconeDiscord(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.618-1.25.07.07 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.1 14.1 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.334-.946 2.419-2.157 2.419Z" />
    </svg>
  )
}

const NAV_ICONS = { "L'Œil": IconeOeil, "Les Taux": IconeTaux, "La Bibliothèque": IconeGrimoireNav }

// Recherche discrète de la nav (refonte visuelle, phase 2) — réutilise le
// state query/results/loading déjà câblé dans App() pour l'ancien Hero (mort
// depuis la refonte de l'accueil, jamais supprimé) : même endpoint
// /monstres?search=, donc recherche monstres uniquement pour l'instant (pas
// le Grimoire complet équipements/ressources/panoplies) — voir IDENTITE.md.
function NavSearch({ query, setQuery, results, loading, onSelectMonstre }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setQuery("") }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [setQuery])

  return (
    <div ref={ref} style={{ position:"relative", width:"min(190px, 22vw)" }}>
      <div style={{
        display:"flex", alignItems:"center", gap:8, background:"rgba(var(--df-card-bg),0.6)",
        border:"1px solid var(--df-border-cyan-soft)", borderRadius:999, padding:"6px 12px", transition:"border-color .35s",
      }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink:0 }}>
          <circle cx="7" cy="7" r="5.4" stroke="var(--df-text-3)" strokeWidth="1.6" />
          <line x1="11" y1="11" x2="15" y2="15" stroke="var(--df-text-3)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher..."
          style={{ flex:1, minWidth:0, background:"transparent", border:"none", outline:"none", color:"var(--df-text)", fontSize:12.5, caretColor:"var(--df-cyan)" }} />
        {loading && <span style={{ fontSize:10, color:"var(--df-text-3)" }}>…</span>}
      </div>
      {results.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, width:280, background:"var(--df-panel-bg)", border:"1px solid var(--df-border-cyan)", borderRadius:14, overflow:"hidden", zIndex:200, textAlign:"left" }}>
          {results.map(m => (
            <div key={m.id} onClick={()=>onSelectMonstre(m.id)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px", cursor:"pointer", borderBottom:"1px solid var(--df-border-cyan-soft)" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(var(--df-cyan-rgb),0.06)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              {m.image_url
                ? <img src={m.image_url} alt={m.nom} style={{ width:32, height:32, objectFit:"contain", borderRadius:6, background:"var(--df-bg)" }} />
                : <div style={{ width:32, height:32, background:"var(--df-bg)", borderRadius:6 }} />
              }
              <div>
                <div style={{ fontSize:12.5, fontWeight:500, color:"var(--df-text)" }}>{m.nom}</div>
                <div style={{ fontSize:10.5, color:"var(--df-text-3)" }}>{m.famille || m.race || ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Icône + infobulle custom au survol (état local, cohérent avec le reste de
// la navbar qui gère déjà ses hovers en JS plutôt qu'en CSS :hover).
function DiscordLink({ href }) {
  const [survol, setSurvol] = useState(false)
  return (
    <div style={{ position:"relative" }} onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>setSurvol(false)}>
      <a href={href} target="_blank" rel="noopener noreferrer" style={{
        display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:999,
        color: survol ? "var(--df-cyan)" : "var(--df-text-2)", background: survol ? "rgba(var(--df-cyan-rgb),0.1)" : "transparent",
        transition:"color .35s, background .35s",
      }}>
        <IconeDiscord />
      </a>
      {survol && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", right:0, whiteSpace:"nowrap", zIndex:200,
          background:"var(--df-panel-bg)", border:"1px solid var(--df-border-cyan)", borderRadius:8,
          padding:"6px 12px", fontSize:11.5, color:"var(--df-text-2)",
        }}>
          Discord — contact &amp; signalement de bug
        </div>
      )}
    </div>
  )
}

// Panneau "Mon compte" (données très limitées pour l'instant : /auth/me ne
// renvoie que id/pseudo, la vraie gestion de compte est la Phase 4 de la
// roadmap CLAUDE.md, pas encore commencée — ce panneau est un accès minimal
// honnête, pas une anticipation de fonctionnalités qui n'existent pas).
function MonComptePanel({ user, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])
  return (
    <div ref={ref} style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:220, background:"var(--df-panel-bg)", border:"1px solid var(--df-border-cyan)", borderRadius:12, boxShadow:"0 14px 34px rgba(0,0,0,0.6)", padding:16, zIndex:200, textAlign:"left" }}>
      <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:1, color:"var(--df-text-3)", textTransform:"uppercase", marginBottom:6 }}>Mon compte</div>
      <div style={{ fontSize:14.5, color:"var(--df-text)", fontWeight:600 }}>{user.pseudo}</div>
    </div>
  )
}

// Reprend nav/.brand/.links/.ghost de la maquette (refonte visuelle) — sticky,
// translucide + flou, dégradé or→cyan→violet sur le logo comme le mot
// "légende" de l'accueil, lien actif souligné cyan. Pas de nouvelle classe
// globale pour le dégradé du logo : traitement unique à ce composant, à la
// différence de .df-title-gold (partagé par les titres de fiches, hors
// périmètre de cette refonte) — voir IDENTITE.md.
// Disposition en grille 3 colonnes (logo / menu+recherche / compte-Discord)
// plutôt que flex+space-between : le menu central reste VRAIMENT centré même
// si les zones gauche/droite n'ont pas la même largeur.
function Navbar({ onHome, onNav, browsing, user, onLogin, onLogout, query, setQuery, results, loading, onSelectMonstre }) {
  const [showLogin, setShowLogin] = useState(false)
  const [showCompte, setShowCompte] = useState(false)
  return (
    <nav style={{
      position:"sticky", top:0, zIndex:100, display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center",
      padding:"0 clamp(18px,5vw,68px)", height:78,
      background:"rgba(3,12,17,0.7)", backdropFilter:"blur(20px) saturate(1.4)", WebkitBackdropFilter:"blur(20px) saturate(1.4)",
      borderBottom:"1px solid var(--df-border-cyan-soft)",
    }}>
      <span onClick={onHome} style={{
        justifySelf:"start", fontFamily:"var(--df-font-logo)", fontWeight:900, fontSize:27, letterSpacing:"0.24em", cursor:"pointer",
        background:"linear-gradient(100deg, var(--df-gold) 6%, var(--df-cyan) 52%, var(--df-violet) 96%)",
        WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent",
      }}>DOFURA</span>

      <div style={{ justifySelf:"center", display:"flex", gap:"clamp(20px,3vw,44px)", alignItems:"center" }}>
        {navLinks.map(n => {
          const cible = NAV_LABEL_VERS_CIBLE[n]
          const actif = cible && browsing === cible
          const onClick = cible ? () => onNav(cible) : undefined
          const Icone = NAV_ICONS[n]
          return (
            <span key={n} onClick={onClick}
              style={{
                display:"inline-flex", alignItems:"center", gap:7,
                fontSize:15.5, fontWeight:500, color:actif?"var(--df-cyan)":"var(--df-text-2)",
                padding:"8px 0", cursor:onClick?"pointer":"default", whiteSpace:"nowrap",
                borderBottom: actif ? "1px solid var(--df-cyan)" : "1px solid transparent", transition:"color .35s",
              }}
              onMouseEnter={e=>{ if(!actif) e.currentTarget.style.color="var(--df-text)" }}
              onMouseLeave={e=>{ e.currentTarget.style.color = actif?"var(--df-cyan)":"var(--df-text-2)" }}
            ><Icone />{n}</span>
          )
        })}
        <NavSearch query={query} setQuery={setQuery} results={results} loading={loading} onSelectMonstre={onSelectMonstre} />
      </div>

      <div style={{ justifySelf:"end", display:"flex", gap:16, alignItems:"center" }}>
        {user ? (
          <>
            <div style={{ position:"relative" }}>
              <span onClick={()=>setShowCompte(s=>!s)} style={{
                display:"flex", alignItems:"center", gap:6, fontSize:13, color: showCompte ? "var(--df-cyan)" : "var(--df-text-2)",
                cursor:"pointer", transition:"color .35s",
              }}
                onMouseEnter={e=>{ if(!showCompte) e.currentTarget.style.color="var(--df-text)" }}
                onMouseLeave={e=>{ e.currentTarget.style.color = showCompte ? "var(--df-cyan)" : "var(--df-text-2)" }}
              ><IconeCompte />Mon compte</span>
              {showCompte && <MonComptePanel user={user} onClose={()=>setShowCompte(false)} />}
            </div>
            <span onClick={onLogout} style={{
              border:"1px solid var(--df-border-cyan)", borderRadius:999, padding:"7px 18px",
              background:"transparent", color:"var(--df-text)", fontSize:12.5, cursor:"pointer", transition:".35s",
            }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--df-cyan)"; e.currentTarget.style.background="rgba(44,231,255,0.07)" }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--df-border-cyan)"; e.currentTarget.style.background="transparent" }}
            >Déconnexion</span>
          </>
        ) : (
          <div style={{ position:"relative" }}>
            <span onClick={()=>setShowLogin(s=>!s)} style={{
              border:"1px solid var(--df-border-cyan)", borderRadius:999, padding:"7px 18px",
              background:"transparent", color:"var(--df-text)", fontSize:12.5, cursor:"pointer", transition:".35s",
            }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--df-cyan)"; e.currentTarget.style.background="rgba(44,231,255,0.07)" }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--df-border-cyan)"; e.currentTarget.style.background="transparent" }}
            >Se connecter</span>
            {showLogin && <LoginPanel onLogin={(token)=>{ onLogin(token); setShowLogin(false) }} onClose={()=>setShowLogin(false)} />}
          </div>
        )}
        {/* URL Discord : placeholder en attendant le vrai lien d'invitation
            de Popo (jamais deviné, voir CLAUDE.md règle 13 + consigne système
            anti-invention d'URL) — signalé dans le rapport de cette passe. */}
        <DiscordLink href="https://discord.gg/TODO-lien-a-fournir" />
      </div>
    </nav>
  )
}

// Tracé exact de maquette/dofura-home-v4.jsx (composant DofuraHomeV4 > df-egg-logo) :
// œuf de dragon doré + spirale creusée, SVG original (aucun asset Ankama).
// Taille en "em" pour rester alignée sur la taille du titre (clamp responsive).
function DofuraEggO() {
  return (
    <svg viewBox="0 0 100 126" aria-label="O" style={{ height:"0.72em", width:"auto", margin:"0 0.03em", transform:"translateY(0.02em)" }}>
      <defs>
        <linearGradient id="df-egg-grad" x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0" stopColor="var(--df-gold-grad-1)" />
          <stop offset="0.55" stopColor="var(--df-gold)" />
          <stop offset="1" stopColor="var(--df-gold-grad-2)" />
        </linearGradient>
        <radialGradient id="df-egg-sheen" cx="34%" cy="24%" r="46%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="df-egg-clip">
          <path d="M50 4 C74 4 92 44 92 78 C92 106 74 122 50 122 C26 122 8 106 8 78 C8 44 26 4 50 4 Z" />
        </clipPath>
      </defs>
      <path d="M50 4 C74 4 92 44 92 78 C92 106 74 122 50 122 C26 122 8 106 8 78 C8 44 26 4 50 4 Z"
        fill="url(#df-egg-grad)" stroke="var(--df-gold-grad-2)" strokeWidth="1.5" />
      <ellipse cx="35" cy="32" rx="28" ry="20" fill="url(#df-egg-sheen)" clipPath="url(#df-egg-clip)" />
      <path d="M60 40 C73 51 73 73 60 82 C49 90 35 84 33 72" fill="none" stroke="var(--df-bg)" strokeWidth="7" strokeLinecap="round" opacity="0.92" />
      <circle cx="33" cy="72" r="2.4" fill="var(--df-bg)" opacity="0.92" />
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
  // Ébène : remplissage volontairement sombre (identité noire), halo dédié plus vif
  // pour l'effet lumineux (chantier style global, 29 juillet 2026) — sans ce halo
  // distinct, un remplissage sombre + glow de la même teinte serait invisible.
  { key:"ebene",     color:"var(--df-dofus-ebene)", glow:"var(--df-dofus-ebene-glow)" },
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
            background:d.color, boxShadow:`0 0 8px ${d.glow || d.color}`,
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
        D<DofuraEggO />F<span style={{ marginLeft:"0.05em" }}>URA</span>
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

// Œuf-jauge (maquette dofura-home-v4.jsx) : se remplit par le bas selon la
// progression, 100% = plein + halo. Retour Popo (chantier style global,
// 29 juillet 2026) : la jauge ne remplit plus l'œuf d'un aplat de couleur
// (le vert de l'Émeraude en particulier "dénotait" trop) — c'est désormais
// l'image officielle du Dofus elle-même qui se révèle progressivement du bas
// vers le haut (tamisée/grisée pour la partie pas encore acquise), via deux
// copies de la même image superposées : une tamisée en permanence, une pleine
// couleur découpée à la hauteur pct par un second clip-path imbriqué dans le
// clip de la silhouette de l'œuf. Dofus non trackable (aucune quête/succès
// reconnu·e côté DofusDB — voir main.py /dofus) : contour éteint, pas de %,
// jamais un faux 0% permanent.
const OEUF_PATH = "M50 4 C74 4 92 44 92 78 C92 106 74 122 50 122 C26 122 8 106 8 78 C8 44 26 4 50 4 Z"
function OeufJauge({ id, img, couleur, theme, pct, taille, trackable }) {
  const c = couleur || "#C9A24B"
  // Halo lumineux leger et permanent, couleur dominante de l'oeuf (chantier
  // Chasse au Dofus, 30 juillet 2026) — plus sobre (opacite reduite) pour
  // les Dofus non suivis. drop-shadow (pas box-shadow) pour suivre la
  // silhouette reelle de l'oeuf, pas un carre. S'ajoute (ne remplace pas)
  // au halo dore existant quand le Dofus est a 100%.
  const filtres = []
  if (theme) filtres.push(`drop-shadow(0 0 ${trackable ? 7 : 4}px ${hexVersRgba(theme, trackable ? 0.5 : 0.22)})`)
  if (pct === 100) filtres.push(`drop-shadow(0 0 8px ${c})`)
  return (
    <svg width={taille} height={taille * 1.26} viewBox="0 0 100 126"
      style={{ filter: filtres.length ? filtres.join(" ") : "none", flexShrink:0, display:"block", margin:"0 auto" }}>
      <defs>
        <clipPath id={"df-oeuf-clip-"+id}><path d={OEUF_PATH} /></clipPath>
        {trackable && pct > 0 && (
          <clipPath id={"df-fill-clip-"+id}><rect x="0" y={126 - 126*(pct/100)} width="100" height={126*(pct/100)} /></clipPath>
        )}
      </defs>
      {/* Plus de silhouette d'œuf pleine en arrière-plan (retour Popo : ça
          faisait "vieil œuf" derrière l'artwork réel) — seul le Dofus lui-même
          reste visible, le fond de la carte (.df-card) suffit comme arrière-plan. */}
      {img && (
        <g clipPath={`url(#df-oeuf-clip-${id})`}>
          {/* Version tamisée : le Dofus "pas encore chargé", toujours visible en arrière-plan */}
          <image href={img} x="4" y="5" width="92" height="116" preserveAspectRatio="xMidYMid meet"
            opacity={trackable ? 1 : 0.35}
            style={{ filter: trackable ? "grayscale(0.75) brightness(0.4)" : "grayscale(1)" }} />
          {/* Version pleine, révélée du bas vers le haut selon pct — "le Dofus en lui-même qui charge" */}
          {trackable && pct > 0 && (
            <g clipPath={`url(#df-fill-clip-${id})`}>
              <image href={img} x="4" y="5" width="92" height="116" preserveAspectRatio="xMidYMid meet" />
            </g>
          )}
        </g>
      )}
    </svg>
  )
}

function CarreDofus({ d, taille, petit, onClick }) {
  const cliquable = !!onClick
  const theme = DOFUS_COULEURS[d.id]
  return (
    <div onClick={cliquable ? onClick : undefined}
      className={"df-card"} style={{
        padding: petit ? "14px 8px 12px" : "16px 10px 14px", textAlign:"center",
        cursor: cliquable ? "pointer" : "default",
        borderColor: d.obtenu ? "rgba(255,198,61,0.75)" : undefined,
        boxShadow: d.obtenu ? "0 0 16px rgba(255,198,61,0.22)" : undefined,
        // Degrade thematique discret (chantier Chasse au Dofus, 30 juillet
        // 2026) : superpose au fond de carte habituel (meme rgba que .df-card
        // en CSS), plus sobre (opacite reduite) pour les Dofus non suivis.
        background: theme
          ? `radial-gradient(circle at 50% 28%, ${hexVersRgba(theme, d.trackable ? 0.16 : 0.07)}, transparent 72%), rgba(20,26,46,0.92)`
          : undefined,
      }}
      title={!d.trackable ? "Aucune quête ni succès reconnu(e) pour ce Dofus — pas de suivi automatique possible" : undefined}
    >
      {d.img
        ? (
          <div style={{ position:"relative", width:taille, height:taille*1.26, margin:"0 auto" }}>
            <OeufJauge id={d.id} img={d.img} couleur={d.couleur} theme={theme} pct={d.pct} taille={taille} trackable={d.trackable} />
          </div>
        )
        : <OeufJauge id={d.id} couleur={d.couleur} theme={theme} pct={d.pct} taille={taille} trackable={d.trackable} />
      }
      <div style={{ fontSize:petit?11.5:12.5, fontWeight:700, color:"var(--df-text)", margin:"9px 0 1px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.nom}</div>
      <div style={{ fontSize:10.5, color:"var(--df-text-3)" }}>Niv. {d.niveau}</div>
      {d.trackable ? (
        <div style={{ fontSize:petit?11:11.5, fontWeight:700, color:d.pct===0?"var(--df-text-off)":"var(--df-gold)", marginTop:5 }}>
          {d.obtenu ? "✓ Obtenu" : `${d.pct} %`}
        </div>
      ) : (
        <div style={{ fontSize:petit?11:11.5, color:"var(--df-text-off)", marginTop:5 }}>Non suivi</div>
      )}
    </div>
  )
}

// La Chasse aux Dofus (§6 specs, section signature de la home). Branché sur
// /dofus (main.py) : progression calculée depuis les vraies relations
// Dofus↔quête/succès en base, jamais une valeur inventée.
// Panneau lateral pour la fiche d'un Dofus (chantier Chasse au Dofus,
// 30 juillet 2026 — meme principe que le panneau du Grimoire) : la fiche
// s'ouvre par-dessus la grille, qui reste affichee et defilee derriere.
// Un seul niveau (pas de pile) : les liens croises de DofusDetailPage
// (quete/succes/donjon/monstre) sortent tous du perimetre Chasse au Dofus,
// donc vers les pages pleines existantes comme avant — rien a empiler ici.
function DofusPanel({ dofusId, token, onClose, onSelectQuete, onSelectSucces, onSelectDonjon, onSelectMonstre }) {
  if (!dofusId) return null
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(6,8,16,0.6)", zIndex:300 }} />
      <div style={{
        position:"fixed", top:0, right:0, height:"100vh", width:"min(860px, 100vw)",
        background:"var(--df-panel-bg)", borderLeft:"1px solid rgba(255,198,61,0.25)",
        boxShadow:"-12px 0 40px rgba(0,0,0,0.5)", zIndex:301, overflowY:"auto",
      }}>
        <button onClick={onClose} title="Fermer" style={{
          position:"fixed", top:14, right:14, zIndex:302, width:32, height:32, borderRadius:"50%",
          background:"rgba(20,26,46,0.9)", border:"1px solid rgba(255,198,61,0.4)", color:"var(--df-gold)",
          fontSize:16, cursor:"pointer", lineHeight:"30px",
        }}>✕</button>
        <DofusDetailPage id={dofusId} token={token} onSelectQuete={onSelectQuete} onSelectSucces={onSelectSucces}
          onSelectDonjon={onSelectDonjon} onSelectMonstre={onSelectMonstre} onBack={onClose} />
      </div>
    </>
  )
}

function ChasseDofus({ token, onSelectQuete, onSelectSucces, onSelectDonjon, onSelectMonstre }) {
  const [dofus, setDofus] = useState([])
  const [total, setTotal] = useState(0)
  const [obtenus, setObtenus] = useState(null)
  const [masquerObtenus, setMasquerObtenus] = useState(false)
  const [dofusOuvert, setDofusOuvert] = useState(null) // id affiche dans le panneau, ou null si ferme

  useEffect(() => {
    const headers = token ? { Authorization:`Bearer ${token}` } : {}
    fetch(`${API}/dofus`, { headers }).then(r=>r.json()).then(d => {
      setDofus(d.dofus); setTotal(d.total); setObtenus(d.obtenus)
    })
  }, [token])

  const visibles = token && masquerObtenus ? dofus.filter(d => !d.obtenu) : dofus
  const primordiaux = visibles.filter(d => d.primordial)
  const autres = visibles.filter(d => !d.primordial)

  return (
    <div style={{ padding:"0 2rem 60px", maxWidth:1240, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", marginBottom:6 }}>
        <div className="df-section-title" style={{ fontSize:"clamp(22px, 3.5vw, 28px)", margin:0 }}>La Chasse aux Dofus</div>
        {token && obtenus != null && (
          <span style={{ background:"rgba(255,198,61,0.1)", border:"1px solid rgba(255,198,61,0.5)", color:"var(--df-gold)", fontWeight:700, fontSize:14, borderRadius:999, padding:"6px 16px" }}>
            {obtenus} / {total} Dofus
          </span>
        )}
        {token && (
          <label style={{ display:"flex", alignItems:"center", gap:8, color:"var(--df-text-2)", fontSize:13, cursor:"pointer", userSelect:"none", marginLeft:"auto" }}>
            <input type="checkbox" checked={masquerObtenus} onChange={()=>setMasquerObtenus(m=>!m)} style={{ accentColor:"var(--df-gold)", width:15, height:15, cursor:"pointer" }} />
            Masquer les Dofus obtenus
          </label>
        )}
      </div>

      {!token && (
        <div className="df-card" style={{ cursor:"default", maxWidth:620, marginTop:20, marginBottom:26, padding:"22px 26px" }}>
          <p style={{ margin:0, fontSize:14.5, color:"var(--df-text-2)", lineHeight:1.5 }}>
            Tous les Dofus du jeu sont là. Connecte-toi pour suivre ta progression : chaque œuf se remplit au fil des quêtes et succès que tu coches.
          </p>
        </div>
      )}

      <div style={{ color:"var(--df-text)", fontSize:16, fontWeight:600, margin:"26px 0 16px", letterSpacing:0.5 }}>⭐ Les six Primordiaux</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(170px, 1fr))", gap:16, filter:token?"none":"grayscale(1)", opacity:token?1:0.55 }}>
        {primordiaux.map(d => (
          <CarreDofus key={d.id} d={d} taille={78} onClick={()=>setDofusOuvert(d.id)} />
        ))}
      </div>

      <div style={{ color:"var(--df-text)", fontSize:16, fontWeight:600, margin:"26px 0 16px", letterSpacing:0.5 }}>Tous les autres Dofus — triés par niveau requis</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:14, filter:token?"none":"grayscale(1)", opacity:token?1:0.55 }}>
        {autres.map(d => (
          <CarreDofus key={d.id} d={d} taille={56} petit onClick={()=>setDofusOuvert(d.id)} />
        ))}
      </div>

      <DofusPanel dofusId={dofusOuvert} token={token} onClose={()=>setDofusOuvert(null)}
        onSelectQuete={onSelectQuete} onSelectSucces={onSelectSucces} onSelectDonjon={onSelectDonjon} onSelectMonstre={onSelectMonstre} />
    </div>
  )
}

// Archidex (demande explicite Popo, 2026-07-14) : liste des archimonstres
// déjà en base (famille "Créatures Archimonstres", catégorie "archi" du
// Bestiaire, chantier #4). Réutilise /monstres?categorie=archi (le total
// exact — jamais un chiffre en dur — et, si connecté, le suivi "chasse" par
// monstre, nouveau element_type 'archimonstre' dans progression_joueur,
// même table générique déjà utilisée partout ailleurs) et la vignette
// .df-tile déjà stylée pour le Bestiaire. Chargé en un seul appel (plafond
// /monstres relevé à 400, largement au-dessus des 306 réels) pour l'usage
// "checklist qu'on parcourt" plutôt qu'un catalogue paginé — le fallback de
// pagination reste actif si ce nombre dépassait un jour 400.
// Scope volontairement limité à la fiche du Dofus Ocre pour l'instant (pas
// de lien thématique Ocre↔archimonstres établi, juste le premier Dofus à
// avoir une vraie fiche dédiée) — facile à généraliser si Popo le demande.
const ARCHIDEX_PAGE_SIZE = 400
function ArchidexSection({ token, onSelectMonstre }) {
  const [monstres, setMonstres] = useState([])
  const [total, setTotal] = useState(0)
  const [chasses, setChasses] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [messageConnexion, setMessageConnexion] = useState(false)

  useEffect(() => {
    setLoading(true)
    const headers = token ? { Authorization:`Bearer ${token}` } : {}
    fetch(`${API}/monstres?categorie=archi&tri=az&page=${page}&page_size=${ARCHIDEX_PAGE_SIZE}`, { headers })
      .then(r=>r.json())
      .then(d => { setMonstres(d.monstres); setTotal(d.total); setChasses(d.chasses_total); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [page, token])

  const totalPages = Math.max(Math.ceil(total / ARCHIDEX_PAGE_SIZE), 1)

  const toggleChasse = (m) => {
    if (!token) { setMessageConnexion(true); return }
    const fait = !m.chasse
    setMonstres(ms => ms.map(x => x.id===m.id ? { ...x, chasse:fait } : x))
    setChasses(c => (c ?? 0) + (fait ? 1 : -1))
    fetch(`${API}/progression`, {
      method: "POST",
      headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ element_type:"archimonstre", element_id:String(m.id), fait }),
    }).catch(()=>{
      setMonstres(ms => ms.map(x => x.id===m.id ? { ...x, chasse:!fait } : x))
      setChasses(c => (c ?? 0) + (fait ? -1 : 1))
    })
  }

  return (
    <section className="df-block">
      <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", marginBottom:16 }}>
        <h2 className="df-block-title" style={{ margin:0 }}>Archidex</h2>
        <span style={{ background:"rgba(255,198,61,0.1)", border:"1px solid rgba(255,198,61,0.5)", color:"var(--df-gold)", fontWeight:700, fontSize:13, borderRadius:999, padding:"4px 14px" }}>
          {token && chasses != null ? `${chasses} / ${total} archimonstres` : `${total} archimonstres`}
        </span>
        {messageConnexion && (
          <span style={{ fontSize:12, color:"var(--df-text-2)" }}>
            Connecte-toi pour cocher tes archimonstres chassés
            <span onClick={()=>setMessageConnexion(false)} style={{ marginLeft:6, color:"var(--df-text-3)", cursor:"pointer" }}>✕</span>
          </span>
        )}
      </div>
      {loading ? (
        <div style={{ ...mp.videEtat, padding:"1.5rem 1rem" }}>Chargement...</div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(136px, 1fr))", gap:12 }}>
            {monstres.map(m => (
              <div key={m.id} className="df-tile" style={{ position:"relative" }} onClick={()=>onSelectMonstre(m.id)}>
                <div className={"df-check" + (m.chasse?" on":"")} onClick={e=>{ e.stopPropagation(); toggleChasse(m) }}
                  style={{ position:"absolute", top:8, left:8, width:20, height:20, fontSize:12 }}>
                  {m.chasse ? "✓" : ""}
                </div>
                {m.image_url
                  ? <img src={m.image_url} alt={m.nom} style={{ width:44, height:44, objectFit:"contain", margin:"0 auto 10px", display:"block" }} />
                  : <div style={{ width:44, height:44, borderRadius:10, margin:"0 auto 10px", background:"rgba(12,15,29,0.8)", border:"1px solid rgba(255,198,61,0.3)" }} />
                }
                <div style={{ color:m.chasse?"var(--df-green)":"var(--df-gold)", fontWeight:700, fontSize:12.5, lineHeight:1.25, minHeight:31, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>{m.nom}</div>
                <div style={{ color:"var(--df-text-3)", fontSize:11, marginTop:4 }}>Niv. {m.niveau ?? "—"}</div>
                <div style={{ color:"var(--df-text-3)", fontSize:10.5, marginTop:2 }}>{m.region || "Région inconnue"}</div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={mp.pagination}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={mp.pageBtn(page<=1)}>← Précédent</button>
              <span style={mp.pageLabel}>Page {page} / {totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={mp.pageBtn(page>=totalPages)}>Suivant →</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// Fiche dédiée d'un Dofus (demande Popo, 2026-07-14) : version fonctionnelle
// minimale, pas encore le "fond thématique ambiance" prévu au §6 des specs
// comme chantier futur séparé — juste de quoi donner une vraie destination
// à chaque œuf de la Chasse aux Dofus (avant, seuls les Dofus trackables
// renvoyaient quelque part, les 9 non trackables n'allaient nulle part).
function DofusDetailPage({ id, token, onSelectQuete, onSelectSucces, onSelectDonjon, onSelectMonstre, onBack }) {
  const [data, setData] = useState(null)
  const [messageConnexion, setMessageConnexion] = useState(false)

  const charger = () => {
    const headers = token ? { Authorization:`Bearer ${token}` } : {}
    return fetch(`${API}/dofus/${id}`, { headers }).then(r=>r.json()).then(setData)
  }

  useEffect(() => {
    setData(null)
    charger()
  }, [id, token])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:"var(--df-text-2)", fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:"var(--df-text-2)", fontSize:14 }}>{data.erreur}</div>

  // Coche/decoche une quete ENTIERE de l'itineraire d'un coup (meme table
  // progression_joueur que la fiche quete complete — une seule source de
  // verite, voir /progression/quete-complete). Mise a jour optimiste de la
  // case + du compteur pour un retour instantane, puis re-fetch complet pour
  // resynchroniser le % global (qui agrège aussi le succès lié le cas
  // échéant), plutôt que de recalculer cet agrégat à la main côté front.
  const toggleQuete = (etape) => {
    if (!token) { setMessageConnexion(true); return }
    const fait = !etape.fait
    setData(prev => ({
      ...prev,
      itineraire: prev.itineraire.map(e => e.id===etape.id ? { ...e, fait } : e),
      itineraire_fait: prev.itineraire_fait + (fait ? 1 : -1),
    }))
    fetch(`${API}/progression/quete-complete`, {
      method: "POST",
      headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ quete_id: etape.id, fait }),
    }).then(charger).catch(()=>{
      setData(prev => ({
        ...prev,
        itineraire: prev.itineraire.map(e => e.id===etape.id ? { ...e, fait:!fait } : e),
        itineraire_fait: prev.itineraire_fait + (fait ? -1 : 1),
      }))
    })
  }

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem 3rem", maxWidth:1240, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <header className="df-block" style={{
        display:"flex", alignItems:"center", gap:22, padding:24, flexWrap:"wrap",
        // Degrade thematique discret sur le panneau de detail (chantier
        // Chasse au Dofus, 30 juillet 2026) — meme logique que la carte.
        background: DOFUS_COULEURS[data.id]
          ? `radial-gradient(circle at 90px 50%, ${hexVersRgba(DOFUS_COULEURS[data.id], data.trackable ? 0.14 : 0.06)}, transparent 65%), rgba(20,26,46,0.92)`
          : undefined,
      }}>
        <div style={{ position:"relative", width:84, height:84*1.26, flexShrink:0 }}>
          <OeufJauge id={data.id} img={data.img} couleur={data.couleur} theme={DOFUS_COULEURS[data.id]} pct={data.pct} taille={84} trackable={data.trackable} />
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <h1 className="df-title-gold" style={{ fontSize:"clamp(22px, 4vw, 30px)", margin:0 }}>{data.nom}</h1>
          <div style={{ color:"var(--df-text-2)", fontSize:14, marginTop:8 }}>
            Niv. {data.niveau}{data.primordial && <> · <span style={{ color:"var(--df-gold)" }}>⭐ Dofus primordial</span></>}
          </div>
          {data.trackable ? (
            <div style={{ marginTop:14, maxWidth:320 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                <span style={{ color:"var(--df-text-2)" }}>Progression</span>
                <span style={{ color:"var(--df-gold)", fontWeight:700 }}>{data.obtenu ? "✓ Obtenu" : `${data.pct} %`}</span>
              </div>
              <div className="df-progress"><div className={"fill" + (data.pct===100?" done":"")} style={{ width:data.pct+"%" }} /></div>
            </div>
          ) : (
            <div style={{ color:"var(--df-text-3)", fontSize:12.5, marginTop:14, fontStyle:"italic" }}>
              Aucune quête ni succès reconnu(e) pour ce Dofus dans les données publiques — pas de suivi automatique possible.
            </div>
          )}
        </div>
      </header>

      {data.itineraire?.length > 0 ? (
        <section className="df-block">
          <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", marginBottom:18 }}>
            <h2 className="df-block-title" style={{ margin:0 }}>Itinéraire</h2>
            <span style={{ background:"rgba(255,198,61,0.1)", border:"1px solid rgba(255,198,61,0.5)", color:"var(--df-gold)", fontWeight:700, fontSize:13, borderRadius:999, padding:"4px 14px" }}>
              {data.itineraire_fait} / {data.itineraire_total} quêtes
            </span>
          </div>
          {data.itineraire.map((e,i) => (
            <div key={e.id} style={{ padding:"16px 0", borderBottom: i<data.itineraire.length-1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              {e.prerequis.length > 0 && (
                <div style={{ fontSize:11.5, color:"var(--df-text-3)", marginBottom:8, marginLeft:38 }}>
                  🔒 Nécessite : {e.prerequis.map(p=>p.nom).join(", ")}
                </div>
              )}
              <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                <div className={"df-check" + (e.fait?" on":"")} onClick={()=>toggleQuete(e)} style={{ flexShrink:0, marginTop:2 }}>{e.fait?"✓":""}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div onClick={()=>onSelectQuete(e.id)} style={{ color:e.fait?"var(--df-text-3)":"var(--df-cyan)", fontWeight:700, fontSize:14.5, cursor:"pointer", textDecoration:e.fait?"line-through":"none" }}>{e.nom}</div>
                  <div style={{ color:"var(--df-text-3)", fontSize:12, marginTop:2 }}>Niv. {e.niveau_min}</div>
                  {e.donjon_lie && (
                    <div onClick={()=>onSelectDonjon(e.donjon_lie.id)} style={{ marginTop:8, display:"inline-flex", alignItems:"center", gap:7, cursor:"pointer", background:"rgba(77,216,230,0.07)", border:"1px solid rgba(77,216,230,0.3)", borderRadius:8, padding:"4px 10px" }}>
                      <span style={{ fontSize:12.5 }}>🏰</span>
                      <span style={{ color:"var(--df-cyan)", fontSize:12.5 }}>{e.donjon_lie.nom}</span>
                      <span style={{ color:"var(--df-text-3)", fontSize:11 }}>Niv. {e.donjon_lie.niveau_optimal}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!token && (
            <div style={{ color:"var(--df-text-3)", fontSize:12, marginTop:8, fontStyle:"italic" }}>
              Connecte-toi pour cocher ta progression sur cet itinéraire.
            </div>
          )}
          {messageConnexion && (
            <div style={{ color:"var(--df-text-2)", fontSize:12, marginTop:8 }}>
              Connecte-toi pour suivre ta progression
              <span onClick={()=>setMessageConnexion(false)} style={{ marginLeft:6, color:"var(--df-text-3)", cursor:"pointer" }}>✕</span>
            </div>
          )}
          {data.succes_lie && (
            <div onClick={()=>onSelectSucces(data.succes_lie.id)} style={{ marginTop:18, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <span style={{ color:"var(--df-text-3)", fontSize:12.5 }}>Fait partie du succès</span>
              <span style={{ color:"var(--df-cyan)", fontWeight:600, fontSize:13 }}>{data.succes_lie.nom} →</span>
            </div>
          )}
        </section>
      ) : data.succes_lie ? (
        <section className="df-block" style={{ borderColor:"var(--df-border-cyan)" }}>
          <h2 className="df-block-title">Succès lié</h2>
          <p style={{ color:"var(--df-text-3)", fontSize:13, fontStyle:"italic", margin:"0 0 14px" }}>
            Ce Dofus ne s'obtient pas via une suite de quêtes mais directement via ce succès.
          </p>
          <div onClick={()=>onSelectSucces(data.succes_lie.id)} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <div style={{ flex:1 }}>
              <div style={{ color:"var(--df-cyan)", fontWeight:700, fontSize:14.5 }}>{data.succes_lie.nom}</div>
              <div style={{ color:"var(--df-text-3)", fontSize:12, marginTop:1 }}>{data.succes_lie.points} points</div>
            </div>
            <span style={{ color:"var(--df-cyan)", fontSize:18, fontWeight:700 }}>→</span>
          </div>
        </section>
      ) : null}

      {data.id === 7754 && <ArchidexSection token={token} onSelectMonstre={onSelectMonstre} />}
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
  // Cas "introuvable" (chantier react-router, palier 1) : id manquant ou
  // supprimé, fiche jamais atteignable par erreur avant (les id venaient
  // toujours d'un clic sur un résultat réel) — devient possible dès que
  // l'URL est publique (lien partagé, saisie manuelle). Même convention
  // que ObjetDetailPage (data.erreur), l'API renvoie déjà cette forme.
  if (data.erreur) return (
    <div translate="no" style={{ padding:"1.5rem 2rem", maxWidth:900, margin:"0 auto" }}>
      <button onClick={onBack} style={{ background:"transparent", border:`0.5px solid ${C.bdr2}`, borderRadius:6, padding:"5px 12px", fontSize:12, color:C.prp2, cursor:"pointer", marginBottom:20 }}>
        ← Retour
      </button>
      <div style={{ padding:"3rem 0", textAlign:"center", color:C.txt2, fontSize:14 }}>{data.erreur}</div>
    </div>
  )

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

      {/* Encadre "EN SONGE" (2 août 2026, dofura_songes_boss_modifs.json) —
          accent violet Paradoxe #C478FF, masque entierement si le monstre
          n'a pas de modification (data.modif_songe null). En haut de la
          fiche, avant meme le bloc nom/image : c'est l'info la plus
          importante pour un songeur sur un boss qui se comporte
          differemment de sa version classique. */}
      {data.modif_songe && (
        <div style={{ background:"rgba(196,120,255,0.08)", border:`0.5px solid #C478FF`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"#C478FF", fontWeight:700, marginBottom:6 }}>En songe</div>
          <div style={{ fontSize:13.5, fontWeight:600, color:C.txt, marginBottom:8 }}>{data.modif_songe.titre}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {data.modif_songe.lignes.map((ligne, i) => (
              <div key={i} style={{ display:"flex", gap:8, fontSize:12.5, color:C.txt2, lineHeight:1.4 }}>
                <span style={{ color:"#C478FF", flexShrink:0 }}>•</span>
                <span>{ligne}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

const CATEGORIE_BADGE_TEXTE = { boss:"BOSS", avis:"AVIS", archi:"ARCHI", quete:"QUÊTE" }
const CATEGORIE_BADGE_CLASSE = { boss:"", avis:" df-tile-badge-avis", archi:" df-tile-badge-archi", quete:" df-tile-badge-quete" }

// Regroupement sous en-tetes : "Par zone" utilise la region principale du
// monstre (un monstre peut avoir plusieurs zones, voir main.py) — comme
// pour les objets, seul le tri A→Z groupe par lettre.
function grouperMonstres(monstres, tri) {
  const cleDe = (m) => tri === "zone" ? (m.region || "Sans région") : (m.nom.charAt(0) || "?").toUpperCase()
  const groupes = []
  monstres.forEach(m => {
    const cle = cleDe(m)
    const dernier = groupes[groupes.length - 1]
    if (dernier && dernier.cle === cle) dernier.items.push(m)
    else groupes.push({ cle, items:[m] })
  })
  return groupes
}

// Bestiaire = fusion Monstres + Zones (§2/§5 specs). Region → sous-zone en
// cascade comme les autres filtres a deux niveaux du site (type/effets sur
// Equipements) : les sous-zones proposees dependent des regions cochees.
function BestiairePage({ onSelect, onBack }) {
  const [monstres, setMonstres] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [tri, setTri] = useState("az")
  const [regions, setRegions] = useState([])
  const [regionsDispo, setRegionsDispo] = useState([])
  const [sousZones, setSousZones] = useState([])
  const [sousZonesDispo, setSousZonesDispo] = useState([])
  const [categories, setCategories] = useState([])
  const [categoriesDispo, setCategoriesDispo] = useState([])
  const [niveauBounds, setNiveauBounds] = useState(null)
  const [niveauMin, setNiveauMin] = useState(1)
  const [niveauMax, setNiveauMax] = useState(200)
  const [showFilters, setShowFilters] = useState(false)
  const [tip, setTip] = useState(null)
  const [loading, setLoading] = useState(true)

  // Categories + regions + bornes de niveau : fixes, chargees une fois.
  useEffect(() => {
    fetch(`${API}/monstres/filtres`).then(r=>r.json()).then(d => {
      setRegionsDispo(d.regions); setCategoriesDispo(d.categories)
      setNiveauBounds({ min:d.niveau_min, max:d.niveau_max })
      setNiveauMin(d.niveau_min); setNiveauMax(d.niveau_max)
    })
  }, [])

  // Cascade region -> sous-zones : aucune sous-zone proposee tant qu'aucune
  // region n'est cochee (comme la maquette : "Coche une zone pour affiner"),
  // et la selection de sous-zones est nettoyee si une region est decochee.
  const sousZonesRequeteId = useRef(0)
  useEffect(() => {
    const requeteId = ++sousZonesRequeteId.current
    if (regions.length === 0) { setSousZonesDispo([]); setSousZones([]); return }
    fetch(`${API}/monstres/filtres?region=${encodeURIComponent(regions.join(","))}`).then(r=>r.json()).then(d => {
      if (requeteId !== sousZonesRequeteId.current) return
      setSousZonesDispo(d.sous_zones)
      setSousZones(sz => sz.filter(s => d.sous_zones.includes(s)))
    })
  }, [regions])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const monstresRequeteId = useRef(0)
  useEffect(() => {
    if (!niveauBounds) return
    const requeteId = ++monstresRequeteId.current
    setLoading(true)
    const params = new URLSearchParams({
      search, tri, page, page_size: PAGE_SIZE,
      region: regions.join(","), sous_zone: sousZones.join(","), categorie: categories.join(","),
      niveau_min: niveauMin, niveau_max: niveauMax,
    })
    fetch(`${API}/monstres?${params}`)
      .then(r=>r.json())
      .then(d => {
        if (requeteId !== monstresRequeteId.current) return
        setMonstres(d.monstres); setTotal(d.total); setLoading(false)
      })
      .catch(()=>{ if (requeteId === monstresRequeteId.current) setLoading(false) })
  }, [search, tri, regions, sousZones, categories, niveauMin, niveauMax, page, niveauBounds])

  const toggleRegion = (r) => { setRegions(rs => rs.includes(r) ? rs.filter(x=>x!==r) : [...rs, r]); setPage(1) }
  const toggleSousZone = (s) => { setSousZones(ss => ss.includes(s) ? ss.filter(x=>x!==s) : [...ss, s]); setPage(1) }
  const toggleCategorie = (c) => { setCategories(cs => cs.includes(c) ? cs.filter(x=>x!==c) : [...cs, c]); setPage(1) }
  const libelleCategorie = (v) => categoriesDispo.find(c=>c.valeur===v)?.label || v

  const chips = [
    ...regions.map(r => ({ label:r, off:()=>toggleRegion(r) })),
    ...sousZones.map(s => ({ label:s, off:()=>toggleSousZone(s) })),
    ...categories.map(c => ({ label:libelleCategorie(c), off:()=>toggleCategorie(c) })),
    ...(niveauBounds && (niveauMin > niveauBounds.min || niveauMax < niveauBounds.max)
      ? [{ label:`Niv. ${niveauMin}-${niveauMax}`, off:()=>{ setNiveauMin(niveauBounds.min); setNiveauMax(niveauBounds.max); setPage(1) } }]
      : []),
  ]

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const groupes = useMemo(() => grouperMonstres(monstres, tri), [monstres, tri])

  const reinitialiser = () => {
    setSearchInput(""); setSearch(""); setRegions([]); setSousZones([]); setCategories([])
    if (niveauBounds) { setNiveauMin(niveauBounds.min); setNiveauMax(niveauBounds.max) }
    setPage(1)
  }

  return (
    <div style={mp.page}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={{ display:"flex", alignItems:"baseline", gap:14, flexWrap:"wrap", marginBottom:18 }}>
        <h1 className="df-section-title" style={{ fontSize:"clamp(24px, 4vw, 32px)", margin:0 }}>Bestiaire</h1>
        <span style={{ color:"var(--df-text-3)", fontSize:13.5 }}>{total} créature{total!==1?"s":""}</span>
      </div>

      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", gap:10, background:"rgba(20,26,46,0.95)", border:"1px solid rgba(77,216,230,0.5)", borderRadius:12, padding:"11px 16px" }}>
          <SearchIcon />
          <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Rechercher une créature..."
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--df-text)", fontSize:14 }} />
        </div>
        <select value={tri} onChange={e=>{ setTri(e.target.value); setPage(1) }}
          style={{ background:"rgba(20,26,46,0.95)", color:"var(--df-text)", border:"1px solid rgba(255,198,61,0.35)", borderRadius:12, padding:"11px 14px", fontSize:13.5, cursor:"pointer" }}>
          <option value="az">A → Z</option>
          <option value="zone">Par zone</option>
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
          <div className="df-section-title" style={{ ...ftitle, marginTop:0 }}>Zone</div>
          {regionsDispo.map(r => (
            <label key={r} style={fchk}>
              <input type="checkbox" checked={regions.includes(r)} onChange={()=>toggleRegion(r)} style={fchkInput} />
              {r}
            </label>
          ))}

          <div className="df-section-title" style={ftitle}>Sous-zone</div>
          {sousZonesDispo.length === 0
            ? <div style={{ color:"var(--df-text-3)", fontSize:11.5, fontStyle:"italic" }}>Coche une zone pour affiner par sous-zone</div>
            : sousZonesDispo.map(s => (
                <label key={s} style={{ ...fchk, paddingLeft:22, fontSize:12.5, color:"var(--df-text-2)" }}>
                  <input type="checkbox" checked={sousZones.includes(s)} onChange={()=>toggleSousZone(s)} style={{ ...fchkInput, accentColor:"var(--df-cyan)" }} />
                  {s}
                </label>
              ))
          }

          <div className="df-section-title" style={ftitle}>Catégorie</div>
          {categoriesDispo.map(c => (
            <label key={c.valeur} style={fchk}>
              <input type="checkbox" checked={categories.includes(c.valeur)} onChange={()=>toggleCategorie(c.valeur)} style={fchkInput} />
              {c.label}
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
        </aside>

        <div>
          {!loading && monstres.length === 0 ? (
            <div style={mp.videEtat}>
              Aucune créature ne correspond à ces filtres.
              {chips.length > 0 && <div style={{ marginTop:10 }}>
                <button onClick={reinitialiser} style={mp.resetBtn}>Réinitialiser les filtres</button>
              </div>}
            </div>
          ) : groupes.map((g, gi) => (
            <div key={g.cle + gi}>
              <div style={{ display:"flex", alignItems:"center", gap:12, margin: gi===0 ? "0 0 12px" : "24px 0 12px" }}>
                <span style={{ color:"var(--df-gold)", fontWeight:700, fontSize:18 }}>{g.cle}</span>
                <span style={{ flex:1, height:1, background:"rgba(255,198,61,0.2)" }} />
                <span style={{ color:"var(--df-text-3)", fontSize:11.5 }}>{g.items.length} créature{g.items.length>1?"s":""}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(136px, 1fr))", gap:12 }}>
                {g.items.map(m => (
                  <div key={m.id} className="df-tile" onClick={()=>onSelect(m.id)}
                    onMouseEnter={()=>setTip(m.id)} onMouseLeave={()=>setTip(null)}
                  >
                    {m.image_url
                      ? <img src={m.image_url} alt={m.nom} style={{ width:44, height:44, objectFit:"contain", margin:"0 auto 10px", display:"block" }} />
                      : <div style={{ width:44, height:44, borderRadius:10, margin:"0 auto 10px", background:"rgba(12,15,29,0.8)", border:"1px solid rgba(255,198,61,0.3)" }} />
                    }
                    <div style={{ color:"var(--df-gold)", fontWeight:700, fontSize:12.5, lineHeight:1.25, minHeight:31, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>{m.nom}</div>
                    <div style={{ color:"var(--df-text-3)", fontSize:11, marginTop:4 }}>Niv. {m.niveau ?? "—"}</div>
                    {m.categorie !== "monstre" && (
                      <span className={"df-tile-badge" + CATEGORIE_BADGE_CLASSE[m.categorie]}>{CATEGORIE_BADGE_TEXTE[m.categorie]}</span>
                    )}
                    {tip === m.id && (
                      <div className="df-tooltip">
                        <div style={{ color:"var(--df-cyan)", fontSize:12.5, fontWeight:600 }}>{m.region || "Région inconnue"}</div>
                        {m.sous_zone && <div style={{ color:"var(--df-text-2)", fontSize:12, marginTop:2 }}>{m.sous_zone}</div>}
                        <div style={{ color:"var(--df-text)", fontSize:12, marginTop:8, paddingTop:8, borderTop:"1px solid rgba(255,198,61,0.15)" }}>{libelleCategorie(m.categorie)}</div>
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

// ============================================================
// Grimoire des Secrets (chantier Grimoire, structure phase 1+2, puis refonte
// "focus Songes" le 2 août 2026 — Dofura est un outil de suivi des Songes,
// le Grimoire ne montre plus que ce qui sert en plein songe. Voir
// IDENTITE.md pour le detail complet du diagnostic/plan). Équipements/
// Ressources/Panoplies retires de la barre d'onglets — leurs pages
// (ObjetsPage/BestiairePage/PanopliesPage) et routes backend restent
// intactes, juste plus atteignables depuis ici (regle absolue du chantier :
// on masque l'affichage, on ne supprime aucune donnee ni composant).
// Onglets : Tout / Items de songe (2 août 2026, "Monstres" retire — voir
// point plus bas). "Tout" EST le bestiaire (monstres/boss/avis) hors
// recherche ; des qu'une recherche est saisie, les items de songe
// correspondants remontent aussi dans "Tout" (voir IDENTITE.md). Cliquer un
// resultat ouvre un PANNEAU LATERAL par-dessus la liste plutot qu'une
// nouvelle page (regle centrale des specs) — la recherche/les onglets
// vivent dans GrimoirePage et ne sont jamais reinitialises a l'ouverture/
// fermeture du panneau, donc "fermer" ramene exactement a l'etat de
// recherche precedent. Reutilise tel quel /monstres (avec un filtre
// categorie force, voir CATEGORIES_MONSTRE_GRIMOIRE) et
// /songes/items-trackables (endpoint deja existant, SONGES.md) — aucun
// nouvel endpoint necessaire. Fiches detail existantes (ObjetDetailPage,
// MonstrePage, PanoplieDetailPage — cette derniere gardee pour les liens
// croises panoplie depuis une legende) simplement rendues dans le panneau
// au lieu d'une page pleine, meme code, DRY.
//
// Onglet "Monstres" retire (2 août 2026) : sans la section Items de songe
// affichee par defaut dans "Tout" (retour Popo — "La Bibliotheque doit
// etre un bestiaire pur"), "Tout" hors recherche et "Monstres" affichaient
// exactement la meme chose — deux onglets identiques, retenu comme du
// bruit plutot qu'un choix delibere. "Tout" reprend directement la
// pagination complete + les filtres (Zone/Sous-zone/Niveau/Categorie) qu'
// avait "Monstres".

// Categories monstre autorisees dans le Grimoire (2 août 2026) : les
// monstres de quete et les archimonstres n'existent pas en songe — masques
// ICI, dans la construction de la requete (grimoireParams), jamais dans
// /monstres lui-meme. Cet endpoint est PARTAGE avec l'Archidex de la Chasse
// aux Dofus (fetch categorie=archi explicite, App.jsx ~ligne 780) : lui
// retirer sa capacite a filtrer sur archi aurait casse cette autre
// fonctionnalite. Verifie en base (2 août 2026) : boss∩archi=0 et
// boss∩quête=0, donc "boss,monstre" = exactement 1 862 monstres (135+1727),
// aucun cas de priorite/chevauchement a gerer.
// "avis" ajoute le meme jour : les Avis de recherche sont des monstres
// officiels du jeu croises en songe, identifies via race LIKE 'Avis de
// recherche%' (main.py, CATEGORIE_CONDITIONS) — 95 monstres, tous avec
// famille='Créatures de quête' donc masques par erreur sans cet ajout
// specifique. "boss,monstre,avis" = 1 957 (1862+95), verifie en base.
const CATEGORIES_MONSTRE_GRIMOIRE = ["boss", "monstre", "avis"]
// Ordre d'affichage des cases a cocher (2 août 2026, retour Popo) — distinct
// de l'ordre de CATEGORIE_LABELS (qui reflete plutot la priorite d'affichage
// des badges, boss en tete).
const ORDRE_CATEGORIE_FILTRE = ["monstre", "boss", "avis"]

// Libelles courts pour la sous-ligne des items de songe (typeId "songe") —
// memes 4 categories que songe_items_trackables (SONGES.md), affichage
// uniquement.
const SONGE_CATEGORIE_LABELS = { legende:"Légende", legende_animale:"Légende animale", cosmetique:"Cosmétique", rune_astrale:"Rune astrale" }

// Carte uniforme (§CONTRAINTES : "cartes visuellement uniformes, meme
// quand les donnees different selon le type") — un seul composant, la
// sous-ligne et le badge s'adaptent au type plutot que des cartes copiees-collees.
function GrimoireTuile({ item, typeId, onClick }) {
  const img = item.img || item.image_url || null
  const sousLigne = typeId === "monstre"
    ? `Niv. ${item.niveau ?? "—"}`
    : typeId === "songe"
    ? (SONGE_CATEGORIE_LABELS[item.categorie] || item.categorie)
    : `Niv. ${item.niveau} — ${item.type_nom || "—"}`
  const badge = typeId === "monstre" && item.categorie && item.categorie !== "monstre" ? CATEGORIE_BADGE_TEXTE[item.categorie]
    : null
  // Classe de couleur du badge jamais branchee ici avant (trouve en testant
  // "Avis de recherche", 2 août 2026) — sans elle, tout badge non-"monstre"
  // retombait sur le style par defaut de .df-tile-badge (doré, celui de
  // BOSS), invisible tant que seul "boss" apparaissait dans le Grimoire.
  const badgeClasse = item.categorie ? (CATEGORIE_BADGE_CLASSE[item.categorie] || "") : ""
  return (
    <div className="df-tile" onClick={onClick}>
      {/* Pastille discrete "modifie en songe" (2 août 2026) — coin haut-droit,
          violet Paradoxe #C478FF comme l'encadre "EN SONGE" de la fiche,
          volontairement petite (juste un repere avant d'ouvrir la fiche,
          pas un badge de categorie de plus). */}
      {typeId === "monstre" && item.modif_songe && (
        <span title="Modifié en songe" style={{ position:"absolute", top:8, right:8, width:8, height:8, borderRadius:"50%", background:"#C478FF", boxShadow:"0 0 6px rgba(196,120,255,0.8)" }} />
      )}
      {img
        ? <img src={img} alt={item.nom} style={{ width:44, height:44, objectFit:"contain", margin:"0 auto 10px", display:"block" }} />
        : <div style={{ width:44, height:44, borderRadius:10, margin:"0 auto 10px", background:"rgba(12,15,29,0.8)", border:"1px solid rgba(255,198,61,0.3)" }} />
      }
      <div style={{ color:"var(--df-gold)", fontWeight:700, fontSize:12.5, lineHeight:1.25, minHeight:31, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>{item.nom}</div>
      <div style={{ color:"var(--df-text-3)", fontSize:11, marginTop:4 }}>{sousLigne}</div>
      {badge && <span className={"df-tile-badge" + badgeClasse}>{badge}</span>}
    </div>
  )
}

// ============================================================
// Fiches en panneau overlay (chantier react-router, palier 1)
// ============================================================
// Remplace l'ancien GrimoirePanel (pile de navigation locale à GrimoirePage,
// setState pur) par un mécanisme global au routeur : les fiches monstre/objet
// vivent maintenant à leurs propres URL (/monstres/:id, /objets/:id) et
// s'ouvrent en overlay AU-DESSUS DE L'ÉCRAN COURANT, quel qu'il soit
// (Bibliothèque, Les Taux, L'Œil de Draconiros, ou la recherche navbar
// depuis n'importe quel écran) — pas seulement au-dessus de la Bibliothèque
// comme l'ancien mécanisme. Pattern "backgroundLocation" officiel de
// react-router : l'écran d'où part le clic est mémorisé dans l'état de
// navigation (location.state.backgroundLocation), voir AppInterne plus bas
// qui rend ce fond via un second <Routes> sans changer la location visible.

// Ouvre une fiche en overlay. Si on est DÉJÀ dans une fiche (backgroundLocation
// présent), on le PROPAGE tel quel plutôt que d'écraser par la fiche qu'on
// quitte — sinon le fond visible changerait à chaque saut objet<->monstre
// imbriqué (ex. depuis un objet, cliquer sur "dropé par" un monstre).
function useOuvrirFiche() {
  const navigate = useNavigate()
  const location = useLocation()
  return (chemin) => {
    const fond = location.state?.backgroundLocation || location
    navigate(chemin, { state: { backgroundLocation: fond } })
  }
}

// Ferme une fiche. "← Retour" (rendu par la fiche elle-même) dépile un
// niveau via l'historique du navigateur — utile pour les chaînes
// monstre -> objet -> monstre imbriquées, chacune poussée comme sa propre
// entrée d'historique. La croix (rendue par le panneau) revient directement
// à l'écran de fond mémorisé, quelle que soit la profondeur. Sans
// backgroundLocation (arrivée directe sur l'URL, F5, lien partagé) : pas
// d'historique interne à dépiler — naviguer en arrière sortirait du site,
// donc les DEUX replient sur /bibliotheque au lieu de faire navigate(-1).
function useFermerFiche() {
  const navigate = useNavigate()
  const location = useLocation()
  const fond = location.state?.backgroundLocation
  return {
    onRetour: () => { fond ? navigate(-1) : navigate("/bibliotheque", { replace:true }) },
    onFermer: () => { fond ? navigate(fond) : navigate("/bibliotheque", { replace:true }) },
  }
}

// Chrome du panneau flottant — extrait à l'identique de l'ancien
// GrimoirePanel (fond assombri, cadre ancré à droite, croix fixe en haut à
// droite) pour être partagé par toutes les fiches en overlay désormais,
// quel que soit l'écran de fond. Sur mobile, occupe l'écran entier
// (100vw) — même mécanique qu'avant, juste plus large.
function PanneauFiche({ onFermer, children }) {
  return (
    <>
      <div onClick={onFermer} style={{ position:"fixed", inset:0, background:"rgba(6,8,16,0.6)", zIndex:300 }} />
      <div style={{
        position:"fixed", top:0, right:0, height:"100vh", width:"min(860px, 100vw)",
        background:"var(--df-panel-bg)", borderLeft:"1px solid rgba(255,198,61,0.25)",
        boxShadow:"-12px 0 40px rgba(0,0,0,0.5)", zIndex:301, overflowY:"auto",
      }}>
        {/* position:fixed (pas absolute) : reste ancré en haut à droite du
            viewport quel que soit le defilement interne du panneau. */}
        <button onClick={onFermer} title="Fermer" style={{
          position:"fixed", top:14, right:14, zIndex:302, width:32, height:32, borderRadius:"50%",
          background:"rgba(20,26,46,0.9)", border:"1px solid rgba(255,198,61,0.4)", color:"var(--df-gold)",
          fontSize:16, cursor:"pointer", lineHeight:"30px",
        }}>✕</button>
        {children}
      </div>
    </>
  )
}

// id lu via useParams() (jamais reçu en mémoire) : MonstrePage/ObjetDetailPage
// font déjà leur propre fetch par id (voir leur useEffect), donc un F5 direct
// sur /monstres/:id fonctionne sans rien changer à ces composants — juste
// les envelopper ici. onSelectDonjon reste branché sur le résidu mort
// (handleSelectDonjon, inchangé, voir AppInterne) : les donjons ne font plus
// partie du produit mais ce lien croisé existant ne doit pas planter.
function MonstreOverlay({ onSelectDonjon }) {
  const { id } = useParams()
  const { onRetour, onFermer } = useFermerFiche()
  return (
    <PanneauFiche onFermer={onFermer}>
      <MonstrePage id={id} onSelectDonjon={onSelectDonjon} onBack={onRetour} />
    </PanneauFiche>
  )
}

// onSelectPanoplie reste lui aussi branché sur le résidu mort
// (handleSelectPanoplie) : les panoplies ne font plus partie du produit.
// Différence connue avec l'ancien comportement, signalée séparément —
// aujourd'hui ce lien restait dans le MÊME panneau flottant (pile locale à
// GrimoirePage), après la bascule il fait sortir de l'overlay vers l'ancien
// mécanisme plein-écran (résidu inchangé, pas de nouvelle route créée pour
// un domaine hors périmètre).
function ObjetOverlay({ onSelectDonjon, onSelectPanoplie }) {
  const { id } = useParams()
  const { onRetour, onFermer } = useFermerFiche()
  const abrirFiche = useOuvrirFiche()
  return (
    <PanneauFiche onFermer={onFermer}>
      <ObjetDetailPage id={id}
        onSelect={(nouvelId) => abrirFiche(`/objets/${nouvelId}`)}
        onSelectMonstre={(nouvelId) => abrirFiche(`/monstres/${nouvelId}`)}
        onSelectDonjon={onSelectDonjon} onSelectPanoplie={onSelectPanoplie}
        onBack={onRetour} />
    </PanneauFiche>
  )
}

// Construit les parametres cote backend pour /monstres (chantier Grimoire).
// Categorie TOUJOURS restreinte a CATEGORIES_MONSTRE_GRIMOIRE (boss+monstre)
// meme sans selection utilisateur — c'est ce qui masque quete/archi par
// defaut ; si l'utilisateur coche une sous-partie (ex. juste "Boss de
// donjon"), on affine a l'interieur de cet ensemble deja restreint, jamais
// au-dela.
function grimoireParams(typeId, f) {
  if (typeId === "monstre") {
    const categoriesActives = (f.categoriesMonstre && f.categoriesMonstre.length > 0) ? f.categoriesMonstre : CATEGORIES_MONSTRE_GRIMOIRE
    return {
      tri:"az",
      region:(f.regions||[]).join(","), sous_zone:(f.sousZones||[]).join(","),
      categorie: categoriesActives.join(","),
      // Repli 9999 (pas 999, bug preexistant trouve en verifiant le compteur
      // du mode "Tout" — les monstres vont jusqu'au niveau 1600, un repli a
      // 999 excluait 4 monstres du total affiche en aperçu) : n'importe
      // quel niveau reel, jamais un plafond artificiel.
      niveau_min: f.niveauMin ?? 1, niveau_max: f.niveauMax ?? 9999,
    }
  }
  return {}
}

function GrimoirePage({ onBack, onSelectMonstre, onSelectObjet }) {
  // Renommee "La Bibliotheque" (2 août 2026, ex-"Grimoire des Secrets") —
  // premiere page du site a piloter document.title (aucune autre page ne le
  // fait aujourd'hui, pas de mecanisme partage a reutiliser).
  useEffect(() => { document.title = "La Bibliothèque — Dofura" }, [])

  const [activeTab, setActiveTab] = useState("bestiaire")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [resultats, setResultats] = useState({ total:0, items:[] })
  const [loading, setLoading] = useState(true)

  // Filtre specialise (2 août 2026 : Zone/Sous-zone/Niveau retires de
  // l'interface — "La Bibliothèque doit rester un bestiaire pur, panneau
  // resserre a la Categorie". Cote backend, /monstres et /monstres/filtres
  // gardent leurs parametres region/sous_zone/niveau_min/niveau_max intacts
  // (demande explicite : reservables plus tard) — grimoireParams ne les
  // envoie simplement plus (repli par defaut du cote serveur = aucun
  // filtre), voir plus bas. Seule Categorie reste geree cote client.
  const [categoriesMonstre, setCategoriesMonstre] = useState([])
  const [categoriesDispo, setCategoriesDispo] = useState([])

  // Items de songe (2 août 2026) : les 38 items trackables, endpoint deja
  // existant (GET /songes/items-trackables, SONGES.md) — ensemble fixe,
  // charge une seule fois au montage (pas de pagination serveur, pas de
  // filtre categorie a construire cote backend). item_id renomme en id pour
  // matcher la forme attendue par GrimoireTuile/onClicResultat (memes noms
  // que /objets, /monstres, /panoplies).
  const [songeItemsTous, setSongeItemsTous] = useState(null)
  useEffect(() => {
    fetch(`${API}/songes/items-trackables`).then(r=>r.json()).then(d => {
      setSongeItemsTous(d.items.map(it => ({ ...it, id: it.item_id })))
    })
  }, [])
  // Recherche filtree cote client (38 items, pas besoin d'aller-retour
  // serveur) — reagit au meme etat `search` (debounce deja fait ci-dessous)
  // que les onglets a pagination backend, pour un comportement uniforme.
  const songeFiltres = useMemo(() => {
    if (!songeItemsTous) return []
    if (!search) return songeItemsTous
    const q = search.toLowerCase()
    return songeItemsTous.filter(it => it.nom.toLowerCase().includes(q))
  }, [songeItemsTous, search])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  // Changement d'onglet : filtres remis a zero + options du panneau
  // rechargees pour le type nouvellement actif. "songe" n'a pas de filtres
  // specialises (ensemble fixe de 38 items, deja charge ci-dessus), rien a
  // faire ici pour cet onglet. "bestiaire" ne recupere plus que Categorie
  // (Zone/Sous-zone/Niveau retires de l'interface, 2 août 2026) — reordonnee
  // selon ORDRE_CATEGORIE_FILTRE (Monstre, Boss, Avis), pas l'ordre brut de
  // l'API (qui reflete la priorite des badges, boss en tete).
  useEffect(() => {
    setPage(1)
    setCategoriesMonstre([])

    if (activeTab === "bestiaire") {
      fetch(`${API}/monstres/filtres`).then(r=>r.json()).then(d => {
        // "Monstre de quête"/"Archimonstre" retires du filtre (2 août 2026) :
        // masques partout dans le Grimoire (voir grimoireParams), inutile de
        // proposer un filtre sur ce qui n'est plus jamais affiche.
        const dispo = d.categories.filter(c => CATEGORIES_MONSTRE_GRIMOIRE.includes(c.valeur))
        dispo.sort((a, b) => ORDRE_CATEGORIE_FILTRE.indexOf(a.valeur) - ORDRE_CATEGORIE_FILTRE.indexOf(b.valeur))
        setCategoriesDispo(dispo)
      })
    }
  }, [activeTab])

  const requeteId = useRef(0)

  // Onglet "Bestiaire" (ex-"Tout", ex-fusion avec "Monstres" — 2 août 2026,
  // voir commentaire en tete de fichier) : pagination complete, plus que le
  // filtre Categorie cote interface. region/sous_zone/niveau_min/niveau_max
  // NE SONT PLUS ENVOYES (grimoireParams les reçoit undefined → replis par
  // defaut = aucun filtre, tout le bestiaire) mais restent acceptes par
  // /monstres cote backend, volontairement pas retires (demande explicite,
  // reservables plus tard). "songe" gere entierement en dehors de cet effet
  // (donnees locales, voir songeFiltres plus haut).
  useEffect(() => {
    if (activeTab !== "bestiaire") return
    const id = ++requeteId.current
    setLoading(true)
    const params = new URLSearchParams({
      ...grimoireParams("monstre", { categoriesMonstre }),
      search, page, page_size: PAGE_SIZE,
    })
    fetch(`${API}/monstres?${params}`).then(r=>r.json()).then(d => {
      if (id !== requeteId.current) return
      setResultats({ total: d.total, items: d.monstres })
      setLoading(false)
    }).catch(() => { if (id === requeteId.current) setLoading(false) })
  }, [activeTab, search, page, categoriesMonstre])

  const toggleCategorieMonstre = (c) => { setCategoriesMonstre(cs => cs.includes(c) ? cs.filter(x=>x!==c) : [...cs, c]); setPage(1) }
  const libelleCategorieMonstre = (v) => categoriesDispo.find(c=>c.valeur===v)?.label || v

  // Un item de songe est un objet (dont les 26 légendes, des équipements à
  // part entière) — sa fiche complète (effets + recette) vit dans
  // ObjetDetailPage, réutilisée telle quelle via /objets/:id (chantier
  // react-router, palier 1 : navigue maintenant vers l'URL de la fiche au
  // lieu d'empiler un état local — voir onSelectMonstre/onSelectObjet,
  // câblés par AppInterne avec le pattern backgroundLocation).
  const onClicResultat = (typeId, id) => {
    if (typeId === "songe") onSelectObjet(id)
    else onSelectMonstre(id)
  }

  const reinitialiserFiltres = () => {
    setCategoriesMonstre([])
    setPage(1)
  }

  const chips = activeTab === "bestiaire"
    ? categoriesMonstre.map(c => ({ label:libelleCategorieMonstre(c), off:()=>toggleCategorieMonstre(c) }))
    : []

  const totalPages = Math.max(Math.ceil(resultats.total / PAGE_SIZE), 1)
  const montrerFiltres = activeTab === "bestiaire"

  return (
    <div style={{ ...mp.page, position:"relative", zIndex:0, overflow:"hidden" }}>
      {/* Fond de page (2 août 2026) — voir .df-grimoire-bg (tokens.css) pour
          la recette complète (position absolute, z-index sous le contenu,
          pointer-events:none, opacity/flou/vignette, masqué sous 900px). */}
      <div className="df-grimoire-bg" aria-hidden="true" />
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={{ marginBottom:6 }}>
        <h1 className="df-section-title" style={{ fontSize:"clamp(24px, 4vw, 32px)", margin:0 }}>La Bibliothèque</h1>
        <div style={{ color:"var(--df-text-3)", fontSize:12.5, marginTop:4 }}>Monstres, sorts, boss : tout ce qu'un songeur a besoin de vérifier.</div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(20,26,46,0.95)", border:"1px solid rgba(77,216,230,0.5)", borderRadius:12, padding:"11px 16px", margin:"18px 0 14px" }}>
        <SearchIcon />
        <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
          placeholder="Rechercher un monstre, un item de songe..."
          style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--df-text)", fontSize:14 }} />
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        <button onClick={()=>setActiveTab("bestiaire")} className="df-chip-filter"
          style={activeTab==="bestiaire" ? { background:"rgba(77,216,230,0.18)", color:"var(--df-cyan)", borderColor:"var(--df-cyan)" } : undefined}>
          Bestiaire
        </button>
        {/* Onglet a venir (2 août 2026) : le contenu (sorts de fontaine)
            n'existe pas encore, place preparee uniquement. disabled natif
            (pas juste un style grise) — inutilisable au clic ET au clavier,
            un <button disabled> est automatiquement retire du tab order par
            le navigateur, donc jamais de piege de focus a gerer a la main. */}
        <button disabled className="df-chip-filter" aria-label="Sorts de songe — bientôt disponible"
          style={{ opacity:.45, cursor:"not-allowed", display:"inline-flex", alignItems:"center", gap:6 }}>
          Sorts de songe
          <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:".04em", textTransform:"uppercase", padding:"2px 6px", borderRadius:999, background:"rgba(255,255,255,0.08)", color:"var(--df-text-3)" }}>
            Bientôt
          </span>
        </button>
        <button onClick={()=>setActiveTab("songe")} className="df-chip-filter"
          style={activeTab==="songe" ? { background:"rgba(77,216,230,0.18)", color:"var(--df-cyan)", borderColor:"var(--df-cyan)" } : undefined}>
          Items de songe
        </button>
        {montrerFiltres && (
          <button className="df-filters-toggle" onClick={()=>setShowFilters(s=>!s)}
            style={{ marginLeft:"auto", background:"rgba(255,198,61,0.08)", color:"var(--df-gold)", border:"1px solid rgba(255,198,61,0.6)", borderRadius:12, padding:"9px 16px", fontSize:13.5, fontWeight:600, cursor:"pointer" }}>
            Filtres{chips.length>0?` (${chips.length})`:""}
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16, alignItems:"center" }}>
          {chips.map((c,i) => (
            <button key={i} className="df-chip-filter" onClick={c.off}>{c.label} <span className="x">✕</span></button>
          ))}
          <button onClick={reinitialiserFiltres} style={{ background:"none", border:"none", color:"var(--df-text-3)", fontSize:12.5, cursor:"pointer", textDecoration:"underline" }}>
            Tout effacer
          </button>
        </div>
      )}

      {/* Panneau resserre a la seule Categorie (2 août 2026, retour Popo) —
          largeur de la colonne aside reduite en style inline (260px→190px,
          pas touche a la regle globale .df-list-wrap, partagee avec
          d'autres pages) pour rendre a la grille la largeur liberee, et
          padding vertical resserre (20px→16px) pour eviter une grande boite
          vide maintenant que le contenu tient en 3 cases. */}
      <div className={montrerFiltres ? "df-list-wrap" : undefined} style={montrerFiltres ? { gridTemplateColumns:"190px 1fr" } : undefined}>
        {montrerFiltres && (
        <aside className={"df-filters-panel" + (showFilters?" df-filters-open":"")}
          style={{ background:"rgba(20,26,46,0.92)", border:"1px solid rgba(255,198,61,0.2)", borderRadius:16, padding:16 }}>
          <div className="df-section-title" style={{ ...ftitle, marginTop:0 }}>Catégorie</div>
          {categoriesDispo.map(c => (
            <label key={c.valeur} style={fchk}>
              <input type="checkbox" checked={categoriesMonstre.includes(c.valeur)} onChange={()=>toggleCategorieMonstre(c.valeur)} style={fchkInput} />
              {c.label}
            </label>
          ))}
        </aside>
        )}

        <div>
          {activeTab === "bestiaire" ? (
            <>
              {/* Items de songe : jamais affiches hors recherche (retour Popo,
                  2 août 2026 — "La Bibliothèque doit être un bestiaire pur").
                  Des qu'une recherche est saisie, les deux categories
                  remontent ensemble comme avant — la liste est petite (38
                  items max), tous les resultats sont montres, pas de "Voir
                  tout" ni de troncature necessaire. */}
              {search && songeFiltres.length > 0 && (
                <div style={{ marginBottom:26 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <span style={{ color:"var(--df-gold)", fontWeight:700, fontSize:18 }}>Items de songe {songeFiltres.length}</span>
                    <span style={{ flex:1, height:1, background:"rgba(255,198,61,0.2)" }} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(136px, 1fr))", gap:12 }}>
                    {songeFiltres.map(item => (
                      <GrimoireTuile key={item.id} item={item} typeId="songe" onClick={()=>onClicResultat("songe", item.id)} />
                    ))}
                  </div>
                </div>
              )}

              {!loading && resultats.items.length === 0 ? (
                <div style={mp.videEtat}>
                  Aucun résultat pour cette recherche.
                  {chips.length > 0 && <div style={{ marginTop:10 }}>
                    <button onClick={reinitialiserFiltres} style={mp.resetBtn}>Réinitialiser les filtres</button>
                  </div>}
                </div>
              ) : (
                <>
                  {/* Titre neutre (retour Popo, 2 août 2026) : "Monstres X"
                      pretait à confusion en filtrant sur Avis de recherche
                      seul — ce ne sont pas des "monstres" au sens du filtre. */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <span style={{ color:"var(--df-gold)", fontWeight:700, fontSize:18 }}>Bestiaire {resultats.total}</span>
                    <span style={{ flex:1, height:1, background:"rgba(255,198,61,0.2)" }} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(136px, 1fr))", gap:12 }}>
                    {resultats.items.map(item => (
                      <GrimoireTuile key={item.id} item={item} typeId="monstre" onClick={()=>onClicResultat("monstre", item.id)} />
                    ))}
                  </div>
                </>
              )}
              {totalPages > 1 && (
                <div style={mp.pagination}>
                  <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={mp.pageBtn(page<=1)}>← Précédent</button>
                  <span style={mp.pageLabel}>Page {page} / {totalPages}</span>
                  <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={mp.pageBtn(page>=totalPages)}>Suivant →</button>
                </div>
              )}
            </>
          ) : (
            songeItemsTous === null ? (
              <div style={mp.videEtat}>Chargement...</div>
            ) : songeFiltres.length === 0 ? (
              <div style={mp.videEtat}>Aucun résultat pour cette recherche.</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(136px, 1fr))", gap:12 }}>
                {songeFiltres.map(item => (
                  <GrimoireTuile key={item.id} item={item} typeId="songe" onClick={()=>onClicResultat("songe", item.id)} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

const DIFFICULTE_ETOILES = (n) => "★".repeat(Math.max(n, 0)) + "☆".repeat(Math.max(4 - n, 0))

function DonjonDetailPage({ id, token, onSelectMonstre, onSelectObjet, onSelectQuete, onSelectSucces, onBack }) {
  const [data, setData] = useState(null)
  const [favoriEnCours, setFavoriEnCours] = useState(false)
  const [messageConnexion, setMessageConnexion] = useState(false)

  useEffect(() => {
    setData(null)
    const headers = token ? { Authorization:`Bearer ${token}` } : {}
    fetch(`${API}/donjons/${id}`, { headers }).then(r=>r.json()).then(setData)
  }, [id, token])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:C.txt2, fontSize:14 }}>{data.erreur}</div>

  const acces = []
  if (data.recherche_groupe) acces.push("Recherche de groupe")
  if (data.disponible_hall) acces.push("Hall des Souvenirs")
  if (data.disponible_trousseau) acces.push("Trousseau")

  const aGuide = data.guide && (data.guide.mecaniques?.length > 0 || data.guide.salles?.length > 0 || data.guide.compo_conseillee)

  // ★ favori : demo concrete du systeme progression/comptes (Phase 4) sur la
  // seule fiche detail deja construite a ce stade du roadmap (donjons). Pas
  // connecte -> pas d'appel API, juste une invite a se connecter.
  const toggleFavori = () => {
    if (!token) { setMessageConnexion(true); return }
    setFavoriEnCours(true)
    const methode = data.favori ? "DELETE" : "POST"
    const url = data.favori
      ? `${API}/favoris?element_type=donjon&element_id=${id}`
      : `${API}/favoris`
    fetch(url, {
      method: methode,
      headers: { Authorization:`Bearer ${token}`, ...(methode==="POST" ? {"Content-Type":"application/json"} : {}) },
      body: methode==="POST" ? JSON.stringify({ element_type:"donjon", element_id:String(id) }) : undefined,
    })
      .then(r=>r.json())
      .then(d => { setData(prev => ({ ...prev, favori:d.favori })); setFavoriEnCours(false) })
      .catch(()=>setFavoriEnCours(false))
  }

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem", maxWidth:900, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr2}`, borderRadius:12, padding:"18px 20px", display:"grid", gridTemplateColumns:"100px 1fr", gap:20, marginBottom:16, position:"relative" }}>
        <div style={{ position:"absolute", top:14, right:16, textAlign:"right" }}>
          <span onClick={toggleFavori} title={data.favori?"Retirer des favoris":"Ajouter aux favoris"}
            style={{ fontSize:22, lineHeight:1, cursor:favoriEnCours?"default":"pointer", color:data.favori?C.gold:C.txt3, opacity:favoriEnCours?0.5:1, userSelect:"none" }}>
            {data.favori ? "★" : "☆"}
          </span>
          {messageConnexion && (
            <div style={{ marginTop:4, fontSize:11, color:C.txt2, maxWidth:150 }}>
              Connecte-toi pour ajouter des favoris
              <span onClick={()=>setMessageConnexion(false)} style={{ marginLeft:6, color:C.txt3, cursor:"pointer" }}>✕</span>
            </div>
          )}
        </div>
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
        <div style={{ background:C.bg2, border:`0.5px solid ${C.bdr}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
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

      {data.quetes_associees?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.cyanb}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Quêtes associées</div>
          {data.quetes_associees.map(q => (
            <div key={q.id} onClick={()=>onSelectQuete(q.id)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", cursor:"pointer" }}>
              <span style={{ fontSize:12, color:C.cyan, fontWeight:600 }}>{q.nom}</span>
              <span style={{ fontSize:11, color:C.txt3, marginLeft:"auto" }}>Niv. {q.niveau_min}</span>
            </div>
          ))}
        </div>
      )}

      {data.succes_du_donjon?.length > 0 && (
        <div style={{ background:C.bg2, border:`0.5px solid ${C.goldb}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:10 }}>Succès du donjon</div>
          {data.succes_du_donjon.map(s => (
            <div key={s.id} onClick={()=>onSelectSucces(s.id)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", cursor:"pointer" }}>
              <span style={{ fontSize:12, color:C.gold, fontWeight:600 }}>{s.nom}</span>
              <span style={{ fontSize:11, color:C.txt3, marginLeft:"auto" }}>{s.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const CATEGORIE_QUETE_LABELS = { repetable:"Répétable", autre:"Quête" }

// Regroupement sous en-tetes : "zone" (defaut §5 specs) groupe par region
// (ou "Sans zone" — voir CLAUDE.md, ~6% des quetes sans position resolue,
// gap de donnee assume comme les autres domaines), "niveau" par tranche de
// 20 (specs : "tranches de 20", contrairement aux tranches de 50 des objets).
function grouperQuetes(quetes, tri) {
  const cleDe = (q) => {
    if (tri === "niveau") {
      const base = Math.floor((q.niveau_min - 1) / 20) * 20 + 1
      return `Niv. ${base} à ${base + 19}`
    }
    if (tri === "az") return (q.nom.charAt(0) || "?").toUpperCase()
    return q.zone || "Sans zone"
  }
  const groupes = []
  quetes.forEach(q => {
    const cle = cleDe(q)
    const dernier = groupes[groupes.length - 1]
    if (dernier && dernier.cle === cle) dernier.items.push(q)
    else groupes.push({ cle, items:[q] })
  })
  return groupes
}

// Lien externe DofusPourLesNoobs : jamais d'URL de fiche devinee (teste :
// une URL construite depuis le nom renvoie du 404 sans filet). Toujours la
// page de recherche interne du site, qui repond 200 meme sans resultat —
// donc jamais de lien mort (voir CLAUDE.md).
const urlGuideDPLN = (nomQuete) => `https://www.dofuspourlesnoobs.com/?s=${encodeURIComponent(nomQuete)}`

// Bouton position -> copie "/travel x,y" dans le presse-papier (la commande
// d'autopilote que les joueurs collent dans le chat Dofus). Donnee deja en
// base (coord_x/coord_y), aucun nouveau calcul : juste un formatage + un
// clic. Retour visuel "Copié !" 1,5s avant de reprendre l'affichage normal.
function BoutonTravel({ x, y, big }) {
  const [copie, setCopie] = useState(false)
  if (x == null || y == null) return null
  const copier = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(`/travel ${x},${y}`).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 1500)
    })
  }
  return (
    <button onClick={copier} title="Copier la commande /travel"
      style={{
        background: copie ? "rgba(76,201,141,0.15)" : "rgba(0,212,255,0.1)",
        border: `1.5px solid ${copie ? "var(--df-green)" : "var(--df-cyan)"}`,
        borderRadius: 7, padding: big ? "6px 14px" : "3px 10px", fontSize: big ? 16 : 14, fontWeight: 800,
        color: copie ? "var(--df-green)" : "var(--df-cyan)", cursor: "pointer",
        fontFamily: "inherit", whiteSpace: "nowrap",
      }}>
      {copie ? "✓ Copié !" : `📍 [${x}, ${y}]`}
    </button>
  )
}

// Icônes SVG par type d'action (maquette dofura-fiche-quete-v3.jsx) — plus
// d'emojis sur la fiche quête. Le backend n'expose que icone(emoji)/verbe,
// donc on retrouve le type visuel depuis le verbe déjà factuel (généré par
// scraper_quetes.py, jamais depuis un texte libre).
const TYPE_ICONE_PAR_VERBE = {
  "Parler à": "talk", "Combattre": "fight", "Rapporter": "bring",
  "Découvrir": "go", "Fabriquer": "collect", "Traverser le": "fight",
}
function IconeAction({ verbe }) {
  const type = TYPE_ICONE_PAR_VERBE[verbe] || "other"
  const props = { width:20, height:20, viewBox:"0 0 24 24", fill:"none", strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round" }
  const c = { talk:"var(--df-cyan)", fight:"var(--df-red)", go:"var(--df-gold)", bring:"#C9A24B", collect:"#7FC96B", other:"var(--df-text-3)" }[type]
  if (type === "talk") return (<svg {...props} stroke={c}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>)
  if (type === "fight") return (<svg {...props} stroke={c}><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/></svg>)
  if (type === "go") return (<svg {...props} stroke={c}><path d="M12 21s-6-5.7-6-10a6 6 0 0 1 12 0c0 4.3-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>)
  if (type === "bring") return (<svg {...props} stroke={c}><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v2"/></svg>)
  return (<svg {...props} stroke={c}><path d="M11 2 3 9l4 4 7-8z"/><path d="m14 13 4 4 3-3-4-4z"/><path d="M7 13 3 21l8-4"/></svg>)
}


function QuetePage({ id, token, onSelect, onSelectObjet, onSelectDonjon, onBack }) {
  const [data, setData] = useState(null)
  const [favoriEnCours, setFavoriEnCours] = useState(false)
  const [messageConnexion, setMessageConnexion] = useState(false)
  const [cartesOuvertes, setCartesOuvertes] = useState({})

  useEffect(() => {
    setData(null)
    setCartesOuvertes({})
    const headers = token ? { Authorization:`Bearer ${token}` } : {}
    fetch(`${API}/quetes/${id}`, { headers }).then(r=>r.json()).then(setData)
  }, [id, token])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:"var(--df-text-2)", fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:"var(--df-text-2)", fontSize:14 }}>{data.erreur}</div>

  const doneCount = data.etapes.filter(e=>e.fait).length
  const pct = data.etapes.length ? Math.round((doneCount / data.etapes.length) * 100) : 0
  const lieuAffiche = data.lieu_precis || data.sous_zone || data.zone || null

  const toggleFavori = () => {
    if (!token) { setMessageConnexion(true); return }
    setFavoriEnCours(true)
    const methode = data.favori ? "DELETE" : "POST"
    const url = data.favori ? `${API}/favoris?element_type=quete&element_id=${id}` : `${API}/favoris`
    fetch(url, {
      method: methode,
      headers: { Authorization:`Bearer ${token}`, ...(methode==="POST" ? {"Content-Type":"application/json"} : {}) },
      body: methode==="POST" ? JSON.stringify({ element_type:"quete", element_id:String(id) }) : undefined,
    })
      .then(r=>r.json())
      .then(d => { setData(prev => ({ ...prev, favori:d.favori })); setFavoriEnCours(false) })
      .catch(()=>setFavoriEnCours(false))
  }

  const toggleEtape = (etape) => {
    if (!token) { setMessageConnexion(true); return }
    const fait = !etape.fait
    setData(prev => ({ ...prev, etapes: prev.etapes.map(e => e.id===etape.id ? { ...e, fait } : e) }))
    fetch(`${API}/progression`, {
      method: "POST",
      headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ element_type:"quete_etape", element_id:String(etape.id), fait }),
    }).catch(()=>{
      setData(prev => ({ ...prev, etapes: prev.etapes.map(e => e.id===etape.id ? { ...e, fait:!fait } : e) }))
    })
  }

  const toggleCarte = (cle) => setCartesOuvertes(prev => ({ ...prev, [cle]: !prev[cle] }))

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem 3rem", maxWidth:1240, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <header className="df-block" style={{ position:"relative", padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <h1 className="df-title-gold" style={{ fontSize:"clamp(22px, 4vw, 30px)", margin:0, maxWidth:640 }}>{data.nom}</h1>
              <span onClick={toggleFavori} title={data.favori?"Retirer des favoris":"Ajouter aux favoris"}
                style={{ fontSize:24, lineHeight:1, cursor:favoriEnCours?"default":"pointer", color:data.favori?"var(--df-gold)":"var(--df-text-off)", opacity:favoriEnCours?0.5:1, userSelect:"none", flexShrink:0 }}>
                {data.favori ? "★" : "☆"}
              </span>
            </div>
            {data.categorie === "repetable" && (
              <span style={{ display:"inline-block", marginTop:8, fontSize:11, fontWeight:700, letterSpacing:0.5, borderRadius:999, padding:"3px 11px", background:"rgba(140,150,178,0.15)", color:"var(--df-text-2)" }}>
                Répétable
              </span>
            )}
            {messageConnexion && (
              <div style={{ marginTop:8, fontSize:11, color:"var(--df-text-2)" }}>
                Connecte-toi pour suivre ta progression
                <span onClick={()=>setMessageConnexion(false)} style={{ marginLeft:6, color:"var(--df-text-3)", cursor:"pointer" }}>✕</span>
              </div>
            )}
          </div>

          <div style={{ background:"rgba(12,15,29,0.5)", border:"1px solid rgba(255,198,61,0.15)", borderRadius:12, padding:"12px 16px", display:"flex", flexDirection:"column", gap:8, minWidth:230 }}>
            {data.coord_x != null && (
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                <span style={{ color:"var(--df-text-3)", minWidth:80 }}>Lancement</span>
                <BoutonTravel x={data.coord_x} y={data.coord_y} />
              </div>
            )}
            {lieuAffiche && (
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                <span style={{ color:"var(--df-text-3)", minWidth:80 }}>Lieu</span>
                <span style={{ color:"var(--df-text)", fontWeight:600 }}>{lieuAffiche}</span>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
              <span style={{ color:"var(--df-text-3)", minWidth:80 }}>Niveau</span>
              <span style={{ color:"var(--df-text)", fontWeight:600 }}>{data.niveau_min}{data.niveau_max > data.niveau_min ? `-${data.niveau_max}` : ""}</span>
            </div>
            {data.pnj && (
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                <span style={{ color:"var(--df-text-3)", minWidth:80 }}>PNJ</span>
                <span style={{ color:"var(--df-text)", fontWeight:600 }}>{data.pnj}</span>
              </div>
            )}
          </div>
        </div>

        {data.guide && (
          <div style={{ marginTop:12, maxWidth:640 }}>
            {data.guide.resume && (
              <p style={{ color:"#8B96B2", fontSize:13.5, fontStyle:"italic", margin:0 }}>{data.guide.resume}</p>
            )}
            {data.guide.points_cles?.length > 0 && (
              <ul style={{ margin:"8px 0 0", paddingLeft:18, color:"var(--df-text-2)", fontSize:13 }}>
                {data.guide.points_cles.map((p,i) => <li key={i} style={{ padding:"2px 0" }}>{p}</li>)}
              </ul>
            )}
            {data.guide.astuce_dialogue && (
              <div style={{ marginTop:8, background:"rgba(196,75,199,0.08)", border:"1px solid rgba(196,75,199,0.3)", borderRadius:8, padding:"8px 12px", fontSize:13, color:"var(--df-text-2)" }}>
                💬 {data.guide.astuce_dialogue}
              </div>
            )}
          </div>
        )}

        {(data.prerequis_quetes.length > 0 || data.prerequis_objets.length > 0) && (
          <div style={{ background:"rgba(255,198,61,0.06)", border:"1px solid rgba(255,198,61,0.3)", borderRadius:12, padding:"14px 18px", marginTop:16 }}>
            <div style={{ fontSize:11.5, fontWeight:700, letterSpacing:1.5, color:"var(--df-gold)", textTransform:"uppercase", marginBottom:8 }}>Prérequis</div>
            {data.prerequis_quetes.map(p => (
              <div key={p.id} onClick={()=>onSelect(p.id)} style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, padding:"5px 0", cursor:"pointer" }}>
                <span style={{ color:p.ok?"var(--df-green)":"var(--df-text-3)", fontWeight:700 }}>{p.ok?"✓":"○"}</span>
                <span style={{ color:"var(--df-cyan)" }}>{p.nom}</span>
              </div>
            ))}
            {data.prerequis_objets.map((o,i) => (
              <div key={i} onClick={()=>o.objet_id && onSelectObjet(o.objet_id)}
                style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, padding:"5px 0", cursor:o.objet_id?"pointer":"default" }}>
                {o.img
                  ? <img src={o.img} alt={o.nom} style={{ width:20, height:20, objectFit:"contain" }} />
                  : <div style={{ width:20, height:20, background:"var(--df-bg)", borderRadius:4 }} />
                }
                <span style={{ color:o.objet_id?"var(--df-cyan)":"var(--df-text)" }}>{o.nom || `Objet #${o.objet_id}`}</span>
                <span style={{ color:"var(--df-gold)", marginLeft:"auto" }}>×{o.quantite}</span>
              </div>
            ))}
          </div>
        )}

        {data.etapes.length > 0 && (
          <div style={{ background:"rgba(12,15,29,0.6)", borderRadius:12, padding:"14px 18px", marginTop:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
              <span style={{ color:"var(--df-text-2)" }}>Progression</span>
              <span style={{ color:"var(--df-gold)", fontWeight:700 }}>{doneCount} / {data.etapes.length} · {pct}%</span>
            </div>
            <div className="df-progress"><div className={"fill" + (pct===100?" done":"")} style={{ width:pct+"%" }} /></div>
          </div>
        )}
      </header>

      <div className="df-detail-wrap">
        <div>
          {data.etapes.length > 0 && (
            <section className="df-block">
              <h2 className="df-block-title">Feuille de route</h2>
              {data.etapes.map((e,i) => (
                <div key={e.id}
                  style={{ border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:16, marginBottom:i<data.etapes.length-1?14:0, background:"rgba(12,15,29,0.35)", opacity:e.fait?0.6:1 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                    <div className={"df-check" + (e.fait?" on":"")} onClick={()=>toggleEtape(e)} style={{ marginTop:2, flexShrink:0 }}>{e.fait?"✓":""}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:"var(--df-text-3)", fontSize:12, fontWeight:700 }}>ÉTAPE {i + 1}</div>
                      {e.actions?.length > 0 ? e.actions.map((a,ai) => {
                        const cleCarte = `${e.id}-${ai}`
                        return (
                          <div key={ai} style={{ marginTop:ai>0?14:6, paddingTop:ai>0?14:0, borderTop:ai>0?"1px dashed rgba(255,255,255,0.09)":"none" }}>
                            <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                              <div style={{ width:38, height:38, flexShrink:0, borderRadius:10, background:"rgba(12,15,29,0.7)", border:"1px solid rgba(255,198,61,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <IconeAction verbe={a.verbe} />
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:15, color:e.fait?"var(--df-text-3)":"var(--df-text)", textDecoration:e.fait?"line-through":"none" }}>
                                  {a.verbe && <>{a.verbe} </>}
                                  <strong style={{ color:e.fait?"var(--df-text-3)":"var(--df-gold)" }}>{a.cible}</strong>
                                  {a.cible_secondaire && <span style={{ color:"var(--df-text-3)", fontWeight:400 }}> à {a.cible_secondaire}</span>}
                                </div>
                                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8, flexWrap:"wrap" }}>
                                  <BoutonTravel x={a.coord_x} y={a.coord_y} />
                                  {a.lieu && <span style={{ color:"var(--df-text-3)", fontSize:12.5 }}>{a.lieu}</span>}
                                </div>
                                {a.carte_img && (
                                  <>
                                    <button onClick={()=>toggleCarte(cleCarte)}
                                      style={{ background:"none", border:"none", color:"var(--df-cyan)", fontSize:12.5, fontWeight:600, fontFamily:"inherit", cursor:"pointer", marginTop:10, padding:0 }}>
                                      {cartesOuvertes[cleCarte] ? "▾ Masquer la carte" : "▸ Voir la carte"}
                                    </button>
                                    {cartesOuvertes[cleCarte] && (
                                      <div style={{ marginTop:10, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,198,61,0.2)" }}>
                                        <img src={a.carte_img} alt={a.lieu || "Carte"} style={{ display:"block", width:"100%", height:"auto" }} />
                                        <div style={{ padding:"6px 10px", background:"rgba(12,15,29,0.7)", color:"var(--df-text-3)", fontSize:10.5 }}>
                                          Repère {a.coord_x != null ? `[${a.coord_x}, ${a.coord_y}]` : ""} · pas de point exact dessiné (donnée non officielle)
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }) : (
                        <div style={{ fontSize:14.5, color:e.fait?"var(--df-text-3)":"var(--df-text)", textDecoration:e.fait?"line-through":"none", lineHeight:1.5, marginTop:6 }}>
                          {e.nom}
                        </div>
                      )}
                      {(e.a_xp || e.a_kamas || e.items.length > 0) && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
                          {e.a_xp && <span style={{ fontSize:11.5, color:"var(--df-cyan)" }}>+ XP</span>}
                          {e.a_kamas && <span style={{ fontSize:11.5, color:"var(--df-gold)" }}>+ Kamas</span>}
                          {e.items.map((it,ii) => (
                            <span key={ii} onClick={()=>it.id && onSelectObjet(it.id)}
                              style={{ fontSize:11.5, color:"var(--df-green)", cursor:it.id?"pointer":"default" }}>
                              {it.quantite>1?`${it.quantite}× `:""}{it.nom || `Objet #${it.id}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!token && (
                <div style={{ color:"var(--df-text-3)", fontSize:12, marginTop:14, fontStyle:"italic" }}>
                  Connecte-toi pour sauvegarder ta progression automatiquement.
                </div>
              )}
            </section>
          )}
        </div>

        <div>
          {data.ressources?.length > 0 && (
            <section className="df-block">
              <h2 className="df-block-title">Ressources à prévoir</h2>
              {data.ressources.map((r,i) => (
                <div key={i} onClick={()=>r.objet_id && onSelectObjet(r.objet_id)}
                  style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, padding:"7px 0", cursor:r.objet_id?"pointer":"default" }}>
                  {r.img
                    ? <img src={r.img} alt={r.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                    : <div style={{ width:22, height:22, background:"var(--df-bg)", borderRadius:4 }} />
                  }
                  <span style={{ color:r.objet_id?"var(--df-cyan)":"var(--df-text)" }}>{r.nom || `Objet #${r.objet_id}`}</span>
                  <span style={{ color:"var(--df-gold)", marginLeft:"auto" }}>×{r.quantite}</span>
                </div>
              ))}
            </section>
          )}

          {data.etapes.some(e => e.a_xp || e.a_kamas || e.items.length > 0) && (
            <section className="df-block">
              <h2 className="df-block-title">Récompenses</h2>
              {data.etapes.some(e=>e.a_xp) && <div style={{ fontSize:14.5, color:"var(--df-cyan)", padding:"5px 0" }}>✦ Expérience</div>}
              {data.etapes.some(e=>e.a_kamas) && <div style={{ fontSize:14.5, color:"var(--df-gold)", padding:"5px 0" }}>◈ Kamas</div>}
              {data.etapes.flatMap(e=>e.items).map((it,i) => (
                <div key={i} onClick={()=>it.id && onSelectObjet(it.id)}
                  style={{ display:"flex", alignItems:"center", gap:10, fontSize:14.5, padding:"5px 0", cursor:it.id?"pointer":"default" }}>
                  {it.img
                    ? <img src={it.img} alt={it.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                    : <div style={{ width:22, height:22, background:"var(--df-bg)", borderRadius:4 }} />
                  }
                  <span style={{ color:"var(--df-green)" }}>{it.quantite>1?`${it.quantite}× `:""}{it.nom || `Objet #${it.id}`}</span>
                </div>
              ))}
            </section>
          )}

          {data.donjon_lie && (
            <section className="df-block" style={{ borderColor:"var(--df-border-cyan)" }}>
              <h2 className="df-block-title">🏰 Donjon lié</h2>
              <div onClick={()=>onSelectDonjon(data.donjon_lie.id)} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:"var(--df-cyan)", fontWeight:700, fontSize:14.5 }}>{data.donjon_lie.nom}</div>
                  <div style={{ color:"var(--df-text-3)", fontSize:12, marginTop:1 }}>Niv. {data.donjon_lie.niveau_optimal}</div>
                </div>
                <span style={{ color:"var(--df-cyan)", fontSize:18, fontWeight:700 }}>→</span>
              </div>
            </section>
          )}

          <a href={urlGuideDPLN(data.nom)} target="_blank" rel="noopener noreferrer"
            className="df-btn-ghost" style={{ display:"block", textAlign:"center", padding:"12px 16px", fontSize:13.5, textDecoration:"none" }}>
            Guide complet sur DofusPourLesNoobs →
          </a>
        </div>
      </div>
    </div>
  )
}

// Regroupement sous en-tetes de categorie : la liste arrive deja triee dans
// cet ordre par le backend (CATEGORIES_SUCCES_ORDRE), on regroupe juste les
// lignes consecutives — meme mecanisme que grouperQuetes.
function grouperSucces(succes) {
  const groupes = []
  succes.forEach(s => {
    const dernier = groupes[groupes.length - 1]
    if (dernier && dernier.cle === s.categorie) dernier.items.push(s)
    else groupes.push({ cle: s.categorie, items: [s] })
  })
  return groupes
}


function SuccePage({ id, token, onSelectQuete, onSelectObjet, onSelectDonjon, onBack }) {
  const [data, setData] = useState(null)
  const [favoriEnCours, setFavoriEnCours] = useState(false)
  const [messageConnexion, setMessageConnexion] = useState(false)

  useEffect(() => {
    setData(null)
    const headers = token ? { Authorization:`Bearer ${token}` } : {}
    fetch(`${API}/succes/${id}`, { headers }).then(r=>r.json()).then(setData)
  }, [id, token])

  if (!data) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:"var(--df-text-2)", fontSize:14 }}>Chargement...</div>
  if (data.erreur) return <div style={{ padding:"3rem 2rem", textAlign:"center", color:"var(--df-text-2)", fontSize:14 }}>{data.erreur}</div>

  const pct = data.objectifs_total ? Math.round((data.objectifs_faits / data.objectifs_total) * 100) : 0

  const toggleFavori = () => {
    if (!token) { setMessageConnexion(true); return }
    setFavoriEnCours(true)
    const methode = data.favori ? "DELETE" : "POST"
    const url = data.favori ? `${API}/favoris?element_type=succes&element_id=${id}` : `${API}/favoris`
    fetch(url, {
      method: methode,
      headers: { Authorization:`Bearer ${token}`, ...(methode==="POST" ? {"Content-Type":"application/json"} : {}) },
      body: methode==="POST" ? JSON.stringify({ element_type:"succes", element_id:String(id) }) : undefined,
    })
      .then(r=>r.json())
      .then(d => { setData(prev => ({ ...prev, favori:d.favori })); setFavoriEnCours(false) })
      .catch(()=>setFavoriEnCours(false))
  }

  const toggleObjectif = (objectif) => {
    if (!token || objectif.type === "quete") return
    const fait = !objectif.fait
    setData(prev => ({ ...prev, objectifs: prev.objectifs.map(o => o.id===objectif.id ? { ...o, fait } : o),
      objectifs_faits: prev.objectifs_faits + (fait ? 1 : -1) }))
    fetch(`${API}/progression`, {
      method: "POST",
      headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ element_type:"succes_objectif", element_id:String(objectif.id), fait }),
    }).catch(()=>{
      setData(prev => ({ ...prev, objectifs: prev.objectifs.map(o => o.id===objectif.id ? { ...o, fait:!fait } : o),
        objectifs_faits: prev.objectifs_faits + (fait ? -1 : 1) }))
    })
  }

  return (
    <div translate="no" style={{ padding:"1.5rem 2rem 3rem", maxWidth:1240, margin:"0 auto" }}>
      <button onClick={onBack} style={mp.backBtn}>← Retour</button>

      <header className="df-block" style={{ position:"relative", padding:24 }}>
        <div style={{ position:"absolute", top:20, right:22, textAlign:"right" }}>
          <span onClick={toggleFavori} title={data.favori?"Retirer des favoris":"Ajouter aux favoris"}
            style={{ fontSize:26, lineHeight:1, cursor:favoriEnCours?"default":"pointer", color:data.favori?"var(--df-gold)":"var(--df-text-off)", opacity:favoriEnCours?0.5:1, userSelect:"none" }}>
            {data.favori ? "★" : "☆"}
          </span>
          {messageConnexion && (
            <div style={{ marginTop:4, fontSize:11, color:"var(--df-text-2)", maxWidth:150 }}>
              Connecte-toi pour suivre ta progression
              <span onClick={()=>setMessageConnexion(false)} style={{ marginLeft:6, color:"var(--df-text-3)", cursor:"pointer" }}>✕</span>
            </div>
          )}
        </div>

        <h1 className="df-title-gold" style={{ fontSize:"clamp(22px, 4vw, 30px)", margin:0, maxWidth:640 }}>{data.nom}</h1>
        <div style={{ color:"var(--df-text-2)", fontSize:14, marginTop:8 }}>
          Catégorie : {data.categorie} · <span style={{ color:"var(--df-gold)", fontWeight:700 }}>{data.points} points</span> · Niv. {data.niveau}
        </div>
        {data.description && (
          <p style={{ color:"#8B96B2", fontSize:13.5, fontStyle:"italic", margin:"12px 0 0", maxWidth:700 }}>{data.description}</p>
        )}

        {token && data.objectifs_total > 0 && (
          <div style={{ background:"rgba(12,15,29,0.6)", borderRadius:12, padding:"14px 18px", marginTop:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
              <span style={{ color:"var(--df-text-2)" }}>Progression</span>
              <span style={{ color:"var(--df-gold)", fontWeight:700 }}>{data.objectifs_faits} / {data.objectifs_total} · {pct}%</span>
            </div>
            <div className="df-progress"><div className={"fill" + (pct===100?" done":"")} style={{ width:pct+"%" }} /></div>
          </div>
        )}
      </header>

      <div className="df-detail-wrap">
        <div>
          {data.objectifs.length > 0 && (
            <section className="df-block">
              <h2 className="df-block-title">Objectifs</h2>
              {data.objectifs.map((o,i) => (
                <div key={o.id} onClick={()=>toggleObjectif(o)}
                  style={{ display:"flex", alignItems:"flex-start", gap:13, padding:"12px 0", borderBottom:i<data.objectifs.length-1?"1px solid rgba(255,255,255,0.05)":"none", cursor:o.type==="manuel"?"pointer":"default" }}>
                  <div className={"df-check" + (o.fait?" on":"") + (o.type==="quete"?" auto":"")} style={{ marginTop:1, flexShrink:0 }}>{o.fait?"✓":""}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14.5, color:o.fait?"var(--df-text-3)":"var(--df-text)", textDecoration:o.fait?"line-through":"none", lineHeight:1.5 }}>{o.nom}</div>
                    {o.type === "quete" ? (
                      <span onClick={e=>{ e.stopPropagation(); onSelectQuete(o.quete_id) }}
                        style={{ display:"inline-block", marginTop:4, fontSize:10.5, fontWeight:700, letterSpacing:0.5, borderRadius:999, padding:"2px 9px", background:"rgba(77,216,230,0.13)", color:"var(--df-cyan)", cursor:"pointer" }}>
                        QUÊTE <span style={{ marginLeft:4 }}>→</span>
                      </span>
                    ) : (
                      <span style={{ display:"inline-block", marginTop:4, fontSize:10.5, fontWeight:700, letterSpacing:0.5, borderRadius:999, padding:"2px 9px", background:"rgba(140,150,178,0.15)", color:"var(--df-text-2)" }}>
                        À COCHER SOI-MÊME
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {token ? (
                <div style={{ color:"var(--df-green)", fontSize:11.5, marginTop:14, display:"flex", alignItems:"center", gap:6 }}>
                  ✦ Les objectifs « quête » se cochent tout seuls dès que tu valides la quête liée.
                </div>
              ) : (
                <div style={{ color:"var(--df-text-3)", fontSize:12, marginTop:14, fontStyle:"italic" }}>
                  Connecte-toi pour suivre ta progression sur ce succès.
                </div>
              )}
            </section>
          )}
        </div>

        <div>
          {(data.recompense_titre || data.recompense_a_kamas || data.recompense_items?.length > 0) && (
            <section className="df-block">
              <h2 className="df-block-title">Récompenses</h2>
              <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:14, padding:"9px 0" }}>
                <span style={{ width:30, height:30, borderRadius:8, background:"rgba(12,15,29,0.8)", border:"1px solid rgba(255,198,61,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🏆</span>
                <span style={{ color:"var(--df-gold)", fontWeight:700 }}>{data.points} points de succès</span>
              </div>
              {data.recompense_titre && (
                <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:14, padding:"9px 0" }}>
                  <span style={{ width:30, height:30, borderRadius:8, background:"rgba(12,15,29,0.8)", border:"1px solid rgba(255,198,61,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🎖️</span>
                  <span style={{ color:"#D98AE0" }}>Titre : « {data.recompense_titre} »</span>
                </div>
              )}
              {data.recompense_a_kamas && (
                <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:14, padding:"9px 0" }}>
                  <span style={{ width:30, height:30, borderRadius:8, background:"rgba(12,15,29,0.8)", border:"1px solid rgba(255,198,61,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>◈</span>
                  <span style={{ color:"var(--df-gold)" }}>+ Kamas</span>
                </div>
              )}
              {data.recompense_items?.map((it,i) => (
                <div key={i} onClick={()=>it.objet_id && onSelectObjet(it.objet_id)}
                  style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, padding:"7px 0", cursor:it.objet_id?"pointer":"default" }}>
                  {it.img
                    ? <img src={it.img} alt={it.nom} style={{ width:22, height:22, objectFit:"contain" }} />
                    : <div style={{ width:22, height:22, background:"var(--df-bg)", borderRadius:4 }} />
                  }
                  <span style={{ color:"var(--df-green)" }}>{it.quantite>1?`${it.quantite}× `:""}{it.nom || `Objet #${it.objet_id}`}</span>
                </div>
              ))}
            </section>
          )}

          {data.donjons_lies?.length > 0 && (
            <section className="df-block" style={{ borderColor:"var(--df-border-cyan)" }}>
              <h2 className="df-block-title">🏰 Donjon lié</h2>
              {data.donjons_lies.map(d => (
                <div key={d.id} onClick={()=>onSelectDonjon(d.id)} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", padding:"6px 0" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"var(--df-cyan)", fontWeight:700, fontSize:14.5 }}>{d.nom}</div>
                    <div style={{ color:"var(--df-text-3)", fontSize:12, marginTop:1 }}>Niv. {d.niveau_optimal}</div>
                  </div>
                  <span style={{ color:"var(--df-cyan)", fontSize:18, fontWeight:700 }}>→</span>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// App — chantier react-router, palier 1
// ============================================================
// BrowserRouter à la racine ; AppInterne (sous le Router) est ce qui portait
// tout App() avant — useNavigate/useLocation exigent d'être sous
// <BrowserRouter>, d'où la scission. Token/user restent déclarés ici : tant
// qu'AppInterne ne démonte jamais (il ne le fait pas, un seul <Route> ne
// remplace jamais son parent), la session survit à tous les changements
// de route sans rien de spécial à faire.
export default function App() {
  return (
    <BrowserRouter>
      <AppInterne />
    </BrowserRouter>
  )
}

// Cibles historiques de onNav()/handleNav — seuls les 4 écrans réellement
// actifs sont routés. "donjon"/"zone"/"quete"/"succes" restent des résidus
// morts (voir plus bas), jamais dans cette table.
const CIBLE_VERS_URL = { songes:"/songes", taux:"/taux", grimoire:"/bibliotheque", comprendre:"/comprendre" }

function AppInterne() {
  const navigate = useNavigate()
  const location = useLocation()
  // Pattern "backgroundLocation" (react-router) : présent seulement quand on
  // est arrivé sur une fiche via un clic in-app (useOuvrirFiche l'a posé
  // dans l'état de navigation) — absent sur une arrivée directe (F5, lien
  // partagé), voir useFermerFiche plus haut pour le repli associé.
  const backgroundLocation = location.state?.backgroundLocation
  const abrirFiche = useOuvrirFiche()
  const onSelectMonstre = (id) => abrirFiche(`/monstres/${id}`)
  const onSelectObjet   = (id) => abrirFiche(`/objets/${id}`)

  const [query, setQuery]       = useState("")
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem("dofura_token") || null)
  const [user, setUser]   = useState(null)

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

  // Session en JWT (header Authorization, pas de cookies — voir CLAUDE.md
  // §6). Seul le jeton vit en localStorage, jamais la progression/les
  // favoris eux-memes (qui restent en base, par compte).
  useEffect(() => {
    if (!token) { setUser(null); return }
    fetch(`${API}/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setUser)
      .catch(() => { setToken(null); localStorage.removeItem("dofura_token") })
  }, [token])

  const handleLogin = (nouveauToken) => {
    localStorage.setItem("dofura_token", nouveauToken)
    setToken(nouveauToken)
  }
  const handleLogout = () => {
    localStorage.removeItem("dofura_token")
    setToken(null)
  }

  // Recherche navbar -> monstre : ferme le dropdown de recherche EN PLUS de
  // naviguer (resetNav() le faisait déjà avant ; les autres points d'entrée
  // — Bibliothèque, Les Taux, L'Œil — n'ont jamais query/results non vides
  // au moment du clic, pas besoin d'y toucher là-bas).
  const onSelectMonstreDepuisNavbar = (id) => { setQuery(""); setResults([]); onSelectMonstre(id) }

  const handleNav = (cible) => {
    if (CIBLE_VERS_URL[cible]) { setQuery(""); setResults([]); navigate(CIBLE_VERS_URL[cible]) }
  }
  const handleHome = () => { setQuery(""); setResults([]); navigate("/") }

  // ------------------------------------------------------------
  // Résidus morts : donjons, quêtes, succès, panoplies (fiches détail
  // uniquement — les listes et le cluster zones ont été supprimés, nettoyage
  // post-pivot vague 1/2). Hors périmètre produit (voir CLAUDE.md) —
  // mécanisme d'origine (setState + rendu conditionnel) strictement
  // inchangé, jamais migré vers une route : ces 4 fiches restent
  // atteignables depuis ObjetDetailPage (liens croisés panoplie/donjon
  // d'une légende de songe, et donjon -> quête/succès associés). onBack ne
  // touche jamais l'URL (elle n'a jamais bougé pendant que ces branches
  // s'affichaient), donc en sortir retombe pile sur ce que le routeur
  // affichait déjà avant.
  // ------------------------------------------------------------
  const [selectedDonjon, setSelectedDonjon]     = useState(null)
  const [selectedPanoplie, setSelectedPanoplie] = useState(null)
  const [selectedQuete, setSelectedQuete]       = useState(null)
  const [selectedSucces, setSelectedSucces]     = useState(null)

  const resetNavDead = () => { setSelectedDonjon(null); setSelectedPanoplie(null); setSelectedQuete(null); setSelectedSucces(null) }
  const handleSelectDonjon   = (id) => { resetNavDead(); setSelectedDonjon(id) }
  const handleSelectPanoplie = (id) => { resetNavDead(); setSelectedPanoplie(id) }
  const handleSelectQuete    = (id) => { resetNavDead(); setSelectedQuete(id) }
  const handleSelectSucces   = (id) => { resetNavDead(); setSelectedSucces(id) }
  const handleHomeDead       = () => { resetNavDead() }

  const cibleDead = selectedDonjon || selectedPanoplie || selectedQuete || selectedSucces

  // Lien nav actif : dérivé de l'écran de FOND (celui qui reste visible même
  // si une fiche est ouverte par-dessus), pas de l'URL réelle — identique au
  // comportement d'avant (browsing ne changeait pas quand le panneau
  // s'ouvrait par-dessus la Bibliothèque).
  const cheminActif = (backgroundLocation || location).pathname
  const browsingActif = cheminActif === "/songes" ? "songes" : cheminActif === "/taux" ? "taux" : cheminActif === "/bibliotheque" ? "grimoire" : null

  return (
    <div translate="no" style={{ position:"relative", minHeight:"100vh", overflow:"hidden", background:"var(--df-bg)", display:"flex", flexDirection:"column" }}>
      {/* Fond Krosmoz : absolute (jamais fixed, voir CLAUDE.md piège fantômes de texte au scroll) */}
      <div className="df-nebula" />
      <StarField />
      {/* Assombrissement reduit (chantier style global, 29 juillet 2026, etait 0.32) pour
          laisser davantage ressortir le bleu/violet du fond sans nuire a la lisibilite du
          texte — les blocs de contenu gardent leur propre fond opaque (--df-card-bg etc.) */}
      <div style={{ position:"absolute", inset:0, background:"rgba(12,15,29,0.22)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", flex:1 }}>
        <Navbar onHome={handleHome} onNav={handleNav} browsing={browsingActif} user={user} onLogin={handleLogin} onLogout={handleLogout}
          query={query} setQuery={setQuery} results={results} loading={loading} onSelectMonstre={onSelectMonstreDepuisNavbar} />
        <div style={{ flex:1 }}>
          {cibleDead ? (
            selectedDonjon ? (
              <DonjonDetailPage id={selectedDonjon} token={token} onSelectMonstre={onSelectMonstre} onSelectObjet={onSelectObjet} onSelectQuete={handleSelectQuete} onSelectSucces={handleSelectSucces} onBack={handleHomeDead} />
            ) : selectedPanoplie ? (
              <PanoplieDetailPage id={selectedPanoplie} onSelectObjet={onSelectObjet} onBack={handleHomeDead} />
            ) : selectedQuete ? (
              <QuetePage id={selectedQuete} token={token} onSelect={handleSelectQuete} onSelectObjet={onSelectObjet} onSelectDonjon={handleSelectDonjon} onBack={handleHomeDead} />
            ) : (
              <SuccePage id={selectedSucces} token={token} onSelectQuete={handleSelectQuete} onSelectObjet={onSelectObjet} onSelectDonjon={handleSelectDonjon} onBack={handleHomeDead} />
            )
          ) : (
            <>
              {/* Écran de fond : rendu à la location réelle, SAUF si on est
                  sur une fiche arrivée par clic in-app, auquel cas on rend
                  l'écran d'origine mémorisé (backgroundLocation) — c'est ce
                  qui fait qu'ouvrir une fiche ne démonte jamais la liste
                  derrière. /monstres/:id et /objets/:id sont aussi mappés
                  ici sur la Bibliothèque : c'est le repli pour une arrivée
                  directe (F5, lien partagé) sans backgroundLocation. */}
              <Routes location={backgroundLocation || location}>
                <Route path="/" element={<AccueilPage onNav={handleNav} />} />
                <Route path="/songes" element={<SongesPage token={token} onSelectObjet={onSelectObjet} onBack={handleHome} />} />
                <Route path="/taux" element={<TauxPage onSelectObjet={onSelectObjet} onBack={handleHome} />} />
                <Route path="/bibliotheque" element={<GrimoirePage onBack={handleHome} onSelectMonstre={onSelectMonstre} onSelectObjet={onSelectObjet} />} />
                <Route path="/comprendre" element={<ComprendrePage onBack={handleHome} />} />
                <Route path="/monstres/:id" element={<GrimoirePage onBack={handleHome} onSelectMonstre={onSelectMonstre} onSelectObjet={onSelectObjet} />} />
                <Route path="/objets/:id" element={<GrimoirePage onBack={handleHome} onSelectMonstre={onSelectMonstre} onSelectObjet={onSelectObjet} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Overlay : rendu à la vraie location (jamais remplacée par
                  backgroundLocation) chaque fois que l'URL pointe vers une
                  fiche — avec ou sans fond mémorisé. */}
              <Routes>
                <Route path="/monstres/:id" element={<MonstreOverlay onSelectDonjon={handleSelectDonjon} />} />
                <Route path="/objets/:id" element={<ObjetOverlay onSelectDonjon={handleSelectDonjon} onSelectPanoplie={handleSelectPanoplie} />} />
              </Routes>
            </>
          )}
        </div>
        <Footer />
      </div>
    </div>
  )
}
