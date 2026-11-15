import { useState } from 'react'
import { UiBox, UiSurface, UiTab, UiTabs, UiText } from './components/atoms/MuiPrimitives'
import { ArchStatusBar, LabDetails, LabSlider, labColors, labDiagramColors } from './lab/LabUI'
import { ArchWeightMarker } from './lab/ArchWeightMarker'
import { archHeight, solveThreeHingedArch } from './lab/antifunicularPhysics'
import type { ArchPointLoad } from './lab/antifunicularPhysics'

const initial = {
  span: 12,
  rise: 3.5,
  thickness: 1,
  distributed: 4,
  load1: 8,
  load2: 6,
  position1: 40,
  position2: 75,
}

const format = (value: number) => value.toFixed(1)

/** Arch model organism; UI uses BBB's MUI atoms and Lab molecules.
 * The thick, fixed arch is a compression shape. The dashed thrust line
 * moves with loading; unlike a flexible hanging cable, the arch does not.
 */
export default function AntifunicularSimulator() {
  const [count, setCount] = useState<1 | 2>(1)
  const [values, setValues] = useState(initial)
  const set = (patch: Partial<typeof initial>) =>
    setValues(previous => ({ ...previous, ...patch }))
  const { span, rise, thickness, distributed, load1, load2, position1, position2 } = values
  const loads: ArchPointLoad[] = count === 1
    ? [{ position: position1, load: load1 }]
    : [{ position: position1, load: load1 }, { position: position2, load: load2 }]
  const result = solveThreeHingedArch(span, rise, distributed, loads)
  const totalLoad = distributed * span + loads.reduce((sum, point) => sum + point.load, 0)

  // These thresholds are comparisons with a schematic arch band, not
  // verified collapse/failure thresholds for masonry or concrete.
  const status = result.maxNormalOffset <= thickness / 6
    ? 'ideal'
    : result.maxNormalOffset <= thickness / 2
      ? 'deviating'
      : 'outside'

  const pixelsPerMeter = 31
  const centerX = 320
  const startX = centerX - span * pixelsPerMeter / 2
  const endX = centerX + span * pixelsPerMeter / 2
  // Space for the load block, a visible downward arrow, and the arch crest.
  const baselineY = 300
  const xScreen = (x: number) => startX + x * pixelsPerMeter
  const yScreen = (height: number) => baselineY - height * pixelsPerMeter
  const archPoints = result.samples.map(p => xScreen(p.x).toFixed(2) + ',' + yScreen(p.archY).toFixed(2)).join(' ')
  const thrustPoints = result.samples.map(p => xScreen(p.x).toFixed(2) + ',' + yScreen(p.thrustY).toFixed(2)).join(' ')
  const bandWidth = thickness * pixelsPerMeter

  return <UiBox sx={{
    display:'grid',gridTemplateColumns:{xs:'1fr',lg:'minmax(0,1.27fr) minmax(335px,.73fr)'},
    gap:2,pb:2,alignItems:'stretch',
  }}>
    <UiBox sx={{minWidth:0,display:'flex',flexDirection:'column',gap:1.25,height:'100%'}}>
      <ArchStatusBar
        status={status}
        normalOffset={result.maxNormalOffset}
        thickness={thickness}
        onReset={() => { setValues(initial); setCount(1) }}
      />
      <UiSurface variant="outlined" sx={{
        p:{xs:1.5,md:2},borderColor:labColors.border,bgcolor:'#f5f8fa',
        flex:1,display:'flex',flexDirection:'column',minHeight:0,
      }}>
        <UiText sx={{fontSize:14,fontWeight:700,color:labColors.ink,mb:0.5}}>
          Anti-funicular compression arch
        </UiText>
        <svg viewBox="0 0 640 360" width="100%"
          style={{height:'auto',display:'block'}}
          role="img"
          aria-label={'A fixed parabolic compression arch with ' + count +
            ' movable point loads. The dashed orange line is the calculated thrust line.'}>
          <path d={'M' + startX + ' 44V333 M' + endX + ' 44V333'}
            stroke={labDiagramColors.guide} strokeDasharray="5 6" />
          <line x1={startX} y1={baselineY} x2={endX} y2={baselineY}
            stroke={labDiagramColors.guide} strokeWidth="1.5" strokeDasharray="5 6" />
          <path d={'M' + (startX - 14) + ' ' + (baselineY + 13) + ' L' +
            (startX + 14) + ' ' + (baselineY + 13) + ' L' + startX + ' ' + baselineY + ' Z'}
            fill={labDiagramColors.support} stroke={labDiagramColors.archOutline} strokeWidth="1.5" />
          <path d={'M' + (endX - 14) + ' ' + (baselineY + 13) + ' L' +
            (endX + 14) + ' ' + (baselineY + 13) + ' L' + endX + ' ' + baselineY + ' Z'}
            fill={labDiagramColors.support} stroke={labDiagramColors.archOutline} strokeWidth="1.5" />
          <line x1={startX - 21} y1={baselineY + 16} x2={startX + 21} y2={baselineY + 16}
            stroke={labDiagramColors.dimension} strokeWidth="2" />
          <line x1={endX - 21} y1={baselineY + 16} x2={endX + 21} y2={baselineY + 16}
            stroke={labDiagramColors.dimension} strokeWidth="2" />
          {/* The pale band already shows the fixed arch shape and thickness.
              There is no duplicate solid centerline: only the dashed thrust
              line moves when point loads change. */}
          <polyline points={archPoints} fill="none" stroke={labDiagramColors.archOutline}
            strokeWidth={bandWidth + 1.5} strokeLinejoin="round" strokeLinecap="butt" />
          <polyline points={archPoints} fill="none" stroke={labDiagramColors.archFill}
            strokeWidth={bandWidth} strokeLinejoin="round" strokeLinecap="butt" />
          <polyline points={thrustPoints} fill="none" stroke={labDiagramColors.thrust}
            strokeWidth="2.4" strokeDasharray="7 7" strokeLinecap="round" strokeLinejoin="round" />

          {loads.map((point, i) => {
            if (point.load <= 0) return null
            const x = xScreen(span * point.position / 100)
            const y = yScreen(archHeight(span, rise, span * point.position / 100))
            const width = 36 + point.load * 0.5
            const height = 38 + point.load * 0.12
            const other = count === 2 ? loads[1 - i] : null
            const otherWidth = other ? 36 + other.load * 0.5 : 0
            const spacing = other
              ? Math.abs(point.position - other.position) * span * pixelsPerMeter / 100
              : Infinity
            const separation = (width + otherWidth) / 2 + 12
            const weightX = x + (count === 2
              ? Math.max(0, separation - spacing) / 2 * (i === 0 ? -1 : 1)
              : 0)
            // Arrow ends just above the arch surface. Its entire shaft sits
            // BELOW the weight with a white clearance between the two.
            const arrowTipY = y - bandWidth / 2 - 5
            const top = arrowTipY - 33 - height
            return <ArchWeightMarker key={i}
              label={'P' + (i + 1)} force={point.load}
              centerX={x} weightX={weightX}
              top={top} width={width} height={height} arrowTipY={arrowTipY} />
          })}

          <text x={startX} y="25" fontSize="13" fill={labColors.accent}>
            A: {format(result.leftReaction)} kN ↑
          </text>
          <text x={endX} y="25" textAnchor="end" fontSize="13" fill={labColors.accent}>
            B: {format(result.rightReaction)} kN ↑
          </text>
          <text x={startX + 5} y="51" fontSize="12" fill={labColors.muted}>
            q = {distributed} kN/m
          </text>
          <path d={'M' + startX + ' 333H' + endX +
            ' M' + startX + ' 328v10 M' + endX + ' 328v10'}
            fill="none" stroke={labDiagramColors.dimension} strokeWidth="1.3" />
          <text x="320" y="354" textAnchor="middle" fontSize="14" fill={labColors.muted}>
            {span} m span
          </text>
        </svg>
        <UiBox sx={{display:'flex',flexWrap:'wrap',columnGap:2,rowGap:0.5,pt:0.5,mt:'auto'}}>
          <UiText sx={{fontSize:11.5,color:labColors.muted}}>
            <UiText component="span" sx={{display:'inline-block',width:18,height:6,bgcolor:labDiagramColors.archFill,border:'1px solid '+labDiagramColors.archOutline,verticalAlign:'middle',mr:0.7}} />
            Fixed arch section
          </UiText>
          <UiText sx={{fontSize:11.5,color:labColors.muted}}>
            <UiText component="span" sx={{display:'inline-block',width:18,borderTop:'2px dashed '+labDiagramColors.thrust,verticalAlign:'middle',mr:0.7}} />
            Thrust line · force path
          </UiText>
        </UiBox>
      </UiSurface>
    </UiBox>

    <UiSurface variant="outlined" sx={{
      p:{xs:1.5,md:2},borderColor:labColors.border,height:'100%',
      boxSizing:'border-box',display:'flex',flexDirection:'column',
    }}>
      <UiBox sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:1,mb:0.5,flexWrap:'wrap'}}>
        <UiText sx={{fontSize:14,fontWeight:700}}>Point loads</UiText>
        <UiTabs value={count} onChange={(_,v) => setCount(v as 1 | 2)}
          aria-label="Number of arch point loads" sx={{minHeight:32}}>
          <UiTab value={1} label="1 load" sx={{minHeight:32,minWidth:64,px:1,py:0,fontSize:12.5,textTransform:'none'}}/>
          <UiTab value={2} label="2 loads" sx={{minHeight:32,minWidth:64,px:1,py:0,fontSize:12.5,textTransform:'none'}}/>
        </UiTabs>
      </UiBox>
      <UiBox sx={{display:'flex',flexDirection:'column',gap:0.25}}>
        <LabSlider compact label="Arch span" value={span} min={6} max={18} unit="m" onChange={v => set({span:v})}/>
        <LabSlider compact label="Arch rise" value={rise} min={2} max={6} step={0.5} unit="m" onChange={v => set({rise:v})}/>
        <LabSlider compact label="Arch thickness" value={thickness} min={0.5} max={2} step={0.1} unit="m" onChange={v => set({thickness:v})}/>
        <LabSlider compact label="Distributed load" value={distributed} min={1} max={8} unit="kN/m" onChange={v => set({distributed:v})}/>
        <LabSlider compact label="Load 1" value={load1} min={0} max={30} unit="kN" onChange={v => set({load1:v})}/>
        <LabSlider compact label="Load 1 position" value={position1} min={15}
          max={count === 2 ? position2 - 10 : 85} step={5} unit="%" onChange={v => set({position1:v})}/>
        {count === 2 && <>
          <LabSlider compact label="Load 2" value={load2} min={0} max={30} unit="kN" onChange={v => set({load2:v})}/>
          <LabSlider compact label="Load 2 position" value={position2} min={position1 + 10}
            max={85} step={5} unit="%" onChange={v => set({position2:v})}/>
        </>}
      </UiBox>
      <UiBox sx={{
        display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,p:1.1,mt:1,
        bgcolor:'#f2f6f8',borderRadius:'var(--bbb-card-radius, 4px)',
      }}>
        <UiBox>
          <UiText variant="caption" sx={{fontSize:11.5,color:labColors.muted}}>Total vertical load</UiText>
          <UiText sx={{fontSize:15,fontWeight:800}}>{format(totalLoad)} kN</UiText>
        </UiBox>
        <UiBox>
          <UiText variant="caption" sx={{fontSize:11.5,color:labColors.muted}}>Horizontal thrust</UiText>
          <UiText sx={{fontSize:15,fontWeight:800}}>{format(result.horizontalThrust)} kN</UiText>
        </UiBox>
      </UiBox>
      <LabDetails title="Arch force calculations">
        <UiBox sx={{p:1.25,bgcolor:'#f2f6f8',borderRadius:'var(--bbb-card-radius, 4px)'}}>
          <UiBox sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1.5}}>
            <UiBox><UiText variant="caption">Reaction at A</UiText><UiText sx={{fontWeight:700}}>{format(result.leftReaction)} kN</UiText></UiBox>
            <UiBox><UiText variant="caption">Reaction at B</UiText><UiText sx={{fontWeight:700}}>{format(result.rightReaction)} kN</UiText></UiBox>
            <UiBox><UiText variant="caption">Peak bending moment</UiText><UiText sx={{fontWeight:700}}>{format(result.maxBendingMoment)} kN·m</UiText></UiBox>
            <UiBox><UiText variant="caption">Thrust-line deviation</UiText><UiText sx={{fontWeight:700}}>{result.maxNormalOffset.toFixed(2)} m</UiText></UiBox>
          </UiBox>
        </UiBox>
      </LabDetails>
      <UiText variant="body2" sx={{fontSize:12.5,lineHeight:1.45,color:labColors.muted,mt:1}}>
        Try setting point loads to 0. Under uniform loading, the parabolic arch follows the
        ideal compression path. Add or move a weight: the arch stays fixed while its thrust
        line and bending effects change.
      </UiText>
      <UiText variant="caption" sx={{display:'block',fontSize:11,color:labColors.muted,lineHeight:1.35,mt:1}}>
        Simplified three-hinged arch, level supports, vertical loads and idealized thickness.
        A thrust line outside the illustrated arch band is a warning, not a verified collapse.
        Does not model material strength, cracking, buckling or support movement. Not for structural design.
      </UiText>
    </UiSurface>
  </UiBox>
}
