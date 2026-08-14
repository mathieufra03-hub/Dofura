import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { IconeBribe, IconeCoffre, IconeSablier, IconeTeamPersonnages, IconeIntensiteEliatrope } from "../components/IconesSonges.jsx"
import { normaliserTexte } from "../texte"
import {
  authHeaders, formaterNombre, formaterDate, formaterDuree,
  INTENSITE_LABEL, INTENSITE_COULEUR, NOMS_PALIERS_ROMAINS,
  ORDRE_CATEGORIES, CATEGORIE_LABELS,
  PastilleIntensite, PointSeparateur, InfosBasSonge, styleConteneurSonge, LigneDropSonge,
  sp, LigneSonge, ModaleSuppressionSonge,
  supprimerSongeApi, corrigerVagueFinaleApi, supprimerDropApi,
} from "../components/SongesPartages.jsx"

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
//
// Briques de ligne/modale/styles partagées avec HistoriquePage.jsx : voir
// components/SongesPartages.jsx (chantier Historique general, 14 aout
// 2026) — deplacees depuis ce fichier, ne pas les redefinir ici.
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const LS_TEAM = "dofura_songes_team_id"
const LS_INTENSITE = "dofura_songes_intensite"
const LS_CATEGORIE = "dofura_songes_categorie"

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
  const navigate = useNavigate()

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

  // Suppression d'un songe : modale de confirmation (refonte historique),
  // songeASupprimer porte l'objet complet (pas juste l'id) pour que la
  // modale puisse afficher le rappel sans redemander l'historique. L'état
  // d'édition de la vague finale et de confirmation de suppression d'un
  // drop vit maintenant DANS LigneSonge (components/SongesPartages.jsx,
  // chantier Historique general, 14 aout 2026) — plus géré ici.
  const [songeASupprimer, setSongeASupprimer] = useState(null)

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
            en {intensité}. Les 3 colonnes suivent le même schéma : label,
            zone chiffre flex:1 + minHeight partagée (centrage réel du
            chiffre dans tout l'espace label→filet, retour Popo 13 aout
            2026 — remplace l'ancien duo "case chiffre 44px + case légende
            18px vide" qui calait le chiffre à la main au lieu de le
            centrer), SeparateurDore identique et jamais enveloppé dans une
            marge spécifique. Le chiffre central est ~1,3x les latéraux —
            reste la stat mise en avant (cyan) sans écraser le bloc. Le
            sous-libellé "runs" du centre est en position absolute, ancré en
            bas de sa zone chiffre : il ne pèse plus dans le calcul de
            centrage, donc ne décale plus le chiffre par rapport aux deux
            colonnes qui n'en ont pas. Sous 700px : colonne, centre en
            premier. */}
        <div className="df-songes-stats df-songes-cadre-dore">
          <CoinsDores />
          <div className="df-songes-stat-col" style={{ flex: "1 1 0", textAlign: "center", padding: "8px 20px" }}>
            <div title="Record pour cette intensité et ce niveau." style={{ fontSize: 10.5, color: "var(--df-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", cursor: "help" }}>
              Meilleure série
            </div>
            <div style={{ flex: 1, minHeight: 62, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
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
            <SeparateurDore />
          </div>

          {/* Zone chiffre en flex:1 + minHeight partagee entre les 3 colonnes
              (retour Popo, 13 aout 2026) : le sous-libellé "runs" du centre
              est sorti du flux (position absolute, ancré en bas de CETTE
              zone) pour ne plus peser dans le calcul de centrage du chiffre
              — remplace l'ancien decoupage chiffre 44px + case 18px vide sur
              les colonnes laterales, qui calait a la main plutot que de
              centrer reellement. Les 3 chiffres tombent maintenant sur la
              meme ligne quelle que soit la presence du sous-libellé. */}
          <div className="df-songes-stat-col df-songes-stat-centre" style={{ flex: "1.6 1 0", textAlign: "center", padding: "8px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--df-text-3)", letterSpacing: 1, textTransform: "uppercase" }}>
              Sans {CATEGORIE_MOT_SINGULIER[categorieAffichee]} depuis
            </div>
            <div style={{ flex: 1, minHeight: 62, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6, position: "relative" }}>
              {secheresseSonges == null ? (
                <div style={{ color: "var(--df-text-2)", fontSize: 11 }}>Aucune donnée.</div>
              ) : (
                <>
                  <div className={flashCompteur ? "df-songes-flash" : ""} style={{ fontFamily: "var(--df-font-logo)", fontSize: "clamp(29px, 5.2vw, 39px)", fontWeight: 700, color: "var(--df-cyan)", lineHeight: 1, textShadow: "0 0 14px rgba(44,231,255,0.5)", marginTop: -6 }}>
                    {formaterNombre(secheresseSonges)}
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--df-text-2)" }}>runs</div>
                </>
              )}
            </div>
            <SeparateurDore />
          </div>

          <div className="df-songes-stat-col" style={{ flex: "1 1 0", textAlign: "center", padding: "8px 20px" }}>
            <div style={{ fontSize: 10.5, color: "var(--df-text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Runs en {INTENSITE_LABEL[intensiteNiveau.intensite] || intensiteNiveau.intensite} {NOMS_PALIERS_ROMAINS[intensiteNiveau.niveau] || intensiteNiveau.niveau}
            </div>
            <div style={{ flex: 1, minHeight: 62, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
              <div style={{ fontFamily: "var(--df-font-logo)", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, color: "var(--df-gold)" }}>
                {stats?.total_runs ?? "—"}
              </div>
            </div>
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

        {/* 6. Historique des songes — plus de toggle "Mes drops" ici (retour
            Popo, chantier Historique general 14 aout 2026) : le filtrage vit
            maintenant sur /historique (toggle + categorie), cette liste se
            contente des 5 derniers songes. Titre simple texte (retour Popo :
            plus cliquable, la fleche retiree — un seul lien vers /historique
            suffit) ; "Voir tout mon historique" reprend la place et le style
            qu'occupait "Mes drops" avant (lien discret en haut a droite, pas
            un bouton pleine largeur). flexWrap : a 390px, passe sur 2 lignes
            plutot que de chevaucher le titre. */}
        <div style={{ marginTop: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <div className="df-block-title" style={{ margin: 0 }}>Historique des songes</div>
            <button onClick={() => navigate("/historique")} className="df-hover-lift" style={sp.lienDiscret}>
              Voir tout mon historique
            </button>
          </div>
          {historique.songes.length === 0 ? (
            <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "12px 0" }}>Aucune run enregistrée pour l'instant.</div>
          ) : historique.songes.map(s => (
            <LigneSonge key={s.id} s={s}
              onSupprimer={setSongeASupprimer}
              onCorrigerVagueFinale={onCorrigerVagueFinale}
              onSupprimerDrop={onSupprimerDrop}
              onSelectObjet={onSelectObjet} />
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

  // Suppression/édition d'un songe ou d'un drop : implémentation unique
  // dans components/SongesPartages.jsx (supprimerSongeApi/corrigerVagueFinaleApi/
  // supprimerDropApi, chantier Historique general, 14 aout 2026), paramétrée
  // ici par ce que CETTE page doit rafraîchir après coup. HistoriquePage.jsx
  // appelle les mêmes fonctions avec son propre callback — ne pas dupliquer
  // la logique de fetch.
  const supprimerSonge = (id) => supprimerSongeApi(token, id, () => {
    if (dernierRunId === id) setDernierRunId(null)
    rafraichirStats(); rafraichirHistorique()
  })

  const supprimerDrop = (dropId) => supprimerDropApi(token, dropId, () => {
    rafraichirStats(); rafraichirHistorique()
  })

  // Rattrapage (chantier 1, passe 1b) : corrige UNIQUEMENT vague_finale sur
  // une run passée — rafraîchit l'historique ensuite, les bribes affichées
  // (calculées côté backend) se recalculent donc immédiatement.
  const corrigerVagueFinale = (runId, valeur) => corrigerVagueFinaleApi(token, runId, valeur, () => rafraichirHistorique())

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
