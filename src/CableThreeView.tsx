import { useEffect, useRef } from 'react'
import { UiBox, UiButton, UiText } from './components/atoms/MuiPrimitives'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { illustrateCableBreak } from './lab/funicularPhysics'
import type { CableLoad, CableSolution } from './lab/funicularPhysics'

type Props = {
  solution: CableSolution
  loads: CableLoad[]
  span: number
  pixelsPerMeter: number
  brokenSegment?: number
}

/** Three.js is the visualization layer; all force and sag calculations come
 * from the same funicularPhysics solver used by the SVG simulator. */
export default function CableThreeView({ solution, loads, span, pixelsPerMeter, brokenSegment }: Props) {
  const mount = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const geometryRef = useRef<THREE.Group | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const homeHalfHeight = useRef(5.5)
  const homeTarget = useRef(-1.7)
  const initialFrameSet = useRef(false)
  const manuallyAdjusted = useRef(false)
  const visualYScale = Math.min(14, 88 / Math.max(1, solution.sag)) / pixelsPerMeter
  // Supports are rigid. Camera framing depends on the fixed span and viewport,
  // never on force-dependent sag or weight dimensions.
  const currentSpan = useRef(span)
  currentSpan.current = span
  const framedSpan = useRef(span)
  const zoom = (factor: number) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    manuallyAdjusted.current = true
    // Orthographic zoom changes apparent size without introducing perspective.
    camera.zoom = THREE.MathUtils.clamp(camera.zoom / factor, .4, 4)
    camera.updateProjectionMatrix()
    controls.update()
  }
  const panVertically = (direction: number) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    manuallyAdjusted.current = true
    // Translate camera and target together without moving model geometry.
    const delta = direction * Math.max(.35, camera.position.distanceTo(controls.target) * .055)
    camera.position.y += delta
    controls.target.y += delta
    controls.update()
  }
  const resetView = () => {
    manuallyAdjusted.current = false
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    camera.position.set(0, homeTarget.current, 25)
    controls.target.set(0, homeTarget.current, 0)
    camera.zoom = 1
    camera.updateProjectionMatrix()
    controls.update()
  }

  useEffect(() => {
    const element = mount.current
    if (!element) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f5f8fa')
    sceneRef.current = scene
    // Orthographic projection preserves the same X/Y drawing proportions as
    // the 2D SVG in a front-facing view, even when the model has real depth.
    const camera = new THREE.OrthographicCamera(-8,8,5,-5,.1,300)
    camera.position.set(0, homeTarget.current, 25)
    cameraRef.current = camera
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    element.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    const ambient = new THREE.AmbientLight(0xffffff, 2)
    scene.add(ambient)
    const light = new THREE.DirectionalLight(0xffffff, 2.5)
    light.position.set(-5, 9, 12)
    scene.add(light)
    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.enableDamping = true
    controls.enableZoom = true
    controls.zoomSpeed = 0.95
    controls.enablePan = true
    controls.screenSpacePanning = true
    controls.minDistance = 6
    controls.maxDistance = 55
    controls.maxPolarAngle = Math.PI * 0.8
    const markAdjusted = () => { manuallyAdjusted.current = true }
    controls.addEventListener('start',markAdjusted)
    controls.target.set(0, homeTarget.current, 0)
    controls.update()
    const resize = () => {
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height) return
      const aspect=width/height
      renderer.setSize(width, height, false)
      // Stable structural reference: the camera must not track cable sag or
      // changing load-box heights. This leaves the beam and support pins
      // stationary on screen while the cable and suspended weights move.
      homeHalfHeight.current=Math.max(5.1,
        (currentSpan.current+2.2)/(2*aspect*.89))
      homeTarget.current=-2.2
      camera.left=-homeHalfHeight.current*aspect
      camera.right=homeHalfHeight.current*aspect
      camera.top=homeHalfHeight.current
      camera.bottom=-homeHalfHeight.current
      camera.updateProjectionMatrix()
      if(!initialFrameSet.current){
        camera.position.set(0,homeTarget.current,25)
        controls.target.set(0,homeTarget.current,0)
        controls.update()
      }
      initialFrameSet.current=true
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.removeEventListener('start',markAdjusted)
      controls.dispose()
      controlsRef.current = null
      cameraRef.current = null
      if (geometryRef.current) {
        scene.remove(geometryRef.current)
        geometryRef.current.traverse(object => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
            if (object instanceof THREE.Mesh || object instanceof THREE.Line) object.geometry.dispose()
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            materials.forEach(material => {
              if ((material instanceof THREE.SpriteMaterial || material instanceof THREE.MeshBasicMaterial) && material.map) material.map.dispose()
              material.dispose()
            })
          }
        })
        geometryRef.current = null
      }
      renderer.dispose()
      renderer.domElement.remove()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const previous = geometryRef.current
    if (previous) {
      scene.remove(previous)
      previous.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => {
            if ((material instanceof THREE.SpriteMaterial || material instanceof THREE.MeshBasicMaterial) && material.map) material.map.dispose()
            material.dispose()
          })
        }
      })
    }
    const group = new THREE.Group()
    geometryRef.current = group
    scene.add(group)
    const blue = new THREE.MeshStandardMaterial({ color: '#294b63', metalness: 0.25, roughness: 0.55 })
    const steel = new THREE.MeshStandardMaterial({ color: '#b1c1cc', metalness: 0.3, roughness: 0.55 })
    const orange = new THREE.MeshStandardMaterial({ color: '#a76247', metalness: 0.38, roughness: 0.52 })
    const weightTrim = new THREE.MeshStandardMaterial({ color: '#74412f', metalness: .35, roughness: .6 })
    const weightInset = new THREE.MeshStandardMaterial({ color: '#b97755', metalness: .27, roughness: .65 })
    const red = new THREE.MeshStandardMaterial({ color: '#b4573d' })
    // The SVG view intentionally uses a vertically compressed drawing scale.
    // Apply the same display projection to cable coordinates in 3D so a
    // front-on view shows the same slopes and snapped-end separation.
    // This is a presentation transform, not a modification of the solver.
    const point = (i: number) => new THREE.Vector3(
      solution.xs[i] - span / 2, -solution.ys[i] * visualYScale, 0,
    )
    const addRod = (start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) => {
      const difference = end.clone().sub(start)
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, difference.length(), 9), material)
      mesh.position.copy(start).add(end).multiplyScalar(0.5)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), difference.normalize())
      group.add(mesh)
    }
    // Match the 2D structural diagram: fixed overhead beam, blue hanger
    // brackets and pin joints. No support dimension depends on cable sag.
    const beamMaterial = new THREE.MeshStandardMaterial({color:'#d1dae1',metalness:.18,roughness:.68})
    const bracketMaterial = new THREE.MeshStandardMaterial({color:'#75a9ce',metalness:.2,roughness:.52})
    const pinMaterial = new THREE.MeshStandardMaterial({color:'#375f7e',metalness:.35,roughness:.43})
    const highlight = new THREE.MeshStandardMaterial({color:'#afcde2',metalness:.18,roughness:.5})
    const beam = new THREE.Mesh(new THREE.BoxGeometry(span+1.6,.33,.9),beamMaterial)
    beam.position.y=1.1
    group.add(beam)

    // Camera-facing text sprites keep the same load labeling as 2D while
    // remaining legible when the user orbits the physical model.
    const addLabel = (label:string, center:THREE.Vector3, scale:number, color='#ffffff')=>{
      const canvas=document.createElement('canvas')
      canvas.width=256;canvas.height=128
      const ctx=canvas.getContext('2d')
      if(!ctx)return
      ctx.clearRect(0,0,256,128)
      ctx.fillStyle=color
      ctx.textAlign='center';ctx.textBaseline='middle'
      ctx.font='bold 48px sans-serif'
      ctx.fillText(label,128,64,246)
      const texture=new THREE.CanvasTexture(canvas)
      texture.colorSpace=THREE.SRGBColorSpace
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
        map:texture,transparent:true,depthTest:false,depthWrite:false,
      }))
      sprite.position.copy(center)
      sprite.scale.set(scale,scale*.5,1)
      sprite.renderOrder=6
      group.add(sprite)
    }
    for(const [index,x] of [-span/2,span/2].entries()){
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.2,.15,.96),bracketMaterial)
      plate.position.set(x,.83,0)
      group.add(plate)
      // Trapezoidal clevis plate hangs from the beam down to the cable pin.
      const bracketOutline=new THREE.Shape()
      bracketOutline.moveTo(-.40,.77)
      bracketOutline.lineTo(.40,.77)
      bracketOutline.lineTo(.20,.18)
      bracketOutline.quadraticCurveTo(0,-.10,-.20,.18)
      bracketOutline.closePath()
      const bracket=new THREE.Mesh(
        new THREE.ExtrudeGeometry(bracketOutline,{depth:.14,bevelEnabled:false}),
        bracketMaterial,
      )
      bracket.position.set(x,0,-.07)
      group.add(bracket)
      const bearing=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.33,28),pinMaterial)
      bearing.rotation.x=Math.PI/2
      bearing.position.set(x,0,0)
      group.add(bearing)
      const center=new THREE.Mesh(new THREE.CylinderGeometry(.092,.092,.35,28),highlight)
      center.rotation.x=Math.PI/2
      center.position.set(x,0,.02)
      group.add(center)
      addLabel(index===0?'A':'B',new THREE.Vector3(x+(index===0?-.5:.5),-.12,.38),.7,'#354f62')
    }
    if (brokenSegment !== undefined && brokenSegment >= 0) {
      // Use the EXACT same snapped endpoints and cable-side paths as 2D.
      // Both loose cable runs turn red; no intact-looking blue branch remains.
      const fracture=illustrateCableBreak(solution,brokenSegment,pixelsPerMeter)
      const drawBrokenRun=(points:Array<[number,number]>)=>{
        for(let j=0;j<points.length-1;j++){
          const [ax,ay]=points[j], [bx,by]=points[j+1]
          addRod(
            new THREE.Vector3(ax-span/2,-ay*visualYScale,0),
            new THREE.Vector3(bx-span/2,-by*visualYScale,0),
            .068,red,
          )
        }
      }
      drawBrokenRun(fracture.left)
      drawBrokenRun(fracture.right)
      // In 2D both severed ends have a break marker and SNAP label.
      // Anchor the same annotation to the shared physical fracture points.
      const left=fracture.left[fracture.left.length-1]
      const right=fracture.right[0]
      if(left && right){
        // Match SVG label placement: it sits 23 screen-units ABOVE the
        // original (pre-break) segment midpoint, not between the fallen tips.
        const preBreakX=(solution.xs[brokenSegment]+solution.xs[brokenSegment+1])/2
        const preBreakY=(solution.ys[brokenSegment]+solution.ys[brokenSegment+1])/2
        const mid=new THREE.Vector3(preBreakX-span/2,
          -preBreakY*visualYScale + 23/pixelsPerMeter,.35)
        const mark=new THREE.MeshBasicMaterial({color:'#b4573d',depthTest:false})
        for(const [x,y] of [left,right]){
          const center=new THREE.Vector3(x-span/2,-y*visualYScale,.1)
          const slashA=center.clone().add(new THREE.Vector3(-.10,-.13,0))
          const slashB=center.clone().add(new THREE.Vector3(.10,.13,0))
          const slash=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.30,7),mark)
          slash.position.copy(slashA).add(slashB).multiplyScalar(.5)
          slash.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),
            slashB.sub(slashA).normalize())
          slash.renderOrder=7
          group.add(slash)
        }
        addLabel('SNAP!',mid,1.85,'#a33e2a')
      }
    }else{
      for(let i=0;i<solution.xs.length-1;i++){
        addRod(point(i),point(i+1),.07,blue)
      }
    }
    loads.forEach((load, i) => {
      // Treat each load as a freely suspended gravity load, NOT as a child of
      // either inclined cable segment. Every component has the SAME x/z
      // centerline as the cable's solved point-load joint.
      const jointPoint = point(i + 1)
      const x = jointPoint.x
      const z = jointPoint.z
      const width = (30 + load.load * 1.1) / pixelsPerMeter
      const height = (40 + load.load * .45) / pixelsPerMeter
      const depth = .64
      const hangerLength = 23 / pixelsPerMeter
      const topY = jointPoint.y - hangerLength
      const centerY = topY - height / 2

      // Real joint ring: centered in the vertical cable plane, not offset
      // toward the camera. The cable endpoints, hanger, and block all meet
      // along one vertical load path.
      const joint = new THREE.Mesh(
        new THREE.TorusGeometry(.145,.045,10,32),pinMaterial,
      )
      joint.position.copy(jointPoint)
      group.add(joint)

      const hangingSteel = new THREE.MeshStandardMaterial({
        color:'#657b8b',metalness:.55,roughness:.36,
      })
      // Suspended vertical rod has zero horizontal and depth displacement.
      addRod(
        new THREE.Vector3(x,jointPoint.y-.07,z),
        new THREE.Vector3(x,topY+.08,z),
        .044,hangingSteel,
      )
      // Weight's eye is attached to its top and intersects the hanger.
      const eye = new THREE.Mesh(
        new THREE.TorusGeometry(.11,.037,10,28),hangingSteel,
      )
      eye.position.set(x,topY+.055,z)
      group.add(eye)

      // Rectangular suspended mass with actual 3D depth. Its world rotation
      // stays identity even when the cable segments rotate with the sag.
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width,height,depth),orange,
      )
      body.position.set(x,centerY,z)
      group.add(body)
      const rim = new THREE.Mesh(
        new THREE.BoxGeometry(width-.09,height-.09,.025),weightTrim,
      )
      rim.position.set(x,centerY,z+depth/2+.016)
      group.add(rim)
      const front = new THREE.Mesh(
        new THREE.BoxGeometry(width-.15,height-.15,.027),weightInset,
      )
      front.position.set(x,centerY,z+depth/2+.042)
      group.add(front)

      // Text is affixed to the weight's front face, rather than using a
      // camera-facing sprite that floats independently as the view rotates.
      const labelCanvas=document.createElement('canvas')
      labelCanvas.width=512
      labelCanvas.height=256
      const labelCtx=labelCanvas.getContext('2d')
      if(labelCtx){
        labelCtx.clearRect(0,0,512,256)
        labelCtx.fillStyle='#ffffff'
        labelCtx.textAlign='center'
        labelCtx.textBaseline='middle'
        labelCtx.font='bold 72px sans-serif'
        labelCtx.fillText('P'+(i+1),256,86)
        labelCtx.font='bold 78px sans-serif'
        labelCtx.fillText(load.load+' kN',256,177)
        const labelTexture=new THREE.CanvasTexture(labelCanvas)
        labelTexture.colorSpace=THREE.SRGBColorSpace
        const faceMaterial=new THREE.MeshBasicMaterial({
          map:labelTexture,transparent:true,side:THREE.DoubleSide,
          depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
        })
        const label=new THREE.Mesh(
          new THREE.PlaneGeometry(width*.92,height*.78),faceMaterial,
        )
        label.position.set(x,centerY,z+depth/2+.066)
        group.add(label)
      }

      // Downward force starts below the center of mass, on the same x/z
      // vertical line. Geometry thickness (not WebGL lineWidth) encodes load.
      if(load.load>0){
        const ratio=Math.min(1,load.load/30)
        const radius=.014+.047*ratio
        const forceMaterial=new THREE.MeshBasicMaterial({color:'#b4573d'})
        const forceStart=centerY-height/2-.18
        const shaft=new THREE.Mesh(
          new THREE.CylinderGeometry(radius,radius,.48,16),forceMaterial,
        )
        shaft.position.set(x,forceStart-.24,z)
        const tip=new THREE.Mesh(
          new THREE.ConeGeometry(.06+.065*ratio,.21,18),forceMaterial,
        )
        tip.rotation.z=Math.PI
        tip.position.set(x,forceStart-.57,z)
        group.add(shaft,tip)
      }
    })
    // A subtle horizontal line makes the undeformed support elevation visible.
    const baseline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-span / 2, 0, -0.2), new THREE.Vector3(span / 2, 0, -0.2)]),
      new THREE.LineDashedMaterial({ color: '#a7b6c2', dashSize: 0.25, gapSize: 0.17 }),
    )
    baseline.computeLineDistances()
    group.add(baseline)
    // Refit only if the fixed structural span changes. Load changes never
    // alter camera orientation, framing or orbit target.
    if(framedSpan.current!==span){
      framedSpan.current=span
      const camera=cameraRef.current
      const controls=controlsRef.current
      const box=mount.current
      if(camera && controls && box && box.clientHeight>0){
        const aspect=box.clientWidth/box.clientHeight
        homeHalfHeight.current=Math.max(5.1,(span+2.2)/(2*aspect*.89))
        camera.left=-homeHalfHeight.current*aspect
        camera.right=homeHalfHeight.current*aspect
        camera.top=homeHalfHeight.current
        camera.bottom=-homeHalfHeight.current
        camera.updateProjectionMatrix()
        // Retain the user's chosen orbit and pan, including when span changes.
        controls.update()
      }
    }
    // Dispose shared materials even when one is not used by the current state.
    return () => {
      // Geometry cleanup is performed at the next update or on unmount.
    }
  }, [solution, loads, span, pixelsPerMeter, visualYScale, brokenSegment])

  return <UiBox sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
    <div ref={mount} role="img"
      aria-label={`Rotatable three-dimensional view of a ${span} meter cable with ${loads.length} point loads and ${solution.sag.toFixed(1)} meters of calculated sag. A fixed overhead beam supports blue pin joints and straight cable segments.`}
      style={{ width: '100%', height: '100%', touchAction: 'none' }} />
    <UiBox sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column',
      gap: 0.5, p: 0.5, bgcolor: 'rgba(255,255,255,.92)', border: '1px solid #d3dce2',
      borderRadius: 'var(--bbb-card-radius, 4px)' }}>
      <UiButton size="small" variant="text" aria-label="Zoom in" onClick={() => zoom(0.78)}
        sx={{ minWidth: 34, p: 0.5, fontSize: 19, lineHeight: 1 }}>+</UiButton>
      <UiButton size="small" variant="text" aria-label="Zoom out" onClick={() => zoom(1.28)}
        sx={{ minWidth: 34, p: 0.5, fontSize: 19, lineHeight: 1 }}>−</UiButton>
      <UiButton size="small" variant="text" aria-label="Move view up" onClick={() => panVertically(-1)}
        sx={{ minWidth: 34, p: 0.5, fontSize: 19, lineHeight: 1 }}>↑</UiButton>
      <UiButton size="small" variant="text" aria-label="Move view down" onClick={() => panVertically(1)}
        sx={{ minWidth: 34, p: 0.5, fontSize: 19, lineHeight: 1 }}>↓</UiButton>
      <UiButton size="small" variant="text" aria-label="Reset camera" onClick={resetView}
        sx={{ minWidth: 34, p: 0.5, fontSize: 11, lineHeight: 1.2 }}>Reset</UiButton>
    </UiBox>
  </UiBox>
}
