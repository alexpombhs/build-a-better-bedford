import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './WinterSnowman.css'

/**
 * Transparent wireframe snowman sculpture: curved structural ribs, hoops,
 * diagonal cross-bracing and a lightweight hat. Matches the pumpkin and
 * cornucopia's open truss construction, rather than using solid spheres.
 */
export default function WinterSnowman() {
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
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.4
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30)
    camera.position.set(2.35, 1.45, 5.8)
    camera.lookAt(0, 0.12, 0)
    scene.add(new THREE.AmbientLight(0xffffff, 1.85))
    const light = new THREE.DirectionalLight(0xffffff, 3.3)
    light.position.set(-3.4, 4.8, 4.2)
    light.castShadow = true
    light.shadow.mapSize.set(1024, 1024)
    light.shadow.camera.left = -3
    light.shadow.camera.right = 3
    light.shadow.camera.top = 3
    light.shadow.camera.bottom = -3
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 12
    light.shadow.bias = -0.0002
    light.shadow.normalBias = 0.015
    scene.add(light)

    const materials = {
      rib: new THREE.MeshStandardMaterial({ color: 0x9fbcca, metalness: 0.17, roughness: 0.56 }),
      hoop: new THREE.MeshStandardMaterial({ color: 0xd3e2e9, metalness: 0.12, roughness: 0.55 }),
      brace: new THREE.MeshStandardMaterial({ color: 0x6c91a4, metalness: 0.22, roughness: 0.52 }),
      hat: new THREE.MeshStandardMaterial({ color: 0x506b80, metalness: 0.14, roughness: 0.58 }),
      scarf: new THREE.MeshStandardMaterial({ color: 0x8eb7bd, metalness: 0.12, roughness: 0.6 }),
      nose: new THREE.MeshStandardMaterial({ color: 0xc99665, metalness: 0.1, roughness: 0.65 }),
    }
    const snowman = new THREE.Group()
    scene.add(snowman)
    const geometries: THREE.BufferGeometry[] = []
    const addBeam = (points: THREE.Vector3[], radius: number, material: THREE.Material) => {
      const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(12, points.length * 4), radius, 7, false)
      geometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      snowman.add(mesh)
    }
    const circle = (x: number, y: number, z: number, radius: number, material: THREE.Material, thickness = 0.012) => {
      addBeam(Array.from({length: 49}, (_, i) => {
        const a = i * Math.PI * 2 / 48
        return new THREE.Vector3(x + radius * Math.cos(a), y, z + radius * Math.sin(a))
      }), thickness, material)
    }

    // Three open, hollow spheres. Each hoop connects the vertical ribs; the
    // staggered diagonal members illustrate lateral bracing in a space frame.
    const openBall = (y: number, radius: number, ribs: number) => {
      const point = (phi: number, theta: number) => new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        y + radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      )
      for (let i = 0; i < ribs; i++) {
        const angle = i * Math.PI * 2 / ribs
        addBeam(Array.from({length: 21}, (_, j) => point(j * Math.PI / 20, angle)), 0.014, materials.rib)
      }
      for (const fraction of [0.27, 0.5, 0.73]) {
        const phi = fraction * Math.PI
        addBeam(Array.from({length: 49}, (_, j) => point(phi, j * 2 * Math.PI / 48)), 0.009, materials.hoop)
      }
      for (let i = 0; i < ribs; i += 2) {
        const a = i * 2 * Math.PI / ribs
        addBeam([point(0.39 * Math.PI, a), point(0.49 * Math.PI, a + Math.PI / ribs), point(0.59 * Math.PI, a + 2 * Math.PI / ribs)], 0.007, materials.brace)
      }
    }
    openBall(-0.56, 0.71, 12)
    openBall(0.43, 0.53, 10)
    openBall(1.18, 0.37, 10)

    // Hat rim, vertical wall, and top hoops remain open frame members.
    circle(0, 1.59, 0, 0.43, materials.hat, 0.024)
    circle(0, 1.65, 0, 0.30, materials.scarf, 0.022)
    circle(0, 1.97, 0, 0.29, materials.hat, 0.016)
    for (let i = 0; i < 12; i++) {
      const a = i * 2 * Math.PI / 12
      addBeam([new THREE.Vector3(0.30 * Math.cos(a), 1.62, 0.30 * Math.sin(a)),
        new THREE.Vector3(0.29 * Math.cos(a), 1.97, 0.29 * Math.sin(a))], 0.013, materials.hat)
    }

    // Light scarf loops around the neck; two simple stick arms and a nose.
    circle(0, 0.82, 0, 0.40, materials.scarf, 0.022)
    addBeam([new THREE.Vector3(0.16, 0.82, 0.36), new THREE.Vector3(0.20, 0.56, 0.38), new THREE.Vector3(0.27, 0.42, 0.41)], 0.019, materials.scarf)
    for (const side of [-1, 1]) {
      addBeam([new THREE.Vector3(side * 0.44, 0.47, 0), new THREE.Vector3(side * 0.78, 0.64, 0.05),
        new THREE.Vector3(side * 1.06, 0.84, 0.12)], 0.022, materials.hat)
      addBeam([new THREE.Vector3(side * 0.84, 0.68, 0.08), new THREE.Vector3(side * 1.05, 0.66, 0.15)], 0.013, materials.hat)
    }
    addBeam([new THREE.Vector3(0, 1.18, 0.36), new THREE.Vector3(0, 1.18, 0.54),
      new THREE.Vector3(0.015, 1.14, 0.70)], 0.029, materials.nose)

    // The open sculpture casts a real soft shadow on a transparent canvas.
    const floorGeometry = new THREE.PlaneGeometry(15, 15)
    const floorMaterial = new THREE.ShadowMaterial({ color: 0x526b7b, opacity: 0.19 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.31
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
    let active = true
    let frame = 0
    let previous = 0
    const render = (timestamp: number) => {
      if (!active) return
      if (!previous) previous = timestamp
      if (!motion.matches) snowman.rotation.y += Math.min((timestamp - previous) / 1000, 0.1) * 0.20
      previous = timestamp
      renderer.render(scene, camera)
      if (!motion.matches) frame = requestAnimationFrame(render)
    }
    const restart = () => {
      cancelAnimationFrame(frame)
      previous = 0
      frame = requestAnimationFrame(render)
    }
    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(frame); else restart() }
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

  return <figure className="thanksgiving-horn">
    <div ref={mountRef} className="thanksgiving-horn-stage bbb-winter-snowman" role="img"
      aria-label="Slowly rotating transparent 3D snowman built from structural ribs, hoops and diagonal bracing">
      <span className="bbb-winter-snowman-fallback" aria-hidden="true">Snowman · 3D frame model</span>
    </div>
  </figure>
}
