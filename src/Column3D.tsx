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
  loadLimit: number
  replay: number
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
    // Surface transparency is deliberately used instead of glass transmission:
    // it keeps the hollow interior and rear edges legible without a dark,
    // opaque-looking refractive volume against the shared light lab canvas.
    Glass: {color:'#c2e9f2',metalness:0,roughness:.12,transparent:true,opacity:.43,
      transmission:0,thickness:.12,ior:1.45,depthWrite:false,side:THREE.DoubleSide},
    Wood: {color:'#fff4e4',map:texture,metalness:0,roughness:.82},
    Concrete: {color:'#fff',map:texture,metalness:0,roughness:.95},
    'Granite / Stone': {color:'#fff',map:texture,metalness:.04,roughness:.69},
    Plastic: {color:'#43858e',metalness:0,roughness:.34,clearcoat:.3},
  }
  return new THREE.MeshPhysicalMaterial({...settings[name],side:THREE.DoubleSide})
}

// Sweep a proper square or circular cross-section along a slightly curved
// centerline. The inside wall and open annular ends are true geometry.
function buildColumn(
  section: ColumnSection, width: number, length: number,
  startFraction=0, endFraction=1,
  fracture?: {edge:'start'|'end';material:'Wood'|'Glass'|'Concrete'|'Granite / Stone'},
) {
  const circular=section.includes('pipe')
  const hollow=section.startsWith('hollow')
  // Subdivide square faces too. A four-vertex square cannot show a
  // jagged fracture edge between its corners.
  const count=circular?48:24
  const steps=64
  const height=3
  // Preserve the actual width-to-length ratio, including the larger sections.
  const diameter=Math.max(.05,width/length*height)
  const outer=diameter/2
  const inner=hollow?outer*(2/3):0
  const vertices:number[]=[],uvs:number[]=[],indexes:number[]=[]
  const ringCount=hollow?2:1
  const positionsPerRing=count*ringCount
  const sectionPoint=(i:number,r:number):[number,number]=>{
    if(circular){const a=2*Math.PI*i/count;return [r*Math.cos(a),r*Math.sin(a)]}
    const corners:[number,number][]=[[-r,-r],[r,-r],[r,r],[-r,r]]
    const side=Math.floor(i/6)
    const t=(i%6)/6
    const a=corners[side],b=corners[(side+1)%4]
    return [a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t]
  }
  // Store local x/y/z and fraction along the column, for animated bending.
  const origin:number[]=[], along:number[]=[]
  for(let k=0;k<=steps;k++){
    const u=startFraction+(endFraction-startFraction)*k/steps
    for(let wall=0;wall<ringCount;wall++){
      const r=wall===0?outer:inner
      for(let i=0;i<count;i++){
        const [x,z]=sectionPoint(i,r)
        // Matching irregular cut profiles on both sides of the fracture.
        // Variation is schematic, not a simulated fracture propagation.
        const onBreak=fracture &&
          ((fracture.edge==='end'&&k===steps)||(fracture.edge==='start'&&k===0))
        const amplitude=fracture?.material==='Wood'?.125:fracture?.material==='Glass'?.055:.095
        const rough=amplitude*(.56*Math.sin(i*2.37)+.3*Math.cos(i*5.13)+.14*Math.sin(i*8.41))
        const y=height*u+(onBreak?rough:0)
        origin.push(x,y,z)
        along.push(u)
        vertices.push(x,y,z)
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

export default function Column3D({material,section,width,length,failure,load,loadLimit,replay}:Props) {
  const host=useRef<HTMLDivElement>(null)
  // Preserve the user's orbit across scene rebuilds and repeated load tests.
  const view=useRef<{position:THREE.Vector3;target:THREE.Vector3;zoom:number}|null>(null)
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
    if(view.current){
      camera.position.copy(view.current.position)
      controls.target.copy(view.current.target)
      camera.zoom=view.current.zoom
      camera.updateProjectionMatrix()
    }
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

    // A subtle edge silhouette distinguishes transparent glass from the
    // unchanged light background. For solid/unfailed glass the original
    // geometry provides correct top/rim edges with no opaque body fill.
    if(material==='Glass' && failure===null){
      const edges=new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry,24),
        new THREE.LineBasicMaterial({color:'#477d96',transparent:true,opacity:.72,depthTest:false}),
      )
      edges.renderOrder=2
      scene.add(edges)
    }

    // The force vector follows the same axial load represented in the control
    // panel, with its tip just above the column's top surface (y = 3 m).
    // It is not a force application point inside the member.
    if(load>0){
      // WebGL lineWidth is effectively fixed at one pixel. Use a solid
      // cylinder plus cone, so force magnitude actually changes thickness.
      const fraction=Math.min(1.5,Math.max(0,load/Math.max(1,loadLimit)))
      const shaftRadius=.012+.038*fraction
      const headRadius=.060+.040*fraction
      const arrow=new THREE.Group()
      const ink=new THREE.MeshBasicMaterial({color:'#a84c2e',depthTest:false})
      const shaft=new THREE.Mesh(new THREE.CylinderGeometry(shaftRadius,shaftRadius,.62,14),ink)
      shaft.position.y=3.59
      const head=new THREE.Mesh(new THREE.ConeGeometry(headRadius,.25,18),ink)
      head.rotation.z=Math.PI
      head.position.y=3.23
      arrow.add(shaft,head)
      arrow.renderOrder=10
      shaft.renderOrder=10;head.renderOrder=10
      scene.add(arrow)
    }

    // Wood and glass can lose continuity following a limiting event.
    // Model two independently moving sections, not a whole-column rubber bend.
    // The fracture plane and motion are illustrative, never predicted.
    const stoneFracture=(material==='Concrete'||material==='Granite / Stone') && failure!==null
    const splitting=(material==='Wood'||material==='Glass'||stoneFracture) && failure!==null
    const breakHeight=1.48
    const lowerGroup=new THREE.Group()
    const upperGroup=new THREE.Group()
    if(splitting){
      const fractureMaterial=material as 'Glass'|'Wood'|'Concrete'|'Granite / Stone'
      const lowerGeometry=buildColumn(section,width,length,0,breakHeight/3,
        {edge:'end',material:fractureMaterial}).geometry
      const upperGeometry=buildColumn(section,width,length,breakHeight/3,1,
        {edge:'start',material:fractureMaterial}).geometry
      const lower=new THREE.Mesh(lowerGeometry,finish)
      const upper=new THREE.Mesh(upperGeometry,finish)
      lower.castShadow=true;upper.castShadow=true
      lower.receiveShadow=true;upper.receiveShadow=true
      lowerGroup.add(lower)
      upper.position.y=-breakHeight
      upperGroup.position.y=breakHeight
      upperGroup.add(upper)

      if(material==='Glass'){
        // The tube separates across a localized, irregular fracture plane.
        // Keep the two parts nearly straight; the broken edges and crack
        // branches make the brittle failure clear without a ductile elbow.
        const radius=diameter/2
        // Irregular mesh ends replace the former perfectly planar cut ring.
        // Small translucent chips at the crack's edge catch the light.
        const edgeChipMaterial=new THREE.MeshStandardMaterial({
          color:'#9ed2e2',transparent:true,opacity:.73,side:THREE.DoubleSide,roughness:.22,
        })
        for(let i=0;i<12;i++){
          const theta=i*Math.PI*2/12
          const chip=new THREE.Mesh(new THREE.TetrahedronGeometry(.035+(i%3)*.011),edgeChipMaterial)
          chip.position.set(Math.cos(theta)*radius,breakHeight+.036*Math.sin(i*2.37),Math.sin(theta)*radius)
          chip.rotation.set(i*.4,i*.8,i*.3)
          lowerGroup.add(chip)
        }
        // Distinct branching surface cracks follow the outside of the tube.
        const crackMaterial=new THREE.LineBasicMaterial({color:'#427e9d',transparent:true,opacity:.86,depthTest:false})
        const makeCrack=(points:THREE.Vector3[], parent:THREE.Group)=>{
          const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),crackMaterial)
          line.renderOrder=5
          parent.add(line)
        }
        const frontZ=section.includes('pipe')?radius*.90:radius+.004
        makeCrack([
          new THREE.Vector3(-radius*.35,breakHeight-.38,frontZ),
          new THREE.Vector3(-radius*.12,breakHeight-.23,frontZ),
          new THREE.Vector3(-radius*.28,breakHeight-.10,frontZ),
          new THREE.Vector3(radius*.06,breakHeight,frontZ),
        ],lowerGroup)
        makeCrack([
          new THREE.Vector3(radius*.06,breakHeight,frontZ),
          new THREE.Vector3(radius*.26,breakHeight-.14,frontZ),
          new THREE.Vector3(radius*.48,breakHeight-.21,frontZ),
        ],lowerGroup)
        // Upper section is modeled in a group whose origin is the seam, so
        // these points use coordinates relative to that group.
        makeCrack([
          new THREE.Vector3(radius*.17,0,frontZ),
          new THREE.Vector3(-radius*.13,.13,frontZ),
          new THREE.Vector3(radius*.08,.27,frontZ),
          new THREE.Vector3(-radius*.2,.44,frontZ),
        ],upperGroup)
        makeCrack([
          new THREE.Vector3(radius*.08,.27,frontZ),
          new THREE.Vector3(radius*.4,.38,frontZ),
        ],upperGroup)
      }

      if(stoneFracture){
        // Permanent chipped fracture at a localized compression damage zone.
        // Keep the body texture, but interrupt the load path visibly. The
        // chips and break are illustrative, not a fracture calculation.
        const r=diameter/2
        const chipFinish=new THREE.MeshStandardMaterial({
          color:material==='Concrete'?'#87949d':'#647583',
          roughness:1,side:THREE.DoubleSide,
        })
        const darkSeam=new THREE.LineBasicMaterial({color:'#354650',depthTest:false})
        const count=section.includes('pipe')?32:24
        const rim:THREE.Vector3[]=[]
        for(let i=0;i<count;i++){
          const theta=i*2*Math.PI/count
          const radius=r*(.91+.08*Math.sin(i*4.7))
          rim.push(new THREE.Vector3(
            Math.cos(theta)*radius,
            breakHeight + .065*Math.sin(i*2.37)+.024*Math.cos(i*5.3),
            Math.sin(theta)*radius,
          ))
          if(i%2===0){
            const chip=new THREE.Mesh(new THREE.TetrahedronGeometry(
              Math.max(.025,Math.min(.085,diameter*.09))*(.75+.15*(i%3)),0,
            ),chipFinish)
            chip.position.copy(rim[i])
            chip.rotation.set(i*.42,i*.67,i*.23)
            lowerGroup.add(chip)
          }
        }
        const rimLine=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rim),darkSeam)
        rimLine.renderOrder=5
        lowerGroup.add(rimLine)
        // Branches read clearly on solid textured surfaces and stay visible.
        const branch=new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-r*.56,breakHeight-.42,r+.014),
          new THREE.Vector3(-r*.26,breakHeight-.30,r+.014),
          new THREE.Vector3(-r*.43,breakHeight-.17,r+.014),
          new THREE.Vector3(.0,breakHeight-.04,r+.014),
          new THREE.Vector3(r*.32,breakHeight-.19,r+.014),
        ]),darkSeam)
        branch.renderOrder=5
        lowerGroup.add(branch)
      }

      if(material==='Wood'){
        // Tapered splinters bridge the break visually. They follow the same
        // general grain direction but vary in length and angle.
        const r=diameter/2
        const splinterMaterial=new THREE.MeshStandardMaterial({
          color:'#c18b57',roughness:.9,side:THREE.DoubleSide,
        })
        for(let i=0;i<16;i++){
          const angle=i*2*Math.PI/16
          const x=Math.cos(angle)*r*.91
          const z=Math.sin(angle)*r*.91
          const tall=.08+.18*(.5+.5*Math.sin(i*4.31))
          const radius=Math.max(.009,Math.min(.035,diameter*.043))
          const spike=new THREE.Mesh(new THREE.ConeGeometry(radius,tall,3),splinterMaterial)
          spike.position.set(x,breakHeight+tall/2-.01,z)
          spike.rotation.z=.12*Math.sin(i*2.2)
          lowerGroup.add(spike)
          if(i%2===0){
            const hanging=new THREE.Mesh(new THREE.ConeGeometry(radius*.8,tall*.8,3),splinterMaterial)
            hanging.rotation.z=Math.PI+.12*Math.cos(i)
            hanging.position.set(x,tall*.4-.015,z)
            upperGroup.add(hanging)
          }
        }
      }

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
    const ductileCompression=failure==='compression' && (
      material==='Steel'||material==='Copper'||material==='Plastic'
    )
    // Solid specimens can barrel under friction-restrained compression;
    // hollow tubes instead tend to develop local wall folds. These are
    // qualitative post-limit illustrations, not load-displacement predictions.
    const hollowCompression=section.startsWith('hollow')
    const foldCount=section.includes('pipe')?2:1
    // This translucent line follows the local fold, without suggesting
    // a red blister is part of the metal's physical geometry.
    const foldMarker=ductileCompression && hollowCompression
      ? new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            Array.from({length:48},(_,i)=>{
              const theta=i*Math.PI*2/48
              const r=diameter/2*1.07
              return new THREE.Vector3(r*Math.cos(theta),1.48,r*Math.sin(theta))
            }),
          ),
          new THREE.LineBasicMaterial({color:'#b46a42',transparent:true,opacity:0,depthTest:false}),
        )
      : null
    if(foldMarker){foldMarker.renderOrder=4;scene.add(foldMarker)}
    const particles: { mesh:THREE.Mesh; velocity:THREE.Vector3; spin:THREE.Vector3; dust:boolean; startY:number }[]=[]
    if(compressionFailure && !ductileCompression){
      const chipCount=splitting ? (material==='Glass'?42:stoneFracture?26:42) : brittleFragments?30:12
      const dustCount=splitting ? (material==='Glass'?12:stoneFracture?22:34) : brittleFragments?20:9
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
        if(material==='Glass' && !dust){
          // Thin, irregular glass chips catch the light instead of resembling dust.
          mesh.scale.set(size*(.7+rand()),size*(1.4+rand()),size*.24)
        }else mesh.scale.set(size*(.65+rand()),size*(.6+rand()),size*(.65+rand()))
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
      // Fit the entire member at extreme width/length ratios while retaining
      // the user's orbit orientation and zoom. The 3D model is 3 units tall.
      const displayDiameter=Math.max(.05,width/length*3)
      const halfHeight=Math.max(2.42,1.7+displayDiameter*.85)
      const aspect=w/h
      camera.left=-halfHeight*aspect
      camera.right=halfHeight*aspect
      camera.top=halfHeight
      camera.bottom=-halfHeight
      // Never reset camera pose on resize, material changes or load tests.
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
        // Brittle fracture: a short anticipation, a visible crack, then a
        // separated but mostly straight upper member. The motion is a
        // schematic illustration, not a fracture mechanics simulation.
        const glass=material==='Glass'
        const startTime=glass?.26:stoneFracture?.22:.16
        const duration=glass?.72:stoneFracture?.65:.85
        const p=Math.min(1,Math.max(0,(elapsed-startTime)/duration))
        const ease=1-Math.pow(1-p,3)
        column.visible=elapsed<startTime
        lowerGroup.visible=elapsed>=startTime
        upperGroup.visible=elapsed>=startTime
        upperGroup.rotation.z=-(glass ? (failure==='buckling'?.26:.12) : stoneFracture ? .19 : .66)*ease
        upperGroup.rotation.x=(glass?.055:stoneFracture?.045:.13)*ease
        upperGroup.position.set((glass?.14:stoneFracture?.13:.22)*ease,breakHeight-(glass?.07:stoneFracture?.12:.12)*ease,0)
        lowerGroup.rotation.z=(glass?.006:stoneFracture?.012:.025)*ease
      }
      if(compressionFailure){
        // Wood and glass retain their separate fracture animations. Steel,
        // copper and plastic instead show localized swelling under crushing.
        if(ductileCompression){
          const p=Math.min(1,elapsed/1.1)
          const ease=1-Math.pow(1-p,3)
          // A modest shortening illustrates compression. Without a plasticity
          // model, the selected load cannot determine actual axial strain.
          const shortening=(hollowCompression?.095:.12)*ease
          for(let i=0;i<along.length;i++){
            const u=along[i]
            let radial:number
            if(hollowCompression){
              // Thin-walled shell: an outward/inward fold is more useful than
              // the solid-cylinder 'inflated ring' drawn previously.
              const envelope=Math.exp(-Math.pow((u-.49)/.23,2))
              const fold=Math.cos((u-.49)*Math.PI*2*foldCount/.37)
              radial=1+.14*ease*envelope*fold
            }else{
              // Approximate volume conservation of a solid compressible-test
              // specimen, with restrained end faces and a broad mid-barrel.
              const profile=Math.pow(Math.sin(Math.PI*u),1.35)
              radial=1+(.075*ease)*profile
            }
            const j=i*3
            position.array[j]=origin[j]*radial
            position.array[j+1]=origin[j+1]*(1-shortening)
            position.array[j+2]=origin[j+2]*radial
          }
          if(foldMarker){
            const amount=Math.min(1,elapsed/.9)
            ;(foldMarker.material as THREE.LineBasicMaterial).opacity=.55*amount
            foldMarker.position.y=1.48*(1-shortening)
          }
          position.needsUpdate=true
          geometry.computeVertexNormals()
        }else if(!splitting){
          const p=Math.min(1,elapsed/.36)
          column.scale.y=1-.045*(1-Math.pow(1-p,3))
        }
        for(const particle of particles){
          const t=Math.max(0,elapsed-(splitting ? (material==='Glass'?.27:.18) : .10))
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
      // Read the current orbit BEFORE disposing the controller.
      view.current={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom}
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
  },[material,section,width,length,failure,load,loadLimit,replay])
  return <div style={{width:'100%',height:'100%',minWidth:0,minHeight:0,maxWidth:'100%',
    position:'relative',display:'block',overflow:'hidden',contain:'layout size paint',touchAction:'none'}}>
    <div ref={host} role="img"
      aria-label={failure==='buckling'?'3D column bending sideways under the modeled buckling limit':failure==='compression'?'3D column at its compression limit':'3D column before failure'}
      style={{position:'absolute',top:0,right:0,bottom:0,left:0,overflow:'hidden',contain:'strict'}}/>
  </div>
}
