import { motion } from 'motion/react'
import { RoomCyclePills } from '@/components/room/RoomCyclePills'
import { formatTimerSeconds, type RoomPhase } from '@/lib/roomTimer'

const SIZE = 280
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = 118
const TICK_COUNT = 60

type RoomTimerRingProps = {
  phase: RoomPhase
  remainingSeconds: number
  segmentDuration: number
  cycleCount?: number
  showProgress?: boolean
  timerRitualFade?: boolean
  prefersReducedMotion?: boolean
  className?: string
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export function RoomTimerRing({
  phase,
  remainingSeconds,
  segmentDuration,
  cycleCount = 0,
  showProgress = true,
  timerRitualFade = false,
  prefersReducedMotion = false,
  className = '',
}: RoomTimerRingProps) {
  const elapsed =
    segmentDuration > 0
      ? Math.max(0, Math.min(1, 1 - remainingSeconds / segmentDuration))
      : 0
  const progressDeg = showProgress ? elapsed * 360 : 0
  const progressPath =
    progressDeg > 0.5
      ? describeArc(CX, CY, RADIUS, 0, Math.min(progressDeg, 359.9))
      : ''

  const strokeAccent =
    phase === 'focus' ? '#a3a34f' : phase === 'long_break' ? '#7b9eb8' : '#6b8f7a'
  const glowFilter =
    phase === 'focus'
      ? 'drop-shadow(0 0 6px rgba(163,163,79,0.45))'
      : phase === 'long_break'
        ? 'drop-shadow(0 0 8px rgba(123,158,184,0.45))'
        : 'drop-shadow(0 0 6px rgba(107,143,122,0.35))'

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * 360
    const isMajor = i % 5 === 0
    const inner = RADIUS - (isMajor ? 10 : 6)
    const outer = RADIUS - 2
    const a1 = polarToCartesian(CX, CY, inner, angle)
    const a2 = polarToCartesian(CX, CY, outer, angle)
    return { x1: a1.x, y1: a1.y, x2: a2.x, y2: a2.y, major: isMajor }
  })

  return (
    <div
      className={`relative mx-auto w-full max-w-[min(88vw,22rem)] ${className}`}
      style={{ aspectRatio: '1' }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full"
        aria-hidden
      >
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          className="text-border/50"
        />
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeWidth={t.major ? 1 : 0.5}
            className="text-border/60"
          />
        ))}
        {progressPath ? (
          <path
            d={progressPath}
            fill="none"
            stroke={strokeAccent}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ filter: glowFilter }}
          />
        ) : null}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          className="font-serif text-5xl font-medium tabular-nums tracking-tight text-primary sm:text-6xl md:text-7xl"
          initial={timerRitualFade && !prefersReducedMotion ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{
            delay: timerRitualFade && !prefersReducedMotion ? 0.3 : 0,
            duration: 0.6,
          }}
          aria-live="polite"
        >
          {formatTimerSeconds(remainingSeconds)}
        </motion.p>
        <p className="mt-3 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-secondary">
          Restante
        </p>
        <RoomCyclePills
          cycleCount={cycleCount}
          phase={phase}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    </div>
  )
}
