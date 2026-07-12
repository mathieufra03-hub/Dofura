import { useState, useMemo, useEffect } from "react";

const GOLD = "#FFC63D";
const CYAN = "#4DD8E6";

// ============================================================
// DONNÉES D'EXEMPLE (16 créatures, zones d'exemple)
// Le vrai site lira la base Dofura : créatures ↔ zones ↔ sous-zones
// ============================================================
const ZONES = {
  Astrub: ["Coin des Bouftous", "Coin des Tofus", "Champs d'Astrub", "Souterrains d'Astrub"],
  Amakna: ["Forêt d'Amakna", "Cimetière d'Amakna", "Bord de la forêt maléfique"],
  "Plaines de Cania": ["Vallée des Craqueleurs", "Plaines herbeuses"],
};

const CAT_LABELS = { boss: "Boss de donjon", archi: "Archimonstre", quete: "Monstre de quête", monstre: "Monstre" };

const CREATURES = [
  { n: "Arakne", lv: 14, z: "Amakna", sz: "Forêt d'Amakna", cat: "monstre" },
  { n: "Bouftou", lv: 12, z: "Astrub", sz: "Coin des Bouftous", cat: "monstre" },
  { n: "Bouftou blanc", lv: 15, z: "Astrub", sz: "Coin des Bouftous", cat: "monstre" },
  { n: "Bouftou Royal", lv: 25, z: "Astrub", sz: "Coin des Bouftous", cat: "boss" },
  { n: "Boufton noir", lv: 5, z: "Astrub", sz: "Coin des Bouftous", cat: "quete" },
  { n: "Chafer", lv: 40, z: "Amakna", sz: "Cimetière d'Amakna", cat: "monstre" },
  { n: "Chafer invisible", lv: 48, z: "Amakna", sz: "Cimetière d'Amakna", cat: "archi" },
  { n: "Craqueleur", lv: 60, z: "Plaines de Cania", sz: "Vallée des Craqueleurs", cat: "monstre" },
  { n: "Craqueleur des plaines", lv: 75, z: "Plaines de Cania", sz: "Vallée des Craqueleurs", cat: "archi" },
  { n: "Larve bleue", lv: 6, z: "Astrub", sz: "Souterrains d'Astrub", cat: "monstre" },
  { n: "Milimulou", lv: 25, z: "Amakna", sz: "Bord de la forêt maléfique", cat: "boss" },
  { n: "Moskito", lv: 10, z: "Astrub", sz: "Champs d'Astrub", cat: "quete" },
  { n: "Piou rouge", lv: 4, z: "Astrub", sz: "Champs d'Astrub", cat: "monstre" },
  { n: "Sanglier", lv: 18, z: "Amakna", sz: "Forêt d'Amakna", cat: "monstre" },
  { n: "Tofu", lv: 8, z: "Astrub", sz: "Coin des Tofus", cat: "monstre" },
  { n: "Tofu maléfique", lv: 20, z: "Astrub", sz: "Coin des Tofus", cat: "boss" },
];

export default function DofuraBestiaire() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("az");
  const [zones, setZones] = useState([]);
  const [szs, setSzs] = useState([]);
  const [cats, setCats] = useState([]);
  const [lvMin, setLvMin] = useState(1);
  const [lvMax, setLvMax] = useState(200);
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

  const toggleZone = (z) => {
    if (zones.includes(z)) {
      setZones(zones.filter((x) => x !== z));
      setSzs(szs.filter((s) => !ZONES[z].includes(s)));
    } else {
      setZones([...zones, z]);
    }
  };
  const toggleSz = (s) => setSzs(szs.includes(s) ? szs.filter((x) => x !== s) : [...szs, s]);

  const sousZonesVisibles = zones.flatMap((z) => ZONES[z]);

  const results = useMemo(() => {
    let r = CREATURES.filter((c) => {
      if (q.trim() && !c.n.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (zones.length && !zones.includes(c.z)) return false;
      if (szs.length && !szs.includes(c.sz)) return false;
      if (cats.length && !cats.includes(c.cat)) return false;
      if (c.lv < lvMin || c.lv > lvMax) return false;
      return true;
    });
    if (sort === "az") r.sort((a, b) => a.n.localeCompare(b.n));
    if (sort === "zone") r.sort((a, b) => a.z.localeCompare(b.z) || a.n.localeCompare(b.n));
    return r;
  }, [q, sort, zones, szs, cats, lvMin, lvMax]);

  const groups = useMemo(() => {
    const keyOf = (c) => (sort === "az" ? c.n.charAt(0).toUpperCase() : c.z);
    const g = [];
    results.forEach((c) => {
      const k = keyOf(c);
      const last = g[g.length - 1];
      if (last && last.k === k) last.items.push(c);
      else g.push({ k, items: [c] });
    });
    return g;
  }, [results, sort]);

  const activeChips = [
    ...zones.map((z) => ({ label: z, off: () => toggleZone(z) })),
    ...szs.map((s) => ({ label: s, off: () => toggleSz(s) })),
    ...cats.map((k) => ({ label: CAT_LABELS[k], off: () => setCats(cats.filter((x) => x !== k)) })),
    ...(lvMin > 1 || lvMax < 200
      ? [{ label: `Niv. ${lvMin}-${lvMax}`, off: () => { setLvMin(1); setLvMax(200); } }]
      : []),
  ];

  return (
    <div className="be-root">
      <style>{`
        .be-root {
          min-height: 100vh; background: #0C0F1D;
          font-family: 'Inter', system-ui, sans-serif; color: #E8EAF2;
          position: relative; overflow-x: hidden;
        }
        .be-nebula {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 720px 520px at 80% 4%, rgba(55,199,224,0.16), transparent 65%),
            radial-gradient(ellipse 700px 540px at 4% 42%, rgba(179,63,201,0.13), transparent 65%),
            radial-gradient(ellipse 620px 420px at 48% 0%, rgba(90,63,201,0.13), transparent 65%);
        }
        .be-star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }

        .be-testbar {
          position: sticky; top: 0; z-index: 60;
          background: #05070F; border-bottom: 1px solid rgba(77,216,230,0.35);
          padding: 8px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .be-testlabel { font-size: 11px; letter-spacing: 1.5px; color: ${CYAN}; font-weight: 700; }
        .be-testnote { font-size: 11px; color: #7F8AA6; }

        .be-almanax {
          position: relative; z-index: 5;
          background: rgba(16,21,42,0.92); border-bottom: 1px solid rgba(255,198,61,0.2);
          padding: 9px 20px; display: flex; align-items: center; gap: 20px;
          font-size: 12.5px; overflow-x: auto; white-space: nowrap;
        }
        .be-almanax b { color: ${GOLD}; letter-spacing: 1.5px; font-size: 12px; }
        .be-almanax .info { color: #B8BFD6; }
        .be-almanax .link { color: ${CYAN}; font-weight: 600; margin-left: auto; text-decoration: none; }

        .be-nav {
          position: relative; z-index: 50;
          background: rgba(14,19,34,0.85); border-bottom: 1px solid rgba(255,198,61,0.25);
          padding: 0 20px; display: flex; align-items: center; min-height: 54px;
        }
        .be-links { display: flex; align-items: center; gap: 2px; flex: 1; overflow-x: auto; }
        .be-navlink {
          background: none; border: none; color: #E8EAF2; font-size: 14.5px; font-family: inherit;
          padding: 17px 13px; cursor: pointer; white-space: nowrap;
        }
        .be-navlink:hover { color: ${GOLD}; }
        .be-navlink.on { color: ${GOLD}; font-weight: 600; }
        .be-cnx {
          margin-left: auto; background: rgba(255,198,61,0.08); color: ${GOLD};
          border: 1px solid rgba(255,198,61,0.7); border-radius: 10px; padding: 8px 18px;
          font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap;
        }

        .be-page { position: relative; z-index: 10; max-width: 1240px; margin: 0 auto; padding: 26px 20px 60px; }
        .be-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
        .be-title { font-size: clamp(24px, 4vw, 32px); font-weight: 700; margin: 0; color: ${GOLD}; }
        .be-count { color: #7F8AA6; font-size: 13.5px; }

        .be-tools { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .be-search {
          flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px;
          background: rgba(20,26,46,0.95); border: 1px solid rgba(77,216,230,0.5);
          border-radius: 12px; padding: 11px 16px;
        }
        .be-search input {
          flex: 1; background: none; border: none; outline: none; color: #E8EAF2;
          font-size: 14px; font-family: inherit; min-width: 0;
        }
        .be-search input::placeholder { color: #7F8AA6; }
        .be-select {
          background: rgba(20,26,46,0.95); color: #E8EAF2;
          border: 1px solid rgba(255,198,61,0.35); border-radius: 12px;
          padding: 11px 14px; font-size: 13.5px; font-family: inherit; cursor: pointer;
        }
        .be-fbtn {
          display: none;
          background: rgba(255,198,61,0.08); color: ${GOLD};
          border: 1px solid rgba(255,198,61,0.6); border-radius: 12px;
          padding: 11px 16px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
        }

        .be-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .be-chip {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,198,61,0.1); color: ${GOLD};
          border: 1px solid rgba(255,198,61,0.5); border-radius: 999px;
          padding: 6px 8px 6px 14px; font-size: 12.5px; font-weight: 600;
          font-family: inherit; cursor: pointer;
        }
        .be-chip .x {
          background: rgba(255,198,61,0.2); border-radius: 50%; width: 18px; height: 18px;
          display: inline-flex; align-items: center; justify-content: center; font-size: 11px;
        }
        .be-clear { background: none; border: none; color: #7F8AA6; font-size: 12.5px; font-family: inherit; cursor: pointer; text-decoration: underline; }

        .be-wrap { display: grid; grid-template-columns: 260px 1fr; gap: 22px; align-items: start; }
        @media (max-width: 900px) {
          .be-wrap { grid-template-columns: 1fr; }
          .be-fbtn { display: inline-block; }
          .be-filters { display: none; }
          .be-filters.open { display: block; }
        }

        .be-filters {
          background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2);
          border-radius: 16px; padding: 20px;
        }
        .be-ftitle {
          font-size: 11.5px; font-weight: 700; letter-spacing: 2px; color: ${GOLD};
          text-transform: uppercase; margin: 18px 0 10px;
        }
        .be-ftitle:first-child { margin-top: 0; }
        .be-check { display: flex; align-items: center; gap: 9px; padding: 4px 0; font-size: 13.5px; color: #D5DAE8; cursor: pointer; user-select: none; }
        .be-check input { accent-color: ${GOLD}; width: 15px; height: 15px; cursor: pointer; }
        .be-check.sub { padding-left: 22px; font-size: 12.5px; color: #B8BFD6; }
        .be-check.sub input { accent-color: ${CYAN}; }
        .be-fhint { color: #7F8AA6; font-size: 11.5px; font-style: italic; }
        .be-range { width: 100%; accent-color: ${CYAN}; }
        .be-rangelabels { display: flex; justify-content: space-between; font-size: 12px; color: #7F8AA6; margin-top: 2px; }

        .be-ghead { display: flex; align-items: center; gap: 12px; margin: 24px 0 12px; }
        .be-ghead.first { margin-top: 0; }
        .be-gletter { color: ${GOLD}; font-weight: 700; font-size: 18px; }
        .be-gline { flex: 1; height: 1px; background: rgba(255,198,61,0.2); }
        .be-gcount { color: #7F8AA6; font-size: 11.5px; }

        .be-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(136px, 1fr)); gap: 12px; }
        .be-tile {
          position: relative;
          background: rgba(20,26,46,0.9); border: 1px solid rgba(255,198,61,0.13);
          border-radius: 14px; padding: 16px 10px 14px; text-align: center; cursor: pointer;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .be-tile:hover {
          transform: translateY(-2px); border-color: rgba(255,198,61,0.7);
          box-shadow: 0 0 14px rgba(255,198,61,0.18); z-index: 20;
        }
        .be-ticon {
          width: 44px; height: 44px; border-radius: 10px; margin: 0 auto 10px;
          background: rgba(12,15,29,0.8); border: 1px solid rgba(255,198,61,0.3);
          display: flex; align-items: center; justify-content: center;
          color: ${GOLD}; font-size: 16px; font-weight: 700;
        }
        .be-tname {
          color: ${GOLD}; font-weight: 700; font-size: 12.5px; line-height: 1.25;
          min-height: 31px; display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .be-tmeta { color: #7F8AA6; font-size: 11px; margin-top: 4px; }
        .be-bbadge {
          display: inline-block; margin-top: 7px;
          background: linear-gradient(180deg, #FFD35E, #E0A62E); color: #1A1405;
          font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
          border-radius: 999px; padding: 3px 9px;
        }
        .be-bbadge.archi { background: linear-gradient(180deg, #7FE3F0, #3FB9CF); color: #06222A; }
        .be-bbadge.quete { background: linear-gradient(180deg, #E08AE0, #B44FC0); color: #2A0A2A; }
        .be-ttip {
          position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%);
          z-index: 40; min-width: 190px;
          background: #10152A; border: 1px solid rgba(77,216,230,0.5); border-radius: 12px;
          box-shadow: 0 14px 34px rgba(0,0,0,0.6); padding: 12px 14px; text-align: left;
        }
        .be-ttip .z { color: ${CYAN}; font-size: 12.5px; font-weight: 600; }
        .be-ttip .s { color: #B8BFD6; font-size: 12px; margin-top: 2px; }
        .be-ttip .a { color: #E8EAF2; font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,198,61,0.15); }

        .be-empty { text-align: center; color: #7F8AA6; font-size: 14px; padding: 40px 0; }

        .be-pager { display: flex; justify-content: center; gap: 6px; margin-top: 28px; }
        .be-pbtn {
          min-width: 36px; height: 36px; border-radius: 10px;
          background: rgba(20,26,46,0.9); color: #B8BFD6;
          border: 1px solid rgba(255,198,61,0.2); font-size: 13px; font-weight: 600;
          font-family: inherit; cursor: pointer;
        }
        .be-pbtn.on { background: rgba(255,198,61,0.15); color: ${GOLD}; border-color: ${GOLD}; }
        .be-pbtn:hover { border-color: rgba(255,198,61,0.6); }

        .be-footer {
          position: relative; z-index: 5; border-top: 1px solid rgba(255,198,61,0.15);
          padding: 26px 16px; text-align: center; color: #7F8AA6; font-size: 12.5px;
        }
      `}</style>

      <div className="be-nebula" />
      {stars.map((s) => (
        <div
          key={s.id}
          className="be-star"
          style={{ left: s.left + "%", top: s.top + "%", width: s.size, height: s.size, opacity: s.opacity }}
        />
      ))}

      {/* ---- Barre de test ---- */}
      <div className="be-testbar">
        <span className="be-testlabel">🧪 MAQUETTE — BESTIAIRE</span>
        <span className="be-testnote">16 créatures de démo, zones d'exemple — le vrai site lira la base</span>
      </div>

      {/* ---- Barre Almanax ---- */}
      <div className="be-almanax">
        <b>ALMANAX</b>
        <span className="info">Bonus du jour : +20 % XP métiers</span>
        <span className="info">Offrande : 3 × Gelée Bleutée</span>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>
          Voir l'Almanax →
        </a>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="be-nav">
        <div className="be-links">
          {["Équipements", "Métiers", "Donjons", "Bestiaire", "Quêtes"].map((l) => (
            <button className={"be-navlink" + (l === "Bestiaire" ? " on" : "")} key={l}>
              {l}
            </button>
          ))}
        </div>
        <button className="be-cnx">Connexion</button>
      </nav>

      <main className="be-page">
        <div className="be-head">
          <h1 className="be-title">Bestiaire</h1>
          <span className="be-count">
            {results.length} créature{results.length > 1 ? "s" : ""} (démo)
          </span>
        </div>

        {/* ---- Recherche + tri + bouton filtres mobile ---- */}
        <div className="be-tools">
          <div className="be-search">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.4" stroke={CYAN} strokeWidth="2" />
              <line x1="11" y1="11" x2="15" y2="15" stroke={CYAN} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Rechercher une créature..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="be-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="az">A → Z</option>
            <option value="zone">Par zone</option>
          </select>
          <button className="be-fbtn" onClick={() => setShowFilters(!showFilters)}>
            Filtres{activeChips.length > 0 ? ` (${activeChips.length})` : ""}
          </button>
        </div>

        {/* ---- Pastilles de filtres actifs ---- */}
        {activeChips.length > 0 && (
          <div className="be-chips">
            {activeChips.map((c) => (
              <button className="be-chip" key={c.label} onClick={c.off}>
                {c.label} <span className="x">✕</span>
              </button>
            ))}
            <button
              className="be-clear"
              onClick={() => {
                setZones([]);
                setSzs([]);
                setCats([]);
                setLvMin(1);
                setLvMax(200);
              }}
            >
              Tout effacer
            </button>
          </div>
        )}

        <div className="be-wrap">
          {/* ---- Panneau de filtres ---- */}
          <aside className={"be-filters" + (showFilters ? " open" : "")}>
            <div className="be-ftitle">Zone</div>
            {Object.keys(ZONES).map((z) => (
              <label className="be-check" key={z}>
                <input type="checkbox" checked={zones.includes(z)} onChange={() => toggleZone(z)} />
                {z}
              </label>
            ))}

            <div className="be-ftitle">Sous-zone</div>
            {sousZonesVisibles.length === 0 ? (
              <div className="be-fhint">Coche une zone pour affiner par sous-zone</div>
            ) : (
              sousZonesVisibles.map((s) => (
                <label className="be-check sub" key={s}>
                  <input type="checkbox" checked={szs.includes(s)} onChange={() => toggleSz(s)} />
                  {s}
                </label>
              ))
            )}

            <div className="be-ftitle">Catégorie</div>
            {["boss", "archi", "quete"].map((k) => (
              <label className="be-check" key={k}>
                <input
                  type="checkbox"
                  checked={cats.includes(k)}
                  onChange={() =>
                    setCats(cats.includes(k) ? cats.filter((x) => x !== k) : [...cats, k])
                  }
                />
                {CAT_LABELS[k]}
              </label>
            ))}

            <div className="be-ftitle">Niveau</div>
            <input
              className="be-range"
              type="range"
              min="1"
              max="200"
              value={lvMin}
              onChange={(e) => setLvMin(Math.min(Number(e.target.value), lvMax))}
            />
            <input
              className="be-range"
              type="range"
              min="1"
              max="200"
              value={lvMax}
              onChange={(e) => setLvMax(Math.max(Number(e.target.value), lvMin))}
            />
            <div className="be-rangelabels">
              <span>Min : {lvMin}</span>
              <span>Max : {lvMax}</span>
            </div>
          </aside>

          {/* ---- Résultats classés ---- */}
          <div>
            {groups.map((g, gi) => (
              <div key={g.k}>
                <div className={"be-ghead" + (gi === 0 ? " first" : "")}>
                  <span className="be-gletter">{g.k}</span>
                  <span className="be-gline" />
                  <span className="be-gcount">
                    {g.items.length} créature{g.items.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="be-grid">
                  {g.items.map((c) => (
                    <div
                      className="be-tile"
                      key={c.n}
                      onMouseEnter={() => setTip(c.n)}
                      onMouseLeave={() => setTip(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTip(tip === c.n ? null : c.n);
                      }}
                    >
                      <div className="be-ticon">{c.n.charAt(0)}</div>
                      <div className="be-tname">{c.n}</div>
                      <div className="be-tmeta">Niv. {c.lv}</div>
                      {c.cat !== "monstre" && (
                        <span className={"be-bbadge " + c.cat}>
                          {c.cat === "boss" ? "BOSS" : c.cat === "archi" ? "ARCHI" : "QUÊTE"}
                        </span>
                      )}
                      {tip === c.n && (
                        <div className="be-ttip" onClick={(e) => e.stopPropagation()}>
                          <div className="z">{c.z}</div>
                          <div className="s">{c.sz}</div>
                          <div className="a">{CAT_LABELS[c.cat]}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {results.length === 0 && (
              <div className="be-empty">
                Aucune créature ne correspond à ces filtres.
                <br />
                Essaie d'élargir le niveau ou de retirer une zone.
              </div>
            )}

            {/* ---- Pagination ---- */}
            <div className="be-pager">
              <button className="be-pbtn">‹</button>
              <button className="be-pbtn on">1</button>
              <button className="be-pbtn">2</button>
              <button className="be-pbtn">3</button>
              <button className="be-pbtn" disabled>
                …
              </button>
              <button className="be-pbtn">42</button>
              <button className="be-pbtn">›</button>
            </div>
          </div>
        </div>
      </main>

      <footer className="be-footer">
        DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games.
      </footer>
    </div>
  );
}
