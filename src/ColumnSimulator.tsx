import { useState } from 'react'
import { MenuItem, TextField } from '@mui/material'
import { UiBox, UiButton, UiSurface, UiText } from './components/atoms/MuiPrimitives'
import { LabDetails, LabSlider, labColors } from './lab/LabUI'

// Dartmouth, The Engineering of Structures Around Us: material properties,
// cross-sectional area and second moment of area (CC BY-NC-SA 4.0).
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
type Result = { governing: 'compression' | 'buckling'; capacity: number; compression: number; buckling: number; area: number; inertia: number }

function calculate(material: Material, section: Section, width: number, length: number): Result {
  // Dimensions in meters; E is given in GPa and crushing/yield stress in MPa.
  // Hollow sections have a 1/6-of-outside-width wall, for a repeatable
  // educational comparison without introducing another control.
  const inner = section.startsWith('hollow') ? width * (2 / 3) : 0
  const round = section === 'pipe' || section === 'hollow-pipe'
  const area = (width ** 2 - inner ** 2) * (round ? Math.PI / 4 : 1)
  const inertia = (width ** 4 - inner ** 4) * (round ? Math.PI / 64 : 1 / 12)
  const compression = materials[material].strength * 1e6 * area / 1000
  // Euler's elastic buckling load for a pinned-pinned column (K=1).
  const buckling = Math.PI ** 2 * materials[material].E * 1e9 * inertia / length ** 2 / 1000
  return {
    governing: compression <= buckling ? 'compression' : 'buckling',
    capacity: Math.min(compression, buckling), compression, buckling, area, inertia,
  }
}

const formatLoad = (v: number) => Math.round(v).toLocaleString('en-US')

function ColumnIllustration({ section, width, length, result }: {
  section: Section; width: number; length: number; result: Result | null
}) {
  const round = section === 'pipe' || section === 'hollow-pipe'
  const hollow = section.startsWith('hollow')
  const buckled = result?.governing === 'buckling'
  const compression = result?.governing === 'compression'
  // A fixed drawing viewport keeps the whole specimen visible as dimensions change.
  const h = 155 + (length - 1) / 4 * 105
  const half = 11 + (width - .05) / .55 * 23
  const top = 345 - h
  const cx = 690
  const shift = buckled ? Math.min(29, h * .12) : 0
  const fill = buckled ? '#b96c4d' : '#aec4df'
  const side = buckled ? '#a65a3a' : '#91afce'
  const outline = '#223746'
  const left = cx - half
  const right = cx + half
  const centerline = `M ${cx} ${top} C ${cx + shift * 1.8} ${top + h * .35}, ${cx - shift * .45} ${top + h * .7}, ${cx} ${top + h}`
  const leftEdge = `M ${left} ${top} C ${left + shift * 1.8} ${top + h * .35}, ${left - shift * .45} ${top + h * .7}, ${left} ${top + h}`
  const rightEdge = `M ${right} ${top} C ${right + shift * 1.8} ${top + h * .35}, ${right - shift * .45} ${top + h * .7}, ${right} ${top + h}`
  const columnShape = `${leftEdge} Q ${cx} ${top + h + 10} ${right} ${top + h} C ${right - shift * .45} ${top + h * .7}, ${right + shift * 1.8} ${top + h * .35}, ${right} ${top} Z`
  const burstPoints = Array.from({ length: 20 }, (_, i) => {
    const theta = -Math.PI / 2 + Math.PI * 2 * i / 20
    const radius = i % 2 === 0 ? 62 : 26
    return `${cx - 12 + Math.cos(theta) * radius},${top + h * .48 + Math.sin(theta) * radius}`
  }).join(' ')

  return <svg viewBox="0 0 1000 400" width="100%" height="100%" role="img"
    aria-label={buckled ? 'Column visibly bends sideways under its theoretical buckling load' : compression ? 'Column remains straight, with a burst marking material compression failure' : 'Straight column before calculating its failure load'}
    style={{ display: 'block', overflow: 'visible' }}>
    {buckled && <path d={`M ${cx} ${top} V 345`} stroke="#a4b2bf" strokeWidth="1.5" strokeDasharray="5 6" fill="none" />}
    {round ? <>
      <path d={columnShape} fill={fill} stroke={outline} strokeWidth="1.7" />
      <ellipse cx={cx} cy={top} rx={half} ry={Math.min(12, half * .35)} fill={side} stroke={outline} strokeWidth="1.7" />
      {hollow && <ellipse cx={cx} cy={top} rx={half * 2 / 3} ry={Math.min(12, half * .35) * 2 / 3}
        fill="#f5f8fa" stroke={outline} strokeWidth="1.2" />}
    </> : <>
      <path d={columnShape} fill={fill} stroke={outline} strokeWidth="1.7" />
      <path d={`M ${left} ${top} l ${half * .65} -${half * .35} h ${half * 2} l -${half * .65} ${half * .35} Z`}
        fill={side} stroke={outline} strokeWidth="1.7" />
      {hollow && <path d={`M ${left + half * .34} ${top - half * .07} l ${half * .45} -${half * .20} h ${half * 1.1} l -${half * .45} ${half * .2} Z`}
        fill="#f5f8fa" stroke={outline} strokeWidth="1.2" />}
    </>}
    {compression && <polygon points={burstPoints} fill="#ffe500" stroke="#1a2731" strokeWidth="1.8" />}
    {buckled && <path d={centerline} stroke="#7a3e2e" strokeDasharray="4 7" strokeWidth="1.5" fill="none" opacity=".35" />}
  </svg>
}

export default function ColumnSimulator() {
  const [material, setMaterial] = useState<Material>('Steel')
  const [section, setSection] = useState<Section>('pipe')
  const [width, setWidth] = useState(.6)
  const [length, setLength] = useState(3.7)
  const [result, setResult] = useState<Result | null>(null)

  const changeMaterial = (next: Material) => { setMaterial(next); setResult(null) }
  const changeSection = (next: Section) => { setSection(next); setResult(null) }
  const changeWidth = (next: number) => { setWidth(next); setResult(null) }
  const changeLength = (next: number) => { setLength(next); setResult(null) }
  const materialProps = materials[material]

  return <UiBox sx={{ pb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <UiSurface variant="outlined" sx={{ p: { xs: 1.75, md: 2.5 }, borderColor: labColors.border }}>
      <UiBox sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
        <UiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
          <TextField select fullWidth size="small" label="Material" value={material}
            onChange={e => changeMaterial(e.target.value as Material)}>
            {(Object.keys(materials) as Material[]).map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </TextField>
          <UiText sx={{ fontSize: 12, color: labColors.muted }}>
            Elastic modulus {materialProps.E} GPa · Yield/crushing stress {materialProps.strength} MPa
          </UiText>
          <LabSlider label={section.includes('pipe') ? 'Base diameter' : 'Base width'}
            value={width} min={.05} max={.6} step={.01} unit="m" onChange={changeWidth} />
        </UiBox>
        <UiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
          <TextField select fullWidth size="small" label="Cross-section" value={section}
            onChange={e => changeSection(e.target.value as Section)}>
            <MenuItem value="square">Square</MenuItem>
            <MenuItem value="hollow-square">Hollow Square</MenuItem>
            <MenuItem value="pipe">Pipe</MenuItem>
            <MenuItem value="hollow-pipe">Hollow Pipe</MenuItem>
          </TextField>
          <UiText sx={{ fontSize: 12, color: labColors.muted }}>
            {section.startsWith('hollow') ? 'Hollow section · assumed wall thickness = width / 6' : 'Solid section'}
          </UiText>
          <LabSlider label="Length" value={length} min={1} max={5} step={.05} unit="m" onChange={changeLength} />
        </UiBox>
      </UiBox>
    </UiSurface>

    <UiSurface variant="outlined" sx={{
      borderColor: labColors.border, bgcolor: '#f5f8fa', p: { xs: 1.5, md: 2 },
      minHeight: 430, position: 'relative',
    }}>
      <UiBox sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <UiBox>
          <UiButton size="medium" variant="contained"
            onClick={() => setResult(calculate(material, section, width, length))}
            sx={{ bgcolor: labColors.accent, textTransform: 'none', minWidth: 190,
              '&:hover': { bgcolor: labColors.ink } }}>
            Calculate load
          </UiButton>
          {result && <UiBox role="status" sx={{ mt: 1.5, maxWidth: 320 }}>
            <UiBox sx={{ px: 1.5, py: .75, bgcolor: '#bc493e', color: '#fff', borderRadius: 1,
              fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>
              Failure mode: {result.governing === 'buckling' ? 'Buckling' : 'Compression'}
            </UiBox>
            <UiText sx={{ fontSize: 12.5, fontWeight: 700, mt: 1, color: labColors.ink }}>
              {result.governing === 'buckling' ? 'Buckling load' : 'Compressive load'}:
            </UiText>
            <UiText sx={{ fontSize: 15, color: labColors.ink }}>{formatLoad(result.capacity)} kN</UiText>
          </UiBox>}
        </UiBox>
        {result && <UiButton size="small" onClick={() => setResult(null)} sx={{ color: labColors.accent, textTransform: 'none' }}>
          Reset result
        </UiButton>}
      </UiBox>
      <UiBox sx={{ height: { xs: 345, md: 380 }, width: '100%', mt: { xs: 0, md: -3 } }}>
        <ColumnIllustration section={section} width={width} length={length} result={result} />
      </UiBox>
      {result && <LabDetails title="Load calculations">
        <UiBox sx={{ mt: 1, p: 1.5, bgcolor: 'white', fontSize: 12.5, color: labColors.ink,
          display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
          <span>Compression limit: {formatLoad(result.compression)} kN</span>
          <span>Euler buckling limit: {formatLoad(result.buckling)} kN</span>
          <span>Area: {result.area.toExponential(3)} m²</span>
          <span>Second moment of area: {result.inertia.toExponential(3)} m⁴</span>
        </UiBox>
      </LabDetails>}
      <UiText variant="caption" sx={{ display: 'block', color: labColors.muted, fontSize: 11, lineHeight: 1.4, mt: .5 }}>
        Educational model using axial compression and pinned-end Euler buckling (K = 1).
        Shapes and failure illustrations are schematic. Local buckling, imperfections, crushing behavior,
        and safety factors are not modeled. Not for structural design.
        Material properties adapted from Dartmouth’s The Engineering of Structures Around Us (CC BY-NC-SA 4.0).
      </UiText>
    </UiSurface>
  </UiBox>
}
