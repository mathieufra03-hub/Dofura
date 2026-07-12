import { useState, useMemo, useEffect } from "react";

const GOLD = "#FFC63D";
const CYAN = "#4DD8E6";

// ============================================================
// DONNÉES D'EXEMPLE — le vrai site lira la base Dofura.
// Les mécaniques du boss seront rédigées par toi / Krag (jamais copiées d'un autre site).
// ============================================================
const DONJON = {
  n: "Donjon Bouftou",
  boss: "Bouftou Royal",
  lv: 26,
  pos: "[-1, -25]",
  zone: "Astrub · Coin des Bouftous",
  pierreAme: 100,
  nbSalles: 5,
  acces: {
    desc: "Rends-toi au Coin des Bouftous à Astrub. Parle au PNJ à l'entrée pour pénétrer dans le donjon.",
    cle: "Clé du Donjon Bouftou",
    recette: [
      { n: "Laine de Bouftou royale", q: 1 },
      { n: "Corne de Bouftou", q: 5 },
    ],
  },
  sallesNormales: [
    { s: 1, mobs: ["Bouftou", "Boufton noir"] },
    { s: 2, mobs: ["Bouftou", "Bouftou blanc"] },
    { s: 3, mobs: ["Bouftou blanc", "Boufton noir"] },
    { s: 4, mobs: ["Bouftou", "Bouftou blanc", "Boufton noir"] },
  ],
  boss_salle: {
    resume:
      "Le Bouftou Royal est accompagné de plusieurs Bouftous. Il frappe fort au corps-à-corps et gagne en puissance quand ses alliés sont en vie.",
    stats: { pv: "2 500", pa: 10, pm: 4, resTerre: "20 %", resFeu: "0 %", resEau: "10 %", resAir: "0 %" },
    mecaniques: [
      "Le boss inflige de gros dégâts de mêlée : garde tes personnages fragiles à distance.",
      "Tant que des Bouftous l'entourent, le Royal bénéficie d'un bonus — réduis d'abord son escorte.",
      "Attention aux tours où il se déplace vite : anticipe son placement pour ne pas te faire coller.",
    ],
    note: "Carte, stats et mécaniques : données d'exemple — le vrai site les lira depuis la base (jamais copiées d'un autre site).",
  },
  monstres: [
    { n: "Bouftou Royal", lv: 26, boss: true },
    { n: "Bouftou", lv: 12 },
    { n: "Bouftou blanc", lv: 15 },
    { n: "Boufton noir", lv: 5 },
  ],
  quetes: [
    { n: "La Voie du Bouftou", lv: 20 },
    { n: "Les Œufs du Dragon", lv: 100 },
  ],
  succes: [
    { n: "Duo", pts: 20, d: "Terminer le donjon à deux joueurs maximum." },
    { n: "Trio", pts: 20, d: "Terminer le donjon à trois joueurs maximum." },
    { n: "Bouftou pacifiste", pts: 40, d: "Vaincre le boss sans tuer son escorte." },
  ],
  butins: [
    { n: "Laine de Bouftou royale", taux: "12 %", k: "res" },
    { n: "Corne de Bouftou", taux: "8 %", k: "res" },
    { n: "Coiffe du Bouftou Royal", taux: "1 %", k: "item" },
    { n: "Cape Royale", taux: "0,8 %", k: "item" },
  ],
};

export default function DofuraFicheDonjon() {
  const [tip, setTip] = useState(null);
  const [logged, setLogged] = useState(true);
  const [succesDone, setSuccesDone] = useState(DONJON.succes.map(() => false));
  const [quetesDone, setQuetesDone] = useState(DONJON.quetes.map(() => false));

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

  return (
    <div className="dj-root">
      <style>{`
        .dj-root { min-height: 100vh; background: #0C0F1D; font-family: 'Inter', system-ui, sans-serif; color: #E8EAF2; position: relative; overflow-x: hidden; }
        .dj-nebula {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 720px 520px at 82% 6%, rgba(55,199,224,0.16), transparent 65%),
            radial-gradient(ellipse 700px 540px at 3% 40%, rgba(179,63,201,0.13), transparent 65%),
            radial-gradient(ellipse 620px 420px at 46% 0%, rgba(90,63,201,0.13), transparent 65%);
        }
        .dj-star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }

        .dj-testbar { position: sticky; top: 0; z-index: 60; background: #05070F; border-bottom: 1px solid rgba(77,216,230,0.35); padding: 8px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .dj-testlabel { font-size: 11px; letter-spacing: 1.5px; color: ${CYAN}; font-weight: 700; }
        .dj-testnote { font-size: 11px; color: #7F8AA6; }

        .dj-almanax { position: relative; z-index: 5; background: rgba(16,21,42,0.92); border-bottom: 1px solid rgba(255,198,61,0.2); padding: 9px 20px; display: flex; align-items: center; gap: 20px; font-size: 12.5px; overflow-x: auto; white-space: nowrap; }
        .dj-almanax b { color: ${GOLD}; letter-spacing: 1.5px; font-size: 12px; }
        .dj-almanax .info { color: #B8BFD6; }
        .dj-almanax .link { color: ${CYAN}; font-weight: 600; margin-left: auto; text-decoration: none; }

        .dj-nav { position: relative; z-index: 50; background: rgba(14,19,34,0.85); border-bottom: 1px solid rgba(255,198,61,0.25); padding: 0 20px; display: flex; align-items: center; min-height: 54px; }
        .dj-links { display: flex; align-items: center; gap: 2px; flex: 1; overflow-x: auto; }
        .dj-navlink { background: none; border: none; color: #E8EAF2; font-size: 14.5px; font-family: inherit; padding: 17px 13px; cursor: pointer; white-space: nowrap; }
        .dj-navlink:hover { color: ${GOLD}; }
        .dj-navlink.on { color: ${GOLD}; font-weight: 600; }
        .dj-cnx { margin-left: auto; background: rgba(255,198,61,0.08); color: ${GOLD}; border: 1px solid rgba(255,198,61,0.7); border-radius: 10px; padding: 8px 18px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; }

        .dj-page { position: relative; z-index: 10; max-width: 1240px; margin: 0 auto; padding: 26px 20px 60px; }
        .dj-crumb { font-size: 12.5px; color: #7F8AA6; margin-bottom: 18px; }
        .dj-crumb span { color: ${CYAN}; cursor: pointer; }
        .dj-crumb b { color: #B8BFD6; font-weight: 600; }

        .dj-head { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.25); border-radius: 18px; padding: 24px; margin-bottom: 22px; }
        .dj-bossimg { width: 90px; height: 90px; border-radius: 16px; flex-shrink: 0; background: rgba(12,15,29,0.8); border: 1px solid rgba(255,198,61,0.4); display: flex; align-items: center; justify-content: center; font-size: 40px; }
        .dj-name { font-size: clamp(23px, 4vw, 31px); font-weight: 700; margin: 0; background: linear-gradient(180deg, #FFE08A, #DE9B1F); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }
        .dj-metaline { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 10px; }
        .dj-metaline span { color: #B8BFD6; font-size: 13.5px; }
        .dj-metaline b { color: ${GOLD}; font-weight: 600; }

        .dj-wrap { display: grid; grid-template-columns: 1fr 340px; gap: 22px; align-items: start; }
        @media (max-width: 900px) { .dj-wrap { grid-template-columns: 1fr; } }
        .dj-block { background: rgba(20,26,46,0.92); border: 1px solid rgba(255,198,61,0.2); border-radius: 16px; padding: 22px 24px; margin-bottom: 22px; }
        .dj-btitle { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: ${GOLD}; margin: 0 0 16px; text-transform: uppercase; }

        /* Salle du boss : bloc mis en valeur */
        .dj-boss.dj-block { border-color: rgba(255,198,61,0.8); box-shadow: 0 0 26px rgba(255,198,61,0.2); background: rgba(24,30,52,0.95); }
        .dj-bossname { color: ${GOLD}; font-weight: 700; font-size: 19px; margin: 0 0 4px; }
        .dj-bossresume { color: #B8BFD6; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
        .dj-meca { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dj-meca:last-of-type { border-bottom: none; }
        .dj-mecaic { color: ${CYAN}; font-size: 15px; margin-top: 1px; flex-shrink: 0; }
        .dj-mecatext { font-size: 14px; color: #E8EAF2; line-height: 1.55; }
        .dj-bossnote { color: #7F8AA6; font-size: 11.5px; font-style: italic; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,198,61,0.15); }

        /* Salles normales : liste de monstres */
        .dj-salle { display: flex; gap: 12px; padding: 8px 0; font-size: 13.5px; }
        .dj-salle .num { color: ${GOLD}; font-weight: 700; flex-shrink: 0; min-width: 62px; }
        .dj-salle .txt { color: #B8BFD6; }
        .dj-salle .txt .mob { color: ${CYAN}; cursor: pointer; }
        .dj-salle .txt .mob:hover { text-decoration: underline; }

        /* Case à cocher (pattern quêtes) */
        .dj-box { width: 22px; height: 22px; flex-shrink: 0; border-radius: 6px; border: 2px solid rgba(255,198,61,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
        .dj-box.on { background: linear-gradient(180deg, #FFD35E, #E0A62E); border-color: ${GOLD}; color: #1A1405; font-weight: 700; font-size: 14px; }
        .dj-box.dim { opacity: 0.4; cursor: not-allowed; }
        .dj-synced { color: #4CC98D; font-size: 11px; margin-top: 12px; font-style: italic; display: flex; align-items: center; gap: 6px; }
        .dj-loginnote { color: #7F8AA6; font-size: 11.5px; margin-top: 12px; font-style: italic; }

        .dj-acces { color: #B8BFD6; font-size: 14px; line-height: 1.6; }
        .dj-pos { color: #E8EAF2; font-size: 15px; margin-bottom: 12px; padding: 10px 14px; background: rgba(77,216,230,0.08); border: 1px solid rgba(77,216,230,0.3); border-radius: 10px; display: inline-block; }
        .dj-pos b { color: ${CYAN}; font-weight: 700; }
        .dj-carte { margin-bottom: 18px; }
        .dj-carteinner { aspect-ratio: 16 / 10; background: rgba(12,15,29,0.7); border: 1px dashed rgba(255,198,61,0.35); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .dj-carteic { font-size: 34px; }
        .dj-cartetxt { color: #B8BFD6; font-size: 14px; font-weight: 600; }
        .dj-cartesub { color: #7F8AA6; font-size: 11.5px; }
        .dj-statsgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(78px, 1fr)); gap: 8px; margin-bottom: 18px; }
        .dj-stat { background: rgba(12,15,29,0.6); border: 1px solid rgba(255,198,61,0.15); border-radius: 10px; padding: 9px 6px; text-align: center; }
        .dj-stat .k { display: block; color: #7F8AA6; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .dj-stat .v { display: block; color: ${GOLD}; font-size: 16px; font-weight: 700; margin-top: 3px; }
        .dj-clerow { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,198,61,0.15); }
        .dj-cleic { width: 34px; height: 34px; border-radius: 8px; background: rgba(12,15,29,0.8); border: 1px solid rgba(255,198,61,0.35); display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .dj-clename { color: ${GOLD}; font-weight: 600; font-size: 13.5px; }
        .dj-clerecette { color: #7F8AA6; font-size: 12px; margin-top: 2px; }
        .dj-clerecette .r { color: ${CYAN}; cursor: pointer; }

        .dj-mrow { position: relative; display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 10px; cursor: pointer; }
        .dj-mrow:hover { background: rgba(77,216,230,0.08); }
        .dj-mrow .mn { color: ${CYAN}; font-weight: 600; font-size: 14px; flex: 1; }
        .dj-mrow:hover .mn { text-decoration: underline; }
        .dj-mrow .ml { color: #7F8AA6; font-size: 12px; }
        .dj-mboss { background: linear-gradient(180deg, #FFD35E, #E0A62E); color: #1A1405; font-size: 9.5px; font-weight: 700; letter-spacing: 1px; border-radius: 999px; padding: 3px 9px; }

        .dj-link.dj-block { border-color: rgba(77,216,230,0.35); }
        .dj-linkrow { display: flex; align-items: center; gap: 12px; padding: 9px 0; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dj-linkrow:last-child { border-bottom: none; }
        .dj-linkmain { flex: 1; min-width: 0; }
        .dj-linkname { color: ${CYAN}; font-weight: 600; font-size: 14px; }
        .dj-linkmeta { color: #7F8AA6; font-size: 11.5px; margin-top: 1px; }
        .dj-linkrow:hover .dj-linkname { text-decoration: underline; }
        .dj-linkgo { color: ${CYAN}; font-size: 16px; }

        .dj-succ { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dj-succ:last-child { border-bottom: none; }
        .dj-succtop { display: flex; align-items: center; gap: 10px; }
        .dj-succname { color: #E8EAF2; font-weight: 600; font-size: 14px; flex: 1; }
        .dj-succpts { color: ${GOLD}; font-weight: 700; font-size: 12.5px; }
        .dj-succd { color: #7F8AA6; font-size: 12px; margin-top: 3px; }

        .dj-butin { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
        .dj-butinic { width: 30px; height: 30px; border-radius: 8px; background: rgba(12,15,29,0.8); border: 1px solid rgba(255,198,61,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .dj-butinname { flex: 1; font-size: 13.5px; }
        .dj-butinname.res { color: #4CC98D; cursor: pointer; }
        .dj-butinname.item { color: ${CYAN}; cursor: pointer; }
        .dj-butintaux { color: ${GOLD}; font-weight: 700; font-size: 12.5px; }

        .dj-footer { position: relative; z-index: 5; border-top: 1px solid rgba(255,198,61,0.15); padding: 26px 16px; text-align: center; color: #7F8AA6; font-size: 12.5px; }
      `}</style>

      <div className="dj-nebula" />
      {stars.map((s) => (
        <div key={s.id} className="dj-star" style={{ left: s.left + "%", top: s.top + "%", width: s.size, height: s.size, opacity: s.opacity }} />
      ))}

      {/* ---- Barre de test ---- */}
      <div className="dj-testbar">
        <span className="dj-testlabel">🧪 MAQUETTE — FICHE DONJON</span>
        <button
          className="dj-jbtn"
          style={{ background: "transparent", color: "#B8BFD6", border: "1px solid rgba(184,191,214,0.35)", borderRadius: 999, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600 }}
          onClick={() => setLogged(!logged)}
        >
          {logged ? "👤 simuler : déconnecté" : "👤 simuler : connecté"}
        </button>
        <span className="dj-testnote">Données et mécaniques de démo</span>
      </div>

      {/* ---- Barre Almanax ---- */}
      <div className="dj-almanax">
        <b>ALMANAX</b>
        <span className="info">Bonus du jour : +20 % XP métiers</span>
        <span className="info">Offrande : 3 × Gelée Bleutée</span>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>Voir l'Almanax →</a>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="dj-nav">
        <div className="dj-links">
          {["Équipements", "Métiers", "Donjons", "Bestiaire", "Quêtes"].map((l) => (
            <button className={"dj-navlink" + (l === "Donjons" ? " on" : "")} key={l}>{l}</button>
          ))}
        </div>
        <button className="dj-cnx">Connexion</button>
      </nav>

      <main className="dj-page">
        <div className="dj-crumb">
          <span>Donjons</span> › <b>{DONJON.n}</b>
        </div>

        {/* ---- En-tête ---- */}
        <header className="dj-head">
          <div className="dj-bossimg">👑</div>
          <div>
            <h1 className="dj-name">{DONJON.n}</h1>
            <div className="dj-metaline">
              <span>Boss : <b>{DONJON.boss}</b></span>
              <span>Niveau conseillé : <b>{DONJON.lv}</b></span>
              <span>{DONJON.zone}</span>
              <span>Pierre d'âme : <b>{DONJON.pierreAme}</b></span>
            </div>
          </div>
        </header>

        {/* ---- Accès + clé : juste sous l'en-tête ---- */}
        <section className="dj-block" style={{ marginBottom: 22 }}>
          <h2 className="dj-btitle">Accès</h2>
          <div className="dj-pos">📍 Position : <b>{DONJON.pos}</b></div>
          <p className="dj-acces">{DONJON.acces.desc}</p>
          <div className="dj-clerow">
            <div className="dj-cleic">🗝️</div>
            <div>
              <div className="dj-clename">{DONJON.acces.cle}</div>
              <div className="dj-clerecette">
                Recette :{" "}
                {DONJON.acces.recette.map((r, i) => (
                  <span key={r.n}>
                    {i > 0 ? ", " : ""}
                    {r.q} × <span className="r">{r.n}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="dj-wrap">
          {/* ---- Colonne principale ---- */}
          <div>
            {/* SALLE DU BOSS — le bloc star */}
            <section className="dj-boss dj-block">
              <h2 className="dj-btitle">⚔️ Salle du boss</h2>
              <div className="dj-bossname">{DONJON.boss}</div>

              {/* Carte de la salle */}
              <div className="dj-carte">
                <div className="dj-carteinner">
                  <span className="dj-carteic">🗺️</span>
                  <span className="dj-cartetxt">Carte de la salle du boss</span>
                  <span className="dj-cartesub">Image du plan de combat — chargée depuis la base</span>
                </div>
              </div>

              {/* Stats du boss */}
              <div className="dj-statsgrid">
                <div className="dj-stat"><span className="k">PV</span><span className="v">{DONJON.boss_salle.stats.pv}</span></div>
                <div className="dj-stat"><span className="k">PA</span><span className="v">{DONJON.boss_salle.stats.pa}</span></div>
                <div className="dj-stat"><span className="k">PM</span><span className="v">{DONJON.boss_salle.stats.pm}</span></div>
                <div className="dj-stat"><span className="k">Rés. Terre</span><span className="v">{DONJON.boss_salle.stats.resTerre}</span></div>
                <div className="dj-stat"><span className="k">Rés. Feu</span><span className="v">{DONJON.boss_salle.stats.resFeu}</span></div>
                <div className="dj-stat"><span className="k">Rés. Eau</span><span className="v">{DONJON.boss_salle.stats.resEau}</span></div>
                <div className="dj-stat"><span className="k">Rés. Air</span><span className="v">{DONJON.boss_salle.stats.resAir}</span></div>
              </div>

              <p className="dj-bossresume">{DONJON.boss_salle.resume}</p>
              {DONJON.boss_salle.mecaniques.map((m, i) => (
                <div className="dj-meca" key={i}>
                  <span className="dj-mecaic">◆</span>
                  <span className="dj-mecatext">{m}</span>
                </div>
              ))}
              <div className="dj-bossnote">{DONJON.boss_salle.note}</div>
            </section>

            {/* Monstres */}
            <section className="dj-block">
              <h2 className="dj-btitle">Monstres du donjon</h2>
              {DONJON.monstres.map((m) => (
                <div className="dj-mrow" key={m.n}>
                  <span className="mn">{m.n}</span>
                  <span className="ml">Niv. {m.lv}</span>
                  {m.boss && <span className="dj-mboss">BOSS</span>}
                  <span className="dj-linkgo" style={{ marginLeft: 4 }}>→</span>
                </div>
              ))}
            </section>
          </div>

          {/* ---- Colonne contextuelle (cross-linking) ---- */}
          <div>
            <section className="dj-link dj-block">
              <h2 className="dj-btitle">🗺️ Quêtes associées</h2>
              {DONJON.quetes.map((q, i) => (
                <div className="dj-linkrow" key={q.n}>
                  <div
                    className={"dj-box" + (quetesDone[i] ? " on" : "") + (logged ? "" : " dim")}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (logged) setQuetesDone(quetesDone.map((v, j) => (j === i ? !v : v)));
                    }}
                    title={logged ? "Marquer comme terminée" : "Connecte-toi pour cocher"}
                  >
                    {quetesDone[i] ? "✓" : ""}
                  </div>
                  <div className="dj-linkmain">
                    <div className="dj-linkname">{q.n}</div>
                    <div className="dj-linkmeta">Niv. {q.lv}</div>
                  </div>
                  <span className="dj-linkgo">→</span>
                </div>
              ))}
              {logged ? (
                <div className="dj-synced">✦ Coché ici = validé sur ta fiche quête et ton suivi</div>
              ) : (
                <div className="dj-loginnote">Connecte-toi pour suivre tes quêtes.</div>
              )}
            </section>

            <section className="dj-block">
              <h2 className="dj-btitle">🏆 Succès du donjon</h2>
              {DONJON.succes.map((s, i) => (
                <div className="dj-succ" key={s.n}>
                  <div className="dj-succtop">
                    <div
                      className={"dj-box" + (succesDone[i] ? " on" : "") + (logged ? "" : " dim")}
                      onClick={() => {
                        if (logged) setSuccesDone(succesDone.map((v, j) => (j === i ? !v : v)));
                      }}
                      title={logged ? "Marquer comme réussi" : "Connecte-toi pour cocher"}
                    >
                      {succesDone[i] ? "✓" : ""}
                    </div>
                    <span className="dj-succname">{s.n}</span>
                    <span className="dj-succpts">{s.pts} pts</span>
                  </div>
                  <div className="dj-succd">{s.d}</div>
                </div>
              ))}
              {logged ? (
                <div className="dj-synced">✦ Coché ici = validé partout où ce succès apparaît</div>
              ) : (
                <div className="dj-loginnote">Connecte-toi pour suivre tes succès.</div>
              )}
            </section>

            <section className="dj-block">
              <h2 className="dj-btitle">🎁 Butins du boss</h2>
              {DONJON.butins.map((b) => (
                <div className="dj-butin" key={b.n}>
                  <span className="dj-butinic">{b.k === "res" ? "🌿" : "⚔️"}</span>
                  <span className={"dj-butinname " + b.k}>{b.n}</span>
                  <span className="dj-butintaux">{b.taux}</span>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>

      <footer className="dj-footer">
        DOFURA — fan-site non officiel. Dofus et Krosmoz sont des marques d'Ankama Games.
      </footer>
    </div>
  );
}
