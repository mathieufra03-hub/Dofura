import { useEffect, useRef, useState } from "react"

// Page d'accueil — refonte visuelle (30 juillet 2026). Port fidèle de
// maquette/dofura-maquette-v2.html (voir IDENTITE.md). Fichier séparé
// volontairement, même logique que pages/SongesPage.jsx : n'importe rien
// d'App.jsx, reçoit juste les callbacks de navigation dont elle a besoin.
//
// "Les Taux" n'a pas encore de page dédiée (chantier futur) — son entrée de
// nav et ses deux liens sur cette page pointent donc pour l'instant vers la
// bande "Dix intensités" plus bas sur cette même page, plutôt que vers une
// route inventée. scrollTauxSignal (prop) est un compteur incrémenté par
// App.jsx à chaque clic sur "Les Taux" dans la navbar, pour pouvoir
// redéclencher le défilement même si on est déjà sur cette page.

export default function AccueilPage({ onNav, scrollTauxSignal }) {
  const rootRef = useRef(null)
  const quoteRef = useRef(null)
  const [quoteVisible, setQuoteVisible] = useState(false)

  useEffect(() => {
    if (!scrollTauxSignal) return
    document.getElementById("df-home-tiers")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [scrollTauxSignal])

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

  const allerAuxTaux = (e) => {
    e.preventDefault()
    document.getElementById("df-home-tiers")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="df-home" ref={rootRef}>
      <header>
        <div className="plate" />
        <div className="hero-in">
          <div className="kicker"><i /><span>Le grimoire de Draconiros</span></div>
          <h1>Combien de songes<br />avant ta <em>légende</em> ?</h1>
          <p className="lede">Le maître des rêves consigne chaque descente dans le Puits. <b>Tes songes, tes drops, ta malchance</b> — et les taux que le jeu ne t'affiche jamais.</p>
          <div className="cta-row">
            <a href="#" className="cta" onClick={(e) => { e.preventDefault(); onNav("songes") }}>
              Ouvrir le Puits
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
            </a>
            <a href="#" className="cta-2" onClick={allerAuxTaux}>Voir les taux relevés</a>
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

      <section><div className="wrap">
        <div className="sec-head rise">
          <div className="kicker"><i /><span>Ce que tu trouves ici</span></div>
          <h2>Trois outils, aucun bavardage</h2>
          <p>Pas un tutoriel de plus. Des chiffres, ton suivi, et de quoi vérifier un monstre en pleine salle.</p>
        </div>
        <div className="cards">
          <button type="button" className="card rise" style={{ "--c": "var(--df-cyan)" }} onClick={() => onNav("songes")}>
            <div className="ic"><svg viewBox="0 0 24 24"><path d="M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-4-4-5-4-9z" /><path d="M8 21h8" /></svg></div>
            <h3>Le Puits</h3>
            <p>Un bouton par songe terminé. Le site compte pour toi et te dit depuis combien de songes tu n'as rien vu tomber.</p>
            <span className="go">Commencer →</span>
          </button>
          <button type="button" className="card rise" style={{ "--c": "var(--df-gold)" }} onClick={allerAuxTaux}>
            <div className="ic"><svg viewBox="0 0 24 24"><path d="M19 5 5 19" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg></div>
            <h3>Les Taux</h3>
            <p>Relevés en jeu, intensité par intensité, palier par palier. Personne d'autre ne les publie.</p>
            <span className="go">Consulter →</span>
          </button>
          <button type="button" className="card rise" style={{ "--c": "var(--df-violet)" }} onClick={() => onNav("grimoire")}>
            <div className="ic"><svg viewBox="0 0 24 24"><path d="M4 5v14a2 2 0 0 1 2-2h14V3H6a2 2 0 0 0-2 2z" /><path d="M9 8h7" /></svg></div>
            <h3>Le Grimoire</h3>
            <p>Un doute sur un monstre, un sort, une recette de légende ? Recherche instantanée, sans quitter ton combat.</p>
            <span className="go">Feuilleter →</span>
          </button>
        </div>
      </div></section>

      <section className="band" id="df-home-tiers"><div className="wrap">
        <div className="sec-head rise">
          <div className="kicker"><i /><span>Dix intensités</span></div>
          <h2>Du Rêve au Cauchemar</h2>
          <p>Chaque intensité a ses propres taux. Une run correspond à un songe complet, du palier I jusqu'au combat final — dans l'outil, on ne dit que "songe", mais une légende en Paradoxe I et en Cauchemar III, ce n'est pas la même histoire.</p>
        </div>
        <div className="tiers">
          <div className="tier rise" style={{ "--c": "var(--df-reve)" }}>
            <div className="t">Rêve</div>
            <div className="d">Tu joues pour te détendre, sans prise de tête. Viens rêver dans les bras de Draconiros.</div>
            <div className="m">50 % → 100 % de butin</div>
          </div>
          <div className="tier rise" style={{ "--c": "var(--df-violet)" }}>
            <div className="t">Paradoxe</div>
            <div className="d">Tu veux du butin sans y laisser ta soirée. C'est ici que la communauté farme.</div>
            <div className="m">120 % → 190 % de butin</div>
          </div>
          <div className="tier rise" style={{ "--c": "var(--df-cauchemar)" }}>
            <div className="t">Cauchemar</div>
            <div className="d">Tu aimes perdre à la salle 24. Draconiros aussi.</div>
            <div className="m">220 % → 300 % de butin</div>
          </div>
        </div>
      </div></section>

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
