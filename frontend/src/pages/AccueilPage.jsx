import { useEffect, useRef, useState } from "react"

// Page d'accueil — refonte visuelle (30 juillet 2026). Port fidèle de
// maquette/dofura-maquette-v2.html (voir IDENTITE.md). Fichier séparé
// volontairement, même logique que pages/SongesPage.jsx : n'importe rien
// d'App.jsx, reçoit juste les callbacks de navigation dont elle a besoin.
//
// "Les Taux" a désormais une vraie page (TauxPage.jsx, cible "taux", 1er
// août 2026) — sa carte et le lien "Voir les taux relevés" y naviguent
// directement via onNav, comme "Le Registre des Songes"/"Le Grimoire".
// L'ancien mécanisme de défilement vers une bande d'intensités (supprimée le
// 31 juillet 2026) est retiré : plus besoin de scrollTauxSignal.

// Illustration 16:9 en haut d'une carte (retour Popo, 1er août 2026) — repli
// propre si le fichier n'existe pas encore : onError retire l'<img> du DOM
// plutôt que de laisser le navigateur afficher l'icône d'image cassée, le
// dégradé neutre de .card-art (pageAccueil.css) reste alors seul visible.
function CardArt({ src, alt }) {
  const [enErreur, setEnErreur] = useState(false)
  return (
    <div className="card-art">
      {!enErreur && <img src={src} alt={alt} loading="lazy" onError={() => setEnErreur(true)} />}
    </div>
  )
}

export default function AccueilPage({ onNav }) {
  const rootRef = useRef(null)
  const quoteRef = useRef(null)
  const [quoteVisible, setQuoteVisible] = useState(false)

  // Apparition au défilement (.rise) — même mécanique que la maquette
  // (IntersectionObserver, threshold .14, un seul déclenchement par
  // élément, délai en cascade par groupe de 3), portée en effet React.
  useEffect(() => {
    const els = rootRef.current.querySelectorAll(".rise")
    els.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 120 + "ms" })
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in")
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.14 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Chargement différé de l'image de la section citation (pas de balise
  // <img>, c'est un background-image CSS — loading="lazy" natif ne
  // s'applique pas, d'où cet IntersectionObserver dédié).
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setQuoteVisible(true); io.unobserve(entry.target) }
      })
    }, { rootMargin: "400px" })
    io.observe(quoteRef.current)
    return () => io.disconnect()
  }, [])

  return (
    <div className="df-home" ref={rootRef}>
      <header>
        <div className="plate" />
        <div className="hero-in">
          <div className="kicker"><i /><span>Le grimoire de Draconiros</span></div>
          <h1>Combien de songes<br />avant ta <em>légende</em> ?</h1>
          <p className="lede">Le maître des rêves consigne chaque descente dans le Registre des Songes. <b>Tes songes, tes drops, ta malchance</b> — et les taux que le jeu ne t'affiche jamais.</p>
          <div className="cta-row">
            <a href="#" className="cta" onClick={(e) => { e.preventDefault(); onNav("songes") }}>
              Ouvrir le Registre des Songes
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
            </a>
            <a href="#" className="cta-2" onClick={(e) => { e.preventDefault(); onNav("taux") }}>Voir les taux relevés</a>
          </div>
        </div>
      </header>

      <section className="stats-sec rise"><div className="wrap">
        <div className="figs">
          <div className="fig"><div className="n a">0,006 %</div><div className="l">une légende, par combat</div></div>
          <div className="fig"><div className="n g">350</div><div className="l">songes en team de 4</div></div>
          <div className="fig"><div className="n c">~500 h</div><div className="l">de jeu, en moyenne</div></div>
        </div>
        <p className="stats-note">Statistiques relevées en Paradoxe I</p>
      </div></section>

      <section className="outils-sec">
        {/* Artwork de fond (retour Popo, 31 juillet 2026, opacité/ancrage
            ajustés le 1er août) — même recette de masques en dégradé que
            .plate/.plate::after du hero, réorientée (fondu fort à DROITE au
            lieu du bas, fondus courts haut/bas au lieu d'un fondu vertical
            complet) : voir .outils-art::after dans pageAccueil.css. Masquée
            sous 900px, pointer-events désactivés. */}
        <div className="outils-art" aria-hidden="true" />
        <div className="wrap">
        <div className="sec-head rise">
          <div className="kicker"><i /><span>Ce que tu trouves ici</span></div>
          <h2>Trois outils, aucun bavardage</h2>
          <p>Pas un tutoriel de plus. Des chiffres, ton suivi, et de quoi vérifier un monstre en pleine salle.</p>
        </div>
        <div className="cards">
          <button type="button" className="card rise" style={{ "--c": "var(--df-cyan)" }} onClick={() => onNav("songes")}>
            <CardArt src="/assets/carte-registre.webp" alt="" />
            <div className="ic"><svg viewBox="0 0 24 24"><path d="M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-4-4-5-4-9z" /><path d="M8 21h8" /></svg></div>
            <h3>Le Registre des Songes</h3>
            <p>Un bouton par songe terminé. Le site compte pour toi et te dit depuis combien de songes tu n'as rien vu tomber.</p>
            <span className="go">Commencer →</span>
          </button>
          <button type="button" className="card rise" style={{ "--c": "var(--df-gold)" }} onClick={() => onNav("taux")}>
            <CardArt src="/assets/carte-taux.webp" alt="" />
            <div className="ic"><svg viewBox="0 0 24 24"><path d="M19 5 5 19" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg></div>
            <h3>Les Taux</h3>
            <p>Relevés en jeu, intensité par intensité, palier par palier. Personne d'autre ne les publie.</p>
            <span className="go">Consulter →</span>
          </button>
          <button type="button" className="card rise" style={{ "--c": "var(--df-violet)" }} onClick={() => onNav("grimoire")}>
            <CardArt src="/assets/carte-grimoire.webp" alt="" />
            <div className="ic"><svg viewBox="0 0 24 24"><path d="M4 5v14a2 2 0 0 1 2-2h14V3H6a2 2 0 0 0-2 2z" /><path d="M9 8h7" /></svg></div>
            <h3>Le Grimoire</h3>
            <p>Un doute sur un monstre, un sort, une recette de légende ? Recherche instantanée, sans quitter ton combat.</p>
            <span className="go">Feuilleter →</span>
          </button>
        </div>
        </div>
      </section>

      <section
        className="quote-sec"
        ref={quoteRef}
        style={quoteVisible ? { "--df-home-quote-img": "url(/assets/hero/draconiros-quote.webp)" } : undefined}
      >
        <div className="quote rise">
          <p>« Une source intarissable d'histoires, de fables, de légendes qui seront chantées ou murmurées jusqu'à la fin des temps. »</p>
          <span className="who">Draconiros, maître des Songes</span>
        </div>
      </section>
    </div>
  )
}
