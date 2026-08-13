import { useState, useEffect, useMemo, useRef } from "react"
import { IconeBribe, IconeCoffre, IconeSablier, IconeTeamPersonnages, IconeIntensiteEliatrope } from "../components/IconesSonges.jsx"
import { normaliserTexte } from "../texte"

// Fichier séparé volontairement (SONGES.md §10 : "App.jsx est déjà très
// chargé"). Composant autonome : n'importe rien d'App.jsx, réutilise
// uniquement les classes/variables globales de tokens.css (déjà chargé une
// fois dans main.jsx) — voir la charte couleurs SONGES.md §10, qui
// correspond exactement aux tokens existants (--df-bg, --df-cyan,
// --df-green, --df-red, --df-card-bg), aucune nouvelle couleur inventée.
//
// VOCABULAIRE (chantier 1, passe 1a, 2026-08-04 — remplace la regle du 29
// juillet 2026, desormais perimee) : "songe" pour le recit (titres, promesses,
// lore, descriptions), "run" pour l'action/le comptage (boutons, compteurs,
// chiffres) — voir CLAUDE.md. "run"/"Run" reste par ailleurs le terme du
// code (noms de variables/fonctions, endpoints, SONGES.md intro).
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const LS_TEAM = "dofura_songes_team_id"
const LS_INTENSITE = "dofura_songes_intensite"
const LS_CATEGORIE = "dofura_songes_categorie"

// Labels du sélecteur d'items trackables (écran d'ajout de drop, inchangé
// par cette refonte).
const CATEGORIE_LABELS = {
  legende: "Légendes",
  legende_animale: "Légendes animales",
  cosmetique: "Cosmétiques",
  rune_astrale: "Rune astrale",
}
// Labels du sélecteur de catégorie du compteur principal (refonte interface
// point 1) — texte legerement different ("Runes" au pluriel generique).
const CATEGORIE_LABELS_SELECTEUR = {
  legende: "Légendes",
  legende_animale: "Légendes animales",
  cosmetique: "Cosmétiques",
  rune_astrale: "Runes",
}
const CATEGORIE_MOT_SINGULIER = {
  legende: "légende",
  legende_animale: "légende animale",
  cosmetique: "cosmétique",
  rune_astrale: "rune",
}
const ORDRE_CATEGORIES = ["legende", "legende_animale", "cosmetique", "rune_astrale"]
const NOMS_PALIERS_ROMAINS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" }
// Libellé affiché par intensité (retour Popo, chantier 1 passe 1c-A) : les
// clés de config.intensites ("reve"/"paradoxe"/"cauchemar") n'ont pas
// d'accent — un simple charAt(0).toUpperCase() donnait "Reve" partout où
// il était utilisé (sélecteur, historique, stats...). Source unique ici,
// à utiliser partout au lieu de recapitaliser la clé brute.
const INTENSITE_LABEL = { reve: "Rêve", paradoxe: "Paradoxe", cauchemar: "Cauchemar" }
// Couleur par intensité (refonte visuelle, chantier 1 passe 1c) : violet
// Paradoxe, bleu Rêve, orange Cauchemar — tokens.css (--df-reve/--df-paradoxe/
// --df-cauchemar), jamais de hex recopié en dur ici.
const INTENSITE_COULEUR = { reve: "var(--df-reve)", paradoxe: "var(--df-paradoxe)", cauchemar: "var(--df-cauchemar)" }

function authHeaders(token, avecJson) {
  const h = {}
  if (token) h.Authorization = `Bearer ${token}`
  if (avecJson) h["Content-Type"] = "application/json"
  return h
}

const formaterNombre = (n) => new Intl.NumberFormat("fr-FR").format(n)

function formaterDate(iso) {
  if (!iso) return ""
  // SQLite datetime('now') stocke un TEXT UTC sans marqueur de fuseau —
  // on ajoute le "Z" nous-mêmes pour un affichage local correct.
  const d = new Date(iso.replace(" ", "T") + "Z")
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function formaterDuree(secondes) {
  if (secondes == null) return null
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return m > 0 ? `${m} min ${s} s` : `${s} s`
}

// Pastille d'intensité (refonte historique) : remplace l'ancien simple
// point de couleur. Couleur pleine sur texte + bordure, bordure ramenée à
// 40% d'opacité via color-mix() plutôt qu'un hex recopié — INTENSITE_COULEUR
// reste la seule source de vérité des couleurs (voir sa note plus haut).
function PastilleIntensite({ s }) {
  const couleur = INTENSITE_COULEUR[s.intensite]
  return (
    <span style={{
      display: "inline-block", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.1em",
      borderRadius: 20, padding: "2px 9px", lineHeight: 1.4, flexShrink: 0,
      color: couleur, border: `1px solid color-mix(in srgb, ${couleur} 40%, transparent)`,
    }}>
      {INTENSITE_LABEL[s.intensite] || s.intensite} {NOMS_PALIERS_ROMAINS[s.niveau] || s.niveau}
    </span>
  )
}

// Point médian gris, séparateur unique de la ligne d'historique (refonte) —
// remplace les barres "|" et tirets précédents.
function PointSeparateur() {
  return <span style={{ color: "#2b4148" }}> · </span>
}

// Ligne du bas d'une run (team, date, vague, bribes) — lecture seule,
// partagée entre la liste d'historique et le rappel de la modale de
// suppression (même contenu dans les deux, voir consigne "même style que la
// ligne d'historique"). Le lien "Corriger"/"Renseigner" n'en fait PAS partie
// : il est propre à la liste interactive, ajouté par l'appelant à côté.
function InfosBasSonge({ s }) {
  return (
    <>
      <span style={{ color: "#8fa8ad" }}>{s.team_nom || "—"}</span>
      <PointSeparateur />
      <span style={{ color: "#5f7d84" }}>{formaterDate(s.date_run)}</span>
      {s.duree_secondes != null && <><PointSeparateur /><span style={{ color: "#5f7d84" }}>{formaterDuree(s.duree_secondes)}</span></>}
      {s.nombre_tours != null && <><PointSeparateur /><span style={{ color: "#5f7d84" }}>{s.nombre_tours} tour{s.nombre_tours > 1 ? "s" : ""}</span></>}
      <PointSeparateur />
      {s.vague_finale != null ? (
        <span style={{ color: "#8fa8ad" }}>vague <span style={{ color: "#c9dde0", fontWeight: 500 }}>{s.vague_finale}</span></span>
      ) : (
        <span style={{ color: "#8fa8ad" }}>vague non renseignée</span>
      )}
      {s.bribes > 0 && (
        <>
          <PointSeparateur />
          <span style={{ color: "var(--df-gold)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <IconeBribe size={14} /> {formaterNombre(s.bribes)} bribes
          </span>
        </>
      )}
    </>
  )
}

// Fond/bordure d'une ligne d'historique selon qu'elle a un drop ou non
// (refonte) — utilisé par la liste ET le rappel de la modale de suppression,
// pour que les deux se ressemblent exactement comme demandé.
function styleConteneurSonge(s) {
  return s.drops.length > 0 ? {
    border: "1px solid rgba(240,192,64,.45)",
    borderLeft: "3px solid var(--df-gold)",
    background: "linear-gradient(90deg, rgba(240,192,64,.07), rgba(240,192,64,.01))",
    borderRadius: 10, padding: "12px 14px",
  } : {
    border: "1px solid rgba(44,231,255,.13)",
    background: "rgba(255,255,255,.015)",
    borderRadius: 10, padding: "12px 14px",
  }
}

// Une ligne de drop dans le bloc "s'est passé pendant cette run". onClick et
// onSupprimer sont optionnels : omis (undefined) -> rendu passif, utilisé
// par le rappel de la modale de suppression (pas d'action possible là).
function LigneDropSonge({ d, onClick, onSupprimer, confirmerActif }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
      <span onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, cursor: onClick ? "pointer" : "default", flex: 1, minWidth: 0 }}>
        <span style={{ color: "var(--df-gold)", fontSize: 12, flexShrink: 0 }}>✦</span>
        {d.item_img ? <img src={d.item_img} alt="" style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} /> : null}
        <span style={{ fontSize: 14.5, fontFamily: "var(--df-font-logo)", color: "var(--df-gold)" }}>{d.item_nom}{d.quantite > 1 ? ` ×${d.quantite}` : ""}</span>
        <span style={{ fontSize: 12.5, color: "#5f7d84" }}>— {d.perso_nom}{d.palier ? ` · palier ${NOMS_PALIERS_ROMAINS[d.palier]}` : ""}</span>
      </span>
      {onSupprimer && (
        <span onClick={onSupprimer} title="Supprimer ce drop"
          style={{ color: "var(--df-red)", cursor: "pointer", fontWeight: 700, padding: "0 4px", fontSize: confirmerActif ? 11 : 13, whiteSpace: "nowrap" }}>
          {confirmerActif ? "Confirmer ?" : "✕"}
        </span>
      )}
    </div>
  )
}

function IconeRecherche() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.4" stroke="var(--df-cyan)" strokeWidth="2" />
      <line x1="11" y1="11" x2="15" y2="15" stroke="var(--df-cyan)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Séparateur doré discret (ligne + losange) sous les chiffres du bloc stats
// (refonte visuelle) — partagé par les 3 colonnes (gauche, centre, droite),
// ne pas dupliquer.
function SeparateurDore() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }} aria-hidden="true">
      <span style={{ flex: 1, height: 1, background: "rgba(var(--df-gold-rgb), 0.3)" }} />
      <span style={{ width: 5, height: 5, background: "rgba(var(--df-gold-rgb), 0.5)", transform: "rotate(45deg)", flexShrink: 0 }} />
      <span style={{ flex: 1, height: 1, background: "rgba(var(--df-gold-rgb), 0.3)" }} />
    </div>
  )
}

// 4 équerres dorées aux coins d'un cadre doré (voir .df-songes-cadre-dore
// dans pageSonges.css) — à placer en premier enfant du bloc qui porte
// cette classe (chantier 1c, point 3).
function CoinsDores() {
  return (
    <>
      <span className="df-songes-coin df-songes-coin-tl" aria-hidden="true" />
      <span className="df-songes-coin df-songes-coin-tr" aria-hidden="true" />
      <span className="df-songes-coin df-songes-coin-bl" aria-hidden="true" />
      <span className="df-songes-coin df-songes-coin-br" aria-hidden="true" />
    </>
  )
}

const sp = {
  // maxWidth 1100 (chantier 1c, retour Popo "tous les blocs sont trop
  // étroits") — était 720. Padding vertical réduit en même temps (les
  // blocs "trop hauts" du même retour).
  page: { padding: "1.25rem 1.5rem 2.5rem", maxWidth: 1100, margin: "0 auto" },
  backBtn: { background: "transparent", border: "1px solid var(--df-border-cyan)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--df-cyan)", cursor: "pointer", marginBottom: 18 },
  card: { background: "rgba(var(--df-card-bg), 0.92)", border: "1px solid var(--df-border-gold)", borderRadius: 16, padding: "20px 20px", marginBottom: 16 },
  champ: { width: "100%", boxSizing: "border-box", background: "rgba(var(--df-card-bg), 0.9)", border: "1px solid rgba(var(--df-cyan-rgb), 0.35)", borderRadius: 8, padding: "9px 12px", fontSize: 13.5, color: "var(--df-text)", outline: "none" },
  select: { background: "rgba(var(--df-card-bg), 0.95)", color: "var(--df-text)", border: "1px solid rgba(var(--df-gold-rgb), 0.4)", borderRadius: 999, padding: "8px 14px", fontSize: 13, cursor: "pointer", outline: "none" },
  // Cyan = action principale (refonte visuelle, chantier 1 passe 1c). Doit
  // ressortir sur le fond nébuleuse (chantier 1c) : bordure or, angles
  // coupés en biais, ombre portée, Cinzel majuscules espacées.
  btnCyan: {
    background: "var(--df-cyan)", color: "#04121A", border: "2px solid rgba(240, 192, 64, 0.5)",
    padding: "16px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", flex: "1 1 200px",
    fontFamily: "var(--df-font-logo)", textTransform: "uppercase", letterSpacing: "0.08em",
    clipPath: "polygon(14px 0%, calc(100% - 14px) 0%, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0% calc(100% - 14px), 0% 14px)",
    boxShadow: "0 6px 20px rgba(0,0,0,0.55)",
  },
  btnCyanPetit: { background: "var(--df-cyan)", color: "#04121A", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnOrContour: { background: "rgba(var(--df-gold-rgb), 0.08)", color: "var(--df-gold)", border: "2px solid var(--df-gold)", borderRadius: 12, padding: "16px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", flex: "1 1 200px" },
  btnFantome: { background: "rgba(var(--df-cyan-rgb), 0.07)", color: "var(--df-cyan)", border: "1px solid rgba(var(--df-cyan-rgb), 0.6)", borderRadius: 10, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  // Boutons icône carrés du minuteur (Pause/Réinitialiser — refonte visuelle,
  // chantier 1 passe 1c) : pas d'icônes de la planche (passe suivante), glyphe
  // unicode en attendant.
  btnIconCarre: { width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(var(--df-cyan-rgb), 0.08)", border: "1px solid rgba(var(--df-cyan-rgb), 0.4)", borderRadius: 8, color: "var(--df-cyan)", fontSize: 15, cursor: "pointer", padding: 0 },
  lienDiscret: { fontSize: 12, color: "var(--df-text-3)", cursor: "pointer", textDecoration: "underline", background: "none", border: "none", padding: 0, fontFamily: "inherit" },
  pill: (actif) => ({ display: "inline-block", margin: "0 6px 6px 0", background: actif ? "rgba(var(--df-cyan-rgb), 0.18)" : "rgba(var(--df-cyan-rgb), 0.06)", color: actif ? "var(--df-cyan)" : "var(--df-text-2)", border: `1px solid ${actif ? "var(--df-cyan)" : "rgba(var(--df-cyan-rgb), 0.35)"}`, borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }),
}

// ============================================================
// États non connecté / chargement / onboarding
// ============================================================

function SongesConnexionRequise({ onBack }) {
  return (
    <div className="df-songes">
      <div style={sp.page}>
        <button onClick={onBack} style={sp.backBtn}>← Retour</button>
        <div style={{ ...sp.card, textAlign: "center", padding: "3rem 1.5rem" }}>
          <h1 className="df-section-title" style={{ fontSize: 22, margin: "0 0 10px" }}>L'Œil de Draconiros</h1>
          <p style={{ color: "var(--df-text-2)", fontSize: 14, margin: 0 }}>
            Connecte-toi pour compter tes runs et enregistrer tes drops — tes données te suivent sur tous tes appareils.
          </p>
        </div>
      </div>
    </div>
  )
}

function SongesChargement() {
  return <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--df-text-2)", fontSize: 14 }}>Chargement...</div>
}

// ============================================================
// Panneau de gestion personnages/teams — INCHANGÉ par cette refonte
// (demande explicite Popo : "convient tel quel"). Les nouveaux blocs
// "Tout supprimer" / "Journal" sont ajoutés à côté, pas dedans — voir
// SongesZoneDangereuse / SongesJournalSection plus bas, assemblés au
// point de montage dans SongesPage (racine), jamais dans ce composant.
// ============================================================

function FormNouveauPersonnage({ token, onCree }) {
  const [nom, setNom] = useState("")
  const [classe, setClasse] = useState("")
  const [serveur, setServeur] = useState("")
  const [enCours, setEnCours] = useState(false)

  const creer = () => {
    if (!nom.trim()) return
    setEnCours(true)
    fetch(`${API}/songes/personnages`, {
      method: "POST", headers: authHeaders(token, true),
      body: JSON.stringify({ nom: nom.trim(), classe: classe.trim() || null, serveur: serveur.trim() || null }),
    })
      .then(r => r.json())
      .then(() => { setNom(""); setClasse(""); setServeur(""); onCree() })
      .finally(() => setEnCours(false))
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
      <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du personnage"
        onKeyDown={e => { if (e.key === "Enter") creer() }} style={{ ...sp.champ, flex: "1 1 160px" }} />
      <input value={classe} onChange={e => setClasse(e.target.value)} placeholder="Classe (optionnel)"
        style={{ ...sp.champ, flex: "1 1 120px" }} />
      <input value={serveur} onChange={e => setServeur(e.target.value)} placeholder="Serveur (optionnel)"
        style={{ ...sp.champ, flex: "1 1 120px" }} />
      <button disabled={enCours || !nom.trim()} onClick={creer} className="df-hover-lift" style={{ ...sp.btnCyanPetit, opacity: (enCours || !nom.trim()) ? 0.5 : 1 }}>
        + Ajouter
      </button>
    </div>
  )
}

function FormNouvelleTeam({ token, personnages, onCree }) {
  const [nom, setNom] = useState("")
  const [membres, setMembres] = useState([])
  const [enCours, setEnCours] = useState(false)

  const toggleMembre = (id) => setMembres(ms => ms.includes(id) ? ms.filter(x => x !== id) : [...ms, id])

  const creer = () => {
    if (!nom.trim() || membres.length === 0) return
    setEnCours(true)
    fetch(`${API}/songes/teams`, {
      method: "POST", headers: authHeaders(token, true),
      body: JSON.stringify({ nom: nom.trim(), perso_ids: membres }),
    })
      .then(r => r.json())
      .then((team) => { setNom(""); setMembres([]); onCree(team) })
      .finally(() => setEnCours(false))
  }

  return (
    <div style={{ marginTop: 10 }}>
      <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de la team (ex. Team farm Paradoxe)"
        style={{ ...sp.champ, marginBottom: 10 }} />
      <div style={{ marginBottom: 10 }}>
        {personnages.map(p => (
          <span key={p.id} onClick={() => toggleMembre(p.id)} className="df-hover-lift" style={sp.pill(membres.includes(p.id))}>
            {membres.includes(p.id) ? "✓ " : ""}{p.nom}
          </span>
        ))}
      </div>
      <button disabled={enCours || !nom.trim() || membres.length === 0} onClick={creer}
        className="df-hover-lift" style={{ ...sp.btnCyanPetit, opacity: (enCours || !nom.trim() || membres.length === 0) ? 0.5 : 1 }}>
        Créer la team
      </button>
    </div>
  )
}

// Ecran d'onboarding (aucune team) ET panneau de gestion (accessible depuis
// l'écran principal) partagent ce même composant — même besoin (créer/voir
// personnages et teams), seule la coquille autour change.
function SongesGestion({ token, personnages, teams, onRafraichir, onTerminer, onboarding }) {
  const [teamEnEdition, setTeamEnEdition] = useState(null)

  const supprimerTeam = (id) => {
    fetch(`${API}/songes/teams/${id}`, { method: "DELETE", headers: authHeaders(token) }).then(onRafraichir)
  }

  return (
    <div className="df-songes">
    <div style={sp.page}>
      {!onboarding && <button onClick={onTerminer} style={sp.backBtn}>← Retour</button>}
      <h1 className="df-section-title" style={{ fontSize: 22, margin: "0 0 4px" }}>
        {onboarding ? "Avant de commencer" : "Gérer mes personnages et teams"}
      </h1>
      {onboarding && (
        <p style={{ color: "var(--df-text-2)", fontSize: 13.5, margin: "0 0 16px" }}>
          L'Œil de Draconiros se base sur tes personnages regroupés en teams. Crée au moins un personnage, puis une team.
        </p>
      )}

      <div style={sp.card}>
        <div className="df-block-title" style={{ marginBottom: 4 }}>Personnages</div>
        {personnages.length === 0 ? (
          <p style={{ color: "var(--df-text-3)", fontSize: 13, margin: "6px 0" }}>Aucun personnage pour l'instant.</p>
        ) : (
          <div>{personnages.map(p => <span key={p.id} className="df-hover-lift" style={sp.pill(false)}>{p.nom}{p.classe ? ` (${p.classe})` : ""}</span>)}</div>
        )}
        <FormNouveauPersonnage token={token} onCree={onRafraichir} />
      </div>

      {personnages.length > 0 && (
        <div style={sp.card}>
          <div className="df-block-title" style={{ marginBottom: 4 }}>Teams</div>
          {teams.length === 0 ? (
            <p style={{ color: "var(--df-text-3)", fontSize: 13, margin: "6px 0" }}>Aucune team pour l'instant.</p>
          ) : teams.map(t => (
            <div key={t.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
              {teamEnEdition === t.id ? (
                <FormEditionTeam token={token} team={t} personnages={personnages}
                  onTermine={() => { setTeamEnEdition(null); onRafraichir() }} />
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "var(--df-gold)", fontWeight: 700, fontSize: 14 }}>{t.nom}</div>
                    <div style={{ color: "var(--df-text-3)", fontSize: 12 }}>{t.membres.map(m => m.nom).join(", ") || "Aucun membre"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setTeamEnEdition(t.id)} className="df-hover-lift" style={sp.btnFantome}>Modifier</button>
                    <button onClick={() => supprimerTeam(t.id)} className="df-hover-lift" style={{ ...sp.btnFantome, color: "var(--df-red)", borderColor: "rgba(242,109,109,0.5)" }}>Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <FormNouvelleTeam token={token} personnages={personnages} onCree={onRafraichir} />
        </div>
      )}
    </div>
    </div>
  )
}

function FormEditionTeam({ token, team, personnages, onTermine }) {
  const [nom, setNom] = useState(team.nom)
  const [membres, setMembres] = useState(team.membres.map(m => m.perso_id))
  const [enCours, setEnCours] = useState(false)

  const toggleMembre = (id) => setMembres(ms => ms.includes(id) ? ms.filter(x => x !== id) : [...ms, id])

  const enregistrer = () => {
    if (!nom.trim() || membres.length === 0) return
    setEnCours(true)
    fetch(`${API}/songes/teams/${team.id}`, {
      method: "PUT", headers: authHeaders(token, true),
      body: JSON.stringify({ nom: nom.trim(), perso_ids: membres }),
    }).then(onTermine).finally(() => setEnCours(false))
  }

  return (
    <div>
      <input value={nom} onChange={e => setNom(e.target.value)} style={{ ...sp.champ, marginBottom: 8 }} />
      <div style={{ marginBottom: 8 }}>
        {personnages.map(p => (
          <span key={p.id} onClick={() => toggleMembre(p.id)} className="df-hover-lift" style={sp.pill(membres.includes(p.id))}>
            {membres.includes(p.id) ? "✓ " : ""}{p.nom}
          </span>
        ))}
      </div>
      <button disabled={enCours} onClick={enregistrer} className="df-hover-lift" style={sp.btnCyanPetit}>Enregistrer</button>
      <button onClick={onTermine} style={{ ...sp.lienDiscret, marginLeft: 12 }}>Annuler</button>
    </div>
  )
}

// ============================================================
// Zone dangereuse ("Tout supprimer") + Journal — nouveaux, refonte
// interface point 4. Rendus À CÔTÉ de SongesGestion (jamais dedans), pour
// ne pas y toucher.
// ============================================================

function SongesZoneDangereuse({ onToutSupprimer }) {
  const [confirmation, setConfirmation] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const confirmer = () => {
    setEnCours(true)
    onToutSupprimer().finally(() => { setEnCours(false); setConfirmation(false) })
  }

  return (
    <div style={{ ...sp.card, borderColor: "rgba(242,109,109,0.4)" }}>
      <div className="df-block-title" style={{ color: "var(--df-red)", marginBottom: 4 }}>Zone dangereuse</div>
      {!confirmation ? (
        <>
          <p style={{ color: "var(--df-text-2)", fontSize: 13, margin: "6px 0 12px" }}>
            Supprime toutes tes runs, leurs participants, leurs drops et tes dépenses de bribes enregistrées. Tes
            personnages et tes teams ne sont pas touchés. Chaque drop est archivé dans le Journal avant suppression.
          </p>
          <button onClick={() => setConfirmation(true)} className="df-hover-lift" style={{ ...sp.btnFantome, color: "var(--df-red)", borderColor: "rgba(242,109,109,0.5)" }}>
            Tout supprimer
          </button>
        </>
      ) : (
        <>
          <p style={{ color: "var(--df-red)", fontSize: 13.5, fontWeight: 700, margin: "6px 0 12px" }}>
            Action irréversible : toutes tes runs, tous tes drops et toutes tes dépenses de bribes seront définitivement
            supprimés (tes personnages et teams resteront). Confirmer ?
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button disabled={enCours} onClick={confirmer} className="df-hover-lift" style={{ ...sp.btnCyanPetit, background: "var(--df-red)", opacity: enCours ? 0.6 : 1 }}>
              Oui, tout supprimer
            </button>
            <button disabled={enCours} onClick={() => setConfirmation(false)} className="df-hover-lift" style={sp.btnFantome}>Non, annuler</button>
          </div>
        </>
      )}
    </div>
  )
}

function SongesJournalSection({ journal, page, setPage }) {
  const totalPages = Math.max(Math.ceil((journal.total || 0) / 10), 1)
  return (
    <div style={{ ...sp.card, opacity: 0.72 }}>
      <div className="df-block-title" style={{ marginBottom: 4 }}>Journal</div>
      <p style={{ color: "var(--df-text-3)", fontSize: 12, margin: "0 0 10px" }}>
        Drops archivés par un "Tout supprimer" précédent — ne comptent plus dans aucune statistique, simple souvenir consultable.
      </p>
      {journal.entrees.length === 0 ? (
        <p style={{ color: "var(--df-text-3)", fontSize: 13, margin: "6px 0" }}>Aucune entrée archivée.</p>
      ) : journal.entrees.map(e => (
        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {e.item_img ? <img src={e.item_img} alt="" style={{ width: 22, height: 22, objectFit: "contain", filter: "grayscale(70%)" }} /> : null}
          <span style={{ fontSize: 13, color: "var(--df-text-2)" }}>{e.item_nom}</span>
          <span style={{ fontSize: 11.5, color: "var(--df-text-3)" }}>
            {e.palier ? `palier ${NOMS_PALIERS_ROMAINS[e.palier]} · ` : ""}{formaterDate(e.date_drop)}
          </span>
        </div>
      ))}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 10 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="df-hover-lift" style={{ ...sp.btnFantome, opacity: page <= 1 ? 0.5 : 1 }}>← Précédent</button>
          <span style={{ fontSize: 12, color: "var(--df-text-2)" }}>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="df-hover-lift" style={{ ...sp.btnFantome, opacity: page >= totalPages ? 0.5 : 1 }}>Suivant →</button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Bascule "songe interrompu" — partagée entre l'écran principal et
// l'écran d'ajout de drop (SONGES.md §10 point 5 : un seul champ).
// ============================================================

function BasculeSongeInterrompu({ nbSallesParRun, songeEchoue, setSongeEchoue, salleAtteinte, setSalleAtteinte }) {
  if (!songeEchoue) {
    // Vrai bouton discret plutôt qu'un lien souligné (refonte visuelle,
    // chantier 1 passe 1c) : vit à côté de "J'ai drop", sur la même ligne
    // dans l'encadré de fin de songe (retour Popo, passe 1j — la carte avec
    // titre séparé faisait doublon).
    return (
      <button onClick={() => setSongeEchoue(true)} className="df-hover-lift"
        style={{ background: "transparent", color: "#7FE9E0", border: "1px solid rgba(127,233,224,.4)", borderRadius: 8, padding: 11, fontSize: 13, cursor: "pointer", width: "100%" }}>
        La run s'est arrêtée en cours de route ?
      </button>
    )
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <label style={{ fontSize: 12.5, color: "var(--df-text-2)" }}>Salle atteinte</label>
      <input type="number" min={1} max={nbSallesParRun} value={salleAtteinte}
        onChange={e => setSalleAtteinte(Math.min(nbSallesParRun, Math.max(1, Number(e.target.value) || 1)))}
        style={{ width: 64, ...sp.champ, padding: "6px 8px" }} />
      <button onClick={() => setSongeEchoue(false)} style={sp.lienDiscret}>Annuler</button>
    </div>
  )
}

// ============================================================
// Écran d'ajout de drop
// ============================================================

function SongesAjoutDrop({ itemsTrackables, equipeActive, dropsEnCours, setDropsEnCours, onValider, onAnnuler }) {
  const [recherche, setRecherche] = useState("")
  const [categorieFiltre, setCategorieFiltre] = useState(null)
  const [itemSelectionne, setItemSelectionne] = useState(null)
  const [personnageId, setPersonnageId] = useState(equipeActive?.membres[0]?.perso_id ?? null)
  const [palier, setPalier] = useState("")

  const itemsFiltres = useMemo(() => {
    const r = normaliserTexte(recherche.trim())
    return itemsTrackables.filter(i =>
      (!categorieFiltre || i.categorie === categorieFiltre) &&
      (!r || normaliserTexte(i.nom).includes(r))
    )
  }, [itemsTrackables, recherche, categorieFiltre])

  const ajouterDrop = () => {
    if (!itemSelectionne || !personnageId) return
    setDropsEnCours(ds => [...ds, {
      perso_id: personnageId, item_id: itemSelectionne.item_id, quantite: 1,
      palier: palier ? Number(palier) : null, _nom: itemSelectionne.nom, _img: itemSelectionne.img,
      _perso_nom: equipeActive.membres.find(m => m.perso_id === personnageId)?.nom,
    }])
    setItemSelectionne(null); setPalier(""); setRecherche("")
  }

  const retirerDrop = (index) => setDropsEnCours(ds => ds.filter((_, i) => i !== index))

  // Bouton "Valider le drop" intelligent : un item selectionne (pret, avec
  // son personnage) se fait ajouter a la pile avant validation, meme si la
  // pile contient deja d'autres drops — plus besoin de cliquer d'abord sur
  // "Ajouter ce drop" separement. Bouton inactif si rien a valider.
  const dropSelectionnePret = itemSelectionne && personnageId
  const peutValider = dropSelectionnePret || dropsEnCours.length > 0
  const validerDrop = () => {
    if (dropSelectionnePret) ajouterDrop()
    onValider()
  }

  return (
    <div className="df-songes">
    <div style={sp.page}>
      <button onClick={onAnnuler} style={sp.backBtn}>← Retour</button>
      <h1 className="df-section-title" style={{ fontSize: 20, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <IconeCoffre size={22} />
        J'ai drop
      </h1>

      <div style={sp.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(var(--df-card-bg), 0.95)", border: "1px solid rgba(var(--df-cyan-rgb), 0.5)", borderRadius: 10, padding: "9px 14px", marginBottom: 12 }}>
          <IconeRecherche />
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un item trackable..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--df-text)", fontSize: 14 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          {ORDRE_CATEGORIES.map(c => {
            const n = itemsTrackables.filter(i => i.categorie === c).length
            return (
              <span key={c} onClick={() => setCategorieFiltre(f => f === c ? null : c)} className="df-hover-lift" style={sp.pill(categorieFiltre === c)}>
                {CATEGORIE_LABELS[c]} ({n})
              </span>
            )
          })}
        </div>

        <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, marginBottom: 14 }}>
          {itemsFiltres.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: "var(--df-text-3)", fontSize: 13 }}>Aucun item ne correspond.</div>
          ) : itemsFiltres.map(i => (
            <div key={i.item_id} onClick={() => setItemSelectionne(i)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", background: itemSelectionne?.item_id === i.item_id ? "rgba(var(--df-cyan-rgb), 0.14)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {i.img ? <img src={i.img} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} /> : <div style={{ width: 26, height: 26 }} />}
              <span style={{ fontSize: 13.5, color: itemSelectionne?.item_id === i.item_id ? "var(--df-cyan)" : "var(--df-text)" }}>{i.nom}</span>
            </div>
          ))}
        </div>

        {itemSelectionne && (
          <div style={{ background: "rgba(12,15,29,0.5)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "var(--df-text-2)", marginBottom: 8 }}>
              Drop de <strong style={{ color: "var(--df-gold)" }}>{itemSelectionne.nom}</strong>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, color: "var(--df-text-3)", marginBottom: 6 }}>Quel personnage a drop ?</div>
              {equipeActive.membres.map(m => (
                <span key={m.perso_id} onClick={() => setPersonnageId(m.perso_id)} className="df-hover-lift" style={sp.pill(personnageId === m.perso_id)}>
                  {m.nom}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 11.5, color: "var(--df-text-3)" }}>Palier (optionnel)</label>
              <select value={palier} onChange={e => setPalier(e.target.value)} style={{ ...sp.select, borderRadius: 8 }}>
                <option value="">—</option>
                {(itemSelectionne.paliers || []).map(p => <option key={p} value={p}>{NOMS_PALIERS_ROMAINS[p]}</option>)}
              </select>
              <button disabled={!personnageId} onClick={ajouterDrop} className="df-hover-lift" style={{ ...sp.btnCyanPetit, marginLeft: "auto", opacity: personnageId ? 1 : 0.5 }}>
                Ajouter ce drop
              </button>
            </div>
          </div>
        )}

        {dropsEnCours.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, color: "var(--df-text-3)", marginBottom: 6 }}>Drops de ce songe ({dropsEnCours.length})</div>
            {dropsEnCours.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                {d._img ? <img src={d._img} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} /> : null}
                <span style={{ fontSize: 13, color: "var(--df-text)" }}>{d._nom}</span>
                <span style={{ fontSize: 11.5, color: "var(--df-text-3)" }}>— {d._perso_nom}{d.palier ? ` · palier ${NOMS_PALIERS_ROMAINS[d.palier]}` : ""}</span>
                <span onClick={() => retirerDrop(i)} style={{ marginLeft: "auto", color: "var(--df-text-3)", cursor: "pointer" }}>✕</span>
              </div>
            ))}
          </div>
        )}

        <button disabled={!peutValider} onClick={validerDrop} className="df-hover-lift"
          style={{ ...sp.btnCyan, width: "100%", marginTop: 16, opacity: peutValider ? 1 : 0.5, cursor: peutValider ? "pointer" : "not-allowed" }}>
          Valider le drop
        </button>
      </div>
    </div>
    </div>
  )
}

// Modale de confirmation avant suppression d'une run (refonte historique) :
// remplace l'ancienne confirmation en 2 clics inline sur le bouton
// "Supprimer" (moins visible, pas de rappel de ce qui allait être perdu).
// songe = la run concernée ; le parent ne monte ce composant que lorsqu'une
// suppression est en attente (jamais rendu avec songe=null).
function ModaleSuppressionSonge({ songe, onAnnuler, onConfirmer }) {
  const refBoutonGarder = useRef(null)
  useEffect(() => {
    refBoutonGarder.current?.focus()
    const surTouche = e => { if (e.key === "Escape") onAnnuler() }
    window.addEventListener("keydown", surTouche)
    return () => window.removeEventListener("keydown", surTouche)
  }, [onAnnuler])

  return (
    <div onClick={onAnnuler} style={{
      position: "fixed", inset: 0, background: "rgba(3,12,17,.75)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "rgba(var(--df-card-bg), 0.97)", border: "1px solid rgba(240,192,64,.35)",
        borderRadius: 14, padding: "26px 24px", maxWidth: 400, width: "100%",
      }}>
        <div style={{ fontFamily: "var(--df-font-logo)", color: "var(--df-gold)", fontSize: 19, textAlign: "center", fontWeight: 700 }}>
          Effacer ce songe ?
        </div>
        <div style={{ color: "#8fa8ad", fontSize: 13.5, textAlign: "center", marginTop: 8 }}>
          Draconiros oubliera ce passage dans le Puits. Cette action est définitive.
        </div>

        {/* Rappel de la run concernée, même style que la liste (voir
            styleConteneurSonge) : le joueur voit ce qu'il s'apprête à perdre. */}
        <div style={{ marginTop: 18, ...styleConteneurSonge(songe) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <PastilleIntensite s={songe} />
            <span style={{ color: "#e8f4f6", fontSize: 15, fontWeight: 500 }}>Run #{songe.id}</span>
          </div>
          <div style={{ fontSize: 12.5, marginTop: 6, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <InfosBasSonge s={songe} />
          </div>
          {songe.drops.length > 0 && (
            <div style={{ marginTop: 10, borderTop: "1px solid rgba(240,192,64,.18)", paddingTop: 8 }}>
              {songe.drops.map(d => <LigneDropSonge key={d.id} d={d} />)}
            </div>
          )}
        </div>

        {/* Ordre volontaire : "Non, garder" à gauche, "Oui, effacer" à
            droite — ne pas inverser (consigne explicite). */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button ref={refBoutonGarder} onClick={onAnnuler} className="df-hover-lift" style={{
            flex: 1, background: "transparent", color: "#8fa8ad", border: "1px solid rgba(143,168,173,.3)",
            borderRadius: 8, padding: "10px 14px", fontSize: 13.5, cursor: "pointer",
          }}>Non, garder</button>
          <button onClick={onConfirmer} className="df-hover-lift" style={{
            flex: 1, background: "color-mix(in srgb, var(--df-cauchemar) 14%, transparent)", color: "var(--df-cauchemar)",
            border: "1px solid color-mix(in srgb, var(--df-cauchemar) 50%, transparent)",
            borderRadius: 8, padding: "10px 14px", fontSize: 13.5, cursor: "pointer",
          }}>Oui, effacer</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Écran principal
// ============================================================

function SongesEcranPrincipal({ config, teams, teamId, changerTeam, onBack,
  intensiteNiveau, changerIntensite, categorieAffichee, changerCategorie, stats,
  historique, pageHistorique, setPageHistorique,
  dernierRunId, onAnnulerDernierSonge, onSupprimerSonge, onSupprimerDrop, onCorrigerVagueFinale,
  songeEchoue, setSongeEchoue, salleAtteinte, setSalleAtteinte, dropsEnCours,
  vagueFinale, setVagueFinale,
  chronoSecondes, chronoEnMarche, onChronoDemarrerPause, onChronoReinitialiser,
  onSongeTermine, onOuvrirGestion, onOuvrirAjoutDrop, onOuvrirMesDrops, enregistrement, erreur, onSelectObjet }) {

  // Sécheresse de la catégorie affichée : voir /songes/stats
  // (categories_secheresse) — calcul dédié côté backend, pas un simple
  // minimum client (les cosmétiques n'ont pas tous les mêmes paliers
  // éligibles). Seul le chiffre principal est affiché (retour d'usage,
  // refonte du 29 juillet 2026 : plus de sous-titre "tirages").
  const infoCategorie = stats?.categories_secheresse?.find(c => c.categorie === categorieAffichee) || null
  const secheresseSonges = infoCategorie ? infoCategorie.songes_depuis_dernier_drop : null

  // Combat final : bribes en direct, jamais de taux en dur (chantier 1,
  // passe 1b) — bribes_par_vague et vagues_max/vagues_requises viennent
  // tous deux de /songes/config. Chainage optionnel partout : un backend qui
  // n'a pas encore ces champs (ancien process actif, ou config en cours de
  // chargement) dégrade proprement (pas de plafond, détail/mention masqués)
  // plutôt que de planter (Cannot read properties of undefined).
  const cleIntensite = `${intensiteNiveau.intensite}_${intensiteNiveau.niveau}`
  const vaguesMaxActuel = config.vagues_max?.[intensiteNiveau.intensite] ?? null
  const bribesParVagueActuel = config.bribes_par_vague?.[cleIntensite]
  const vaguesRequisesActuel = config.vagues_requises?.[intensiteNiveau.intensite]
  const bribesEnCours = vagueFinale * (bribesParVagueActuel || 0)
  const ordinalVaguesRequises = vaguesRequisesActuel === 1 ? "1re" : `${vaguesRequisesActuel}e`

  // Réaction visuelle au clic sur "Run terminée" (point 6 du chantier 1 passe
  // 1c) : purement présentationnel, aucun impact sur enregistrerRun côté
  // parent. Le halo du compteur flashe brièvement puis reprend son pulse.
  const [flashCompteur, setFlashCompteur] = useState(false)
  const declencherFlashCompteur = () => {
    setFlashCompteur(true)
    setTimeout(() => setFlashCompteur(false), 650)
  }

  // Suppression d'une run : modale de confirmation (refonte historique),
  // songeASupprimer porte l'objet complet (pas juste l'id) pour que la
  // modale puisse afficher le rappel sans redemander l'historique.
  const [songeASupprimer, setSongeASupprimer] = useState(null)
  // Confirmation en 2 clics pour les drops individuels (inchangé — pas de
  // window.confirm() : coupe avec la charte graphique custom et bloquerait
  // l'automatisation de test navigateur). Premier clic -> "Confirmer ?" ;
  // second clic sur le MEME id -> supprime.
  const [confirmerDropId, setConfirmerDropId] = useState(null)
  // Rattrapage vague finale (chantier 1, passe 1b) : { id, valeur } de la
  // run en cours de correction, ou null si aucune. UNIQUEMENT vague_finale
  // — aucun autre champ de la run n'est éditable ici (consigne explicite).
  const [vagueFinaleEnEdition, setVagueFinaleEnEdition] = useState(null)

  const clicSupprimerDrop = (id) => {
    if (confirmerDropId === id) { onSupprimerDrop(id); setConfirmerDropId(null) }
    else { setConfirmerDropId(id) }
  }

  return (
    <div className="df-songes">
      {/* Bandeau haut (refonte visuelle, chantier 1 passe 1d) : artwork
          Draconiros à taille native (290x180, trop petit pour du plein
          largeur — retour Popo), fond uni de chaque côté, fondu vertical
          vers le fond en bas. Le titre n'est plus superposé sur l'image
          (ancienne marge négative) : il passe dans un cartouche SOUS le
          bandeau, voir .df-songes-cartouche. */}
      <div style={{ position: "relative" }}>
        <div className="df-songes-banniere">
          <img src="/assets/oeil/draconiros_1160px.png" alt="" />
        </div>
        <button onClick={onBack} className="df-hover-lift" style={{
          ...sp.backBtn, position: "absolute", top: 14, left: 16, zIndex: 2, marginBottom: 0,
          background: "rgba(4,18,26,0.55)", backdropFilter: "blur(4px)",
        }}>← Retour</button>
      </div>
      {/* Titre sur le modèle du hero de l'accueil (retour Popo, passe 1k —
          voir h1/.lede dans AccueilPage.jsx + pageAccueil.css) : titre
          Cinzel, sous-titre gris. Plus de cartouche encadré : posé
          directement sur le fond. Surtitre retiré (passe 1m, retour Popo). */}
      <div style={{ textAlign: "center", padding: "22px 20px 4px" }}>
        {/* Halo cyan multi-couches (retour Popo) : remplace l'ombre portée
            sombre par une lueur qui irradie — texte du plus serré (opacité
            haute) au plus étalé (opacité basse), couleur charte #2CE7FF.
            Le titre n'est plus superposé à l'artwork (voir commentaire du
            bandeau ci-dessus), posé sur le fond sombre : pas besoin d'ombre
            de contraste en plus du halo. */}
        {/* Étoiles à éclat de part et d'autre du titre (retour Popo) : voir
            .df-songes-titre-eclat dans pageSonges.css — pseudo-éléments
            ::before/::after, pas d'image, unités em pour suivre la taille
            du titre. */}
        <h1 className="df-songes-titre-eclat" style={{ fontFamily: "var(--df-font-logo)", fontWeight: 700, fontSize: "clamp(32px, 6vw, 52px)", color: "var(--df-text)", margin: "0 0 10px", lineHeight: 1.06, textShadow: "0 0 4px rgba(44,231,255,.85), 0 0 14px rgba(44,231,255,.55), 0 0 32px rgba(44,231,255,.32), 0 0 60px rgba(44,231,255,.16)" }}>
          L'Œil de Draconiros
        </h1>
        <p style={{ margin: "0 auto", maxWidth: 480, fontSize: 14.5, fontWeight: 300, color: "var(--df-text-2)" }}>
          Dans les songes, Draconiros veille sur ton drop et juge ton endurance.
        </p>
      </div>

      <div style={{ ...sp.page, position: "relative" }}>
        {/* 1. Sélecteur de catégorie, au-dessus du bloc stats */}
        <div style={{ marginBottom: 10 }}>
          {ORDRE_CATEGORIES.map(c => (
            <span key={c} onClick={() => changerCategorie(c)} className="df-hover-lift" style={sp.pill(categorieAffichee === c)}>
              {CATEGORIE_LABELS_SELECTEUR[c]}
            </span>
          ))}
        </div>

        {/* 2. Bloc stats — un seul cadre continu, rectangle allongé (marges
            verticales réduites, passe 1i — voir .df-songes-stats). Gauche =
            meilleure série (or), centre = sans légende depuis, droite = runs
            en {intensité}. Les 3 colonnes suivent EXACTEMENT le même schéma :
            label, case chiffre de hauteur fixe 44px (centrage flex), case
            légende de hauteur fixe 18px (vide sauf au centre où vit "runs"),
            SeparateurDore identique et jamais enveloppé dans une marge
            spécifique (retour Popo). Le chiffre central est ~1,3x les
            latéraux — reste la stat mise en avant (cyan) sans écraser le
            bloc (gardait par erreur la taille du cadran d'horloge retiré).
            Ces hauteurs fixes garantissent que labels, chiffres et filets
            tombent sur la même ligne horizontale entre les 3 colonnes
            (justify-content: flex-start sur .df-songes-stat-col) sans aucune
            marge de compensation : "runs" vit dans sa propre case réservée,
            il ne décale ni le chiffre ni le filet. Sous 700px : colonne,
            centre en premier. */}
        <div className="df-songes-stats df-songes-cadre-dore">
          <CoinsDores />
          <div className="df-songes-stat-col" style={{ flex: "1 1 0", textAlign: "center", padding: "8px 20px" }}>
            <div title="Record pour cette intensité et ce niveau." style={{ fontSize: 10.5, color: "var(--df-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", cursor: "help" }}>
              Meilleure série
            </div>
            <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
              {stats?.meilleure_serie_sans_legende != null ? (
                <div style={{ fontFamily: "var(--df-font-logo)", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, color: "var(--df-gold)" }}>
                  {stats.meilleure_serie_sans_legende}
                </div>
              ) : (
                <div title="Aucune légende ne peut tomber à cette intensité." style={{ fontFamily: "var(--df-font-logo)", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, color: "var(--df-text-3)", cursor: "help" }}>
                  —
                </div>
              )}
            </div>
            <div style={{ height: 18 }} />
            <SeparateurDore />
          </div>

          <div className="df-songes-stat-col df-songes-stat-centre" style={{ flex: "1.6 1 0", textAlign: "center", padding: "8px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--df-text-3)", letterSpacing: 1, textTransform: "uppercase" }}>
              Sans {CATEGORIE_MOT_SINGULIER[categorieAffichee]} depuis
            </div>
            <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
              {secheresseSonges == null ? (
                <div style={{ color: "var(--df-text-2)", fontSize: 11 }}>Aucune donnée.</div>
              ) : (
                <div className={flashCompteur ? "df-songes-flash" : ""} style={{ fontFamily: "var(--df-font-logo)", fontSize: "clamp(29px, 5.2vw, 39px)", fontWeight: 700, color: "var(--df-cyan)", lineHeight: 1, textShadow: "0 0 14px rgba(44,231,255,0.5)" }}>
                  {formaterNombre(secheresseSonges)}
                </div>
              )}
            </div>
            <div style={{ height: 18 }}>
              {secheresseSonges != null && (
                <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--df-text-2)" }}>runs</div>
              )}
            </div>
            <SeparateurDore />
          </div>

          <div className="df-songes-stat-col" style={{ flex: "1 1 0", textAlign: "center", padding: "8px 20px" }}>
            <div style={{ fontSize: 10.5, color: "var(--df-text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Runs en {INTENSITE_LABEL[intensiteNiveau.intensite] || intensiteNiveau.intensite} {NOMS_PALIERS_ROMAINS[intensiteNiveau.niveau] || intensiteNiveau.niveau}
            </div>
            <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
              <div style={{ fontFamily: "var(--df-font-logo)", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, color: "var(--df-gold)" }}>
                {stats?.total_runs ?? "—"}
              </div>
            </div>
            <div style={{ height: 18 }} />
            <SeparateurDore />
          </div>
        </div>

        {/* 3. RÉGLAGES — 3 cartes côte à côte (retour Popo, passe 1l : le
            minuteur prend la place de "Combat à vague" dans les cartes,
            "Combat à vague" descend sur la ligne du bas avec le détail des
            bribes). */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          {/* Sélecteur centré verticalement dans l'espace restant sous le
              libellé (retour Popo) : un wrapper flex:1 dédié, séparé du
              libellé qui reste épinglé en haut (padding-top de la carte,
              inchangé — sinon les 3 libellés de la rangée ne tombent plus
              sur la même ligne). Le bouton "Personnages & teams" est sorti
              du flux (position absolute, ancré en bas) pour ne pas peser
              dans le calcul de centrage du select — c'est ce qui permet au
              select d'atterrir exactement à la même hauteur que dans la
              carte Intensité (même espace disponible des deux côtés). */}
          <div className="df-songes-reglage-carte" style={{ position: "relative" }}>
            <div className="df-songes-reglage-carte-label">
              <IconeTeamPersonnages size={20} style={{ objectFit: "contain" }} />
              <span>Team</span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}>
              <select value={teamId || ""} onChange={e => changerTeam(Number(e.target.value))} style={{ ...sp.select, fontSize: 12, width: "100%", boxSizing: "border-box" }}>
                {teams.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
              </select>
            </div>
            <button onClick={onOuvrirGestion} className="df-hover-lift" style={{ ...sp.lienDiscret, fontSize: 10.5, position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center" }}>⚙ Personnages & teams</button>
          </div>

          {/* Bordure CSS teintée par intensité (chantier 1m, retour Popo : le
              border-image de la passe précédente déformait les coins).
              Équerres dorées comme les autres blocs — ce qui impose le même
              montage ::before + isolation que .df-songes-cadre-dore (sinon
              le clip-path du conteneur rogne les équerres pile dans les
              coins coupés), voir .df-songes-reglage-carte-intensite. */}
          <div className="df-songes-reglage-carte df-songes-reglage-carte-intensite"
            style={{ "--df-couleur-intensite": INTENSITE_COULEUR[intensiteNiveau.intensite] }}>
            <CoinsDores />
            <div className="df-songes-reglage-carte-label">
              <IconeIntensiteEliatrope size={20} style={{ objectFit: "contain" }} />
              <span>Intensité</span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}>
              <select value={`${intensiteNiveau.intensite}_${intensiteNiveau.niveau}`}
                onChange={e => { const [intensite, niveau] = e.target.value.split("_"); changerIntensite(intensite, Number(niveau)) }}
                style={{ ...sp.select, fontSize: 12, width: "100%", boxSizing: "border-box" }}>
                {Object.entries(config.intensites).map(([cle, info]) =>
                  info.niveaux.map(n => (
                    <option key={`${cle}_${n}`} value={`${cle}_${n}`}>
                      {INTENSITE_LABEL[cle] || cle} {NOMS_PALIERS_ROMAINS[n] || n}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Minuteur : temps + les 3 boutons fixes (Démarrer désactivé en
              marche, Pause désactivé à l'arrêt, Réinitialiser toujours actif). */}
          <div className="df-songes-reglage-carte">
            <div className="df-songes-reglage-carte-label">
              <IconeSablier size={20} style={{ objectFit: "contain" }} />
              <span>Minuteur</span>
            </div>
            <span style={{ fontFamily: "var(--df-font-logo)", fontSize: 22, color: "var(--df-text)", fontVariantNumeric: "tabular-nums" }}>
              {formaterDuree(chronoSecondes)}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={onChronoDemarrerPause} disabled={chronoEnMarche} className="df-hover-lift"
                style={{ ...sp.btnCyanPetit, opacity: chronoEnMarche ? 0.4 : 1, cursor: chronoEnMarche ? "default" : "pointer" }}>Démarrer</button>
              <button onClick={onChronoDemarrerPause} disabled={!chronoEnMarche} title="Pause" className="df-hover-lift"
                style={{ ...sp.btnIconCarre, background: "rgba(242,109,109,0.12)", borderColor: "rgba(242,109,109,0.5)", color: "var(--df-red)", opacity: chronoEnMarche ? 1 : 0.4, cursor: chronoEnMarche ? "pointer" : "default" }}>⏸</button>
              <button onClick={onChronoReinitialiser} title="Réinitialiser" className="df-hover-lift" style={sp.btnIconCarre}>↺</button>
            </div>
          </div>
        </div>

        {/* Encadré unique de fin de songe (refonte visuelle) : bribes de la
            run en cours (compteur −/+ toujours §3.2, plafonné par
            config.vagues_max), puis actions ("J'ai drop" / run interrompue),
            puis RUN TERMINÉE en pleine largeur — remplace les 3 blocs
            empilés précédents (compteur, gros bouton, deux actions). Aucun
            changement de logique : mêmes handlers, mêmes conditions. */}
        <div style={{ border: "1px solid rgba(44,231,255,.28)", borderRadius: 12, padding: 16, background: "rgba(44,231,255,.04)", marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, borderBottom: "1px solid rgba(44,231,255,.15)", paddingBottom: 14 }}>
            <div style={{ flex: 1 }}>
              {bribesParVagueActuel != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setVagueFinale(v => Math.max(0, v - 1))} className="df-hover-lift"
                    style={{ ...sp.btnFantome, padding: "1px 9px", fontSize: 13, fontWeight: 700 }}>−</button>
                  <button
                    onClick={() => setVagueFinale(v => vaguesMaxActuel != null ? Math.min(vaguesMaxActuel, v + 1) : v + 1)}
                    disabled={vaguesMaxActuel != null && vagueFinale >= vaguesMaxActuel}
                    className="df-hover-lift"
                    style={{ ...sp.btnFantome, padding: "1px 9px", fontSize: 13, fontWeight: 700, opacity: (vaguesMaxActuel != null && vagueFinale >= vaguesMaxActuel) ? 0.5 : 1 }}>+</button>
                  <span style={{ fontSize: 12, color: "#5f8a90" }}>
                    {vagueFinale} vague{vagueFinale > 1 ? "s" : ""} × {bribesParVagueActuel} bribes
                    {vaguesRequisesActuel != null && ` · victoire dès la ${ordinalVaguesRequises} vague`}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
              <IconeBribe size={34} />
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: "var(--df-font-logo)", fontSize: 22, fontWeight: 700, color: "#F0C040" }}>
                    {bribesParVagueActuel != null ? formaterNombre(bribesEnCours) : "—"}
                  </span>
                  <span style={{ fontSize: 13, color: "#7FE9E0" }}>bribes de rêve</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, margin: "14px 0" }}>
            <button onClick={onOuvrirAjoutDrop} className="df-hover-lift"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#F0C040", color: "#1a1408", border: "none", borderRadius: 8, padding: 11, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              <IconeCoffre size={18} />
              J'ai drop
            </button>
            <div style={{ flex: 1 }}>
              <BasculeSongeInterrompu nbSallesParRun={config.nb_salles_par_run} songeEchoue={songeEchoue} setSongeEchoue={setSongeEchoue}
                salleAtteinte={salleAtteinte} setSalleAtteinte={setSalleAtteinte} />
            </div>
          </div>

          <button disabled={enregistrement} onClick={() => { onSongeTermine(); declencherFlashCompteur() }} className="df-hover-lift"
            style={{ ...sp.btnCyan, width: "100%", opacity: enregistrement ? 0.6 : 1 }}>
            Run terminée
          </button>
        </div>

        {dropsEnCours.length > 0 && (
          <button onClick={onOuvrirAjoutDrop} className="df-hover-lift" style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
            background: "rgba(var(--df-gold-rgb), 0.12)", color: "var(--df-gold)",
            border: "1px solid var(--df-gold)", borderRadius: 999, padding: "6px 14px",
            fontSize: 13.5, fontWeight: 700, cursor: "pointer",
          }}>
            {dropsEnCours.length} drop{dropsEnCours.length > 1 ? "s" : ""} en attente
          </button>
        )}

        {songeEchoue && (
          <button disabled={enregistrement} onClick={onSongeTermine} className="df-hover-lift" style={{ ...sp.btnCyanPetit, marginTop: 10 }}>
            Enregistrer cette run
          </button>
        )}

        {erreur && <div style={{ color: "var(--df-red)", fontSize: 12.5, marginTop: 10 }}>{erreur}</div>}

        {/* 7. Annulation rapide du dernier songe — gris discret, pas rouge :
            c'est réversible, pas destructeur (refonte visuelle, passe 1c). */}
        {dernierRunId && (
          <div style={{ marginTop: 14 }}>
            <button onClick={onAnnulerDernierSonge} style={sp.lienDiscret}>
              Annuler la dernière run enregistrée (Run #{dernierRunId})
            </button>
          </div>
        )}

        {/* 6. Historique des songes */}
        <div style={{ marginTop: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="df-block-title" style={{ margin: 0 }}>Historique des runs</div>
            <button onClick={onOuvrirMesDrops} style={{ ...sp.lienDiscret, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <IconeCoffre size={14} />
              Mes drops
            </button>
          </div>
          {historique.songes.length === 0 ? (
            <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "12px 0" }}>Aucune run enregistrée pour l'instant.</div>
          ) : historique.songes.map(s => (
            <div key={s.id} style={{ ...styleConteneurSonge(s), marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <PastilleIntensite s={s} />
                  <span style={{ color: "#e8f4f6", fontSize: 15, fontWeight: 500 }}>
                    Run #{s.id}
                    {!s.terminee && <span style={{ color: "#5f7d84", fontWeight: 400 }}> (interrompu, salle {s.salle_atteinte})</span>}
                  </span>
                </div>
                <button onClick={() => setSongeASupprimer(s)} className="df-lien-supprimer"
                  style={{ fontSize: 12, cursor: "pointer", textDecoration: "underline", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>
                  Supprimer
                </button>
              </div>
              <div style={{ fontSize: 12.5, marginTop: 6, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                  {/* Rattrapage vague finale (chantier 1, passe 1b) : UNIQUEMENT ce
                      champ est corrigeable depuis l'historique, rien d'autre.
                      Refresh de l'historique après enregistrement -> les bribes
                      affichées (calculées côté backend) se recalculent aussitôt. */}
                  {vagueFinaleEnEdition?.id === s.id ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#8fa8ad" }}>{s.team_nom || "—"}</span>
                      <PointSeparateur />
                      Vague finale :
                      <input type="number" min={1} value={vagueFinaleEnEdition.valeur}
                        onChange={e => setVagueFinaleEnEdition({ id: s.id, valeur: e.target.value })}
                        style={{ width: 48, ...sp.champ, padding: "2px 6px", fontSize: 11.5 }} />
                      <button onClick={() => { onCorrigerVagueFinale(s.id, Number(vagueFinaleEnEdition.valeur)); setVagueFinaleEnEdition(null) }}
                        style={{ color: "var(--df-cyan-2)", fontSize: 12, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}>Enregistrer</button>
                      <button onClick={() => setVagueFinaleEnEdition(null)}
                        style={{ color: "#4a6b72", fontSize: 12, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}>Annuler</button>
                    </span>
                  ) : (
                    <InfosBasSonge s={s} />
                  )}
                </div>
                {vagueFinaleEnEdition?.id !== s.id && (
                  <button onClick={() => setVagueFinaleEnEdition({ id: s.id, valeur: s.vague_finale || 1 })} className="df-lien-corriger"
                    style={{ fontSize: 12, cursor: "pointer", textDecoration: "underline", background: "none", border: "none", padding: 0, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    {s.vague_finale != null ? "Corriger" : "Renseigner"}
                  </button>
                )}
              </div>
              {s.drops.length > 0 && (
                <div style={{ marginTop: 10, borderTop: "1px solid rgba(240,192,64,.18)", paddingTop: 8 }}>
                  {s.drops.map(d => (
                    <LigneDropSonge key={d.id} d={d}
                      onClick={() => onSelectObjet(d.item_id)}
                      onSupprimer={() => clicSupprimerDrop(d.id)}
                      confirmerActif={confirmerDropId === d.id} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {songeASupprimer && (
        <ModaleSuppressionSonge songe={songeASupprimer}
          onAnnuler={() => setSongeASupprimer(null)}
          onConfirmer={() => { onSupprimerSonge(songeASupprimer.id); setSongeASupprimer(null) }} />
      )}
    </div>
  )
}

// ============================================================
// Page dédiée "Mes drops" (refonte interface, 29 juillet 2026)
// ============================================================

function SongesMesDropsPage({ token, personnages, onBack, onSelectObjet }) {
  const [categorieFiltre, setCategorieFiltre] = useState(null)
  const [persoFiltre, setPersoFiltre] = useState(null)
  const [page, setPage] = useState(1)
  const [donnees, setDonnees] = useState({ total: 0, drops: [] })
  const [chargement, setChargement] = useState(true)

  useEffect(() => { setPage(1) }, [categorieFiltre, persoFiltre])

  useEffect(() => {
    setChargement(true)
    const params = new URLSearchParams({ page, page_size: 20 })
    if (categorieFiltre) params.set("categorie", categorieFiltre)
    if (persoFiltre) params.set("perso_id", persoFiltre)
    fetch(`${API}/songes/drops?${params}`, { headers: authHeaders(token) })
      .then(r => r.json()).then(d => { setDonnees(d); setChargement(false) })
  }, [token, categorieFiltre, persoFiltre, page])

  const totalPages = Math.max(Math.ceil((donnees.total || 0) / 20), 1)

  return (
    <div className="df-songes">
    <div style={sp.page}>
      <button onClick={onBack} style={sp.backBtn}>← Retour</button>
      <h1 className="df-section-title" style={{ fontSize: 20, margin: "0 0 14px" }}>🎁 Mes drops</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <span onClick={() => setCategorieFiltre(null)} className="df-hover-lift" style={sp.pill(categorieFiltre === null)}>Toutes</span>
        {ORDRE_CATEGORIES.map(c => (
          <span key={c} onClick={() => setCategorieFiltre(c)} className="df-hover-lift" style={sp.pill(categorieFiltre === c)}>
            {CATEGORIE_LABELS_SELECTEUR[c]}
          </span>
        ))}
        <select value={persoFiltre || ""} onChange={e => setPersoFiltre(e.target.value ? Number(e.target.value) : null)}
          style={{ ...sp.select, marginLeft: "auto" }}>
          <option value="">Tous les personnages</option>
          {personnages.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div>

      {chargement ? (
        <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Chargement...</div>
      ) : donnees.drops.length === 0 ? (
        <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Aucun drop ne correspond.</div>
      ) : (
        donnees.drops.map(d => (
          <div key={d.id} style={{ background: "rgba(var(--df-card-bg), 0.9)", border: "1px solid rgba(var(--df-gold-rgb), 0.13)", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span onClick={() => onSelectObjet(d.item_id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: "1 1 240px", minWidth: 0 }}>
                {d.item_img ? <img src={d.item_img} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} /> : null}
                <span style={{ fontSize: 13.5, color: "var(--df-gold)", fontWeight: 700 }}>
                  {d.item_nom}{d.quantite > 1 ? ` ×${d.quantite}` : ""}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--df-text-3)" }}>
                  — {d.perso_nom} · {INTENSITE_LABEL[d.intensite] || d.intensite} {NOMS_PALIERS_ROMAINS[d.niveau] || d.niveau}
                  {d.palier ? ` · palier ${NOMS_PALIERS_ROMAINS[d.palier]}` : ""}
                </span>
              </span>
              <span style={{ fontSize: 11.5, color: "var(--df-text-3)", whiteSpace: "nowrap" }}>{formaterDate(d.date_drop)}</span>
            </div>
          </div>
        ))
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 10 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="df-hover-lift" style={{ ...sp.btnFantome, opacity: page <= 1 ? 0.5 : 1 }}>← Précédent</button>
          <span style={{ fontSize: 12, color: "var(--df-text-2)" }}>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="df-hover-lift" style={{ ...sp.btnFantome, opacity: page >= totalPages ? 0.5 : 1 }}>Suivant →</button>
        </div>
      )}
    </div>
    </div>
  )
}

// ============================================================
// Racine
// ============================================================

export default function SongesPage({ token, onSelectObjet, onBack }) {
  const [config, setConfig] = useState(null)
  const [itemsTrackables, setItemsTrackables] = useState([])
  const [personnages, setPersonnages] = useState([])
  const [teams, setTeams] = useState([])
  const [chargementInitial, setChargementInitial] = useState(true)

  const [teamId, setTeamId] = useState(() => {
    const v = localStorage.getItem(LS_TEAM)
    return v ? Number(v) : null
  })
  const [intensiteNiveau, setIntensiteNiveau] = useState(() => {
    const v = localStorage.getItem(LS_INTENSITE)
    if (v) { try { return JSON.parse(v) } catch { /* valeur corrompue, ignoree */ } }
    return null
  })
  const [categorieAffichee, setCategorieAffichee] = useState(() => {
    const v = localStorage.getItem(LS_CATEGORIE)
    return ORDRE_CATEGORIES.includes(v) ? v : "legende"
  })

  const [mode, setMode] = useState("principal") // "principal" | "ajout-drop" | "gestion" | "mes-drops"
  const [dropsEnCours, setDropsEnCours] = useState([])
  const [songeEchoue, setSongeEchoue] = useState(false)
  const [salleAtteinte, setSalleAtteinte] = useState(26)
  // Compteur "Combat final" (chantier 1, passe 1b) : nombre, plus une chaîne
  // vide — 0 = pas encore renseigné, cohérent avec l'ancien état "vide".
  const [vagueFinale, setVagueFinale] = useState(0)
  const [dernierRunId, setDernierRunId] = useState(null)
  const [stats, setStats] = useState(null)
  const [historique, setHistorique] = useState({ songes: [], total: 0 })
  const [pageHistorique, setPageHistorique] = useState(1)
  const [journal, setJournal] = useState({ entrees: [], total: 0 })
  const [pageJournal, setPageJournal] = useState(1)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState("")

  // Chronometre optionnel (refonte interface) : session uniquement, jamais
  // persiste (reset au rechargement de page, comme le reste de l'etat de
  // session — teamId/intensite sont les seules exceptions, deja en
  // localStorage). S'arrete et se reinitialise a chaque songe enregistre.
  const [chronoSecondes, setChronoSecondes] = useState(0)
  const [chronoEnMarche, setChronoEnMarche] = useState(false)
  useEffect(() => {
    if (!chronoEnMarche) return
    const id = setInterval(() => setChronoSecondes(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [chronoEnMarche])
  const chronoDemarrerPause = () => setChronoEnMarche(m => !m)
  const chronoReinitialiser = () => { setChronoEnMarche(false); setChronoSecondes(0) }

  // Config + items trackables : publics, charges une seule fois (jamais en
  // dur — SONGES.md exigence non negociable).
  useEffect(() => {
    fetch(`${API}/songes/config`).then(r => r.json()).then(d => {
      setConfig(d)
      setSalleAtteinte(d.nb_salles_par_run)
    })
    fetch(`${API}/songes/items-trackables`).then(r => r.json()).then(d => setItemsTrackables(d.items))
  }, [])

  useEffect(() => {
    if (config && !intensiteNiveau) {
      setIntensiteNiveau({ intensite: config.intensite_defaut.intensite, niveau: config.intensite_defaut.niveau })
    }
  }, [config, intensiteNiveau])

  // Le plafond du compteur "Combat final" dépend de l'intensité (Rêve 5,
  // Paradoxe 15, Cauchemar illimité) : si on change d'intensité après avoir
  // monté le compteur, on le ramène au nouveau plafond plutôt que de laisser
  // une valeur incohérente (chantier 1, passe 1b).
  useEffect(() => {
    // config?.vagues_max (pas juste !config) : un backend qui n'a pas encore
    // ce champ (ancien process encore actif, ou config pas fini de charger)
    // ne doit jamais faire planter le rendu — juste ne rien clamper.
    if (!config?.vagues_max || !intensiteNiveau) return
    const max = config.vagues_max[intensiteNiveau.intensite]
    if (max != null && vagueFinale > max) setVagueFinale(max)
  }, [intensiteNiveau, config]) // eslint-disable-line

  const chargerPersonnagesEtTeams = () => {
    if (!token) return
    Promise.all([
      fetch(`${API}/songes/personnages`, { headers: authHeaders(token) }).then(r => r.json()),
      fetch(`${API}/songes/teams`, { headers: authHeaders(token) }).then(r => r.json()),
    ]).then(([p, t]) => {
      setPersonnages(p.personnages)
      setTeams(t.teams)
      setChargementInitial(false)
    })
  }

  useEffect(() => { chargerPersonnagesEtTeams() }, [token]) // eslint-disable-line

  // Team active : garde le choix memorise s'il existe toujours, sinon
  // retombe sur la premiere team disponible.
  useEffect(() => {
    if (teams.length === 0) return
    if (teamId && teams.some(t => t.id === teamId)) return
    setTeamId(teams[0].id)
    localStorage.setItem(LS_TEAM, String(teams[0].id))
  }, [teams]) // eslint-disable-line

  const changerTeam = (id) => { setTeamId(id); localStorage.setItem(LS_TEAM, String(id)) }
  const changerIntensite = (intensite, niveau) => {
    const v = { intensite, niveau }
    setIntensiteNiveau(v)
    localStorage.setItem(LS_INTENSITE, JSON.stringify(v))
  }
  const changerCategorie = (cat) => { setCategorieAffichee(cat); localStorage.setItem(LS_CATEGORIE, cat) }

  const equipeActive = teams.find(t => t.id === teamId) || null

  // Stats (pour la sécheresse) : rechargées à chaque changement de team/
  // intensité, et après toute création/suppression de songe ou de drop.
  const rafraichirStats = () => {
    if (!token || !teamId || !intensiteNiveau) return
    const params = new URLSearchParams({ intensite: intensiteNiveau.intensite, niveau: intensiteNiveau.niveau, team_id: teamId })
    fetch(`${API}/songes/stats?${params}`, { headers: authHeaders(token) }).then(r => r.json()).then(setStats).catch(() => setStats(null))
  }
  useEffect(rafraichirStats, [token, teamId, intensiteNiveau]) // eslint-disable-line

  // page_size=5 (refonte historique) : seules les 5 runs les plus récentes
  // sont affichées pour l'instant, pas de bouton "voir plus" (page
  // d'historique complet pas encore construite) — l'endpoint acceptait déjà
  // page_size en paramètre, son contrat n'a pas changé.
  const rafraichirHistorique = (page = pageHistorique) => {
    if (!token) return
    fetch(`${API}/songes/historique?page=${page}&page_size=5`, { headers: authHeaders(token) })
      .then(r => r.json()).then(setHistorique)
  }
  useEffect(() => rafraichirHistorique(pageHistorique), [token, pageHistorique]) // eslint-disable-line

  const rafraichirJournal = (page = pageJournal) => {
    if (!token) return
    fetch(`${API}/songes/journal?page=${page}&page_size=10`, { headers: authHeaders(token) })
      .then(r => r.json()).then(setJournal)
  }
  // Le Journal n'est utile que dans le panneau de gestion : charge seulement
  // en y entrant, pas a chaque rendu de l'ecran principal.
  useEffect(() => { if (mode === "gestion") rafraichirJournal(1); setPageJournal(1) }, [mode]) // eslint-disable-line
  useEffect(() => { if (mode === "gestion") rafraichirJournal(pageJournal) }, [pageJournal]) // eslint-disable-line

  const enregistrerRun = () => {
    if (!equipeActive || equipeActive.membres.length === 0) return
    setEnregistrement(true); setErreur("")
    const terminee = !songeEchoue
    const participants = equipeActive.membres.map(m => m.perso_id)
    const body = {
      intensite: intensiteNiveau.intensite, niveau: intensiteNiveau.niveau,
      terminee, salle_atteinte: terminee ? config.nb_salles_par_run : salleAtteinte,
      participants, team_id: teamId,
      drops: dropsEnCours.map(d => ({ perso_id: d.perso_id, item_id: d.item_id, quantite: d.quantite, palier: d.palier })),
      duree_secondes: chronoSecondes > 0 ? chronoSecondes : null,
      vague_finale: vagueFinale > 0 ? vagueFinale : null,
    }
    fetch(`${API}/songes/runs`, { method: "POST", headers: authHeaders(token, true), body: JSON.stringify(body) })
      .then(async r => { if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || "Erreur d'enregistrement") }; return r.json() })
      .then(d => {
        setDernierRunId(d.id)
        setSongeEchoue(false); setSalleAtteinte(config.nb_salles_par_run)
        setDropsEnCours([]); setMode("principal")
        chronoReinitialiser(); setVagueFinale(0)
        rafraichirStats(); rafraichirHistorique(1); setPageHistorique(1)
      })
      .catch(e => setErreur(e.message))
      .finally(() => setEnregistrement(false))
  }

  const annulerDernierSonge = () => {
    if (!dernierRunId) return
    fetch(`${API}/songes/runs/${dernierRunId}`, { method: "DELETE", headers: authHeaders(token) })
      .then(() => { setDernierRunId(null); rafraichirStats(); rafraichirHistorique(1); setPageHistorique(1) })
  }

  const supprimerSonge = (id) => {
    fetch(`${API}/songes/runs/${id}`, { method: "DELETE", headers: authHeaders(token) })
      .then(() => {
        if (dernierRunId === id) setDernierRunId(null)
        rafraichirStats(); rafraichirHistorique()
      })
  }

  const supprimerDrop = (dropId) => {
    fetch(`${API}/songes/drops/${dropId}`, { method: "DELETE", headers: authHeaders(token) })
      .then(() => { rafraichirStats(); rafraichirHistorique() })
  }

  // Rattrapage (chantier 1, passe 1b) : corrige UNIQUEMENT vague_finale sur
  // une run passée — rafraîchit l'historique ensuite, les bribes affichées
  // (calculées côté backend) se recalculent donc immédiatement.
  const corrigerVagueFinale = (runId, valeur) => {
    fetch(`${API}/songes/runs/${runId}/vague-finale`, {
      method: "PUT", headers: authHeaders(token, true), body: JSON.stringify({ vague_finale: valeur }),
    }).then(() => rafraichirHistorique())
  }

  const toutSupprimer = () => {
    return fetch(`${API}/songes/tout`, { method: "DELETE", headers: authHeaders(token) })
      .then(() => {
        setDernierRunId(null)
        rafraichirStats(); rafraichirHistorique(1); setPageHistorique(1)
        rafraichirJournal(1); setPageJournal(1)
      })
  }

  const ouvrirAjoutDrop = () => { setErreur(""); setMode("ajout-drop") }
  const ouvrirMesDrops = () => setMode("mes-drops")
  const retourAuPrincipal = () => { setErreur(""); setMode("principal") }

  if (!token) return <SongesConnexionRequise onBack={onBack} />
  // !intensiteNiveau : evite un rendu avec intensiteNiveau encore null entre
  // le montage et l'effet qui lui applique la valeur par defaut de la config
  // (l'effet ne s'execute qu'APRES le premier rendu) — plante sinon sur
  // intensiteNiveau.intensite dans les ecrans principal/ajout-drop.
  if (chargementInitial || !config || itemsTrackables.length === 0 || !intensiteNiveau) return <SongesChargement />

  if (teams.length === 0) {
    return <SongesGestion token={token} personnages={personnages} teams={teams}
      onRafraichir={chargerPersonnagesEtTeams} onTerminer={() => {}} onboarding />
  }

  if (mode === "gestion") {
    return (
      <>
        <SongesGestion token={token} personnages={personnages} teams={teams}
          onRafraichir={chargerPersonnagesEtTeams} onTerminer={() => setMode("principal")} />
        <div className="df-songes">
        <div style={{ ...sp.page, paddingTop: 0 }}>
          <SongesZoneDangereuse onToutSupprimer={toutSupprimer} />
          <SongesJournalSection journal={journal} page={pageJournal} setPage={setPageJournal} />
        </div>
        </div>
      </>
    )
  }

  if (mode === "ajout-drop") {
    return <SongesAjoutDrop itemsTrackables={itemsTrackables} equipeActive={equipeActive}
      dropsEnCours={dropsEnCours} setDropsEnCours={setDropsEnCours}
      onValider={retourAuPrincipal}
      onAnnuler={retourAuPrincipal} />
  }

  if (mode === "mes-drops") {
    return <SongesMesDropsPage token={token} personnages={personnages} onBack={retourAuPrincipal} onSelectObjet={onSelectObjet} />
  }

  return (
    <SongesEcranPrincipal config={config} teams={teams}
      teamId={teamId} changerTeam={changerTeam} onBack={onBack}
      intensiteNiveau={intensiteNiveau} changerIntensite={changerIntensite}
      categorieAffichee={categorieAffichee} changerCategorie={changerCategorie}
      stats={stats}
      historique={historique} pageHistorique={pageHistorique} setPageHistorique={setPageHistorique}
      dernierRunId={dernierRunId} onAnnulerDernierSonge={annulerDernierSonge}
      onSupprimerSonge={supprimerSonge} onSupprimerDrop={supprimerDrop}
      onCorrigerVagueFinale={corrigerVagueFinale}
      songeEchoue={songeEchoue} setSongeEchoue={setSongeEchoue} salleAtteinte={salleAtteinte} setSalleAtteinte={setSalleAtteinte}
      dropsEnCours={dropsEnCours}
      vagueFinale={vagueFinale} setVagueFinale={setVagueFinale}
      chronoSecondes={chronoSecondes} chronoEnMarche={chronoEnMarche}
      onChronoDemarrerPause={chronoDemarrerPause} onChronoReinitialiser={chronoReinitialiser}
      onSongeTermine={enregistrerRun}
      onOuvrirGestion={() => setMode("gestion")} onOuvrirAjoutDrop={ouvrirAjoutDrop} onOuvrirMesDrops={ouvrirMesDrops}
      enregistrement={enregistrement} erreur={erreur} onSelectObjet={onSelectObjet}
    />
  )
}
