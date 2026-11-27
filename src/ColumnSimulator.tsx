import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { UiBox, UiSurface, UiText, UiButton } from './components/atoms/MuiPrimitives'
import { TextField, MenuItem } from '@mui/material'
import { LabSlider, LabDetails, labColors } from './lab/LabUI'

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
  const camera=new THREE.PerspectiveCamera(38,1,.01,100)
  camera.position.set(5,3.5,7)
  const controls=new OrbitControls(camera,renderer.domElement)
  controls.target.set(0,1.5,0); controls.enablePan=false; controls.minDistance=3; controls.maxDistance=15; controls.update()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); el.appendChild(renderer.domElement)
  scene.add(new THREE.HemisphereLight(0xffffff,0x8293a0,2.5))
  const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,7,5);scene.add(light)
  const h=3, w=width/length*h, inner=Math.max(0,w-2*thickness/length*h)
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
  if(load>0)scene.add(new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(0,3.8,0),.75,0xb4573d,.2,.13))
  const resize=()=>{const width=el.clientWidth||300,height=el.clientHeight||320;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()}
  const observer=new ResizeObserver(resize);observer.observe(el);resize()
  renderer.setAnimationLoop(()=>renderer.render(scene,camera))
  return ()=>{observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const m=o.material; (Array.isArray(m)?m:[m]).forEach(v=>v.dispose())}});renderer.dispose();renderer.domElement.remove()}
 },[length,width,thickness,section,buckled,load])
 return <UiBox ref={host} sx={{height:340,width:'100%',touchAction:'none'}} role="img" aria-label={buckled?'Illustrative buckled column':'Straight column under axial load'}/>
}
export default function ColumnSimulator(){
 const [material,setMaterial]=useState<Material>('Steel'),[section,setSection]=useState<Section>('hollow square')
 const [length,setLength]=useState(5),[width,setWidth]=useState(60),[thickness,setThickness]=useState(10),[load,setLoad]=useState(20)
 const [e,s]=materials[material], b=width/1000,t=thickness/1000
 const inner=section.startsWith('hollow')?b-2*t:0, circular=section.includes('circle')
 const area=(b*b-inner*inner)*(circular?Math.PI/4:1)
 const inertia=(b**4-inner**4)*(circular?Math.PI/64:1/12)
 const stress=load*1000/area/1e6, critical=Math.PI**2*e*1e9*inertia/length**2/1000, compression=s*1e6*area/1000
 const capacity=Math.min(critical,compression), exceeded=load>=capacity, buckled=exceeded&&critical<=compression
 const fmt=(v:number)=>v.toLocaleString(undefined,{maximumFractionDigits:2})
 return <UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'minmax(0,1.27fr) minmax(335px,.73fr)'},gap:2,pb:2}}>
 <UiBox sx={{display:'flex',flexDirection:'column',gap:1}}>
 <UiSurface variant="outlined" sx={{p:1.5,borderColor:labColors.border,bgcolor:exceeded?'#fff0eb':'#f2f6f8'}}><UiText role="status" sx={{fontWeight:800,color:exceeded?'#9b3825':labColors.ink}}>{exceeded?(buckled?'Buckling limit reached':'Compression limit reached'):'Below theoretical limits'}</UiText><UiText variant="caption">{fmt(load)} kN applied / {fmt(capacity)} kN theoretical limit</UiText></UiSurface>
 <UiSurface variant="outlined" sx={{p:2,bgcolor:'#f5f8fa',borderColor:labColors.border,flex:1}}><UiText sx={{fontWeight:700}}>Column under axial compression</UiText><ColumnView length={length} width={width} thickness={thickness} section={section} buckled={buckled} load={load}/><UiText variant="caption">Drag to rotate · Scroll to zoom · Buckling shape is illustrative, not calculated deflection.</UiText></UiSurface>
 </UiBox>
 <UiSurface variant="outlined" sx={{p:2,borderColor:labColors.border,display:'flex',flexDirection:'column',gap:1}}>
 <TextField select size="small" label="Material" value={material} onChange={v=>setMaterial(v.target.value as Material)}>{Object.keys(materials).map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField>
 <TextField select size="small" label="Cross-section" value={section} onChange={v=>setSection(v.target.value as Section)}>{(['square','hollow square','circle','hollow circle'] as Section[]).map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField>
 <LabSlider compact label="Length" value={length} min={1} max={10} step={.25} unit="m" onChange={setLength}/>
 <LabSlider compact label={circular?'Diameter':'Width'} value={width} min={20} max={500} step={5} unit="mm" onChange={v=>{setWidth(v);setThickness(Math.min(thickness,Math.floor(v/2)-1))}}/>
 {section.startsWith('hollow')&&<LabSlider compact label="Wall thickness" value={thickness} min={1} max={Math.floor(width/2)-1} unit="mm" onChange={setThickness}/>}
 <LabSlider compact label="Applied load" value={load} min={0} max={1000} step={1} unit="kN" onChange={setLoad}/>
 <UiBox sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,bgcolor:'#f2f6f8',p:1.5}}>
 { [['Euler buckling load',fmt(critical)+' kN'],['Compression limit',fmt(compression)+' kN'],['Compressive stress',fmt(stress)+' MPa'],['Elastic modulus',e+' GPa']].map(([label,value])=><UiBox key={label}><UiText variant="caption">{label}</UiText><UiText sx={{fontWeight:800}}>{value}</UiText></UiBox>)}
 </UiBox>
 <UiButton size="small" onClick={()=>{setMaterial('Steel');setSection('hollow square');setLength(5);setWidth(60);setThickness(10);setLoad(200)}}>Load Dartmouth example</UiButton>
 <UiButton size="small" onClick={()=>setLoad(0)}>Remove load</UiButton>
 <LabDetails title="Calculations"><UiText variant="body2">Area A = {area.toExponential(3)} m²<br/>Moment of inertia I = {inertia.toExponential(3)} m⁴<br/>Stress = P/A<br/>Euler load = π²EI/L²<br/>Material stress limit = {s} MPa</UiText></LabDetails>
 <UiText variant="caption" sx={{color:labColors.muted}}>Educational idealization: pinned ends, concentric static load, no local buckling or design safety factors. Not for real structural design. Material values adapted from Dartmouth's The Engineering of Structures Around Us (CC BY-NC-SA 4.0).</UiText>
 </UiSurface></UiBox>
}
