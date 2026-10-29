import { useState } from 'react'
import { UiBox, UiSurface, UiText, UiStack } from './components/atoms/MuiPrimitives'
import { LabSlider, labColors } from './lab/LabUI'

/**
 * Idealized weightless cable with a single point load and level anchors.
 * Cable consists of two straight tension-only segments meeting at the load.
 * H = P a(L-a) / (f L); reactions are P(L-a)/L and P a/L.
 */
export default function FunicularSimulator() {
  const [load,setLoad] = useState(10)
  const [span,setSpan] = useState(8)
  const [sag,setSag] = useState(2)
  const [position,setPosition] = useState(50)
  const a=span*position/100
  const b=span-a
  const va=load*b/span
  const vb=load*a/span
  const horizontal=load*a*b/(sag*span)
  const ta=Math.hypot(horizontal,va)
  const tb=Math.hypot(horizontal,vb)
  const x=75+490*position/100
  const y=104+Math.min(150,sag/span*490)
  const fmt=(v:number)=>v.toFixed(1)
  return <UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'minmax(0,1.3fr) minmax(310px,.7fr)'},gap:3,pb:4}}>
    <UiSurface variant="outlined" sx={{p:{xs:2,md:3},bgcolor:'#f5f8fa',borderColor:labColors.border,borderRadius:2}}>
      <UiText variant="subtitle1" sx={{fontWeight:600,color:labColors.ink,mb:1}}>Hanging cable and forces</UiText>
      <svg viewBox="0 0 640 340" width="100%" role="img" aria-label={`Cable spanning ${span} meters with ${sag} meters of sag. A ${load} kilonewton load acts at ${position} percent of the span.`}>
        <path d="M75 50v242M565 50v242" stroke="#d1dce2" strokeDasharray="5 6" />
        <path d="M75 104H565" stroke="#a5b7c3" strokeDasharray="6 7" strokeWidth="1.5"/>
        <rect x="50" y="91" width="25" height="26" fill="#c6d4dc"/>
        <rect x="565" y="91" width="25" height="26" fill="#c6d4dc"/>
        <polyline points={`75,104 ${x},${y} 565,104`} fill="none" stroke="#123b55" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
        <circle cx={x} cy={y} r="8" fill="#fff" stroke="#123b55" strokeWidth="3"/>
        <line x1={x} y1={y-76} x2={x} y2={y-15} stroke="#c05e3d" strokeWidth="4"/>
        <path d={`M${x-10} ${y-25}L${x} ${y-9}L${x+10} ${y-25}Z`} fill="#c05e3d"/>
        <text x={Math.min(580,Math.max(60,x+17))} y={y-58} fill="#a14e35" fontWeight="700" fontSize="17">{load} kN ↓</text>
        <line x1="75" y1="104" x2="75" y2="64" stroke="#39806c" strokeWidth="3"/>
        <path d="M67 77l8 -15 8 15" fill="none" stroke="#39806c" strokeWidth="3"/>
        <line x1="565" y1="104" x2="565" y2="64" stroke="#39806c" strokeWidth="3"/>
        <path d="M557 77l8 -15 8 15" fill="none" stroke="#39806c" strokeWidth="3"/>
        <text x="80" y="56" fill="#276957" fontSize="15">Vₐ {fmt(va)} kN</text>
        <text x="560" y="56" textAnchor="end" fill="#276957" fontSize="15">Vᵦ {fmt(vb)} kN</text>
        <line x1="75" y1="305" x2="565" y2="305" stroke="#8197a5" strokeWidth="1.5"/>
        <path d="M75 297v16M565 297v16" stroke="#8197a5" strokeWidth="2"/>
        <text x="320" y="326" fontSize="17" fill="#465d70" textAnchor="middle">{span} m span</text>
        <line x1="605" y1="104" x2="605" y2={y} stroke="#657f90" strokeDasharray="3 4"/>
        <text x="615" y={(104+y)/2+6} fill="#465d70" fontSize="14">{sag} m</text>
        <text x={(75+x)/2} y={(104+y)/2-11} textAnchor="middle" fontSize="15" fill="#173a52">Tₐ</text>
        <text x={(565+x)/2} y={(104+y)/2-11} textAnchor="middle" fontSize="15" fill="#173a52">Tᵦ</text>
      </svg>
      <UiText variant="body2" sx={{color:labColors.muted,mt:1,lineHeight:1.55}}>
        This is a funicular shape: both cable segments carry <strong>tension only</strong>. Red shows the downward load; green shows the vertical support reactions.
      </UiText>
    </UiSurface>
    <UiSurface variant="outlined" sx={{p:3,borderColor:labColors.border,borderRadius:2}}>
      <UiStack spacing={1}>
        <LabSlider label="Point load" value={load} min={1} max={30} unit="kN" onChange={setLoad}/>
        <LabSlider label="Span" value={span} min={4} max={16} unit="m" onChange={setSpan}/>
        <LabSlider label="Sag (vertical drop)" value={sag} min={1} max={5} step={0.5} unit="m" onChange={setSag}/>
        <LabSlider label="Load position from left" value={position} min={20} max={80} step={5} unit="%" onChange={setPosition}/>
      </UiStack>
      <UiBox sx={{mt:2,p:2,bgcolor:'#f2f6f8',borderRadius:2}}>
        <UiText sx={{fontSize:13,color:labColors.muted}}>Horizontal cable force (both sides)</UiText>
        <UiText variant="h5" sx={{color:labColors.ink,fontWeight:700}}>{fmt(horizontal)} kN</UiText>
        <UiBox sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2,mt:2}}>
          <UiBox><UiText variant="caption">Left tension</UiText><UiText sx={{fontWeight:700}}>{fmt(ta)} kN</UiText></UiBox>
          <UiBox><UiText variant="caption">Right tension</UiText><UiText sx={{fontWeight:700}}>{fmt(tb)} kN</UiText></UiBox>
          <UiBox><UiText variant="caption">Left reaction</UiText><UiText sx={{fontWeight:700}}>{fmt(va)} kN</UiText></UiBox>
          <UiBox><UiText variant="caption">Right reaction</UiText><UiText sx={{fontWeight:700}}>{fmt(vb)} kN</UiText></UiBox>
        </UiBox>
      </UiBox>
      <UiText variant="body2" sx={{mt:2,color:labColors.muted,lineHeight:1.6}}>
        <strong>Try this:</strong> reduce the sag while keeping the load and span fixed. Tension increases because a flatter cable needs more horizontal force to support the same weight.
      </UiText>
      <UiText variant="caption" sx={{display:'block',mt:2,color:labColors.muted,lineHeight:1.5}}>
        Idealized model: static point load, flexible weightless cable, level rigid anchors, no cable self-weight or stretching. For learning—not actual structural design.
      </UiText>
    </UiSurface>
  </UiBox>
}
