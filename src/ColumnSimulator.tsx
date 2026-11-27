import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { UiBox, UiSurface, UiText, UiButton } from './components/atoms/MuiPrimitives'
import { TextField, MenuItem } from '@mui/material'
import { LabSlider, labColors } from './lab/LabUI'

// Educational material values: Dartmouth, The Engineering of Structures Around Us,
// Cross-Sectional & Materials Properties (CC BY-NC-SA 4.0).
const materials = { Steel:[200,250], Concrete:[20,70], Wood:[10,30], Granite:[80,150], Plastic:[2,50], Glass:[50,50], Copper:[100,150] } as const
type Material = keyof typeof materials
type Section = 'square'|'hollow square'|'circle'|'hollow circle'
function ColumnView({length,width,thickness,section,buckled,load}:{length:number;width:number;thickness:number;section:Section;buckled:boolean;load:number}) {
 const host=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const el=host.current
  if(!el)return
  let renderer:THREE.WebGLRenderer
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}) } catch { return }
  const scene=new THREE.Scene()
  const camera=new THREE.OrthographicCamera(-3,3,3,-3,.01,100)
  camera.position.set(6,3.5,9)
  const controls=new OrbitControls(camera,renderer.domElement)
  controls.target.set(0,1.55,0); controls.enablePan=false; controls.minZoom=.65; controls.maxZoom=3; controls.update()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); el.appendChild(renderer.domElement)
  scene.add(new THREE.HemisphereLight(0xffffff,0x8293a0,2.5))
  const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,7,5);scene.add(light)
  const h=3, w=Math.max(.075,width/length*h), inner=Math.max(0,w-2*thickness/length*h)
  const n=section.includes('circle')?48:4
  const radius=(a:number)=>n===4?a/Math.sqrt(2):a/2
  const ring=(a:number,i:number)=>{const angle=2*Math.PI*i/n+(n===4?Math.PI/4:0);return [radius(a)*Math.cos(angle),radius(a)*Math.sin(angle)]}
  const vertices:number[]=[], indices:number[]=[]
  const hollow=section.startsWith('hollow'), layers=40, rings=hollow?2:1
  for(let k=0;k<=layers;k++)for(let j=0;j<rings;j++)for(let i=0;i<n;i++){
   const [x,z]=ring(j?inner:w,i);const u=k/layers
   vertices.push(x+(buckled ? .65*Math.sin(Math.PI*u):0),h*u,z)
  }
  const idx=(k:number,j:number,i:number)=>(k*rings+j)*n+(i%n)
  for(let k=0;k<layers;k++)for(let j=0;j<rings;j++)for(let i=0;i<n;i++){
   const a=idx(k,j,i),b=idx(k,j,i+1),c=idx(k+1,j,i),d=idx(k+1,j,i+1)
   indices.push(a,b,c,b,d,c)
  }
  for(const k of [0,layers])for(let i=0;i<n;i++){
   if(hollow)indices.push(idx(k,0,i),idx(k,0,i+1),idx(k,1,i),idx(k,0,i+1),idx(k,1,i+1),idx(k,1,i))
   else if(i>0&&i<n-1)indices.push(idx(k,0,0),idx(k,0,i),idx(k,0,i+1))
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals()
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:buckled?0xb4573d:0x7895ad,side:THREE.DoubleSide,flatShading:n===4}));scene.add(mesh)
  const base=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.65,w*1.5),.12,Math.max(.65,w*1.5)),new THREE.MeshStandardMaterial({color:0x9baab4}));base.position.y=-.06;scene.add(base)
  const cap=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.5,w*1.25),.09,Math.max(.5,w*1.25)),new THREE.MeshStandardMaterial({color:0x9baab4}));cap.position.set(0,3.045,0);scene.add(cap)
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(0,4.05,0),.66,0xb4573d,.2,.14);scene.add(arrow)
  if(buckled){
    const points=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,3,0)];
    const reference=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:0x718797,dashSize:.12,gapSize:.09,transparent:true,opacity:.7}));reference.computeLineDistances();scene.add(reference)
    const note=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(0,1.5,.06),.9,0xb4573d,.16,.1);scene.add(note)
  }
  
  const resize=()=>{const rw=el.clientWidth||300,rh=el.clientHeight||400;renderer.setSize(rw,rh);const aspect=rw/rh;const halfH=2.65;camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix()}
  const observer=new ResizeObserver(resize);observer.observe(el);resize()
  renderer.setAnimationLoop(()=>renderer.render(scene,camera))
  return ()=>{observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const m=o.material; (Array.isArray(m)?m:[m]).forEach(v=>v.dispose())}});renderer.dispose();renderer.domElement.remove()}
 },[length,width,thickness,section,buckled,load])
 return <UiBox ref={host} sx={{height:410,width:'100%',touchAction:'none'}} role="img" aria-label={buckled?'Illustrative buckled column':'Straight column under axial load'}/>
}

export default function ColumnSimulator(){
 const [material,setMaterial]=useState<Material>('Steel')
 const [section,setSection]=useState<Section>('hollow square')
 const [length,setLength]=useState(5)
 const [width,setWidth]=useState(60)
 const [thickness,setThickness]=useState(10)
 const [load,setLoad]=useState(200)
 const [showCalculations,setShowCalculations]=useState(false)
 const [tested,setTested]=useState(true)
 const [animate,setAnimate]=useState(true)
 const [stage,setStage]=useState(0)
 const [e,s]=materials[material]
 const b=width/1000, t=thickness/1000, circular=section.includes('circle')
 const inner=section.startsWith('hollow')?Math.max(0,b-2*t):0
 const area=(b*b-inner*inner)*(circular?Math.PI/4:1)
 const inertia=(b**4-inner**4)*(circular?Math.PI/64:1/12)
 const stress=load*1000/area/1e6
 const critical=Math.PI**2*e*1e9*inertia/length**2/1000
 const compression=s*1e6*area/1000
 const capacity=Math.min(critical,compression)
 const failure=load>capacity
 const buckled=failure&&critical<=compression
 const shapeFailed=tested&&failure
 const stateText=!tested?'Ready to test':!failure?'Column carries applied load':buckled?'Buckling — lateral instability':'Compression limit exceeded'
 const fmt=(n:number)=>n.toLocaleString(undefined,{maximumFractionDigits:1})
 const update=()=>{setTested(false);setStage(0)}
 const run=()=>{setTested(true);setStage(x=>x+1)}
 const reset=()=>{setMaterial('Steel');setSection('hollow square');setLength(5);setWidth(60);setThickness(10);setLoad(200);setTested(false);setStage(x=>x+1)}
 return <UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'minmax(0,1.27fr) minmax(335px,.73fr)'},gap:2,alignItems:'stretch',pb:2}}>
  <UiBox sx={{display:'flex',flexDirection:'column',gap:1.25,minWidth:0}}>
   <UiSurface variant="outlined" sx={{p:1.5,borderColor:shapeFailed?'#df9e89':labColors.border,bgcolor:shapeFailed?'#fff0eb':'#f2f6f8'}}>
    <UiText role="status" sx={{fontSize:14,fontWeight:800,color:shapeFailed?'#9b3825':labColors.ink}}>{stateText}</UiText>
    <UiText sx={{fontSize:12,color:labColors.muted}}>{fmt(load)} kN applied · {fmt(capacity)} kN estimated theoretical limit</UiText>
   </UiSurface>
   <UiSurface variant="outlined" sx={{p:{xs:1.5,md:2},borderColor:labColors.border,bgcolor:'#f5f8fa',flex:1,position:'relative',overflow:'hidden'}}>
    <UiBox sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:1}}>
     <UiText sx={{fontSize:14,fontWeight:700}}>Axially loaded column</UiText>
     <UiButton size="small" onClick={()=>setAnimate(v=>!v)} sx={{textTransform:'none',fontSize:12,color:labColors.accent}}>{animate?'Hide deformation':'Show deformation'}</UiButton>
    </UiBox>
    <UiBox sx={{position:'relative'}}>
     <ColumnView key={stage+'-'+(animate?1:0)} length={length} width={width} thickness={thickness} section={section} buckled={shapeFailed&&buckled&&animate} load={load}/>
     <UiBox sx={{pointerEvents:'none',position:'absolute',top:12,right:8,color:'#a04f34',fontWeight:800,fontSize:12}}>↓ {fmt(load)} kN</UiBox>
     {shapeFailed&&<UiBox sx={{position:'absolute',bottom:17,left:8,p:1,bgcolor:'rgba(255,255,255,.9)',borderRadius:1,maxWidth:210}}>
       <UiText sx={{fontSize:12,fontWeight:700,color:'#9b3825'}}>{buckled?'Sideways deflection (exaggerated)':'Material compression limit exceeded'}</UiText>
       <UiText sx={{fontSize:11,color:labColors.muted}}>{buckled?'Dashed line indicates the original straight column.':'This view does not simulate crushing or cracking.'}</UiText>
     </UiBox>}
    </UiBox>
    <UiText variant="caption" sx={{display:'block',fontSize:11.5,color:labColors.muted}}>Full column and end plates · Drag to rotate · Scroll to zoom</UiText>
   </UiSurface>
  </UiBox>
  <UiSurface variant="outlined" sx={{p:{xs:1.5,md:2},borderColor:labColors.border,display:'flex',flexDirection:'column',gap:1}}>
   <UiText sx={{fontSize:14,fontWeight:700,mb:.5}}>Column configuration</UiText>
   <TextField select size="small" label="Material" value={material} onChange={v=>{setMaterial(v.target.value as Material);update()}}>{Object.keys(materials).map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField>
   <TextField select size="small" label="Cross-section" value={section} onChange={v=>{setSection(v.target.value as Section);update()}}><MenuItem value="square">Solid square</MenuItem><MenuItem value="hollow square">Hollow square</MenuItem><MenuItem value="circle">Solid circular</MenuItem><MenuItem value="hollow circle">Hollow circular</MenuItem></TextField>
   <LabSlider compact label="Length" value={length} min={1} max={10} step={.25} unit="m" onChange={v=>{setLength(v);update()}}/>
   <LabSlider compact label={circular?'Diameter':'Width'} value={width} min={20} max={500} step={5} unit="mm" onChange={v=>{setWidth(v);setThickness(t=>Math.min(t,Math.floor(v/2)-1));update()}}/>
   {section.startsWith('hollow')&&<LabSlider compact label="Wall thickness" value={thickness} min={1} max={Math.floor(width/2)-1} unit="mm" onChange={v=>{setThickness(v);update()}}/>}
   <LabSlider compact label="Applied force" value={load} min={0} max={1000} unit="kN" onChange={v=>{setLoad(v);update()}}/>
   <UiBox sx={{display:'flex',gap:1,flexWrap:'wrap',my:.5}}>
    <UiButton variant="contained" size="small" onClick={run} sx={{bgcolor:labColors.accent,textTransform:'none','&:hover':{bgcolor:labColors.ink}}}>Apply load</UiButton>
    <UiButton size="small" onClick={reset} sx={{textTransform:'none'}}>Reset</UiButton>
    <UiButton size="small" onClick={()=>{setMaterial('Steel');setSection('hollow square');setLength(5);setWidth(60);setThickness(10);setLoad(200);setTested(true);setStage(x=>x+1)}} sx={{textTransform:'none'}}>Dartmouth example</UiButton>
   </UiBox>
   <UiBox sx={{bgcolor:'#f2f6f8',borderRadius:'var(--bbb-card-radius, 4px)',p:1.5,display:'grid',gridTemplateColumns:'1fr 1fr',gap:1.5}}>
    {([['Applied load',fmt(load)+' kN'],['Maximum theoretical load',fmt(capacity)+' kN'],['Buckling limit',fmt(critical)+' kN'],['Compression limit',fmt(compression)+' kN']] as const).map(([label,val])=><UiBox key={label}><UiText sx={{fontSize:11.5,color:labColors.muted}}>{label}</UiText><UiText sx={{fontSize:15,fontWeight:800,color:labColors.ink}}>{val}</UiText></UiBox>)}
   </UiBox>
   <UiButton size="small" sx={{textTransform:'none',alignSelf:'flex-start'}} onClick={()=>setShowCalculations(v=>!v)}>{showCalculations?'Hide':'Show'} calculations</UiButton>
   {showCalculations&&<UiBox sx={{fontSize:12,color:labColors.muted}}>A = {area.toExponential(3)} m² · I = {inertia.toExponential(3)} m⁴ · Stress = {fmt(stress)} MPa · Pcr = π²EI/L²</UiBox>}
   <UiText variant="caption" sx={{fontSize:11,color:labColors.muted,lineHeight:1.4}}>Idealized pinned-ended static analysis, with exaggerated illustration of buckling. Not for structural design. Material values adapted from Dartmouth's The Engineering of Structures Around Us (CC BY-NC-SA 4.0).</UiText>
  </UiSurface>
 </UiBox>
}
