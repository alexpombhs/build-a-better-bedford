import { useState } from 'react'
import type { ReactNode } from 'react'
import { UiBox, UiSurface, UiStack, UiText } from './components/atoms/MuiPrimitives'
import { LabTabs, LabCard, LabSlider, SectionHeading, labColors } from './lab/LabUI'

type Tab = 'simulators' | 'ideas' | 'lab' | 'hands-on'

export function EngineeringTabs({active,onChange}:{active:Tab;onChange:(tab:Tab)=>void}) {
  return <LabTabs value={active} onChange={value=>onChange(value as Tab)} />
}

const sectionCopy: Record<Tab,{eyebrow:string;title:string;description:string}> = {
  simulators:{
    eyebrow:'BEAM SIMULATOR',
    title:'How does a beam carry a load?',
    description:'Move the load or change the span. Watch how the support reactions and bending moment change.',
  },
  ideas:{
    eyebrow:'LOCAL QUESTIONS',
    title:'Ideas from around Bedford',
    description:'Problems worth studying, from crosswalk geometry to drainage and trails.',
  },
  lab:{
    eyebrow:'TESTING',
    title:'Run a controlled test',
    description:'Make a prediction, change one variable, and compare the measurements.',
  },
  'hands-on':{
    eyebrow:'BUILD CHALLENGES',
    title:'Build it. Then test it.',
    description:'Small builds for comparing forces, structural shapes, and design choices.',
  },
}

export function EngineeringSectionIntro({tab,actions}:{tab:Tab;actions?:ReactNode}) {
  return <SectionHeading {...sectionCopy[tab]} actions={actions}/>
}

export function EngineeringWorkspace({tab}:{tab:Exclude<Tab,'ideas'>}) {
  const [load,setLoad]=useState(10)
  const [position,setPosition]=useState(50)
  const [span,setSpan]=useState(6)
  const a=span*position/100
  const left=load*(span-a)/span
  const right=load*a/span
  const maxMoment=left*a
  if(tab==='lab') return <UiBox sx={{pb:4}}><UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(3,minmax(0,1fr))'},gap:2}}><LabCard eyebrow="01 / QUESTION" title="Make a prediction">Choose a problem and decide what you expect before testing.</LabCard><LabCard eyebrow="02 / TEST" title="Change one variable">Keep the other conditions the same, record measurements, and repeat trials.</LabCard><LabCard eyebrow="03 / REVIEW" title="Check the results">Graph your results, explain unexpected behavior, and revise the design.</LabCard></UiBox></UiBox>
  if(tab==='hands-on') return <UiBox sx={{pb:4}}><UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(3,minmax(0,1fr))'},gap:2}}><LabCard eyebrow="BRIDGES" title="Paper beam challenge">Compare flat and folded paper spanning the same gap, using small weights.</LabCard><LabCard eyebrow="STRUCTURES" title="Triangle vs. square">Build straw frames and gently compare how their shapes resist deformation.</LabCard><LabCard eyebrow="ROAD DESIGN" title="Crosswalk model">Compare tabletop street layouts with toy cars for visibility and crossing distance.</LabCard></UiBox></UiBox>
  return <UiBox sx={{pb:4}}>
    
    <UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'minmax(0,1.35fr) minmax(320px,.65fr)'},gap:3}}>
      <UiSurface variant="outlined" sx={{p:3,bgcolor:"#f5f8f6",borderColor:labColors.border,borderRadius:3}}>
        <svg viewBox="0 0 640 310" role="img" aria-label="A simply supported beam with an adjustable point load and reactions at both ends">
          <line x1="64" y1="155" x2="576" y2="155" stroke="#234b39" strokeWidth="12" strokeLinecap="round"/>
          <path d="M64 165 L43 196 L85 196 Z M576 165 L555 196 L597 196 Z" fill="#9fb6a6" stroke="#234b39" strokeWidth="2"/>
          <line x1="35" y1="201" x2="99" y2="201" stroke="#234b39" strokeWidth="3"/>
          <circle cx="564" cy="203" r="7" fill="#9fb6a6" stroke="#234b39" strokeWidth="2"/>
          <circle cx="588" cy="203" r="7" fill="#9fb6a6" stroke="#234b39" strokeWidth="2"/>
          <line x1={64+512*position/100} y1="44" x2={64+512*position/100} y2="128" stroke="#bd613d" strokeWidth="5"/>
          <path d={`M${64+512*position/100-12} 111 L${64+512*position/100} 135 L${64+512*position/100+12} 111 Z`} fill="#bd613d"/>
          <text x={64+512*position/100} y="29" textAnchor="middle" fill="#974d31" fontSize="19" fontWeight="700">{load} kN</text>
          <line x1="64" y1="265" x2="576" y2="265" stroke="#789587" strokeWidth="2"/>
          <path d="M64 257 V273 M576 257 V273" stroke="#789587" strokeWidth="2"/>
          <text x="320" y="291" textAnchor="middle" fill="#405b4b" fontSize="18">{span} m span</text>
          <text x="64" y="231" textAnchor="middle" fill="#2e6c4b" fontSize="17">A</text>
          <text x="576" y="231" textAnchor="middle" fill="#2e6c4b" fontSize="17">B</text>
        </svg>
        <p>Concept model: assumes a weightless beam, a single static point load, and simple supports. Not for designing real bridges.</p>
      </UiSurface>
      <UiSurface variant="outlined" sx={{p:3,borderColor:labColors.border,borderRadius:3}}>
        <LabSlider label="Load" value={load} min={1} max={30} unit="kN" onChange={setLoad}/>
        <LabSlider label="Load position from A" value={position} min={10} max={90} step={5} unit="%" onChange={setPosition}/>
        <LabSlider label="Bridge span" value={span} min={2} max={12} unit="m" onChange={setSpan}/>
        <UiStack spacing={1} sx={{mt:3}}>
          <div><small>Reaction at A</small><strong>{left.toFixed(1)} kN</strong></div>
          <div><small>Reaction at B</small><strong>{right.toFixed(1)} kN</strong></div>
          <div><small>Peak bending moment</small><strong>{maxMoment.toFixed(1)} kN·m</strong></div>
        </UiStack>
        <UiText sx={{mt:2,p:2,bgcolor:"#eff6f0",borderRadius:2,color:labColors.ink,fontSize:13}}>Try moving the same load toward one support. Which support carries more of it?</UiText>
      </UiSurface>
    </UiBox>
  </UiBox>
}
