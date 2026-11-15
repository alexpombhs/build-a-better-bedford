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
  const shaftStart = bottom + 9
  const arrowHeadTop = arrowTipY - 7

  return <g role="group" aria-label={label + ', ' + force + ' kilonewtons downward'}>
    {/* Outlined load tag: deliberately quieter than the line-of-thrust drawing. */}
    <rect x={weightX - width / 2} y={top} width={width} height={height}
      rx="4" fill={labDiagramColors.weight}
      stroke={labDiagramColors.weightOutline} strokeWidth="1.15" />
    <text x={weightX} y={top + height / 2 - 5} textAnchor="middle"
      fontSize="10.5" fontWeight="700" fill="#8a5542">{label}</text>
    <text x={weightX} y={top + height / 2 + 10} textAnchor="middle"
      fontSize="12.5" fontWeight="700" fill="#10222e">{force} kN</text>
    {/* Arrow remains outside the label. A subtle leader handles close loads. */}
    {Math.abs(centerX - weightX) > 1 && <path
      d={'M' + weightX + ' ' + (bottom + 3) +
        ' L' + centerX + ' ' + shaftStart}
      fill="none" stroke={labDiagramColors.dimension}
      strokeWidth="1.1" strokeLinecap="round" />}
    <line x1={centerX} y1={shaftStart} x2={centerX} y2={arrowHeadTop}
      stroke={labDiagramColors.thrust} strokeWidth="2.1" strokeLinecap="round" />
    <path d={'M' + (centerX - 5) + ' ' + arrowHeadTop +
      ' L' + centerX + ' ' + arrowTipY +
      ' L' + (centerX + 5) + ' ' + arrowHeadTop + ' Z'}
      fill={labDiagramColors.thrust} />
  </g>
}
