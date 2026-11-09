import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './ThanksgivingHorn.css'

/**
 * Three.js cornucopia truss: ribs, ring beams and diagonal cross-braces.
 * The open framework and physical shadows show structure and load paths,
 * matching the Halloween engineering sculpture rather than solid clip art.
 */
export default function ThanksgivingHorn() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      container.dataset.webglUnavailable = 'true'
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.48
    renderer.domElement.className = 'thanksgiving-horn-canvas'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30)
    camera.position.set(2.7, 1.95, 5.2)
    camera.lookAt(0.02, 0.0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 1.8))
    const key = new THREE.DirectionalLight(0xffefd9, 3.8)
    key.position.set(-3.1, 4.6, 3.7)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3.1
    key.shadow.camera.right = 3.1
    key.shadow.camera.top = 3.1
    key.shadow.camera.bottom = -3.1
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 13
    key.shadow.bias = -0.0002
    key.shadow.normalBias = 0.015
    key.shadow.radius = 3
    scene.add(key)

    const materials = {
      rib: new THREE.MeshStandardMaterial({ color: 0xc78647, metalness: 0.16, roughness: 0.51 }),
      ring: new THREE.MeshStandardMaterial({ color: 0xe1b16f, metalness: 0.12, roughness: 0.55 }),
      brace: new THREE.MeshStandardMaterial({ color: 0x69857a, metalness: 0.2, roughness: 0.5 }),
      load: new THREE.MeshStandardMaterial({ color: 0xb8683d, metalness: 0.16, roughness: 0.52 }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x568064, metalness: 0.15, roughness: 0.5 }),
    }
    const horn = new THREE.Group()
    scene.add(horn)
    const geometries: THREE.BufferGeometry[] = []

    const addBeam = (points: THREE.Vector3[], radius: number, material: THREE.Material) => {
      const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(18, points.length * 5), radius, 7, false)
      geometries.push(geometry)
      const beam = new THREE.Mesh(geometry, material)
      beam.castShadow = true
      beam.receiveShadow = true
      horn.add(beam)
    }

    // Sweeping taper, wider opening at the right. No filled cone mesh: ribs
    // and circumferential rings remain visible through the whole structure.
    const ribs = 12
    const sections = 20
    const center = (t: number) => new THREE.Vector3(
      -1.13 + 2.12 * t,
      -0.32 + 0.51 * Math.sin(t * Math.PI * 0.7) + 0.12 * t,
      -0.02 + 0.16 * Math.sin(t * Math.PI),
    )
    const radius = (t: number) => 0.035 + 0.61 * Math.pow(t, 1.47)
    const at = (t: number, angle: number) => {
      const c = center(t)
      return new THREE.Vector3(c.x, c.y + radius(t) * Math.cos(angle), c.z + radius(t) * Math.sin(angle))
    }

    for (let rib = 0; rib < ribs; rib++) {
      const angle = rib * Math.PI * 2 / ribs
      addBeam(Array.from({ length: sections + 1 }, (_, i) => at(i / sections, angle)), 0.021, materials.rib)
    }

    for (const t of [0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9, 1]) {
      addBeam(Array.from({ length: 49 }, (_, i) => at(t, i * Math.PI * 2 / 48)), t === 1 ? 0.038 : 0.013, materials.ring)
    }

    // Alternating web diagonals behave like the bracing of a bridge truss.
    for (const start of [0.3, 0.54, 0.78]) {
      for (let rib = 0; rib < ribs; rib += 2) {
        const a = rib * Math.PI * 2 / ribs
        const b = (rib + 1) * Math.PI * 2 / ribs
        addBeam([at(start, a), at(start + 0.055, (a + b) / 2), at(start + 0.12, b)], 0.009, materials.brace)
      }
    }

    // A small wire pumpkin inside the open mouth represents the contents
    // without hiding the load-bearing geometry with solid fruit meshes.
    const pumpkinCenter = new THREE.Vector3(0.72, -0.2, 0.19)
    const pumpkinPoint = (phi: number, theta: number) => new THREE.Vector3(
      pumpkinCenter.x + 0.27 * Math.sin(phi) * Math.cos(theta),
      pumpkinCenter.y + 0.22 * Math.cos(phi),
      pumpkinCenter.z + 0.27 * Math.sin(phi) * Math.sin(theta),
    )
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI * 2 / 10
      addBeam(Array.from({ length: 17 }, (_, j) => pumpkinPoint(j * Math.PI / 16, a)), 0.011, materials.load)
    }
    for (const phi of [0.34, 0.5, 0.66]) {
      addBeam(Array.from({ length: 49 }, (_, j) => pumpkinPoint(Math.PI * phi, j * Math.PI * 2 / 48)), 0.008, materials.load)
    }
    addBeam([
      new THREE.Vector3(0.72, 0.02, 0.19),
      new THREE.Vector3(0.73, 0.14, 0.19),
      new THREE.Vector3(0.82, 0.21, 0.22),
    ], 0.021, materials.leaf)

    // Shadow receiver is identical in concept to October's HalloweenTruss.
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.ShadowMaterial({ color: 0x4e3c2b, opacity: 0.31 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.92
    floor.receiveShadow = true
    scene.add(floor)

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let previous = 0
    let active = true
    const render = (timestamp: number) => {
      if (!active) return
      if (!previous) previous = timestamp
      if (!motion.matches) horn.rotation.y += Math.min((timestamp - previous) / 1000, 0.1) * 0.20
      previous = timestamp
      renderer.render(scene, camera)
      if (!motion.matches) frame = requestAnimationFrame(render)
    }
    const restart = () => {
      cancelAnimationFrame(frame)
      previous = 0
      frame = requestAnimationFrame(render)
    }
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame)
      else restart()
    }
    motion.addEventListener('change', restart)
    document.addEventListener('visibilitychange', onVisibility)
    restart()

    return () => {
      active = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      motion.removeEventListener('change', restart)
      document.removeEventListener('visibilitychange', onVisibility)
      geometries.forEach(geometry => geometry.dispose())
      floorGeometry.dispose()
      floorMaterial.dispose()
      Object.values(materials).forEach(material => material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <figure className="thanksgiving-horn">
      <div ref={mountRef} className="thanksgiving-horn-stage" role="img"
        aria-label="Slowly rotating, three-dimensional cornucopia truss built from open structural ribs, rings and diagonal braces, casting a shadow">
        <span className="thanksgiving-horn-fallback" aria-hidden="true">Cornucopia truss · 3D structure</span>
      </div>
      <figcaption>Cornucopia truss · ribs, bracing &amp; shadow</figcaption>
    </figure>
  )
}
