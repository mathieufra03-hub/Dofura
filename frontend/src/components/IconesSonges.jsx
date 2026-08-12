// Icônes réutilisables de L'Œil de Draconiros (refonte visuelle) — jamais de
// <img> en dur pour ces visuels, toujours passer par ces composants.

export function IconeBribe({ size = 20, style }) {
  return <img src="/assets/oeil/bribe-de-reve.png" alt="" style={{ width: size, height: size, ...style }} />
}

export function IconeCoffre({ size = 20, style }) {
  return <img src="/assets/oeil/coffre-bribes.png" alt="" style={{ width: size, height: size, ...style }} />
}

export function IconeSablier({ size = 24, style }) {
  return <img src="/assets/oeil/sablier-minuteur.png" alt="" aria-hidden="true" style={{ width: size, height: size, ...style }} />
}

export function IconeTeamPersonnages({ size = 20, style }) {
  return <img src="/assets/oeil/ui/icone-team-personnages.png" alt="" aria-hidden="true" style={{ width: size, height: size, ...style }} />
}

export function IconeIntensiteEliatrope({ size = 20, style }) {
  return <img src="/assets/oeil/ui/icone-intensite-eliatrope.png" alt="" aria-hidden="true" style={{ width: size, height: size, ...style }} />
}
