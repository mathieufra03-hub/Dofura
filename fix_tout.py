path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# FIX 1 — translate="no" sur le div principal pour bloquer la traduction navigateur
old1 = '    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"sans-serif" }}>'
new1 = '    <div translate="no" style={{ minHeight:"100vh", background:C.bg, fontFamily:"sans-serif" }}>'
content = content.replace(old1, new1)

# FIX 2 — Tacle/Fuite : les prendre sur data directement, pas dans grades
old2 = '''          <div key={s.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:`0.5px solid rgba(0,212,255,0.06)` }}>
              <span style={{ fontSize:12, color:C.txt2, display:"flex", alignItems:"center", gap:6 }}>
                <img src={s.icon} alt={s.label} style={{ width:14, height:14, objectFit:"contain" }} />
                {s.label}
              </span>
              <span style={{ fontSize:13, fontWeight:500, color:C.txt }}>{g[s.key] ?? "\u2014"}</span>
            </div>'''
new2 = '''          <div key={s.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:`0.5px solid rgba(0,212,255,0.06)` }}>
              <span style={{ fontSize:12, color:C.txt2, display:"flex", alignItems:"center", gap:6 }}>
                <img src={s.icon} alt={s.label} style={{ width:14, height:14, objectFit:"contain" }} />
                {s.label}
              </span>
              <span style={{ fontSize:13, fontWeight:500, color:C.txt }}>
                {(s.key === "tacle" || s.key === "fuite") ? (data[s.key] ?? "\u2014") : (g[s.key] ?? "\u2014")}
              </span>
            </div>'''
content = content.replace(old2, new2)

# FIX 3 — SortDetail : format vertical comme dofusdb, sans Diagonale/En ligne
old3 = '''function SortDetail({ data }) {
  const infos = [
    { label:"Co\u00fbt",    val: data.ap_cost ? `${data.ap_cost} PA` : "\u2014" },
    { label:"Port\u00e9e",  val: data.min_range != null && data.range != null
        ? (data.min_range === data.range ? `${data.range}` : `${data.min_range} \u00e0 ${data.range}`)
        : "\u2014" },
    { label:"Critique", val: data.critical_hit_probability ? `${data.critical_hit_probability}%` : "\u2014" },
    { label:"LdV", val: data.cast_test_los ? "Oui" : "Non" },
    { label:"Port\u00e9e +", val: data.range_can_be_boosted ? "Oui" : "Non" },
    { label:"En ligne", val: data.cast_in_line ? "Oui" : "Non" },
    { label:"Diagonale", val: data.cast_in_diagonal ? "Oui" : "Non" },
  ]
  if (data.max_cast_per_turn > 0)        infos.push({ label:"Lancer/tour",    val: `${data.max_cast_per_turn}` })
  if (data.max_cast_per_target > 0)      infos.push({ label:"Lancer/cible",   val: `${data.max_cast_per_target}` })
  if (data.max_global_cast_per_turn > 0) infos.push({ label:"Lancer global",  val: `${data.max_global_cast_per_turn}` })
  if (data.min_cast_interval > 0)        infos.push({ label:"Intervalle",     val: `${data.min_cast_interval} tours` })
  if (data.initial_cooldown > 0)         infos.push({ label:"CD initial",     val: `${data.initial_cooldown} tours` })
  if (data.global_cooldown > 0)          infos.push({ label:"CD global",      val: `${data.global_cooldown} tours` })

  return (
    <div>
      {/* header sort */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        {data.img && (
          <img src={data.img} alt={data.nom} style={{ width:40, height:40, objectFit:"contain", background:C.bg4, borderRadius:6, padding:2 }} />
        )}
        <span style={{ fontSize:14, fontWeight:500, color:C.gold2 }}>{data.nom}</span>
      </div>

      {/* infos en ligne */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
        {infos.map(i => (
          <span key={i.label} style={{
            background:C.bg4,
            border:`0.5px solid ${C.bdr}`,
            borderRadius:6, padding:"3px 9px",
            fontSize:11, color:C.txt2,
          }}>
            <span style={{ color:C.cyan }}>{i.label}</span>{" "}{i.val}
          </span>
        ))}
      </div>

      {/* effets normaux */}
      {data.effects?.length > 0 && (
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:6 }}>Effets</div>
          {data.effects.map((e, i) => (
            <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:C.prp2, fontSize:10 }}>\u25b8</span> {e.texte}
            </div>
          ))}
        </div>
      )}

      {/* effets critiques */}
      {data.critical_effects?.length > 0 && (
        <div>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.gold, marginBottom:6 }}>Effets critiques</div>
          {data.critical_effects.map((e, i) => (
            <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"3px 0", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:C.gold, fontSize:10 }}>\u2605</span> {e.texte}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}'''

new3 = '''function SortDetail({ data }) {
  const portee = data.min_range != null && data.range != null
    ? (data.min_range === data.range ? `${data.range}` : `${data.min_range} \u00e0 ${data.range}`)
    : "\u2014"

  const lignes = [
    `Co\u00fbt ${data.ap_cost ?? 0} PA`,
    `Port\u00e9e ${portee}`,
    `Critique ${data.critical_hit_probability ?? 0}%`,
    data.cast_test_los ? "N\u00e9cessite une ligne de vue" : "Ne n\u00e9cessite pas de ligne de vue",
    data.range_can_be_boosted ? "Port\u00e9e modifiable" : null,
  ].filter(Boolean)

  if (data.max_cast_per_target > 0)      lignes.push(`Limitation par tour par cible\u00a0: ${data.max_cast_per_target}`)
  if (data.max_cast_per_turn > 0)        lignes.push(`Limitation par tour\u00a0: ${data.max_cast_per_turn}`)
  if (data.max_global_cast_per_turn > 0) lignes.push(`Limitation globale par tour\u00a0: ${data.max_global_cast_per_turn}`)
  if (data.min_cast_interval > 0)        lignes.push(`Intervalle de relance\u00a0: ${data.min_cast_interval}`)
  if (data.initial_cooldown > 0)         lignes.push(`Intervalle de relance initial\u00a0: ${data.initial_cooldown}`)
  if (data.global_cooldown > 0)          lignes.push(`Intervalle de relance global\u00a0: ${data.global_cooldown}`)

  return (
    <div>
      {/* header sort */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        {data.img && (
          <img src={data.img} alt={data.nom} style={{ width:40, height:40, objectFit:"contain", background:C.bg4, borderRadius:6, padding:2 }} />
        )}
        <span style={{ fontSize:15, fontWeight:500, color:C.gold2 }}>{data.nom}</span>
      </div>

      {/* infos verticales comme dofusdb */}
      <div style={{ marginBottom:14 }}>
        {lignes.map((l, i) => (
          <div key={i} style={{ fontSize:12, color:C.txt2, padding:"2px 0", lineHeight:1.7 }}>
            {l}
          </div>
        ))}
      </div>

      {/* effets en deux colonnes */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {data.effects?.length > 0 && (
          <div>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.txt3, marginBottom:8 }}>Effet</div>
            {data.effects.map((e, i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.prp2, fontSize:10 }}>\u25c6</span> {e.texte}
              </div>
            ))}
          </div>
        )}
        {data.critical_effects?.length > 0 && (
          <div>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.gold, marginBottom:8 }}>Effet critique</div>
            {data.critical_effects.map((e, i) => (
              <div key={i} translate="no" style={{ fontSize:12, color:C.txt, padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.gold, fontSize:10 }}>\u25c6</span> {e.texte}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}'''

content = content.replace(old3, new3)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK — 3 fixes appliqués")