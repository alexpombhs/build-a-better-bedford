import { useState } from 'react'
import { UiBox, UiSurface, UiText, UiStack, UiTabs, UiTab } from './components/atoms/MuiPrimitives'
import { LabSlider, labColors } from './lab/LabUI'
import { solveElasticCable } from './lab/funicularPhysics'
import type { CableLoad } from './lab/funicularPhysics'

const fmt = (v: number) => v.toFixed(1)

export default function FunicularSimulator() {
  const [count, setCount] = useState<1 | 2>(1)
  const [span, setSpan] = useState(11)
  const [restLength, setRestLength] = useState(13.5)
  const [stiffness, setStiffness] = useState(120)
  const [p1, setP1] = useState(10)
  const [p2, setP2] = useState(8)
  const [pos1, setPos1] = useState(45)
  const [pos2, setPos2] = useState(70)

  const loads: CableLoad[] = count === 1
    ? [{ position: pos1, load: p1 }]
    : [{ position: pos1, load: p1 }, { position: pos2, load: p2 }]
  const result = solveElasticCable(span, restLength, stiffness, loads)

  // One fixed horizontal scale makes widening the span MOVE the anchors.
  // The vertical scale is also fixed unless extreme sag needs extra room.
  const anchorY = 100
  const leftX = 320 - 16 * span
  const rightX = 320 + 16 * span
  const verticalScale = Math.min(25, 190 / Math.max(1, result.sag))
  const screen = result.xs.map((x, i) => [
    leftX + 32 * x,
    anchorY + result.ys[i] * verticalScale,
  ] as const)
  const polyline = screen.map(([x, y]) => x.toFixed(2) + ',' + y.toFixed(2)).join(' ')
  const sagY = Math.max(...screen.map(point => point[1]))

  const changeCount = (value: 1 | 2) => {
    if (value === 2) {
      const first = Math.min(pos1, 75)
      setPos1(first)
      setPos2(Math.max(pos2, first + 10))
    }
    setCount(value)
  }

  return <UiBox sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.3fr) minmax(310px,.7fr)' }, gap: 3, pb: 4 }}>
    <UiSurface variant="outlined" sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f5f8fa', borderColor: labColors.border, borderRadius: 2 }}>
      <UiText variant="subtitle1" sx={{ fontWeight: 600, color: labColors.ink, mb: 1 }}>
        Elastic cable under {count === 1 ? 'one load' : 'two loads'}
      </UiText>
      <svg viewBox="0 0 640 350" width="100%" role="img"
        aria-label={'Elastic cable across ' + span + ' meters with ' + fmt(result.sag) + ' meters calculated sag under ' + count + ' loads.'}>
        <path d={'M' + leftX + ' 63V295 M' + rightX + ' 63V295'} stroke="#d1dce2" strokeDasharray="5 6" />
        <path d={'M' + leftX + ' ' + anchorY + 'H' + rightX} stroke="#a5b7c3" strokeDasharray="6 7" strokeWidth="1.5" />
        <rect x={leftX - 24} y={anchorY - 13} width="24" height="26" fill="#c6d4dc" />
        <rect x={rightX} y={anchorY - 13} width="24" height="26" fill="#c6d4dc" />
        <polyline points={polyline} fill="none" stroke="#123b55" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
        {loads.map((point, i) => {
          const [x, y] = screen[i + 1]
          const arrowTop = y - 46
          const labelY = arrowTop - 12 - (count === 2 && i === 1 ? 12 : 0)
          return <g key={i}>
            <circle cx={x} cy={y} r="7" fill="#fff" stroke="#123b55" strokeWidth="3" />
            <line x1={x} y1={arrowTop} x2={x} y2={y - 15} stroke="#c05e3d" strokeWidth="3" />
            <path d={'M' + (x - 8) + ' ' + (y - 24) + 'L' + x + ' ' + (y - 11) + 'L' + (x + 8) + ' ' + (y - 24) + 'Z'} fill="#c05e3d" />
            <text x={x} y={labelY} textAnchor="middle" fontSize="14" fill="#a14e35" fontWeight="700">
              P{i + 1}: {point.load} kN
            </text>
          </g>
        })}
        <text x={Math.min(leftX, 185)} y="43" fill="#276957" fontSize="14">A: {fmt(result.leftReaction)} kN ↑</text>
        <text x={Math.max(rightX, 455)} y="43" textAnchor="end" fill="#276957" fontSize="14">B: {fmt(result.rightReaction)} kN ↑</text>
        <path d={'M' + leftX + ' 311H' + rightX + ' M' + leftX + ' 303v16 M' + rightX + ' 303v16'} fill="none" stroke="#8197a5" strokeWidth="1.5" />
        <text x="320" y="337" textAnchor="middle" fontSize="16" fill="#465d70">{span} m span</text>
        <line x1="606" y1={anchorY} x2="606" y2={sagY} stroke="#657f90" strokeDasharray="3 4" />
        <text x="600" y={(anchorY + sagY) / 2 + 4} textAnchor="end" fill="#465d70" fontSize="13">
          {fmt(result.sag)} m sag
        </text>
      </svg>
      <UiText variant="body2" sx={{ color: labColors.muted, mt: 1, lineHeight: 1.55 }}>
        The anchors move when the span changes. With the same cable length and stiffness,
        a heavier load stretches the cable farther down. Green labels show vertical support reactions.
      </UiText>
    </UiSurface>
    <UiSurface variant="outlined" sx={{ p: 3, borderColor: labColors.border, borderRadius: 2 }}>
      <UiText sx={{ fontWeight: 600, mb: 1 }}>Number of point loads</UiText>
      <UiTabs value={count} onChange={(_, value) => changeCount(value as 1 | 2)}
        aria-label="Number of cable point loads" sx={{ mb: 2, minHeight: 40 }}>
        <UiTab value={1} label="1 load" sx={{ minHeight: 40, textTransform: 'none' }} />
        <UiTab value={2} label="2 loads" sx={{ minHeight: 40, textTransform: 'none' }} />
      </UiTabs>
      <UiStack spacing={1}>
        <LabSlider label="Span" value={span} min={4} max={16} unit="m" onChange={setSpan} />
        <LabSlider label="Unstretched cable length" value={restLength} min={8} max={18} step={0.5} unit="m" onChange={setRestLength} />
        <LabSlider label="Cable stiffness" value={stiffness} min={80} max={400} step={20} unit="kN" onChange={setStiffness} />
        <LabSlider label="Load 1" value={p1} min={1} max={30} unit="kN" onChange={setP1} />
        <LabSlider label="Load 1 position" value={pos1} min={15} max={count === 2 ? pos2 - 10 : 85} step={5} unit="%" onChange={setPos1} />
        {count === 2 && <>
          <LabSlider label="Load 2" value={p2} min={1} max={30} unit="kN" onChange={setP2} />
          <LabSlider label="Load 2 position" value={pos2} min={pos1 + 10} max={85} step={5} unit="%" onChange={setPos2} />
        </>}
      </UiStack>
      <UiBox sx={{ mt: 2, p: 2, bgcolor: '#f2f6f8', borderRadius: 2 }}>
        <UiText sx={{ fontSize: 13, color: labColors.muted }}>Calculated maximum sag</UiText>
        <UiText variant="h5" sx={{ color: labColors.ink, fontWeight: 700 }}>{fmt(result.sag)} m</UiText>
        <UiBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
          <UiBox>
            <UiText variant="caption">Horizontal tension</UiText>
            <UiText sx={{ fontWeight: 700 }}>{fmt(result.horizontal)} kN</UiText>
          </UiBox>
          <UiBox>
            <UiText variant="caption">Stretched length</UiText>
            <UiText sx={{ fontWeight: 700 }}>{fmt(result.stretchedLength)} m</UiText>
          </UiBox>
          {result.tensions.map((t, i) => <UiBox key={i}>
            <UiText variant="caption">Segment {i + 1} tension</UiText>
            <UiText sx={{ fontWeight: 700 }}>{fmt(t)} kN</UiText>
          </UiBox>)}
          <UiBox>
            <UiText variant="caption">Left vertical reaction</UiText>
            <UiText sx={{ fontWeight: 700 }}>{fmt(result.leftReaction)} kN</UiText>
          </UiBox>
          <UiBox>
            <UiText variant="caption">Right vertical reaction</UiText>
            <UiText sx={{ fontWeight: 700 }}>{fmt(result.rightReaction)} kN</UiText>
          </UiBox>
        </UiBox>
      </UiBox>
      {result.maxStrainPercent > 12 && <UiText role="status" variant="body2" sx={{ mt: 2, color: '#97501c', lineHeight: 1.5 }}>
        High modeled stretch ({fmt(result.maxStrainPercent)}%). This educational elastic cord
        is much more stretchable than a typical structural cable; do not treat these values as bridge design limits.
      </UiText>}
      <UiText variant="body2" sx={{ mt: 2, color: labColors.muted, lineHeight: 1.55 }}>
        Try increasing Load 1 without changing the cable. Then widen the span:
        the anchors move apart, sag generally decreases, and the tension changes.
        Higher stiffness means less stretch under the same load.
      </UiText>
      <UiText variant="caption" sx={{ display: 'block', mt: 2, color: labColors.muted, lineHeight: 1.5 }}>
        Simplified static model: level supports, a weightless flexible elastic cable,
        vertical point loads, and uniform axial stiffness EA. It ignores cable self-weight,
        failure, and large-material-strain effects. For learning, not structural design.
      </UiText>
    </UiSurface>
  </UiBox>
}
