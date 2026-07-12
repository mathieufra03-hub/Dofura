import { useState, useMemo, useEffect } from "react";

const GOLD = "#FFC63D";
const CYAN = "#4DD8E6";

// ============================================================
// DONNÉES D'EXEMPLE — le vrai site lira la base Dofura
// (stats, recette, taux : placeholders pour juger le DESIGN)
// ============================================================
const ITEM = {
  nom: "Coiffe du Bouftou",
  niveau: 20,
  type: "Coiffe",
  categorie: "Équipements",
  sousCategorie: "Coiffes",
  description:
    "Cette coiffe en laine de Bouftou tient chaud aux oreilles et donne une furieuse envie de brouter.",
  effets: [
    { t: "+ 21 à 30 Force", k: "b" },
    { t: "+ 16 à 25 Vitalité", k: "b" },
    { t: "+ 6 à 10 Sagesse", k: "b" },
    { t: "+ 3 à 5 Dommages", k: "b" },
    { t: "- 3 Fuite", k: "m" },
  ],
  conditions: "Aucune condition",
  recette: [
    { n: "Laine de Bouftou", q: 12, type: "Ressource · Niv. 8", src: "Droppée sur : Bouftou" },
    { n: "Cuir de Bouftou", q: 6, type: "Ressource · Niv. 12", src: "Droppée sur : Bouftou, Bouftou blanc" },
    { n: "Étoffe de Milimulou", q: 2, type: "Ressource · Niv. 20", src: "Droppée sur : Milimulou" },
  ],
  craft: "Tailleur — Niv. 20",
  panoplie: {
    nom: "Panoplie de Bouftou",
    pieces: ["Coiffe du Bouftou", "Cape de Bouftou", "Ceinture du Bouftou", "Bottes du Bouftou", "Amulette du Bouftou", "Marteau du Bouftou"],
    bonus: [
      { n: "2 items", t: "+ 10 Vitalité" },
      { n: "3 items", t: "+ 20 Vitalité · + 5 Force" },
      { n: "4 items", t: "+ 30 Vitalité · + 10 Force" },
      { n: "5 items", t: "+ 40 Vitalité · + 15 Force · + 5 Sagesse" },
      { n: "6 items", t: "+ 60 Vitalité · + 25 Force · + 10 Sagesse" },
    ],
  },
  obtention: [
    { n: "Bouftou", d: "Drop · taux depuis la base", to: "Bestiaire" },
    { n: "Bouftou blanc", d: "Drop · taux depuis la base", to: "Bestiaire" },
    { n: "Craft Tailleur", d: "Recette ci-contre", to: null },
  ],
};

const SORT_LEGENDAIRE = {
  n: "Sort intégré (exemple)",
  d: "Nom, coût PA, portée et effets du sort lus depuis ta base — l'encadré n'apparaît que sur les items légendaires.",
};

export default function DofuraFicheItem() {
  const [legendaire, setLegendaire] = useState(false);
  const [tip, setTip] = useState(null);

  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
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

  return (
    <div className="fi-root">
      <style>{`
        .fi-root {
          min-height: 100vh; background: #0C0F1D;
          font-family: 'Inter', system-ui, sans-serif; color: #E8EAF2;
          position: relative; overflow-x: hidden;
        }
        .fi-nebula {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 720px 520px at 82% 8%, rgba(55,199,224,0.18), transparent 65%),
            radial-gradient(ellipse 700px 540px at 4% 38%, rgba(179,63,201,0.15), transparent 65%),
            radial-gradient(ellipse 620px 420px at 40% 0%, rgba(90,63,201,0.15), transparent 65%),
            radial-gradient(ellipse 600px 450px at 90% 85%, rgba(196,75,199,0.09), transparent 65%);
        }
        .fi-star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }

        .fi-testbar {
          position: sticky; top: 0; z-index: 60;
          background: #05070F; border-bottom: 1px solid rgba(77,216,230,0.35);
          padding: 8px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .fi-testlabel { font-size: 11px; letter-spacing: 1.5px; color: ${CYAN}; font-weight: 700; }
        .fi-testbtn {
          background: transparent; color: #B8BFD6; border: 1px solid rgba(184,191,214,0.35);
          border-radius: 999px; padding: 5px 14px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; font-family: inherit;
        }
        .fi-testbtn.on { color: #10131F; background: ${GOLD}; border-color: ${GOLD}; }
        .fi-testnote { font-size: 11px; color: #7F8AA6; }

        .fi-almanax {
          position: relative; z-index: 5;
          background: rgba(16,21,42,0.92); border-bottom: 1px solid rgba(255,198,61,0.2);
          padding: 9px 20px; display: flex; align-items: center; gap: 20px;
          font-size: 12.5px; overflow-x: auto; white-space: nowrap;
        }
        .fi-almanax b { color: ${GOLD}; letter-spacing: 1.5px; font-size: 12px; }
        .fi-almanax .date { font-weight: 600; }
        .fi-almanax .info { color: #B8BFD6; }
        .fi-almanax .link { color: ${CYAN}; font-weight: 600; margin-left: auto; text-decoration: none; }

        .fi-nav {
          position: relative; z-index: 50;
          background: rgba(14,19,34,0.85); border-bottom: 1px solid rgba(255,198,61,0.25);
          padding: 0 20px; display: flex; align-items: center; min-height: 54px;
        }
        .fi-links { display: flex; align-items: center; gap: 2px; flex: 1; overflow-x: auto; }
        .fi-navlink {
          background: none; border: none; color: #E8EAF2; font-size: 14.5px; font-family: inherit;
          padding: 17px 13px; cursor: pointer; white-space: nowrap;
        }
        .fi-navlink:hover { color: ${GOLD}; }
        .fi-navlink.on { color: ${GOLD}; font-weight: 600; }
        .fi-cnx {
          margin-left: auto; background: rgba(255,198,61,0.08); color: ${GOLD};
          border: 1px solid rgba(255,198,61,0.7); border-radius: 10px; padding: 8px 18px;
          font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap;
        }

        .fi-page { position: relative; z-index: 10; max-width: 1240px; margin: 0 auto; padding: 26px 20px 60px; }
        .fi-crumb { font-size: 12.5px; color: #7F8AA6; margin-bottom: 22px; }
        .fi-crumb span { color: ${CYAN}; cursor: pointer; }
        .fi-crumb b { color: #B8BFD6; font-weight: 600; }

        .fi-head {
          display: flex; gap: 22px; align-items: center; flex-wrap: wrap;
          background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.25);
          border-radius: 18px; padding: 24px; margin-bottom: 24px;
        }
        .fi-head.leg { border-color: rgba(255,198,61,0.85); box-shadow: 0 0 30px rgba(255,198,61,0.22); }
        .fi-img {
          width: 96px; height: 96px; border-radius: 16px; flex-shrink: 0;
          background: rgba(12,15,29,0.8); border: 1px solid rgba(255,198,61,0.4);
          display: flex; align-items: center; justify-content: center;
        }
        .fi-name {
          font-size: clamp(24px, 4vw, 32px); font-weight: 700; margin: 0;
          background: linear-gradient(180deg, #FFE08A, #DE9B1F);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          -webkit-text-fill-color: transparent;
        }
        .fi-meta { color: #B8BFD6; font-size: 14px; margin-top: 5px; }
        .fi-badge {
          display: inline-block; margin-left: 12px; vertical-align: middle;
          background: linear-gradient(180deg, #FFD35E, #E0A62E); color: #1A1405;
          font-size: 11px; font-weight: 700; letter-spacing: 1.2px;
          border-radius: 999px; padding: 4px 12px;
        }
        .fi-desc { color: #8B96B2; font-size: 13px; font-style: italic; margin-top: 10px; max-width: 640px; }

        .fi-wrap { display: grid; grid-template-columns: 1fr 400px; gap: 22px; align-items: start; }
        @media (max-width: 940px) { .fi-wrap { grid-template-columns: 1fr; } }

        .fi-block {
          background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2);
          border-radius: 16px; padding: 22px 24px; margin-bottom: 22px;
        }
        .fi-block.leg { border-color: rgba(255,198,61,0.8); box-shadow: 0 0 22px rgba(255,198,61,0.18); }
        .fi-btitle {
          font-size: 12px; font-weight: 700; letter-spacing: 2px; color: ${GOLD};
          margin: 0 0 16px; text-transform: uppercase;
        }
        .fi-effet { font-size: 15px; padding: 5px 0; }
        .fi-effet.b { color: #4CC98D; }
        .fi-effet.m { color: #F26D6D; }
        .fi-cond { color: #B8BFD6; font-size: 14px; }

        .fi-row {
          position: relative;
          display: flex; align-items: center; gap: 12px; padding: 10px 12px;
          border-radius: 10px; cursor: pointer; font-size: 14px;
        }
        .fi-row:hover { background: rgba(77,216,230,0.08); }
        .fi-row .q { color: ${GOLD}; font-weight: 700; min-width: 38px; }
        .fi-row .n { color: ${CYAN}; font-weight: 600; }
        .fi-tip {
          position: absolute; left: 12px; top: calc(100% + 4px); z-index: 40;
          background: #10152A; border: 1px solid rgba(77,216,230,0.5); border-radius: 12px;
          box-shadow: 0 14px 34px rgba(0,0,0,0.6); padding: 14px 16px; min-width: 230px;
        }
        .fi-tip .tn { color: ${GOLD}; font-weight: 700; font-size: 14px; }
        .fi-tip .tt { color: #B8BFD6; font-size: 12px; margin: 3px 0 8px; }
        .fi-tip .ts { color: #E8EAF2; font-size: 12.5px; }
        .fi-tip .td { color: #7F8AA6; font-size: 10.5px; margin-top: 8px; }
        .fi-craft { color: #B8BFD6; font-size: 13px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,198,61,0.15); }

        .fi-piece {
          display: inline-block; margin: 0 8px 8px 0;
          background: rgba(255,198,61,0.07); border: 1px solid rgba(255,198,61,0.35);
          color: #E8EAF2; font-size: 12.5px; font-weight: 600;
          border-radius: 999px; padding: 7px 14px; cursor: pointer;
        }
        .fi-piece.cur { background: rgba(255,198,61,0.18); border-color: ${GOLD}; color: ${GOLD}; }
        .fi-piece:hover { border-color: ${GOLD}; color: ${GOLD}; }
        .fi-bonusrow { display: flex; gap: 12px; font-size: 13.5px; padding: 6px 0; }
        .fi-bonusrow .k { color: ${GOLD}; font-weight: 700; min-width: 60px; }
        .fi-bonusrow .v { color: #4CC98D; }

        .fi-obt { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 14px; }
        .fi-obt .n { color: ${CYAN}; font-weight: 600; cursor: pointer; }
        .fi-obt .d { color: #7F8AA6; font-size: 12.5px; }

        .fi-footer {
          position: relative; z-index: 5; border-top: 1px solid rgba(255,198,61,0.15);
          padding: 26px 16px; text-align: center; color: #7F8AA6; font-size: 12.5px;
        }
      `}</style>

      <div className="fi-nebula" />
      {stars.map((s) => (
        <div
          key={s.id}
          className="fi-star"
          style={{
            left: s.left + "%",
            top: s.top + "%",
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* ---- Barre de test ---- */}
      <div className="fi-testbar">
        <span className="fi-testlabel">🧪 MAQUETTE — FICHE ITEM</span>
        <button className={"fi-testbtn" + (legendaire ? " on" : "")} onClick={() => setLegendaire(!legendaire)}>
          ⭐ variante légendaire : {legendaire ? "ON" : "OFF"}
        </button>
        <span className="fi-testnote">Stats et recette : données d'exemple</span>
      </div>

      {/* ---- Barre Almanax ---- */}
      <div className="fi-almanax">
        <b>ALMANAX</b>
        <span className="date">Vendredi 10 juillet</span>
        <span className="info">Bonus du jour : +20 % XP métiers</span>
        <span className="info">Offrande : 3 × Gelée Bleutée</span>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>
          Voir l'Almanax →
        </a>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="fi-nav">
        <div className="fi-links">
          {["Équipements", "Métiers", "Donjons", "Bestiaire", "Quêtes"].map((l) => (
            <button className={"fi-navlink" + (l === "Équipements" ? " on" : "")} key={l}>
              {l}
            </button>
          ))}
        </div>
        <button className="fi-cnx">Connexion</button>
      </nav>

      <main className="fi-page">
        {/* ---- Fil d'Ariane ---- */}
        <div className="fi-crumb">
          <span>Équipements</span> › <span>Coiffes</span> › <b>{ITEM.nom}</b>
        </div>

        {/* ---- En-tête ---- */}
        <header className={"fi-head" + (legendaire ? " leg" : "")}>
          <div className="fi-img">
            <svg width="52" height="52" viewBox="0 0 60 60" aria-hidden="true">
              <path
                d="M10 42 C10 22 22 12 30 12 C38 12 50 22 50 42 L44 40 C40 46 20 46 16 40 Z"
                fill="none"
                stroke={GOLD}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle cx="30" cy="26" r="3" fill={GOLD} />
            </svg>
          </div>
          <div>
            <h1 className="fi-name">
              {ITEM.nom}
              {legendaire && <span className="fi-badge">LÉGENDAIRE</span>}
            </h1>
            <div className="fi-meta">
              Niv. {ITEM.niveau} — {ITEM.type}
            </div>
            <div className="fi-desc">{ITEM.description}</div>
          </div>
        </header>

        <div className="fi-wrap">
          {/* ---- Colonne principale ---- */}
          <div>
            <section className="fi-block">
              <h2 className="fi-btitle">Effets</h2>
              {ITEM.effets.map((e) => (
                <div className={"fi-effet " + e.k} key={e.t}>
                  {e.t}
                </div>
              ))}
            </section>

            {legendaire && (
              <section className="fi-block leg">
                <h2 className="fi-btitle">⭐ Sorts intégrés</h2>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                  {SORT_LEGENDAIRE.n}
                </div>
                <div style={{ color: "#B8BFD6", fontSize: 13.5 }}>{SORT_LEGENDAIRE.d}</div>
              </section>
            )}

            <section className="fi-block">
              <h2 className="fi-btitle">Conditions</h2>
              <div className="fi-cond">{ITEM.conditions}</div>
            </section>

            <section className="fi-block">
              <h2 className="fi-btitle">Obtention</h2>
              {ITEM.obtention.map((o) => (
                <div className="fi-obt" key={o.n}>
                  <span className="n">{o.n}</span>
                  <span className="d">{o.d}</span>
                </div>
              ))}
            </section>
          </div>

          {/* ---- Colonne contextuelle ---- */}
          <div>
            <section className="fi-block">
              <h2 className="fi-btitle">Recette de craft</h2>
              {ITEM.recette.map((r) => (
                <div
                  className="fi-row"
                  key={r.n}
                  onMouseEnter={() => setTip(r.n)}
                  onMouseLeave={() => setTip(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTip(tip === r.n ? null : r.n);
                  }}
                >
                  <span className="q">{r.q} ×</span>
                  <span className="n">{r.n}</span>
                  {tip === r.n && (
                    <div className="fi-tip">
                      <div className="tn">{r.n}</div>
                      <div className="tt">{r.type}</div>
                      <div className="ts">{r.src}</div>
                      <div className="td">Tooltip de démo — mini-fiche lue depuis la base</div>
                    </div>
                  )}
                </div>
              ))}
              <div className="fi-craft">🔨 {ITEM.craft}</div>
            </section>

            <section className="fi-block">
              <h2 className="fi-btitle">{ITEM.panoplie.nom}</h2>
              <div style={{ marginBottom: 14 }}>
                {ITEM.panoplie.pieces.map((p) => (
                  <span className={"fi-piece" + (p === ITEM.nom ? " cur" : "")} key={p}>
                    {p}
                  </span>
                ))}
              </div>
              {ITEM.panoplie.bonus.map((b) => (
                <div className="fi-bonusrow" key={b.n}>
                  <span className="k">{b.n}</span>
                  <span className="v">{b.t}</span>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>

      <footer className="fi-footer">
        DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games.
      </footer>
    </div>
  );
}
