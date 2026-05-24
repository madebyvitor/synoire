import { motion } from 'motion/react'
import { CYCLES_BEFORE_LONG_BREAK } from '@/lib/hubRooms/cycles'
import type { RoomPhase } from '@/lib/roomTimer'

type RoomCyclePillsProps = {
  cycleCount: number
  phase: RoomPhase
  prefersReducedMotion?: boolean
  className?: string
}

export function RoomCyclePills({
  cycleCount,
  phase,
  prefersReducedMotion = false,
  className = '',
}: RoomCyclePillsProps) {
  const filled = (cycleCount ?? 0) % CYCLES_BEFORE_LONG_BREAK
  const isLongBreak = phase === 'long_break'

  return (
    <div
      className={`mt-4 flex items-center justify-center gap-1.5 ${className}`}
      aria-label={`Ciclo Pomodoro: ${filled} de ${CYCLES_BEFORE_LONG_BREAK} blocos de foco`}
    >
      {Array.from({ length: CYCLES_BEFORE_LONG_BREAK }, (_, i) => {
        const active = !isLongBreak && i < filled
        const pillClass = isLongBreak
          ? 'bg-sky-400/80'
          : active
            ? 'bg-green-400'
            : 'bg-white/20'

        if (isLongBreak && !prefersReducedMotion) {
          return (
            <motion.span
              key={i}
              className={`h-1.5 w-3 rounded-full ${pillClass}`}
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          )
        }

        return (
          <span
            key={i}
            className={`h-1.5 w-3 rounded-full transition-all duration-300 ${pillClass}`}
          />
        )
      })}
    </div>
  )
}
