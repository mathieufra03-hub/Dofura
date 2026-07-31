// Page "/comprendre" (1er août 2026) — structure vide demandée par Popo :
// routée et accessible (cible "comprendre" dans App.jsx, via la carte
// "Comprendre les Songes" de l'accueil), volontairement PAS dans la barre
// de nav. Contenu réel à venir plus tard — pas de placeholder trompeur
// au-delà d'un simple avis de page en rédaction (règle 13 : ne rien
// inventer tant que le contenu n'existe pas).
const cp = {
  page: { padding: "1.5rem 1.25rem 3rem", maxWidth: 720, margin: "0 auto" },
  backBtn: { background: "transparent", border: "1px solid var(--df-border-cyan)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--df-cyan)", cursor: "pointer", marginBottom: 18 },
}

export default function ComprendrePage({ onBack }) {
  return (
    <div style={cp.page}>
      <button onClick={onBack} style={cp.backBtn}>← Retour</button>
      <h1 className="df-section-title" style={{ fontSize: 20, margin: "0 0 10px" }}>Comprendre les Songes</h1>
      <p style={{ color: "var(--df-text-2)", fontSize: 14 }}>Page en cours de rédaction.</p>
    </div>
  )
}
