import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

// Page "/comprendre" — "Comprendre les Songes" (chantier dédié, 15 août
// 2026 ; refonte à 11 sections mi-août ; réorganisation à 12 sections et
// habillage aligné sur "L'Œil de Draconiros", 16 août 2026). Contenu
// éditorial : toute la matière vient de la skill Ratrosk
// (.claude/skills/ratrosk/, seule source de faits autorisée — statuts
// ✅ affirmable / 📊 estimation / ⚠️ réserve explicite / ❌ interdit
// d'écriture). Aucun taux, multiplicateur, nombre de runs ou prix n'est
// écrit en dur ici : tout vient de GET /songes/config (et /songes/taux
// pour la section VI), même pattern que pages/TauxPage.jsx — y compris la
// formule calculerSongesItems, dupliquée intentionnellement plutôt
// qu'importée (convention du projet : chaque page est autonome, voir
// l'en-tête de TauxPage.jsx). Les constantes de mécanique de jeu qui
// n'alimentent aucun calcul et n'existent dans aucune API (niveaux du boss
// final, coûts en points de rêve...) restent en dur : la règle vise les
// valeurs déjà en base qui pourraient diverger (taux, multiplicateurs,
// nombres de runs, prix en bribes), précision Popo. Fichier séparé,
// App.jsx n'a pas eu besoin d'être touché : l'import et la route
// existaient déjà.
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NOMS_PALIERS_ROMAINS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" }

// Sorts de Songe (section XI) : pas encore scrapés (SKILL.md ratrosk
// n'a que des exemples partiels, pas une liste exhaustive fiable). Tant
// que ce tableau est vide, la section entière est masquée — même logique
// que "aGuide" pour le guide de boss des donjons (App.jsx,
// DonjonDetailPage) : pas de placeholder "bientôt disponible", rien. Le
// renvoi vers elle (fin de section IX) se masque avec elle.
const SORTS_DE_SONGE = []

// Formule identique a celle de TauxPage.jsx (SONGES.md / regle Popo,
// 31 juillet-2 aout 2026) : q = 1 ; pour chaque palier ou l'item a un
// taux connu, q *= (1-t)^(combats*personnages) ; nombre de runs moyen =
// 1 / (1-q). Un item a taux uniforme (legendes, legendes animales) donne
// une estimation precise pour CETTE variante precise.
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

function formaterSonges(v) {
  if (v == null) return "—"
  const arrondi = v < 20 ? Math.round(v * 10) / 10 : Math.round(v)
  return `~${arrondi.toLocaleString("fr-FR")} runs`
}

// Exemple travaillé de la section VI (4 personnages) : valeur illustrative
// d'un exemple pédagogique, pas un taux/prix/nombre de runs à synchroniser
// avec une source. Le lecteur qui veut ajuster son nombre de personnages
// est renvoyé vers /taux.
const NB_PERSONNAGES_EXEMPLE = 4

// Ordre de la réorganisation du 16 août 2026 : on suit la chronologie
// réelle d'une run — choisir l'intensité, puis descendre les paliers, puis
// affronter le boss — plutôt que l'ordre précédent. Le multiplicateur de
// dégâts sort de la section Bonus pour devenir sa propre section (VIII) :
// c'est le bonus le plus rentable, il mérite sa propre entrée de sommaire.
const SECTIONS = [
  { id: "cest-quoi-les-songes", numero: "I", titre: "C'est quoi les Songes ?" },
  { id: "les-intensites", numero: "II", titre: "Les intensités" },
  { id: "comment-se-deroule-une-run", numero: "III", titre: "Comment se déroule une run" },
  { id: "le-combat-final", numero: "IV", titre: "Le combat final" },
  { id: "ce-qui-peut-tomber", numero: "V", titre: "Ce qui peut tomber" },
  { id: "combien-de-runs", numero: "VI", titre: "Combien de runs pour une légende" },
  { id: "bribes-et-economie", numero: "VII", titre: "Les bribes et l'économie" },
  { id: "le-multiplicateur-de-degats", numero: "VIII", titre: "Le multiplicateur de dégâts" },
  { id: "les-bonus", numero: "IX", titre: "Les bonus" },
  { id: "quetes-et-succes", numero: "X", titre: "Quêtes et succès" },
  { id: "les-sorts-de-songe", numero: "XI", titre: "Les sorts de songe" },
  { id: "ce-qu-on-ne-sait-pas-encore", numero: "XII", titre: "Ce qu'on ne sait pas encore" },
]

const COULEURS = {
  cyan: { hex: "#2CE7FF", rgb: "44, 231, 255" },
  or: { hex: "#F0C040", rgb: "240, 192, 64" },
  violet: { hex: "#C478FF", rgb: "196, 120, 255" },
}

const cp = {
  page: { padding: "1.5rem 1.25rem 4rem", maxWidth: 1180, margin: "0 auto" },
  backBtn: { background: "transparent", border: "1px solid var(--df-border-cyan)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--df-cyan)", cursor: "pointer", marginBottom: 18 },
  intro: { margin: "0 auto 26px", fontSize: 14.5, fontWeight: 300, lineHeight: 1.6, color: "var(--df-text-2)", maxWidth: 480, textAlign: "center" },
  toggleBtn: { width: "100%", textAlign: "left", marginBottom: 10 },
  sommaireNav: { position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 2 },
  sommaireLien: { display: "block", padding: "7px 10px", borderRadius: 8, fontSize: 12.5, textDecoration: "none", color: "var(--df-text-2)", borderLeft: "2px solid transparent" },
  sommaireNumero: { opacity: 0.75, marginRight: 6, fontFamily: "var(--df-font-logo)", fontSize: 15, fontWeight: 700 },
  section: { scrollMarginTop: 20, marginBottom: 46 },
  sectionTitre: { display: "flex", alignItems: "baseline", gap: 10, margin: "0 0 14px", fontSize: 19 },
  numeroRomain: { fontFamily: "var(--df-font-logo)", fontSize: 30, fontWeight: 700, color: "var(--df-gold)", letterSpacing: "0.02em" },
  paragraphe: { fontSize: 14, lineHeight: 1.7, color: "var(--df-text)", margin: "0 0 14px" },
  liste: { fontSize: 14, lineHeight: 1.7, color: "var(--df-text)", margin: "0 0 14px", paddingLeft: 20 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 },
  th: { textAlign: "left", padding: "8px 10px", color: "var(--df-gold)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid rgba(240, 192, 64, 0.45)" },
  td: { padding: "8px 10px", borderBottom: "1px solid rgba(240, 192, 64, 0.1)", color: "var(--df-text)" },
  tdChiffre: { padding: "8px 10px", borderBottom: "1px solid rgba(240, 192, 64, 0.1)", color: "var(--df-gold)", fontWeight: 700, textAlign: "right" },
  caveat: { fontSize: 11.5, color: "var(--df-text-3)", fontStyle: "italic", margin: "0 0 14px" },
  image: { margin: "18px 0", borderRadius: 12, overflow: "hidden", border: "1px solid var(--df-border-gold)" },
  legendeImage: { fontSize: 11.5, color: "var(--df-text-3)", fontStyle: "italic", padding: "6px 10px" },
  chiffrePhareBloc: { textAlign: "center", margin: "18px 0", padding: "20px 16px", background: "rgba(44, 231, 255, 0.06)", border: "1px solid rgba(44, 231, 255, 0.3)", borderRadius: 14 },
  chiffrePhareLabel: { fontSize: 12, color: "var(--df-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 },
  chiffrePhare: { fontSize: "clamp(34px, 9vw, 52px)", fontWeight: 700, color: "#2CE7FF", textShadow: "0 0 14px rgba(44,231,255,0.5)", lineHeight: 1, marginBottom: 8 },
  sousTitre: { fontSize: 15, fontWeight: 700, color: "var(--df-gold)", margin: "26px 0 10px", scrollMarginTop: 20 },
  lienApercu: { background: "transparent", border: "none", padding: 0, color: "var(--df-cyan)", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" },
  overlayFond: { position: "fixed", inset: 0, background: "rgba(3, 12, 17, 0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", cursor: "pointer" },
  overlayImage: { maxWidth: "100%", maxHeight: "100%", borderRadius: 12, border: "1px solid var(--df-border-gold)", cursor: "default" },
}

function encadreStyle(couleur) {
  return { background: `rgba(${couleur.rgb}, 0.08)`, border: `1px solid rgba(${couleur.rgb}, 0.35)`, borderRadius: 12, padding: "14px 16px", margin: "16px 0" }
}
function encadreTitreStyle(couleur) {
  return { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: couleur.hex, marginBottom: 6 }
}
const encadreTexte = { fontSize: 13, lineHeight: 1.6, color: "var(--df-text-2)", margin: 0 }
const encadreLien = { display: "inline-block", marginTop: 10, background: "transparent", border: "none", padding: 0, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }

// Les trois encadrés réutilisables (demande explicite Popo, un composant
// chacun) : "À retenir" (cyan) le fait à emporter, "Réserve" (or) les
// faits ⚠️ de Ratrosk jamais présentés comme certains, "Calcule le tien"
// (violet) le renvoi vers l'outil.
function EncadreARetenir({ children }) {
  return (
    <div style={encadreStyle(COULEURS.cyan)}>
      <div style={encadreTitreStyle(COULEURS.cyan)}>À retenir</div>
      <p style={encadreTexte}>{children}</p>
    </div>
  )
}

function EncadreReserve({ children }) {
  return (
    <div style={encadreStyle(COULEURS.or)}>
      <div style={encadreTitreStyle(COULEURS.or)}>⚠️ Réserve</div>
      <p style={encadreTexte}>{children}</p>
    </div>
  )
}

function EncadreCalculeLeTien({ lien, enfant }) {
  const navigate = useNavigate()
  return (
    <div style={encadreStyle(COULEURS.violet)}>
      <div style={encadreTitreStyle(COULEURS.violet)}>Calcule le tien</div>
      <p style={encadreTexte}>{enfant}</p>
      <button onClick={() => navigate(lien)} style={{ ...encadreLien, color: COULEURS.violet.hex }}>Ouvrir →</button>
    </div>
  )
}

// Emplacement de capture d'écran (sections II, III, IV, IX) — src/alt
// obligatoires, légende optionnelle, chargement paresseux. Si le fichier
// est absent (pas encore fourni par Popo dans
// frontend/public/assets/comprendre/), l'emplacement ne s'affiche pas du
// tout : pas de cadre vide, pas de texte de remplacement. tailleReelle
// (18 août 2026) : pour les petits éléments d'interface (badges
// d'Aberration, infobulles) qui ne doivent pas être étirés en pleine
// largeur — image affichée à sa taille native, plafonnée par sécurité à
// 100% du conteneur sur mobile.
function EmplacementImage({ src, alt, legende, tailleReelle }) {
  const [enErreur, setEnErreur] = useState(false)
  if (enErreur) return null
  return (
    <figure style={{ ...cp.image, margin: "18px 0", display: tailleReelle ? "inline-block" : "block" }}>
      <img src={src} alt={alt} loading="lazy" onError={() => setEnErreur(true)}
        style={tailleReelle ? { maxWidth: "100%", display: "block" } : { width: "100%", display: "block" }} />
      {legende && <figcaption style={cp.legendeImage}>{legende}</figcaption>}
    </figure>
  )
}

// Aperçu d'image en overlay (clic pour agrandir, clic en dehors pour
// refermer) — un seul comportement de préchargement/dégradation partagé
// par deux habillages :
// - LienApercu : un lien autonome ("voir un exemple de palier").
// - MotCliquable : un mot du texte courant qui devient le déclencheur
//   (les 4 types de salles, section III). Tant que l'image n'existe pas
//   (précharge silencieuse), le mot reste du texte normal — pas de
//   soulignement, pas de couleur, pas de curseur, pas de clic. Même
//   logique que la section des sorts de songe : rien tant que la source
//   n'existe pas, jamais de lien mort ni de placeholder.
function useApercuDisponible(src) {
  const [disponible, setDisponible] = useState(false)
  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setDisponible(true)
    img.onerror = () => setDisponible(false)
    img.src = src
  }, [src])
  return disponible
}

function OverlayImage({ src, alt, ouvert, onFermer }) {
  if (!ouvert) return null
  return (
    <div style={cp.overlayFond} onClick={onFermer}>
      <img src={src} alt={alt} style={cp.overlayImage} onClick={e => e.stopPropagation()} />
    </div>
  )
}

function LienApercu({ src, alt, texte }) {
  const disponible = useApercuDisponible(src)
  const [ouvert, setOuvert] = useState(false)
  if (!disponible) return null
  return (
    <>
      <button onClick={() => setOuvert(true)} style={cp.lienApercu}>{texte}</button>
      <OverlayImage src={src} alt={alt} ouvert={ouvert} onFermer={() => setOuvert(false)} />
    </>
  )
}

function MotCliquable({ src, alt, children }) {
  const disponible = useApercuDisponible(src)
  const [ouvert, setOuvert] = useState(false)
  if (!disponible) return <>{children}</>
  return (
    <>
      <button onClick={() => setOuvert(true)} style={{ ...cp.lienApercu, fontSize: "inherit", fontWeight: "inherit" }}>{children}</button>
      <OverlayImage src={src} alt={alt} ouvert={ouvert} onFermer={() => setOuvert(false)} />
    </>
  )
}

// Colonne sommaire (sticky en desktop, repliable en haut sur mobile) +
// colonne de contenu — reprend .df-list-wrap/.df-filters-toggle/
// .df-filters-panel (tokens.css), déjà utilisées ailleurs sur le site
// pour exactement ce pattern (colonne de filtres desktop / volet
// repliable mobile), jamais retouchées ici.
// Survol cyan du sommaire (16 août 2026) : un :hover ne s'exprime pas en
// style inline — balise <style> locale au composant plutôt que toucher
// tokens.css ou un fichier CSS partagé. !important nécessaire pour battre
// la couleur inline de cp.sommaireLien (spécificité CSS : un !important en
// feuille de style l'emporte sur un style inline sans !important).
function StyleSommaireHover() {
  return (
    <style>{`
      .cp-sommaire-lien:hover, .cp-sommaire-lien:hover .cp-sommaire-numero {
        color: #2CE7FF !important;
      }
    `}</style>
  )
}

function MiseEnPageSommaire({ sections, ouvert, onToggle, onNaviguer, children }) {
  return (
    <div className="df-list-wrap">
      <StyleSommaireHover />
      <div>
        <button className="df-filters-toggle df-pill" onClick={onToggle} style={cp.toggleBtn}>
          Sommaire
        </button>
        <nav className={`df-filters-panel ${ouvert ? "df-filters-open" : ""}`} style={cp.sommaireNav}>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} className="cp-sommaire-lien" style={cp.sommaireLien}
              onClick={(e) => { e.preventDefault(); onNaviguer(s.id) }}>
              <span className="cp-sommaire-numero" style={cp.sommaireNumero}>{s.numero}.</span>{s.titre}
            </a>
          ))}
        </nav>
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function ComprendrePage({ onBack }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [config, setConfig] = useState(null)
  const [legendesParIntensite, setLegendesParIntensite] = useState(null)
  const [sommaireOuvert, setSommaireOuvert] = useState(false)

  useEffect(() => {
    fetch(`${API}/songes/config`).then(r => r.json()).then(setConfig)
  }, [])

  // Section VI : 7 intensités où les légendes sont éligibles (Paradoxe I à
  // Cauchemar III), dérivées de config.intensites — jamais un [1,2,3,4]
  // codé en dur. Un appel /songes/taux par intensité x niveau (même
  // endpoint que TauxPage.jsx). Deux lectures calculées par intensité :
  // "une précise" (calculerSongesItems sur UN item legende — toutes les
  // légendes du type partagent le même taux, fait ✅ Ratrosk butin.md) et
  // "n'importe laquelle" (calculerSongesItems sur TOUS les items legende
  // renvoyés par l'API — la fonction gère déjà nativement le cas "au
  // moins un de la liste", voir SONGES.md ; le nombre réel de légendes
  // vient donc de la longueur du tableau retourné, jamais un "26" codé en
  // dur).
  useEffect(() => {
    if (!config) return
    const combos = ["paradoxe", "cauchemar"].flatMap(cle =>
      config.intensites[cle].niveaux.map(niveau => ({ intensite: cle, niveau }))
    )
    Promise.all(
      combos.map(({ intensite, niveau }) =>
        fetch(`${API}/songes/taux?intensite=${intensite}&niveau=${niveau}`)
          .then(r => r.json())
          .then(d => {
            const legendes = d.items.filter(it => it.categorie === "legende")
            const runsUnePrecise = legendes.length > 0
              ? calculerSongesItems([legendes[0]], config.combats_par_palier, NB_PERSONNAGES_EXEMPLE)
              : null
            const runsNimporteLaquelle = legendes.length > 0
              ? calculerSongesItems(legendes, config.combats_par_palier, NB_PERSONNAGES_EXEMPLE)
              : null
            return { intensite, niveau, runsUnePrecise, runsNimporteLaquelle }
          })
      )
    ).then(setLegendesParIntensite)
  }, [config])

  // Ancre dans l'URL (/comprendre#combien-de-runs) : on re-tente le scroll
  // quand les tableaux finissent de charger, la hauteur de page ayant
  // changé entre-temps.
  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [location.hash, config, legendesParIntensite])

  const naviguerVersSection = (id) => {
    setSommaireOuvert(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    navigate(`#${id}`, { replace: true })
  }

  if (!config) {
    return (
      <div className="df-fond-nebuleuse" style={{ minHeight: "100vh" }}>
        <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--df-text-2)", fontSize: 14 }}>Chargement...</div>
      </div>
    )
  }

  const totalCombats = Object.values(config.combats_par_palier).reduce((a, b) => a + b, 0)
  const nbPaliers = Object.keys(config.paliers).length
  const sectionsVisibles = SECTIONS.filter(s => s.id !== "les-sorts-de-songe" || SORTS_DE_SONGE.length > 0)

  return (
    <div className="df-fond-nebuleuse" style={{ minHeight: "100vh" }}>
      <div style={cp.page}>
        <button onClick={onBack} style={cp.backBtn}>← Retour</button>
        {/* Habillage aligné sur le titre "L'Œil de Draconiros" (SongesPage.jsx)
            — mêmes taille/police/couleur en style inline. Sans la classe
            .df-songes-titre-eclat (retour Popo, 16 août 2026) : c'est elle
            qui pose les étoiles ::before/::after via pageSonges.css, jamais
            retouchée ici, juste pas réutilisée. Centré (retour Popo). */}
        <h1 style={{ fontFamily: "var(--df-font-logo)", fontWeight: 700, fontSize: "clamp(32px, 6vw, 52px)", color: "var(--df-text)", margin: "0 0 10px", lineHeight: 1.06, textAlign: "center", textShadow: "0 0 4px rgba(44,231,255,.85), 0 0 14px rgba(44,231,255,.55), 0 0 32px rgba(44,231,255,.32), 0 0 60px rgba(44,231,255,.16)" }}>
          Comprendre les Songes
        </h1>
        <p style={cp.intro}>
          Tout ce qu'il y a à savoir sur les Songes Infinis de Draconiros.
        </p>

        <MiseEnPageSommaire sections={sectionsVisibles} ouvert={sommaireOuvert}
          onToggle={() => setSommaireOuvert(o => !o)} onNaviguer={naviguerVersSection}>

          {/* I — C'est quoi les Songes ? */}
          <section id="cest-quoi-les-songes" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>I.</span>C'est quoi les Songes ?</h2>
            <p style={cp.paragraphe}>
              Le Puits des Songes Infinis est une fonctionnalité de jeu de Dofus 3. Tu y lances une
              run (un enchaînement de combats par étages) — seul ou jusqu'à 4 joueurs. Seul le chef de groupe peut lancer la run et les
              combats ; il choisit aussi l'intensité au lancement, parmi plusieurs niveaux de
              difficulté. Un joueur peut aussi rejoindre une run déjà commencée — inutile d'être
              présent au lancement (
              <a href="#comment-se-deroule-une-run" style={{ color: "var(--df-text-3)" }}
                onClick={(e) => { e.preventDefault(); naviguerVersSection("comment-se-deroule-une-run") }}>
                → section III
              </a>
              ).
            </p>
            <p style={cp.paragraphe}>
              Accessible depuis l'onglet Songes Infinis du menu (raccourci T), sans prérequis de
              quête. Plancher de niveau 50 ; le 199-200 reste fortement conseillé pour une
              expérience correcte.
            </p>
            <p style={cp.paragraphe}>
              Chaque run est une prise de risque : la mort y est définitive. Le butin exclusif aux
              Songes : Légendes, runes astrales, cosmétiques, reflets oniriques.
            </p>
            <EncadreARetenir>
              Un enchaînement de combats, niveaux 199-200 fortement conseillé. Jusqu'à 4 joueurs,
              avec mort définitive : un combat perdu met fin à la run.
            </EncadreARetenir>
          </section>

          {/* II — Les intensités */}
          <section id="les-intensites" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>II.</span>Les intensités</h2>
            <p style={cp.paragraphe}>
              Dix intensités existent, réparties en 3 catégories : Rêve, Paradoxe, Cauchemar. Chaque
              intensité applique un multiplicateur, identique pour le butin et l'expérience.
            </p>
            <ul style={cp.liste}>
              <li><strong style={{ color: "var(--df-reve)" }}>Rêve</strong> — mode découverte : malus, ni légendes ni runes, filet de sécurité</li>
              <li><strong style={{ color: "var(--df-paradoxe)" }}>Paradoxe</strong> — mode normal et mode de farm : tout dropable dès Paradoxe I</li>
              <li><strong style={{ color: "var(--df-cauchemar)" }}>Cauchemar</strong> — joueurs expérimentés : meilleurs taux, mais conçu pour le challenge, pas la rentabilité</li>
            </ul>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Catégorie</th><th style={cp.th}>Niveau</th><th style={{ ...cp.th, textAlign: "right" }}>Multiplicateur de drop et d'expérience</th></tr></thead>
              <tbody>
                {Object.entries(config.intensites).map(([cle, info]) =>
                  info.niveaux.map(n => (
                    <tr key={`${cle}_${n}`}>
                      <td style={cp.td}>{config.intensites[cle].libelle}</td>
                      <td style={cp.td}>{NOMS_PALIERS_ROMAINS[n] || n}</td>
                      <td style={cp.tdChiffre}>{info.bonus[n]} %</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p style={cp.paragraphe}>
              En Rêve, aucune légende, légende animale ni rune astrale ne peut tomber — seuls les
              reflets oniriques et les cosmétiques sont accessibles. À partir de Paradoxe I, tout
              devient accessible ; monter encore l'intensité n'a plus qu'un effet : augmenter les
              taux, pas débloquer de nouvelles familles d'objets.
            </p>
            <p style={cp.paragraphe}>Ressources de départ, par catégorie :</p>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Catégorie</th><th style={{ ...cp.th, textAlign: "right" }}>Points de rêve</th><th style={{ ...cp.th, textAlign: "right" }}>Sable de Draconiros</th><th style={{ ...cp.th, textAlign: "right" }}>Tempête astrale</th></tr></thead>
              <tbody>
                <tr><td style={cp.td}>Rêve</td><td style={cp.tdChiffre}>10</td><td style={cp.tdChiffre}>1</td><td style={cp.tdChiffre}>1</td></tr>
                <tr><td style={cp.td}>Paradoxe</td><td style={cp.tdChiffre}>5</td><td style={cp.tdChiffre}>—</td><td style={cp.tdChiffre}>1</td></tr>
                <tr><td style={cp.td}>Cauchemar</td><td style={cp.tdChiffre}>—</td><td style={cp.tdChiffre}>—</td><td style={cp.tdChiffre}>1</td></tr>
              </tbody>
            </table>
            <p style={cp.paragraphe}>
              Le Sable permet de retenter un combat perdu sans finir la run ; la Tempête change un
              groupe de monstres jugé trop difficile, ou renouvelle une Fontaine ou une Faveur.
            </p>
            <EmplacementImage src="/assets/comprendre/selection-intensites.webp" alt="Écran de sélection de l'intensité dans les Songes Infinis" />
            <EncadreARetenir>
              Le multiplicateur grimpe avec l'intensité, mais en Rêve, ni légendes ni runes astrales
              ne tombent — il faut au moins Paradoxe I pour tout débloquer.
            </EncadreARetenir>
          </section>

          {/* III — Comment se déroule une run */}
          <section id="comment-se-deroule-une-run" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>III.</span>Comment se déroule une run</h2>

            <h3 id="la-structure" style={cp.sousTitre}>La structure</h3>
            <p style={cp.paragraphe}>
              Une run compte {config.nb_salles_par_run} salles réparties en {nbPaliers} paliers, chacun
              plus difficile que le précédent :
            </p>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Palier</th><th style={cp.th}>Nom</th><th style={cp.th}>Salles</th><th style={cp.th}>Combats</th></tr></thead>
              <tbody>
                {Object.entries(config.paliers).map(([n, p]) => (
                  <tr key={n}>
                    <td style={cp.td}>{NOMS_PALIERS_ROMAINS[n] || n}</td>
                    <td style={cp.td}>{p.nom}</td>
                    <td style={cp.td}>{p.salles[0]} → {p.salles[1]}</td>
                    <td style={cp.td}>{config.combats_par_palier[n]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={cp.paragraphe}>
              Sur ces {config.nb_salles_par_run} salles, jusqu'à {totalCombats} peuvent être des
              combats — les Fontaines Oniriques occupent les salles 4, 10, 16 et 25 (détail en
              section{" "}
              <a href="#les-bonus" style={{ color: "var(--df-cyan)" }}
                onClick={(e) => { e.preventDefault(); naviguerVersSection("les-bonus") }}>IX</a>),
              et chaque Faveur croisée en remplace un.
            </p>

            <h3 id="les-salles" style={cp.sousTitre}>Les salles</h3>
            <ul style={cp.liste}>
              <li><strong><MotCliquable src="/assets/comprendre/salle-combat.webp" alt="Groupe de monstres dans une salle de Songe">Combat</MotCliquable></strong> — un groupe de monstres</li>
              <li><strong><MotCliquable src="/assets/comprendre/fontaine-onirique.webp" alt="Salle Fontaine Onirique">Fontaine Onirique</MotCliquable></strong> — marchand de bonus (salles 4, 10, 16, 25)</li>
              <li><strong><MotCliquable src="/assets/comprendre/faveur-onirique.webp" alt="Le Dispensateur de faveurs dans une salle Faveur Onirique">Faveur Onirique</MotCliquable></strong> — un bonus gratuit, et un combat évité</li>
              <li><strong><MotCliquable src="/assets/comprendre/type-fin-du-reve.webp" alt="Salle Fin du rêve, le combat final">Fin du rêve</MotCliquable></strong> — le combat final, toujours en salle {config.nb_salles_par_run}</li>
            </ul>
            <p style={cp.paragraphe}>
              Au début de chaque palier, tu vois tous les chemins possibles : de quoi choisir son
              trajet selon les bonus proposés et maximiser ses points de rêve ({" "}
              <LienApercu src="/assets/comprendre/carte-palier.webp" alt="Carte du Songe au palier III en Paradoxe I" texte="voir un exemple de palier" />
              ). Une fois entré dans une salle, aucun retour en arrière n'est possible.
            </p>
            <p style={cp.paragraphe}>
              Chaque salle a un niveau de difficulté variable, visible avant d'y entrer — une salle
              difficile donne un bonus de taux de drop supplémentaire, propre à cette salle, et
              rapporte aussi des points de rêve en plus.
            </p>
            <p style={cp.paragraphe}>
              Les salles contiennent des monstres classiques, des boss de donjon ou des avis de
              recherche (24 accessibles en Songe). Certains subissent de légères adaptations pour
              être jouables en Songe, signalées en combat sous le nom d'"<strong style={{ color: "var(--df-violet)" }}>Aberration</strong>" — ces
              monstres portent une pastille violette "EN SONGE" dans la{" "}
              <button onClick={() => navigate("/bibliotheque")} style={cp.lienApercu}>Bibliothèque</button>.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 14 }}>
              <EmplacementImage tailleReelle src="/assets/comprendre/aberration-osavora.webp" alt="Badge Aberration d'Osavora en combat" />
              <EmplacementImage tailleReelle src="/assets/comprendre/aberration-avis-recherche.webp" alt="Badge Aberration des avis de recherche en combat" />
            </div>

            <h3 id="se-preparer" style={cp.sousTitre}>Se préparer</h3>
            <p style={cp.paragraphe}>
              Face à la mort définitive, plusieurs filets de sécurité rendent la run gérable : le
              bestiaire de la salle (Alt+B), consultable avant de lancer le combat, affiche les
              stats des monstres, la carte et l'ordre de jeu ; 3 minutes de préparation et des
              tours de 90 secondes pour construire sa stratégie ; un soin intégral à la fin de
              chaque salle ; et aucun challenge imposé dans les combats.
            </p>
            <EmplacementImage src="/assets/comprendre/bestiaire-salle.webp" alt="Bestiaire de la salle du Songe (Alt+B) avec les statistiques des monstres" />
            <EncadreARetenir>
              Tu ne choisis jamais à l'aveugle — chemin, difficulté, adversaires : tout est visible
              avant d'agir. Mais chaque salle est un engagement définitif, sans retour en arrière.
            </EncadreARetenir>
          </section>

          {/* IV — Le combat final */}
          <section id="le-combat-final" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>IV.</span>Le combat final</h2>
            <p style={cp.paragraphe}>
              La dernière salle, "Fin du rêve", est un combat à vagues aléatoires. Chaque vague suit
              le même algorithme qu'une salle classique : monstres, boss ou avis de recherche.
            </p>
            <p style={cp.paragraphe}>Ce qui change par rapport à un combat normal :</p>
            <ul style={cp.liste}>
              <li>Pas de soin entre les vagues — l'érosion est conservée</li>
              <li>Boosts, invocations, pièges et portails persistent sur le terrain</li>
              <li>Pas de délai : la vague suivante apparaît dès la précédente éliminée</li>
              <li>Les mécaniques de la vague précédente disparaissent</li>
              <li>Les nouveaux arrivants ne sont pas invulnérables — focus possible avant qu'ils jouent</li>
              <li>Un sort "une fois par combat" ne se recharge pas entre les vagues</li>
            </ul>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Catégorie</th><th style={{ ...cp.th, textAlign: "right" }}>Niveau de base</th><th style={{ ...cp.th, textAlign: "right" }}>Par vague</th></tr></thead>
              <tbody>
                <tr><td style={cp.td}>Rêve</td><td style={cp.tdChiffre}>250</td><td style={cp.tdChiffre}>+5</td></tr>
                <tr><td style={cp.td}>Paradoxe</td><td style={cp.tdChiffre}>275</td><td style={cp.tdChiffre}>+10</td></tr>
                <tr><td style={cp.td}>Cauchemar</td><td style={cp.tdChiffre}>300</td><td style={cp.tdChiffre}>+15</td></tr>
              </tbody>
            </table>
            <p style={cp.paragraphe}>
              Vagues à valider pour terminer la run : {config.vagues_requises.reve} en Rêve,{" "}
              {config.vagues_requises.paradoxe} en Paradoxe, {config.vagues_requises.cauchemar} en
              Cauchemar. Plafonds : {config.vagues_max.reve} en Rêve, {config.vagues_max.paradoxe}{" "}
              en Paradoxe, {config.vagues_max.cauchemar ?? "illimité"} en Cauchemar. 50 tours
              maximum pour les enchaîner.
            </p>
            <EmplacementImage src="/assets/comprendre/combat-final.webp" alt="Interface du combat final : vagues, tours et bribes" />
            <EncadreARetenir>
              Le combat final compte pour un seul combat dans les occasions de drop, quel que soit
              le nombre de vagues enchaînées. Les vagues vaincues déterminent tes bribes — détail
              en section VII, pas tes chances de légende.
            </EncadreARetenir>
          </section>

          {/* V — Ce qui peut tomber */}
          <section id="ce-qui-peut-tomber" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>V.</span>Ce qui peut tomber</h2>
            <p style={cp.paragraphe}>
              Deux conditions indépendantes doivent être remplies pour qu'un objet tombe. L'intensité
              décide quelles familles d'objets sont accessibles : en Rêve, reflets et cosmétiques
              seulement ; à partir de Paradoxe I, tout. Et quelle que soit l'intensité, il faut
              atteindre le palier III minimum pour débloquer le drop des légendes.
            </p>
            <p style={cp.paragraphe}>
              Conséquence contre-intuitive : une run en Cauchemar III mais au palier II ne peut
              toujours pas faire tomber de légende. L'intensité maximale ne remplace pas le palier.
            </p>
            <table style={cp.table}>
              <thead>
                <tr>
                  <th style={cp.th}>Palier</th>
                  <th style={cp.th}>Bouclirêve</th>
                  <th style={cp.th}>Runes astrales</th>
                  <th style={cp.th}>Légendes</th>
                  <th style={cp.th}>Diplôme de Feur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...cp.td, fontWeight: 700 }}>I</td>
                  <td style={cp.td}>Onirique</td>
                  <td style={cp.td}>Mineure · Moyenne</td>
                  <td style={{ ...cp.td, color: "var(--df-text-3)" }}>—</td>
                  <td style={{ ...cp.td, color: "var(--df-text-3)" }}>—</td>
                </tr>
                <tr>
                  <td style={{ ...cp.td, fontWeight: 700 }}>II</td>
                  <td style={cp.td}>Fantastique</td>
                  <td style={cp.td}>Mineure · Moyenne</td>
                  <td style={{ ...cp.td, color: "var(--df-text-3)" }}>—</td>
                  <td style={{ ...cp.td, color: "var(--df-text-3)" }}>—</td>
                </tr>
                <tr>
                  <td style={{ ...cp.td, fontWeight: 700 }}>III</td>
                  <td style={cp.td}>Imaginaire</td>
                  <td style={cp.td}>Majeure · Épatante</td>
                  <td style={{ ...cp.td, color: "var(--df-cyan)" }}>✓</td>
                  <td style={{ ...cp.td, color: "var(--df-cyan)" }}>✓</td>
                </tr>
                <tr>
                  <td style={{ ...cp.td, fontWeight: 700 }}>IV</td>
                  <td style={cp.td}>Brumeux</td>
                  <td style={cp.td}>Majeure · Épatante · Merveilleuse · Légendaire</td>
                  <td style={{ ...cp.td, color: "var(--df-cyan)" }}>✓</td>
                  <td style={{ ...cp.td, color: "var(--df-cyan)" }}>✓</td>
                </tr>
                <tr>
                  <td style={{ ...cp.td, fontWeight: 700 }}>V</td>
                  <td style={cp.td}>Infini</td>
                  <td style={cp.td}>Merveilleuse · Légendaire</td>
                  <td style={{ ...cp.td, color: "var(--df-cyan)" }}>✓</td>
                  <td style={{ ...cp.td, color: "var(--df-cyan)" }}>✓</td>
                </tr>
              </tbody>
            </table>
            <p style={cp.caveat}>
              La colonne Légendes couvre les légendes classiques et les légendes animales — mêmes
              conditions pour les deux.
            </p>
            <p style={cp.paragraphe}>
              Les reflets oniriques tombent à chaque combat, quel que soit le palier. Le Bouclirêve
              Étoile est le seul cosmétique sans restriction de palier : il peut tomber sur
              n'importe quel combat de la run.
            </p>
            <p style={cp.paragraphe}>
              <strong>Prospection</strong> : elle ne joue que sur les cosmétiques et les objets de quête, et
              individuellement par personnage — jamais sur les reflets, les runes ou les légendes.
            </p>
            <p style={cp.paragraphe}>
              Le palier augmente aussi <strong>directement</strong> le taux des runes astrales.
              Pour les autres familles, il n'agit qu'<strong>indirectement</strong>, via la
              difficulté croissante des salles.
            </p>
            <EncadreARetenir>
              À partir du palier III en Paradoxe I, tout devient dropable. Les deux conditions
              doivent être réunies : monter l'intensité sans atteindre le palier III ne sert à rien.
            </EncadreARetenir>
          </section>

          {/* VI — Combien de runs pour une légende (section principale) */}
          <section id="combien-de-runs" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>VI.</span>Combien de runs pour une légende</h2>
            <p style={cp.paragraphe}>
              Les légendes classiques ne tombent qu'à partir du palier III, et seulement en
              Paradoxe ou Cauchemar. Chaque légende tire indépendamment des autres — le tableau des
              butins en jeu le confirme, une ligne par légende.
            </p>
            <p style={cp.paragraphe}>
              Chaque personnage a aussi sa propre chance de drop, indépendante des autres. Jouer en
              multicompte multiplie donc les occasions sur une même run.
            </p>
            {(() => {
              const defaut = config.intensite_defaut
              const phare = legendesParIntensite?.find(l => l.intensite === defaut.intensite && l.niveau === defaut.niveau)
              return (
                <div style={cp.chiffrePhareBloc}>
                  <div style={cp.chiffrePhareLabel}>
                    N'importe quelle légende, en {config.intensites[defaut.intensite].libelle} {NOMS_PALIERS_ROMAINS[defaut.niveau]}
                  </div>
                  <div style={cp.chiffrePhare}>{phare ? formaterSonges(phare.runsNimporteLaquelle) : "…"}</div>
                  <div style={cp.caveat}>
                    Contre {phare ? formaterSonges(phare.runsUnePrecise) : "…"} pour une légende précise —
                    exemple à {NB_PERSONNAGES_EXEMPLE} personnages.
                  </div>
                </div>
              )
            })()}
            <p style={cp.paragraphe}>Le détail par intensité, les deux lectures côte à côte :</p>
            <table style={cp.table}>
              <thead>
                <tr>
                  <th style={cp.th}>Intensité</th>
                  <th style={{ ...cp.th, textAlign: "right" }}>N'importe laquelle</th>
                  <th style={{ ...cp.th, textAlign: "right" }}>Une précise</th>
                </tr>
              </thead>
              <tbody>
                {legendesParIntensite == null ? (
                  <tr><td style={cp.td} colSpan={3}>Chargement...</td></tr>
                ) : legendesParIntensite.map(l => (
                  <tr key={`${l.intensite}_${l.niveau}`}>
                    <td style={cp.td}>{config.intensites[l.intensite].libelle} {NOMS_PALIERS_ROMAINS[l.niveau] || l.niveau}</td>
                    <td style={cp.tdChiffre}>{formaterSonges(l.runsNimporteLaquelle)}</td>
                    <td style={{ ...cp.td, textAlign: "right" }}>{formaterSonges(l.runsUnePrecise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={cp.caveat}>
              Ce sont des moyennes, pas des garanties : après ce nombre de runs, il reste encore
              environ 37 % de chances de n'avoir toujours rien obtenu.
            </p>
            <EncadreCalculeLeTien lien="/taux" enfant={
              <>Ce tableau porte sur les légendes classiques uniquement. Pour les autres objets
              trackés (légendes animales, runes, cosmétiques...), et pour ajuster le nombre de
              personnages, va voir Les Taux.</>
            } />
          </section>

          {/* VII — Les bribes et l'économie */}
          <section id="bribes-et-economie" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>VII.</span>Les bribes et l'économie</h2>
            <p style={cp.paragraphe}>
              Les bribes de rêve sont la monnaie qu'on ramène d'une run terminée, à la fin du
              combat final. Elles ne sont obtenues qu'en atteignant le seuil de vagues du combat
              final — perdre avant ne rapporte rien.
            </p>
            <table style={cp.table}>
              <thead>
                <tr>
                  <th style={cp.th}>Intensité</th>
                  <th style={{ ...cp.th, textAlign: "right" }}>Bribes par vague</th>
                  <th style={{ ...cp.th, textAlign: "right" }}>Vagues requises</th>
                  <th style={{ ...cp.th, textAlign: "right" }}>Vagues maximum</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(config.intensites).map(([cle, info]) =>
                  info.niveaux.map(n => (
                    <tr key={`${cle}_${n}`}>
                      <td style={cp.td}>{config.intensites[cle].libelle} {NOMS_PALIERS_ROMAINS[n] || n}</td>
                      <td style={cp.tdChiffre}>{config.bribes_par_vague[`${cle}_${n}`] ?? "—"}</td>
                      <td style={{ ...cp.td, textAlign: "right" }}>{config.vagues_requises[cle]}</td>
                      <td style={{ ...cp.td, textAlign: "right" }}>{config.vagues_max[cle] ?? "illimité"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p style={cp.paragraphe}>
              Pousser les vagues au-delà du seuil minimal augmente les bribes obtenues, mais pas les
              chances de drop du combat final — qui compte toujours pour un seul combat. Depuis la
              3.5, une fois le seuil franchi, la run est validée même en cas de défaite ensuite :
              continuer ne met pas en danger les bribes déjà acquises.
            </p>
            <p style={cp.paragraphe}>
              Quand plusieurs joueurs participent à une run, chacun reçoit sa part au prorata du
              nombre de salles de combat effectuées — les fontaines et les faveurs ne comptent pas
              dans ce calcul.
            </p>
            <p style={cp.paragraphe}>
              Cinq marchands attendent au Marché onirique : Neru Stalar échange les bribes contre des
              reflets, des fragments de prysmaradite et des runes astrales ; Gobribe échange contre
              les récompenses les plus chères (panoplie d'apparat, ornements, compagnons...). Trois
              autres — Gobastrale, Coco Rupe, Infinu — ne concernent que les anciennes monnaies de
              Songes (reflets d'antan, oubliés, infinis), vouées à disparaître avec la mise à jour
              3.7.
            </p>
            <EncadreARetenir>
              Les bribes ne tombent qu'à la fin d'une run réussie, au prorata des salles de combat
              faites par chaque joueur.
            </EncadreARetenir>
            <EncadreCalculeLeTien lien="/taux?onglet=bribes" enfant={
              <>Simule le nombre de runs qu'il te faut pour atteindre un objectif en bribes
              (panoplie d'apparat, ornement...), à ton intensité et ton nombre de vagues.</>
            } />
          </section>

          {/* VIII — Le multiplicateur de dégâts (sortie de la section Bonus, 16 août 2026) */}
          <section id="le-multiplicateur-de-degats" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>VIII.</span>Le multiplicateur de dégâts</h2>
            <p style={cp.paragraphe}>
              Démarre à 100 %, monte avec les bonus "% Dégâts". Tous les autres bonus s'additionnent
              d'abord entre eux ; le multiplicateur s'applique en <strong>dernier</strong> sur le
              total — il multiplie donc aussi les dommages finaux d'un passif de monstre ou d'un
              Dofus. C'est la statistique la plus forte des Songes, au-dessus des dommages finaux.
            </p>
            <EncadreARetenir>
              Le multiplicateur de dégâts s'applique en dernier, sur tout le reste déjà additionné —
              c'est le bonus le plus rentable à prioriser, et personne ne l'explique en jeu.
            </EncadreARetenir>
          </section>

          {/* IX — Les bonus */}
          <section id="les-bonus" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>IX.</span>Les bonus</h2>
            <p style={cp.paragraphe}>
              Trois familles : bonus mineurs (à l'entrée de chaque salle), bonus passifs (Fontaine
              uniquement), bonus actifs — les sorts de songe. Compagnons et invocations en
              profitent aussi. Le multiplicateur de dégâts, le bonus le plus rentable, a sa propre
              section (VIII).
            </p>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Famille</th><th style={cp.th}>Où l'obtenir</th><th style={cp.th}>Coût</th></tr></thead>
              <tbody>
                <tr><td style={cp.td}>Bonus mineurs</td><td style={cp.td}>Entrée de chaque salle</td><td style={cp.td}>Gratuit</td></tr>
                <tr><td style={cp.td}>Bonus passifs</td><td style={cp.td}>Fontaine Onirique</td><td style={cp.td}>15 à 25 points de rêve</td></tr>
                <tr><td style={cp.td}>Bonus actifs (sorts)</td><td style={cp.td}>Fontaine ou Faveur</td><td style={cp.td}>10 à 20 points, ou gratuit</td></tr>
              </tbody>
            </table>

            <h3 id="les-fontaines-oniriques" style={cp.sousTitre}>Les Fontaines Oniriques</h3>
            <p style={cp.paragraphe}>
              5 bonus proposés, achetés avec les points de rêve gagnés en combat. Dès qu'un bonus
              est acheté, un nouveau le remplace immédiatement — la fontaine ne se vide jamais.
              4 raretés : commun, rare, épique, légendaire. Nettement plus puissants que les bonus
              de salle.
            </p>
            <p style={cp.paragraphe}>
              La première fontaine (salle 4) est plus restreinte : bonus à 15 points de rêve maximum,
              un seul passif possible (Vent Arrière), les sorts à 20 points n'y apparaissent jamais.
            </p>
            <EmplacementImage src="/assets/comprendre/fontaine-onirique.webp" alt="Interface de la Fontaine Onirique, avec ses 5 bonus proposés" />

            <h3 id="les-faveurs-oniriques" style={cp.sousTitre}>Les Faveurs Oniriques</h3>
            <p style={cp.paragraphe}>
              Gratuites : 3 bonus au choix (dont toujours une petite bourse de points de rêve).
              Choisir en est <strong>obligatoire</strong> pour continuer — une Tempête astrale
              relance les trois propositions. Intérêt majeur : avancer d'une salle sans combattre.
              N'apparaît jamais au palier I.
            </p>

            <h3 id="les-bonus-mineurs" style={cp.sousTitre}>Les bonus mineurs</h3>
            <p style={cp.paragraphe}>
              Gagnés à l'entrée de chaque salle, visibles sur la carte avant de choisir son chemin :
              dégâts, vitalité, portée, PA, PM, points de rêve, Tempête astrale, effets sur les
              sorts... Six d'entre eux n'apparaissent qu'à partir du palier II. "Sorts : −1 de
              relance" ne peut être obtenu qu'une seule fois par run.
            </p>

            <h3 id="les-bonus-passifs" style={cp.sousTitre}>Les bonus passifs</h3>
            <p style={cp.paragraphe}>
              Achetables uniquement en Fontaine, entre 15 et 25 points de rêve. Tous de rareté
              légendaire — les passifs de classe coûtent systématiquement 25 points.
            </p>

            <h3 id="les-trois-utilitaires" style={cp.sousTitre}>Les trois utilitaires</h3>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Utilitaire</th><th style={cp.th}>Effet</th><th style={{ ...cp.th, textAlign: "right" }}>Prix en Fontaine</th></tr></thead>
              <tbody>
                <tr><td style={cp.td}>Tempête astrale</td><td style={cp.td}>Change un groupe de monstres, ou relance une Fontaine/Faveur</td><td style={cp.tdChiffre}>10 pts</td></tr>
                <tr><td style={cp.td}>Sable de Draconiros</td><td style={cp.td}>Retente un combat perdu</td><td style={cp.tdChiffre}>20 pts</td></tr>
                <tr><td style={cp.td}>Croissance Onirique</td><td style={cp.td}>+100 niveaux de songeur</td><td style={cp.tdChiffre}>10 pts</td></tr>
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 14 }}>
              <EmplacementImage tailleReelle src="/assets/comprendre/tempete-astrale.webp" alt="Infobulle de la Tempête astrale" />
              <EmplacementImage tailleReelle src="/assets/comprendre/sable-draconiros.webp" alt="Infobulle du Sable de Draconiros" />
            </div>
            <p style={cp.paragraphe}>Trois sources de niveaux de songeur, cumulables :</p>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Source</th><th style={{ ...cp.th, textAlign: "right" }}>Gain</th></tr></thead>
              <tbody>
                <tr><td style={cp.td}>Croissance Onirique</td><td style={cp.tdChiffre}>+100</td></tr>
                <tr><td style={cp.td}>Invocation du Nessil</td><td style={cp.tdChiffre}>+50</td></tr>
                <tr><td style={cp.td}>Bonus de portail</td><td style={cp.tdChiffre}>+50</td></tr>
              </tbody>
            </table>
            <p style={cp.paragraphe}>
              Aucune des trois n'augmente le niveau des monstres.
            </p>

            <EncadreReserve>
              Les succès "Bribe d'un… économe" et "Bribe d'un… parfait" interdisent tout achat en
              Fontaine. Les pouvoirs de gobelins, eux, restent autorisés.
            </EncadreReserve>
            {SORTS_DE_SONGE.length > 0 && (
              <p style={cp.paragraphe}>
                Les bonus actifs — les sorts de songe — ont leur propre section, plus bas.
              </p>
            )}
          </section>

          {/* X — Quêtes et succès */}
          <section id="quetes-et-succes" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>X.</span>Quêtes et succès</h2>
            <p style={cp.paragraphe}>
              5 quêtes sont liées aux Songes : Cauchemar infini, Jusqu'au bout du rêve, Prise de
              conscience, Les animaux fantastiques, Le poids de son regard.
            </p>
            <p style={cp.paragraphe}>
              6 succès identiques se déclinent pour chacune des 3 catégories d'intensité (vaincre
              1 000 monstres, 100 boss, obtenir 1 000 bribes, 500 bribes sans Sable, sans achat en
              Fontaine, ou sans les deux). Ils se cumulent vers le bas — progresser en Cauchemar
              avance aussi Paradoxe et Rêve — et sont réalisables sur plusieurs runs, à n'importe
              quelle intensité de la catégorie.
            </p>
            <p style={cp.paragraphe}>
              4 Épreuves de Songe valent chacune un succès à 10 points, sans autre récompense.
            </p>
          </section>

          {/* XI — Les sorts de songe (masquée tant que SORTS_DE_SONGE est vide) */}
          {SORTS_DE_SONGE.length > 0 && (
            <section id="les-sorts-de-songe" style={cp.section}>
              <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>XI.</span>Les sorts de songe</h2>
              {/* Contenu à écrire une fois la source scrapée — prévoir un renvoi vers la
                  Bibliothèque une fois les sorts effectivement trackés là-bas. */}
            </section>
          )}

          {/* XII — Ce qu'on ne sait pas encore */}
          <section id="ce-qu-on-ne-sait-pas-encore" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>XII.</span>Ce qu'on ne sait pas encore</h2>
            <p style={cp.paragraphe}>
              Cette page ne prétend pas tout savoir. Certains chiffres sont encore en conflit entre
              nos relevés et d'autres sources, et certains mécanismes restent flous — les voici, sans
              les habiller. Dire ce qu'on ignore est un argument de crédibilité, pas une faiblesse.
            </p>
            <table style={cp.table}>
              <tbody>
                <tr><td style={{ ...cp.td, width: 26 }}>⚠️</td><td style={cp.td}><strong>Taux de base des légendes classiques</strong> — nos relevés (0,003667 %) et une source externe (0,0035 %) sont proches mais ne concordent pas. L'affichage en jeu arrondit à 3 décimales, impossible à départager sur une simple capture d'écran.</td></tr>
                <tr><td style={cp.td}>⚠️</td><td style={cp.td}><strong>Taux de base du Diplôme de Feur</strong> — nos relevés et une source externe ne s'accordent pas. Non tranché.</td></tr>
                <tr><td style={cp.td}>⚠️</td><td style={cp.td}><strong>Multiplicateur de palier sur les runes astrales</strong> — nos relevés suggèrent un bonus supplémentaire au palier le plus haut de leur tranche, en plus du multiplicateur d'intensité. Spécifique aux runes, non confirmé.</td></tr>
                <tr><td style={cp.td}>❌</td><td style={cp.td}><strong>Sorts de fontaine</strong> — la liste complète n'est pas relevée. L'effet annoncé de Vent Arrière (le plus d'Initiative joue en premier) reste à confirmer en jeu.</td></tr>
              </tbody>
            </table>
            <EncadreARetenir>
              Dofura choisit toujours ses propres relevés en jeu quand une source diverge, mais te le
              dit à chaque fois que ça arrive.
            </EncadreARetenir>
          </section>

        </MiseEnPageSommaire>
      </div>
    </div>
  )
}
