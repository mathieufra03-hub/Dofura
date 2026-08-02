import { useState, useMemo, useEffect } from "react";

const GOLD = "#FFC63D";
const CYAN = "#4DD8E6";

// ===== Navigation =====
const NAV_FLAT = ["Équipements", "Métiers", "Donjons", "Bestiaire", "Quêtes"];
const ENCYCLO = ["Équipements", "Métiers", "Donjons", "Bestiaire"];

// ===== Grille des catégories =====
const CATS = [
  { t: "Équipements", d: "Armes, coiffes, capes... et leurs panoplies" },
  { t: "Métiers", d: "Récolte, craft et ressources" },
  { t: "Donjons", d: "Boss, salles, stratégies et succès" },
  { t: "Bestiaire", d: "Toutes les créatures, par zone et sous-zone" },
  { t: "Quêtes", d: "Étapes, prérequis et récompenses" },
  { t: "Carte interactive", d: "Positions des ressources et métiers", hover: true },
];

// ===== Recherche : suggestions de DÉMO =====
const SUGGESTIONS = [
  "Gelano — Anneau · niv. 60",
  "Coiffe du Bouftou — Coiffe · niv. 20",
  "Cape Bouffante — Cape · niv. 24",
  "Panoplie du Bouftou — Panoplie",
  "Donjon Bouftou — Donjon · niv. 20",
  "Bouftou Royal — Boss",
  "Dofus Émeraude — Dofus",
  "Amulette du Bouftou — Amulette · niv. 20",
];

// ===== Favoris de DÉMO — épinglés via la petite étoile ★ des pages Quêtes / Succès / Donjons =====
const FAVORIS = [
  { type: "Quête", n: "Éternelle Moisson" },
  { type: "Succès", n: "Bouftou Royal — Duo" },
  { type: "Donjon", n: "Donjon Bouftou" },
];

// ===== La Chasse aux Dofus =====
// Niveaux requis vérifiés (source DPLN, Dofus 3) — progression en % : DÉMO
const PRIMORDIAUX = [
  { n: "Émeraude", lv: 100, c: "#3FCF8A", p: 100 },
  { n: "Pourpre", lv: 110, c: "#E0485E", p: 65 },
  { n: "Turquoise", lv: 160, c: "#3FC9E0", p: 30 },
  { n: "Ocre", lv: 160, c: "#E8A33D", p: 12 },
  { n: "Ébène", lv: 180, c: "#6B5E8C", p: 0 },
  { n: "Ivoire", lv: 180, c: "#F0EBDD", p: 0 },
];
const AUTRES = [
  { n: "Dofawa", lv: 6, p: 100 },
  { n: "Dofus Argenté", lv: 20, p: 100 },
  { n: "Jyfus", lv: 20, p: 100 },
  { n: "Dofus Cacao", lv: 50, p: 100 },
  { n: "Dofus Cawotte", lv: 60, p: 100 },
  { n: "Dokoko", lv: 80, p: 100 },
  { n: "Dokille", lv: 80, p: 40 },
  { n: "Dofus des Veilleurs", lv: 100, p: 70 },
  { n: "Dolmanax", lv: 100, p: 100 },
  { n: "Dotruche", lv: 110, p: 0 },
  { n: "Domakuro", lv: 120, p: 25 },
  { n: "Dorigami", lv: 150, p: 0 },
  { n: "Dofoozbz", lv: 170, p: 0 },
  { n: "Dofus des Glaces", lv: 180, p: 100 },
  { n: "Dofus Nébuleux", lv: 180, p: 0 },
  { n: "Dofus Abyssal", lv: 180, p: 0 },
  { n: "Dofus Argenté Scintillant", lv: 180, p: 0 },
  { n: "Dofus Vulbis", lv: 180, p: 0 },
  { n: "Dofus Forgelave", lv: 180, p: 15 },
  { n: "Dofus Tacheté", lv: 180, p: 0 },
  { n: "Dofus du Cauchemar", lv: 180, p: 0 },
  { n: "Dom de Pin", lv: 180, p: 55 },
  { n: "Dofus Sylvestre", lv: 180, p: 0 },
];

const EGG_PATH =
  "M50 4 C74 4 92 44 92 78 C92 106 74 122 50 122 C26 122 8 106 8 78 C8 44 26 4 50 4 Z";

// Œuf-jauge : se remplit par le bas selon la progression (0% = contour vide, 100% = plein + halo)
// SUR LE VRAI SITE : chaque Dofus aura son image officielle (champ `img` depuis la base Dofura),
// affichée à la place de l'œuf SVG, avec la jauge en anneau ou en voile de remplissage par-dessus.
const EggFill = ({ id, color, p = 0, size = 44, glow = false }) => (
  <svg
    width={size}
    height={size * 1.26}
    viewBox="0 0 100 126"
    style={{
      filter: glow ? `drop-shadow(0 0 8px ${color})` : "none",
      flexShrink: 0,
      display: "block",
      margin: "0 auto",
    }}
  >
    <defs>
      <clipPath id={"clip-" + id}>
        <path d={EGG_PATH} />
      </clipPath>
    </defs>
    <path d={EGG_PATH} fill="rgba(27,33,56,0.9)" />
    <rect
      x="0"
      y={126 - 126 * (p / 100)}
      width="100"
      height={126 * (p / 100)}
      fill={color}
      clipPath={"url(#clip-" + id + ")"}
    />
    <path
      d={EGG_PATH}
      fill="none"
      stroke={p === 100 ? color : "rgba(154,163,189,0.5)"}
      strokeWidth="4"
    />
    <path
      d="M60 42 C72 52 72 72 60 80 C50 87 37 82 35 71"
      fill="none"
      stroke="rgba(12,15,29,0.45)"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);

export default function DofuraHomeV4() {
  const [version, setVersion] = useState("A");
  const [openMenu, setOpenMenu] = useState(null);
  const [query, setQuery] = useState("");
  const [logged, setLogged] = useState(true);
  const [hideDone, setHideDone] = useState(false);

  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.2 + 0.8,
        opacity: Math.random() * 0.55 + 0.2,
        delay: Math.random() * 6,
      })),
    []
  );

  useEffect(() => {
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Inter:wght@400;600;700&display=swap";
    document.head.appendChild(l);
    return () => {
      document.head.removeChild(l);
    };
  }, []);

  const toggleMenu = (e, name) => {
    e.stopPropagation();
    setOpenMenu(openMenu === name ? null : name);
  };

  const matches = query.trim()
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5)
    : [];

  const total = PRIMORDIAUX.length + AUTRES.length;
  const obtained = [...PRIMORDIAUX, ...AUTRES].filter((d) => d.p === 100).length;
  const visibleAutres = logged && hideDone ? AUTRES.filter((d) => d.p < 100) : AUTRES;
  const visiblePrim = logged && hideDone ? PRIMORDIAUX.filter((d) => d.p < 100) : PRIMORDIAUX;

  return (
    <div className="df-root">
      <style>{`
        .df-root {
          min-height: 100vh;
          background: #0C0F1D;
          font-family: 'Inter', system-ui, sans-serif;
          color: #E8EAF2;
          position: relative;
          overflow-x: hidden;
        }
        .df-nebula {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 720px 520px at 78% 12%, rgba(55,199,224,0.20), transparent 65%),
            radial-gradient(ellipse 700px 540px at 6% 42%, rgba(179,63,201,0.17), transparent 65%),
            radial-gradient(ellipse 620px 420px at 32% 2%, rgba(90,63,201,0.17), transparent 65%),
            radial-gradient(ellipse 600px 450px at 85% 78%, rgba(196,75,199,0.10), transparent 65%),
            radial-gradient(ellipse 550px 420px at 8% 92%, rgba(55,199,224,0.09), transparent 65%);
        }
        .df-star {
          position: absolute; border-radius: 50%; background: #fff; pointer-events: none;
          animation: df-twinkle 5s ease-in-out infinite;
        }
        @keyframes df-twinkle { 0%,100% { transform: scale(1); } 50% { transform: scale(0.6); } }

        .df-testbar {
          position: sticky; top: 0; z-index: 60;
          background: #05070F; border-bottom: 1px solid rgba(77,216,230,0.35);
          padding: 8px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .df-testlabel { font-size: 11px; letter-spacing: 1.5px; color: ${CYAN}; font-weight: 700; }
        .df-testbtn {
          background: transparent; color: #B8BFD6; border: 1px solid rgba(184,191,214,0.35);
          border-radius: 999px; padding: 5px 14px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; font-family: inherit;
        }
        .df-testbtn.on { color: #10131F; background: ${CYAN}; border-color: ${CYAN}; }

        .df-almanax {
          position: relative; z-index: 5;
          background: rgba(16,21,42,0.92); border-bottom: 1px solid rgba(255,198,61,0.2);
          padding: 9px 20px; display: flex; align-items: center; gap: 20px;
          font-size: 12.5px; overflow-x: auto; white-space: nowrap;
        }
        .df-almanax b.tag { color: ${GOLD}; letter-spacing: 1.5px; font-size: 12px; }
        .df-almanax .date { font-weight: 600; color: #E8EAF2; }
        .df-almanax .info { color: #B8BFD6; }
        .df-almanax .link { color: ${CYAN}; font-weight: 600; margin-left: auto; text-decoration: none; }

        .df-nav {
          position: relative; z-index: 50;
          background: rgba(14,19,34,0.85); border-bottom: 1px solid rgba(255,198,61,0.25);
          padding: 0 20px; display: flex; align-items: center; gap: 4px;
          min-height: 56px;
        }
        .df-links { display: flex; align-items: center; gap: 2px; flex: 1; overflow-x: auto; }
        .df-navitem { position: relative; }
        .df-navlink {
          background: none; border: none; color: #E8EAF2; font-size: 14.5px; font-family: inherit;
          padding: 18px 13px; cursor: pointer; white-space: nowrap; font-weight: 400;
        }
        .df-navlink:hover { color: ${GOLD}; }
        .df-navlink .car { font-size: 10px; color: ${CYAN}; margin-left: 4px; }
        .df-dd {
          position: absolute; top: 100%; left: 4px; min-width: 200px;
          background: #10152A; border: 1px solid rgba(255,198,61,0.3); border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.55), 0 0 22px rgba(77,216,230,0.12);
          padding: 6px; z-index: 100;
        }
        .df-dditem {
          display: block; width: 100%; text-align: left; background: none; border: none;
          color: #E8EAF2; font-size: 14px; font-family: inherit; padding: 9px 12px;
          border-radius: 8px; cursor: pointer;
        }
        .df-dditem:hover { background: rgba(77,216,230,0.1); color: ${GOLD}; }
        .df-cnx {
          margin-left: auto; background: rgba(255,198,61,0.08); color: ${GOLD};
          border: 1px solid rgba(255,198,61,0.7); border-radius: 10px; padding: 8px 18px;
          font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap;
        }
        .df-cnx:hover { background: rgba(255,198,61,0.18); }

        .df-hero { position: relative; z-index: 20; text-align: center; padding: 64px 16px 10px; }
        .df-title {
          font-family: 'Cinzel Decorative', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
          font-weight: 700;
          letter-spacing: 0.02em;
          font-size: clamp(46px, 9vw, 92px); line-height: 1.1; margin: 0;
          background: linear-gradient(180deg, #FFE08A 0%, #DE9B1F 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          -webkit-text-fill-color: transparent;
          display: inline-flex; align-items: baseline;
        }
        .df-egg-logo { height: 0.72em; width: auto; align-self: center; margin: 0 0.03em; transform: translateY(0.02em); }
        .df-sub { color: #B8BFD6; font-size: clamp(15px, 2.5vw, 21px); margin: 14px 0 38px; }

        .df-searchwrap { position: relative; width: min(680px, 94%); margin: 0 auto; z-index: 30; }
        .df-search {
          display: flex; align-items: center; gap: 12px;
          background: rgba(20,26,46,0.97); border: 2px solid rgba(77,216,230,0.85);
          border-radius: 999px; padding: 18px 26px;
          box-shadow: 0 0 34px rgba(77,216,230,0.38), 0 0 90px rgba(77,216,230,0.14);
          animation: df-pulse 3.2s ease-in-out infinite;
        }
        @keyframes df-pulse {
          0%,100% { box-shadow: 0 0 34px rgba(77,216,230,0.38), 0 0 90px rgba(77,216,230,0.14); }
          50% { box-shadow: 0 0 44px rgba(77,216,230,0.52), 0 0 110px rgba(77,216,230,0.2); }
        }
        .df-search input {
          flex: 1; background: none; border: none; outline: none; color: #E8EAF2;
          font-size: 16px; font-family: inherit; min-width: 0;
        }
        .df-search input::placeholder { color: #8B96B2; }
        .df-suggest {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0;
          background: #10152A; border: 1px solid rgba(77,216,230,0.4); border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.6); padding: 6px; text-align: left; z-index: 40;
        }
        .df-sugitem {
          display: block; width: 100%; text-align: left; background: none; border: none;
          color: #E8EAF2; font-size: 14.5px; font-family: inherit; padding: 11px 14px;
          border-radius: 10px; cursor: pointer;
        }
        .df-sugitem:hover { background: rgba(255,198,61,0.1); color: ${GOLD}; }
        .df-sugnote { font-size: 11px; color: #7F8AA6; padding: 6px 14px 8px; }

        .df-const { display: flex; align-items: center; width: min(440px, 76%); margin: 54px auto; }
        .df-cline { flex: 1; height: 1px; background: rgba(255,198,61,0.25); }
        .df-dofusdot {
          width: 9px; height: 12px; margin: 0 3px; display: block;
          border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%;
        }

        .df-section { position: relative; z-index: 5; max-width: 1240px; margin: 0 auto; padding: 0 20px 60px; }
        .df-stitle {
          font-size: clamp(22px, 3.5vw, 28px); font-weight: 700; margin: 0 0 24px;
          color: ${GOLD};
        }
        .df-chips { display: flex; flex-wrap: wrap; gap: 12px; }
        .df-chip {
          background: rgba(255,198,61,0.07); color: #E8EAF2;
          border: 1px solid rgba(255,198,61,0.4); border-radius: 999px;
          padding: 10px 20px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: all 0.15s ease;
        }
        .df-chip:hover {
          background: rgba(255,198,61,0.16); border-color: ${GOLD}; color: ${GOLD};
          box-shadow: 0 0 16px rgba(255,198,61,0.25);
        }

        .df-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 22px; }
        .df-card {
          background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2);
          border-radius: 16px; padding: 26px; cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .df-card:hover {
          transform: translateY(-3px); border-color: rgba(255,198,61,0.9);
          box-shadow: 0 0 26px rgba(255,198,61,0.28);
        }
        .df-card.lit {
          background: rgba(22,29,51,0.96); border-color: rgba(255,198,61,0.9); border-width: 1.5px;
          box-shadow: 0 0 26px rgba(255,198,61,0.3);
        }
        .df-ct { color: ${GOLD}; font-size: 19px; font-weight: 700; margin: 0 0 8px; }
        .df-cd { color: #B8BFD6; font-size: 13.5px; margin: 0 0 18px; }
        .df-cl { color: ${CYAN}; font-size: 13.5px; font-weight: 600; }

        .df-hunt-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 6px; }
        .df-counter {
          background: rgba(255,198,61,0.1); border: 1px solid rgba(255,198,61,0.5);
          color: ${GOLD}; font-weight: 700; font-size: 14px;
          border-radius: 999px; padding: 6px 16px;
        }
        .df-hidetoggle {
          display: flex; align-items: center; gap: 8px; color: #B8BFD6; font-size: 13px;
          cursor: pointer; user-select: none; margin-left: auto;
        }
        .df-hidetoggle input { accent-color: ${GOLD}; width: 15px; height: 15px; cursor: pointer; }
        .df-huntnote { color: #7F8AA6; font-size: 12px; margin: 0 0 26px; }

        .df-subtitle { color: #E8EAF2; font-size: 16px; font-weight: 600; margin: 26px 0 16px; letter-spacing: 0.5px; }
        .df-primrow { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 14px; }
        .df-eggsgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); gap: 12px; margin-top: 4px; }
        .df-eggsq {
          background: rgba(20,26,46,0.9); border: 1px solid rgba(255,198,61,0.15);
          border-radius: 14px; padding: 14px 8px 12px; text-align: center; cursor: pointer;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .df-eggsq:hover { transform: translateY(-2px); border-color: rgba(255,198,61,0.7); box-shadow: 0 0 16px rgba(255,198,61,0.2); }
        .df-eggsq.done { border-color: rgba(255,198,61,0.75); box-shadow: 0 0 16px rgba(255,198,61,0.22); }
        .df-eggname { font-size: 12.5px; font-weight: 700; color: #E8EAF2; margin: 9px 0 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .df-eggname.small { font-size: 11.5px; font-weight: 600; }
        .df-eggniv { font-size: 10.5px; color: #7F8AA6; }
        .df-pct { font-size: 11.5px; font-weight: 700; color: ${GOLD}; margin-top: 5px; }
        .df-pct.small { font-size: 11px; }
        .df-pct.zero { color: #5B6480; }

        .df-lockcard {
          background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2);
          border-radius: 16px; padding: 22px 26px; max-width: 620px; margin-bottom: 26px;
        }

        .df-footer {
          position: relative; z-index: 5; border-top: 1px solid rgba(255,198,61,0.15);
          padding: 26px 16px; text-align: center; color: #7F8AA6; font-size: 12.5px;
        }

        @media (prefers-reduced-motion: reduce) {
          .df-star { animation: none; }
          .df-search { animation: none; }
          .df-card, .df-eggsq { transition: none; }
          .df-card:hover, .df-eggsq:hover { transform: none; }
        }
      `}</style>

      <div className="df-nebula" />
      {stars.map((s) => (
        <div
          key={s.id}
          className="df-star"
          style={{
            left: s.left + "%",
            top: s.top + "%",
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: s.delay + "s",
          }}
        />
      ))}

      {/* ---- Barre de test ---- */}
      <div className="df-testbar">
        <span className="df-testlabel">🧪 MAQUETTE TEST — v4</span>
        <button className={"df-testbtn" + (version === "A" ? " on" : "")} onClick={() => setVersion("A")}>
          Version A — menu à plat
        </button>
        <button className={"df-testbtn" + (version === "B" ? " on" : "")} onClick={() => setVersion("B")}>
          Version B — menus déroulants
        </button>
        <button className="df-testbtn" onClick={() => setLogged(!logged)}>
          {logged ? "👤 simuler : déconnecté" : "👤 simuler : connecté"}
        </button>
      </div>

      {/* ---- Barre Almanax ---- */}
      <div className="df-almanax">
        <b className="tag">ALMANAX</b>
        <span className="date">Vendredi 10 juillet</span>
        <span className="info">Bonus du jour : +20 % XP métiers</span>
        <span className="info">Offrande : 3 × Gelée Bleutée</span>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>
          Voir l'Almanax →
        </a>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="df-nav">
        {version === "A" ? (
          <div className="df-links">
            {NAV_FLAT.map((l) => (
              <div className="df-navitem" key={l}>
                <button className="df-navlink">{l}</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="df-links">
            <div className="df-navitem">
              <button className="df-navlink" onClick={(e) => toggleMenu(e, "ency")}>
                Encyclopédie <span className="car">▼</span>
              </button>
              {openMenu === "ency" && (
                <div className="df-dd" onClick={(e) => e.stopPropagation()}>
                  {ENCYCLO.map((i) => (
                    <button className="df-dditem" key={i}>
                      {i}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="df-navitem">
              <button className="df-navlink">Quêtes</button>
            </div>
          </div>
        )}
        <button className="df-cnx">Connexion</button>
      </nav>

      {/* ---- Hero ---- */}
      <header className="df-hero">
        <h1 className="df-title">
          D
          <svg className="df-egg-logo" viewBox="0 0 100 126" aria-label="O">
            <defs>
              <linearGradient id="eggGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFE08A" />
                <stop offset="1" stopColor="#DE9B1F" />
              </linearGradient>
            </defs>
            <path
              d="M50 4 C74 4 92 44 92 78 C92 106 74 122 50 122 C26 122 8 106 8 78 C8 44 26 4 50 4 Z"
              fill="url(#eggGold)"
            />
            <path
              d="M60 42 C72 52 72 72 60 80 C50 87 37 82 35 71"
              fill="none"
              stroke="#0C0F1D"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
          FURA
        </h1>
        <p className="df-sub">L'encyclopédie Dofus 3.0</p>

        <div className="df-searchwrap">
          <div className="df-search">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.4" stroke={CYAN} strokeWidth="2" />
              <line x1="11" y1="11" x2="15" y2="15" stroke={CYAN} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Rechercher un item, une panoplie, un donjon..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {matches.length > 0 && (
            <div className="df-suggest">
              {matches.map((m) => (
                <button className="df-sugitem" key={m} onClick={() => setQuery("")}>
                  {m}
                </button>
              ))}
              <div className="df-sugnote">Suggestions de démo — tape "bouftou" ou "dofus" pour tester</div>
            </div>
          )}
        </div>
      </header>

      {/* ---- Séparateur : les six Dofus emblématiques ---- */}
      <div className="df-const" aria-hidden="true">
        <span className="df-cline" />
        {PRIMORDIAUX.map((d, i) => (
          <span key={d.n} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && <span className="df-cline" style={{ width: 60 }} />}
            <span
              className="df-dofusdot"
              title={"Dofus " + d.n}
              style={{ background: d.c, boxShadow: "0 0 8px " + d.c }}
            />
          </span>
        ))}
        <span className="df-cline" />
      </div>

      {/* ---- Mes favoris ---- */}
      <section className="df-section">
        <h2 className="df-stitle">Mes favoris</h2>
        {logged ? (
          <>
            <div className="df-chips">
              {FAVORIS.map((f) => (
                <button className="df-chip" key={f.n}>
                  <span style={{ color: GOLD, marginRight: 8 }}>★</span>
                  <span style={{ color: "#8B96B2", marginRight: 6, fontWeight: 400 }}>{f.type} ·</span>
                  {f.n}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <span className="df-cl" style={{ cursor: "pointer" }}>
                Tous mes favoris dans mon espace →
              </span>
            </div>
          </>
        ) : (
          <div className="df-card" style={{ cursor: "default", maxWidth: 560 }}>
            <p className="df-cd" style={{ margin: 0, fontSize: 14.5 }}>
              Connecte-toi pour retrouver ici tes quêtes en cours, tes succès visés et tes items
              favoris — épinglés en un clic depuis n'importe quelle page.
            </p>
            <button className="df-cnx" style={{ marginLeft: 0, marginTop: 18 }}>
              Connexion
            </button>
          </div>
        )}
      </section>

      {/* ---- Grille des catégories ---- */}
      <section className="df-section">
        <h2 className="df-stitle">Explorer l'encyclopédie</h2>
        <div className="df-grid">
          {CATS.map((c) => (
            <div className={"df-card" + (c.hover ? " lit" : "")} key={c.t}>
              <h3 className="df-ct">{c.t}</h3>
              <p className="df-cd">{c.d}</p>
              <span className="df-cl">Explorer →</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---- La Chasse aux Dofus ---- */}
      <section className="df-section">
        <div className="df-hunt-head">
          <h2 className="df-stitle" style={{ margin: 0 }}>
            La Chasse aux Dofus
          </h2>
          {logged && (
            <span className="df-counter">
              {obtained} / {total} Dofus
            </span>
          )}
          {logged && (
            <label className="df-hidetoggle">
              <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
              Masquer les Dofus obtenus
            </label>
          )}
        </div>
        <p className="df-huntnote">
          {logged
            ? "Clique sur un Dofus pour voir ses quêtes, ses succès et cocher tes étapes. (Progression de démo)"
            : ""}
        </p>

        {!logged && (
          <div className="df-lockcard">
            <p className="df-cd" style={{ margin: 0, fontSize: 14.5 }}>
              Tous les Dofus du jeu sont là. Connecte-toi pour suivre ta progression : chaque
              œuf se remplit au fil des quêtes et succès que tu coches.
            </p>
            <button className="df-cnx" style={{ marginLeft: 0, marginTop: 18 }}>
              Connexion
            </button>
          </div>
        )}

        <div className="df-subtitle">⭐ Les six Primordiaux</div>
        <div className="df-primrow">
          {visiblePrim.map((d) => (
            <div className={"df-eggsq" + (logged && d.p === 100 ? " done" : "")} key={d.n}>
              <EggFill
                id={d.n.replace(/[^a-zA-Z0-9]/g, "")}
                color={d.c}
                p={logged ? d.p : 0}
                size={54}
                glow={logged && d.p === 100}
              />
              <div className="df-eggname">{d.n}</div>
              <div className="df-eggniv">Niv. {d.lv}</div>
              {logged && (
                <div className={"df-pct" + (d.p === 0 ? " zero" : "")}>
                  {d.p === 100 ? "✓ Obtenu" : d.p + " %"}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="df-subtitle">Tous les autres Dofus — triés par niveau requis</div>
        <div className="df-eggsgrid">
          {visibleAutres.map((d) => (
            <div className={"df-eggsq" + (logged && d.p === 100 ? " done" : "")} key={d.n}>
              <EggFill
                id={d.n.replace(/[^a-zA-Z0-9]/g, "")}
                color="#C9A24B"
                p={logged ? d.p : 0}
                size={38}
                glow={logged && d.p === 100}
              />
              <div className="df-eggname small">{d.n}</div>
              <div className="df-eggniv">Niv. {d.lv}</div>
              {logged && (
                <div className={"df-pct small" + (d.p === 0 ? " zero" : "")}>
                  {d.p === 100 ? "✓" : d.p + " %"}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="df-footer">
        DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games.
      </footer>
    </div>
  );
}
