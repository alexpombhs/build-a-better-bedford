/** Educational elastic-cable model: level anchors, a weightless cable,
 * vertical point loads, and uniform axial stiffness EA (kN).
 * Every segment has the same horizontal tension H; cable extension follows
 * Hooke's law: current segment length = rest length * (1 + T / EA).
 * We solve for H such that the sum of the segments' unstretched lengths
 * equals the fixed rest length of the entire cable.
 *
 * This is a static conceptual model, not a bridge design calculation.
 */
export type CableLoad = { position: number; load: number }

export type CableSolution = {
  xs: number[]
  ys: number[]
  horizontal: number
  leftReaction: number
  rightReaction: number
  tensions: number[]
  sag: number
  stretchedLength: number
  maxStrainPercent: number
}

export function solveElasticCable(
  span: number,
  restLength: number,
  stiffness: number,
  loadsInput: CableLoad[],
): CableSolution {
  const loads = [...loadsInput].sort((a, b) => a.position - b.position)
  const locations = loads.map(point => span * point.position / 100)
  const xs = [0, ...locations, span]
  const rightReaction = loads.reduce((sum, point, i) => sum + point.load * locations[i] / span, 0)
  const leftReaction = loads.reduce((sum, point) => sum + point.load, 0) - rightReaction

  // The vertical component of tension on each straight cable segment.
  const verticals = xs.slice(0, -1).map((_, i) =>
    leftReaction - loads.slice(0, i).reduce((sum, point) => sum + point.load, 0),
  )
  const widths = xs.slice(0, -1).map((x, i) => xs[i + 1] - x)
  const unstretchedLengthFor = (horizontal: number) =>
    widths.reduce((sum, width, i) => {
      const tension = Math.hypot(horizontal, verticals[i])
      const actualLength = width * tension / horizontal
      return sum + actualLength / (1 + tension / stiffness)
    }, 0)

  // Increasing H flattens the cable. Bisection is stable for the slider range,
  // including cases in which the anchors are farther apart than the rest length.
  let low = 1e-9
  let high = 1
  while (unstretchedLengthFor(high) > restLength && high < 1e9) high *= 2
  for (let i = 0; i < 90; i++) {
    const mid = (low + high) / 2
    if (unstretchedLengthFor(mid) > restLength) low = mid
    else high = mid
  }
  const horizontal = (low + high) / 2
  const ys = xs.map(x =>
    (leftReaction * x -
      loads.reduce((sum, point, i) => sum + point.load * Math.max(0, x - locations[i]), 0)
    ) / horizontal,
  )
  const tensions = verticals.map(vertical => Math.hypot(horizontal, vertical))
  const stretchedLength = widths.reduce(
    (sum, width, i) => sum + width * tensions[i] / horizontal,
    0,
  )

  return {
    xs,
    ys,
    horizontal,
    leftReaction,
    rightReaction,
    tensions,
    sag: Math.max(...ys),
    stretchedLength,
    maxStrainPercent: Math.max(...tensions) / stiffness * 100,
  }
}
