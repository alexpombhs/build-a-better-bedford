import { useState } from 'react'
import { MenuItem, TextField } from '@mui/material'
import { UiBox, UiButton, UiSurface, UiText } from './components/atoms/MuiPrimitives'
import { LabDetails, LabSlider, labColors } from './lab/LabUI'

// Dartmouth: The Engineering of Structures Around Us (CC BY-NC-SA 4.0).
const materials = {
  Plastic: { E: 2, strength: 50 },
  Glass: { E: 50, strength: 50 },
  Steel: { E: 200, strength: 250 },
  Wood: { E: 10, strength: 30 },
  Copper: { E: 100, strength: 150 },
  Concrete: { E: 20, strength: 70 },
  'Granite / Stone': { E: 80, strength: 150 },
} as const

type Material = keyof typeof materials
type Section = 'square' | 'hollow-square' | 'pipe' | 'hollow-pipe'
type Result = {
  governing: 'compression' | 'buckling'
  capacity: number
  compression: number
  buckling: number
  area: number
  inertia: number
}

function calculate(material: Material, section: Section, width: number, length: number): Result {
  // SI units. For hollow sections the assumed wall is 1/6 of the outer width.
  const inside = section.startsWith('hollow') ? width * (2 / 3) : 0
  const round = section.includes('pipe')
  const area = (width ** 2 - inside ** 2) * (round ? Math.PI / 4 : 1)
  const inertia = (width ** 4 - inside ** 4) * (round ? Math.PI / 64 : 1 / 12)
  const compression = materials[material].strength * 1e6 * area / 1000
  const buckling = Math.PI ** 2 * materials[material].E * 1e9 * inertia / length ** 2 / 1000
  return {
    governing: compression <= buckling ? 'compression' : 'buckling',
    capacity: Math.min(compression, buckling),
    compression, buckling, area, inertia,
  }
}

const formatLoad = (value: number) => Math.round(value).toLocaleString('en-US')

function ColumnIllustration({ material, section, width, length, result }: {
  material: Material
  section: Section
  width: number
  length: number
  result: Result | null
}) {
  const round = section.includes('pipe')
  const hollow = section.startsWith('hollow')
  const buckled = result?.governing === 'buckling'
  const compression = result?.governing === 'compression'
  const h = 158 + (length - 1) / 4 * 97
  const y0 = 308 - h
  const y1 = 308
  const cx = 335
  const halfWidth = 15 + (width - .05) / .55 * 21
  const bend = buckled ? 42 : 0
  // Keep each material visually recognizable even in the failed state.
  // SVG gradients and vector patterns need no external image assets.
  const appearance: Record<Material, {front:string; side:string; top:string; edge:string}> = {
    Plastic: {front:'url(#column-plastic)',side:'#609ca4',top:'#a4d9d8',edge:'#426e7b'},
    Glass: {front:'url(#column-glass)',side:'url(#column-glass-side)',top:'#e2f6fa',edge:'#7096ad'},
    Steel: {front:'url(#column-steel)',side:'#728597',top:'#c6d1da',edge:'#4b5b6c'},
    Wood: {front:'url(#column-wood)',side:'#93613e',top:'#d8ad77',edge:'#68452e'},
    Copper: {front:'url(#column-copper)',side:'#99543b',top:'#e7aa7e',edge:'#7b4839'},
    Concrete: {front:'url(#column-concrete)',side:'#929b9f',top:'#c4c8c9',edge:'#707e83'},
    'Granite / Stone': {front:'url(#column-stone)',side:'#666f78',top:'#b2b6b9',edge:'#505b64'},
  }
  const finish = appearance[material]
  const front = finish.front
  const side = finish.side
  const topFill = finish.top
  const edge = finish.edge
  const L = cx - halfWidth
  const R = cx + halfWidth
  const dx = Math.max(8, halfWidth * .55)
  const dy = Math.max(7, halfWidth * .30)
  // Both front edges use the same lateral displacement curve: the section
  // remains rectangular all along its height instead of turning into a tube.
  const edgePath = (x: number, yEnd = y1) =>
    `M ${x} ${y0} C ${x + bend * 1.7} ${y0 + h * .32}, ${x + bend * 1.7} ${y0 + h * .64}, ${x} ${yEnd}`
  const frontFace = `${edgePath(L)} L ${R} ${y1} C ${R + bend * 1.7} ${y0 + h * .64}, ${R + bend * 1.7} ${y0 + h * .32}, ${R} ${y0} Z`
  const sideFace = `${edgePath(R)} L ${R + dx} ${y1 - dy} C ${R + dx + bend * 1.7} ${y0 + h * .64 - dy}, ${R + dx + bend * 1.7} ${y0 + h * .32 - dy}, ${R + dx} ${y0 - dy} Z`
  const outerTop = `M ${L} ${y0} L ${R} ${y0} L ${R + dx} ${y0 - dy} L ${L + dx} ${y0 - dy} Z`
  // A concentric, scaled top opening gives the hollow square a clear ring.
  const topCenterX = cx + dx / 2
  const topCenterY = y0 - dy / 2
  const point = (x: number, y: number) => [topCenterX + (x - topCenterX) * .67, topCenterY + (y - topCenterY) * .67]
  const innerTop = [
    point(L,y0), point(L+dx,y0-dy), point(R+dx,y0-dy), point(R,y0),
  ]
  const innerPath = `M ${innerTop[0].join(' ')} L ${innerTop[1].join(' ')} L ${innerTop[2].join(' ')} L ${innerTop[3].join(' ')} Z`
  const burst = Array.from({ length: 20 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 10
    const r = i % 2 === 0 ? 46 : 21
    return `${cx + dx / 3 + Math.cos(angle) * r},${y0 + h * .54 + Math.sin(angle) * r}`
  }).join(' ')

  return <svg viewBox="0 0 640 350" width="100%" style={{ display: 'block', height: 'min(44vh,390px)', minHeight: 290 }}
    role="img" aria-label={buckled
      ? `A ${hollow ? 'hollow ' : ''}${round ? 'circular' : 'square'} column bent sideways due to buckling`
      : compression ? 'Compression is the governing failure mode, illustrated with a burst on the straight column'
        : `Straight ${hollow ? 'hollow ' : ''}${round ? 'circular' : 'square'} column`}>
    <defs>
      <linearGradient id="column-steel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#708394"/><stop offset=".22" stopColor="#e1e9ee"/>
        <stop offset=".43" stopColor="#9eafbc"/><stop offset=".78" stopColor="#d2dce3"/>
        <stop offset="1" stopColor="#748798"/>
      </linearGradient>
      <linearGradient id="column-copper" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#945138"/><stop offset=".28" stopColor="#d38858"/>
        <stop offset=".5" stopColor="#f3c294"/><stop offset=".77" stopColor="#b66b49"/>
        <stop offset="1" stopColor="#864c3a"/>
      </linearGradient>
      <linearGradient id="column-plastic" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#6daeb5"/><stop offset=".35" stopColor="#b6e0dd"/>
        <stop offset=".77" stopColor="#92c9c9"/><stop offset="1" stopColor="#679ea7"/>
      </linearGradient>
      <linearGradient id="column-glass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8fc1d9" stopOpacity=".55"/>
        <stop offset=".22" stopColor="#e8fbff" stopOpacity=".82"/>
        <stop offset=".45" stopColor="#b3e3f0" stopOpacity=".35"/>
        <stop offset=".72" stopColor="#f8ffff" stopOpacity=".75"/>
        <stop offset="1" stopColor="#89b8d1" stopOpacity=".58"/>
      </linearGradient>
      <linearGradient id="column-glass-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#79a9c7" stopOpacity=".4"/>
        <stop offset="1" stopColor="#b1e1ed" stopOpacity=".8"/>
      </linearGradient>
      <pattern id="column-wood" patternUnits="userSpaceOnUse" width="23" height="55">
        <rect width="23" height="55" fill="#c28b58"/>
        <path d="M4 -5 Q0 15 5 35 T3 60 M13 -4 Q19 10 14 27 T16 60 M21 -5 Q17 18 21 37 T19 60"
          fill="none" stroke="#8e5938" strokeWidth="1.2" opacity=".55"/>
        <path d="M9 2 Q13 18 9 33 T11 52" fill="none" stroke="#e5b98a" strokeWidth="1.1" opacity=".7"/>
      </pattern>
      <pattern id="column-concrete" patternUnits="userSpaceOnUse" width="24" height="24">
        <rect width="24" height="24" fill="#b1b9bd"/>
        <circle cx="4" cy="5" r="1" fill="#71828a" opacity=".45"/>
        <circle cx="19" cy="11" r="1.5" fill="#e0e3e3"/>
        <circle cx="9" cy="20" r=".9" fill="#788b91" opacity=".6"/>
        <path d="M12 3h2M1 14h3M20 22h2" stroke="#e3e5e5" strokeWidth=".8"/>
      </pattern>
      <pattern id="column-stone" patternUnits="userSpaceOnUse" width="27" height="25">
        <rect width="27" height="25" fill="#8e989f"/>
        <path d="M2 5l4 -2 3 4 -3 2z M15 3l5 -1 2 5 -5 2z M6 17l4 -3 3 6 -5 2z M19 16l5 2 -2 5 -5 -2z"
          fill="#5d6c75" opacity=".48"/>
        <circle cx="14" cy="13" r="1.9" fill="#e0e1dd"/>
        <circle cx="25" cy="8" r="1.2" fill="#c4c4c0"/>
        <path d="M1 13l3 1M12 23l4 -2M23 13l3 1" stroke="#d4d6d4" strokeWidth=".9"/>
      </pattern>
    </defs>
    {buckled && <path d={`M ${cx} ${y0} V ${y1}`} stroke="#a3b5c1" strokeWidth="1.5" strokeDasharray="5 6" />}
    {round ? <>
      <path d={`M ${L} ${y0} C ${L + bend * 1.7} ${y0+h*.32}, ${L+bend*1.7} ${y0+h*.64}, ${L} ${y1}
        Q ${cx} ${y1+9} ${R} ${y1}
        C ${R+bend*1.7} ${y0+h*.64}, ${R+bend*1.7} ${y0+h*.32}, ${R} ${y0} Z`}
        fill={front} stroke={edge} strokeWidth="1.7"/>
      <ellipse cx={cx} cy={y0} rx={halfWidth} ry={halfWidth*.28} fill={topFill} stroke={edge} strokeWidth="1.7" />
      {hollow && <>
        <ellipse cx={cx} cy={y0} rx={halfWidth*2/3} ry={halfWidth*.28*2/3} fill={material === 'Glass' ? '#d1f2f8' : '#52697b'} stroke={edge} strokeWidth="1" />
        <path d={`M ${cx-halfWidth*2/3} ${y0} Q ${cx} ${y0+halfWidth*.28*2/3} ${cx+halfWidth*2/3} ${y0}`}
          stroke="#dee8f0" strokeWidth="1.2" fill="none"/>
      </>}
    </> : <>
      <path d={sideFace} fill={side} stroke={edge} strokeWidth="1.5"/>
      <path d={frontFace} fill={front} stroke={edge} strokeWidth="1.7"/>
      {hollow && <path d={innerPath} fill={material === 'Glass' ? '#d1f2f8' : '#52697b'} stroke={edge} strokeWidth="1" />}
      <path d={hollow ? outerTop+' '+innerPath : outerTop} fill={topFill} fillRule="evenodd"
        stroke={edge} strokeWidth="1.7"/>
      {hollow && <path d={innerPath} fill="none" stroke={edge} strokeWidth="1.2"/>}
    </>}
    {compression && <polygon points={burst} fill="#f5d24b" stroke="#8d4a24" strokeWidth="1.6"/>}
    {buckled && <path d={`M ${cx+bend*1.6} ${y0+h*.55} h 38`} stroke="#a04c35" strokeWidth="2" strokeLinecap="round"/>}
  </svg>
}

export default function ColumnSimulator() {
  const [material, setMaterial] = useState<Material>('Steel')
  const [section, setSection] = useState<Section>('pipe')
  const [width, setWidth] = useState(.6)
  const [length, setLength] = useState(3.7)
  const [result, setResult] = useState<Result | null>(null)
  const changeMaterial = (value: Material) => { setMaterial(value); setResult(null) }
  const changeSection = (value: Section) => { setSection(value); setResult(null) }
  const changeWidth = (value: number) => { setWidth(value); setResult(null) }
  const changeLength = (value: number) => { setLength(value); setResult(null) }
  const selectSx = { '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }

  return <UiBox sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.27fr) minmax(335px,.73fr)' },
    columnGap: 2, rowGap: 1.25, pb: 2, alignItems: 'stretch' }}>
    <UiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, minWidth: 0 }}>
      <UiBox role="status" sx={{ p: 1.5, border: '1px solid '+(result ? '#df9e89' : labColors.border),
        borderRadius: 'var(--bbb-card-radius, 4px)', bgcolor: result ? '#fff0eb' : '#f2f6f8' }}>
        <UiText sx={{ fontSize: 14, fontWeight: 800, color: result ? '#9b3825' : labColors.ink }}>
          {result ? `Failure mode: ${result.governing === 'buckling' ? 'Buckling' : 'Compression'}` : 'Column ready for analysis'}
        </UiText>
        <UiText sx={{ fontSize: 12, color: labColors.muted }}>
          {result ? `${result.governing === 'buckling' ? 'Buckling' : 'Compressive'} load: ${formatLoad(result.capacity)} kN`
            : 'Select material and dimensions, then calculate the limiting load.'}
        </UiText>
      </UiBox>
      <UiSurface variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderColor: labColors.border,
        bgcolor: '#f5f8fa', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <UiText sx={{ fontWeight: 700, fontSize: 14, color: labColors.ink }}>Column response</UiText>
        <UiBox sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <ColumnIllustration material={material} section={section} width={width} length={length} result={result}/>
        </UiBox>
        <UiText sx={{ fontSize: 11.5, color: labColors.muted }}>
          {result?.governing === 'buckling'
            ? 'Exaggerated lateral deformation; dashed line shows the original position.'
            : result?.governing === 'compression'
              ? 'Compression governs. The failure marker is schematic, not a fracture prediction.'
              : 'The column remains straight until the theoretical load is calculated.'}
        </UiText>
      </UiSurface>
    </UiBox>
    <UiSurface variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderColor: labColors.border,
      display: 'flex', flexDirection: 'column', gap: 1, height: '100%', boxSizing: 'border-box' }}>
      <UiText sx={{ fontWeight: 700, fontSize: 14, color: labColors.ink }}>Column configuration</UiText>
      <TextField select label="Material" size="small" fullWidth value={material}
        onChange={e => changeMaterial(e.target.value as Material)} sx={selectSx}>
        {(Object.keys(materials) as Material[]).map(name=><MenuItem key={name} value={name}>{name}</MenuItem>)}
      </TextField>
      <TextField select label="Cross-section" size="small" fullWidth value={section}
        onChange={e => changeSection(e.target.value as Section)} sx={selectSx}>
        <MenuItem value="square">Square</MenuItem>
        <MenuItem value="hollow-square">Hollow square</MenuItem>
        <MenuItem value="pipe">Pipe</MenuItem>
        <MenuItem value="hollow-pipe">Hollow pipe</MenuItem>
      </TextField>
      <UiBox sx={{ display: 'flex', flexDirection: 'column', gap: .25 }}>
        <LabSlider compact label={section.includes('pipe') ? 'Base diameter' : 'Base width'}
          value={width} min={.05} max={.6} step={.01} unit="m" onChange={changeWidth}/>
        <LabSlider compact label="Length" value={length} min={1} max={5} step={.05} unit="m" onChange={changeLength}/>
      </UiBox>
      <UiText sx={{ fontSize: 11.5, color: labColors.muted }}>
        Elastic modulus: {materials[material].E} GPa · Material limit: {materials[material].strength} MPa
        {section.startsWith('hollow') ? ' · Wall thickness assumed to be 1/6 of outer width.' : ''}
      </UiText>
      <UiBox sx={{ display: 'flex', gap: 1, mt: .5, flexWrap: 'wrap' }}>
        <UiButton variant="contained" size="small" onClick={() => setResult(calculate(material,section,width,length))}
          sx={{ bgcolor:labColors.accent, textTransform:'none', '&:hover': { bgcolor:labColors.ink } }}>
          Calculate load
        </UiButton>
        <UiButton size="small" sx={{ textTransform:'none', color:labColors.accent }} onClick={() => {
          setMaterial('Steel'); setSection('pipe'); setWidth(.6); setLength(3.7); setResult(null)
        }}>Reset</UiButton>
      </UiBox>
      <UiBox sx={{ p: 1.1, mt: .75, bgcolor: '#f2f6f8', borderRadius: 'var(--bbb-card-radius, 4px)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
        <UiBox>
          <UiText variant="caption" sx={{ color:labColors.muted, fontSize:11.5 }}>Governing load</UiText>
          <UiText sx={{ fontSize:15, fontWeight:800, color:labColors.ink }}>
            {result ? formatLoad(result.capacity)+' kN' : '—'}
          </UiText>
        </UiBox>
        <UiBox>
          <UiText variant="caption" sx={{ color:labColors.muted, fontSize:11.5 }}>Failure mechanism</UiText>
          <UiText sx={{ fontSize:15, fontWeight:800, color:labColors.ink }}>
            {result ? (result.governing === 'buckling' ? 'Buckling' : 'Compression') : '—'}
          </UiText>
        </UiBox>
      </UiBox>
      {result && <LabDetails title="Load calculations">
        <UiBox sx={{ p: 1.25, mt: .5, bgcolor: '#f2f6f8', borderRadius: 'var(--bbb-card-radius, 4px)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {([
            ['Compressive limit', formatLoad(result.compression)+' kN'],
            ['Euler buckling', formatLoad(result.buckling)+' kN'],
            ['Area', result.area.toExponential(3)+' m²'],
            ['Second moment', result.inertia.toExponential(3)+' m⁴'],
          ] as const).map(([name,value])=><UiBox key={name}>
            <UiText variant="caption" sx={{ color:labColors.muted }}>{name}</UiText>
            <UiText sx={{ fontSize:12.5, fontWeight:700 }}>{value}</UiText>
          </UiBox>)}
        </UiBox>
      </LabDetails>}
      <UiText variant="caption" sx={{ fontSize:11, color:labColors.muted, lineHeight:1.4, mt:'auto', pt:1 }}>
        Simplified pinned-end Euler buckling and compression model. Deformation is illustrative, not calculated;
        local buckling, imperfections and safety factors are excluded. Not for structural design.
        Material properties adapted from Dartmouth’s The Engineering of Structures Around Us (CC BY-NC-SA 4.0).
      </UiText>
    </UiSurface>
  </UiBox>
}
