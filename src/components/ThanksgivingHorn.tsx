import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './ThanksgivingHorn.css'

/**
 * Original 3D cornucopia built entirely from Three.js geometry.
 * Decorative ornament for the Thanksgiving newsletter section.
 * Like HalloweenTruss, this uses the existing Three.js dependency.
 */
export default function ThanksgivingHorn() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      mount.dataset.webglUnavailable = 'true'
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.36
    renderer.domElement.className = 'thanksgiving-horn-canvas'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30)
    camera.position.set(3.1, 2.0, 5.7)
    camera.lookAt(0.1, 0.04, 0)

    scene.add(new THREE.HemisphereLight(0xfff8e8, 0x96795a, 2.5))
    const key = new THREE.DirectionalLight(0xffefcf, 3.2)
    key.position.set(-3, 4, 6)
    scene.add(key)
    const rimLight = new THREE.DirectionalLight(0xdce6c4, 1.25)
    rimLight.position.set(3, 2, -4)
    scene.add(rimLight)

    const ornament = new THREE.Group()
    scene.add(ornament)
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []
    const material = (color: number, roughness = 0.76) => {
      const value = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, side: THREE.DoubleSide })
      materials.push(value)
      return value
    }
    const wicker = material(0xbc7840, 0.92)
    const weave = material(0xe2ac66, 0.85)
    const opening = material(0x55331f, 0.95)
    const orange = material(0xe78532)
    const pumpkinRib = material(0xf3a143)
    const red = material(0xb64032)
    const gold = material(0xe8b53d)
    const green = material(0x6e994b)
    const grape = material(0x74558a)
    const stem = material(0x6b6334)
    const leaf = material(0x6e9b51)

    const addMesh = (geometry: THREE.BufferGeometry, finish: THREE.Material, parent = ornament) => {
      geometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, finish)
      mesh.castShadow = true
      parent.add(mesh)
      return mesh
    }
    const addSphere = (
      x: number, y: number, z: number, radius: number,
      finish: THREE.Material, sx = 1, sy = 1, sz = 1,
    ) => {
      const mesh = addMesh(new THREE.SphereGeometry(radius, 20, 14), finish)
      mesh.position.set(x, y, z)
      mesh.scale.set(sx, sy, sz)
      return mesh
    }

    // Curved, tapering wicker horn: an actual triangulated surface, not an
    // image, GIF, or a flat rotating silhouette.
    const center = (t: number) => new THREE.Vector3(
      -1.02 + 1.7 * t,
      -0.30 + 0.41 * Math.sin(t * Math.PI * 0.73) + 0.20 * t,
      -0.12 + 0.10 * Math.sin(Math.PI * t),
    )
    const radiusAt = (t: number) => 0.03 + 0.53 * Math.pow(t, 1.45)
    const rings = 52
    const sides = 32
    const vertices: number[] = []
    const indices: number[] = []
    for (let i = 0; i <= rings; i++) {
      const t = i / rings
      const c = center(t)
      const radius = radiusAt(t)
      for (let j = 0; j <= sides; j++) {
        const angle = j / sides * Math.PI * 2
        const flute = 1 + 0.045 * Math.cos(12 * angle + 2 * t)
        vertices.push(c.x, c.y + radius * Math.cos(angle) * flute, c.z + radius * Math.sin(angle) * flute)
      }
    }
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j
        const b = (i + 1) * (sides + 1) + j
        indices.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
    const hornGeometry = new THREE.BufferGeometry()
    hornGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    hornGeometry.setIndex(indices)
    hornGeometry.computeVertexNormals()
    addMesh(hornGeometry, wicker)

    // Bands give the horn a readable woven structure; the mouth remains open.
    for (const t of [0.22, 0.36, 0.49, 0.62, 0.75, 0.88]) {
      const band = addMesh(new THREE.TorusGeometry(radiusAt(t) * 1.018, 0.013, 8, 48), weave)
      band.position.copy(center(t))
      band.rotation.y = Math.PI / 2
    }
    const lip = addMesh(new THREE.TorusGeometry(radiusAt(1), 0.045, 12, 56), weave)
    lip.position.copy(center(1))
    lip.rotation.y = Math.PI / 2
    const inner = addMesh(new THREE.CircleGeometry(radiusAt(1) * 0.94, 48), opening)
    inner.position.copy(center(1)).add(new THREE.Vector3(-0.015, 0, 0))
    inner.rotation.y = Math.PI / 2

    // Produce emerging from the open mouth, recognizable at sidebar size.
    const squash = addSphere(0.99, -0.22, 0.44, 0.31, orange, 1.1, 0.75, 1)
    for (let i = 0; i < 8; i++) {
      const theta = i * Math.PI / 4
      const ridge = addSphere(
        squash.position.x + 0.16 * Math.cos(theta), -0.22,
        squash.position.z + 0.16 * Math.sin(theta), 0.19, pumpkinRib, 0.5, 1.1, 0.5,
      )
      ridge.scale.multiplyScalar(0.95)
    }
    const pumpkinStem = addMesh(new THREE.CylinderGeometry(0.036, 0.054, 0.18, 9), stem)
    pumpkinStem.position.set(0.99, -0.01, 0.44)
    pumpkinStem.rotation.z = 0.2

    addSphere(1.20, 0.18, 0.05, 0.28, red, 0.97, 0.95, 0.95)
    const appleStem = addMesh(new THREE.CylinderGeometry(0.018, 0.024, 0.13, 7), stem)
    appleStem.position.set(1.20, 0.47, 0.05)
    const appleLeaf = addSphere(1.30, 0.51, 0.07, 0.11, leaf, 1.2, 0.23, 0.6)
    appleLeaf.rotation.z = 0.4

    addSphere(1.04, 0.47, -0.38, 0.23, gold, 0.85, 1.1, 0.86)
    addSphere(0.87, -0.42, -0.40, 0.24, green, 0.8, 1.15, 0.85)
    for (const [x, y, z] of [
      [1.40, 0.31, 0.39], [1.57, 0.24, 0.34],
      [1.47, 0.14, 0.49], [1.60, 0.09, 0.45], [1.49, -0.02, 0.45],
    ]) addSphere(x, y, z, 0.10, grape)

    // A slow turn reveals that the horn and produce have volume.
    ornament.position.set(-0.15, 0.02, 0)
    const resize = () => {
      const w = Math.max(mount.clientWidth, 1)
      const h = Math.max(mount.clientHeight, 1)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let visible = true
    let active = true
    const draw = (elapsed: number) => {
      if (!active || !visible || document.hidden) return
      if (!reducedMotion.matches) {
        const seconds = elapsed / 1000
        ornament.rotation.y = 0.19 * Math.sin(seconds * 0.46)
        ornament.rotation.z = 0.025 * Math.sin(seconds * 0.73)
        ornament.position.y = 0.02 + 0.025 * Math.sin(seconds * 1.06)
      }
      renderer.render(scene, camera)
      if (!reducedMotion.matches) raf = window.requestAnimationFrame(draw)
    }
    const restart = () => {
      cancelAnimationFrame(raf)
      if (!active || !visible || document.hidden) return
      raf = window.requestAnimationFrame(draw)
    }
    const onVisibility = () => restart()
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      restart()
    }, { rootMargin: '100px' })
    intersection.observe(mount)
    document.addEventListener('visibilitychange', onVisibility)
    reducedMotion.addEventListener('change', restart)
    restart()

    return () => {
      active = false
      cancelAnimationFrame(raf)
      intersection.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      reducedMotion.removeEventListener('change', restart)
      geometries.forEach(g => g.dispose())
      materials.forEach(m => m.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <figure className="thanksgiving-horn">
      <div ref={mountRef} className="thanksgiving-horn-stage" role="img"
        aria-label="Slowly turning three-dimensional horn of plenty with a pumpkin, apples, grapes, and vegetables">
        <span className="thanksgiving-horn-fallback" aria-hidden="true">
          🍂 Horn of plenty · Thanksgiving
        </span>
      </div>
      <figcaption>Horn of plenty · a little 3D engineering for Thanksgiving</figcaption>
    </figure>
  )
}
