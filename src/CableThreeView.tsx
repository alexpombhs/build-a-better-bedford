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
  const homeDistance = useRef(23)
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
  const resetView = () => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    camera.position.set(0, 5.5, homeDistance.current)
    controls.target.set(0, -1.4, 0)
    controls.update()
  }

  useEffect(() => {
    const element = mount.current
    if (!element) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f5f8fa')
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 300)
    homeDistance.current = 23
    camera.position.set(0, 5.5, homeDistance.current)
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
    controls.enablePan = false
    controls.minDistance = 8
    controls.maxDistance = 55
    controls.maxPolarAngle = Math.PI * 0.8
    controls.target.set(0, -1.4, 0)
    controls.update()
    const resize = () => {
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
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
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
            object.geometry.dispose()
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            materials.forEach(material => material.dispose())
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
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => material.dispose())
        }
      })
    }
    const group = new THREE.Group()
    geometryRef.current = group
    scene.add(group)
    const blue = new THREE.MeshStandardMaterial({ color: '#294b63', metalness: 0.25, roughness: 0.55 })
    const steel = new THREE.MeshStandardMaterial({ color: '#b1c1cc', metalness: 0.3, roughness: 0.55 })
    const orange = new THREE.MeshStandardMaterial({ color: '#b66c4c', metalness: 0.15, roughness: 0.65 })
    const red = new THREE.MeshStandardMaterial({ color: '#b4573d' })
    const point = (i: number) => new THREE.Vector3(solution.xs[i] - span / 2, -solution.ys[i], 0)
    const addRod = (start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) => {
      const difference = end.clone().sub(start)
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, difference.length(), 9), material)
      mesh.position.copy(start).add(end).multiplyScalar(0.5)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), difference.normalize())
      group.add(mesh)
    }
    // Two standalone bridge-inspired concrete pylons, not a bridge/deck.
    // Keep the bases below every cable point, with clearance for the
    // illustrative droop of a broken segment.
    const pillarHeight = Math.max(5, solution.sag + 2.3)
    const concrete = new THREE.MeshStandardMaterial({ color: '#aebbc5', roughness: 0.92 })
    const trim = new THREE.MeshStandardMaterial({ color: '#8193a1', roughness: 0.75 })
    for (const x of [-span / 2, span / 2]) {
      // Slight taper, square profile, and a wider foundation evoke real
      // suspension-bridge pylons without adding a roadway or bridge frame.
      const shape = new THREE.BoxGeometry(0.88, pillarHeight, 1.06)
      const positions = shape.attributes.position
      for (let v = 0; v < positions.count; v++) {
        if (positions.getY(v) > 0) {
          positions.setX(v, positions.getX(v) * 0.70)
          positions.setZ(v, positions.getZ(v) * 0.78)
        }
      }
      shape.computeVertexNormals()
      const pillar = new THREE.Mesh(shape, concrete)
      pillar.position.set(x, -pillarHeight / 2, 0)
      group.add(pillar)
      const foundation = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.36, 1.5), concrete)
      foundation.position.set(x, -pillarHeight - 0.18, 0)
      group.add(foundation)
      const topCap = new THREE.Mesh(new THREE.BoxGeometry(0.83, 0.22, 0.94), trim)
      topCap.position.set(x, 0.1, 0)
      group.add(topCap)
      const bearing = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 16), blue)
      bearing.rotation.x = Math.PI / 2
      bearing.position.set(x, 0.25, 0)
      group.add(bearing)
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
      const attachment = point(i + 1)
      const height = 0.4 + load.load * 0.024
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.65, height, 0.7), orange)
      block.position.copy(attachment).add(new THREE.Vector3(0, -0.85 - height / 2, 0))
      group.add(block)
      addRod(attachment, new THREE.Vector3(attachment.x, block.position.y + height / 2, 0), 0.026, steel)
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(attachment.x, block.position.y - height / 2 - 0.1, 0), 0.85, 0xb4573d, 0.23, 0.12)
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
      aria-label={`Rotatable three-dimensional view of a ${span} meter cable with ${loads.length} point loads and ${solution.sag.toFixed(1)} meters of calculated sag. The two supports extend below the cable's lowest point.`}
      style={{ width: '100%', height: '100%', touchAction: 'none' }} />
    <UiBox sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column',
      gap: 0.5, p: 0.5, bgcolor: 'rgba(255,255,255,.92)', border: '1px solid #d3dce2',
      borderRadius: 'var(--bbb-card-radius, 4px)' }}>
      <UiButton size="small" variant="text" aria-label="Zoom in" onClick={() => zoom(0.78)}
        sx={{ minWidth: 34, p: 0.5, fontSize: 19, lineHeight: 1 }}>+</UiButton>
      <UiButton size="small" variant="text" aria-label="Zoom out" onClick={() => zoom(1.28)}
        sx={{ minWidth: 34, p: 0.5, fontSize: 19, lineHeight: 1 }}>−</UiButton>
      <UiButton size="small" variant="text" aria-label="Reset camera" onClick={resetView}
        sx={{ minWidth: 34, p: 0.5, fontSize: 11, lineHeight: 1.2 }}>Reset</UiButton>
    </UiBox>
    <UiText variant="caption" sx={{ position: 'absolute', bottom: 5, left: 8,
      color: '#465d70', fontSize: 10, pointerEvents: 'none' }}>
      Drag to orbit · scroll or pinch to zoom
    </UiText>
  </UiBox>
}
