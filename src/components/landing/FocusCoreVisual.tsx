import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const NODE_COUNT = 16
const DUST_COUNT = 8
const LINK_DISTANCE = 0.22
const ORBIT_SPEED = 0.00008

type Node = {
  angle: number
  radius: number
  z: number
  wobble: number
  wobblePhase: number
  size: number
}

type Dust = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function initNodes(rand: () => number): Node[] {
  const nodes: Node[] = []
  for (let i = 0; i < NODE_COUNT; i++) {
    const t = i / NODE_COUNT
    nodes.push({
      angle: t * Math.PI * 2 + rand() * 0.4,
      radius: 0.12 + rand() * 0.28,
      z: rand(),
      wobble: 0.02 + rand() * 0.04,
      wobblePhase: rand() * Math.PI * 2,
      size: 1.2 + rand() * 1.4,
    })
  }
  return nodes
}

function initDust(rand: () => number): Dust[] {
  const dust: Dust[] = []
  for (let i = 0; i < DUST_COUNT; i++) {
    dust.push({
      x: rand(),
      y: rand(),
      vx: (rand() - 0.5) * 0.000015,
      vy: (rand() - 0.5) * 0.000012,
      size: 0.4 + rand() * 0.6,
    })
  }
  return dust
}

function nodePosition(
  node: Node,
  cx: number,
  cy: number,
  scale: number,
  t: number,
): { x: number; y: number; depth: number } {
  const wobble =
    Math.sin(t * 0.0004 + node.wobblePhase) * node.wobble * scale
  const r = (node.radius + wobble) * scale
  const a = node.angle + t * ORBIT_SPEED * (0.7 + node.z * 0.6)
  return {
    x: cx + Math.cos(a) * r,
    y: cy + Math.sin(a) * r * 0.55,
    depth: node.z,
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  nodes: Node[],
  dust: Dust[],
  staticMode: boolean,
) {
  const cx = w * 0.5
  const cy = h * 0.5
  const scale = Math.min(w, h) * 0.42

  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#08060c')
  bg.addColorStop(0.5, '#050502')
  bg.addColorStop(1, '#0a0e14')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const breath = staticMode
    ? 0.5
    : 0.5 + 0.5 * Math.sin(t * 0.00045)
  const coreR = scale * (0.08 + breath * 0.04)
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3.5)
  core.addColorStop(0, `rgba(163, 163, 79, ${0.06 + breath * 0.04})`)
  core.addColorStop(0.35, `rgba(107, 143, 122, ${0.03 + breath * 0.02})`)
  core.addColorStop(0.7, 'rgba(8, 6, 12, 0)')
  core.addColorStop(1, 'rgba(5, 5, 2, 0)')
  ctx.fillStyle = core
  ctx.fillRect(0, 0, w, h)

  if (!staticMode) {
    for (let ring = 0; ring < 2; ring++) {
      const phase = (t * 0.00012 + ring * 1.4) % (Math.PI * 2)
      const ringR =
        scale * (0.15 + ((phase / (Math.PI * 2)) % 1) * 0.35)
      const ringAlpha = 0.04 * (1 - ((phase / (Math.PI * 2)) % 1))
      ctx.strokeStyle = `rgba(163, 163, 79, ${ringAlpha})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.ellipse(cx, cy, ringR, ringR * 0.55, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const positions = nodes.map((n) => nodePosition(n, cx, cy, scale, t))

  const linkThreshold = scale * LINK_DISTANCE
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i]
      const b = positions[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.hypot(dx, dy)
      if (dist > linkThreshold) continue

      const proximity = 1 - dist / linkThreshold
      const pulse = staticMode
        ? 0.35
        : 0.35 +
          0.65 *
            Math.sin(
              t * 0.0006 + (i + j) * 0.7 + dist * 0.01,
            ) *
            0.5
      const alpha = proximity * pulse * 0.22
      if (alpha < 0.02) continue

      ctx.strokeStyle = `rgba(245, 245, 240, ${alpha})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }

  for (const d of dust) {
    if (!staticMode) {
      d.x += d.vx * w
      d.y += d.vy * h
      if (d.x < 0) d.x = 1
      if (d.x > 1) d.x = 0
      if (d.y < 0) d.y = 1
      if (d.y > 1) d.y = 0
    }
    const dx = d.x * w
    const dy = d.y * h
    const drift = staticMode
      ? 0.2
      : 0.2 + 0.15 * Math.sin(t * 0.0005 + dx * 0.01)
    ctx.fillStyle = `rgba(245, 245, 240, ${drift * 0.25})`
    ctx.beginPath()
    ctx.arc(dx, dy, d.size, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < positions.length; i++) {
    const { x, y, depth } = positions[i]
    const node = nodes[i]
    const pulse = staticMode
      ? 0.6
      : 0.6 + 0.4 * Math.sin(t * 0.00055 + node.wobblePhase)
    const alpha = (0.2 + depth * 0.35) * pulse
    const r = node.size * (0.7 + depth * 0.5)

    ctx.shadowColor = 'rgba(163, 163, 79, 0.35)'
    ctx.shadowBlur = staticMode ? 4 : 6 + depth * 4
    ctx.fillStyle = `rgba(245, 245, 240, ${alpha})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  const vignette = ctx.createRadialGradient(
    cx,
    cy,
    scale * 0.1,
    cx,
    cy,
    Math.max(w, h) * 0.72,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(0.55, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(5, 5, 2, 0.85)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

export function FocusCoreVisual({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()
  const nodesRef = useRef<Node[]>([])
  const dustRef = useRef<Dust[]>([])
  const randRef = useRef(mulberry32(0xc0ffee42))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rand = randRef.current
    nodesRef.current = initNodes(rand)
    dustRef.current = initDust(rand)

    let raf = 0
    let t0 = performance.now()
    let visible = document.visibilityState !== 'hidden'

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const parent = canvas.parentElement
      const w = Math.max(parent?.clientWidth ?? canvas.clientWidth, 1)
      const h = Math.max(parent?.clientHeight ?? canvas.clientHeight, 1)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement ?? canvas)

    if (reduced) {
      resize()
      drawFrame(
        ctx,
        canvas.clientWidth,
        canvas.clientHeight,
        0,
        nodesRef.current,
        dustRef.current,
        true,
      )
      return () => ro.disconnect()
    }

    const loop = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const t = now - t0
      drawFrame(ctx, w, h, t, nodesRef.current, dustRef.current, false)
      if (visible) raf = requestAnimationFrame(loop)
    }

    const onVisibility = () => {
      const nowVisible = document.visibilityState !== 'hidden'
      if (nowVisible === visible) return
      visible = nowVisible
      if (visible) {
        t0 = performance.now()
        raf = requestAnimationFrame(loop)
      } else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    if (visible) raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
    }
  }, [reduced])

  return (
    <div
      role="img"
      aria-label="Visualização abstrata de energia de foco coletiva"
      className={`relative aspect-[21/9] min-h-[140px] w-full overflow-hidden rounded-none md:min-h-[180px] [mask-image:radial-gradient(ellipse_85%_70%_at_50%_50%,black_20%,transparent_72%)] ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      />
    </div>
  )
}
