import { labDiagramColors } from './LabUI'

type ArchWeightMarkerProps = {
  label: string
  force: number
  centerX: number
  weightX: number
  top: number
  width: number
  height: number
  arrowTipY: number
}

/** SVG molecule: a labeled load block plus an unmistakable downward force
 * vector, entirely BELOW the block and ending ABOVE the compression arch.
 * Uses a small lead-in for crowded two-load cases, where the block is shifted
 * but the force stays applied at its actual x-coordinate.
 */
export function ArchWeightMarker({
  label, force, centerX, weightX, top, width, height, arrowTipY,
}: ArchWeightMarkerProps) {
  if (force <= 0) return null

  const bottom = top + height
  const shaftStart = bottom + 10
  const arrowHeadTop = arrowTipY - 11

  return <g role="group" aria-label={label + ', ' + force + ' kilonewtons downward'}>
    {/* Simple flat block matches the cable simulator's hanging weight style. */}
    <rect x={weightX - width / 2} y={top} width={width} height={height}
      rx="4" fill={labDiagramColors.weight}
      stroke={labDiagramColors.weightOutline} strokeWidth="1.8" />
    <rect x={weightX - width / 2 + 5} y={top + 5}
      width={Math.max(0, width - 10)} height="3.5" rx="1.75" fill="#e3b09a" />
    <text x={weightX} y={top + height / 2 - 4} textAnchor="middle"
      fontSize="11" fontWeight="700" fill="#fff">{label}</text>
    <text x={weightX} y={top + height / 2 + 12} textAnchor="middle"
      fontSize="13" fontWeight="700" fill="#fff">{force} kN</text>
    {/* Keep the arrow separate from the weight (never draw through it). */}
    {Math.abs(centerX - weightX) > 1 && <path
      d={'M' + weightX + ' ' + (bottom + 3) +
        ' L' + centerX + ' ' + shaftStart}
      fill="none" stroke={labDiagramColors.dimension}
      strokeWidth="1.7" strokeLinecap="round" />}
    <line x1={centerX} y1={shaftStart} x2={centerX} y2={arrowHeadTop + 2}
      stroke={labDiagramColors.thrust} strokeWidth="3.5" strokeLinecap="round" />
    <path d={'M' + (centerX - 7) + ' ' + arrowHeadTop +
      ' L' + centerX + ' ' + arrowTipY +
      ' L' + (centerX + 7) + ' ' + arrowHeadTop + ' Z'}
      fill={labDiagramColors.thrust} />
  </g>
}
