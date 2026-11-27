import { useState } from 'react'
import { UiBox, UiButton, UiSelect, UiText } from './components/atoms/MuiPrimitives'
import { LabDetails, LabSlider, labColors } from './lab/LabUI'
import { SimulatorWorkspace, SimulatorStatus, SimulatorVisual, SimulatorControls } from './lab/SimulatorLayout'
import Column3D from './Column3D'

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
  appliedLoad: number
  failed: boolean
  compression: number
  buckling: number
  area: number
  inertia: number
}

function calculate(material: Material, section: Section, width: number, length: number, appliedLoad: number): Result {
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
    appliedLoad,
    failed: appliedLoad >= Math.min(compression, buckling),
    compression, buckling, area, inertia,
  }
}

const formatLoad = (value: number) => Math.round(value).toLocaleString('en-US')

// These describe typical qualitative responses, NOT additional calculated
// strength limits. Fracture requires tensile strength and flaw information
// that the simplified course material table does not provide.
const responseStyle: Record<Material, 'ductile' | 'brittle' | 'wood' | 'variable'> = {
  Steel: 'ductile',
  Copper: 'ductile',
  Plastic: 'variable',
  Wood: 'wood',
  Glass: 'brittle',
  Concrete: 'brittle',
  'Granite / Stone': 'brittle',
}
function responseDescription(material: Material, governing: Result['governing']) {
  const style = responseStyle[material]
  if (governing === 'buckling') {
    if (style === 'brittle') return 'Euler buckling governs this idealized model. A brittle column may fracture as bending creates tensile stress; the small bend and crack are illustrative, not a predicted fracture load.'
    if (style === 'wood') return 'Buckling governs. Wood may bend or split depending on grain, defects and loading; splitting is not calculated here.'
    if (style === 'variable') return 'Buckling governs. Different plastics may bend, yield or crack depending on their formulation.'
    return 'Buckling governs. Large bending is an exaggerated illustration of instability, not a calculated deflection.'
  }
  if (style === 'brittle') return 'The material compression limit governs. Cracking or crushing is illustrated schematically; actual fracture depends on defects and stress distribution.'
  if (style === 'wood') return 'The compression limit governs. Local crushing and grain-dependent splitting are possible.'
  if (style === 'variable') return 'The compression limit governs. Plastic may yield or crack depending on its type.'
  return 'The material compression limit governs. Yielding or local deformation is illustrated, not a predicted shape.'
}

export default function ColumnSimulator() {
  const [material, setMaterial] = useState<Material>('Steel')
  const [section, setSection] = useState<Section>('pipe')
  const [width, setWidth] = useState(.6)
  const [length, setLength] = useState(3.7)
  const [appliedLoad, setAppliedLoad] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [simulationRun, setSimulationRun] = useState(0)
  const calculateLoad = () => {
    setResult(calculate(material, section, width, length, appliedLoad))
    setSimulationRun(run => run + 1)
  }
  const theoretical = calculate(material, section, width, length, 0)
  // The upper range follows the selected section, so even very strong or
  // very slender columns can be taken from zero through their failure limit.
  const sliderMaximum = Math.max(10, Math.ceil(theoretical.capacity * 1.5 / 10) * 10)
  const changeMaterial = (value: Material) => { setMaterial(value); setAppliedLoad(0); setResult(null) }
  const changeSection = (value: Section) => { setSection(value); setAppliedLoad(0); setResult(null) }
  const changeWidth = (value: number) => { setWidth(value); setAppliedLoad(0); setResult(null) }
  const changeLength = (value: number) => { setLength(value); setAppliedLoad(0); setResult(null) }
  const changeLoad = (value: number) => { setAppliedLoad(value); setResult(null) }

  const resetExperiment = () => {
    setMaterial('Steel')
    setSection('pipe')
    setWidth(.6)
    setLength(3.7)
    setAppliedLoad(0)
    setResult(null)
  }

  return <SimulatorWorkspace
    status={<SimulatorStatus
      tone={result?.failed ? 'failure' : result ? 'success' : 'neutral'}
      title={result?.failed
        ? `Limit exceeded: ${result.governing === 'buckling' ? 'Buckling' : 'Compression'}`
        : result ? 'Column supports the applied load' : 'Column ready for analysis'}
      detail={result
        ? `Applied ${formatLoad(result.appliedLoad)} kN / limit ${formatLoad(result.capacity)} kN`
        : appliedLoad>0 ? `Selected downward force: ${formatLoad(appliedLoad)} kN. Select Calculate load to test.` : 'Set a load, then select Calculate load.'}
      actionLabel="Reset"
      onAction={resetExperiment}
    />}
    visual={<SimulatorVisual title="Column response">
      <Column3D material={material} section={section} width={width} length={length}
        load={appliedLoad} replay={simulationRun} failure={result?.failed ? result.governing : null}/>
    </SimulatorVisual>}
    controls={<SimulatorControls>
      <UiText sx={{ fontWeight: 700, fontSize: 14, color: labColors.ink }}>Column configuration</UiText>
      <UiSelect label="Material" value={material} onValueChange={value => changeMaterial(value as Material)}
        options={(Object.keys(materials) as Material[]).map(name => ({value:name,label:name}))}/>
      <UiSelect label="Cross-section" value={section} onValueChange={value => changeSection(value as Section)}
        options={[
          {value:'square',label:'Square'},
          {value:'hollow-square',label:'Hollow square'},
          {value:'pipe',label:'Pipe'},
          {value:'hollow-pipe',label:'Hollow pipe'},
        ]}/>
      <UiBox sx={{ display: 'flex', flexDirection: 'column', gap: .25 }}>
        <LabSlider compact label={section.includes('pipe') ? 'Base diameter' : 'Base width'}
          value={width} min={.05} max={.6} step={.01} unit="m" onChange={changeWidth}/>
        <LabSlider compact label="Length" value={length} min={1} max={5} step={.05} unit="m" onChange={changeLength}/>
        <LabSlider compact label="Applied load" value={Math.min(appliedLoad,sliderMaximum)} min={0} max={sliderMaximum}
          step={1} unit="kN" onChange={changeLoad}/>
 
      </UiBox>
      <UiText sx={{ fontSize: 11.5, color: labColors.muted }}>
        Elastic modulus: {materials[material].E} GPa · Material limit: {materials[material].strength} MPa
      </UiText>
      <UiBox sx={{ display: 'flex', gap: 1, mt: .5, flexWrap: 'wrap' }}>
        <UiButton variant="contained" size="small" onClick={calculateLoad}
          sx={{ bgcolor:labColors.accent, textTransform:'none', '&:hover': { bgcolor:labColors.ink } }}>
          Calculate load
        </UiButton>
      </UiBox>
      <UiBox sx={{ p: 1.1, mt: .75, bgcolor: '#f2f6f8', borderRadius: 'var(--bbb-card-radius, 4px)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
        <UiBox>
          <UiText variant="caption" sx={{ color:labColors.muted, fontSize:11.5 }}>Theoretical load limit</UiText>
          <UiText sx={{ fontSize:15, fontWeight:800, color:labColors.ink }}>
            {formatLoad(theoretical.capacity)+' kN'}
          </UiText>
        </UiBox>
        <UiBox>
          <UiText variant="caption" sx={{ color:labColors.muted, fontSize:11.5 }}>Applied load</UiText>
          <UiText sx={{ fontSize:15, fontWeight:800, color:labColors.ink }}>
            {result ? formatLoad(result.appliedLoad)+' kN' : '—'}
          </UiText>
        </UiBox>
      </UiBox>
      <LabDetails title="Load calculations">
        <UiText sx={{ fontSize: 12, color: labColors.muted, mt: 1, mb: 1 }}>
          Model: pinned-end Euler buckling and axial compression. Illustrations are schematic.
          Fracture and post-buckling behavior are not calculated.
          {result?.failed && ' ' + responseDescription(material, result.governing)}
        </UiText>
        <UiBox sx={{ p: 1.25, mt: .5, bgcolor: '#f2f6f8', borderRadius: 'var(--bbb-card-radius, 4px)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {([
            ['Compressive limit', formatLoad(theoretical.compression)+' kN'],
            ['Euler buckling', formatLoad(theoretical.buckling)+' kN'],
            ['Area', theoretical.area.toExponential(3)+' m²'],
            ['Second moment', theoretical.inertia.toExponential(3)+' m⁴'],
          ] as const).map(([name,value])=><UiBox key={name}>
            <UiText variant="caption" sx={{ color:labColors.muted }}>{name}</UiText>
            <UiText sx={{ fontSize:12.5, fontWeight:700 }}>{value}</UiText>
          </UiBox>)}
        </UiBox>
      </LabDetails>

    </SimulatorControls>}
  />
}
