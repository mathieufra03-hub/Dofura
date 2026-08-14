import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { IconeCoffre } from "../components/IconesSonges.jsx"
import {
  authHeaders, ORDRE_CATEGORIES, CATEGORIE_LABELS, sp,
  LigneSonge, ModaleSuppressionSonge,
  supprimerSongeApi, corrigerVagueFinaleApi, supprimerDropApi,
} from "../components/SongesPartages.jsx"

// Annuaire chronologique complet des songes du compte (chantier Historique
// general, 14 aout 2026) — complement de l'aperçu 5-derniers dans L'Oeil
// (SongesPage.jsx). Meme fond de page (.df-songes), meme composant de
// ligne (LigneSonge) et meme modale de suppression que L'Oeil : voir
// components/SongesPartages.jsx, une seule implementation partagee.
//
// Etat (page/toggle "Mes drops"/categorie) entierement dans l'URL via
// useSearchParams (contrainte technique #1 du chantier) : un aller-retour
// vers une fiche objet (overlay /objets/:id) et retour ne fait PAS perdre
// la page ou le filtre en cours — c'est precisement ce que le chantier
// react-router avait pour but d'eviter (voir App.jsx, commentaire
// AppInterne).
const API = import.meta.env.VITE_API_URL || "http://localhost:8000"
const PAGE_SIZE = 20

export default function HistoriquePage({ token, onSelectObjet, onBack }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get("page")) || 1, 1)
  const mesDrops = searchParams.get("drops") === "1"
  const categorieBrute = searchParams.get("type") || ""
  const categorie = ORDRE_CATEGORIES.includes(categorieBrute) ? categorieBrute : ""

  const [donnees, setDonnees] = useState({ total: 0, songes: [] })
  const [chargement, setChargement] = useState(true)
  const [songeASupprimer, setSongeASupprimer] = useState(null)

  const rafraichir = () => {
    if (!token) return
    setChargement(true)
    const params = new URLSearchParams({ page, page_size: PAGE_SIZE })
    if (mesDrops) params.set("mes_drops", "1")
    if (categorie) params.set("categorie", categorie)
    fetch(`${API}/songes/historique?${params}`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(d => { setDonnees(d); setChargement(false) })
  }

  useEffect(() => rafraichir(), [token, page, mesDrops, categorie]) // eslint-disable-line

  const totalPages = Math.max(Math.ceil((donnees.total || 0) / PAGE_SIZE), 1)

  // Filtre change -> retour page 1 (les resultats different, la page en
  // cours peut ne plus exister). Page directement demandee -> juste changer
  // page dans l'URL.
  const allerPage = (p) => {
    const next = new URLSearchParams(searchParams)
    next.set("page", String(p))
    setSearchParams(next)
  }
  const toggleMesDrops = () => {
    const next = new URLSearchParams(searchParams)
    if (mesDrops) next.delete("drops"); else next.set("drops", "1")
    next.set("page", "1")
    setSearchParams(next)
  }
  const changerCategorie = (c) => {
    const next = new URLSearchParams(searchParams)
    if (c) next.set("type", c); else next.delete("type")
    next.set("page", "1")
    setSearchParams(next)
  }

  // Filet de securite : si la page demandee n'existe plus (ex. dernier
  // songe d'une page supprime), retombe sur la derniere page valide plutot
  // que d'afficher une page vide.
  useEffect(() => {
    if (!chargement && page > totalPages) allerPage(totalPages)
  }, [chargement, page, totalPages]) // eslint-disable-line

  const supprimerSonge = (id) => supprimerSongeApi(token, id, rafraichir)
  const corrigerVagueFinale = (runId, valeur) => corrigerVagueFinaleApi(token, runId, valeur, rafraichir)
  const supprimerDrop = (dropId) => supprimerDropApi(token, dropId, rafraichir)

  if (!token) {
    return (
      <div className="df-songes">
        <div style={sp.page}>
          <button onClick={onBack} style={sp.backBtn}>← Retour</button>
          <div style={{ ...sp.card, textAlign: "center", padding: "3rem 1.5rem" }}>
            <h1 className="df-section-title" style={{ fontSize: 22, margin: "0 0 10px" }}>Historique des songes</h1>
            <p style={{ color: "var(--df-text-2)", fontSize: 14, margin: 0 }}>
              Connecte-toi pour consulter l'historique de tes songes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="df-songes">
      <div style={sp.page}>
        <button onClick={onBack} style={sp.backBtn}>← Retour</button>
        <h1 className="df-section-title" style={{ fontSize: 20, margin: "0 0 14px" }}>Historique des songes</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <span onClick={() => changerCategorie("")} className="df-hover-lift" style={sp.pill(categorie === "")}>Tous</span>
          {ORDRE_CATEGORIES.map(c => (
            <span key={c} onClick={() => changerCategorie(c)} className="df-hover-lift" style={sp.pill(categorie === c)}>
              {CATEGORIE_LABELS[c]}
            </span>
          ))}
          <span onClick={toggleMesDrops} className="df-hover-lift"
            style={{ ...sp.pill(mesDrops), marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconeCoffre size={13} /> Mes drops
          </span>
        </div>

        {chargement ? (
          <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Chargement...</div>
        ) : donnees.songes.length === 0 ? (
          <div style={{ color: "var(--df-text-3)", fontSize: 13, padding: "20px 0" }}>Aucun songe ne correspond.</div>
        ) : (
          donnees.songes.map(s => (
            <LigneSonge key={s.id} s={s}
              onSupprimer={setSongeASupprimer}
              onCorrigerVagueFinale={corrigerVagueFinale}
              onSupprimerDrop={supprimerDrop}
              onSelectObjet={onSelectObjet} />
          ))
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 16 }}>
            <button disabled={page <= 1} onClick={() => allerPage(page - 1)} className="df-hover-lift" style={{ ...sp.btnFantome, opacity: page <= 1 ? 0.5 : 1 }}>← Précédent</button>
            <span style={{ fontSize: 12, color: "var(--df-text-2)" }}>Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => allerPage(page + 1)} className="df-hover-lift" style={{ ...sp.btnFantome, opacity: page >= totalPages ? 0.5 : 1 }}>Suivant →</button>
          </div>
        )}
      </div>
      {songeASupprimer && (
        <ModaleSuppressionSonge songe={songeASupprimer}
          onAnnuler={() => setSongeASupprimer(null)}
          onConfirmer={() => { supprimerSonge(songeASupprimer.id); setSongeASupprimer(null) }} />
      )}
    </div>
  )
}
