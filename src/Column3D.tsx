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
    ctx.fillStyle=stone?'#8e969b':'#b8bec1';ctx.fillRect(0,0,256,512)
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
    Steel: {color:'#b2bec8',metalness:.72,roughness:.26,clearcoat:.2},
    Copper: {color:'#c9875d',metalness:.69,roughness:.3,clearcoat:.24},
    Glass: {color:'#c6ecf5',metalness:0,roughness:.09,transparent:true,opacity:.64,
      transmission:.35,thickness:.28,ior:1.45,depthWrite:false,side:THREE.DoubleSide},
    Wood: {color:'#fff4e4',map:texture,metalness:0,roughness:.82},
    Concrete: {color:'#fff',map:texture,metalness:0,roughness:.95},
    'Granite / Stone': {color:'#fff',map:texture,metalness:.04,roughness:.69},
    Plastic: {color:'#77acb2',metalness:0,roughness:.29,clearcoat:.34},
  }
  return new THREE.MeshPhysicalMaterial({...settings[name],side:THREE.DoubleSide})
}

// Sweep a proper square or circular cross-section along a slightly curved
// centerline. The inside wall and open annular ends are true geometry.
function buildColumn(section: ColumnSection, width: number, length: number) {
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
    const u=k/steps
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
      origin.push(0,height*k/steps,0)
      along.push(k/steps)
      vertices.push(0,height*k/steps,0)
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

export default function Column3D({material,section,width,length,failure}:Props) {
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
    renderer.toneMappingExposure=1.45
    renderer.shadowMap.enabled=true
    renderer.shadowMap.type=THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)

    const scene=new THREE.Scene()
    const camera=new THREE.PerspectiveCamera(34,1,.05,75)
    camera.position.set(4.25,3.4,6.7)
    const controls=new OrbitControls(camera,renderer.domElement)
    controls.target.set(0,1.5,0)
    controls.enablePan=false
    controls.minDistance=4.8
    controls.maxDistance=17
    controls.maxPolarAngle=Math.PI*.85
    controls.enableDamping=true
    controls.dampingFactor=.08
    controls.update()

    scene.add(new THREE.HemisphereLight('#edf6ff','#9a9b99',2.6))
    const key=new THREE.DirectionalLight('#ffffff',3.4)
    key.position.set(3.5,7,5)
    key.castShadow=true
    key.shadow.mapSize.set(1024,1024)
    key.shadow.camera.left=-5;key.shadow.camera.right=5
    key.shadow.camera.top=7;key.shadow.camera.bottom=-5
    key.shadow.bias=-.0001
    scene.add(key)
    const fill=new THREE.DirectionalLight('#a8d3ed',1.6);fill.position.set(-5,3,1);scene.add(fill)
    const rim=new THREE.DirectionalLight('#ffffff',2.1);rim.position.set(2,4,-5);scene.add(rim)

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

    const failureBend=failure==='buckling'
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
    if(failure && brittle){
      const crackPoints=[
        [-.28,1.3],[.08,1.4],[-.1,1.54],[.24,1.66],[-.16,1.81],
      ].map(([x,y])=>new THREE.Vector3(x*diameter, y,diameter*.51))
      const crack=new THREE.Line(new THREE.BufferGeometry().setFromPoints(crackPoints),
        new THREE.LineBasicMaterial({color:material==='Glass'?'#3f7396':'#55504a'}))
      scene.add(crack)
    }

    const resize=()=>{
      const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight)
      renderer.setSize(w,h,false)
      camera.aspect=w/h
      camera.updateProjectionMatrix()
    }
    const observer=new ResizeObserver(resize)
    observer.observe(el)
    resize()
    let frame=0
    const render=(now:number)=>{
      if(failureBend && now-start<=800){
        const progress=Math.min(1,(now-start)/800)
        updateBend(1-Math.pow(1-progress,3))
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
  },[material,section,width,length,failure])
  return <div style={{height:'100%',width:'100%',minHeight:0,position:'relative',touchAction:'none'}}>
    <div ref={host} role="img"
      aria-label={failure==='buckling'?'3D column bending sideways under the modeled buckling limit':failure==='compression'?'3D column at its compression limit':'3D column before failure'}
      style={{height:'100%',width:'100%'}}/>
    {failure==='compression' && <svg aria-hidden="true" viewBox="0 0 100 100"
      style={{position:'absolute',left:'52%',top:'44%',width:92,height:92,transform:'translate(-50%,-50%)',pointerEvents:'none'}}>
      <polygon points={Array.from({length:20},(_,i)=>{
        const a=i*Math.PI/10-Math.PI/2,r=i%2===0?49:25
        return `${50+Math.cos(a)*r},${50+Math.sin(a)*r}`
      }).join(' ')} fill="#f6da51" stroke="#99552c" strokeWidth="1.8"/>
      <text x="50" y="55" textAnchor="middle" fontSize="15" fontWeight="900" fill="#573e2c">BOOM!</text>
    </svg>}
  </div>
}
