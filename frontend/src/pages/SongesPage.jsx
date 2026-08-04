import { useState, useEffect, useMemo } from "react"

// Fichier séparé volontairement (SONGES.md §10 : "App.jsx est déjà très
// chargé"). Composant autonome : n'importe rien d'App.jsx, réutilise
// uniquement les classes/variables globales de tokens.css (déjà chargé une
// fois dans main.jsx) — voir la charte couleurs SONGES.md §10, qui
// correspond exactement aux tokens existants (--df-bg, --df-cyan,
// --df-green, --df-red, --df-card-bg), aucune nouvelle couleur inventée.
//
// VOCABULAIRE (refonte interface, 29 juillet 2026) : on ne dit jamais "run"
// dans un texte visible par le joueur, seulement "songe". "run"/"Run"
// reste dans le code (noms de variables/fonctions, endpoints) — voir
// SONGES.md intro.
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
  champ: { width: "100%", boxSizing: "border-box", background: "rgba(var(--df-card-bg), 0.9)", border: "1px solid rgba(var(--df-cyan-rgb), 0.35)", borderRadius: 8, padding: "9px 12px", fontSize: 13.5, color: "var(--df-text)", outline: "none" },
  select: { background: "rgba(var(--df-card-bg), 0.95)", color: "var(--df-text)", border: "1px solid rgba(var(--df-gold-rgb), 0.4)", borderRadius: 999, padding: "8px 14px", fontSize: 13, cursor: "pointer", outline: "none" },
  btnVert: { background: "var(--df-green)", color: "#0A2118", border: "none", borderRadius: 12, padding: "16px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer", flex: "1 1 200px" },
  btnVertPetit: { background: "var(--df-green)", color: "#0A2118", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnOrContour: { background: "rgba(var(--df-gold-rgb), 0.08)", color: "var(--df-gold)", border: "2px solid var(--df-gold)", borderRadius: 12, padding: "16px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", flex: "1 1 200px" },
  btnFantome: { background: "rgba(var(--df-cyan-rgb), 0.07)", color: "var(--df-cyan)", border: "1px solid rgba(var(--df-cyan-rgb), 0.6)", borderRadius: 10, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  lienDiscret: { fontSize: 12, color: "var(--df-text-3)", cursor: "pointer", textDecoration: "underline", background: "none", border: "none", padding: 0, fontFamily: "inherit" },
  pill: (actif) => ({ display: "inline-block", margin: "0 6px 6px 0", background: actif ? "rgba(var(--df-cyan-rgb), 0.18)" : "rgba(var(--df-cyan-rgb), 0.06)", color: actif ? "var(--df-cyan)" : "var(--df-text-2)", border: `1px solid ${actif ? "var(--df-cyan)" : "rgba(var(--df-cyan-rgb), 0.35)"}`, borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }),
}

// ============================================================
// États non connecté / chargement / onboarding
// ============================================================

function SongesConnexionRequise({ onBack }) {
  return (
    <div style={sp.page}>
      <button onClick={onBack} style={sp.backBtn}>← Retour</button>
      <div style={{ ...sp.card, textAlign: "center", padding: "3rem 1.5rem" }}>
        <h1 className="df-section-title" style={{ fontSize: 22, margin: "0 0 10px" }}>L'Œil de Draconiros</h1>
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
      <button disabled={enCours || !nom.trim()} onClick={creer} className="df-hover-lift" style={{ ...sp.btnVertPetit, opacity: (enCours || !nom.trim()) ? 0.5 : 1 }}>
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
        className="df-hover-lift" style={{ ...sp.btnVertPetit, opacity: (enCours || !nom.trim() || membres.length === 0) ? 0.5 : 1 }}>
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
      <button disabled={enCours} onClick={enregistrer} className="df-hover-lift" style={sp.btnVertPetit}>Enregistrer</button>
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
            Supprime toutes tes runs, leurs participants et leurs drops. Tes personnages et tes teams ne sont pas
            touchés. Chaque drop est archivé dans le Journal avant suppression.
          </p>
          <button onClick={() => setConfirmation(true)} className="df-hover-lift" style={{ ...sp.btnFantome, color: "var(--df-red)", borderColor: "rgba(242,109,109,0.5)" }}>
            Tout supprimer
          </button>
        </>
      ) : (
        <>
          <p style={{ color: "var(--df-red)", fontSize: 13.5, fontWeight: 700, margin: "6px 0 12px" }}>
            Action irréversible : toutes tes runs et tous tes drops seront définitivement supprimés (tes personnages et teams
            resteront). Confirmer ?
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button disabled={enCours} onClick={confirmer} className="df-hover-lift" style={{ ...sp.btnVertPetit, background: "var(--df-red)", opacity: enCours ? 0.6 : 1 }}>
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
    return (
      <button onClick={() => setSongeEchoue(true)} style={{ ...sp.lienDiscret, marginTop: 10 }}>
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
      <button onClick={onAnnuler} style={sp.backBtn}>← Retour</button>
      <h1 className="df-section-title" style={{ fontSize: 20, margin: "0 0 14px" }}>J'ai drop</h1>

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
              <button disabled={!personnageId} onClick={ajouterDrop} className="df-hover-lift" style={{ ...sp.btnVertPetit, marginLeft: "auto", opacity: personnageId ? 1 : 0.5 }}>
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

        <button onClick={onValider} className="df-hover-lift" style={{ ...sp.btnVert, width: "100%", marginTop: 16 }}>
          Valider le drop
        </button>
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
  dernierRunId, onAnnulerDernierSonge, onSupprimerSonge, onSupprimerDrop,
  songeEchoue, setSongeEchoue, salleAtteinte, setSalleAtteinte, dropsEnCours,
  vagueFinale, setVagueFinale, nombreTours, setNombreTours,
  chronoSecondes, chronoEnMarche, onChronoDemarrerPause, onChronoReinitialiser,
  onSongeTermine, onOuvrirGestion, onOuvrirAjoutDrop, onOuvrirMesDrops, enregistrement, erreur, onSelectObjet }) {

  // Sécheresse de la catégorie affichée : voir /songes/stats
  // (categories_secheresse) — calcul dédié côté backend, pas un simple
  // minimum client (les cosmétiques n'ont pas tous les mêmes paliers
  // éligibles). Seul le chiffre principal est affiché (retour d'usage,
  // refonte du 29 juillet 2026 : plus de sous-titre "tirages").
  const infoCategorie = stats?.categories_secheresse?.find(c => c.categorie === categorieAffichee) || null
  const secheresseSonges = infoCategorie ? infoCategorie.songes_depuis_dernier_drop : null

  const totalPagesHistorique = Math.max(Math.ceil((historique.total || 0) / 10), 1)

  // Confirmation en 2 clics (pas de window.confirm() : coupe avec la charte
  // graphique custom et bloquerait l'automatisation de test navigateur).
  // Premier clic sur un id -> affiche "Confirmer ?" ; second clic sur le
  // MEME id -> supprime. Cliquer ailleurs annule implicitement (l'id
  // courant change).
  const [confirmerSongeId, setConfirmerSongeId] = useState(null)
  const [confirmerDropId, setConfirmerDropId] = useState(null)

  const clicSupprimerSonge = (id) => {
    if (confirmerSongeId === id) { onSupprimerSonge(id); setConfirmerSongeId(null) }
    else { setConfirmerSongeId(id); setConfirmerDropId(null) }
  }
  const clicSupprimerDrop = (id) => {
    if (confirmerDropId === id) { onSupprimerDrop(id); setConfirmerDropId(null) }
    else { setConfirmerDropId(id); setConfirmerSongeId(null) }
  }

  return (
    <div style={sp.page}>
      <button onClick={onBack} style={sp.backBtn}>← Retour</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 className="df-section-title" style={{ fontSize: 20, margin: 0 }}>L'Œil de Draconiros</h1>
          {/* Sous-titre (retour Popo, 31 juillet 2026 : rebranding "Le Puits" →
              "Le Registre des Songes", puis 1er août → "L'Œil de Draconiros"
              — le titre principal renommé à chaque fois, ce sous-titre lui
              n'a jamais changé) — même traitement "petite capitale" que les
              kickers de l'accueil (uppercase, letter-spacing large, petite
              taille, texte secondaire). */}
          <p style={{ margin: "4px 0 0", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--df-text-2)" }}>
            Compte tes runs, traque tes légendes
          </p>
        </div>
        <button onClick={onOuvrirGestion} style={sp.lienDiscret}>⚙ Personnages & teams</button>
      </div>

      {/* 1. Sélecteur de catégorie, au-dessus du compteur */}
      <div style={{ marginBottom: 10 }}>
        {ORDRE_CATEGORIES.map(c => (
          <span key={c} onClick={() => changerCategorie(c)} className="df-hover-lift" style={sp.pill(categorieAffichee === c)}>
            {CATEGORIE_LABELS_SELECTEUR[c]}
          </span>
        ))}
      </div>

      {/* 2. Compteur principal : uniquement le gros chiffre, rien d'autre (retour d'usage) */}
      <div style={{ ...sp.card, textAlign: "center", padding: "26px 20px" }}>
        <div style={{ fontSize: 12, color: "var(--df-text-3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
          Sans {CATEGORIE_MOT_SINGULIER[categorieAffichee]} depuis
        </div>
        {secheresseSonges == null ? (
          <div style={{ color: "var(--df-text-3)", fontSize: 14 }}>Aucune donnée pour cette intensité pour l'instant.</div>
        ) : (
          <div style={{ fontSize: "clamp(38px, 11vw, 58px)", fontWeight: 800, color: "var(--df-red)", lineHeight: 1 }}>
            {formaterNombre(secheresseSonges)}
          </div>
        )}
      </div>

      {/* 3. Pastilles team + intensité + chronomètre optionnel */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(var(--df-card-bg), 0.95)", border: "1px solid rgba(var(--df-gold-rgb), 0.4)", borderRadius: 999, padding: "6px 8px 6px 14px", marginLeft: "auto" }}>
          <span style={{ fontSize: 13, color: "var(--df-text)", fontVariantNumeric: "tabular-nums", minWidth: 56 }}>
            {formaterDuree(chronoSecondes)}
          </span>
          <button onClick={onChronoDemarrerPause} style={{
            ...sp.btnFantome, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, border: "none",
            background: chronoEnMarche ? "var(--df-red)" : "var(--df-green)",
            color: chronoEnMarche ? "#fff" : "#0A2118",
          }}>
            {chronoEnMarche ? "Pause" : "Démarrer"}
          </button>
          <button onClick={onChronoReinitialiser} title="Réinitialiser" className="df-hover-lift" style={{ ...sp.btnFantome, padding: "5px 10px", fontSize: 11.5 }}>↺</button>
        </div>
      </div>

      {/* Combat final a vagues (SONGES.md §3.2) et nombre de tours : optionnels,
          disponibles a chaque validation, au-dessus du bouton Songe terminé.
          Pas de plafond sur la vague finale — le combat comporte des vagues
          bonus au-dela du minimum requis pour gagner, le joueur choisit
          librement (retour d'usage, refonte du 29 juillet 2026). */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--df-text-3)" }}>Vague finale (optionnel)</label>
          <input type="number" min={1} value={vagueFinale} onChange={e => setVagueFinale(e.target.value)}
            style={{ width: 56, ...sp.champ, padding: "5px 8px", fontSize: 12.5 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--df-text-3)" }}>Nombre de tours (optionnel)</label>
          <input type="number" min={1} value={nombreTours} onChange={e => setNombreTours(e.target.value)}
            style={{ width: 56, ...sp.champ, padding: "5px 8px", fontSize: 12.5 }} />
        </div>
      </div>

      {/* 4. Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button disabled={enregistrement} onClick={onSongeTermine} className="df-hover-lift" style={{ ...sp.btnVert, opacity: enregistrement ? 0.6 : 1 }}>
          Run terminée
        </button>
        <button onClick={onOuvrirAjoutDrop} className="df-hover-lift" style={sp.btnOrContour}>
          J'ai drop
        </button>
      </div>

      {dropsEnCours.length > 0 && (
        <div style={{ fontSize: 12.5, color: "var(--df-gold)", marginTop: 8 }}>
          {dropsEnCours.length} drop{dropsEnCours.length > 1 ? "s" : ""} en attente
        </div>
      )}

      {/* 5. Salle atteinte, si le songe n'est pas terminé */}
      <BasculeSongeInterrompu nbSallesParRun={config.nb_salles_par_run} songeEchoue={songeEchoue} setSongeEchoue={setSongeEchoue}
        salleAtteinte={salleAtteinte} setSalleAtteinte={setSalleAtteinte} />
      {songeEchoue && (
        <button disabled={enregistrement} onClick={onSongeTermine} className="df-hover-lift" style={{ ...sp.btnVertPetit, marginTop: 10 }}>
          Enregistrer cette run
        </button>
      )}

      {erreur && <div style={{ color: "var(--df-red)", fontSize: 12.5, marginTop: 10 }}>{erreur}</div>}

      {/* 7. Annulation rapide du dernier songe */}
      {dernierRunId && (
        <div style={{ marginTop: 14 }}>
          <button onClick={onAnnulerDernierSonge} style={{ ...sp.lienDiscret, color: "var(--df-red)" }}>
            Annuler la dernière run enregistrée (Run #{dernierRunId})
          </button>
        </div>
      )}

      {/* 6. Historique des songes */}
      <div style={{ marginTop: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="df-block-title" style={{ margin: 0 }}>Historique des runs</div>
          <button onClick={onOuvrirMesDrops} style={sp.lienDiscret}>🎁 Mes drops</button>
        </div>
        {historique.songes.length === 0 ? (
          <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "12px 0" }}>Aucune run enregistrée pour l'instant.</div>
        ) : historique.songes.map(s => (
          <div key={s.id} style={{ background: "rgba(var(--df-card-bg), 0.9)", border: "1px solid rgba(var(--df-gold-rgb), 0.13)", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "var(--df-gold)", fontWeight: 700, fontSize: 13.5 }}>
                  Run #{s.id}
                  {!s.terminee && <span style={{ color: "var(--df-text-3)", fontWeight: 400 }}> (interrompu, salle {s.salle_atteinte})</span>}
                </div>
                <div style={{ color: "var(--df-text-3)", fontSize: 11.5, marginTop: 2 }}>
                  {s.intensite.charAt(0).toUpperCase() + s.intensite.slice(1)} {NOMS_PALIERS_ROMAINS[s.niveau] || s.niveau} · {s.team_nom || "—"} · {formaterDate(s.date_run)}
                  {s.duree_secondes != null ? ` · durée : ${formaterDuree(s.duree_secondes)}` : ""}
                  {s.vague_finale != null ? ` · Vague finale : ${s.vague_finale}` : ""}
                  {s.nombre_tours != null ? ` · ${s.nombre_tours} tour${s.nombre_tours > 1 ? "s" : ""}` : ""}
                </div>
              </div>
              <button onClick={() => clicSupprimerSonge(s.id)} style={{ ...sp.lienDiscret, color: "var(--df-red)" }}>
                {confirmerSongeId === s.id ? "Confirmer la suppression ?" : "Supprimer"}
              </button>
            </div>
            {s.drops.length > 0 && (
              <div style={{ marginTop: 10, borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: 8 }}>
                {s.drops.map(d => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                    <span onClick={() => onSelectObjet(d.item_id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1, minWidth: 0 }}>
                      {d.item_img ? <img src={d.item_img} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} /> : null}
                      <span style={{ fontSize: 13, color: "var(--df-text)" }}>{d.item_nom}{d.quantite > 1 ? ` ×${d.quantite}` : ""}</span>
                      <span style={{ fontSize: 11.5, color: "var(--df-text-3)" }}>— {d.perso_nom}{d.palier ? ` · palier ${NOMS_PALIERS_ROMAINS[d.palier]}` : ""}</span>
                    </span>
                    <span onClick={() => clicSupprimerDrop(d.id)} title="Supprimer ce drop"
                      style={{ color: "var(--df-red)", cursor: "pointer", fontWeight: 700, padding: "0 4px", fontSize: confirmerDropId === d.id ? 11 : 13, whiteSpace: "nowrap" }}>
                      {confirmerDropId === d.id ? "Confirmer ?" : "✕"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {totalPagesHistorique > 1 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 10 }}>
            <button disabled={pageHistorique <= 1} onClick={() => setPageHistorique(p => p - 1)}
              className="df-hover-lift" style={{ ...sp.btnFantome, opacity: pageHistorique <= 1 ? 0.5 : 1 }}>← Précédent</button>
            <span style={{ fontSize: 12, color: "var(--df-text-2)" }}>Page {pageHistorique} / {totalPagesHistorique}</span>
            <button disabled={pageHistorique >= totalPagesHistorique} onClick={() => setPageHistorique(p => p + 1)}
              className="df-hover-lift" style={{ ...sp.btnFantome, opacity: pageHistorique >= totalPagesHistorique ? 0.5 : 1 }}>Suivant →</button>
          </div>
        )}
      </div>
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
                  — {d.perso_nom} · {d.intensite.charAt(0).toUpperCase() + d.intensite.slice(1)} {NOMS_PALIERS_ROMAINS[d.niveau] || d.niveau}
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
  const [vagueFinale, setVagueFinale] = useState("")
  const [nombreTours, setNombreTours] = useState("")
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

  const rafraichirHistorique = (page = pageHistorique) => {
    if (!token) return
    fetch(`${API}/songes/historique?page=${page}&page_size=10`, { headers: authHeaders(token) })
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
      vague_finale: vagueFinale ? Number(vagueFinale) : null,
      nombre_tours: nombreTours ? Number(nombreTours) : null,
    }
    fetch(`${API}/songes/runs`, { method: "POST", headers: authHeaders(token, true), body: JSON.stringify(body) })
      .then(async r => { if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || "Erreur d'enregistrement") }; return r.json() })
      .then(d => {
        setDernierRunId(d.id)
        setSongeEchoue(false); setSalleAtteinte(config.nb_salles_par_run)
        setDropsEnCours([]); setMode("principal")
        chronoReinitialiser(); setVagueFinale(""); setNombreTours("")
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
        <div style={{ ...sp.page, paddingTop: 0 }}>
          <SongesZoneDangereuse onToutSupprimer={toutSupprimer} />
          <SongesJournalSection journal={journal} page={pageJournal} setPage={setPageJournal} />
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
      songeEchoue={songeEchoue} setSongeEchoue={setSongeEchoue} salleAtteinte={salleAtteinte} setSalleAtteinte={setSalleAtteinte}
      dropsEnCours={dropsEnCours}
      vagueFinale={vagueFinale} setVagueFinale={setVagueFinale}
      nombreTours={nombreTours} setNombreTours={setNombreTours}
      chronoSecondes={chronoSecondes} chronoEnMarche={chronoEnMarche}
      onChronoDemarrerPause={chronoDemarrerPause} onChronoReinitialiser={chronoReinitialiser}
      onSongeTermine={enregistrerRun}
      onOuvrirGestion={() => setMode("gestion")} onOuvrirAjoutDrop={ouvrirAjoutDrop} onOuvrirMesDrops={ouvrirMesDrops}
      enregistrement={enregistrement} erreur={erreur} onSelectObjet={onSelectObjet}
    />
  )
}
