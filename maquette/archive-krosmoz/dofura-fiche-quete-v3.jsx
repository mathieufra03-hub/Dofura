import { useState, useEffect } from "react";

const GOLD = "#FFC63D";
const CYAN = "#4DD8E6";

// Icônes SVG par type d'action — "Rapporter" retravaillé (flèche retour vers un point, pas un coffre vert)
const Icon = ({ type }) => {
  const props = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const c = { talk: CYAN, fight: "#F26D6D", go: GOLD, bring: "#C9A24B", collect: "#7FC96B" }[type];
  if (type === "talk") return (<svg {...props} stroke={c}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
  if (type === "fight") return (<svg {...props} stroke={c}><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/></svg>);
  if (type === "go") return (<svg {...props} stroke={c}><path d="M12 21s-6-5.7-6-10a6 6 0 0 1 12 0c0 4.3-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>);
  // Rapporter : flèche courbe de retour (rendre un objet à un PNJ)
  if (type === "bring") return (<svg {...props} stroke={c}><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v2"/></svg>);
  return (<svg {...props} stroke={c}><path d="M11 2 3 9l4 4 7-8z"/><path d="m14 13 4 4 3-3-4-4z"/><path d="M7 13 3 21l8-4"/></svg>);
};

const QUETE = {
  n: "Shushu et Lulu",
  lv: 25, zone: "Astrub", pnj: "Kerubim Crépin",
  lancementLieu: "Boutique de Kerubim", lancementPos: "3,-17",
  resume: "Kerubim Crépin vous demande d'enquêter sur la présence d'un chasseur de Shushus à Astrub.",
  prerequis: [{ n: "Scène de ménage" }],
  etapes: [
    { type: "bring", action: "Rapporter", cible: "Bière d'Astrub", detail: "à Gralahad", lieu: "Taverne d'Astrub", pos: "6,-18" },
    { type: "fight", action: "Combattre", cible: "Gilou Aychwesh", detail: "", lieu: "Cité d'Astrub", pos: "1,-19" },
    { type: "go", action: "Découvrir", cible: "Maison de Marp", detail: "", lieu: "Cité d'Astrub", pos: "1,-19" },
    { type: "fight", action: "Combattre", cible: "Shushu Baka", detail: "", lieu: "Cité d'Astrub", pos: "1,-19" },
    { type: "bring", action: "Rapporter", cible: "Ticket de Kerubim", detail: "à Hassen Cehef", lieu: "Forêt d'Astrub", pos: "0,-18" },
  ],
  recompenses: [{ t: "Expérience", k: "xp" }, { t: "Kamas", k: "kamas" }],
};

const TravelPos = ({ pos, big }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText("/travel " + pos); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  return (
    <button className={"q3-travelpos" + (big ? " big" : "") + (copied ? " copied" : "")} onClick={copy} title="Copier /travel pour l'autopilote">
      <span className="pin">📍</span>[{pos}]
      <span className="hint">{copied ? "✓ /travel copié" : "⧉"}</span>
    </button>
  );
};

export default function DofuraFicheQueteV3() {
  const [open, setOpen] = useState({});
  const [done, setDone] = useState(QUETE.etapes.map(() => false));

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Inter:wght@400;600;700&display=swap";
    document.head.appendChild(l);
    return () => document.head.removeChild(l);
  }, []);

  const doneCount = done.filter(Boolean).length;
  const pct = Math.round((doneCount / done.length) * 100);

  return (
    <div className="q3-root">
      <style>{`
        .q3-root { min-height:100vh; background:#0C0F1D; font-family:'Inter',system-ui,sans-serif; color:#E8EAF2; position:relative; }
        .q3-neb { position:absolute; inset:0; pointer-events:none; background: radial-gradient(ellipse 720px 520px at 80% 5%, rgba(55,199,224,0.14), transparent 65%), radial-gradient(ellipse 700px 540px at 3% 40%, rgba(179,63,201,0.12), transparent 65%); }
        .q3-page { position:relative; z-index:2; max-width:1200px; margin:0 auto; padding:26px 20px 60px; }
        .q3-crumb { font-size:12.5px; color:#7F8AA6; margin-bottom:16px; }
        .q3-crumb span { color:${CYAN}; }

        /* Bouton /travel position */
        .q3-travelpos { display:inline-flex; align-items:center; gap:5px; background:rgba(77,216,230,0.1); color:${CYAN}; border:1px solid rgba(77,216,230,0.5); border-radius:8px; padding:4px 10px; font-size:13px; font-weight:700; font-family:inherit; cursor:pointer; }
        .q3-travelpos:hover { background:rgba(77,216,230,0.2); }
        .q3-travelpos.copied { background:rgba(76,201,141,0.15); color:#4CC98D; border-color:#4CC98D; }
        .q3-travelpos.big { font-size:15px; padding:7px 14px; }
        .q3-travelpos .pin { font-size:12px; }
        .q3-travelpos .hint { font-size:11px; opacity:0.7; margin-left:2px; }

        /* En-tête + récap */
        .q3-head { background:rgba(20,26,46,0.92); border:1px solid rgba(255,198,61,0.25); border-radius:18px; padding:24px; margin-bottom:22px; }
        .q3-toprow { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
        .q3-name { font-family:'Cinzel Decorative',serif; font-size:clamp(22px,4vw,30px); font-weight:700; margin:0; background:linear-gradient(180deg,#FFE08A,#DE9B1F); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .q3-recap { background:rgba(12,15,29,0.5); border:1px solid rgba(255,198,61,0.15); border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; gap:8px; min-width:230px; }
        .q3-recaprow { display:flex; align-items:center; gap:8px; font-size:13px; }
        .q3-recaprow .lbl { color:#7F8AA6; min-width:80px; }
        .q3-recaprow .val { color:#E8EAF2; font-weight:600; }
        .q3-resume { color:#8B96B2; font-size:13.5px; font-style:italic; margin-top:14px; }

        /* Prérequis en haut */
        .q3-prereq { background:rgba(255,198,61,0.06); border:1px solid rgba(255,198,61,0.3); border-radius:12px; padding:14px 18px; margin-top:16px; }
        .q3-prereq .t { font-size:11.5px; font-weight:700; letter-spacing:1.5px; color:${GOLD}; text-transform:uppercase; margin-bottom:8px; }
        .q3-prereq .item { color:${CYAN}; font-size:14px; padding:3px 0; }

        .q3-prog { background:rgba(12,15,29,0.6); border-radius:12px; padding:14px 18px; margin-top:16px; }
        .q3-progtop { display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; }
        .q3-progtop .v { color:${GOLD}; font-weight:700; }
        .q3-bar { height:8px; border-radius:5px; background:#1B2138; overflow:hidden; }
        .q3-barfill { height:100%; border-radius:5px; background:linear-gradient(90deg,#FFD35E,#E0A62E); transition:width .3s; }

        .q3-wrap { display:grid; grid-template-columns:1fr 300px; gap:22px; align-items:start; }
        @media (max-width:900px){ .q3-wrap { grid-template-columns:1fr; } }
        .q3-block { background:rgba(20,26,46,0.92); border:1px solid rgba(255,198,61,0.2); border-radius:16px; padding:22px 24px; margin-bottom:22px; }
        .q3-btitle { font-size:12px; font-weight:700; letter-spacing:2px; color:${GOLD}; margin:0 0 18px; text-transform:uppercase; }

        .q3-step { border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:16px; margin-bottom:14px; background:rgba(12,15,29,0.35); }
        .q3-step:last-child { margin-bottom:0; }
        .q3-step.done { opacity:0.6; }
        .q3-stephead { display:flex; align-items:flex-start; gap:14px; }
        .q3-checkbox { width:24px; height:24px; flex-shrink:0; border-radius:7px; border:2px solid rgba(255,198,61,0.5); display:flex; align-items:center; justify-content:center; cursor:pointer; margin-top:2px; }
        .q3-checkbox.on { background:linear-gradient(180deg,#FFD35E,#E0A62E); border-color:${GOLD}; color:#1A1405; font-weight:700; }
        .q3-icon { width:38px; height:38px; flex-shrink:0; border-radius:10px; background:rgba(12,15,29,0.7); border:1px solid rgba(255,198,61,0.25); display:flex; align-items:center; justify-content:center; }
        .q3-stepbody { flex:1; min-width:0; }
        .q3-num { color:#7F8AA6; font-size:12px; font-weight:700; }
        .q3-action { font-size:15.5px; color:#E8EAF2; margin-top:2px; }
        .q3-action b { color:${CYAN}; }
        .q3-step.done .q3-action { text-decoration:line-through; color:#7F8AA6; }
        .q3-posline { display:flex; align-items:center; gap:12px; margin-top:10px; flex-wrap:wrap; }
        .q3-lieu { color:#B8BFD6; font-size:12.5px; }
        .q3-maptoggle { background:none; border:none; color:${CYAN}; font-size:12.5px; font-weight:600; font-family:inherit; cursor:pointer; margin-top:12px; }
        .q3-map { margin-top:12px; border-radius:12px; overflow:hidden; border:1px solid rgba(255,198,61,0.2); }
        .q3-mapinner { aspect-ratio:16/10; background:rgba(12,15,29,0.7); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; }
        .q3-mapic { font-size:28px; opacity:0.5; }
        .q3-maptxt { color:#7F8AA6; font-size:12px; }

        .q3-rew { display:flex; align-items:center; gap:10px; font-size:14px; padding:8px 0; }
        .q3-rew .ic { width:28px; height:28px; border-radius:8px; background:rgba(12,15,29,0.8); border:1px solid rgba(255,198,61,0.3); display:flex; align-items:center; justify-content:center; font-size:14px; }
        .q3-rew.xp .v { color:${CYAN}; } .q3-rew.kamas .v { color:${GOLD}; }
        .q3-dpln { display:block; width:100%; text-align:center; background:rgba(77,216,230,0.07); color:${CYAN}; border:1px solid rgba(77,216,230,0.5); border-radius:12px; padding:14px; font-size:14px; font-weight:600; font-family:inherit; cursor:pointer; }
        .q3-dpln:hover { background:rgba(77,216,230,0.14); }
      `}</style>

      <div className="q3-neb" />
      <div className="q3-page">
        <div className="q3-crumb"><span>Quêtes</span> › {QUETE.n}</div>

        <header className="q3-head">
          <div className="q3-toprow">
            <div>
              <h1 className="q3-name">{QUETE.n}</h1>
              <div className="q3-resume">{QUETE.resume}</div>
            </div>
            <div className="q3-recap">
              <div className="q3-recaprow"><span className="lbl">Lancement</span><TravelPos pos={QUETE.lancementPos} /></div>
              <div className="q3-recaprow"><span className="lbl">Lieu</span><span className="val">{QUETE.lancementLieu}</span></div>
              <div className="q3-recaprow"><span className="lbl">Niveau</span><span className="val">{QUETE.lv}</span></div>
              <div className="q3-recaprow"><span className="lbl">PNJ</span><span className="val">{QUETE.pnj}</span></div>
            </div>
          </div>

          {QUETE.prerequis.length > 0 && (
            <div className="q3-prereq">
              <div className="t">Prérequis</div>
              {QUETE.prerequis.map((p) => <div className="item" key={p.n}>› {p.n}</div>)}
            </div>
          )}

          <div className="q3-prog">
            <div className="q3-progtop"><span>Progression</span><span className="v">{doneCount} / {done.length} · {pct}%</span></div>
            <div className="q3-bar"><div className="q3-barfill" style={{ width: pct + "%" }} /></div>
          </div>
        </header>

        <div className="q3-wrap">
          <div className="q3-block">
            <h2 className="q3-btitle">Feuille de route</h2>
            {QUETE.etapes.map((e, i) => (
              <div className={"q3-step" + (done[i] ? " done" : "")} key={i}>
                <div className="q3-stephead">
                  <div className={"q3-checkbox" + (done[i] ? " on" : "")} onClick={() => setDone(done.map((v, j) => j === i ? !v : v))}>
                    {done[i] ? "✓" : ""}
                  </div>
                  <div className="q3-icon"><Icon type={e.type} /></div>
                  <div className="q3-stepbody">
                    <div className="q3-num">ÉTAPE {i + 1}</div>
                    <div className="q3-action">{e.action} <b>{e.cible}</b> {e.detail}</div>
                    <div className="q3-posline">
                      <TravelPos pos={e.pos} />
                      <span className="q3-lieu">{e.lieu}</span>
                    </div>
                    <button className="q3-maptoggle" onClick={() => setOpen({ ...open, [i]: !open[i] })}>
                      {open[i] ? "▾ Masquer la carte" : "▸ Voir la carte"}
                    </button>
                    {open[i] && (
                      <div className="q3-map">
                        <div className="q3-mapinner">
                          <span className="q3-mapic">🗺️</span>
                          <span className="q3-maptxt">Carte de {e.lieu} — image DofusDB</span>
                          <span className="q3-maptxt" style={{ fontSize: 10.5 }}>Repère [{e.pos}] · pas de point exact dessiné (donnée non officielle)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <section className="q3-block">
              <h2 className="q3-btitle">Récompenses</h2>
              {QUETE.recompenses.map((r) => (
                <div className={"q3-rew " + r.k} key={r.t}><span className="ic">{r.k === "xp" ? "✦" : "◈"}</span><span className="v">{r.t}</span></div>
              ))}
            </section>
            <button className="q3-dpln">Guide complet sur DofusPourLesNoobs →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
