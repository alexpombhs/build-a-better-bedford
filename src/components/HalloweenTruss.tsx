import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './atoms/NewsletterSculpture.css'

// Real Three.js geometry and shadow-casting beams, inspired by the WebGL
// approach in the supplied blog. No copied scene code or flat SVG rotation.
export default function HalloweenTruss() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      // Gracefully leave the static fallback for browsers without WebGL.
      container.dataset.webglUnavailable = 'true'
      return
    }

    // Match Thanksgiving: per-pixel alpha keeps the newsletter's own palette
    // visible under the pumpkin's geometry and translucent cast shadow.
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.55
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.className = 'halloween-truss-canvas'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40)
    camera.position.set(2.75, 2.3, 5.5)
    camera.lookAt(0, 0.02, 0)

    const fill = new THREE.AmbientLight(0xffffff, 1.8)
    scene.add(fill)
    const key = new THREE.DirectionalLight(0xfff2df, 4)
    key.position.set(-3.3, 5, 3.4)
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
      rib: new THREE.MeshStandardMaterial({ color: 0xcf7b35, metalness: 0.22, roughness: 0.45 }),
      brace: new THREE.MeshStandardMaterial({ color: 0x66847b, metalness: 0.32, roughness: 0.48 }),
      hoop: new THREE.MeshStandardMaterial({ color: 0xa66a37, metalness: 0.22, roughness: 0.58 }),
      stem: new THREE.MeshStandardMaterial({ color: 0x3d7854, metalness: 0.1, roughness: 0.58 }),
    }
    const pumpkin = new THREE.Group()
    scene.add(pumpkin)
    const geometries: THREE.BufferGeometry[] = []

    const addBeam = (points: THREE.Vector3[], radius: number, material: THREE.Material) => {
      const curve = new THREE.CatmullRomCurve3(points)
      const geometry = new THREE.TubeGeometry(curve, Math.max(10, points.length * 3), radius, 6, false)
      geometries.push(geometry)
      const beam = new THREE.Mesh(geometry, material)
      beam.castShadow = true
      beam.receiveShadow = true
      pumpkin.add(beam)
    }

    // Ten meridional ribs and three lateral hoops make a pumpkin-shaped
    // structural framework. Diagonal bracing adds a civil-engineering detail.
    const ribCount = 10
    const bandCount = 15
    const pointAt = (phi: number, theta: number) => {
      const radius = 0.88 * Math.pow(Math.sin(phi), 0.62)
      const fluting = 1 + 0.055 * Math.cos(ribCount * theta)
      return new THREE.Vector3(
        radius * fluting * Math.cos(theta),
        0.77 * Math.cos(phi),
        radius * fluting * Math.sin(theta),
      )
    }

    for (let rib = 0; rib < ribCount; rib++) {
      const theta = rib * Math.PI * 2 / ribCount
      const points = Array.from({ length: bandCount + 1 }, (_, i) => pointAt(i * Math.PI / bandCount, theta))
      addBeam(points, 0.017, materials.rib)
    }

    for (const band of [0.3, 0.5, 0.7]) {
      const phi = Math.PI * band
      const points = Array.from({ length: 61 }, (_, i) => pointAt(phi, i * Math.PI * 2 / 60))
      addBeam(points, 0.009, materials.hoop)
    }

    for (const band of [0.35, 0.65]) {
      for (let rib = 0; rib < ribCount; rib += 2) {
        const startPhi = Math.PI * band
        const endPhi = Math.PI * (band + 0.12)
        addBeam([
          pointAt(startPhi, rib * Math.PI * 2 / ribCount),
          pointAt((startPhi + endPhi) / 2, (rib + 0.5) * Math.PI * 2 / ribCount),
          pointAt(endPhi, (rib + 1) * Math.PI * 2 / ribCount),
        ], 0.007, materials.brace)
      }
    }

    addBeam([
      new THREE.Vector3(0, 0.77, 0),
      new THREE.Vector3(0.02, 0.91, 0),
      new THREE.Vector3(0.11, 1.03, 0.04),
    ], 0.037, materials.stem)

    // This plane receives actual shadows cast by the Three.js mesh geometry.
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.ShadowMaterial({ color: 0x4e3c2b, opacity: 0.25 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.84
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
      if (!motion.matches) pumpkin.rotation.y += Math.min((timestamp - previous) / 1000, 0.1) * 0.22
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
    <figure className="halloween-truss">
      <div ref={mountRef} className="halloween-truss-stage" role="img" aria-label="Slowly rotating 3D pumpkin-shaped engineering truss casting a soft shadow on the floor">
        <span className="halloween-truss-fallback" aria-hidden="true">Structural pumpkin · 3D model</span>
      </div>
    </figure>
  )
}
