import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './BridgeLoader.css'

type BridgeLoaderProps = {
  /** Screen-reader announcement; the visual loader has no explanatory caption. */
  label?: string
}

/**
 * A tiny, pastel suspension bridge made from real Three.js geometry.
 * The WebGL canvas is transparent so the loader fits any page or card color.
 */
export default function BridgeLoader({ label = 'Loading content' }: BridgeLoaderProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      })
    } catch {
      // The lightweight static illustration stays visible without WebGL.
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.className = 'bbb-bridge-loader-canvas'
    mount.appendChild(renderer.domElement)
    mount.dataset.webglActive = 'true'

    const scene = new THREE.Scene() // Intentionally NO scene.background or floor.
    scene.add(new THREE.AmbientLight(0xffffff, 2.2))
    const sunlight = new THREE.DirectionalLight(0xffffff, 2.8)
    sunlight.position.set(-3, 5, 6)
    scene.add(sunlight)

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40)
    camera.position.set(3.3, 2.25, 6.7)
    camera.lookAt(0, 0.56, 0)

    const bridge = new THREE.Group()
    scene.add(bridge)
    const materials = {
      deck: new THREE.MeshStandardMaterial({ color: 0x79b8b2, roughness: 0.72 }),
      roadway: new THREE.MeshStandardMaterial({ color: 0xa3d3cf, roughness: 0.7 }),
      towers: new THREE.MeshStandardMaterial({ color: 0xf4ad93, roughness: 0.65 }),
      caps: new THREE.MeshStandardMaterial({ color: 0xffcf91, roughness: 0.58 }),
      cables: new THREE.MeshStandardMaterial({ color: 0x6d86bf, roughness: 0.6 }),
      hangers: new THREE.MeshStandardMaterial({ color: 0x9b9ac6, roughness: 0.65 }),
      markings: new THREE.MeshStandardMaterial({ color: 0xfff8df, roughness: 0.8 }),
    }
    const geometries: THREE.BufferGeometry[] = []

    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
      geometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y, z)
      bridge.add(mesh)
      return mesh
    }
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) =>
      add(new THREE.BoxGeometry(w, h, d), material, x, y, z)
    const line = (points: THREE.Vector3[], radius: number, material: THREE.Material) =>
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(12, points.length * 3), radius, 7, false), material)

    // Rounded end caps and a mint-green deck keep the silhouette friendly.
    box(3.6, 0.17, 0.72, 0, 0, 0, materials.deck)
    box(3.44, 0.028, 0.53, 0, 0.1, 0, materials.roadway)
    for (const x of [-1.18, -0.47, 0.24, 0.95]) {
      box(0.3, 0.014, 0.034, x, 0.124, 0, materials.markings)
    }
    for (const x of [-1.83, 1.83]) {
      box(0.12, 0.22, 0.84, x, 0, 0, materials.caps)
    }

    // Two pairs of peach towers, with small sunny finials.
    for (const x of [-1.05, 1.05]) {
      for (const z of [-0.37, 0.37]) {
        box(0.14, 1.16, 0.14, x, 0.69, z, materials.towers)
        add(new THREE.SphereGeometry(0.105, 12, 8), materials.caps, x, 1.34, z)
      }
      box(0.18, 0.12, 0.88, x, 1.17, 0, materials.towers)
    }

    // Soft, sagging suspension cables and minimal vertical hangers.
    const cableHeight = (x: number) => {
      const distance = Math.abs(x)
      return distance <= 1.05
        ? 0.75 + 0.55 * (distance / 1.05) ** 2
        : 1.3 - (distance - 1.05) * (1.01 / 0.7)
    }
    for (const z of [-0.39, 0.39]) {
      const xs = [-1.75, -1.58, -1.35, -1.05, -0.84, -0.63, -0.42, -0.2, 0, 0.2, 0.42, 0.63, 0.84, 1.05, 1.35, 1.58, 1.75]
      line(xs.map(x => new THREE.Vector3(x, cableHeight(x), z)), 0.03, materials.cables)
      for (const x of [-1.5, -0.78, -0.39, 0, 0.39, 0.78, 1.5]) {
        line([
          new THREE.Vector3(x, 0.16, z),
          new THREE.Vector3(x, cableHeight(x), z),
        ], 0.014, materials.hangers)
      }
    }

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let previous = 0
    let elapsed = 0
    let active = true
    bridge.rotation.y = -0.3

    const render = (timestamp: number) => {
      if (!active) return
      if (previous !== 0 && !reducedMotion.matches) {
        elapsed += Math.min((timestamp - previous) / 1000, 0.05)
        bridge.rotation.y = -0.3 + elapsed * 0.65
        bridge.position.y = Math.sin(elapsed * 2) * 0.055
      }
      previous = timestamp
      renderer.render(scene, camera)
      if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(render)
    }
    const restart = () => {
      cancelAnimationFrame(frame)
      previous = 0
      if (!document.hidden) frame = requestAnimationFrame(render)
    }

    reducedMotion.addEventListener('change', restart)
    document.addEventListener('visibilitychange', restart)
    resize()
    restart()

    return () => {
      active = false
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      reducedMotion.removeEventListener('change', restart)
      document.removeEventListener('visibilitychange', restart)
      geometries.forEach(geometry => geometry.dispose())
      Object.values(materials).forEach(material => material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
      delete mount.dataset.webglActive
    }
  }, [])

  return (
    <div className="bbb-bridge-loader" role="status" aria-label={label}>
      <div className="bbb-bridge-loader-stage" ref={mountRef}>
        <svg className="bbb-bridge-loader-fallback" viewBox="0 0 210 125" aria-hidden="true">
          <path d="M18 91H192" stroke="#79b8b2" strokeWidth="12" strokeLinecap="round" />
          <path d="M55 91V29M155 91V29" stroke="#f4ad93" strokeWidth="9" strokeLinecap="round" />
          <path d="M18 78L55 29Q105 96 155 29L192 78" fill="none" stroke="#6d86bf" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M76 55V91M105 63V91M134 55V91" stroke="#9b9ac6" strokeWidth="3" />
          <circle cx="55" cy="25" r="6" fill="#ffcf91" />
          <circle cx="155" cy="25" r="6" fill="#ffcf91" />
        </svg>
      </div>
    </div>
  )
}
