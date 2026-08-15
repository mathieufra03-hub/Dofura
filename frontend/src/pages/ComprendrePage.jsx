import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

// Page "/comprendre" — "Comprendre les Songes" (chantier dédié, 15 août 2026).
// Contenu éditorial : toute la matière vient de la skill Ratrosk
// (.claude/skills/ratrosk/, seule source de faits autorisée — statuts
// ✅ affirmable / 📊 estimation / ⚠️ réserve explicite / ❌ interdit
// d'écriture). Aucun taux, multiplicateur, nombre de runs ou prix n'est
// écrit en dur ici : tout vient de GET /songes/config (et /songes/taux
// pour la section V), même pattern que pages/TauxPage.jsx — y compris la
// formule calculerSongesItems, dupliquée intentionnellement plutôt
// qu'importée (convention du projet : chaque page est autonome, voir
// l'en-tête de TauxPage.jsx). Fichier séparé, App.jsx n'a pas eu besoin
// d'être touché : l'import et la route existaient déjà.
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NOMS_PALIERS_ROMAINS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" }

// Sorts de Songe (section X) : pas encore scrapés (SKILL.md ratrosk
// n'a que des exemples partiels, pas une liste exhaustive fiable). Tant
// que ce tableau est vide, la section entière est masquée — même logique
// que "aGuide" pour le guide de boss des donjons (App.jsx,
// DonjonDetailPage) : pas de placeholder "bientôt disponible", rien.
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

// Exemple travaillé de la section V (4 personnages) : valeur illustrative
// d'un exemple pédagogique, pas un taux/prix/nombre de runs à synchroniser
// avec une source — voir étape 0 validée par Popo. Le lecteur qui veut
// ajuster son nombre de personnages est renvoyé vers /taux.
const NB_PERSONNAGES_EXEMPLE = 4

const SECTIONS = [
  { id: "qu-est-ce-qu-un-songe", numero: "I", titre: "Qu'est-ce qu'un Songe" },
  { id: "comment-se-deroule-une-run", numero: "II", titre: "Comment se déroule une run" },
  { id: "le-combat-final", numero: "III", titre: "Le combat final" },
  { id: "les-intensites", numero: "IV", titre: "Les intensités" },
  { id: "ce-qui-peut-tomber", numero: "V", titre: "Ce qui peut tomber" },
  { id: "combien-de-runs", numero: "VI", titre: "Combien de runs pour une légende" },
  { id: "bribes-et-economie", numero: "VII", titre: "Les bribes et l'économie" },
  { id: "les-bonus", numero: "VIII", titre: "Les bonus" },
  { id: "quetes-et-succes", numero: "IX", titre: "Quêtes et succès" },
  { id: "les-sorts-de-songe", numero: "X", titre: "Les sorts de songe" },
  { id: "ce-qu-on-ne-sait-pas-encore", numero: "XI", titre: "Ce qu'on ne sait pas encore" },
]

const COULEURS = {
  cyan: { hex: "#2CE7FF", rgb: "44, 231, 255" },
  or: { hex: "#F0C040", rgb: "240, 192, 64" },
  violet: { hex: "#C478FF", rgb: "196, 120, 255" },
}

const cp = {
  page: { padding: "1.5rem 1.25rem 4rem", maxWidth: 1180, margin: "0 auto" },
  backBtn: { background: "transparent", border: "1px solid var(--df-border-cyan)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--df-cyan)", cursor: "pointer", marginBottom: 18 },
  intro: { margin: "0 0 26px", fontSize: 13.5, lineHeight: 1.6, color: "var(--df-text-2)", maxWidth: 640 },
  toggleBtn: { width: "100%", textAlign: "left", marginBottom: 10 },
  sommaireNav: { position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 2 },
  sommaireLien: { display: "block", padding: "7px 10px", borderRadius: 8, fontSize: 12.5, textDecoration: "none", color: "var(--df-text-2)", borderLeft: "2px solid transparent" },
  sommaireNumero: { opacity: 0.55, marginRight: 6, fontFamily: "var(--df-font-logo)" },
  section: { scrollMarginTop: 20, marginBottom: 46 },
  sectionTitre: { display: "flex", alignItems: "baseline", gap: 10, margin: "0 0 14px", fontSize: 19 },
  numeroRomain: { fontFamily: "var(--df-font-logo)", fontSize: 15, color: "var(--df-text-3)", letterSpacing: "0.06em" },
  paragraphe: { fontSize: 14, lineHeight: 1.7, color: "var(--df-text)", margin: "0 0 14px" },
  liste: { fontSize: 14, lineHeight: 1.7, color: "var(--df-text)", margin: "0 0 14px", paddingLeft: 20 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 },
  th: { textAlign: "left", padding: "8px 10px", color: "var(--df-text-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(240, 192, 64, 0.25)" },
  td: { padding: "8px 10px", borderBottom: "1px solid rgba(240, 192, 64, 0.1)", color: "var(--df-text)" },
  tdChiffre: { padding: "8px 10px", borderBottom: "1px solid rgba(240, 192, 64, 0.1)", color: "var(--df-gold)", fontWeight: 700, textAlign: "right" },
  caveat: { fontSize: 11.5, color: "var(--df-text-3)", fontStyle: "italic", margin: "0 0 14px" },
  image: { margin: "18px 0", borderRadius: 12, overflow: "hidden", border: "1px solid var(--df-border-gold)" },
  legendeImage: { fontSize: 11.5, color: "var(--df-text-3)", fontStyle: "italic", padding: "6px 10px" },
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

// Emplacement de capture d'écran (sections II, III, IV, VIII) — src/alt
// obligatoires, légende optionnelle, chargement paresseux. Si le fichier
// est absent (pas encore fourni par Popo dans
// frontend/public/assets/comprendre/), l'emplacement ne s'affiche pas du
// tout : pas de cadre vide, pas de texte de remplacement.
function EmplacementImage({ src, alt, legende }) {
  const [enErreur, setEnErreur] = useState(false)
  if (enErreur) return null
  return (
    <figure style={{ ...cp.image, margin: "18px 0" }}>
      <img src={src} alt={alt} loading="lazy" onError={() => setEnErreur(true)}
        style={{ width: "100%", display: "block" }} />
      {legende && <figcaption style={cp.legendeImage}>{legende}</figcaption>}
    </figure>
  )
}

// Colonne sommaire (sticky en desktop, repliable en haut sur mobile) +
// colonne de contenu — reprend .df-list-wrap/.df-filters-toggle/
// .df-filters-panel (tokens.css), déjà utilisées ailleurs sur le site
// pour exactement ce pattern (colonne de filtres desktop / volet
// repliable mobile), jamais retouchées ici.
function MiseEnPageSommaire({ sections, ouvert, onToggle, onNaviguer, children }) {
  return (
    <div className="df-list-wrap">
      <div>
        <button className="df-filters-toggle df-pill" onClick={onToggle} style={cp.toggleBtn}>
          Sommaire {ouvert ? "▾" : "▸"}
        </button>
        <nav className={`df-filters-panel ${ouvert ? "df-filters-open" : ""}`} style={cp.sommaireNav}>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} style={cp.sommaireLien}
              onClick={(e) => { e.preventDefault(); onNaviguer(s.id) }}>
              <span style={cp.sommaireNumero}>{s.numero}</span>{s.titre}
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

  // Section V : 7 intensités où les légendes sont éligibles (Paradoxe I à
  // Cauchemar IV), dérivées de config.intensites — jamais un [1,2,3,4]
  // codé en dur. Un appel /songes/taux par intensité x niveau (même
  // endpoint que TauxPage.jsx), on ne garde que l'item catégorie
  // "legende" : toutes les légendes du même type partagent exactement le
  // même taux (fait ✅ Ratrosk, butin.md), un seul suffit.
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
            const legende = d.items.find(it => it.categorie === "legende")
            const runs = legende
              ? calculerSongesItems([legende], config.combats_par_palier, NB_PERSONNAGES_EXEMPLE)
              : null
            return { intensite, niveau, runs }
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
        <h1 className="df-section-title" style={{ fontSize: 24, margin: "0 0 8px" }}>Comprendre les Songes</h1>
        <p style={cp.intro}>
          Le fonctionnement du Puits des Songes Infinis, du taux de drop à l'économie des bribes —
          à jour de la 3.5. Ce qu'on affirme vient de relevés en jeu ; ce qu'on ne sait pas encore
          est dit comme tel, jamais habillé.
        </p>

        <MiseEnPageSommaire sections={sectionsVisibles} ouvert={sommaireOuvert}
          onToggle={() => setSommaireOuvert(o => !o)} onNaviguer={naviguerVersSection}>

          {/* I — Qu'est-ce qu'un Songe */}
          <section id="qu-est-ce-qu-un-songe" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>I</span>Qu'est-ce qu'un Songe</h2>
            <p style={cp.paragraphe}>
              Le Puits des Songes Infinis est la fonctionnalité de fin de jeu de Dofus 3. Tu y lances
              une run — seul ou jusqu'à 4 joueurs — avec le personnage qui la possède obligatoirement
              en tête de groupe.
            </p>
            <p style={cp.paragraphe}>
              Accessible depuis l'onglet Songes Infinis du menu (raccourci T), sans prérequis de
              quête, conseillé à partir du niveau 199-200.
            </p>
            <p style={cp.paragraphe}>
              Chaque run est une prise de risque : la mort y est définitive. Un combat perdu met fin
              à la run, sauf si tu possèdes un Sable de Draconiros pour retenter le combat. C'est ce
              risque qui rend le butin qu'on y trouve — objets légendaires, runes astrales,
              cosmétiques exclusifs — introuvable ailleurs dans le jeu.
            </p>
            <EncadreARetenir>
              Aucun prérequis de niveau — le 199-200 est conseillé, pas exigé. Jusqu'à 4 joueurs,
              avec mort définitive : un combat perdu met fin à la run (sauf Sable de Draconiros).
            </EncadreARetenir>
          </section>

          {/* II — Comment se déroule une run */}
          <section id="comment-se-deroule-une-run" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>II</span>Comment se déroule une run</h2>
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
              Sur ces {config.nb_salles_par_run} salles, jusqu'à {totalCombats} sont des combats —
              une Faveur Onirique en remplace un à chaque fois qu'elle apparaît sur le chemin
              choisi. Le reste, ce sont des Fontaines Oniriques (salles 4, 10, 16 et 25) : chaque
              palier — sauf le premier — en commence une, et la dernière apparaît juste avant le
              combat final.
            </p>
            <p style={cp.paragraphe}>
              Quatre types de salles existent : Combat (un groupe de monstres), Fontaine Onirique
              (marchand de bonus), Faveur Onirique (un bonus gratuit, qui permet d'avancer sans
              combattre), et Fin du rêve — le combat final, toujours en dernière salle.
            </p>
            <p style={cp.paragraphe}>
              Une fois entré dans une salle, aucun retour en arrière n'est possible — sauf via le
              gobelin Gobledore, qui renvoie exceptionnellement à la salle des portails précédente.
            </p>
            <p style={cp.paragraphe}>
              <strong>Arbitrage :</strong> une Faveur donne un bonus gratuit sans risque de mort,
              mais coûte une occasion de drop — à éviter si tu farmes les légendes.
            </p>
            <p style={cp.paragraphe}>
              Chaque salle a aussi un score de difficulté, caché pendant la run — visible seulement
              à l'écran de défaite. Ordres de grandeur : environ 5 en Rêve I au palier I, 10 en
              Rêve I au palier V, 30 en Cauchemar III au palier I, 60 en Cauchemar III au palier V.
            </p>
            <p style={cp.paragraphe}>
              Pour gérer la mort définitive : le bestiaire de la salle (Alt+B) affiche stats des
              monstres, carte et ordre de jeu avant de lancer le combat, avec 3 minutes de
              préparation et des tours de 90 secondes.
            </p>
            <EmplacementImage src="/assets/comprendre/structure-run.webp" alt="Carte à embranchement d'un palier de Songe, avec ses salles de combat, Fontaine et Faveur Onirique" />
            <EncadreARetenir>
              {config.nb_salles_par_run} salles, {nbPaliers} paliers, jusqu'à {totalCombats} combats
              selon le chemin — le bestiaire (Alt+B) et les 3 minutes de préparation rendent la
              mort définitive gérable.
            </EncadreARetenir>
          </section>

          {/* III — Le combat final */}
          <section id="le-combat-final" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>III</span>Le combat final</h2>
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
              50 tours maximum pour enchaîner le plus de vagues possible. Les seuils de validation
              et les plafonds de vagues par catégorie sont en section{" "}
              <a href="#bribes-et-economie" style={{ color: "var(--df-cyan)" }}
                onClick={(e) => { e.preventDefault(); naviguerVersSection("bribes-et-economie") }}>VII</a>{" "}
              — ils déterminent tes bribes, pas ton drop.
            </p>
            <EmplacementImage src="/assets/comprendre/combat-final.webp" alt="Combat final d'un Songe, vagues successives de monstres" />
            <EncadreARetenir>
              Le combat final compte pour un seul combat dans les occasions de drop, quel que soit
              le nombre de vagues enchaînées — pousser les vagues change tes bribes, jamais tes
              chances de légende.
            </EncadreARetenir>
          </section>

          {/* IV — Les intensités */}
          <section id="les-intensites" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>IV</span>Les intensités</h2>
            <p style={cp.paragraphe}>
              Dix intensités existent, réparties en 3 catégories : Rêve, Paradoxe, Cauchemar. Chaque
              intensité applique un multiplicateur, identique pour le butin et l'expérience.
            </p>
            <ul style={cp.liste}>
              <li><strong>Rêve</strong> — mode découverte : malus, ni légendes ni runes, filet de sécurité</li>
              <li><strong>Paradoxe</strong> — mode normal et mode de farm : tout dropable dès Paradoxe I</li>
              <li><strong>Cauchemar</strong> — joueurs expérimentés : meilleurs taux, mais conçu pour le challenge, pas la rentabilité</li>
            </ul>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Catégorie</th><th style={cp.th}>Niveau</th><th style={{ ...cp.th, textAlign: "right" }}>Multiplicateur</th></tr></thead>
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
            <EmplacementImage src="/assets/comprendre/intensites-tableau.webp" alt="Sélecteur d'intensité en jeu, des 3 niveaux de Rêve aux 3 niveaux de Cauchemar" />
            <EncadreARetenir>
              Le multiplicateur grimpe avec l'intensité, mais en Rêve, ni légendes ni runes astrales
              ne tombent — il faut au moins Paradoxe I pour tout débloquer.
            </EncadreARetenir>
          </section>

          {/* V — Ce qui peut tomber */}
          <section id="ce-qui-peut-tomber" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>V</span>Ce qui peut tomber</h2>
            <p style={cp.paragraphe}>
              Deux conditions indépendantes doivent être remplies pour qu'un objet tombe. L'intensité
              décide quelles familles d'objets sont accessibles : en Rêve, reflets et cosmétiques
              seulement ; à partir de Paradoxe I, tout. Le palier décide quelle variante de chaque
              famille, et si les légendes sont accessibles.
            </p>
            <p style={cp.paragraphe}>
              Conséquence contre-intuitive : une run en Cauchemar III mais au palier II ne peut
              toujours pas faire tomber de légende. L'intensité maximale ne remplace pas le palier.
            </p>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Palier</th><th style={cp.th}>Ce qui peut tomber</th></tr></thead>
              <tbody>
                <tr><td style={cp.td}>I</td><td style={cp.td}>Reflets · Bouclirêve Onirique · Bouclirêve Étoile · Runes Mineure et Moyenne</td></tr>
                <tr><td style={cp.td}>II</td><td style={cp.td}>Reflets · Bouclirêve Fantastique · Bouclirêve Étoile · Runes Mineure et Moyenne</td></tr>
                <tr><td style={cp.td}>III</td><td style={cp.td}>Reflets · Bouclirêve Imaginaire · Bouclirêve Étoile · Runes Majeure et Épatante · Diplôme de Feur · Légendes · Légendes animales</td></tr>
                <tr><td style={cp.td}>IV</td><td style={cp.td}>Reflets · Bouclirêve Brumeux · Bouclirêve Étoile · Runes Majeure, Épatante, Merveilleuse et Légendaire · Diplôme de Feur · Légendes · Légendes animales</td></tr>
                <tr><td style={cp.td}>V</td><td style={cp.td}>Reflets · Bouclirêve Infini · Bouclirêve Étoile · Runes Merveilleuse et Légendaire · Diplôme de Feur · Légendes · Légendes animales</td></tr>
              </tbody>
            </table>
            <p style={cp.paragraphe}>
              Sur la prospection : elle ne joue un rôle que sur les cosmétiques (les Bouclirêves et
              le titre Diplôme de Feur), et individuellement par personnage. Elle n'a aucun effet sur
              les reflets, les runes astrales ou les légendes.
            </p>
            <EncadreARetenir>
              Palier III minimum ET intensité Paradoxe ou Cauchemar : les deux conditions doivent
              être réunies pour qu'une légende puisse tomber.
            </EncadreARetenir>
          </section>

          {/* V — Combien de runs pour une légende (section principale) */}
          <section id="combien-de-runs" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>V</span>Combien de runs pour une légende</h2>
            <p style={cp.paragraphe}>
              Les légendes classiques (celles qui donnent des équipements légendaires) ne tombent
              qu'à partir du palier III, et seulement en Paradoxe ou Cauchemar. Sept intensités
              remplissent ces deux conditions.
            </p>
            <p style={cp.paragraphe}>
              Voici, pour chacune, le nombre moyen de runs avant d'obtenir <strong>une légende
              précise</strong> — exemple travaillé à {NB_PERSONNAGES_EXEMPLE} personnages.
            </p>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Intensité</th><th style={{ ...cp.th, textAlign: "right" }}>Runs en moyenne</th></tr></thead>
              <tbody>
                {legendesParIntensite == null ? (
                  <tr><td style={cp.td} colSpan={2}>Chargement...</td></tr>
                ) : legendesParIntensite.map(l => (
                  <tr key={`${l.intensite}_${l.niveau}`}>
                    <td style={cp.td}>{config.intensites[l.intensite].libelle} {NOMS_PALIERS_ROMAINS[l.niveau] || l.niveau}</td>
                    <td style={cp.tdChiffre}>{formaterSonges(l.runs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={cp.caveat}>
              Ce sont des moyennes, pas des garanties : après ce nombre de runs, il reste encore
              environ 37 % de chances de n'avoir toujours rien obtenu.
            </p>
            <EncadreReserve>
              Toutes les légendes d'un même type partagent le même taux — mais on ne sait pas encore
              si chacune des 26 tire indépendamment, ou si un seul tirage se répartit ensuite entre
              les variantes. Si c'est le cas, le nombre de runs pour obtenir n'importe quelle légende
              (pas une précise) pourrait être nettement plus bas que ce tableau.
            </EncadreReserve>
            <EncadreReserve>
              Le taux utilisé ici vient de nos propres relevés en jeu. Une source externe indique un
              chiffre légèrement différent — un écart mineur mais non tranché. Nous privilégions nos
              relevés, mesurés directement en jeu.
            </EncadreReserve>
            <EncadreCalculeLeTien lien="/taux" enfant={
              <>Ce tableau porte sur les légendes classiques uniquement. Pour les autres objets
              trackés (légendes animales, runes, cosmétiques...), et pour ajuster le nombre de
              personnages, va voir Les Taux.</>
            } />
          </section>

          {/* VI — Les bribes et l'économie */}
          <section id="bribes-et-economie" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>VI</span>Les bribes et l'économie</h2>
            <p style={cp.paragraphe}>
              Les bribes de rêve sont la monnaie qu'on ramène d'une run terminée, dépensée ensuite au
              Marché onirique. Elles ne sont obtenues qu'en atteignant le seuil de vagues du combat
              final — perdre avant ne rapporte rien.
            </p>
            <table style={cp.table}>
              <thead><tr><th style={cp.th}>Intensité</th><th style={{ ...cp.th, textAlign: "right" }}>Bribes par vague</th></tr></thead>
              <tbody>
                {Object.entries(config.intensites).map(([cle, info]) =>
                  info.niveaux.map(n => (
                    <tr key={`${cle}_${n}`}>
                      <td style={cp.td}>{config.intensites[cle].libelle} {NOMS_PALIERS_ROMAINS[n] || n}</td>
                      <td style={cp.tdChiffre}>{config.bribes_par_vague[`${cle}_${n}`] ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p style={cp.paragraphe}>
              Pousser les vagues au-delà du seuil minimal augmente les bribes obtenues, mais pas les
              chances de drop du combat final — qui compte toujours pour un seul combat, quel que
              soit le nombre de vagues enchaînées.
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

          {/* VII — Les bonus */}
          <section id="les-bonus" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>VII</span>Les bonus</h2>
            <p style={cp.paragraphe}>
              Trois façons de monter en puissance pendant une run : les Fontaines Oniriques, les
              Faveurs Oniriques, et les bonus mineurs gagnés à l'entrée de chaque salle.
            </p>
            <p style={cp.paragraphe}>
              La Fontaine Onirique propose 5 bonus à la fois, achetés avec les points de rêve gagnés
              en combat. Dès qu'un bonus est acheté, un nouveau le remplace immédiatement — la
              fontaine ne se vide jamais. Quatre raretés existent : commun, rare, épique, légendaire.
            </p>
            <p style={cp.paragraphe}>
              La Faveur Onirique, elle, ne coûte rien : elle propose 3 bonus au choix (dont toujours
              une petite bourse de points de rêve), et permet surtout d'avancer d'une salle sans
              combattre. Elle n'apparaît jamais au palier I.
            </p>
            <p style={cp.paragraphe}>
              En chemin, tu croiseras peut-être des gobelins — des PNJ rares, visibles uniquement par
              le propriétaire de la run, qui offrent chacun un service : Bog relance les objets d'une
              fontaine, Gobledore permet de revenir à la salle des portails précédente, Gobséric fait
              passer une salle sans combattre, et King Gob multiplie les points de rêve gagnés sur la
              salle. Chacun disparaît après usage — et tu peux toujours refuser.
            </p>
            <EmplacementImage src="/assets/comprendre/fontaine-onirique.webp" alt="Interface de la Fontaine Onirique, avec ses 5 bonus proposés" />
            <EncadreARetenir>
              La Fontaine coûte des points de rêve mais se réapprovisionne à chaque achat ; la Faveur
              est gratuite mais impose un choix parmi trois options, sans jamais apparaître au
              palier I.
            </EncadreARetenir>
          </section>

          {/* VIII — Les sorts de songe (masquée tant que SORTS_DE_SONGE est vide) */}
          {SORTS_DE_SONGE.length > 0 && (
            <section id="les-sorts-de-songe" style={cp.section}>
              <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>VIII</span>Les sorts de songe</h2>
              {/* Contenu à écrire une fois la source scrapée. */}
            </section>
          )}

          {/* IX — Ce qu'on ne sait pas encore */}
          <section id="ce-qu-on-ne-sait-pas-encore" style={cp.section}>
            <h2 className="df-section-title" style={cp.sectionTitre}><span style={cp.numeroRomain}>IX</span>Ce qu'on ne sait pas encore</h2>
            <p style={cp.paragraphe}>
              Cette page ne prétend pas tout savoir. Certains chiffres sont encore en conflit entre
              nos relevés et d'autres sources, et certains mécanismes restent flous — les voici, sans
              les habiller. Dire ce qu'on ignore est un argument de crédibilité, pas une faiblesse.
            </p>
            <table style={cp.table}>
              <tbody>
                <tr><td style={{ ...cp.td, width: 26 }}>❌</td><td style={cp.td}><strong>Tirage indépendant ou mutualisé entre les légendes</strong> — on ne sait pas si les 26 légendes tirent chacune séparément, ou si un seul tirage se répartit ensuite entre elles.</td></tr>
                <tr><td style={cp.td}>⚠️</td><td style={cp.td}><strong>Taux de base des légendes classiques</strong> — nos relevés en jeu et une source externe donnent des chiffres proches mais pas identiques.</td></tr>
                <tr><td style={cp.td}>⚠️</td><td style={cp.td}><strong>Taux de base du Diplôme de Feur</strong> — nos relevés et une source externe ne s'accordent pas. Non tranché.</td></tr>
                <tr><td style={cp.td}>⚠️</td><td style={cp.td}><strong>Multiplicateur de palier sur les runes astrales</strong> — nos relevés suggèrent un bonus supplémentaire au palier le plus haut de leur tranche, en plus du multiplicateur d'intensité. Non confirmé.</td></tr>
                <tr><td style={cp.td}>⚠️</td><td style={cp.td}><strong>Rune Légendaire : palier IV seulement, ou IV et V ?</strong> — nos deux sources internes ne s'accordent pas.</td></tr>
                <tr><td style={cp.td}>❌</td><td style={cp.td}><strong>Nombre réel de combats par run</strong> — une Faveur Onirique ou le gobelin Gobséric permettent de sauter un combat, mais on ne connaît pas leur fréquence d'apparition.</td></tr>
                <tr><td style={cp.td}>❌</td><td style={cp.td}><strong>Le tag "Butin légendaire"</strong> — signalé en jeu à partir d'un certain palier, mais ses conditions exactes d'apparition restent inconnues.</td></tr>
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
