path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = '''const STATS = [
  { key: "pv",        label: "PV",      icon: "/assets/icons/stats/pv.webp"       },
  { key: "pa",        label: "PA",      icon: "/assets/icons/stats/pa.webp"       },
  { key: "pm",        label: "PM",      icon: "/assets/icons/stats/pm.webp"       },
  { key: "xp",        label: "XP",      icon: "/assets/icons/stats/xp.webp"       },
  { key: "tacle",     label: "Tacle",   icon: "/assets/icons/stats/tacle.webp"    },
  { key: "fuite",     label: "Fuite",   icon: "/assets/icons/stats/fuite.webp"    },
  { key: "esquive_pa",label: "Esq.PA",  icon: "/assets/icons/stats/esquive_pa.webp"},
  { key: "esquive_pm",label: "Esq.PM",  icon: "/assets/icons/stats/esquive_pm.webp"},
]

const ELEM = [
  { key: "res_neutre", label: "Neutre", dot: "#B4B2A9", icon: "/assets/icons/elements/neutre.webp"  },
  { key: "res_terre",  label: "Terre",  dot: "#639922", icon: "/assets/icons/elements/terre.webp"   },
  { key: "res_feu",    label: "Feu",    dot: "#D85A30", icon: "/assets/icons/elements/feu.webp"     },
  { key: "res_eau",    label: "Eau",    dot: "#378ADD", icon: "/assets/icons/elements/eau.webp"     },
  { key: "res_air",    label: "Air",    dot: "#1D9E75", icon: "/assets/icons/elements/air.webp"     },
]'''

new = '''const STATS = [
  { key: "pv",        label: "PV",      icon: "/assets/icons/stats/health.webp"   },
  { key: "pa",        label: "PA",      icon: "/assets/icons/stats/ap.webp"       },
  { key: "pm",        label: "PM",      icon: "/assets/icons/stats/mp.webp"       },
  { key: "xp",        label: "XP",      icon: "/assets/icons/stats/experience.webp"},
  { key: "tacle",     label: "Tacle",   icon: "/assets/icons/stats/tackle.webp"   },
  { key: "fuite",     label: "Fuite",   icon: "/assets/icons/stats/evasion.webp"  },
  { key: "esquive_pa",label: "Esq.PA",  icon: "/assets/icons/stats/dodge_ap.webp" },
  { key: "esquive_pm",label: "Esq.PM",  icon: "/assets/icons/stats/dodge_mp.webp" },
]

const ELEM = [
  { key: "res_neutre", label: "Neutre", dot: "#B4B2A9", icon: "/assets/icons/elements/neutral.webp" },
  { key: "res_terre",  label: "Terre",  dot: "#639922", icon: "/assets/icons/elements/earth.webp"   },
  { key: "res_feu",    label: "Feu",    dot: "#D85A30", icon: "/assets/icons/elements/fire.webp"    },
  { key: "res_eau",    label: "Eau",    dot: "#378ADD", icon: "/assets/icons/elements/water.webp"   },
  { key: "res_air",    label: "Air",    dot: "#1D9E75", icon: "/assets/icons/elements/air.webp"     },
]'''

if old in content:
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK — chemins icônes corrigés")
else:
    print("ERREUR — texte non trouvé")