import { useState } from 'react'
import { UiBox, UiSurface, UiText, UiStack, UiTabs, UiTab } from './components/atoms/MuiPrimitives'
import { LabSlider, labColors } from './lab/LabUI'

type LoadPoint = {position:number; load:number}
const fmt=(v:number)=>v.toFixed(1)

/** Level anchors, weightless inextensible cable, vertical point loads, static equilibrium.
 * The cable is the piecewise-linear bending-moment diagram scaled by 1/H.
 * Sag is the maximum vertical ordinate below the anchor level.
 */
export default function FunicularSimulator() {
  const [count,setCount]=useState<1|2>(1)
  const [span,setSpan]=useState(8)
  const [sag,setSag]=useState(2)
  const [p1,setP1]=useState(10)
  const [p2,setP2]=useState(8)
  const [pos1,setPos1]=useState(35)
  const [pos2,setPos2]=useState(70)
  const points:LoadPoint[]=count===1
    ? [{position:pos1,load:p1}]
    : [{position:pos1,load:p1},{position:pos2,load:p2}]
  const nodes=points.map(p=>({...p,x:span*p.position/100}))
  const right=nodes.reduce((sum,p)=>sum+p.load*p.x/span,0)
  const left=nodes.reduce((sum,p)=>sum+p.load,0)-right
  const momentAt=(x:number)=>left*x-nodes.reduce((sum,p)=>sum+p.load*Math.max(0,x-p.x),0)
  const moments=[0,...nodes.map(p=>momentAt(p.x)),0]
  const peak=Math.max(...moments)
  const horizontal=peak/sag
  const xs=[0,...nodes.map(p=>p.x),span]
  const ys=moments.map(m=>m/horizontal)
  // For drawing, scale physical sag consistently to the canvas.
  const screen=xs.map((x,i)=>[75+490*x/span,98+ys[i]*30] as const)
  const polyline=screen.map(([x,y])=>`${x},${y}`).join(' ')
  const segments=xs.slice(0,-1).map((_,i)=>{
    const vertical=left-nodes.slice(0,i).reduce((s,p)=>s+p.load,0)
    return Math.hypot(horizontal,vertical)
  })
  const maxScreenY=Math.max(...screen.map(p=>p[1]))
  return <UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'minmax(0,1.3fr) minmax(310px,.7fr)'},gap:3,pb:4}}>
    <UiSurface variant="outlined" sx={{p:{xs:2,md:3},bgcolor:'#f5f8fa',borderColor:labColors.border,borderRadius:2}}>
      <UiText variant="subtitle1" sx={{fontWeight:600,color:labColors.ink,mb:1}}>Funicular cable under {count===1?'one load':'two loads'}</UiText>
      <svg viewBox="0 0 640 350" width="100%" role="img" aria-label={`Cable spanning ${span} meters with ${sag} meters maximum sag and ${count} point loads.`}>
        <path d="M75 58v244M565 58v244" stroke="#d1dce2" strokeDasharray="5 6"/>
        <path d="M75 98H565" stroke="#a5b7c3" strokeDasharray="6 7" strokeWidth="1.5"/>
        <rect x="50" y="85" width="25" height="26" fill="#c6d4dc"/><rect x="565" y="85" width="25" height="26" fill="#c6d4dc"/>
        <polyline points={polyline} fill="none" stroke="#123b55" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
        {nodes.map((p,i)=>{
          const [x,y]=screen[i+1]
          return <g key={i}>
            <circle cx={x} cy={y} r="7" fill="#fff" stroke="#123b55" strokeWidth="3"/>
            <line x1={x} y1={y-60} x2={x} y2={y-15} stroke="#c05e3d" strokeWidth="3"/>
            <path d={`M${x-8} ${y-23}l8 13 8 -13Z`} fill="#c05e3d"/>
            <text x={x} y={y-70} textAnchor="middle" fontSize="14" fill="#a14e35" fontWeight="700">P{i+1}: {p.load} kN</text>
          </g>
        })}
        <text x="75" y="47" fill="#276957" fontSize="15">A: {fmt(left)} kN ↑</text>
        <text x="565" y="47" textAnchor="end" fill="#276957" fontSize="15">B: {fmt(right)} kN ↑</text>
        <path d="M75 315H565M75 308v14M565 308v14" fill="none" stroke="#8197a5" strokeWidth="1.5"/>
        <text x="320" y="339" textAnchor="middle" fontSize="16" fill="#465d70">{span} m span</text>
        <line x1="602" y1="98" x2="602" y2={maxScreenY} stroke="#657f90" strokeDasharray="3 4"/>
        <text x="610" y={(98+maxScreenY)/2+5} fill="#465d70" fontSize="13">{sag} m sag</text>
      </svg>
      <UiText variant="body2" sx={{color:labColors.muted,mt:1,lineHeight:1.55}}>
        The cable forms straight segments between point loads. Each segment carries tension only. Green labels show vertical reactions at the anchors.
      </UiText>
    </UiSurface>
    <UiSurface variant="outlined" sx={{p:3,borderColor:labColors.border,borderRadius:2}}>
      <UiText sx={{fontWeight:600,mb:1}}>Number of point loads</UiText>
      <UiTabs value={count} onChange={(_,v)=>setCount(v as 1|2)} aria-label="Number of cable point loads" sx={{mb:2,minHeight:40}}>
        <UiTab value={1} label="1 load" sx={{minHeight:40,textTransform:'none'}}/>
        <UiTab value={2} label="2 loads" sx={{minHeight:40,textTransform:'none'}}/>
      </UiTabs>
      <UiStack spacing={1}>
        <LabSlider label="Span" value={span} min={4} max={16} unit="m" onChange={setSpan}/>
        <LabSlider label="Maximum sag" value={sag} min={1} max={5} step={0.5} unit="m" onChange={setSag}/>
        <LabSlider label="Load 1" value={p1} min={1} max={30} unit="kN" onChange={setP1}/>
        <LabSlider label="Load 1 position" value={pos1} min={15} max={count===2?pos2-10:85} step={5} unit="%" onChange={setPos1}/>
        {count===2 && <>
          <LabSlider label="Load 2" value={p2} min={1} max={30} unit="kN" onChange={setP2}/>
          <LabSlider label="Load 2 position" value={pos2} min={pos1+10} max={85} step={5} unit="%" onChange={setPos2}/>
        </>}
      </UiStack>
      <UiBox sx={{mt:2,p:2,bgcolor:'#f2f6f8',borderRadius:2}}>
        <UiText sx={{fontSize:13,color:labColors.muted}}>Horizontal tension component</UiText>
        <UiText variant="h5" sx={{color:labColors.ink,fontWeight:700}}>{fmt(horizontal)} kN</UiText>
        <UiBox sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2,mt:2}}>
          {segments.map((t,i)=><UiBox key={i}><UiText variant="caption">Segment {i+1} tension</UiText><UiText sx={{fontWeight:700}}>{fmt(t)} kN</UiText></UiBox>)}
          <UiBox><UiText variant="caption">Left vertical reaction</UiText><UiText sx={{fontWeight:700}}>{fmt(left)} kN</UiText></UiBox>
          <UiBox><UiText variant="caption">Right vertical reaction</UiText><UiText sx={{fontWeight:700}}>{fmt(right)} kN</UiText></UiBox>
        </UiBox>
      </UiBox>
      <UiText variant="body2" sx={{mt:2,color:labColors.muted,lineHeight:1.55}}>
        Try moving or increasing one load. Watch how the cable changes shape and how the support forces shift.
      </UiText>
      <UiText variant="caption" sx={{display:'block',mt:2,color:labColors.muted,lineHeight:1.5}}>
        Idealized static model with level anchors, a weightless flexible cable, and vertical point loads. Maximum sag is set by the slider. For learning, not structural design.
      </UiText>
    </UiSurface>
  </UiBox>
}
