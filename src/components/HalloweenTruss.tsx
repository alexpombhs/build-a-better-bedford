import { useEffect, useRef } from 'react'
import './HalloweenTruss.css'

type Point3 = readonly [number, number, number]
type Edge = readonly [number, number]

// An icosahedron has actual 3D vertices and structural edges. Each frame
// projects those points onto the canvas, rather than spinning a flat SVG.
const goldenRatio = (1 + Math.sqrt(5)) / 2
const rawVertices: Point3[] = [
  [0, -1, -goldenRatio], [0, -1, goldenRatio],
  [0, 1, -goldenRatio], [0, 1, goldenRatio],
  [-1, -goldenRatio, 0], [-1, goldenRatio, 0],
  [1, -goldenRatio, 0], [1, goldenRatio, 0],
  [-goldenRatio, 0, -1], [goldenRatio, 0, -1],
  [-goldenRatio, 0, 1], [goldenRatio, 0, 1],
]
const vertices = rawVertices.map(([x, y, z]): Point3 => {
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
})
const edges: Edge[] = vertices.flatMap((a, i) =>
  vertices.slice(i + 1).flatMap((b, offset) => {
    const distance = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
    return distance < 1.1 ? [[i, i + offset + 1] as Edge] : []
  }),
)

function paint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angle: number,
) {
  ctx.clearRect(0, 0, width, height)

  const tilt = -0.25
  const yaw = angle
  const projected = vertices.map(([x, y, z]) => {
    const rotatedX = x * Math.cos(yaw) + z * Math.sin(yaw)
    const rotatedZ = z * Math.cos(yaw) - x * Math.sin(yaw)
    const rotatedY = y * Math.cos(tilt) - rotatedZ * Math.sin(tilt)
    const depth = y * Math.sin(tilt) + rotatedZ * Math.cos(tilt)
    const perspective = 2.9 / (2.9 - depth * 0.35)
    const radius = Math.min(width * 0.31, height * 0.37)
    return { x: width / 2 + rotatedX * radius * perspective, y: height * 0.48 + rotatedY * radius * perspective, z: depth }
  })

  // Rear braces are subtle; front braces get crisp depth and definition.
  const ordered = edges.map(([from, to], i) => ({
    from: projected[from], to: projected[to], depth: (projected[from].z + projected[to].z) / 2, index: i,
  })).sort((a, b) => a.depth - b.depth)

  for (const edge of ordered) {
    const front = Math.max(0, Math.min(1, (edge.depth + 1) / 2))
    ctx.beginPath()
    ctx.moveTo(edge.from.x, edge.from.y)
    ctx.lineTo(edge.to.x, edge.to.y)
    ctx.lineWidth = 0.9 + front * 0.8
    ctx.strokeStyle = edge.index % 7 === 0
      ? `rgba(53, 132, 152, ${0.36 + front * 0.48})`
      : `rgba(52, 65, 60, ${0.22 + front * 0.7})`
    ctx.stroke()
  }

  projected.forEach(point => {
    if (point.z < 0.05) return
    ctx.beginPath()
    ctx.arc(point.x, point.y, 1.4, 0, Math.PI * 2)
    ctx.fillStyle = '#4d625a'
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
      const angle = reducedMotion.matches ? 0.42 : 0.42 + (timestamp - start) * 0.00024
      paint(ctx, width, height, angle)
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
      <div className="halloween-truss-stage" role="img" aria-label="Slowly rotating three-dimensional wireframe engineering sculpture">
        <canvas ref={canvasRef} className="halloween-truss-canvas" aria-hidden="true" />
        <span className="halloween-truss-shadow" aria-hidden="true" />
      </div>
      <figcaption>Structural geometry · icosahedron study</figcaption>
    </figure>
  )
}
