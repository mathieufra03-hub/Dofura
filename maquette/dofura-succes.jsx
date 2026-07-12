import { useState, useMemo, useEffect } from "react";

const GOLD = "#FFC63D";
const CYAN = "#4DD8E6";

// ============================================================
// DONNÉES D'EXEMPLE — le vrai site lira la base Dofura
// ============================================================
const CATS = ["Quêtes", "Donjons", "Bestiaire", "Métiers", "Exploration", "Élevage"];

const SUCCES = [
  { n: "Donjons à l'ancienne", cat: "Quêtes", pts: 80, fait: 3, total: 6, fav: true },
  { n: "Bouftou pacifiste", cat: "Donjons", pts: 40, fait: 0, total: 1, fav: false },
  { n: "Tueur de Bouftous", cat: "Bestiaire", pts: 20, fait: 100, total: 100, fav: false },
  { n: "Explorateur d'Astrub", cat: "Exploration", pts: 15, fait: 8, total: 12, fav: false },
  { n: "Maître Bûcheron", cat: "Métiers", pts: 50, fait: 1, total: 1, fav: false },
  { n: "Éleveur de Dragodindes", cat: "Élevage", pts: 30, fait: 2, total: 5, fav: false },
  { n: "Duo de choc", cat: "Donjons", pts: 20, fait: 4, total: 10, fav: false },
  { n: "Chasseur d'Archimonstres", cat: "Bestiaire", pts: 100, fait: 12, total: 50, fav: true },
];

// Fiche d'exemple : un succès "Quêtes" avec objectifs mixtes
const FICHE = {
  n: "Donjons à l'ancienne",
  cat: "Quêtes",
  pts: 80,
  resume:
    "Réalise la série de quêtes des donjons historiques du Monde des Douze pour débloquer ce succès et son titre.",
  objectifs: [
    { t: "Porte, Missiz Frizz, trésor", type: "quete", lv: 200, done: true },
    { t: "Le Bouftou Royal", type: "quete", lv: 20, done: true },
    { t: "Les Gelées enragées", type: "quete", lv: 60, done: true },
    { t: "Le Comte Harebourg", type: "quete", lv: 190, done: false },
    { t: "Vaincre chaque boss sans allié à terre", type: "manuel", done: false },
    { t: "Terminer 3 donjons différents en Duo", type: "manuel", done: false },
  ],
  recompenses: [
    { t: "80 points de succès", k: "pts" },
    { t: "Titre : « l'Ancien »", k: "titre" },
    { t: "5 000 Kamas", k: "kamas" },
  ],
  donjon: null,
};

export default function DofuraSucces() {
  const [view, setView] = useState("liste");
  const [q, setQ] = useState("");
  const [cats, setCats] = useState([]);
  const [hideDone, setHideDone] = useState(false);
  const [logged, setLogged] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [objs, setObjs] = useState(FICHE.objectifs.map((o) => o.done));
  const [fav, setFav] = useState(false);

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

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const results = useMemo(() => {
    let r = SUCCES.filter((s) => {
      if (q.trim() && !s.n.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (cats.length && !cats.includes(s.cat)) return false;
      if (logged && hideDone && s.fait >= s.total) return false;
      return true;
    });
    r.sort((a, b) => a.cat.localeCompare(b.cat) || a.n.localeCompare(b.n));
    return r;
  }, [q, cats, hideDone, logged]);

  const groups = useMemo(() => {
    const g = [];
    results.forEach((s) => {
      const last = g[g.length - 1];
      if (last && last.k === s.cat) last.items.push(s);
      else g.push({ k: s.cat, items: [s] });
    });
    return g;
  }, [results]);

  const ptsGagnes = SUCCES.filter((s) => s.fait >= s.total).reduce((a, s) => a + s.pts, 0);
  const ptsTotal = SUCCES.reduce((a, s) => a + s.pts, 0);

  const activeChips = cats.map((c) => ({ label: c, off: () => toggle(cats, setCats, c) }));

  const objDone = objs.filter(Boolean).length;
  const objPct = Math.round((objDone / objs.length) * 100);

  return (
    <div className="su-root">
      <style>{`
        .su-root { min-height: 100vh; background: #0C0F1D; font-family: 'Inter', system-ui, sans-serif; color: #E8EAF2; position: relative; overflow-x: hidden; }
        .su-nebula { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 720px 520px at 80% 5%, rgba(55,199,224,0.16), transparent 65%), radial-gradient(ellipse 700px 540px at 3% 40%, rgba(179,63,201,0.13), transparent 65%), radial-gradient(ellipse 620px 420px at 46% 0%, rgba(90,63,201,0.13), transparent 65%); }
        .su-star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }

        .su-testbar { position: sticky; top: 0; z-index: 60; background: #05070F; border-bottom: 1px solid rgba(77,216,230,0.35); padding: 8px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .su-testlabel { font-size: 11px; letter-spacing: 1.5px; color: ${CYAN}; font-weight: 700; }
        .su-testbtn { background: transparent; color: #B8BFD6; border: 1px solid rgba(184,191,214,0.35); border-radius: 999px; padding: 5px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .su-testbtn.on { color: #10131F; background: ${CYAN}; border-color: ${CYAN}; }
        .su-testnote { font-size: 11px; color: #7F8AA6; }

        .su-almanax { position: relative; z-index: 5; background: rgba(16,21,42,0.92); border-bottom: 1px solid rgba(255,198,61,0.2); padding: 9px 20px; display: flex; align-items: center; gap: 20px; font-size: 12.5px; overflow-x: auto; white-space: nowrap; }
        .su-almanax b { color: ${GOLD}; letter-spacing: 1.5px; font-size: 12px; }
        .su-almanax .info { color: #B8BFD6; }
        .su-almanax .link { color: ${CYAN}; font-weight: 600; margin-left: auto; text-decoration: none; }

        .su-nav { position: relative; z-index: 50; background: rgba(14,19,34,0.85); border-bottom: 1px solid rgba(255,198,61,0.25); padding: 0 20px; display: flex; align-items: center; min-height: 54px; }
        .su-links { display: flex; align-items: center; gap: 2px; flex: 1; overflow-x: auto; }
        .su-navlink { background: none; border: none; color: #E8EAF2; font-size: 14.5px; font-family: inherit; padding: 17px 13px; cursor: pointer; white-space: nowrap; }
        .su-navlink:hover { color: ${GOLD}; }
        .su-navlink.on { color: ${GOLD}; font-weight: 600; }
        .su-cnx { margin-left: auto; background: rgba(255,198,61,0.08); color: ${GOLD}; border: 1px solid rgba(255,198,61,0.7); border-radius: 10px; padding: 8px 18px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; }

        .su-page { position: relative; z-index: 10; max-width: 1240px; margin: 0 auto; padding: 26px 20px 60px; }
        .su-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 8px; }
        .su-title { font-size: clamp(24px, 4vw, 32px); font-weight: 700; margin: 0; color: ${GOLD}; }
        .su-count { color: #7F8AA6; font-size: 13.5px; }
        .su-ptsglobal { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,198,61,0.1); border: 1px solid rgba(255,198,61,0.5); color: ${GOLD}; font-weight: 700; font-size: 14px; border-radius: 999px; padding: 7px 16px; margin-bottom: 18px; }

        .su-tools { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .su-search { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px; background: rgba(20,26,46,0.95); border: 1px solid rgba(77,216,230,0.5); border-radius: 12px; padding: 11px 16px; }
        .su-search input { flex: 1; background: none; border: none; outline: none; color: #E8EAF2; font-size: 14px; font-family: inherit; min-width: 0; }
        .su-search input::placeholder { color: #7F8AA6; }
        .su-fbtn { display: none; background: rgba(255,198,61,0.08); color: ${GOLD}; border: 1px solid rgba(255,198,61,0.6); border-radius: 12px; padding: 11px 16px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; }

        .su-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .su-chip { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,198,61,0.1); color: ${GOLD}; border: 1px solid rgba(255,198,61,0.5); border-radius: 999px; padding: 6px 8px 6px 14px; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; }
        .su-chip .x { background: rgba(255,198,61,0.2); border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
        .su-clear { background: none; border: none; color: #7F8AA6; font-size: 12.5px; font-family: inherit; cursor: pointer; text-decoration: underline; }

        .su-wrap { display: grid; grid-template-columns: 240px 1fr; gap: 22px; align-items: start; }
        @media (max-width: 900px) { .su-wrap { grid-template-columns: 1fr; } .su-fbtn { display: inline-block; } .su-filters { display: none; } .su-filters.open { display: block; } }

        .su-filters { background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2); border-radius: 16px; padding: 20px; }
        .su-ftitle { font-size: 11.5px; font-weight: 700; letter-spacing: 2px; color: ${GOLD}; text-transform: uppercase; margin: 18px 0 10px; }
        .su-ftitle:first-child { margin-top: 0; }
        .su-check { display: flex; align-items: center; gap: 9px; padding: 4px 0; font-size: 13.5px; color: #D5DAE8; cursor: pointer; user-select: none; }
        .su-check input { accent-color: ${GOLD}; width: 15px; height: 15px; cursor: pointer; }

        .su-ghead { display: flex; align-items: center; gap: 12px; margin: 24px 0 12px; }
        .su-ghead.first { margin-top: 0; }
        .su-gletter { color: ${GOLD}; font-weight: 700; font-size: 17px; }
        .su-gline { flex: 1; height: 1px; background: rgba(255,198,61,0.2); }
        .su-gcount { color: #7F8AA6; font-size: 11.5px; }

        .su-rows { display: flex; flex-direction: column; gap: 8px; }
        .su-row { display: flex; align-items: center; gap: 14px; background: rgba(20,26,46,0.9); border: 1px solid rgba(255,198,61,0.13); border-radius: 12px; padding: 12px 16px; cursor: pointer; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .su-row:hover { border-color: rgba(255,198,61,0.7); box-shadow: 0 0 14px rgba(255,198,61,0.16); }
        .su-row.done { border-color: rgba(76,201,141,0.4); }
        .su-rstar { font-size: 17px; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; }
        .su-rmain { flex: 1; min-width: 0; }
        .su-rname { color: ${GOLD}; font-weight: 700; font-size: 14.5px; }
        .su-rprog { display: flex; align-items: center; gap: 10px; margin-top: 5px; }
        .su-rbar { flex: 1; max-width: 180px; height: 5px; border-radius: 3px; background: #1B2138; overflow: hidden; }
        .su-rbarfill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #FFD35E, #E0A62E); }
        .su-rbarfill.done { background: linear-gradient(90deg, #4CC98D, #35A86F); }
        .su-rfrac { color: #7F8AA6; font-size: 11.5px; }
        .su-rpts { color: ${GOLD}; font-weight: 700; font-size: 13px; white-space: nowrap; flex-shrink: 0; }
        .su-rpts.done { color: #4CC98D; }

        /* FICHE */
        .su-crumb { font-size: 12.5px; color: #7F8AA6; margin-bottom: 18px; }
        .su-crumb span { color: ${CYAN}; cursor: pointer; }
        .su-crumb b { color: #B8BFD6; font-weight: 600; }
        .su-fhead { background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.25); border-radius: 18px; padding: 24px; margin-bottom: 22px; }
        .su-ftop { display: flex; align-items: flex-start; gap: 14px; }
        .su-fname { font-size: clamp(22px, 4vw, 30px); font-weight: 700; margin: 0; background: linear-gradient(180deg, #FFE08A, #DE9B1F); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; flex: 1; }
        .su-fstar { font-size: 26px; background: none; border: none; cursor: pointer; padding: 0; line-height: 1; }
        .su-fmeta { color: #B8BFD6; font-size: 14px; margin-top: 8px; }
        .su-fmeta .pts { color: ${GOLD}; font-weight: 700; }
        .su-fresume { color: #8B96B2; font-size: 13.5px; font-style: italic; margin-top: 12px; max-width: 700px; }
        .su-prog { background: rgba(12,15,29,0.6); border-radius: 12px; padding: 14px 18px; margin-top: 18px; }
        .su-progtop { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
        .su-progtop .lbl { color: #B8BFD6; } .su-progtop .val { color: ${GOLD}; font-weight: 700; }
        .su-bar { height: 8px; border-radius: 5px; background: #1B2138; overflow: hidden; }
        .su-barfill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, #FFD35E, #E0A62E); transition: width 0.3s ease; }

        .su-fwrap { display: grid; grid-template-columns: 1fr 320px; gap: 22px; align-items: start; }
        @media (max-width: 900px) { .su-fwrap { grid-template-columns: 1fr; } }
        .su-block { background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2); border-radius: 16px; padding: 22px 24px; margin-bottom: 22px; }
        .su-btitle { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: ${GOLD}; margin: 0 0 16px; text-transform: uppercase; }

        .su-obj { display: flex; align-items: flex-start; gap: 13px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .su-obj:last-of-type { border-bottom: none; }
        .su-box { width: 24px; height: 24px; flex-shrink: 0; border-radius: 7px; border: 2px solid rgba(255,198,61,0.5); display: flex; align-items: center; justify-content: center; margin-top: 1px; cursor: pointer; transition: all 0.15s ease; }
        .su-box.on { background: linear-gradient(180deg, #FFD35E, #E0A62E); border-color: ${GOLD}; color: #1A1405; font-weight: 700; font-size: 15px; }
        .su-box.auto { border-style: dashed; }
        .su-box.auto.on { border-style: solid; }
        .su-objmain { flex: 1; min-width: 0; }
        .su-objtext { font-size: 14.5px; color: #E8EAF2; line-height: 1.5; }
        .su-obj.done .su-objtext { color: #7F8AA6; text-decoration: line-through; }
        .su-objtag { display: inline-block; margin-top: 4px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; border-radius: 999px; padding: 2px 9px; }
        .su-objtag.quete { background: rgba(77,216,230,0.13); color: ${CYAN}; cursor: pointer; }
        .su-objtag.manuel { background: rgba(140,150,178,0.15); color: #B8BFD6; }
        .su-objgo { color: ${CYAN}; font-size: 12px; margin-left: 6px; }
        .su-loginnote { color: #7F8AA6; font-size: 12px; margin-top: 14px; font-style: italic; }
        .su-autonote { color: #4CC98D; font-size: 11.5px; margin-top: 12px; display: flex; align-items: center; gap: 6px; }

        .su-rew { display: flex; align-items: center; gap: 12px; font-size: 14px; padding: 9px 0; }
        .su-rew .ic { width: 30px; height: 30px; border-radius: 8px; background: rgba(12,15,29,0.8); border: 1px solid rgba(255,198,61,0.3); display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .su-rew.pts .v { color: ${GOLD}; font-weight: 700; } .su-rew.titre .v { color: #D98AE0; } .su-rew.kamas .v { color: ${GOLD}; }

        .su-footer { position: relative; z-index: 5; border-top: 1px solid rgba(255,198,61,0.15); padding: 26px 16px; text-align: center; color: #7F8AA6; font-size: 12.5px; }
      `}</style>

      <div className="su-nebula" />
      {stars.map((s) => (
        <div key={s.id} className="su-star" style={{ left: s.left + "%", top: s.top + "%", width: s.size, height: s.size, opacity: s.opacity }} />
      ))}

      <div className="su-testbar">
        <span className="su-testlabel">🧪 MAQUETTE — SUCCÈS</span>
        <button className={"su-testbtn" + (view === "liste" ? " on" : "")} onClick={() => setView("liste")}>Liste</button>
        <button className={"su-testbtn" + (view === "fiche" ? " on" : "")} onClick={() => setView("fiche")}>Fiche succès</button>
        <button className="su-testbtn" onClick={() => setLogged(!logged)}>{logged ? "👤 déconnecté" : "👤 connecté"}</button>
        <span className="su-testnote">Données de démo</span>
      </div>

      <div className="su-almanax">
        <b>ALMANAX</b>
        <span className="info">Bonus du jour : +20 % XP métiers</span>
        <span className="info">Offrande : 3 × Gelée Bleutée</span>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>Voir l'Almanax →</a>
      </div>

      <nav className="su-nav">
        <div className="su-links">
          {["Équipements", "Métiers", "Donjons", "Bestiaire", "Quêtes"].map((l) => (
            <button className="su-navlink" key={l}>{l}</button>
          ))}
        </div>
        <button className="su-cnx">Connexion</button>
      </nav>

      <main className="su-page">
        {view === "liste" ? (
          <>
            <div className="su-head">
              <h1 className="su-title">Succès</h1>
              <span className="su-count">{results.length} succès (démo)</span>
            </div>
            {logged && (
              <div className="su-ptsglobal">🏆 {ptsGagnes} / {ptsTotal} points de succès</div>
            )}

            <div className="su-tools">
              <div className="su-search">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.4" stroke={CYAN} strokeWidth="2" />
                  <line x1="11" y1="11" x2="15" y2="15" stroke={CYAN} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input placeholder="Rechercher un succès..." value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <button className="su-fbtn" onClick={() => setShowFilters(!showFilters)}>Filtres{activeChips.length > 0 ? ` (${activeChips.length})` : ""}</button>
            </div>

            {activeChips.length > 0 && (
              <div className="su-chips">
                {activeChips.map((c) => (
                  <button className="su-chip" key={c.label} onClick={c.off}>{c.label} <span className="x">✕</span></button>
                ))}
                <button className="su-clear" onClick={() => setCats([])}>Tout effacer</button>
              </div>
            )}

            <div className="su-wrap">
              <aside className={"su-filters" + (showFilters ? " open" : "")}>
                <div className="su-ftitle">Catégorie</div>
                {CATS.map((c) => (
                  <label className="su-check" key={c}>
                    <input type="checkbox" checked={cats.includes(c)} onChange={() => toggle(cats, setCats, c)} />
                    {c}
                  </label>
                ))}
                {logged && (
                  <>
                    <div className="su-ftitle">Affichage</div>
                    <label className="su-check">
                      <input type="checkbox" checked={hideDone} onChange={() => setHideDone(!hideDone)} />
                      Masquer les succès accomplis
                    </label>
                  </>
                )}
              </aside>

              <div>
                {groups.map((g, gi) => (
                  <div key={g.k}>
                    <div className={"su-ghead" + (gi === 0 ? " first" : "")}>
                      <span className="su-gletter">{g.k}</span>
                      <span className="su-gline" />
                      <span className="su-gcount">{g.items.length}</span>
                    </div>
                    <div className="su-rows">
                      {g.items.map((s) => {
                        const done = logged && s.fait >= s.total;
                        const pct = Math.round((s.fait / s.total) * 100);
                        return (
                          <div className={"su-row" + (done ? " done" : "")} key={s.n} onClick={() => setView("fiche")}>
                            <button className="su-rstar" style={{ color: s.fav ? GOLD : "#3A4257" }} onClick={(e) => e.stopPropagation()} title="Épingler">★</button>
                            <div className="su-rmain">
                              <div className="su-rname">{s.n}</div>
                              {logged ? (
                                <div className="su-rprog">
                                  <div className="su-rbar"><div className={"su-rbarfill" + (done ? " done" : "")} style={{ width: pct + "%" }} /></div>
                                  <span className="su-rfrac">{s.fait} / {s.total}</span>
                                </div>
                              ) : (
                                <div className="su-rprog"><span className="su-rfrac">{s.total} objectif{s.total > 1 ? "s" : ""}</span></div>
                              )}
                            </div>
                            <span className={"su-rpts" + (done ? " done" : "")}>{done ? "✓ " : ""}{s.pts} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* FICHE SUCCÈS */}
            <div className="su-crumb"><span onClick={() => setView("liste")}>Succès</span> › <b>{FICHE.n}</b></div>

            <header className="su-fhead">
              <div className="su-ftop">
                <h1 className="su-fname">{FICHE.n}</h1>
                <button className="su-fstar" style={{ color: fav ? GOLD : "#3A4257" }} onClick={() => setFav(!fav)}>★</button>
              </div>
              <div className="su-fmeta">Catégorie : {FICHE.cat} · <span className="pts">{FICHE.pts} points</span></div>
              <div className="su-fresume">{FICHE.resume}</div>
              {logged && (
                <div className="su-prog">
                  <div className="su-progtop"><span className="lbl">Progression</span><span className="val">{objDone} / {objs.length} · {objPct}%</span></div>
                  <div className="su-bar"><div className="su-barfill" style={{ width: objPct + "%" }} /></div>
                </div>
              )}
            </header>

            <div className="su-fwrap">
              <div>
                <section className="su-block">
                  <h2 className="su-btitle">Objectifs</h2>
                  {FICHE.objectifs.map((o, i) => (
                    <div className={"su-obj" + (objs[i] ? " done" : "")} key={i}>
                      <div
                        className={"su-box" + (objs[i] ? " on" : "") + (o.type === "quete" ? " auto" : "")}
                        onClick={() => {
                          if (!logged) return;
                          if (o.type === "manuel") setObjs(objs.map((v, j) => (j === i ? !v : v)));
                        }}
                        title={o.type === "quete" ? "Se coche automatiquement quand la quête est validée" : "Objectif à cocher manuellement"}
                      >
                        {objs[i] ? "✓" : ""}
                      </div>
                      <div className="su-objmain">
                        <div className="su-objtext">{o.t}</div>
                        {o.type === "quete" ? (
                          <span className="su-objtag quete">QUÊTE · Niv. {o.lv}<span className="su-objgo">→</span></span>
                        ) : (
                          <span className="su-objtag manuel">À COCHER SOI-MÊME</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {logged ? (
                    <div className="su-autonote">✦ Les objectifs « quête » se cochent tout seuls dès que tu valides la quête liée.</div>
                  ) : (
                    <div className="su-loginnote">Connecte-toi pour suivre ta progression sur ce succès.</div>
                  )}
                </section>
              </div>

              <div>
                <section className="su-block">
                  <h2 className="su-btitle">Récompenses</h2>
                  {FICHE.recompenses.map((r) => (
                    <div className={"su-rew " + r.k} key={r.t}>
                      <span className="ic">{r.k === "pts" ? "🏆" : r.k === "titre" ? "🎖️" : "◈"}</span>
                      <span className="v">{r.t}</span>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="su-footer">
        DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games.
      </footer>
    </div>
  );
}
