import { useEffect, useRef } from 'react'
import './HalloweenTruss.css'

type Point3 = readonly [number, number, number]
type Beam = { from: number; to: number; material: 'rib' | 'hoop' | 'brace' | 'stem' }

// A pumpkin-shaped spatial framework, not an image rotated in 2D.
// Meridians curve from top to base, horizontal hoops stabilize the frame,
// and a few diagonal braces give it a recognizable engineering character.
const vertices: Point3[] = []
const beams: Beam[] = []
const ribs = 10
const rings = 9
for (let band = 0; band < rings; band++) {
  const phi = (band + 1) * Math.PI / (rings + 1)
  const y = 0.81 * Math.cos(phi)
  const radius = 0.94 * Math.pow(Math.sin(phi), 0.62)
  for (let rib = 0; rib < ribs; rib++) {
    const theta = rib * 2 * Math.PI / ribs
    const lobe = 1 + 0.065 * Math.cos(10 * theta)
    vertices.push([radius * lobe * Math.cos(theta), y, radius * lobe * Math.sin(theta)])
    if (band > 0) beams.push({ from: (band - 1) * ribs + rib, to: band * ribs + rib, material: 'rib' })
    if (band === 2 || band === 4 || band === 6) beams.push({
      from: band * ribs + rib,
      to: band * ribs + (rib + 1) % ribs,
      material: 'hoop',
    })
    if ((band === 3 || band === 5) && rib % 2 === 0) beams.push({
      from: (band - 1) * ribs + rib,
      to: band * ribs + (rib + 1) % ribs,
      material: 'brace',
    })
  }
}
const top = vertices.push([0, 0.84, 0]) - 1
const bottom = vertices.push([0, -0.84, 0]) - 1
for (let rib = 0; rib < ribs; rib++) {
  beams.push({ from: top, to: rib, material: 'rib' })
  beams.push({ from: (rings - 1) * ribs + rib, to: bottom, material: 'rib' })
}
const stemBase = vertices.push([0, 0.83, 0]) - 1
const stemBend = vertices.push([0.03, 1.0, 0.02]) - 1
const stemTip = vertices.push([0.13, 1.1, 0.03]) - 1
beams.push({ from: stemBase, to: stemBend, material: 'stem' })
beams.push({ from: stemBend, to: stemTip, material: 'stem' })

function draw(ctx: CanvasRenderingContext2D, width: number, height: number, angle: number) {
  ctx.clearRect(0, 0, width, height)
  const tilt = -0.20
  const projected = vertices.map(([x, y, z]) => {
    const rx = x * Math.cos(angle) + z * Math.sin(angle)
    const rz = z * Math.cos(angle) - x * Math.sin(angle)
    const ry = y * Math.cos(tilt) - rz * Math.sin(tilt)
    const depth = y * Math.sin(tilt) + rz * Math.cos(tilt)
    const scale = 2.9 / (2.9 - depth * 0.34)
    const radius = Math.min(width * 0.39, height * 0.40)
    return { x: width * 0.5 + rx * radius * scale, y: height * 0.52 - ry * radius * scale, z: depth }
  })

  const ordered = beams.map(beam => ({
    ...beam,
    a: projected[beam.from],
    b: projected[beam.to],
    depth: (projected[beam.from].z + projected[beam.to].z) * 0.5,
  })).sort((a, b) => a.depth - b.depth)

  for (const beam of ordered) {
    const front = Math.max(0, Math.min(1, (beam.depth + 1) * 0.5))
    const opacity = 0.23 + front * 0.7
    ctx.beginPath()
    ctx.moveTo(beam.a.x, beam.a.y)
    ctx.lineTo(beam.b.x, beam.b.y)
    ctx.lineWidth = beam.material === 'stem' ? 2.7 : beam.material === 'brace' ? 0.85 : 1.15 + front * 0.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = beam.material === 'stem'
      ? `rgba(49, 106, 77, ${0.60 + front * 0.35})`
      : beam.material === 'brace'
        ? `rgba(52, 119, 136, ${opacity * 0.65})`
        : beam.material === 'hoop'
          ? `rgba(122, 83, 50, ${opacity * 0.75})`
          : `rgba(193, 103, 40, ${opacity})`
    ctx.stroke()
  }

  // Only the front structural joints are drawn, for a calm CAD-like look.
  projected.slice(0, rings * ribs).forEach(point => {
    if (point.z < 0.25) return
    ctx.beginPath()
    ctx.arc(point.x, point.y, 1.15, 0, 2 * Math.PI)
    ctx.fillStyle = '#b87744'
    ctx.fill()
  })
}

export default function HalloweenTruss() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let start = 0

    const render = (timestamp = 0) => {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!start) start = timestamp
      draw(ctx, width, height, reducedMotion.matches ? 0.45 : 0.45 + (timestamp - start) * 0.00020)
      if (!reducedMotion.matches) frame = requestAnimationFrame(render)
    }

    const restart = () => {
      cancelAnimationFrame(frame)
      start = 0
      frame = requestAnimationFrame(render)
    }
    restart()
    reducedMotion.addEventListener('change', restart)
    return () => {
      cancelAnimationFrame(frame)
      reducedMotion.removeEventListener('change', restart)
    }
  }, [])

  return (
    <figure className="halloween-truss">
      <div className="halloween-truss-stage" role="img" aria-label="Slowly rotating three-dimensional pumpkin-shaped engineering truss with orange ribs and green stem">
        <canvas ref={canvasRef} className="halloween-truss-canvas" aria-hidden="true" />
        <span className="halloween-truss-shadow" aria-hidden="true" />
      </div>
      <figcaption>Pumpkin truss · seasonal structural study</figcaption>
    </figure>
  )
}
