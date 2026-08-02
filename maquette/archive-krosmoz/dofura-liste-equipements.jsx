import { useState, useMemo, useEffect } from "react";

const GOLD = "#FFC63D";
const CYAN = "#4DD8E6";

// ============================================================
// DONNÉES D'EXEMPLE (13 items) — le vrai site lira la base Dofura
// Stats simplifiées pour tester les filtres et le tri
// ============================================================
const ITEMS = [
  { n: "Coiffe du Bouftou", lv: 20, t: "Coiffe", fx: ["+25 Force", "+20 Vitalité"], pano: true, leg: false },
  { n: "Cape de Bouftou", lv: 20, t: "Cape", fx: ["+18 Force", "+15 Vitalité"], pano: true, leg: false },
  { n: "Amulette du Bouftou", lv: 20, t: "Amulette", fx: ["+15 Vitalité", "+8 Force"], pano: true, leg: false },
  { n: "Marteau du Bouftou", lv: 20, t: "Marteau", fx: ["+12 Force", "+10 Vitalité"], pano: true, leg: false },
  { n: "Bottes du Bouftou", lv: 20, t: "Bottes", fx: ["+12 Vitalité", "+6 Force"], pano: true, leg: false },
  { n: "Ceinture du Bouftou", lv: 20, t: "Ceinture", fx: ["+14 Vitalité"], pano: true, leg: false },
  { n: "Coiffe du Tofu", lv: 30, t: "Coiffe", fx: ["+22 Agilité", "+15 Vitalité"], pano: true, leg: false },
  { n: "Cape du Tofu", lv: 30, t: "Cape", fx: ["+18 Agilité", "+10 Vitalité"], pano: true, leg: false },
  { n: "Gelano", lv: 60, t: "Anneau", fx: ["+1 PA"], pano: false, leg: false },
  { n: "Solomonk", lv: 101, t: "Coiffe", fx: ["+35 Sagesse", "+25 Vitalité"], pano: false, leg: false },
  { n: "Anneau des Veilleurs", lv: 120, t: "Anneau", fx: ["+40 Intelligence", "+30 Vitalité"], pano: false, leg: false },
  { n: "Cape du Comte Harebourg", lv: 200, t: "Cape", fx: ["+70 Intelligence", "+50 Vitalité"], pano: true, leg: false },
  { n: "Coiffe du Comte Harebourg", lv: 200, t: "Coiffe", fx: ["+80 Intelligence", "+60 Vitalité", "+1 PA"], pano: true, leg: true },
];

const TYPES = ["Coiffe", "Cape", "Amulette", "Anneau", "Bottes", "Ceinture", "Marteau"];
const EFFETS = ["Force", "Agilité", "Intelligence", "Vitalité", "Sagesse", "PA"];

export default function DofuraListeEquipements() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("az");
  const [types, setTypes] = useState([]);
  const [lvMin, setLvMin] = useState(1);
  const [lvMax, setLvMax] = useState(200);
  const [fx, setFx] = useState([]);
  const [pano, setPano] = useState(false);
  const [leg, setLeg] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tip, setTip] = useState(null);

  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.2 + 0.8,
        opacity: Math.random() * 0.5 + 0.2,
      })),
    []
  );

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

  useEffect(() => {
    const close = () => setTip(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const results = useMemo(() => {
    let r = ITEMS.filter((it) => {
      if (q.trim() && !it.n.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (types.length && !types.includes(it.t)) return false;
      if (it.lv < lvMin || it.lv > lvMax) return false;
      if (fx.length && !fx.every((f) => it.fx.some((e) => e.includes(f)))) return false;
      if (pano && !it.pano) return false;
      if (leg && !it.leg) return false;
      return true;
    });
    if (sort === "lvl-desc") r.sort((a, b) => b.lv - a.lv);
    if (sort === "lvl-asc") r.sort((a, b) => a.lv - b.lv);
    if (sort === "az") r.sort((a, b) => a.n.localeCompare(b.n));
    if (sort === "type") r.sort((a, b) => a.t.localeCompare(b.t) || b.lv - a.lv);
    return r;
  }, [q, sort, types, lvMin, lvMax, fx, pano, leg]);

  const groups = useMemo(() => {
    const keyOf = (it) =>
      sort === "az"
        ? it.n.charAt(0).toUpperCase()
        : sort === "type"
        ? it.t
        : "Niv. " + (Math.floor((it.lv - 1) / 50) * 50 + 1) + " – " + (Math.floor((it.lv - 1) / 50) * 50 + 50);
    const g = [];
    results.forEach((it) => {
      const k = keyOf(it);
      const last = g[g.length - 1];
      if (last && last.k === k) last.items.push(it);
      else g.push({ k, items: [it] });
    });
    return g;
  }, [results, sort]);

  const activeChips = [
    ...types.map((t) => ({ label: t, off: () => toggle(types, setTypes, t) })),
    ...(lvMin > 1 || lvMax < 200
      ? [{ label: `Niv. ${lvMin}-${lvMax}`, off: () => { setLvMin(1); setLvMax(200); } }]
      : []),
    ...fx.map((f) => ({ label: f, off: () => toggle(fx, setFx, f) })),
    ...(pano ? [{ label: "Avec panoplie", off: () => setPano(false) }] : []),
    ...(leg ? [{ label: "Légendaire", off: () => setLeg(false) }] : []),
  ];

  const nbFiltres = activeChips.length;

  return (
    <div className="le-root">
      <style>{`
        .le-root {
          min-height: 100vh; background: #0C0F1D;
          font-family: 'Inter', system-ui, sans-serif; color: #E8EAF2;
          position: relative; overflow-x: hidden;
        }
        .le-nebula {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 720px 520px at 82% 6%, rgba(55,199,224,0.16), transparent 65%),
            radial-gradient(ellipse 700px 540px at 2% 40%, rgba(179,63,201,0.13), transparent 65%),
            radial-gradient(ellipse 620px 420px at 45% 0%, rgba(90,63,201,0.13), transparent 65%);
        }
        .le-star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }

        .le-testbar {
          position: sticky; top: 0; z-index: 60;
          background: #05070F; border-bottom: 1px solid rgba(77,216,230,0.35);
          padding: 8px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .le-testlabel { font-size: 11px; letter-spacing: 1.5px; color: ${CYAN}; font-weight: 700; }
        .le-testnote { font-size: 11px; color: #7F8AA6; }

        .le-almanax {
          position: relative; z-index: 5;
          background: rgba(16,21,42,0.92); border-bottom: 1px solid rgba(255,198,61,0.2);
          padding: 9px 20px; display: flex; align-items: center; gap: 20px;
          font-size: 12.5px; overflow-x: auto; white-space: nowrap;
        }
        .le-almanax b { color: ${GOLD}; letter-spacing: 1.5px; font-size: 12px; }
        .le-almanax .info { color: #B8BFD6; }
        .le-almanax .link { color: ${CYAN}; font-weight: 600; margin-left: auto; text-decoration: none; }

        .le-nav {
          position: relative; z-index: 50;
          background: rgba(14,19,34,0.85); border-bottom: 1px solid rgba(255,198,61,0.25);
          padding: 0 20px; display: flex; align-items: center; min-height: 54px;
        }
        .le-links { display: flex; align-items: center; gap: 2px; flex: 1; overflow-x: auto; }
        .le-navlink {
          background: none; border: none; color: #E8EAF2; font-size: 14.5px; font-family: inherit;
          padding: 17px 13px; cursor: pointer; white-space: nowrap;
        }
        .le-navlink:hover { color: ${GOLD}; }
        .le-navlink.on { color: ${GOLD}; font-weight: 600; }
        .le-cnx {
          margin-left: auto; background: rgba(255,198,61,0.08); color: ${GOLD};
          border: 1px solid rgba(255,198,61,0.7); border-radius: 10px; padding: 8px 18px;
          font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap;
        }

        .le-page { position: relative; z-index: 10; max-width: 1240px; margin: 0 auto; padding: 26px 20px 60px; }
        .le-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
        .le-title {
          font-size: clamp(24px, 4vw, 32px); font-weight: 700; margin: 0; color: ${GOLD};
        }
        .le-count { color: #7F8AA6; font-size: 13.5px; }

        .le-tools { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .le-search {
          flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px;
          background: rgba(20,26,46,0.95); border: 1px solid rgba(77,216,230,0.5);
          border-radius: 12px; padding: 11px 16px;
        }
        .le-search input {
          flex: 1; background: none; border: none; outline: none; color: #E8EAF2;
          font-size: 14px; font-family: inherit; min-width: 0;
        }
        .le-search input::placeholder { color: #7F8AA6; }
        .le-select {
          background: rgba(20,26,46,0.95); color: #E8EAF2;
          border: 1px solid rgba(255,198,61,0.35); border-radius: 12px;
          padding: 11px 14px; font-size: 13.5px; font-family: inherit; cursor: pointer;
        }
        .le-fbtn {
          display: none;
          background: rgba(255,198,61,0.08); color: ${GOLD};
          border: 1px solid rgba(255,198,61,0.6); border-radius: 12px;
          padding: 11px 16px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
        }

        .le-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .le-chip {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,198,61,0.1); color: ${GOLD};
          border: 1px solid rgba(255,198,61,0.5); border-radius: 999px;
          padding: 6px 8px 6px 14px; font-size: 12.5px; font-weight: 600;
          font-family: inherit; cursor: pointer;
        }
        .le-chip .x {
          background: rgba(255,198,61,0.2); border-radius: 50%; width: 18px; height: 18px;
          display: inline-flex; align-items: center; justify-content: center; font-size: 11px;
        }
        .le-clear { background: none; border: none; color: #7F8AA6; font-size: 12.5px; font-family: inherit; cursor: pointer; text-decoration: underline; }

        .le-wrap { display: grid; grid-template-columns: 260px 1fr; gap: 22px; align-items: start; }
        @media (max-width: 900px) {
          .le-wrap { grid-template-columns: 1fr; }
          .le-fbtn { display: inline-block; }
          .le-filters { display: none; }
          .le-filters.open { display: block; }
        }

        .le-filters {
          background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2);
          border-radius: 16px; padding: 20px;
        }
        .le-ftitle {
          font-size: 11.5px; font-weight: 700; letter-spacing: 2px; color: ${GOLD};
          text-transform: uppercase; margin: 18px 0 10px;
        }
        .le-ftitle:first-child { margin-top: 0; }
        .le-check { display: flex; align-items: center; gap: 9px; padding: 4px 0; font-size: 13.5px; color: #D5DAE8; cursor: pointer; user-select: none; }
        .le-check input { accent-color: ${GOLD}; width: 15px; height: 15px; cursor: pointer; }
        .le-range { width: 100%; accent-color: ${CYAN}; }
        .le-rangelabels { display: flex; justify-content: space-between; font-size: 12px; color: #7F8AA6; margin-top: 2px; }
        .le-fxchip {
          display: inline-block; margin: 0 6px 6px 0;
          background: rgba(77,216,230,0.06); color: #D5DAE8;
          border: 1px solid rgba(77,216,230,0.35); border-radius: 999px;
          padding: 6px 13px; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer;
        }
        .le-fxchip.on { background: rgba(77,216,230,0.18); color: ${CYAN}; border-color: ${CYAN}; }

        .le-ghead { display: flex; align-items: center; gap: 12px; margin: 24px 0 12px; }
        .le-ghead.first { margin-top: 0; }
        .le-gletter { color: ${GOLD}; font-weight: 700; font-size: 18px; }
        .le-gline { flex: 1; height: 1px; background: rgba(255,198,61,0.2); }
        .le-gcount { color: #7F8AA6; font-size: 11.5px; }

        .le-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(136px, 1fr)); gap: 12px; }
        .le-tile {
          position: relative;
          background: rgba(20,26,46,0.9); border: 1px solid rgba(255,198,61,0.13);
          border-radius: 14px; padding: 16px 10px 14px; text-align: center; cursor: pointer;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .le-tile:hover {
          transform: translateY(-2px); border-color: rgba(255,198,61,0.7);
          box-shadow: 0 0 14px rgba(255,198,61,0.18); z-index: 20;
        }
        .le-ticon {
          width: 44px; height: 44px; border-radius: 10px; margin: 0 auto 10px;
          background: rgba(12,15,29,0.8); border: 1px solid rgba(255,198,61,0.3);
          display: flex; align-items: center; justify-content: center;
          color: ${GOLD}; font-size: 16px; font-weight: 700;
        }
        .le-tname {
          color: ${GOLD}; font-weight: 700; font-size: 12.5px; line-height: 1.25;
          min-height: 31px; display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .le-tmeta { color: #7F8AA6; font-size: 11px; margin-top: 4px; }
        .le-lbadge {
          display: inline-block; margin-top: 7px;
          background: linear-gradient(180deg, #FFD35E, #E0A62E); color: #1A1405;
          font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
          border-radius: 999px; padding: 3px 9px;
        }
        .le-ttip {
          position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%);
          z-index: 40; min-width: 175px;
          background: #10152A; border: 1px solid rgba(77,216,230,0.5); border-radius: 12px;
          box-shadow: 0 14px 34px rgba(0,0,0,0.6); padding: 12px 14px; text-align: left;
        }
        .le-ttip .fx { color: #4CC98D; font-size: 12.5px; padding: 2px 0; }
        .le-ttip .pn { color: #B8BFD6; font-size: 11.5px; margin-top: 7px; padding-top: 7px; border-top: 1px solid rgba(255,198,61,0.15); }

        .le-empty { text-align: center; color: #7F8AA6; font-size: 14px; padding: 40px 0; }

        .le-pager { display: flex; justify-content: center; gap: 6px; margin-top: 28px; }
        .le-pbtn {
          min-width: 36px; height: 36px; border-radius: 10px;
          background: rgba(20,26,46,0.9); color: #B8BFD6;
          border: 1px solid rgba(255,198,61,0.2); font-size: 13px; font-weight: 600;
          font-family: inherit; cursor: pointer;
        }
        .le-pbtn.on { background: rgba(255,198,61,0.15); color: ${GOLD}; border-color: ${GOLD}; }
        .le-pbtn:hover { border-color: rgba(255,198,61,0.6); }

        .le-footer {
          position: relative; z-index: 5; border-top: 1px solid rgba(255,198,61,0.15);
          padding: 26px 16px; text-align: center; color: #7F8AA6; font-size: 12.5px;
        }
      `}</style>

      <div className="le-nebula" />
      {stars.map((s) => (
        <div
          key={s.id}
          className="le-star"
          style={{ left: s.left + "%", top: s.top + "%", width: s.size, height: s.size, opacity: s.opacity }}
        />
      ))}

      {/* ---- Barre de test ---- */}
      <div className="le-testbar">
        <span className="le-testlabel">🧪 MAQUETTE — LISTE ÉQUIPEMENTS</span>
        <span className="le-testnote">13 items de démo — le vrai site en affichera des milliers depuis la base</span>
      </div>

      {/* ---- Barre Almanax ---- */}
      <div className="le-almanax">
        <b>ALMANAX</b>
        <span className="info">Bonus du jour : +20 % XP métiers</span>
        <span className="info">Offrande : 3 × Gelée Bleutée</span>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>
          Voir l'Almanax →
        </a>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="le-nav">
        <div className="le-links">
          {["Équipements", "Métiers", "Donjons", "Bestiaire", "Quêtes"].map((l) => (
            <button className={"le-navlink" + (l === "Équipements" ? " on" : "")} key={l}>
              {l}
            </button>
          ))}
        </div>
        <button className="le-cnx">Connexion</button>
      </nav>

      <main className="le-page">
        <div className="le-head">
          <h1 className="le-title">Équipements</h1>
          <span className="le-count">
            {results.length} résultat{results.length > 1 ? "s" : ""} (démo) — 2 847 sur le vrai site
          </span>
        </div>

        {/* ---- Recherche + tri + bouton filtres mobile ---- */}
        <div className="le-tools">
          <div className="le-search">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.4" stroke={CYAN} strokeWidth="2" />
              <line x1="11" y1="11" x2="15" y2="15" stroke={CYAN} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input placeholder="Rechercher dans les équipements..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="le-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="az">A → Z</option>
            <option value="lvl-desc">Niveau ↓</option>
            <option value="lvl-asc">Niveau ↑</option>
            <option value="type">Par type</option>
          </select>
          <button className="le-fbtn" onClick={() => setShowFilters(!showFilters)}>
            Filtres{nbFiltres > 0 ? ` (${nbFiltres})` : ""}
          </button>
        </div>

        {/* ---- Pastilles de filtres actifs ---- */}
        {activeChips.length > 0 && (
          <div className="le-chips">
            {activeChips.map((c) => (
              <button className="le-chip" key={c.label} onClick={c.off}>
                {c.label} <span className="x">✕</span>
              </button>
            ))}
            <button
              className="le-clear"
              onClick={() => {
                setTypes([]);
                setLvMin(1);
                setLvMax(200);
                setFx([]);
                setPano(false);
                setLeg(false);
              }}
            >
              Tout effacer
            </button>
          </div>
        )}

        <div className="le-wrap">
          {/* ---- Panneau de filtres ---- */}
          <aside className={"le-filters" + (showFilters ? " open" : "")}>
            <div className="le-ftitle">Type</div>
            {TYPES.map((t) => (
              <label className="le-check" key={t}>
                <input type="checkbox" checked={types.includes(t)} onChange={() => toggle(types, setTypes, t)} />
                {t}
              </label>
            ))}

            <div className="le-ftitle">Niveau</div>
            <input
              className="le-range"
              type="range"
              min="1"
              max="200"
              value={lvMin}
              onChange={(e) => setLvMin(Math.min(Number(e.target.value), lvMax))}
            />
            <input
              className="le-range"
              type="range"
              min="1"
              max="200"
              value={lvMax}
              onChange={(e) => setLvMax(Math.max(Number(e.target.value), lvMin))}
            />
            <div className="le-rangelabels">
              <span>Min : {lvMin}</span>
              <span>Max : {lvMax}</span>
            </div>

            <div className="le-ftitle">Effets recherchés</div>
            <div>
              {EFFETS.map((f) => (
                <button
                  className={"le-fxchip" + (fx.includes(f) ? " on" : "")}
                  key={f}
                  onClick={() => toggle(fx, setFx, f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="le-ftitle">Options</div>
            <label className="le-check">
              <input type="checkbox" checked={pano} onChange={() => setPano(!pano)} />
              Avec panoplie
            </label>
            <label className="le-check">
              <input type="checkbox" checked={leg} onChange={() => setLeg(!leg)} />
              Légendaire uniquement
            </label>
          </aside>

          {/* ---- Résultats ---- */}
          <div>
            {groups.map((g, gi) => (
              <div key={g.k}>
                <div className={"le-ghead" + (gi === 0 ? " first" : "")}>
                  <span className="le-gletter">{g.k}</span>
                  <span className="le-gline" />
                  <span className="le-gcount">
                    {g.items.length} item{g.items.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="le-grid">
                  {g.items.map((it) => (
                    <div
                      className="le-tile"
                      key={it.n}
                      onMouseEnter={() => setTip(it.n)}
                      onMouseLeave={() => setTip(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTip(tip === it.n ? null : it.n);
                      }}
                    >
                      <div className="le-ticon">{it.n.charAt(0)}</div>
                      <div className="le-tname">{it.n}</div>
                      <div className="le-tmeta">
                        Niv. {it.lv} — {it.t}
                      </div>
                      {it.leg && <span className="le-lbadge">LÉG.</span>}
                      {tip === it.n && (
                        <div className="le-ttip" onClick={(e) => e.stopPropagation()}>
                          {it.fx.map((e2) => (
                            <div className="fx" key={e2}>
                              {e2}
                            </div>
                          ))}
                          {it.pano && <div className="pn">Fait partie d'une panoplie</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="le-grid" style={{ display: results.length === 0 ? "grid" : "none" }}>
              {results.length === 0 && (
                <div className="le-empty">
                  Aucun équipement ne correspond à ces filtres.
                  <br />
                  Essaie d'élargir le niveau ou de retirer un effet.
                </div>
              )}
            </div>

            {/* ---- Pagination ---- */}
            <div className="le-pager">
              <button className="le-pbtn">‹</button>
              <button className="le-pbtn on">1</button>
              <button className="le-pbtn">2</button>
              <button className="le-pbtn">3</button>
              <button className="le-pbtn" disabled>
                …
              </button>
              <button className="le-pbtn">58</button>
              <button className="le-pbtn">›</button>
            </div>
          </div>
        </div>
      </main>

      <footer className="le-footer">
        DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games.
      </footer>
    </div>
  );
}
