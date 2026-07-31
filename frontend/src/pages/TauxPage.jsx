import { useState, useEffect } from "react"

// Page "Les Taux" (1er août 2026) — construite en remplacement du lien mort
// de l'accueil qui pointait vers une bande d'intensités elle-même supprimée
// (voir AccueilPage.jsx). Fichier séparé volontairement, même logique que
// pages/SongesPage.jsx : n'importe rien d'App.jsx.
//
// Endpoint dédié /songes/taux (main.py) : renvoie les items PAR ITEM, pas
// groupés par cle_taux — vérifié sur les données réelles que des items
// partageant la même cle_taux (les 5 "Bouclirêve ...") ont des paliers
// éligibles différents chacun, un regroupement aurait affiché des paliers
// faux. Jamais d'extrapolation (règle 13/règle 4 §5 SONGES.md) : un palier
// sans taux relevé en base reste "—", jamais une estimation ni un 0 %.
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const CATEGORIE_LABELS = {
  legende: "Légendes",
  legende_animale: "Légendes animales",
  cosmetique: "Cosmétiques",
  rune_astrale: "Runes",
}
const ORDRE_CATEGORIES = ["legende", "legende_animale", "cosmetique", "rune_astrale"]
const NOMS_PALIERS_ROMAINS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" }

const formaterTaux = (v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const capitaliser = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const tp = {
  page: { padding: "1.5rem 1.25rem 3rem", maxWidth: 900, margin: "0 auto" },
  backBtn: { background: "transparent", border: "1px solid var(--df-border-cyan)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--df-cyan)", cursor: "pointer", marginBottom: 18 },
  select: { background: "rgba(var(--df-card-bg), 0.95)", color: "var(--df-text)", border: "1px solid rgba(var(--df-gold-rgb), 0.4)", borderRadius: 999, padding: "8px 14px", fontSize: 13, cursor: "pointer", outline: "none" },
  pill: (actif) => ({ display: "inline-block", margin: "0 6px 6px 0", background: actif ? "rgba(var(--df-cyan-rgb), 0.18)" : "rgba(var(--df-cyan-rgb), 0.06)", color: actif ? "var(--df-cyan)" : "var(--df-text-2)", border: `1px solid ${actif ? "var(--df-cyan)" : "rgba(var(--df-cyan-rgb), 0.35)"}`, borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }),
  row: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "10px 14px", background: "rgba(var(--df-card-bg), 0.9)", border: "1px solid rgba(var(--df-gold-rgb), 0.13)", borderRadius: 10, marginBottom: 8 },
}

export default function TauxPage({ onBack, onSelectObjet }) {
  const [config, setConfig] = useState(null)
  const [intensiteNiveau, setIntensiteNiveau] = useState(null)
  const [categorieFiltre, setCategorieFiltre] = useState(null)
  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    fetch(`${API}/songes/config`).then(r => r.json()).then(d => {
      setConfig(d)
      setIntensiteNiveau({ intensite: d.intensite_defaut.intensite, niveau: d.intensite_defaut.niveau })
    })
  }, [])

  useEffect(() => {
    if (!intensiteNiveau) return
    setChargement(true)
    fetch(`${API}/songes/taux?intensite=${intensiteNiveau.intensite}&niveau=${intensiteNiveau.niveau}`)
      .then(r => r.json()).then(d => { setDonnees(d); setChargement(false) })
  }, [intensiteNiveau])

  if (!config || !intensiteNiveau) {
    return <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--df-text-2)", fontSize: 14 }}>Chargement...</div>
  }

  const tousLesItems = donnees?.items || []
  const items = tousLesItems.filter(it => !categorieFiltre || it.categorie === categorieFiltre)
  const auMoinsUnTaux = tousLesItems.some(it => Object.values(it.taux_par_palier).some(v => v != null))

  return (
    <div style={tp.page}>
      <button onClick={onBack} style={tp.backBtn}>← Retour</button>
      <h1 className="df-section-title" style={{ fontSize: 20, margin: "0 0 4px" }}>Les Taux</h1>
      <p style={{ margin: "0 0 18px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--df-text-2)" }}>
        Relevés en jeu, jamais estimés
      </p>

      <div style={{ marginBottom: 14 }}>
        <select value={`${intensiteNiveau.intensite}_${intensiteNiveau.niveau}`}
          onChange={e => { const [intensite, niveau] = e.target.value.split("_"); setIntensiteNiveau({ intensite, niveau: Number(niveau) }) }}
          style={tp.select}>
          {Object.entries(config.intensites).map(([cle, info]) =>
            info.niveaux.map(n => (
              <option key={`${cle}_${n}`} value={`${cle}_${n}`}>
                {capitaliser(cle)} {NOMS_PALIERS_ROMAINS[n] || n}
              </option>
            ))
          )}
        </select>
      </div>

      <div style={{ marginBottom: 18 }}>
        <span onClick={() => setCategorieFiltre(null)} style={tp.pill(categorieFiltre === null)}>Toutes</span>
        {ORDRE_CATEGORIES.map(c => (
          <span key={c} onClick={() => setCategorieFiltre(c)} style={tp.pill(categorieFiltre === c)}>{CATEGORIE_LABELS[c]}</span>
        ))}
      </div>

      {chargement ? (
        <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Chargement...</div>
      ) : !auMoinsUnTaux ? (
        <div style={{ ...tp.row, justifyContent: "center", textAlign: "center", color: "var(--df-text-3)", padding: "24px 16px" }}>
          Pas encore de taux relevés en jeu pour {capitaliser(intensiteNiveau.intensite)} {NOMS_PALIERS_ROMAINS[intensiteNiveau.niveau]}.
        </div>
      ) : items.length === 0 ? (
        <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Aucun item dans cette catégorie à cette intensité.</div>
      ) : (
        items.map(it => (
          <div key={it.item_id} style={tp.row}>
            <span onClick={() => onSelectObjet(it.item_id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: "1 1 220px", minWidth: 0 }}>
              {it.img ? <img src={it.img} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} /> : null}
              <span style={{ fontSize: 13.5, color: "var(--df-text)" }}>{it.nom}</span>
            </span>
            <div style={{ display: "flex", gap: 14, marginLeft: "auto" }}>
              {it.paliers_eligibles.map(p => {
                const v = it.taux_par_palier[String(p)]
                return (
                  <div key={p} style={{ textAlign: "center", minWidth: 46 }}>
                    <div style={{ fontSize: 10, color: "var(--df-text-3)" }}>{NOMS_PALIERS_ROMAINS[p]}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: v != null ? "var(--df-cyan)" : "var(--df-text-3)" }}>
                      {v != null ? `${formaterTaux(v)} %` : "—"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
