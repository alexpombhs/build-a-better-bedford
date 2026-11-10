import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './WinterSnowman.css'

/** A small transparent 3D snowman ornament, like our other seasonal club sculptures. */
export default function WinterSnowman() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      mount.dataset.webglUnavailable = 'true'
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-hidden', 'true')
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30)
    camera.position.set(0, 1, 7.4)
    camera.lookAt(0, 0.13, 0)
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbed2df, 2.4))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
    keyLight.position.set(-3, 5, 4)
    scene.add(keyLight)

    const snow = new THREE.MeshStandardMaterial({ color: 0xf2f8fb, roughness: 0.75 })
    const navy = new THREE.MeshStandardMaterial({ color: 0x3f5465, roughness: 0.65 })
    const ice = new THREE.MeshStandardMaterial({ color: 0xb5d8df, roughness: 0.65 })
    const orange = new THREE.MeshStandardMaterial({ color: 0xe3a457, roughness: 0.72 })
    const branch = new THREE.MeshStandardMaterial({ color: 0x8b776e, roughness: 0.9 })
    const materials = [snow, navy, ice, orange, branch]
    const geometries: THREE.BufferGeometry[] = []
    const person = new THREE.Group()
    scene.add(person)

    const part = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
      geometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y, z)
      person.add(mesh)
      return mesh
    }
    part(new THREE.SphereGeometry(0.85, 24, 20), snow, 0, -0.62, 0)
    part(new THREE.SphereGeometry(0.61, 24, 20), snow, 0, 0.42, 0)
    part(new THREE.SphereGeometry(0.42, 24, 20), snow, 0, 1.23, 0)
    for (const x of [-0.17, 0.17]) part(new THREE.SphereGeometry(0.045, 12, 10), navy, x, 1.3, 0.39)
    const nose = part(new THREE.ConeGeometry(0.09, 0.43, 12), orange, 0, 1.15, 0.53)
    nose.rotation.x = Math.PI / 2
    for (const y of [0.58, 0.24, -0.16]) part(new THREE.SphereGeometry(0.045, 12, 10), navy, 0, y, 0.58)
    part(new THREE.CylinderGeometry(0.43, 0.43, 0.07, 24), navy, 0, 1.64, 0)
    part(new THREE.CylinderGeometry(0.3, 0.35, 0.37, 24), navy, 0, 1.85, 0)
    const brim = part(new THREE.TorusGeometry(0.47, 0.075, 8, 28), ice, 0, 0.95, 0)
    brim.rotation.x = Math.PI / 2

    for (const side of [-1, 1]) {
      const arm = part(new THREE.CylinderGeometry(0.037, 0.042, 0.95, 8), branch, side * 0.9, 0.34, 0)
      arm.rotation.z = side * 1.06
      const twig = part(new THREE.CylinderGeometry(0.02, 0.026, 0.31, 7), branch, side * 1.21, 0.63, 0)
      twig.rotation.z = side * 0.58
    }

    const resize = () => {
      const size = Math.max(160, Math.min(290, mount.clientWidth || 220))
      renderer.setSize(size, size, false)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const clock = new THREE.Clock()
    const animate = () => {
      frame = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      person.rotation.y = reduceMotion.matches ? -0.26 : Math.sin(t * 0.35) * 0.42
      person.position.y = reduceMotion.matches ? 0 : Math.sin(t * 1.25) * 0.045
      renderer.render(scene, camera)
    }
    animate()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={mountRef} className="bbb-winter-snowman" role="img" aria-label="A small snowman gently turning in the winter club corner">
    <span className="bbb-winter-snowman-fallback" aria-hidden="true">☃</span>
  </div>
}
