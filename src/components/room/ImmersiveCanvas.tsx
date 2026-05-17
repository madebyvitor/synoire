import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

type Firefly = {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  pulse: number
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function initFireflies(
  count: number,
  w: number,
  h: number,
  rand: () => number,
): Firefly[] {
  const horizon = h * 0.58
  const out: Firefly[] = []
  for (let i = 0; i < count; i++) {
    out.push({
      x: rand() * w,
      y: horizon + rand() * (h - horizon - 8),
      vx: (rand() - 0.5) * 0.35,
      vy: (rand() - 0.5) * 0.22,
      phase: rand() * Math.PI * 2,
      pulse: 0.6 + rand() * 0.4,
    })
  }
  return out
}

function initStars(
  count: number,
  w: number,
  h: number,
  rand: () => number,
): { x: number; y: number; r: number; tw: number }[] {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * w,
      y: rand() * h * 0.55,
      r: rand() * 1.2 + 0.3,
      tw: rand() * Math.PI * 2,
    })
  }
  return stars
}

type ImmersiveCanvasProps = {
  /** Número de “presenças” mock — limitado internamente por performance */
  presentCount: number
  /** Multiplicador de movimento (ex.: 0.35 na pré-sala) */
  motionSpeed?: number
  /** Velocidade do pulso individual (default 0.0025) */
  pulseSpeed?: number
  /** Timestamp até quando vagalumes pulsam em sincronia (ritual de ciclo) */
  syncFlashUntil?: number
}

export function ImmersiveCanvas({
  presentCount,
  motionSpeed = 1,
  pulseSpeed = 0.0025,
  syncFlashUntil = 0,
}: ImmersiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()
  const firefliesRef = useRef<Firefly[]>([])
  const starsRef = useRef<{ x: number; y: number; r: number; tw: number }[]>(
    [],
  )
  const randRef = useRef(mulberry32(0x9e3779b9))
  const motionSpeedRef = useRef(motionSpeed)
  const pulseSpeedRef = useRef(pulseSpeed)
  const syncFlashUntilRef = useRef(syncFlashUntil)

  motionSpeedRef.current = motionSpeed
  pulseSpeedRef.current = pulseSpeed
  syncFlashUntilRef.current = syncFlashUntil

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const maxFlies = reduced ? 18 : 72
    const n = Math.min(Math.max(4, presentCount), maxFlies)

    let raf = 0
    let t0 = performance.now()

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
      const rand = randRef.current
      starsRef.current = initStars(reduced ? 40 : 90, w, h, rand)
      firefliesRef.current = initFireflies(n, w, h, rand)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const drawHorizon = (w: number, h: number, t: number) => {
      const base = h * 0.52
      ctx.fillStyle = '#070a0e'
      ctx.beginPath()
      ctx.moveTo(0, base)
      ctx.bezierCurveTo(
        w * 0.2,
        base - 18 + Math.sin(t * 0.0004) * 6,
        w * 0.55,
        base + 28 + Math.cos(t * 0.00035) * 8,
        w,
        base + 12,
      )
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#0d1218'
      ctx.beginPath()
      ctx.moveTo(0, base + 36)
      ctx.bezierCurveTo(
        w * 0.25,
        base + 8,
        w * 0.65,
        base + 52,
        w,
        base + 40,
      )
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      ctx.fill()
    }

    const loop = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const t = now - t0

      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65)
      sky.addColorStop(0, '#0b0f14')
      sky.addColorStop(0.45, '#0d1219')
      sky.addColorStop(1, '#111820')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      const stars = starsRef.current
      for (const s of stars) {
        const tw = 0.35 + 0.65 * Math.sin(s.tw + t * 0.0012)
        ctx.fillStyle = `rgba(220, 230, 245, ${0.12 * tw})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      const fog = ctx.createRadialGradient(
        w * 0.5,
        h * 0.35,
        0,
        w * 0.5,
        h * 0.55,
        Math.max(w, h) * 0.55,
      )
      fog.addColorStop(0, 'rgba(22, 28, 36, 0)')
      fog.addColorStop(0.55, 'rgba(18, 24, 32, 0.35)')
      fog.addColorStop(1, 'rgba(11, 15, 20, 0.85)')
      ctx.fillStyle = fog
      ctx.fillRect(0, 0, w, h)

      drawHorizon(w, h, t)

      const flies = firefliesRef.current
      const speed = reduced ? 0.15 : motionSpeedRef.current
      const syncUntil = syncFlashUntilRef.current
      const inSyncFlash = syncUntil > 0 && now < syncUntil

      for (const f of flies) {
        f.x += f.vx * speed
        f.y += f.vy * speed
        if (f.x < -20) f.x = w + 20
        if (f.x > w + 20) f.x = -20
        if (f.y < h * 0.5) f.y = h * 0.52
        if (f.y > h - 10) f.y = h - 12

        const glow = inSyncFlash
          ? 0.9 + 0.1 * Math.sin(t * 0.008)
          : 0.35 +
            0.65 * Math.sin(f.phase + t * pulseSpeedRef.current * f.pulse)
        const r = 2 + glow * 2.2
        ctx.shadowColor = '#d8ff5e'
        ctx.shadowBlur = reduced ? 6 : 14 + glow * 10
        ctx.fillStyle = `rgba(216, 255, 94, ${0.45 + glow * 0.45})`
        ctx.beginPath()
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [presentCount, reduced])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      aria-hidden
    />
  )
}
