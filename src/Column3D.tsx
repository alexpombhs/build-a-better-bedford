import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export type ColumnMaterial = 'Plastic' | 'Glass' | 'Steel' | 'Wood' | 'Copper' | 'Concrete' | 'Granite / Stone'
export type ColumnSection = 'square' | 'hollow-square' | 'pipe' | 'hollow-pipe'
export type ColumnFailure = 'buckling' | 'compression' | null

type Props = {
  material: ColumnMaterial
  section: ColumnSection
  width: number
  length: number
  failure: ColumnFailure
  load: number
  loadApplied: boolean
}

function makeSurfaceTexture(material: ColumnMaterial): THREE.CanvasTexture | null {
  if (!['Wood', 'Concrete', 'Granite / Stone'].includes(material)) return null
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  // Deterministic pseudo-randomness keeps textures stable when controls change.
  let seed = 41
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  if (material === 'Wood') {
    ctx.fillStyle = '#bc8658';ctx.fillRect(0,0,256,512)
    for (let i=0;i<95;i++) {
      const x=rand()*256
      const phase=rand()*Math.PI*2
      ctx.strokeStyle=i%3===0?'rgba(84,46,25,.20)':'rgba(245,209,159,.25)'
      ctx.lineWidth=.6+rand()*2.4
      ctx.beginPath()
      for(let y=0;y<=512;y+=9) {
        const px=x+Math.sin(y/28+phase)*2.4+Math.sin(y/75+phase)*5
        if(y===0)ctx.moveTo(px,y); else ctx.lineTo(px,y)
      }
      ctx.stroke()
    }
  } else {
    const stone=material === 'Granite / Stone'
    ctx.fillStyle=stone?'#717d87':'#929da6';ctx.fillRect(0,0,256,512)
    for(let i=0;i<(stone?5200:2900);i++) {
      const v=rand()
      ctx.fillStyle=stone?(v<.34?'rgba(44,54,59,.33)':v<.65?'rgba(235,238,236,.55)':'rgba(122,128,133,.44)')
        :(v<.45?'rgba(94,105,112,.22)':'rgba(250,250,247,.28)')
      const d=.5+rand()*(stone?3.4:2)
      ctx.fillRect(rand()*256,rand()*512,d,d)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace=THREE.SRGBColorSpace
  texture.wrapS=THREE.RepeatWrapping
  texture.wrapT=THREE.RepeatWrapping
  texture.repeat.set(1,1.25)
  texture.anisotropy=4
  return texture
}

function createFinish(name: ColumnMaterial, texture: THREE.CanvasTexture | null) {
  const settings: Record<ColumnMaterial, THREE.MeshPhysicalMaterialParameters> = {
    Steel: {color:'#8696a6',metalness:.45,roughness:.37,clearcoat:.16},
    Copper: {color:'#ae6846',metalness:.45,roughness:.38,clearcoat:.18},
    Glass: {color:'#70a8c3',metalness:0,roughness:.17,transparent:true,opacity:.83,
      transmission:.08,thickness:.28,ior:1.45,depthWrite:false,side:THREE.DoubleSide},
    Wood: {color:'#fff4e4',map:texture,metalness:0,roughness:.82},
    Concrete: {color:'#fff',map:texture,metalness:0,roughness:.95},
    'Granite / Stone': {color:'#fff',map:texture,metalness:.04,roughness:.69},
    Plastic: {color:'#43858e',metalness:0,roughness:.34,clearcoat:.3},
  }
  return new THREE.MeshPhysicalMaterial({...settings[name],side:THREE.DoubleSide})
}

// Sweep a proper square or circular cross-section along a slightly curved
// centerline. The inside wall and open annular ends are true geometry.
function buildColumn(section: ColumnSection, width: number, length: number, startFraction=0, endFraction=1) {
  const circular=section.includes('pipe')
  const hollow=section.startsWith('hollow')
  const count=circular?48:4
  const steps=64
  const height=3
  const diameter=Math.max(.105,Math.min(1.05,width/length*height))
  const outer=diameter/2
  const inner=hollow?outer*(2/3):0
  const vertices:number[]=[],uvs:number[]=[],indexes:number[]=[]
  const ringCount=hollow?2:1
  const positionsPerRing=count*ringCount
  const sectionPoint=(i:number,r:number):[number,number]=>{
    if(circular){const a=2*Math.PI*i/count;return [r*Math.cos(a),r*Math.sin(a)]}
    const square:[number,number][]=[[-r,-r],[r,-r],[r,r],[-r,r]]
    return square[i]
  }
  // Store local x/y/z and fraction along the column, for animated bending.
  const origin:number[]=[], along:number[]=[]
  for(let k=0;k<=steps;k++){
    const u=startFraction+(endFraction-startFraction)*k/steps
    for(let wall=0;wall<ringCount;wall++){
      const r=wall===0?outer:inner
      for(let i=0;i<count;i++){
        const [x,z]=sectionPoint(i,r)
        origin.push(x,height*u,z)
        along.push(u)
        vertices.push(x,height*u,z)
        uvs.push(i/count,u*2)
      }
    }
  }
  const vi=(k:number,w:number,i:number)=>k*positionsPerRing+w*count+(i+count)%count
  for(let k=0;k<steps;k++)for(let wall=0;wall<ringCount;wall++)for(let i=0;i<count;i++){
    const a=vi(k,wall,i),b=vi(k,wall,i+1),c=vi(k+1,wall,i),d=vi(k+1,wall,i+1)
    if(wall===0)indexes.push(a,c,b,b,c,d)
    else indexes.push(a,b,c,b,d,c)
  }
  for(const k of [0,steps]){
    if(hollow){
      for(let i=0;i<count;i++){
        const a=vi(k,0,i),b=vi(k,0,i+1),c=vi(k,1,i),d=vi(k,1,i+1)
        if(k===steps)indexes.push(a,b,c,b,d,c);else indexes.push(a,c,b,b,c,d)
      }
    }else{
      const center=vertices.length/3
      const u=k===0?startFraction:endFraction
      origin.push(0,height*u,0)
      along.push(u)
      vertices.push(0,height*u,0)
      uvs.push(.5,k===steps?1:0)
      for(let i=0;i<count;i++){
        if(k===steps)indexes.push(center,vi(k,0,i),vi(k,0,i+1))
        else indexes.push(center,vi(k,0,i+1),vi(k,0,i))
      }
    }
  }
  const geometry=new THREE.BufferGeometry()
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3))
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2))
  geometry.setIndex(indexes)
  geometry.computeVertexNormals()
  // Flat shading gives the square sharp, straight corners.
  return {geometry,origin,along,diameter}
}

export default function Column3D({material,section,width,length,failure,load,loadApplied}:Props) {
  const host=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const el=host.current
    if(!el) return
    let renderer:THREE.WebGLRenderer
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true})}
    catch {return}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2))
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=1.06
    renderer.shadowMap.enabled=true
    renderer.shadowMap.type=THREE.PCFSoftShadowMap
    // The canvas drawing-buffer dimensions must not become its CSS size.
    // Otherwise an unconstrained flex item can position the entire WebGL
    // viewport beyond the clipped panel on some browser/display combinations.
    renderer.domElement.style.display='block'
    renderer.domElement.style.width='100%'
    renderer.domElement.style.height='100%'
    renderer.domElement.style.maxWidth='100%'
    renderer.domElement.style.position='absolute'
    renderer.domElement.style.inset='0'
    renderer.domElement.style.boxSizing='border-box'
    el.appendChild(renderer.domElement)

    const scene=new THREE.Scene()
    // Orthographic framing keeps the complete 3 m illustration in view
    // regardless of the container aspect ratio or the monitor's DPI.
    const camera=new THREE.OrthographicCamera(-3,3,3,-3,.05,75)
    camera.position.set(4.25,3.4,6.7)
    const controls=new OrbitControls(camera,renderer.domElement)
    controls.target.set(0,1.65,0)
    controls.enablePan=false
    controls.minZoom=.65
    controls.maxZoom=2.8
    controls.maxPolarAngle=Math.PI*.85
    controls.enableDamping=true
    controls.dampingFactor=.08
    controls.update()

    scene.add(new THREE.HemisphereLight('#edf6ff','#75818c',1.65))
    const key=new THREE.DirectionalLight('#ffffff',2.25)
    key.position.set(3.5,7,5)
    key.castShadow=true
    key.shadow.mapSize.set(1024,1024)
    key.shadow.camera.left=-5;key.shadow.camera.right=5
    key.shadow.camera.top=7;key.shadow.camera.bottom=-5
    key.shadow.bias=-.0001
    scene.add(key)
    const fill=new THREE.DirectionalLight('#a8d3ed',.7);fill.position.set(-5,3,1);scene.add(fill)
    const rim=new THREE.DirectionalLight('#ffffff',1.05);rim.position.set(2,4,-5);scene.add(rim)

    const floor=new THREE.Mesh(new THREE.CircleGeometry(2.9,64),
      new THREE.MeshStandardMaterial({color:'#e9eef1',roughness:1,transparent:true,opacity:.42}))
    floor.rotation.x=-Math.PI/2;floor.position.y=-.045;floor.receiveShadow=true;scene.add(floor)
    const grid=new THREE.GridHelper(5,10,'#c3d0d7','#d9e1e5')
    grid.position.y=-.035
    // Small floor grid gives scale without overwhelming the specimen.
    const gridMaterials=Array.isArray(grid.material)?grid.material:[grid.material]
    gridMaterials.forEach(m=>{m.transparent=true;m.opacity=.20})
    scene.add(grid)

    const texture=makeSurfaceTexture(material)
    const finish=createFinish(material,texture)
    if(!section.includes('pipe'))finish.flatShading=true
    const {geometry,origin,along,diameter}=buildColumn(section,width,length)
    const column=new THREE.Mesh(geometry,finish)
    column.castShadow=true
    column.receiveShadow=true
    scene.add(column)

    // The force vector follows the same axial load represented in the control
    // panel, with its tip just above the column's top surface (y = 3 m).
    // It is not a force application point inside the member.
    if(load>0){
      const downward=new THREE.ArrowHelper(
        new THREE.Vector3(0,-1,0),
        new THREE.Vector3(0,3.88,0),
        .73,0xa84c2e,.19,.13,
      )
      downward.line.material.depthTest=false
      downward.cone.material.depthTest=false
      downward.renderOrder=10
      scene.add(downward)
    }

    // Wood and glass can lose continuity following a limiting event.
    // Model two independently moving sections, not a whole-column rubber bend.
    // The fracture plane and motion are illustrative, never predicted.
    const splitting=(material==='Wood'||material==='Glass') && failure!==null
    const breakHeight=1.48
    const lowerGroup=new THREE.Group()
    const upperGroup=new THREE.Group()
    if(splitting){
      const lowerGeometry=buildColumn(section,width,length,0,breakHeight/3).geometry
      const upperGeometry=buildColumn(section,width,length,breakHeight/3,1).geometry
      const lower=new THREE.Mesh(lowerGeometry,finish)
      const upper=new THREE.Mesh(upperGeometry,finish)
      lower.castShadow=true;upper.castShadow=true
      lower.receiveShadow=true;upper.receiveShadow=true
      lowerGroup.add(lower)
      upper.position.y=-breakHeight
      upperGroup.position.y=breakHeight
      upperGroup.add(upper)
      lowerGroup.visible=false;upperGroup.visible=false
      scene.add(lowerGroup,upperGroup)
    }

    const failureBend=failure==='buckling' && !splitting
    const brittle=material==='Glass'||material==='Concrete'||material==='Granite / Stone'
    const bend=failureBend?(brittle?.12:material==='Wood'?.32:.55):0
    const position=geometry.getAttribute('position') as THREE.BufferAttribute
    const start=performance.now()
    const updateBend=(factor:number)=>{
      const strength=bend*factor
      for(let i=0;i<along.length;i++){
        const u=along[i]
        // A smooth pinned-end shape. Sections are oriented approximately
        // perpendicular to the centerline (Euler mode approximation).
        const slope=strength*Math.PI*Math.cos(Math.PI*u)/3
        const normal=1/Math.sqrt(1+slope*slope)
        const j=i*3
        position.array[j]=strength*Math.sin(Math.PI*u)+origin[j]*normal
        position.array[j+1]=origin[j+1]-origin[j]*slope*normal
        position.array[j+2]=origin[j+2]
      }
      position.needsUpdate=true
      geometry.computeVertexNormals()
    }

    if(failureBend){
      const dashed=new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0,.05,0),new THREE.Vector3(0,3,0),
      ]),new THREE.LineDashedMaterial({color:'#859ba9',dashSize:.13,gapSize:.09,transparent:true,opacity:.7}))
      dashed.computeLineDistances()
      scene.add(dashed)
    }

    // Material-specific, intentionally qualitative surface crack marks.
    if(failure && brittle && !splitting){
      const crackPoints=[
        [-.28,1.3],[.08,1.4],[-.1,1.54],[.24,1.66],[-.16,1.81],
      ].map(([x,y])=>new THREE.Vector3(x*diameter, y,diameter*.51))
      const crack=new THREE.Line(new THREE.BufferGeometry().setFromPoints(crackPoints),
        new THREE.LineBasicMaterial({color:material==='Glass'?'#3f7396':'#55504a'}))
      scene.add(crack)
    }

    // Animated, non-explosive material failure cue: small surface fragments
    // and a brief dust puff, rather than a flat comic-book overlay.
    // This is intentionally illustrative, not an impact/fracture solver.
    const compressionFailure=failure==='compression' || splitting
    const brittleFragments=brittle || material==='Wood'
    const particles: { mesh:THREE.Mesh; velocity:THREE.Vector3; spin:THREE.Vector3; dust:boolean; startY:number }[]=[]
    if(compressionFailure){
      const chipCount=splitting ? (material==='Glass'?62:42) : brittleFragments?30:12
      const dustCount=splitting ? 34 : brittleFragments?20:9
      const chipColor=material==='Glass'?'#a6dce9'
        :material==='Concrete'?'#b4b7b9'
        :material==='Granite / Stone'?'#828c96'
        :material==='Wood'?'#bd8756'
        :material==='Copper'?'#c58a64'
        :material==='Steel'?'#aebfca':'#7db3b6'
      let seed=73
      const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
      const baseChipGeometry=new THREE.TetrahedronGeometry(1,0)
      const chipMaterial=new THREE.MeshStandardMaterial({
        color:chipColor, metalness:(material==='Steel'||material==='Copper') ? .55 : 0,roughness:.7,
        transparent:material==='Glass',opacity:material==='Glass' ? .72 : 1,side:THREE.DoubleSide,
      })
      const dustGeometry=new THREE.SphereGeometry(1,8,6)
      const dustMaterial=new THREE.MeshBasicMaterial({
        color:material==='Wood'?'#bda084':material==='Glass'?'#c3edf6':'#a9afb2',
        transparent:true,opacity:.27,depthWrite:false,
      })
      for(let i=0;i<chipCount+dustCount;i++){
        const dust=i>=chipCount
        const mesh=new THREE.Mesh(dust?dustGeometry:baseChipGeometry,dust?dustMaterial:chipMaterial)
        const angle=rand()*Math.PI*2
        const radius=(dust ? .14 : .07)+rand()*.13
        const startY=1.35+rand()*.32
        mesh.position.set(Math.cos(angle)*radius,startY,Math.sin(angle)*radius)
        const size=(dust ? .065 : .025)+(dust ? rand()*.09 : rand()*.052)
        mesh.scale.set(size*(.65+rand()),size*(.6+rand()),size*(.65+rand()))
        mesh.visible=false
        scene.add(mesh)
        particles.push({
          mesh, dust,startY,
          velocity:new THREE.Vector3(Math.cos(angle)*(.9+rand()*1.2),(dust ? .2 : .7)+rand()*(dust ? .55 : 1.1),Math.sin(angle)*(.9+rand()*1.2)),
          spin:new THREE.Vector3(rand()*5-2.5,rand()*6-3,rand()*5-2.5),
        })
      }
    }

    const resize=()=>{
      // Measure the containing view, not the WebGL canvas: a canvas has an
      // intrinsic 300x150 size and can otherwise feed its own size back into
      // responsive layout calculations.
      const rect=el.getBoundingClientRect()
      const w=Math.max(1,Math.round(rect.width))
      const h=Math.max(1,Math.round(rect.height))
      renderer.setSize(w,h,false)
      // Force CSS size after every drawing-buffer resize; device pixel ratio
      // must affect only buffer resolution, never the physical canvas box.
      const canvas=renderer.domElement
      canvas.style.width=w+'px'
      canvas.style.height=h+'px'
      canvas.style.maxWidth='100%'
      canvas.style.maxHeight='100%'
      const halfHeight=2.42
      const aspect=w/h
      camera.left=-halfHeight*aspect
      camera.right=halfHeight*aspect
      camera.top=halfHeight
      camera.bottom=-halfHeight
      camera.position.set(5.8,3.8,9.4)
      camera.lookAt(controls.target)
      camera.updateProjectionMatrix()
      controls.update()
    }
    const observer=new ResizeObserver(resize)
    observer.observe(el)
    resize()
    let frame=0
    const render=(now:number)=>{
      const elapsed=Math.max(0,(now-start)/1000)
      if(failureBend && elapsed<=.8){
        const progress=Math.min(1,elapsed/.8)
        updateBend(1-Math.pow(1-progress,3))
      }
      if(splitting){
        // Short anticipation, then an obvious separation and tipping section.
        const p=Math.min(1,Math.max(0,(elapsed-.16)/.85))
        const ease=1-Math.pow(1-p,3)
        column.visible=elapsed<.16
        lowerGroup.visible=elapsed>=.16
        upperGroup.visible=elapsed>=.16
        upperGroup.rotation.z=-(material==='Glass' ? .84 : .66)*ease
        upperGroup.rotation.x=.13*ease
        upperGroup.position.set(.22*ease,breakHeight-.12*ease,0)
        lowerGroup.rotation.z=.025*ease
      }
      if(compressionFailure){
        // Ductile materials shorten; glass and wood split instead.
        if(!splitting){
          const p=Math.min(1,elapsed/.36)
          column.scale.y=1-.045*(1-Math.pow(1-p,3))
        }
        for(const particle of particles){
          const t=Math.max(0,elapsed-(splitting ? .18 : .10))
          particle.mesh.visible=t>0 && t<3.4
          if(!particle.mesh.visible)continue
          particle.mesh.position.set(
            particle.velocity.x*t*.5,
            Math.max(particle.dust ? .06 : .035,particle.startY+particle.velocity.y*t-(splitting?1.2:2.3)*t*t),
            particle.velocity.z*t*.5,
          )
          particle.mesh.rotation.set(particle.spin.x*t,particle.spin.y*t,particle.spin.z*t)
          if(particle.dust){
            const expansion=1+Math.min(2,t*1.5)
            particle.mesh.scale.setScalar(.08*expansion)
            ;(particle.mesh.material as THREE.MeshBasicMaterial).opacity=Math.max(0,.25*(1-t/3.4))
          }
        }
      }
      controls.update()
      renderer.render(scene,camera)
      frame=requestAnimationFrame(render)
    }
    frame=requestAnimationFrame(render)
    return ()=>{
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      scene.traverse(obj=>{
        if(obj instanceof THREE.Mesh||obj instanceof THREE.Line||obj instanceof THREE.GridHelper){
          obj.geometry.dispose()
          const materials=Array.isArray(obj.material)?obj.material:[obj.material]
          materials.forEach(m=>m.dispose())
        }
      })
      texture?.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  },[material,section,width,length,failure,load])
  return <div style={{width:'100%',height:'100%',minWidth:0,minHeight:0,maxWidth:'100%',
    position:'relative',display:'block',overflow:'hidden',contain:'layout size paint',touchAction:'none'}}>
    <div aria-live="polite" style={{
      position:'absolute',left:12,top:10,zIndex:2,padding:'5px 8px',
      fontSize:12,fontWeight:700,color:'#8c3d28',pointerEvents:'none',
      background:'rgba(245,248,250,.93)',borderRadius:4,
    }}>
      {load>0 ? `${loadApplied?'Applied':'Selected'} downward force: ${Math.round(load).toLocaleString('en-US')} kN` : 'No axial force selected'}
    </div>
    <div ref={host} role="img"
      aria-label={failure==='buckling'?'3D column bending sideways under the modeled buckling limit':failure==='compression'?'3D column at its compression limit':'3D column before failure'}
      style={{position:'absolute',top:0,right:0,bottom:0,left:0,overflow:'hidden',contain:'strict'}}/>
  </div>
}
