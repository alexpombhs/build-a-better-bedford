import { useEffect, useRef } from 'react'
import { UiBox, UiButton, UiText } from './components/atoms/MuiPrimitives'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { CableLoad, CableSolution } from './lab/funicularPhysics'

type Props = {
  solution: CableSolution
  loads: CableLoad[]
  span: number
  brokenSegment?: number
}

/** Three.js is the visualization layer; all force and sag calculations come
 * from the same funicularPhysics solver used by the SVG simulator. */
export default function CableThreeView({ solution, loads, span, brokenSegment }: Props) {
  const mount = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const geometryRef = useRef<THREE.Group | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const homeDistance = useRef(15)
  const homeTarget = useRef(-1.7)
  const initialFrameSet = useRef(false)
  const zoom = (factor: number) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const vector = camera.position.clone().sub(controls.target)
    vector.multiplyScalar(factor)
    vector.clampLength(controls.minDistance, controls.maxDistance)
    camera.position.copy(controls.target).add(vector)
    controls.update()
  }
  const panVertically = (direction: number) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    // Translate the camera and orbit target together: this moves the visible
    // assembly on screen without shifting any of its physical coordinates.
    const delta = direction * Math.max(.35, camera.position.distanceTo(controls.target) * .055)
    camera.position.y += delta
    controls.target.y += delta
    controls.update()
  }
  const resetView = () => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    camera.position.set(1.1, homeTarget.current + 4, homeDistance.current)
    controls.target.set(0, homeTarget.current, 0)
    controls.update()
  }

  useEffect(() => {
    const element = mount.current
    if (!element) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f5f8fa')
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 300)
    camera.position.set(1.1, 2.3, homeDistance.current)
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
    controls.target.set(0, homeTarget.current, 0)
    controls.update()
    const resize = () => {
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height) return
      const aspect=width/height
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      if(!initialFrameSet.current){
        // Frame the whole structural assembly, not the now-removed pylons.
        // Base the fit on span AND the lowest hanging load so the weights
        // remain visible at the default view across wide/narrow screens.
        const lowest=solution.sag+3.0
        const top=1.45
        const verticalExtent=top+lowest
        const fov=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)
        const fitWidth=(span+2.3)/(2*fov*aspect*.86)
        const fitHeight=verticalExtent/(2*fov*.84)
        homeDistance.current=Math.max(7.5,fitWidth,fitHeight)
        homeTarget.current=(top-lowest)/2
        camera.position.set(1.1,homeTarget.current+3.0,homeDistance.current)
        controls.target.set(0,homeTarget.current,0)
        controls.update()
        initialFrameSet.current=true
      }
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
              if (material instanceof THREE.SpriteMaterial) material.map?.dispose()
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
            if (material instanceof THREE.SpriteMaterial) material.map?.dispose()
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
    const point = (i: number) => new THREE.Vector3(solution.xs[i] - span / 2, -solution.ys[i], 0)
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
    for (let i = 0; i < solution.xs.length - 1; i++) {
      const start = point(i)
      const end = point(i + 1)
      if (brokenSegment === i) {
        const direction = end.clone().sub(start)
        const a = start.clone().addScaledVector(direction, 0.44).add(new THREE.Vector3(0, -0.35, 0))
        const b = start.clone().addScaledVector(direction, 0.56).add(new THREE.Vector3(0, -0.6, 0))
        addRod(start, a, 0.065, red)
        addRod(b, end, 0.065, red)
      } else {
        addRod(start, end, 0.07, blue)
      }
    }
    loads.forEach((load, i) => {
      const attachment=point(i+1)
      // Metal eye at the point-load joint, then a short hanger to the block.
      const joint=new THREE.Mesh(new THREE.TorusGeometry(.19,.057,10,32),pinMaterial)
      joint.position.copy(attachment)
      group.add(joint)
      // A suspended test mass: thick cast-metal body with bevelled edges,
      // a recessed front plate, hanging shackle and a clearly stamped value.
      const height=.83+load.load*.014
      const massWidth=1.42
      const massDepth=.78
      const shape=new THREE.Shape()
      shape.moveTo(-massWidth/2,-height/2)
      shape.lineTo(massWidth/2,-height/2)
      shape.lineTo(massWidth/2,height/2)
      shape.lineTo(-massWidth/2,height/2)
      shape.closePath()
      const body=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{
        depth:massDepth-.10,bevelEnabled:true,bevelThickness:.05,
        bevelSize:.05,bevelSegments:2,steps:1,
      }),orange)
      const centerY=attachment.y-.46-height/2
      body.position.set(attachment.x,centerY,-massDepth/2+.05)
      group.add(body)
      const faceZ=massDepth/2+.02
      const border=new THREE.Mesh(new THREE.BoxGeometry(massWidth-.16,height-.16,.025),weightTrim)
      border.position.set(attachment.x,centerY,faceZ)
      group.add(border)
      const face=new THREE.Mesh(new THREE.BoxGeometry(massWidth-.23,height-.23,.035),weightInset)
      face.position.set(attachment.x,centerY,faceZ+.035)
      group.add(face)
      const strapTop=centerY+height/2
      addRod(new THREE.Vector3(attachment.x,attachment.y-.17,0),
        new THREE.Vector3(attachment.x,strapTop+.07,0),.052,steel)
      const loop=new THREE.Mesh(new THREE.TorusGeometry(.19,.065,12,32),steel)
      loop.position.set(attachment.x,strapTop+.08,0)
      group.add(loop)
      const cap=new THREE.Mesh(new THREE.BoxGeometry(.50,.10,.44),weightTrim)
      cap.position.set(attachment.x,strapTop+.02,0)
      group.add(cap)
      const textZ=faceZ+.068
      addLabel('P'+(i+1),new THREE.Vector3(attachment.x,centerY+height*.19,textZ),1.02)
      addLabel(load.load+' kN',new THREE.Vector3(attachment.x,centerY-height*.16,textZ),1.18)
      const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),
        new THREE.Vector3(attachment.x,centerY-height/2-.18,0),
        .72,0xb4573d,.22,.15)
      group.add(arrow)
    })
    // A subtle horizontal line makes the undeformed support elevation visible.
    const baseline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-span / 2, 0, -0.2), new THREE.Vector3(span / 2, 0, -0.2)]),
      new THREE.LineDashedMaterial({ color: '#a7b6c2', dashSize: 0.25, gapSize: 0.17 }),
    )
    baseline.computeLineDistances()
    group.add(baseline)
    // Dispose shared materials even when one is not used by the current state.
    return () => {
      // Geometry cleanup is performed at the next update or on unmount.
    }
  }, [solution, loads, span, brokenSegment])

  return <UiBox sx={{ position: 'relative', width: '100%', height: 'min(43vh,405px)', minHeight: 250 }}>
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
