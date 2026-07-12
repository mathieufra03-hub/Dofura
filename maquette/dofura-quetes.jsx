import { useState, useMemo, useEffect } from "react";

const GOLD = "#FFC63D";
const CYAN = "#4DD8E6";

// ============================================================
// DONNÉES D'EXEMPLE — le vrai site lira la base Dofura
// ============================================================
const CAT_LABELS = {
  principale: "Quête principale",
  secondaire: "Quête secondaire",
  repetable: "Répétable",
  dofus: "Quête de Dofus",
};

const QUETES = [
  { n: "Éternelle Moisson", lv: 10, cat: "secondaire", zone: "Astrub", etapes: 4, fav: true },
  { n: "Le Champ de Cania", lv: 15, cat: "secondaire", zone: "Plaines de Cania", etapes: 5, fav: false },
  { n: "La Voie du Bouftou", lv: 20, cat: "principale", zone: "Astrub", etapes: 6, fav: false },
  { n: "Les Œufs du Dragon", lv: 100, cat: "dofus", zone: "Amakna", etapes: 8, fav: true },
  { n: "Le Réveil des Anciens", lv: 120, cat: "principale", zone: "Amakna", etapes: 7, fav: false },
  { n: "Ballade en forêt", lv: 8, cat: "repetable", zone: "Amakna", etapes: 3, fav: false },
  { n: "La Quête de l'Émeraude", lv: 100, cat: "dofus", zone: "Bonta", etapes: 10, fav: false },
  { n: "Le Trésor de Kerubim", lv: 30, cat: "secondaire", zone: "Astrub", etapes: 5, fav: false },
];

// Détail d'exemple pour la fiche
const FICHE = {
  n: "Les Œufs du Dragon",
  lv: 100,
  cat: "dofus",
  zone: "Amakna",
  pnj: "Crocabulia",
  resume:
    "Le dragon cochon Grozilla a pondu un œuf mystérieux. Retrouve-le et perce le secret du Dofus Émeraude.",
  prerequis: [{ n: "La Voie du Bouftou", ok: true }, { n: "Niveau 100 requis", ok: true }],
  etapes: [
    { t: "Parle à Crocabulia à Amakna", done: true },
    { t: "Récupère 5 Œufs de Tofu dans le Coin des Tofus", done: true },
    { t: "Bats le Bouftou Royal dans son donjon", done: true },
    { t: "Rapporte l'Œuf mystérieux à Crocabulia", done: false },
    { t: "Explore la Grotte des Dragons", done: false },
    { t: "Affronte le gardien de l'œuf", done: false },
    { t: "Récupère le fragment du Dofus Émeraude", done: false },
    { t: "Reviens voir Crocabulia pour ta récompense", done: false },
  ],
  recompenses: [
    { t: "12 500 XP", k: "xp" },
    { t: "3 200 Kamas", k: "kamas" },
    { t: "Fragment du Dofus Émeraude", k: "item" },
  ],
  donjon: { n: "Donjon Bouftou", lv: 20 },
  succesParent: { n: "Les Quêtes des Dofus", nb: 6 },
};

export default function DofuraQuetes() {
  const [view, setView] = useState("liste");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("zone");
  const [cats, setCats] = useState([]);
  const [zones, setZones] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [tip, setTip] = useState(null);

  // Fiche : état des cases cochées
  const [steps, setSteps] = useState(FICHE.etapes.map((e) => e.done));
  const [fav, setFav] = useState(true);

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
    return () => document.head.removeChild(l);
  }, []);

  useEffect(() => {
    const close = () => setTip(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const ZONES = [...new Set(QUETES.map((x) => x.zone))];
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const results = useMemo(() => {
    let r = QUETES.filter((x) => {
      if (q.trim() && !x.n.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (cats.length && !cats.includes(x.cat)) return false;
      if (zones.length && !zones.includes(x.zone)) return false;
      return true;
    });
    if (sort === "zone") r.sort((a, b) => a.zone.localeCompare(b.zone) || a.lv - b.lv);
    else if (sort === "niveau") r.sort((a, b) => a.lv - b.lv);
    else r.sort((a, b) => a.n.localeCompare(b.n));
    return r;
  }, [q, sort, cats, zones]);

  const groups = useMemo(() => {
    const keyOf = (x) =>
      sort === "zone"
        ? x.zone
        : sort === "niveau"
        ? "Niv. " + (Math.floor((x.lv - 1) / 20) * 20 + 1) + " – " + (Math.floor((x.lv - 1) / 20) * 20 + 20)
        : x.n.charAt(0).toUpperCase();
    const g = [];
    results.forEach((x) => {
      const k = keyOf(x);
      const last = g[g.length - 1];
      if (last && last.k === k) last.items.push(x);
      else g.push({ k, items: [x] });
    });
    return g;
  }, [results, sort]);

  const activeChips = [
    ...cats.map((k) => ({ label: CAT_LABELS[k], off: () => toggle(cats, setCats, k) })),
    ...zones.map((z) => ({ label: z, off: () => toggle(zones, setZones, z) })),
  ];

  const doneCount = steps.filter(Boolean).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="qu-root">
      <style>{`
        .qu-root { min-height: 100vh; background: #0C0F1D; font-family: 'Inter', system-ui, sans-serif; color: #E8EAF2; position: relative; overflow-x: hidden; }
        .qu-nebula {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 720px 520px at 80% 5%, rgba(55,199,224,0.16), transparent 65%),
            radial-gradient(ellipse 700px 540px at 3% 40%, rgba(179,63,201,0.13), transparent 65%),
            radial-gradient(ellipse 620px 420px at 46% 0%, rgba(90,63,201,0.13), transparent 65%);
        }
        .qu-star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }

        .qu-testbar { position: sticky; top: 0; z-index: 60; background: #05070F; border-bottom: 1px solid rgba(77,216,230,0.35); padding: 8px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .qu-testlabel { font-size: 11px; letter-spacing: 1.5px; color: ${CYAN}; font-weight: 700; }
        .qu-testbtn { background: transparent; color: #B8BFD6; border: 1px solid rgba(184,191,214,0.35); border-radius: 999px; padding: 5px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .qu-testbtn.on { color: #10131F; background: ${CYAN}; border-color: ${CYAN}; }
        .qu-testnote { font-size: 11px; color: #7F8AA6; }

        .qu-almanax { position: relative; z-index: 5; background: rgba(16,21,42,0.92); border-bottom: 1px solid rgba(255,198,61,0.2); padding: 9px 20px; display: flex; align-items: center; gap: 20px; font-size: 12.5px; overflow-x: auto; white-space: nowrap; }
        .qu-almanax b { color: ${GOLD}; letter-spacing: 1.5px; font-size: 12px; }
        .qu-almanax .info { color: #B8BFD6; }
        .qu-almanax .link { color: ${CYAN}; font-weight: 600; margin-left: auto; text-decoration: none; }

        .qu-nav { position: relative; z-index: 50; background: rgba(14,19,34,0.85); border-bottom: 1px solid rgba(255,198,61,0.25); padding: 0 20px; display: flex; align-items: center; min-height: 54px; }
        .qu-links { display: flex; align-items: center; gap: 2px; flex: 1; overflow-x: auto; }
        .qu-navlink { background: none; border: none; color: #E8EAF2; font-size: 14.5px; font-family: inherit; padding: 17px 13px; cursor: pointer; white-space: nowrap; }
        .qu-navlink:hover { color: ${GOLD}; }
        .qu-navlink.on { color: ${GOLD}; font-weight: 600; }
        .qu-cnx { margin-left: auto; background: rgba(255,198,61,0.08); color: ${GOLD}; border: 1px solid rgba(255,198,61,0.7); border-radius: 10px; padding: 8px 18px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; }

        .qu-page { position: relative; z-index: 10; max-width: 1240px; margin: 0 auto; padding: 26px 20px 60px; }
        .qu-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
        .qu-title { font-size: clamp(24px, 4vw, 32px); font-weight: 700; margin: 0; color: ${GOLD}; }
        .qu-count { color: #7F8AA6; font-size: 13.5px; }

        .qu-tools { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .qu-search { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px; background: rgba(20,26,46,0.95); border: 1px solid rgba(77,216,230,0.5); border-radius: 12px; padding: 11px 16px; }
        .qu-search input { flex: 1; background: none; border: none; outline: none; color: #E8EAF2; font-size: 14px; font-family: inherit; min-width: 0; }
        .qu-search input::placeholder { color: #7F8AA6; }
        .qu-select { background: rgba(20,26,46,0.95); color: #E8EAF2; border: 1px solid rgba(255,198,61,0.35); border-radius: 12px; padding: 11px 14px; font-size: 13.5px; font-family: inherit; cursor: pointer; }
        .qu-fbtn { display: none; background: rgba(255,198,61,0.08); color: ${GOLD}; border: 1px solid rgba(255,198,61,0.6); border-radius: 12px; padding: 11px 16px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; }

        .qu-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .qu-chip { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,198,61,0.1); color: ${GOLD}; border: 1px solid rgba(255,198,61,0.5); border-radius: 999px; padding: 6px 8px 6px 14px; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; }
        .qu-chip .x { background: rgba(255,198,61,0.2); border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
        .qu-clear { background: none; border: none; color: #7F8AA6; font-size: 12.5px; font-family: inherit; cursor: pointer; text-decoration: underline; }

        .qu-wrap { display: grid; grid-template-columns: 260px 1fr; gap: 22px; align-items: start; }
        @media (max-width: 900px) { .qu-wrap { grid-template-columns: 1fr; } .qu-fbtn { display: inline-block; } .qu-filters { display: none; } .qu-filters.open { display: block; } }

        .qu-filters { background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2); border-radius: 16px; padding: 20px; }
        .qu-ftitle { font-size: 11.5px; font-weight: 700; letter-spacing: 2px; color: ${GOLD}; text-transform: uppercase; margin: 18px 0 10px; }
        .qu-ftitle:first-child { margin-top: 0; }
        .qu-check { display: flex; align-items: center; gap: 9px; padding: 4px 0; font-size: 13.5px; color: #D5DAE8; cursor: pointer; user-select: none; }
        .qu-check input { accent-color: ${GOLD}; width: 15px; height: 15px; cursor: pointer; }

        .qu-ghead { display: flex; align-items: center; gap: 12px; margin: 24px 0 12px; }
        .qu-ghead.first { margin-top: 0; }
        .qu-gletter { color: ${GOLD}; font-weight: 700; font-size: 18px; }
        .qu-gline { flex: 1; height: 1px; background: rgba(255,198,61,0.2); }
        .qu-gcount { color: #7F8AA6; font-size: 11.5px; }

        .qu-rows { display: flex; flex-direction: column; gap: 8px; }
        .qu-row { display: flex; align-items: center; gap: 14px; background: rgba(20,26,46,0.9); border: 1px solid rgba(255,198,61,0.13); border-radius: 12px; padding: 12px 16px; cursor: pointer; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .qu-row:hover { border-color: rgba(255,198,61,0.7); box-shadow: 0 0 14px rgba(255,198,61,0.16); }
        .qu-rstar { color: #3A4257; font-size: 17px; background: none; border: none; cursor: pointer; padding: 0; }
        .qu-rmain { flex: 1; min-width: 0; }
        .qu-rname { color: ${GOLD}; font-weight: 700; font-size: 14.5px; }
        .qu-rmeta { color: #7F8AA6; font-size: 12px; margin-top: 1px; }
        .qu-rcat { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border-radius: 999px; padding: 4px 11px; white-space: nowrap; }
        .qu-rcat.principale { background: rgba(255,198,61,0.15); color: ${GOLD}; }
        .qu-rcat.secondaire { background: rgba(77,216,230,0.13); color: ${CYAN}; }
        .qu-rcat.repetable { background: rgba(140,150,178,0.15); color: #B8BFD6; }
        .qu-rcat.dofus { background: rgba(196,75,199,0.15); color: #D98AE0; }

        /* ---- FICHE ---- */
        .qu-crumb { font-size: 12.5px; color: #7F8AA6; margin-bottom: 18px; }
        .qu-crumb span { color: ${CYAN}; cursor: pointer; }
        .qu-crumb b { color: #B8BFD6; font-weight: 600; }
        .qu-fhead { background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.25); border-radius: 18px; padding: 24px; margin-bottom: 22px; }
        .qu-ftop { display: flex; align-items: flex-start; gap: 14px; }
        .qu-fname { font-size: clamp(22px, 4vw, 30px); font-weight: 700; margin: 0; background: linear-gradient(180deg, #FFE08A, #DE9B1F); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; flex: 1; }
        .qu-fstar { font-size: 26px; background: none; border: none; cursor: pointer; padding: 0; line-height: 1; }
        .qu-fmeta { color: #B8BFD6; font-size: 14px; margin-top: 8px; }
        .qu-fresume { color: #8B96B2; font-size: 13.5px; font-style: italic; margin-top: 12px; max-width: 700px; }

        .qu-prog { background: rgba(12,15,29,0.6); border-radius: 12px; padding: 14px 18px; margin-top: 18px; }
        .qu-progtop { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
        .qu-progtop .lbl { color: #B8BFD6; }
        .qu-progtop .val { color: ${GOLD}; font-weight: 700; }
        .qu-bar { height: 8px; border-radius: 5px; background: #1B2138; overflow: hidden; }
        .qu-barfill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, #FFD35E, #E0A62E); transition: width 0.3s ease; }

        .qu-fwrap { display: grid; grid-template-columns: 1fr 340px; gap: 22px; align-items: start; }
        @media (max-width: 900px) { .qu-fwrap { grid-template-columns: 1fr; } }
        .qu-block { background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2); border-radius: 16px; padding: 22px 24px; margin-bottom: 22px; }
        .qu-btitle { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: ${GOLD}; margin: 0 0 16px; text-transform: uppercase; }

        .qu-step { display: flex; align-items: flex-start; gap: 13px; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; }
        .qu-step:last-child { border-bottom: none; }
        .qu-box { width: 24px; height: 24px; flex-shrink: 0; border-radius: 7px; border: 2px solid rgba(255,198,61,0.5); display: flex; align-items: center; justify-content: center; margin-top: 1px; transition: all 0.15s ease; }
        .qu-box.on { background: linear-gradient(180deg, #FFD35E, #E0A62E); border-color: ${GOLD}; color: #1A1405; font-weight: 700; font-size: 15px; }
        .qu-stepnum { color: #7F8AA6; font-size: 12px; font-weight: 700; margin-right: 2px; }
        .qu-steptext { font-size: 14.5px; color: #E8EAF2; line-height: 1.5; }
        .qu-step.done .qu-steptext { color: #7F8AA6; text-decoration: line-through; }

        .qu-pre { display: flex; align-items: center; gap: 10px; font-size: 14px; padding: 7px 0; }
        .qu-pre .mk { color: #4CC98D; font-weight: 700; }
        .qu-pre .nm { color: ${CYAN}; cursor: pointer; }
        .qu-rew { display: flex; align-items: center; gap: 12px; font-size: 14.5px; padding: 9px 0; }
        .qu-rew .ic { width: 30px; height: 30px; border-radius: 8px; background: rgba(12,15,29,0.8); border: 1px solid rgba(255,198,61,0.3); display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .qu-rew.xp .v { color: ${CYAN}; } .qu-rew.kamas .v { color: ${GOLD}; } .qu-rew.item .v { color: #4CC98D; cursor: pointer; }
        .qu-loginnote { color: #7F8AA6; font-size: 12px; margin-top: 14px; font-style: italic; }

        .qu-link.qu-block { border-color: rgba(77,216,230,0.35); }
        .qu-linkrow { display: flex; align-items: center; gap: 12px; padding: 6px 0; cursor: pointer; }
        .qu-linkic { width: 40px; height: 40px; flex-shrink: 0; border-radius: 10px; background: rgba(12,15,29,0.8); border: 1px solid rgba(77,216,230,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .qu-linkmain { flex: 1; min-width: 0; }
        .qu-linkname { color: ${CYAN}; font-weight: 700; font-size: 14.5px; }
        .qu-linkmeta { color: #7F8AA6; font-size: 12px; margin-top: 1px; }
        .qu-linkgo { color: ${CYAN}; font-size: 18px; font-weight: 700; }
        .qu-linkrow:hover .qu-linkname { text-decoration: underline; }

        .qu-footer { position: relative; z-index: 5; border-top: 1px solid rgba(255,198,61,0.15); padding: 26px 16px; text-align: center; color: #7F8AA6; font-size: 12.5px; }
      `}</style>

      <div className="qu-nebula" />
      {stars.map((s) => (
        <div key={s.id} className="qu-star" style={{ left: s.left + "%", top: s.top + "%", width: s.size, height: s.size, opacity: s.opacity }} />
      ))}

      {/* ---- Barre de test ---- */}
      <div className="qu-testbar">
        <span className="qu-testlabel">🧪 MAQUETTE — QUÊTES</span>
        <button className={"qu-testbtn" + (view === "liste" ? " on" : "")} onClick={() => setView("liste")}>Liste</button>
        <button className={"qu-testbtn" + (view === "fiche" ? " on" : "")} onClick={() => setView("fiche")}>Fiche quête</button>
        <span className="qu-testnote">Données de démo</span>
      </div>

      {/* ---- Barre Almanax ---- */}
      <div className="qu-almanax">
        <b>ALMANAX</b>
        <span className="info">Bonus du jour : +20 % XP métiers</span>
        <span className="info">Offrande : 3 × Gelée Bleutée</span>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>Voir l'Almanax →</a>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="qu-nav">
        <div className="qu-links">
          {["Équipements", "Métiers", "Donjons", "Bestiaire", "Quêtes"].map((l) => (
            <button className={"qu-navlink" + (l === "Quêtes" ? " on" : "")} key={l}>{l}</button>
          ))}
        </div>
        <button className="qu-cnx">Connexion</button>
      </nav>

      <main className="qu-page">
        {view === "liste" ? (
          <>
            <div className="qu-head">
              <h1 className="qu-title">Quêtes</h1>
              <span className="qu-count">{results.length} quête{results.length > 1 ? "s" : ""} (démo)</span>
            </div>

            <div className="qu-tools">
              <div className="qu-search">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.4" stroke={CYAN} strokeWidth="2" />
                  <line x1="11" y1="11" x2="15" y2="15" stroke={CYAN} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input placeholder="Rechercher une quête..." value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="qu-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="zone">Par zone</option>
                <option value="niveau">Par niveau</option>
                <option value="az">A → Z</option>
              </select>
              <button className="qu-fbtn" onClick={() => setShowFilters(!showFilters)}>
                Filtres{activeChips.length > 0 ? ` (${activeChips.length})` : ""}
              </button>
            </div>

            {activeChips.length > 0 && (
              <div className="qu-chips">
                {activeChips.map((c) => (
                  <button className="qu-chip" key={c.label} onClick={c.off}>{c.label} <span className="x">✕</span></button>
                ))}
                <button className="qu-clear" onClick={() => { setCats([]); setZones([]); }}>Tout effacer</button>
              </div>
            )}

            <div className="qu-wrap">
              <aside className={"qu-filters" + (showFilters ? " open" : "")}>
                <div className="qu-ftitle">Catégorie</div>
                {Object.keys(CAT_LABELS).map((k) => (
                  <label className="qu-check" key={k}>
                    <input type="checkbox" checked={cats.includes(k)} onChange={() => toggle(cats, setCats, k)} />
                    {CAT_LABELS[k]}
                  </label>
                ))}
                <div className="qu-ftitle">Zone</div>
                {ZONES.map((z) => (
                  <label className="qu-check" key={z}>
                    <input type="checkbox" checked={zones.includes(z)} onChange={() => toggle(zones, setZones, z)} />
                    {z}
                  </label>
                ))}
              </aside>

              <div>
                {groups.map((g, gi) => (
                  <div key={g.k}>
                    <div className={"qu-ghead" + (gi === 0 ? " first" : "")}>
                      <span className="qu-gletter">{g.k}</span>
                      <span className="qu-gline" />
                      <span className="qu-gcount">{g.items.length} quête{g.items.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="qu-rows">
                      {g.items.map((x) => (
                        <div className="qu-row" key={x.n} onClick={() => setView("fiche")}>
                          <button
                            className="qu-rstar"
                            style={{ color: x.fav ? GOLD : "#3A4257" }}
                            onClick={(e) => { e.stopPropagation(); }}
                            title="Épingler en favori"
                          >
                            ★
                          </button>
                          <div className="qu-rmain">
                            <div className="qu-rname">{x.n}</div>
                            <div className="qu-rmeta">Niv. {x.lv} · {x.zone} · {x.etapes} étapes</div>
                          </div>
                          <span className={"qu-rcat " + x.cat}>{CAT_LABELS[x.cat]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ---- FICHE QUÊTE ---- */}
            <div className="qu-crumb">
              <span onClick={() => setView("liste")}>Quêtes</span> › <b>{FICHE.n}</b>
            </div>

            <header className="qu-fhead">
              <div className="qu-ftop">
                <h1 className="qu-fname">{FICHE.n}</h1>
                <button className="qu-fstar" style={{ color: fav ? GOLD : "#3A4257" }} onClick={() => setFav(!fav)} title="Épingler en favori">★</button>
              </div>
              <div className="qu-fmeta">Niv. {FICHE.lv} · {CAT_LABELS[FICHE.cat]} · {FICHE.zone} · PNJ : {FICHE.pnj}</div>
              <div className="qu-fresume">{FICHE.resume}</div>

              <div className="qu-prog">
                <div className="qu-progtop">
                  <span className="lbl">Progression</span>
                  <span className="val">{doneCount} / {steps.length} · {pct}%</span>
                </div>
                <div className="qu-bar"><div className="qu-barfill" style={{ width: pct + "%" }} /></div>
              </div>
            </header>

            <div className="qu-fwrap">
              <div>
                <section className="qu-block">
                  <h2 className="qu-btitle">Étapes</h2>
                  {FICHE.etapes.map((e, i) => (
                    <div
                      className={"qu-step" + (steps[i] ? " done" : "")}
                      key={i}
                      onClick={() => setSteps(steps.map((s, j) => (j === i ? !s : s)))}
                    >
                      <div className={"qu-box" + (steps[i] ? " on" : "")}>{steps[i] ? "✓" : ""}</div>
                      <div className="qu-steptext">
                        <span className="qu-stepnum">{i + 1}.</span> {e.t}
                      </div>
                    </div>
                  ))}
                  <div className="qu-loginnote">Connecte-toi pour sauvegarder ta progression automatiquement.</div>
                </section>
              </div>

              <div>
                <section className="qu-block">
                  <h2 className="qu-btitle">Prérequis</h2>
                  {FICHE.prerequis.map((p) => (
                    <div className="qu-pre" key={p.n}>
                      <span className="mk">{p.ok ? "✓" : "○"}</span>
                      <span className="nm">{p.n}</span>
                    </div>
                  ))}
                </section>

                <section className="qu-block">
                  <h2 className="qu-btitle">Récompenses</h2>
                  {FICHE.recompenses.map((r) => (
                    <div className={"qu-rew " + r.k} key={r.t}>
                      <span className="ic">{r.k === "xp" ? "✦" : r.k === "kamas" ? "◈" : "🥚"}</span>
                      <span className="v">{r.t}</span>
                    </div>
                  ))}
                </section>

                {FICHE.donjon && (
                  <section className="qu-block qu-link">
                    <h2 className="qu-btitle">🏰 Donjon lié</h2>
                    <div className="qu-linkrow">
                      <div className="qu-linkic">🏰</div>
                      <div className="qu-linkmain">
                        <div className="qu-linkname">{FICHE.donjon.n}</div>
                        <div className="qu-linkmeta">Niv. {FICHE.donjon.lv}</div>
                      </div>
                      <span className="qu-linkgo">→</span>
                    </div>
                  </section>
                )}

                {FICHE.succesParent && (
                  <section className="qu-block qu-link">
                    <h2 className="qu-btitle">🏆 Succès parent</h2>
                    <div className="qu-linkrow">
                      <div className="qu-linkic">🏆</div>
                      <div className="qu-linkmain">
                        <div className="qu-linkname">{FICHE.succesParent.n}</div>
                        <div className="qu-linkmeta">{FICHE.succesParent.nb} quêtes dans la série</div>
                      </div>
                      <span className="qu-linkgo">→</span>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="qu-footer">
        DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games.
      </footer>
    </div>
  );
}
