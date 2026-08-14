import { useState, useEffect, useRef } from "react"
import { IconeBribe } from "./IconesSonges.jsx"

// Briques partagees entre SongesPage.jsx (L'Oeil de Draconiros) et
// HistoriquePage.jsx (chantier Historique general, 14 aout 2026) — meme
// ligne de songe, meme modale de suppression, memes styles, une seule
// implementation des actions API (suppression/edition). Deplace depuis
// SongesPage.jsx SANS aucun changement de comportement (commit dedie,
// verifie avant de continuer le chantier) : si un doute, comparer avec
// l'historique git de SongesPage.jsx avant cette extraction.
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

export function authHeaders(token, avecJson) {
  const h = {}
  if (token) h.Authorization = `Bearer ${token}`
  if (avecJson) h["Content-Type"] = "application/json"
  return h
}

export const formaterNombre = (n) => new Intl.NumberFormat("fr-FR").format(n)

export function formaterDate(iso) {
  if (!iso) return ""
  // SQLite datetime('now') stocke un TEXT UTC sans marqueur de fuseau —
  // on ajoute le "Z" nous-mêmes pour un affichage local correct.
  const d = new Date(iso.replace(" ", "T") + "Z")
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export function formaterDuree(secondes) {
  if (secondes == null) return null
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return m > 0 ? `${m} min ${s} s` : `${s} s`
}

// Libellé affiché par intensité (retour Popo, chantier 1 passe 1c-A) : les
// clés de config.intensites ("reve"/"paradoxe"/"cauchemar") n'ont pas
// d'accent — un simple charAt(0).toUpperCase() donnait "Reve" partout où
// il était utilisé (sélecteur, historique, stats...). Source unique ici,
// à utiliser partout au lieu de recapitaliser la clé brute.
export const INTENSITE_LABEL = { reve: "Rêve", paradoxe: "Paradoxe", cauchemar: "Cauchemar" }
// Couleur par intensité (refonte visuelle, chantier 1 passe 1c) : violet
// Paradoxe, bleu Rêve, orange Cauchemar — tokens.css (--df-reve/--df-paradoxe/
// --df-cauchemar), jamais de hex recopié en dur ici.
export const INTENSITE_COULEUR = { reve: "var(--df-reve)", paradoxe: "var(--df-paradoxe)", cauchemar: "var(--df-cauchemar)" }
export const NOMS_PALIERS_ROMAINS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" }
export const ORDRE_CATEGORIES = ["legende", "legende_animale", "cosmetique", "rune_astrale"]
export const CATEGORIE_LABELS = {
  legende: "Légendes",
  legende_animale: "Légendes animales",
  cosmetique: "Cosmétiques",
  rune_astrale: "Rune astrale",
}

// Pastille d'intensité (refonte historique) : remplace l'ancien simple
// point de couleur. Couleur pleine sur texte + bordure, bordure ramenée à
// 40% d'opacité via color-mix() plutôt qu'un hex recopié — INTENSITE_COULEUR
// reste la seule source de vérité des couleurs (voir sa note plus haut).
export function PastilleIntensite({ s }) {
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
export function PointSeparateur() {
  return <span style={{ color: "#2b4148" }}> · </span>
}

// Ligne du bas d'une run (team, date, vague, bribes) — lecture seule,
// partagée entre la liste d'historique et le rappel de la modale de
// suppression (même contenu dans les deux, voir consigne "même style que la
// ligne d'historique"). Le lien "Corriger"/"Renseigner" n'en fait PAS partie
// : il est propre à la ligne interactive, ajouté par l'appelant à côté.
export function InfosBasSonge({ s }) {
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
export function styleConteneurSonge(s) {
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

// Une ligne de drop dans le bloc "s'est passé pendant ce songe". onClick et
// onSupprimer sont optionnels : omis (undefined) -> rendu passif, utilisé
// par le rappel de la modale de suppression (pas d'action possible là).
export function LigneDropSonge({ d, onClick, onSupprimer, confirmerActif }) {
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

export const sp = {
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

// Ligne d'un songe dans une liste (Historique de L'Oeil, page /historique) —
// affichage + edition inline de la vague finale + suppression (songe entier
// ou un drop individuel). Etat d'edition/confirmation LOCAL a chaque ligne
// (avant cette extraction, un seul etat partage au niveau de la liste
// empechait deux lignes d'etre en edition en meme temps — micro-difference
// assumee, sans impact sur l'usage normal : editer une ligne a la fois).
// onSupprimer(s) : le parent decide quoi faire (ouvrir la modale de
// confirmation) — cette ligne ne supprime jamais directement le songe.
export function LigneSonge({ s, onSupprimer, onCorrigerVagueFinale, onSupprimerDrop, onSelectObjet }) {
  const [enEditionVague, setEnEditionVague] = useState(false)
  const [valeurVague, setValeurVague] = useState(s.vague_finale || 1)
  const [confirmerDropId, setConfirmerDropId] = useState(null)

  const clicSupprimerDrop = (id) => {
    if (confirmerDropId === id) { onSupprimerDrop(id); setConfirmerDropId(null) }
    else setConfirmerDropId(id)
  }

  return (
    <div style={{ ...styleConteneurSonge(s), marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <PastilleIntensite s={s} />
          <span style={{ color: "#e8f4f6", fontSize: 15, fontWeight: 500 }}>
            Run #{s.id}
            {!s.terminee && <span style={{ color: "#5f7d84", fontWeight: 400 }}> (interrompu, salle {s.salle_atteinte})</span>}
          </span>
        </div>
        <button onClick={() => onSupprimer(s)} className="df-lien-supprimer"
          style={{ fontSize: 12, cursor: "pointer", textDecoration: "underline", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>
          Supprimer
        </button>
      </div>
      <div style={{ fontSize: 12.5, marginTop: 6, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          {/* Rattrapage vague finale (chantier 1, passe 1b) : UNIQUEMENT ce
              champ est corrigeable depuis l'historique, rien d'autre. Le
              rafraichissement apres enregistrement est a la charge de
              l'appelant (voir onCorrigerVagueFinale, parametre par la page). */}
          {enEditionVague ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#8fa8ad" }}>{s.team_nom || "—"}</span>
              <PointSeparateur />
              Vague finale :
              <input type="number" min={1} value={valeurVague}
                onChange={e => setValeurVague(e.target.value)}
                style={{ width: 48, ...sp.champ, padding: "2px 6px", fontSize: 11.5 }} />
              <button onClick={() => { onCorrigerVagueFinale(s.id, Number(valeurVague)); setEnEditionVague(false) }}
                style={{ color: "var(--df-cyan-2)", fontSize: 12, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}>Enregistrer</button>
              <button onClick={() => setEnEditionVague(false)}
                style={{ color: "#4a6b72", fontSize: 12, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}>Annuler</button>
            </span>
          ) : (
            <InfosBasSonge s={s} />
          )}
        </div>
        {!enEditionVague && (
          <button onClick={() => { setValeurVague(s.vague_finale || 1); setEnEditionVague(true) }} className="df-lien-corriger"
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
  )
}

// Modale de confirmation avant suppression d'un songe (refonte historique) :
// remplace l'ancienne confirmation en 2 clics inline sur le bouton
// "Supprimer" (moins visible, pas de rappel de ce qui allait être perdu).
// songe = le songe concerné ; le parent ne monte ce composant que lorsqu'une
// suppression est en attente (jamais rendu avec songe=null).
export function ModaleSuppressionSonge({ songe, onAnnuler, onConfirmer }) {
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

        {/* Rappel du songe concerné, même style que la liste (voir
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

// Actions API songe/drop — UNE seule implementation, parametree par le
// callback de rafraichissement a executer apres coup (chaque page sait ce
// qu'elle doit recharger : SongesPage rafraichit stats+historique+eventuel
// dernierRunId, HistoriquePage recharge juste sa page filtree courante).
// Correction du 14 aout 2026 (retour Popo) : plus jamais dupliquees entre
// SongesPage.jsx et HistoriquePage.jsx.
export function supprimerSongeApi(token, id, onRafraichi) {
  return fetch(`${API}/songes/runs/${id}`, { method: "DELETE", headers: authHeaders(token) }).then(onRafraichi)
}

export function corrigerVagueFinaleApi(token, runId, valeur, onRafraichi) {
  return fetch(`${API}/songes/runs/${runId}/vague-finale`, {
    method: "PUT", headers: authHeaders(token, true), body: JSON.stringify({ vague_finale: valeur }),
  }).then(onRafraichi)
}

export function supprimerDropApi(token, dropId, onRafraichi) {
  return fetch(`${API}/songes/drops/${dropId}`, { method: "DELETE", headers: authHeaders(token) }).then(onRafraichi)
}
