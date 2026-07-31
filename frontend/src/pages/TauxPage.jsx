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
// Regroupement par catégorie, replié par défaut (2 août 2026) : 26 lignes de
// légendes strictement identiques jugées trop répétitives. Une ligne par
// catégorie (Légendes/Légendes animales/Cosmétiques/Runes), dépliable pour
// voir le détail item par item. Légendes/Légendes animales ont un taux
// UNIFORME (tous les items de la catégorie partagent le même profil) : la
// ligne repliée affiche directement ces taux. Cosmétiques/Runes ont des taux
// VARIABLES d'un item à l'autre : "taux variables" sur la ligne repliée, le
// détail par item reste la seule source des vrais chiffres.
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

// Catégories à taux uniforme (tous les items partagent le même profil de
// taux par palier) — la ligne de catégorie peut alors afficher directement
// les pourcentages. Cosmétiques/Runes n'y sont pas : taux différents d'un
// item à l'autre (vérifié sur les données réelles), "taux variables" affiché
// à la place plutôt qu'un chiffre qui n'existerait pas vraiment.
const CATEGORIES_UNIFORMES = new Set(["legende", "legende_animale"])

// Préfixes redondants avec le nom de catégorie déjà affiché ("Légendes (26)"
// dit déjà "Légende") — retirés à l'affichage seulement, jamais dans les
// données ni dans les liens vers la fiche objet (qui utilisent it.item_id,
// pas le nom).
const PREFIXES_A_RETIRER = {
  legende: /^Légende (de |du |d')/,
  legende_animale: /^Légende animale de /,
}
const nomCourt = (categorie, nom) => {
  const regex = PREFIXES_A_RETIRER[categorie]
  return regex ? nom.replace(regex, "") : nom
}

const formaterTaux = (v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const capitaliser = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// SONGES.md / consigne Popo (31 juillet 2026, généralisée le 2 août pour
// s'appliquer à une liste d'items et pas un seul) :
//   q = 1 ; pour chaque item de la liste, pour chaque palier p où il a un
//   taux t (t != null) :
//     tirages = combatsParPalier[p] * nbPersonnages
//     q *= (1 - t) ** tirages
//   probaParSonge = 1 - q ; songes = 1 / probaParSonge
// Un seul item dans la liste = estimation precise pour cet item. Plusieurs
// items = "n'importe lequel de la liste" (drops supposes independants entre
// items, meme hypothese que l'ancien parametre "multiplicateur" qu'elle
// remplace — mathematiquement identique quand les items partagent le meme
// profil de taux, mais generalise aussi aux profils heterogenes comme les
// Cosmetiques).
function calculerSongesItems(items, combatsParPalier, nbPersonnages) {
  let q = 1
  let auMoinsUnTaux = false
  for (const it of items) {
    for (const [palier, t] of Object.entries(it.taux_par_palier)) {
      if (t == null) continue
      auMoinsUnTaux = true
      const combats = combatsParPalier[palier] ?? combatsParPalier[Number(palier)]
      const tirages = combats * nbPersonnages
      const proba = t / 100
      q *= Math.pow(1 - proba, tirages)
    }
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
  pastille: { width: 10, height: 10, borderRadius: "50%", background: "rgba(var(--df-cyan-rgb), 0.4)", border: "1px solid rgba(var(--df-cyan-rgb), 0.7)", flexShrink: 0 },
  discordBtn: { display: "inline-block", background: "#5865F2", color: "#fff", fontWeight: 600, fontSize: 13, padding: "9px 18px", borderRadius: 8, textDecoration: "none" },
  mentions: { marginTop: 22, paddingTop: 16, borderTop: "1px solid rgba(var(--df-gold-rgb), 0.15)", color: "var(--df-text-3)", fontSize: 11.5, lineHeight: 1.6 },
  sousLigne: { fontSize: 11.5, color: "var(--df-text-3)", fontStyle: "italic", padding: "0 14px 8px" },
  avertissement: { fontSize: 11.5, color: "#f0a840", padding: "0 14px 8px", lineHeight: 1.5 },
}

function LigneItem({ it, categorie, combatsParPalier, nbPersonnages, onSelectObjet }) {
  const clickable = it.item_id != null
  const songes = calculerSongesItems([it], combatsParPalier, nbPersonnages)
  return (
    <div style={tp.row}>
      <span
        onClick={clickable ? () => onSelectObjet(it.item_id) : undefined}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: clickable ? "pointer" : "default", flex: "0 0 200px", minWidth: 200, maxWidth: 200, overflow: "hidden" }}
      >
        {it.img ? (
          <img src={it.img} alt="" style={{ width: 24, height: 24, objectFit: "contain", flexShrink: 0 }} />
        ) : (
          <span style={tp.pastille} />
        )}
        <span style={{ fontSize: 13, color: "var(--df-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {nomCourt(categorie, it.nom)}
        </span>
      </span>
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

function LigneCategorie({ categorie, items, combatsParPalier, nbPersonnages, expanded, onToggle, onSelectObjet }) {
  const uniforme = CATEGORIES_UNIFORMES.has(categorie)
  const estCosmetique = categorie === "cosmetique"
  const estRune = categorie === "rune_astrale"
  const profil = uniforme ? items[0] : null
  const songesAgrege = estRune ? null : calculerSongesItems(items, combatsParPalier, nbPersonnages)
  const songesPrecis = uniforme ? calculerSongesItems([items[0]], combatsParPalier, nbPersonnages) : null
  const avertissementProspection = "⚠️ Ces taux varient selon la prospection du groupe. Les valeurs ci-dessous sont indicatives."

  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={onToggle} style={{ ...tp.row, cursor: "pointer" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 200px", minWidth: 200 }}>
          <span style={{ fontSize: 11, color: "var(--df-text-3)", width: 10, display: "inline-block" }}>{expanded ? "▾" : "▸"}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--df-text)" }}>
            {CATEGORIE_LABELS[categorie]} ({items.length})
          </span>
        </span>
        <div style={{ display: "flex", gap: 14, marginLeft: "auto", alignItems: "center", overflowX: "auto", flexWrap: "nowrap", minWidth: 0 }}>
          {uniforme ? (
            profil.paliers_eligibles.map(p => {
              const v = profil.taux_par_palier[String(p)]
              return (
                <div key={p} style={{ textAlign: "center", minWidth: 46, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "var(--df-text-3)" }}>{NOMS_PALIERS_ROMAINS[p]}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: v != null ? "var(--df-cyan)" : "var(--df-text-3)" }}>
                    {v != null ? `${formaterTaux(v)} %` : "—"}
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{ fontSize: 12, color: "var(--df-text-3)", fontStyle: "italic", padding: "0 8px", flexShrink: 0, whiteSpace: "nowrap" }}>
              taux variables
            </div>
          )}
          <div style={{ textAlign: "center", minWidth: 96, flexShrink: 0, borderLeft: "1px solid rgba(var(--df-gold-rgb), 0.2)", paddingLeft: 14 }}>
            <div style={{ fontSize: 10, color: "var(--df-text-3)" }}>1 tous les</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--df-gold)" }}>
              {estRune ? "—" : formaterSonges(songesAgrege)}
            </div>
          </div>
        </div>
      </div>

      {uniforme && (
        <div style={tp.sousLigne}>
          Si tu vises {categorie === "legende" ? "une légende précise" : "une animale précise"} : {formaterSonges(songesPrecis)}
        </div>
      )}
      {estCosmetique && <div style={tp.avertissement}>{avertissementProspection}</div>}

      {expanded && (
        <div style={{ marginTop: 6, marginBottom: 10, paddingLeft: 20 }}>
          {estCosmetique && <div style={{ ...tp.avertissement, padding: "0 14px 8px" }}>{avertissementProspection}</div>}
          {items.map(it => (
            <LigneItem
              key={it.item_id ?? it.nom} it={it} categorie={categorie}
              combatsParPalier={combatsParPalier} nbPersonnages={nbPersonnages} onSelectObjet={onSelectObjet}
            />
          ))}
        </div>
      )}
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
  const [expanded, setExpanded] = useState({})

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
  const auMoinsUnTaux = tousLesItems.some(it => Object.values(it.taux_par_palier).some(v => v != null))
  const groupes = ORDRE_CATEGORIES
    .map(categorie => ({ categorie, items: tousLesItems.filter(it => it.categorie === categorie) }))
    .filter(g => g.items.length > 0)
  const groupesAffiches = categorieFiltre ? groupes.filter(g => g.categorie === categorieFiltre) : groupes

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
      ) : groupesAffiches.length === 0 ? (
        <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Aucun item dans cette catégorie à cette intensité.</div>
      ) : (
        groupesAffiches.map(g => (
          <LigneCategorie
            key={g.categorie} categorie={g.categorie} items={g.items}
            combatsParPalier={config.combats_par_palier} nbPersonnages={nbPersonnages}
            expanded={!!expanded[g.categorie]}
            onToggle={() => setExpanded(e => ({ ...e, [g.categorie]: !e[g.categorie] }))}
            onSelectObjet={onSelectObjet}
          />
        ))
      )}

      <div style={tp.mentions}>
        <p style={{ margin: "0 0 6px" }}>Taux relevés en jeu, à la main. Ils ne viennent d'aucune API et ne sont publiés nulle part ailleurs.</p>
        <p style={{ margin: 0 }}>Le nombre de songes est une moyenne statistique, pas une garantie. Certains dropperont au troisième songe, d'autres au cinquantième.</p>
      </div>
    </div>
  )
}
