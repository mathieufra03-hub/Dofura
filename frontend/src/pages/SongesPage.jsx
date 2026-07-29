import { useState, useEffect, useMemo } from "react"

// Fichier séparé volontairement (SONGES.md §10 : "App.jsx est déjà très
// chargé"). Composant autonome : n'importe rien d'App.jsx, réutilise
// uniquement les classes/variables globales de tokens.css (déjà chargé une
// fois dans main.jsx) — voir la charte couleurs SONGES.md §10, qui
// correspond exactement aux tokens existants (--df-bg, --df-cyan,
// --df-green, --df-red, --df-card-bg), aucune nouvelle couleur inventée.
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const LS_TEAM = "dofura_songes_team_id"
const LS_INTENSITE = "dofura_songes_intensite"

const CATEGORIE_LABELS = {
  legende: "Légendes",
  legende_animale: "Légendes animales",
  cosmetique: "Cosmétiques",
  rune_astrale: "Rune astrale",
}
const ORDRE_CATEGORIES = ["legende", "legende_animale", "cosmetique", "rune_astrale"]
const NOMS_PALIERS_ROMAINS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" }

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

function IconeRecherche() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.4" stroke="var(--df-cyan)" strokeWidth="2" />
      <line x1="11" y1="11" x2="15" y2="15" stroke="var(--df-cyan)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const sp = {
  page: { padding: "1.5rem 1.25rem 3rem", maxWidth: 720, margin: "0 auto" },
  backBtn: { background: "transparent", border: "1px solid var(--df-border-cyan)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--df-cyan)", cursor: "pointer", marginBottom: 18 },
  card: { background: "rgba(var(--df-card-bg), 0.92)", border: "1px solid var(--df-border-gold)", borderRadius: 16, padding: "20px 20px", marginBottom: 16 },
  champ: { width: "100%", boxSizing: "border-box", background: "rgba(20,26,46,0.9)", border: "1px solid rgba(77,216,230,0.35)", borderRadius: 8, padding: "9px 12px", fontSize: 13.5, color: "var(--df-text)", outline: "none" },
  select: { background: "rgba(20,26,46,0.95)", color: "var(--df-text)", border: "1px solid rgba(255,198,61,0.4)", borderRadius: 999, padding: "8px 14px", fontSize: 13, cursor: "pointer", outline: "none" },
  btnVert: { background: "var(--df-green)", color: "#0A2118", border: "none", borderRadius: 12, padding: "16px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer", flex: "1 1 200px" },
  btnVertPetit: { background: "var(--df-green)", color: "#0A2118", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnOrContour: { background: "rgba(255,198,61,0.08)", color: "var(--df-gold)", border: "2px solid var(--df-gold)", borderRadius: 12, padding: "16px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", flex: "1 1 200px" },
  btnFantome: { background: "rgba(77,216,230,0.07)", color: "var(--df-cyan)", border: "1px solid rgba(77,216,230,0.6)", borderRadius: 10, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  lienDiscret: { fontSize: 12, color: "var(--df-text-3)", cursor: "pointer", textDecoration: "underline", background: "none", border: "none", padding: 0, fontFamily: "inherit" },
  pill: (actif) => ({ display: "inline-block", margin: "0 6px 6px 0", background: actif ? "rgba(77,216,230,0.18)" : "rgba(77,216,230,0.06)", color: actif ? "var(--df-cyan)" : "var(--df-text-2)", border: `1px solid ${actif ? "var(--df-cyan)" : "rgba(77,216,230,0.35)"}`, borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }),
}

// ============================================================
// États non connecté / chargement / onboarding
// ============================================================

function SongesConnexionRequise({ onBack }) {
  return (
    <div style={sp.page}>
      <button onClick={onBack} style={sp.backBtn}>← Retour</button>
      <div style={{ ...sp.card, textAlign: "center", padding: "3rem 1.5rem" }}>
        <h1 className="df-section-title" style={{ fontSize: 22, margin: "0 0 10px" }}>Suivi de Songes</h1>
        <p style={{ color: "var(--df-text-2)", fontSize: 14, margin: 0 }}>
          Connecte-toi pour compter tes runs et enregistrer tes drops — tes données te suivent sur tous tes appareils.
        </p>
      </div>
    </div>
  )
}

function SongesChargement() {
  return <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--df-text-2)", fontSize: 14 }}>Chargement...</div>
}

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
      <button disabled={enCours || !nom.trim()} onClick={creer} style={{ ...sp.btnVertPetit, opacity: (enCours || !nom.trim()) ? 0.5 : 1 }}>
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
          <span key={p.id} onClick={() => toggleMembre(p.id)} style={sp.pill(membres.includes(p.id))}>
            {membres.includes(p.id) ? "✓ " : ""}{p.nom}
          </span>
        ))}
      </div>
      <button disabled={enCours || !nom.trim() || membres.length === 0} onClick={creer}
        style={{ ...sp.btnVertPetit, opacity: (enCours || !nom.trim() || membres.length === 0) ? 0.5 : 1 }}>
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
    <div style={sp.page}>
      {!onboarding && <button onClick={onTerminer} style={sp.backBtn}>← Retour</button>}
      <h1 className="df-section-title" style={{ fontSize: 22, margin: "0 0 4px" }}>
        {onboarding ? "Avant de commencer" : "Gérer mes personnages et teams"}
      </h1>
      {onboarding && (
        <p style={{ color: "var(--df-text-2)", fontSize: 13.5, margin: "0 0 16px" }}>
          Le Suivi de Songes se base sur tes personnages regroupés en teams. Crée au moins un personnage, puis une team.
        </p>
      )}

      <div style={sp.card}>
        <div className="df-block-title" style={{ marginBottom: 4 }}>Personnages</div>
        {personnages.length === 0 ? (
          <p style={{ color: "var(--df-text-3)", fontSize: 13, margin: "6px 0" }}>Aucun personnage pour l'instant.</p>
        ) : (
          <div>{personnages.map(p => <span key={p.id} style={sp.pill(false)}>{p.nom}{p.classe ? ` (${p.classe})` : ""}</span>)}</div>
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
                    <button onClick={() => setTeamEnEdition(t.id)} style={sp.btnFantome}>Modifier</button>
                    <button onClick={() => supprimerTeam(t.id)} style={{ ...sp.btnFantome, color: "var(--df-red)", borderColor: "rgba(242,109,109,0.5)" }}>Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <FormNouvelleTeam token={token} personnages={personnages} onCree={onRafraichir} />
        </div>
      )}
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
          <span key={p.id} onClick={() => toggleMembre(p.id)} style={sp.pill(membres.includes(p.id))}>
            {membres.includes(p.id) ? "✓ " : ""}{p.nom}
          </span>
        ))}
      </div>
      <button disabled={enCours} onClick={enregistrer} style={sp.btnVertPetit}>Enregistrer</button>
      <button onClick={onTermine} style={{ ...sp.lienDiscret, marginLeft: 12 }}>Annuler</button>
    </div>
  )
}

// ============================================================
// Bascule "run interrompue" — partagée entre l'écran principal et
// l'écran d'ajout de drop (SONGES.md §10 point 4 : un seul champ).
// ============================================================

function BasculeRunInterrompue({ nbSallesParRun, runEchouee, setRunEchouee, salleAtteinte, setSalleAtteinte }) {
  if (!runEchouee) {
    return (
      <button onClick={() => setRunEchouee(true)} style={{ ...sp.lienDiscret, marginTop: 10 }}>
        La run s'est arrêtée en cours de route ?
      </button>
    )
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
      <label style={{ fontSize: 12.5, color: "var(--df-text-2)" }}>Salle atteinte</label>
      <input type="number" min={1} max={nbSallesParRun} value={salleAtteinte}
        onChange={e => setSalleAtteinte(Math.min(nbSallesParRun, Math.max(1, Number(e.target.value) || 1)))}
        style={{ width: 64, ...sp.champ, padding: "6px 8px" }} />
      <button onClick={() => setRunEchouee(false)} style={sp.lienDiscret}>Annuler</button>
    </div>
  )
}

// ============================================================
// Écran d'ajout de drop
// ============================================================

function SongesAjoutDrop({ config, itemsTrackables, equipeActive, runEchouee, setRunEchouee,
  salleAtteinte, setSalleAtteinte, dropsEnCours, setDropsEnCours, onValider, onAnnuler, enregistrement, erreur }) {
  const [recherche, setRecherche] = useState("")
  const [categorieFiltre, setCategorieFiltre] = useState(null)
  const [itemSelectionne, setItemSelectionne] = useState(null)
  const [personnageId, setPersonnageId] = useState(equipeActive?.membres[0]?.perso_id ?? null)
  const [palier, setPalier] = useState("")

  const itemsFiltres = useMemo(() => {
    const r = recherche.trim().toLowerCase()
    return itemsTrackables.filter(i =>
      (!categorieFiltre || i.categorie === categorieFiltre) &&
      (!r || i.nom.toLowerCase().includes(r))
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

  return (
    <div style={sp.page}>
      <button onClick={onAnnuler} style={sp.backBtn}>← Retour sans enregistrer</button>
      <h1 className="df-section-title" style={{ fontSize: 20, margin: "0 0 14px" }}>J'ai drop quelque chose</h1>

      <div style={sp.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(20,26,46,0.95)", border: "1px solid rgba(77,216,230,0.5)", borderRadius: 10, padding: "9px 14px", marginBottom: 12 }}>
          <IconeRecherche />
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un item trackable..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--df-text)", fontSize: 14 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          {ORDRE_CATEGORIES.map(c => {
            const n = itemsTrackables.filter(i => i.categorie === c).length
            return (
              <span key={c} onClick={() => setCategorieFiltre(f => f === c ? null : c)} style={sp.pill(categorieFiltre === c)}>
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
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", background: itemSelectionne?.item_id === i.item_id ? "rgba(77,216,230,0.14)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
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
                <span key={m.perso_id} onClick={() => setPersonnageId(m.perso_id)} style={sp.pill(personnageId === m.perso_id)}>
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
              <button disabled={!personnageId} onClick={ajouterDrop} style={{ ...sp.btnVertPetit, marginLeft: "auto", opacity: personnageId ? 1 : 0.5 }}>
                Ajouter ce drop
              </button>
            </div>
          </div>
        )}

        {dropsEnCours.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, color: "var(--df-text-3)", marginBottom: 6 }}>Drops de cette run ({dropsEnCours.length})</div>
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

        <BasculeRunInterrompue nbSallesParRun={config.nb_salles_par_run} runEchouee={runEchouee} setRunEchouee={setRunEchouee}
          salleAtteinte={salleAtteinte} setSalleAtteinte={setSalleAtteinte} />

        {erreur && <div style={{ color: "var(--df-red)", fontSize: 12.5, marginTop: 10 }}>{erreur}</div>}

        <button disabled={enregistrement} onClick={onValider} style={{ ...sp.btnVert, width: "100%", marginTop: 16, opacity: enregistrement ? 0.6 : 1 }}>
          Valider la run
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Écran principal
// ============================================================

function SongesEcranPrincipal({ config, itemsTrackables, teams, teamId, changerTeam,
  intensiteNiveau, changerIntensite, equipeActive, stats, historique, pageHistorique, setPageHistorique,
  dernierRunId, onAnnulerDerniereRun, runEchouee, setRunEchouee, salleAtteinte, setSalleAtteinte,
  onRunTerminee, onOuvrirGestion, onOuvrirAjoutDrop, enregistrement, erreur, onSelectObjet }) {

  // Sécheresse "légende" : min des tirages_depuis_dernier_drop sur les items
  // legende (tous eligibles aux memes paliers => min = tirages depuis le
  // dernier drop de N'IMPORTE QUELLE légende, pas d'un item précis — l'item
  // épinglé est explicitement hors périmètre de cette passe, SONGES.md §10).
  const itemsLegende = stats?.items?.filter(i => i.categorie === "legende") || []
  const secheresseTirages = itemsLegende.length > 0 ? Math.min(...itemsLegende.map(i => i.tirages_depuis_dernier_drop)) : null

  // Estimation du nombre de runs correspondant, calculee cote client depuis
  // /songes/config (aucune valeur de jeu recopiee en dur) — approximative
  // (suppose des runs completes), affichee avec un "≈" explicite.
  const runsEstimes = useMemo(() => {
    if (secheresseTirages == null || !config) return null
    const legendeRef = itemsTrackables.find(i => i.categorie === "legende")
    if (!legendeRef) return null
    const tailleEquipe = equipeActive?.membres.length || 1
    const tiragesParRun = legendeRef.paliers.reduce((s, p) => s + (config.combats_par_palier[p] || 0), 0) * tailleEquipe
    return tiragesParRun > 0 ? Math.round(secheresseTirages / tiragesParRun) : null
  }, [secheresseTirages, config, itemsTrackables, equipeActive])

  const totalPagesHistorique = Math.max(Math.ceil((historique.total || 0) / 10), 1)

  return (
    <div style={sp.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <h1 className="df-section-title" style={{ fontSize: 20, margin: 0 }}>Suivi de Songes</h1>
        <button onClick={onOuvrirGestion} style={sp.lienDiscret}>⚙ Personnages & teams</button>
      </div>

      {/* 1. Sécheresse en très grand */}
      <div style={{ ...sp.card, textAlign: "center", padding: "26px 20px" }}>
        <div style={{ fontSize: 12, color: "var(--df-text-3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
          Sécheresse légendes
        </div>
        {secheresseTirages == null ? (
          <div style={{ color: "var(--df-text-3)", fontSize: 14 }}>Aucune donnée pour cette intensité pour l'instant.</div>
        ) : (
          <>
            <div style={{ fontSize: "clamp(38px, 11vw, 58px)", fontWeight: 800, color: "var(--df-red)", lineHeight: 1 }}>
              {formaterNombre(secheresseTirages)}
            </div>
            <div style={{ fontSize: 13, color: "var(--df-text-2)", marginTop: 6 }}>
              tirages sans légende{runsEstimes != null ? ` · ≈ ${formaterNombre(runsEstimes)} run${runsEstimes !== 1 ? "s" : ""}` : ""}
            </div>
          </>
        )}
      </div>

      {/* 2. Pastilles team + intensité */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <select value={teamId || ""} onChange={e => changerTeam(Number(e.target.value))} style={sp.select}>
          {teams.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
        </select>
        <select value={`${intensiteNiveau.intensite}_${intensiteNiveau.niveau}`}
          onChange={e => { const [intensite, niveau] = e.target.value.split("_"); changerIntensite(intensite, Number(niveau)) }}
          style={sp.select}>
          {Object.entries(config.intensites).map(([cle, info]) =>
            info.niveaux.map(n => (
              <option key={`${cle}_${n}`} value={`${cle}_${n}`}>
                {cle.charAt(0).toUpperCase() + cle.slice(1)} {NOMS_PALIERS_ROMAINS[n] || n}
              </option>
            ))
          )}
        </select>
      </div>

      {/* 3. Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button disabled={enregistrement} onClick={onRunTerminee} style={{ ...sp.btnVert, opacity: enregistrement ? 0.6 : 1 }}>
          Run terminée
        </button>
        <button onClick={onOuvrirAjoutDrop} style={sp.btnOrContour}>
          J'ai drop quelque chose
        </button>
      </div>

      {/* 4. Salle atteinte, si la run n'est pas terminée */}
      <BasculeRunInterrompue nbSallesParRun={config.nb_salles_par_run} runEchouee={runEchouee} setRunEchouee={setRunEchouee}
        salleAtteinte={salleAtteinte} setSalleAtteinte={setSalleAtteinte} />
      {runEchouee && (
        <button disabled={enregistrement} onClick={onRunTerminee} style={{ ...sp.btnVertPetit, marginTop: 10 }}>
          Enregistrer cette run
        </button>
      )}

      {erreur && <div style={{ color: "var(--df-red)", fontSize: 12.5, marginTop: 10 }}>{erreur}</div>}

      {/* 6. Annulation de la dernière run */}
      {dernierRunId && (
        <div style={{ marginTop: 14 }}>
          <button onClick={onAnnulerDerniereRun} style={{ ...sp.lienDiscret, color: "var(--df-red)" }}>
            Annuler la dernière run enregistrée (Run #{dernierRunId})
          </button>
        </div>
      )}

      {/* 5. Historique */}
      <div style={{ marginTop: 26 }}>
        <div className="df-block-title">Historique</div>
        {historique.drops.length === 0 ? (
          <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "12px 0" }}>Aucun drop enregistré pour l'instant.</div>
        ) : historique.drops.map(d => (
          <div key={d.id} onClick={() => onSelectObjet(d.item_id)}
            style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(20,26,46,0.9)", border: "1px solid rgba(255,198,61,0.13)", borderRadius: 10, padding: "10px 14px", marginBottom: 8, cursor: "pointer" }}>
            {d.item_img ? <img src={d.item_img} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} /> : <div style={{ width: 28, height: 28 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "var(--df-gold)", fontWeight: 700, fontSize: 13.5 }}>{d.item_nom}{d.quantite > 1 ? ` ×${d.quantite}` : ""}</div>
              <div style={{ color: "var(--df-text-3)", fontSize: 11.5 }}>
                Run #{d.run_id} · {d.perso_nom}{d.palier ? ` · palier ${NOMS_PALIERS_ROMAINS[d.palier]}` : ""} · {formaterDate(d.cree_le)}
              </div>
            </div>
          </div>
        ))}
        {totalPagesHistorique > 1 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 10 }}>
            <button disabled={pageHistorique <= 1} onClick={() => setPageHistorique(p => p - 1)}
              style={{ ...sp.btnFantome, opacity: pageHistorique <= 1 ? 0.5 : 1 }}>← Précédent</button>
            <span style={{ fontSize: 12, color: "var(--df-text-2)" }}>Page {pageHistorique} / {totalPagesHistorique}</span>
            <button disabled={pageHistorique >= totalPagesHistorique} onClick={() => setPageHistorique(p => p + 1)}
              style={{ ...sp.btnFantome, opacity: pageHistorique >= totalPagesHistorique ? 0.5 : 1 }}>Suivant →</button>
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

  const [mode, setMode] = useState("principal") // "principal" | "ajout-drop" | "gestion"
  const [dropsEnCours, setDropsEnCours] = useState([])
  const [runEchouee, setRunEchouee] = useState(false)
  const [salleAtteinte, setSalleAtteinte] = useState(26)
  const [dernierRunId, setDernierRunId] = useState(null)
  const [stats, setStats] = useState(null)
  const [historique, setHistorique] = useState({ drops: [], total: 0 })
  const [pageHistorique, setPageHistorique] = useState(1)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState("")

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

  const equipeActive = teams.find(t => t.id === teamId) || null

  // Stats (pour la sécheresse) : rechargées à chaque changement de team/
  // intensité, et après toute création/suppression de run.
  const rafraichirStats = () => {
    if (!token || !teamId || !intensiteNiveau) return
    const params = new URLSearchParams({ intensite: intensiteNiveau.intensite, niveau: intensiteNiveau.niveau, team_id: teamId })
    fetch(`${API}/songes/stats?${params}`, { headers: authHeaders(token) }).then(r => r.json()).then(setStats).catch(() => setStats(null))
  }
  useEffect(rafraichirStats, [token, teamId, intensiteNiveau]) // eslint-disable-line

  const rafraichirHistorique = (page = pageHistorique) => {
    if (!token) return
    fetch(`${API}/songes/historique?page=${page}&page_size=10`, { headers: authHeaders(token) })
      .then(r => r.json()).then(setHistorique)
  }
  useEffect(() => rafraichirHistorique(pageHistorique), [token, pageHistorique]) // eslint-disable-line

  const enregistrerRun = ({ terminee, salleAtteinteVal, drops }) => {
    if (!equipeActive || equipeActive.membres.length === 0) return
    setEnregistrement(true); setErreur("")
    const participants = equipeActive.membres.map(m => m.perso_id)
    const body = {
      intensite: intensiteNiveau.intensite, niveau: intensiteNiveau.niveau,
      terminee, salle_atteinte: terminee ? config.nb_salles_par_run : salleAtteinteVal,
      participants, team_id: teamId,
      drops: drops.map(d => ({ perso_id: d.perso_id, item_id: d.item_id, quantite: d.quantite, palier: d.palier })),
    }
    fetch(`${API}/songes/runs`, { method: "POST", headers: authHeaders(token, true), body: JSON.stringify(body) })
      .then(async r => { if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || "Erreur d'enregistrement") }; return r.json() })
      .then(d => {
        setDernierRunId(d.id)
        setRunEchouee(false); setSalleAtteinte(config.nb_salles_par_run)
        setDropsEnCours([]); setMode("principal")
        rafraichirStats(); rafraichirHistorique(1); setPageHistorique(1)
      })
      .catch(e => setErreur(e.message))
      .finally(() => setEnregistrement(false))
  }

  const annulerDerniereRun = () => {
    if (!dernierRunId) return
    fetch(`${API}/songes/runs/${dernierRunId}`, { method: "DELETE", headers: authHeaders(token) })
      .then(() => { setDernierRunId(null); rafraichirStats(); rafraichirHistorique(1); setPageHistorique(1) })
  }

  const ouvrirAjoutDrop = () => { setErreur(""); setMode("ajout-drop") }
  const annulerAjoutDrop = () => { setDropsEnCours([]); setRunEchouee(false); setSalleAtteinte(config.nb_salles_par_run); setErreur(""); setMode("principal") }

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
    return <SongesGestion token={token} personnages={personnages} teams={teams}
      onRafraichir={chargerPersonnagesEtTeams} onTerminer={() => setMode("principal")} />
  }

  if (mode === "ajout-drop") {
    return <SongesAjoutDrop config={config} itemsTrackables={itemsTrackables} equipeActive={equipeActive}
      runEchouee={runEchouee} setRunEchouee={setRunEchouee} salleAtteinte={salleAtteinte} setSalleAtteinte={setSalleAtteinte}
      dropsEnCours={dropsEnCours} setDropsEnCours={setDropsEnCours}
      onValider={() => enregistrerRun({ terminee: !runEchouee, salleAtteinteVal: salleAtteinte, drops: dropsEnCours })}
      onAnnuler={annulerAjoutDrop} enregistrement={enregistrement} erreur={erreur} />
  }

  return (
    <SongesEcranPrincipal config={config} itemsTrackables={itemsTrackables} teams={teams}
      teamId={teamId} changerTeam={changerTeam} intensiteNiveau={intensiteNiveau} changerIntensite={changerIntensite}
      equipeActive={equipeActive} stats={stats} historique={historique} pageHistorique={pageHistorique} setPageHistorique={setPageHistorique}
      dernierRunId={dernierRunId} onAnnulerDerniereRun={annulerDerniereRun}
      runEchouee={runEchouee} setRunEchouee={setRunEchouee} salleAtteinte={salleAtteinte} setSalleAtteinte={setSalleAtteinte}
      onRunTerminee={() => enregistrerRun({ terminee: !runEchouee, salleAtteinteVal: salleAtteinte, drops: [] })}
      onOuvrirGestion={() => setMode("gestion")} onOuvrirAjoutDrop={ouvrirAjoutDrop}
      enregistrement={enregistrement} erreur={erreur} onSelectObjet={onSelectObjet}
    />
  )
}
