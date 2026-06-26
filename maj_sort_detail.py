path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = '''  const infos = [
    { label:"Coût",    val: data.ap_cost ? `${data.ap_cost} PA` : "—" },
    { label:"Portée",  val: data.min_range != null && data.range != null
        ? (data.min_range === data.range ? `${data.range}` : `${data.min_range} à ${data.range}`)
        : "—" },
    { label:"Critique", val: data.critical_hit_probability ? `${data.critical_hit_probability}%` : "—" },
    { label:"Ligne de vue", val: data.cast_test_los ? "Oui" : "Non" },
    { label:"Portée modifiable", val: data.range_can_be_boosted ? "Oui" : "Non" },
  ]
  if (data.max_cast_per_turn > 0)   infos.push({ label:"Lancer/tour", val: `${data.max_cast_per_turn}` })
  if (data.global_cooldown > 0)     infos.push({ label:"Cooldown",    val: `${data.global_cooldown} tours` })'''

new = '''  const infos = [
    { label:"Coût",    val: data.ap_cost ? `${data.ap_cost} PA` : "—" },
    { label:"Portée",  val: data.min_range != null && data.range != null
        ? (data.min_range === data.range ? `${data.range}` : `${data.min_range} à ${data.range}`)
        : "—" },
    { label:"Critique", val: data.critical_hit_probability ? `${data.critical_hit_probability}%` : "—" },
    { label:"LdV", val: data.cast_test_los ? "Oui" : "Non" },
    { label:"Portée +", val: data.range_can_be_boosted ? "Oui" : "Non" },
    { label:"En ligne", val: data.cast_in_line ? "Oui" : "Non" },
    { label:"Diagonale", val: data.cast_in_diagonal ? "Oui" : "Non" },
  ]
  if (data.max_cast_per_turn > 0)        infos.push({ label:"Lancer/tour",    val: `${data.max_cast_per_turn}` })
  if (data.max_cast_per_target > 0)      infos.push({ label:"Lancer/cible",   val: `${data.max_cast_per_target}` })
  if (data.max_global_cast_per_turn > 0) infos.push({ label:"Lancer global",  val: `${data.max_global_cast_per_turn}` })
  if (data.min_cast_interval > 0)        infos.push({ label:"Intervalle",     val: `${data.min_cast_interval} tours` })
  if (data.initial_cooldown > 0)         infos.push({ label:"CD initial",     val: `${data.initial_cooldown} tours` })
  if (data.global_cooldown > 0)          infos.push({ label:"CD global",      val: `${data.global_cooldown} tours` })'''

if old in content:
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK — SortDetail mis à jour")
else:
    print("ERREUR — texte non trouvé")