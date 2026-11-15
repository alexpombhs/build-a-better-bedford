import { useEffect, useState } from 'react'
import { UiBox, UiSurface, UiText, UiTabs, UiTab } from './components/atoms/MuiPrimitives'
import { CableStatusBar, LabDetails, LabSlider, labColors } from './lab/LabUI'
import { maxSupportedTotalLoad, solveElasticCable } from './lab/funicularPhysics'
import type { CableLoad, CableSolution } from './lab/funicularPhysics'

const fmt = (v: number) => v.toFixed(1)
const maxTension = (solution: CableSolution) => Math.max(...solution.tensions)
const peakSegment = (solution: CableSolution) =>
  solution.tensions.indexOf(maxTension(solution))

type FailureSnapshot = {
  span: number
  loads: CableLoad[]
  solution: CableSolution
  breakingStrength: number
  capacity: number
  segment: number
}

type CableSettings = {
  span: number
  restLength: number
  stiffness: number
  breakingStrength: number
  p1: number
  p2: number
  pos1: number
  pos2: number
}

const defaultSettings: CableSettings = {
  span: 11, restLength: 13.5, stiffness: 120, breakingStrength: 20,
  p1: 10, p2: 8, pos1: 45, pos2: 70,
}

export default function FunicularSimulator() {
  const [count, setCount] = useState<1 | 2>(1)

  // Each load tab is its own experiment. Changing tabs cannot change the
  // failed geometry, load values, or controls of the other experiment.
  const [settingsByMode, setSettingsByMode] = useState<Record<1 | 2, CableSettings>>({
    1: { ...defaultSettings },
    2: { ...defaultSettings },
  })
  const [failures, setFailures] = useState<Record<1 | 2, FailureSnapshot | null>>({
    1: null, 2: null,
  })
  const settings = settingsByMode[count]
  const { span, restLength, stiffness, breakingStrength, p1, p2, pos1, pos2 } = settings
  const failure = failures[count]

  const updateSettings = (patch: Partial<CableSettings>) => {
    setSettingsByMode(previous => ({
      ...previous,
      [count]: { ...previous[count], ...patch },
    }))
  }

  const loads: CableLoad[] = count === 1
    ? [{ position: pos1, load: p1 }]
    : [{ position: pos1, load: p1 }, { position: pos2, load: p2 }]
  const solution = solveElasticCable(span, restLength, stiffness, loads)
  const appliedTotal = loads.reduce((sum, point) => sum + point.load, 0)
  const capacity = maxSupportedTotalLoad(span, restLength, stiffness, loads, breakingStrength)
  const overload = maxTension(solution) > breakingStrength

  // A failure persists instead of healing when the user moves a load slider.
  // Snapshot the last equilibrium geometry as an illustrative instant of rupture.
  const currentFailure: FailureSnapshot | null = overload ? {
    span,
    loads,
    solution,
    breakingStrength,
    capacity,
    segment: peakSegment(solution),
  } : null

  useEffect(() => {
    if (!currentFailure) return
    setFailures(previous => previous[count]
      ? previous
      : { ...previous, [count]: currentFailure })
  }, [count, currentFailure])

  const broken = failure ?? currentFailure
  const displayed = broken?.solution ?? solution
  const shownLoads = broken?.loads ?? loads
  const shownSpan = broken?.span ?? span
  const shownStrength = broken?.breakingStrength ?? breakingStrength
  const shownCapacity = broken?.capacity ?? capacity
  const displayedTotal = shownLoads.reduce((sum, point) => sum + point.load, 0)
  const displayedPeak = maxTension(displayed)
  const status = broken ? 'broken' : displayedPeak >= shownStrength * 0.85 ? 'warning' : 'intact'

  // Fixed horizontal scale: the anchors actually move with the span.
  // A capped vertical scale keeps the hanging weights visible at high sag.
  const anchorY = 84
  const leftX = 320 - 16 * shownSpan
  const rightX = 320 + 16 * shownSpan
  const verticalScale = Math.min(25, 135 / Math.max(1, displayed.sag))
  const screen = displayed.xs.map((x, i) => [
    leftX + 32 * x,
    anchorY + displayed.ys[i] * verticalScale,
  ] as const)
  const polyline = screen.map(([x, y]) => x.toFixed(2) + ',' + y.toFixed(2)).join(' ')
  const sagY = Math.max(...screen.map(point => point[1]))

  // Failure is determined by the highest T, not by total vertical weight.
  const breakIndex = broken?.segment ?? -1
  const breakFrom = breakIndex >= 0 ? screen[breakIndex] : null
  const breakTo = breakIndex >= 0 ? screen[breakIndex + 1] : null
  const midpointX = breakFrom && breakTo ? (breakFrom[0] + breakTo[0]) / 2 : 0
  const midpointY = breakFrom && breakTo ? (breakFrom[1] + breakTo[1]) / 2 : 0
  const breakHalfGap = breakFrom && breakTo
    ? Math.min(14, (breakTo[0] - breakFrom[0]) * 0.24)
    : 0
  const brokenLeft = breakIndex < 0 ? '' : [
    ...screen.slice(0, breakIndex + 1),
    [midpointX - breakHalfGap, midpointY + 25],
  ].map(([x, y]) => x.toFixed(2) + ',' + y.toFixed(2)).join(' ')
  const brokenRight = breakIndex < 0 ? '' : [
    [midpointX + breakHalfGap, midpointY + 45],
    ...screen.slice(breakIndex + 1),
  ].map(([x, y]) => x.toFixed(2) + ',' + y.toFixed(2)).join(' ')

  // Independent settings make it safe to switch without changing the other tab.
  const changeCount = (value: 1 | 2) => setCount(value)

  const replaceCable = () => {
    // Clearing only the failure snapshot immediately re-triggers failure if
    // the current load is still above the cable's tensile strength.
    if (!overload) {
      setFailures(previous => ({ ...previous, [count]: null }))
      return
    }

    const minimumLoads = loads.map(point => ({ ...point, load: 1 }))
    const minimumPeak = maxTension(solveElasticCable(span, restLength, stiffness, minimumLoads))

    if (minimumPeak > breakingStrength) {
      // Even the smallest supported weights would break this configuration.
      // Restore a safe baseline rather than silently increasing strength.
      updateSettings({ ...defaultSettings, p1: 1, p2: 1 })
    } else {
      // Retain the geometry and relative load proportions where possible.
      // Restart well below the estimated failure threshold so the new
      // cable remains intact and the user can increase loads again.
      const ratio = Math.min(1, (capacity * 0.7) / appliedTotal)
      let nextP1 = Math.max(1, Math.floor(p1 * ratio))
      let nextP2 = Math.max(1, Math.floor(p2 * ratio))
      const nextLoads: CableLoad[] = count === 1
        ? [{ position: pos1, load: nextP1 }]
        : [{ position: pos1, load: nextP1 }, { position: pos2, load: nextP2 }]
      if (maxTension(solveElasticCable(span, restLength, stiffness, nextLoads)) > breakingStrength) {
        nextP1 = 1
        nextP2 = 1
      }
      updateSettings({ p1: nextP1, p2: nextP2 })
    }

    setFailures(previous => ({ ...previous, [count]: null }))
  }

  return <UiBox sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.27fr) minmax(335px,.73fr)' }, columnGap: 2, rowGap: 1.25, pb: 2, alignItems: 'start' }}>
    <UiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, minWidth: 0 }}>
      <CableStatusBar
        status={status}
        tension={displayedPeak}
        strength={shownStrength}
        segment={broken ? breakIndex + 1 : undefined}
        onReset={replaceCable}
      />
      <UiSurface variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, bgcolor: '#f5f8fa', borderColor: labColors.border, borderRadius: 2 }}>
      <UiText sx={{ fontSize: 14, fontWeight: 700, color: labColors.ink, mb: 0.5 }}>
        Elastic cable under {count === 1 ? 'one load' : 'two loads'}
      </UiText>
      <svg viewBox="0 0 640 397" width="100%" style={{height:'min(43vh,405px)',display:'block'}} role="img"
        aria-label={broken
          ? 'Cable snapped in segment ' + (breakIndex + 1) + ' under ' + fmt(displayedTotal) + ' kilonewtons of applied load. The weights are falling.'
          : 'Elastic cable across ' + shownSpan + ' meters with ' + fmt(displayed.sag) + ' meters calculated sag and ' + shownLoads.length + ' hanging weights.'}>
        <path d={'M' + leftX + ' 56V340 M' + rightX + ' 56V340'} stroke="#d1dce2" strokeDasharray="5 6" />
        <path d={'M' + leftX + ' ' + anchorY + 'H' + rightX} stroke="#a5b7c3" strokeDasharray="6 7" strokeWidth="1.5" />
        <rect x={leftX - 24} y={anchorY - 13} width="24" height="26" fill="#c6d4dc" />
        <rect x={rightX} y={anchorY - 13} width="24" height="26" fill="#c6d4dc" />
        {broken ? <>
          <polyline points={brokenLeft} fill="none" stroke="#b4573d" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={brokenRight} fill="none" stroke="#b4573d" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={'M' + (midpointX - 11) + ' ' + (midpointY + 16) + 'l-6 8m10-2l-4 10m24 3l6 8m-11-4l2 10'}
            stroke="#b4573d" strokeWidth="2" strokeLinecap="round" fill="none" />
          <text x={midpointX} y={Math.max(77, midpointY - 23)} textAnchor="middle"
            fontSize="16" fill="#a33e2a" fontWeight="800">SNAP!</text>
         </> : <polyline points={polyline} fill="none" stroke="#123b55" strokeWidth="5"
          strokeLinejoin="round" strokeLinecap="round" />}
        {shownLoads.map((point, i) => {
          const [x, y] = screen[i + 1]
          const width = 30 + point.load * 1.1
          const height = 40 + point.load * 0.45
          const distance = shownLoads.length === 2
            ? Math.abs(screen[2][0] - screen[1][0])
            : 1000
          const otherWidth = shownLoads.length === 2
            ? 30 + shownLoads[1 - i].load * 1.1
            : 0
          const separation = (width + otherWidth) / 2 + 12
          const offset = Math.max(0, separation - distance) / 2 * (i === 0 ? -1 : 1)
          const weightX = x + offset
          const top = y + (broken ? 42 : 23)
          // The orange force vector points straight down from BELOW the weight.
          // Its entire shaft is below both the suspension cable and the block.
          const forceX = weightX
          const forceStartY = top + height + 6
          const forceTipY = forceStartY + 29
          return <g key={i}>
            <circle cx={x} cy={y} r="7" fill="#fff" stroke={broken ? '#b4573d' : '#123b55'} strokeWidth="3" />
            {broken ? <>
              <path d={'M' + (weightX - 6) + ' ' + (top - 27) + 'v11 M' + (weightX + 6) + ' ' + (top - 23) + 'v9'}
                stroke="#c05e3d" strokeWidth="2" strokeDasharray="4 4" opacity="0.75" />
            </> : <line x1={x} y1={y + 8} x2={weightX} y2={top - 8}
              stroke="#506575" strokeWidth="2.5" />}
            <path d={'M' + (weightX - 8) + ' ' + (top - 1) + 'v-7a8 8 0 0 1 16 0v7'}
              fill="none" stroke="#5b6970" strokeWidth="3" />
            <rect x={weightX - width / 2} y={top} width={width} height={height} rx="5"
              fill="#b66c4c" stroke="#8b432e" strokeWidth="2" />
            <rect x={weightX - width / 2 + 5} y={top + 6} width={width - 10}
              height="4" rx="2" fill="#e3b09a" />
            <text x={weightX} y={top + height / 2 - 4} textAnchor="middle"
              fontSize="11" fill="white" fontWeight="700">P{i + 1}</text>
            <text x={weightX} y={top + height / 2 + 12} textAnchor="middle"
              fontSize="13" fill="white" fontWeight="700">{point.load} kN</text>
            <line x1={forceX} y1={forceStartY} x2={forceX} y2={forceTipY - 8}
              stroke="#c05e3d" strokeWidth="3" strokeLinecap="round" />
            <path d={'M' + (forceX - 7) + ' ' + (forceTipY - 11) +
              ' L' + forceX + ' ' + forceTipY +
              ' L' + (forceX + 7) + ' ' + (forceTipY - 11) + ' Z'}
              fill="#c05e3d" />
          </g>
        })}
        <text x={Math.min(leftX, 185)} y="43" fill="#276957" fontSize="14">
          A: {fmt(displayed.leftReaction)} kN ↑
        </text>
        <text x={Math.max(rightX, 455)} y="43" textAnchor="end" fill="#276957" fontSize="14">
          B: {fmt(displayed.rightReaction)} kN ↑
        </text>
        <path d={'M' + leftX + ' 368H' + rightX + ' M' + leftX + ' 360v16 M' + rightX + ' 360v16'}
          fill="none" stroke="#8197a5" strokeWidth="1.5" />
        <text x="320" y="392" textAnchor="middle" fontSize="15" fill="#465d70">{shownSpan} m span</text>
        <line x1="606" y1={anchorY} x2="606" y2={sagY}
          stroke="#657f90" strokeDasharray="3 4" />
        <text x="598" y={(anchorY + sagY) / 2 + 4} textAnchor="end"
          fill="#465d70" fontSize="13">{fmt(displayed.sag)} m sag</text>
      </svg>
      <UiText variant="caption" sx={{ display: 'block', color: labColors.muted, mt: 0.5, fontSize: 11.5, lineHeight: 1.4 }}>
        Weights scale with load; orange arrows indicate downward force. Cable failure is a static illustration.
      </UiText>
      </UiSurface>
    </UiBox>

    <UiSurface variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderColor: labColors.border, borderRadius: 2 }}>
      <UiBox sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <UiText sx={{ fontWeight: 700, fontSize: 14 }}>Point loads</UiText>
        <UiTabs value={count} onChange={(_, value) => changeCount(value as 1 | 2)}
          aria-label="Number of cable point loads" sx={{ minHeight: 32 }}>
          <UiTab value={1} label="1 load" sx={{ minHeight: 32, minWidth: 64, px: 1, py: 0, textTransform: 'none', fontSize: 12.5 }} />
          <UiTab value={2} label="2 loads" sx={{ minHeight: 32, minWidth: 64, px: 1, py: 0, textTransform: 'none', fontSize: 12.5 }} />
        </UiTabs>
      </UiBox>
      <UiBox sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <LabSlider label="Span" value={span} min={4} max={16} unit="m" onChange={value => updateSettings({ span: value })} disabled={Boolean(broken)} compact />
        <LabSlider label="Unstretched cable length" value={restLength} min={8} max={18} step={0.5} unit="m" onChange={value => updateSettings({ restLength: value })} disabled={Boolean(broken)} compact />
        <LabSlider label="Cable stiffness" value={stiffness} min={80} max={400} step={20} unit="kN" onChange={value => updateSettings({ stiffness: value })} disabled={Boolean(broken)} compact />
        <LabSlider label="Cable breaking strength" value={breakingStrength} min={5} max={60} step={1} unit="kN" onChange={value => updateSettings({ breakingStrength: value })} disabled={Boolean(broken)} compact />
        <LabSlider label="Load 1" value={p1} min={1} max={30} unit="kN" onChange={value => updateSettings({ p1: value })} disabled={Boolean(broken)} compact />
        <LabSlider label="Load 1 position" value={pos1} min={15} max={count === 2 ? pos2 - 10 : 85} step={5} unit="%" onChange={value => updateSettings({ pos1: value })} disabled={Boolean(broken)} compact />
        {count === 2 && <>
          <LabSlider label="Load 2" value={p2} min={1} max={30} unit="kN" onChange={value => updateSettings({ p2: value })} disabled={Boolean(broken)} compact />
          <LabSlider label="Load 2 position" value={pos2} min={pos1 + 10} max={85} step={5} unit="%" onChange={value => updateSettings({ pos2: value })} disabled={Boolean(broken)} compact />
        </>}
      </UiBox>
      {broken && <UiText variant="caption" sx={{ display: 'block', mt: 1.5, color: labColors.muted }}>
        This experiment is frozen. Use “Replace cable” above the drawing to restart it.
      </UiText>}

      <UiBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, p: 1.1, mt: 0.75, bgcolor: '#f2f6f8', borderRadius: 1.5 }}>
        <UiBox>
          <UiText variant="caption" sx={{fontSize:11.5,color:labColors.muted}}>Total applied load</UiText>
          <UiText sx={{fontWeight:800,fontSize:15,color:labColors.ink}}>{fmt(displayedTotal)} kN</UiText>
        </UiBox>
        <UiBox>
          <UiText variant="caption" sx={{fontSize:11.5,color:labColors.muted}}>Maximum supported</UiText>
          <UiText sx={{fontWeight:800,fontSize:15,color:labColors.ink}}>
            {Number.isFinite(shownCapacity) ? fmt(shownCapacity) + ' kN' : 'Above model range'}
          </UiText>
        </UiBox>
      </UiBox>
      <LabDetails title="Force calculations">
        <UiBox sx={{ p: 1.5, bgcolor: '#f2f6f8', borderRadius: 1.5 }}>
          <UiText variant="caption" sx={{display:'block',color:labColors.muted,mb:1}}>
            Maximum supported load assumes the same load positions and proportions.
          </UiText>
          <UiBox sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1.5}}>
            <UiBox><UiText variant="caption">Peak segment tension</UiText><UiText sx={{fontWeight:700}}>{fmt(displayedPeak)} kN</UiText></UiBox>
            <UiBox><UiText variant="caption">Breaking strength</UiText><UiText sx={{fontWeight:700}}>{fmt(shownStrength)} kN</UiText></UiBox>
            <UiBox><UiText variant="caption">Maximum sag</UiText><UiText sx={{fontWeight:700}}>{fmt(displayed.sag)} m</UiText></UiBox>
            <UiBox><UiText variant="caption">Stretched cable length</UiText><UiText sx={{fontWeight:700}}>{fmt(displayed.stretchedLength)} m</UiText></UiBox>
            {displayed.tensions.map((t,i)=><UiBox key={i}>
              <UiText variant="caption">Segment {i+1} tension</UiText>
              <UiText sx={{fontWeight:700,color:broken && breakIndex===i?'#9c3e2a':labColors.ink}}>{fmt(t)} kN</UiText>
            </UiBox>)}
            <UiBox><UiText variant="caption">Left reaction</UiText><UiText sx={{fontWeight:700}}>{fmt(displayed.leftReaction)} kN</UiText></UiBox>
            <UiBox><UiText variant="caption">Right reaction</UiText><UiText sx={{fontWeight:700}}>{fmt(displayed.rightReaction)} kN</UiText></UiBox>
          </UiBox>
        </UiBox>
      </LabDetails>
      {displayed.maxStrainPercent > 12 && <UiText role="status" variant="body2" sx={{ mt: 2, color: '#97501c', lineHeight: 1.5 }}>
        High modeled stretch ({fmt(displayed.maxStrainPercent)}%). This educational elastic cord
        is much more stretchable than a typical structural cable; do not treat these values as bridge design limits.
      </UiText>}

      <UiText variant="caption" sx={{ display: 'block', mt: 1, fontSize: 11, color: labColors.muted, lineHeight: 1.35 }}>
        Idealized static model for learning, not structural design. It does not model material fatigue, supports, cable weight, or falling dynamics.
      </UiText>
    </UiSurface>
  </UiBox>
}
