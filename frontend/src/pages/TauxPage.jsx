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
//
// Colonne "1 tous les X songes" (31 juillet 2026) : calculée entièrement
// côté client à partir du taux déjà reçu + config.combats_par_palier
// (/songes/config) — pas d'aller-retour serveur au changement du sélecteur
// de personnages, qui ne modifie jamais les taux affichés, seulement cette
// colonne. Formule et repères de contrôle donnés par Popo, voir
// calculerSonges ci-dessous.
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const CATEGORIE_LABELS = {
  legende: "Légendes",
  legende_animale: "Légendes animales",
  cosmetique: "Cosmétiques",
  rune_astrale: "Runes",
}
const ORDRE_CATEGORIES = ["legende", "legende_animale", "cosmetique", "rune_astrale"]
const NOMS_PALIERS_ROMAINS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" }
const LIEN_DISCORD = "https://discord.gg/PLACEHOLDER" // à remplacer par Popo

const formaterTaux = (v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const capitaliser = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// SONGES.md / consigne Popo (31 juillet 2026) :
//   q = 1 ; pour chaque palier p où l'item a un taux t (t != null) :
//     tirages = combatsParPalier[p] * nbPersonnages * multiplicateur
//     q *= (1 - t) ** tirages
//   probaParSonge = 1 - q ; songes = 1 / probaParSonge
// Repères de contrôle vérifiés avant publication (multiplicateur=1 pour un
// item seul, =26/=4 pour les lignes agrégées Légendes/Légendes animales) :
// Légende d'Amayiro (4 perso, Paradoxe I) → ~350 ; agrégat Légendes (26)
// → ~13,5 ; agrégat Légendes animales (4) → ~38.
function calculerSonges(tauxParPalier, combatsParPalier, nbPersonnages, multiplicateur = 1) {
  let q = 1
  let auMoinsUnTaux = false
  for (const [palier, t] of Object.entries(tauxParPalier)) {
    if (t == null) continue
    auMoinsUnTaux = true
    const combats = combatsParPalier[palier] ?? combatsParPalier[Number(palier)]
    const tirages = combats * nbPersonnages * multiplicateur
    const proba = t / 100
    q *= Math.pow(1 - proba, tirages)
  }
  if (!auMoinsUnTaux) return null
  const probaParSonge = 1 - q
  if (probaParSonge <= 0) return null
  return 1 / probaParSonge
}

// "Arrondi lisible" (consigne explicite : jamais "349.8271") — un chiffre
// après la virgule sous 20 (utile pour distinguer 13,5 de 14), entier
// au-dessus (la précision décimale n'a plus de sens à cette échelle).
function formaterSonges(v) {
  if (v == null) return "—"
  const arrondi = v < 20 ? Math.round(v * 10) / 10 : Math.round(v)
  return `~${arrondi.toLocaleString("fr-FR")} songes`
}

const tp = {
  page: { padding: "1.5rem 1.25rem 3rem", maxWidth: 900, margin: "0 auto" },
  backBtn: { background: "transparent", border: "1px solid var(--df-border-cyan)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--df-cyan)", cursor: "pointer", marginBottom: 18 },
  select: { background: "rgba(var(--df-card-bg), 0.95)", color: "var(--df-text)", border: "1px solid rgba(var(--df-gold-rgb), 0.4)", borderRadius: 999, padding: "8px 14px", fontSize: 13, cursor: "pointer", outline: "none" },
  pill: (actif) => ({ display: "inline-block", margin: "0 6px 6px 0", background: actif ? "rgba(var(--df-cyan-rgb), 0.18)" : "rgba(var(--df-cyan-rgb), 0.06)", color: actif ? "var(--df-cyan)" : "var(--df-text-2)", border: `1px solid ${actif ? "var(--df-cyan)" : "rgba(var(--df-cyan-rgb), 0.35)"}`, borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }),
  row: { display: "flex", alignItems: "center", gap: 16, flexWrap: "nowrap", padding: "10px 14px", background: "rgba(var(--df-card-bg), 0.9)", border: "1px solid rgba(var(--df-gold-rgb), 0.13)", borderRadius: 10, marginBottom: 8 },
  rowAgregat: { background: "rgba(var(--df-gold-rgb), 0.1)", border: "1px solid rgba(var(--df-gold-rgb), 0.4)" },
  pastille: { width: 10, height: 10, borderRadius: "50%", background: "rgba(var(--df-cyan-rgb), 0.4)", border: "1px solid rgba(var(--df-cyan-rgb), 0.7)", flexShrink: 0 },
  discordBtn: { display: "inline-block", background: "#5865F2", color: "#fff", fontWeight: 600, fontSize: 13, padding: "9px 18px", borderRadius: 8, textDecoration: "none" },
  mentions: { marginTop: 22, paddingTop: 16, borderTop: "1px solid rgba(var(--df-gold-rgb), 0.15)", color: "var(--df-text-3)", fontSize: 11.5, lineHeight: 1.6 },
}

function LigneTaux({ it, combatsParPalier, nbPersonnages, multiplicateur = 1, labelOverride, agregat, onSelectObjet }) {
  const clickable = !agregat && it.item_id != null
  const songes = calculerSonges(it.taux_par_palier, combatsParPalier, nbPersonnages, multiplicateur)
  return (
    <div style={{ ...tp.row, ...(agregat ? tp.rowAgregat : {}) }}>
      <span
        onClick={clickable ? () => onSelectObjet(it.item_id) : undefined}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: clickable ? "pointer" : "default", flex: "0 0 180px", minWidth: 180, maxWidth: 180, overflow: "hidden" }}
      >
        {it.img ? (
          <img src={it.img} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
        ) : (agregat || it.synthetique) ? (
          <span style={tp.pastille} />
        ) : null}
        <span style={{ fontSize: 13.5, fontWeight: agregat ? 700 : 400, color: "var(--df-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {labelOverride || it.nom}
        </span>
      </span>
      {/* Défilement horizontal des colonnes (paliers + songes) plutôt que
          tassement sur petit écran, demande explicite : la carte objet reste
          fixe (largeur figée ci-dessus), seule cette zone numérique scrolle. */}
      <div style={{ display: "flex", gap: 14, marginLeft: "auto", alignItems: "center", overflowX: "auto", flexWrap: "nowrap", minWidth: 0 }}>
        {it.paliers_eligibles.map(p => {
          const v = it.taux_par_palier[String(p)]
          return (
            <div key={p} style={{ textAlign: "center", minWidth: 46, flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: "var(--df-text-3)" }}>{NOMS_PALIERS_ROMAINS[p]}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: v != null ? "var(--df-cyan)" : "var(--df-text-3)" }}>
                {v != null ? `${formaterTaux(v)} %` : "—"}
              </div>
            </div>
          )
        })}
        <div style={{ textAlign: "center", minWidth: 96, flexShrink: 0, borderLeft: "1px solid rgba(var(--df-gold-rgb), 0.2)", paddingLeft: 14 }}>
          <div style={{ fontSize: 10, color: "var(--df-text-3)" }}>1 tous les</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--df-gold)" }}>{formaterSonges(songes)}</div>
        </div>
      </div>
    </div>
  )
}

export default function TauxPage({ onBack, onSelectObjet }) {
  const [config, setConfig] = useState(null)
  const [intensiteNiveau, setIntensiteNiveau] = useState(null)
  const [categorieFiltre, setCategorieFiltre] = useState(null)
  const [nbPersonnages, setNbPersonnages] = useState(4)
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
  const legendeProfil = tousLesItems.find(it => it.categorie === "legende")
  const legendeAnimaleProfil = tousLesItems.find(it => it.categorie === "legende_animale")

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

      <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div>
          <span onClick={() => setCategorieFiltre(null)} style={tp.pill(categorieFiltre === null)}>Toutes</span>
          {ORDRE_CATEGORIES.map(c => (
            <span key={c} onClick={() => setCategorieFiltre(c)} style={tp.pill(categorieFiltre === c)}>{CATEGORIE_LABELS[c]}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11.5, color: "var(--df-text-3)", marginRight: 4 }}>Personnages</span>
          {[1, 2, 3, 4].map(n => (
            <span key={n} onClick={() => setNbPersonnages(n)} style={tp.pill(nbPersonnages === n)}>{n}</span>
          ))}
        </div>
      </div>

      {chargement ? (
        <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Chargement...</div>
      ) : !auMoinsUnTaux ? (
        <div style={{ ...tp.row, flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "28px 16px" }}>
          <div style={{ color: "var(--df-text-2)", fontSize: 13.5, lineHeight: 1.6 }}>
            Ces taux n'ont pas encore été relevés.<br />
            Tu joues en {capitaliser(intensiteNiveau.intensite)} {NOMS_PALIERS_ROMAINS[intensiteNiveau.niveau]} ? Aide-nous à compléter le tableau.
          </div>
          <a href={LIEN_DISCORD} target="_blank" rel="noopener noreferrer" style={tp.discordBtn}>Rejoindre le Discord</a>
        </div>
      ) : items.length === 0 ? (
        <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Aucun item dans cette catégorie à cette intensité.</div>
      ) : (
        <>
          {categorieFiltre === "legende" && legendeProfil && (
            <LigneTaux
              it={legendeProfil} combatsParPalier={config.combats_par_palier} nbPersonnages={nbPersonnages}
              multiplicateur={26} labelOverride="N'importe quelle légende (26)" agregat
              onSelectObjet={onSelectObjet}
            />
          )}
          {categorieFiltre === "legende_animale" && legendeAnimaleProfil && (
            <LigneTaux
              it={legendeAnimaleProfil} combatsParPalier={config.combats_par_palier} nbPersonnages={nbPersonnages}
              multiplicateur={4} labelOverride="N'importe quelle légende animale (4)" agregat
              onSelectObjet={onSelectObjet}
            />
          )}
          {items.map(it => (
            <LigneTaux
              key={it.item_id ?? it.nom} it={it} combatsParPalier={config.combats_par_palier}
              nbPersonnages={nbPersonnages} onSelectObjet={onSelectObjet}
            />
          ))}
        </>
      )}

      <div style={tp.mentions}>
        <p style={{ margin: "0 0 6px" }}>Taux relevés en jeu, à la main. Ils ne viennent d'aucune API et ne sont publiés nulle part ailleurs.</p>
        <p style={{ margin: 0 }}>Le nombre de songes est une moyenne statistique, pas une garantie. Certains dropperont au troisième songe, d'autres au cinquantième.</p>
      </div>
    </div>
  )
}
