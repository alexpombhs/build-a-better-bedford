/**
 * Educational three-hinged parabolic arch carrying downward vertical loads.
 *
 * A symmetric parabolic arch of rise r is anti-funicular for a uniform
 * vertical load q (kN/m of horizontal span). Added point loads create a
 * bending-moment difference between the *fixed* arch and the load's line
 * of thrust. For a three-hinged arch, crown moment is zero and:
 *
 *   VA = qL/2 + sum(Pi * (1 - ai/L))
 *   VB = qL/2 + sum(Pi * ai/L)
 *   H = M_simple(L/2) / r
 *   M_arch(x) = M_simple(x) - H * y_arch(x)
 *
 * The visually plotted thrust line has y = M_simple(x)/H.
 * Its approximate normal separation from the arch centerline serves as
 * a schematic indicator ONLY. It is not a masonry-collapse analysis,
 * strength calculation, or guarantee of structural safety.
 */
export type ArchPointLoad = { position: number; load: number }
export type ArchSample = {
  x: number
  archY: number
  thrustY: number
  moment: number
  normalOffset: number
}
export type ArchResult = {
  leftReaction: number
  rightReaction: number
  horizontalThrust: number
  maxBendingMoment: number
  maxNormalOffset: number
  samples: ArchSample[]
}

export const archHeight = (span: number, rise: number, x: number) => {
  const t = x / span
  return 4 * rise * t * (1 - t)
}

export function solveThreeHingedArch(
  span: number,
  rise: number,
  uniformLoad: number,
  pointLoads: ArchPointLoad[],
): ArchResult {
  const loads = pointLoads.map(({ position, load }) => ({
    x: span * position / 100,
    load,
  }))
  const leftReaction = uniformLoad * span / 2 +
    loads.reduce((sum, item) => sum + item.load * (1 - item.x / span), 0)
  const rightReaction = uniformLoad * span / 2 +
    loads.reduce((sum, item) => sum + item.load * item.x / span, 0)
  const simpleMoment = (x: number) =>
    leftReaction * x - uniformLoad * x * x / 2 -
    loads.reduce((sum, item) => sum + item.load * Math.max(0, x - item.x), 0)

  const horizontalThrust = simpleMoment(span / 2) / rise
  // Sample at loads, crown, and regular intervals: this includes the
  // moment discontinuity in slope at concentrated point loads.
  const locations = [
    ...Array.from({ length: 101 }, (_, i) => span * i / 100),
    ...loads.map(item => item.x),
    span / 2,
  ].sort((a, b) => a - b)
  const samples = locations.map(x => {
    const archY = archHeight(span, rise, x)
    const moment = simpleMoment(x) - horizontalThrust * archY
    const thrustY = simpleMoment(x) / horizontalThrust
    const slope = 4 * rise * (1 - 2 * x / span) / span
    // Approximate normal distance between load's thrust curve and arch axis.
    const normalOffset = Math.abs(thrustY - archY) / Math.sqrt(1 + slope * slope)
    return { x, archY, thrustY, moment, normalOffset }
  })
  return {
    leftReaction,
    rightReaction,
    horizontalThrust,
    maxBendingMoment: Math.max(...samples.map(point => Math.abs(point.moment))),
    maxNormalOffset: Math.max(...samples.map(point => point.normalOffset)),
    samples,
  }
}
