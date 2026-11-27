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
  
  const resize=()=>{const width=el.clientWidth||300,height=el.clientHeight||320;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()}
  const observer=new ResizeObserver(resize);observer.observe(el);resize()
  renderer.setAnimationLoop(()=>renderer.render(scene,camera))
  return ()=>{observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const m=o.material; (Array.isArray(m)?m:[m]).forEach(v=>v.dispose())}});renderer.dispose();renderer.domElement.remove()}
 },[length,width,thickness,section,buckled,load])
 return <UiBox ref={host} sx={{height:390,width:'100%',touchAction:'none'}} role="img" aria-label={buckled?'Illustrative buckled column':'Straight column under axial load'}/>
}

// Calculation is intentionally user-triggered, like the Coursera reference.
// Changing geometry returns the experiment to its uncalculated state.
export default function ColumnSimulator(){
 const [material,setMaterial]=useState<Material>('Steel')
 const [section,setSection]=useState<Section>('square')
 const [length,setLength]=useState(2)
 const [width,setWidth]=useState(250)
 const [thickness,setThickness]=useState(20)
 const [appliedLoad,setAppliedLoad]=useState(200)
 const [calculated,setCalculated]=useState(false)
 const [showLoad,setShowLoad]=useState(false)
 const [showResults,setShowResults]=useState(false)
 const invalidate=()=>{setCalculated(false);setShowResults(false)}
 const changeMaterial=(m:Material)=>{setMaterial(m);invalidate()}
 const changeSection=(s:Section)=>{setSection(s);invalidate()}
 const changeLength=(n:number)=>{setLength(n);invalidate()}
 const changeWidth=(n:number)=>{setWidth(n);setThickness(t=>Math.min(t,Math.floor(n/2)-1));invalidate()}
 const changeThickness=(n:number)=>{setThickness(n);invalidate()}
 const changeLoad=(n:number)=>{setAppliedLoad(n);invalidate()}
 const [e,s]=materials[material]
 const b=width/1000, t=thickness/1000
 const inner=section.startsWith('hollow')?Math.max(0,b-2*t):0
 const circular=section.includes('circle')
 const area=(b*b-inner*inner)*(circular?Math.PI/4:1)
 const inertia=(b**4-inner**4)*(circular?Math.PI/64:1/12)
 const stress=appliedLoad*1000/area/1e6
 const critical=Math.PI**2*e*1e9*inertia/length**2/1000
 const compression=s*1e6*area/1000
 const capacity=Math.min(critical,compression)
 const failure=appliedLoad>capacity
 const buckled=failure&&critical<=compression
 const fmt=(v:number)=>v.toLocaleString(undefined,{maximumFractionDigits:2})
 const selectSx={minWidth:0,'& .MuiOutlinedInput-root':{bgcolor:'#fff'}}
 return <UiBox sx={{pb:2}}>
  <UiSurface variant="outlined" sx={{borderColor:labColors.border,p:{xs:2,md:2.5},mb:1.5}}>
   <UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},columnGap:3,rowGap:2.5}}>
    <UiBox sx={{display:'flex',flexDirection:'column',gap:1.75,minWidth:0}}>
     <TextField select fullWidth label="Material" size="small" value={material} onChange={v=>changeMaterial(v.target.value as Material)} sx={selectSx}>{Object.keys(materials).map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField>
     <UiText sx={{fontSize:12.5,color:labColors.muted}}>Modulus of elasticity: {e} GPa · Material strength: {s} MPa</UiText>
     <LabSlider label={circular?'Outer diameter':'Outer width'} value={width} min={20} max={500} step={5} unit="mm" onChange={changeWidth}/>
     {section.startsWith('hollow')&&<LabSlider label="Wall thickness" value={thickness} min={1} max={Math.floor(width/2)-1} unit="mm" onChange={changeThickness}/>}
    </UiBox>
    <UiBox sx={{display:'flex',flexDirection:'column',gap:1.75,minWidth:0}}>
     <TextField select fullWidth size="small" label="Cross-section" value={section} onChange={v=>changeSection(v.target.value as Section)} sx={selectSx}>
       <MenuItem value="square">Square</MenuItem><MenuItem value="hollow square">Hollow square</MenuItem><MenuItem value="circle">Circle</MenuItem><MenuItem value="hollow circle">Hollow circle</MenuItem>
     </TextField>
     <UiText sx={{fontSize:12.5,color:labColors.muted}}>Choose the column geometry and its height.</UiText>
     <LabSlider label="Column length" value={length} min={1} max={10} step={0.25} unit="m" onChange={changeLength}/>
    </UiBox>
   </UiBox>
  </UiSurface>
  <UiSurface variant="outlined" sx={{borderColor:labColors.border,p:{xs:1.5,md:2},minHeight:490}}>
   <UiBox sx={{display:'flex',alignItems:{xs:'stretch',sm:'center'},justifyContent:'space-between',gap:1.5,flexDirection:{xs:'column',sm:'row'},mb:1}}>
    <UiButton variant="contained" size="medium" onClick={()=>{setCalculated(true);setShowResults(true)}} sx={{textTransform:'none',bgcolor:labColors.accent,fontWeight:700,minWidth:210,'&:hover':{bgcolor:labColors.ink}}}>Calculate load</UiButton>
    <UiButton variant="text" size="small" onClick={()=>{setMaterial('Steel');setSection('square');setLength(2);setWidth(250);setThickness(20);setAppliedLoad(200);setShowLoad(false);invalidate()}} sx={{color:labColors.accent,textTransform:'none'}}>Reset experiment</UiButton>
   </UiBox>
   <UiBox sx={{position:'relative',minHeight:390,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <UiBox sx={{width:'100%',maxWidth:850}}>
     <ColumnView length={length} width={width} thickness={thickness} section={section} buckled={calculated&&showLoad&&buckled} load={0}/>
    </UiBox>
    <UiBox sx={{position:'absolute',bottom:8,left:8,color:labColors.muted,fontSize:12,pointerEvents:'none'}}>Drag to rotate · Scroll to zoom</UiBox>
   </UiBox>
   {calculated&&showResults&&<UiBox role="status" sx={{borderTop:'1px solid '+labColors.border,pt:2,mt:1}}>
    <UiText sx={{fontSize:15,fontWeight:800,color:labColors.ink,mb:1}}>Calculated column capacity</UiText>
    <UiBox sx={{display:'grid',gridTemplateColumns:{xs:'1fr 1fr',md:'repeat(3,1fr)'},gap:2,mb:1.5}}>
     {([['Maximum theoretical load',fmt(capacity)+' kN'],['Buckling limit',fmt(critical)+' kN'],['Compression limit',fmt(compression)+' kN']] as const).map(([label,value])=><UiBox key={label}><UiText sx={{fontSize:12,color:labColors.muted}}>{label}</UiText><UiText sx={{fontSize:18,fontWeight:800}}>{value}</UiText></UiBox>)}
    </UiBox>
    <UiText sx={{fontSize:13,color:labColors.muted,mb:1}}>The lower of the Euler buckling load and material compression limit governs this idealized model.</UiText>
    <UiButton size="small" variant="outlined" onClick={()=>setShowLoad(v=>!v)} sx={{textTransform:'none',mr:1}}>{showLoad?'Hide load comparison':'Compare with applied load'}</UiButton>
    {showLoad&&<UiBox sx={{mt:1.25,p:1.5,bgcolor:failure?'#fff0eb':'#f2f6f8',borderRadius:'var(--bbb-card-radius, 4px)'}}>
      <LabSlider label="Applied load" value={appliedLoad} min={0} max={1000} unit="kN" onChange={v=>{setAppliedLoad(v)}}/>
      <UiText sx={{fontSize:13,fontWeight:700,color:failure?'#9b3825':labColors.ink}}>{failure?(buckled?'Buckling limit exceeded':'Compression limit exceeded'):'Applied load is below both theoretical limits'}</UiText>
      <UiText sx={{fontSize:12,color:labColors.muted}}>Compressive stress: {fmt(stress)} MPa</UiText>
    </UiBox>}
    <LabDetails title="Section calculations"><UiText sx={{fontSize:13}}>Area A = {area.toExponential(3)} m² · Moment of inertia I = {inertia.toExponential(3)} m⁴ · Euler load = π²EI/L² · Compression limit = σA</UiText></LabDetails>
   </UiBox>}
   <UiText variant="caption" sx={{display:'block',mt:1.5,color:labColors.muted,fontSize:11}}>Idealized pinned-end static analysis, not a structural design tool. Buckling deformation is illustrative; local buckling and safety factors are not modeled. Properties adapted from Dartmouth's The Engineering of Structures Around Us (CC BY-NC-SA 4.0).</UiText>
  </UiSurface>
 </UiBox>
}
