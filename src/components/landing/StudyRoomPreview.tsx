import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ImmersiveCanvas } from '@/components/room/ImmersiveCanvas'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const MOCK_PRESENT = 28

type StudyRoomPreviewProps = {
  size?: 'compact' | 'cinema'
  className?: string
  lazy?: boolean
}

export function StudyRoomPreview({
  size = 'compact',
  className = '',
  lazy = false,
}: StudyRoomPreviewProps) {
  const reduced = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(!lazy)

  useEffect(() => {
    if (!lazy || active) return
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          io.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [lazy, active])

  const isCinema = size === 'cinema'

  const heightClass = isCinema
    ? 'min-h-[min(72vh,520px)] sm:min-h-[min(68vh,560px)]'
    : 'aspect-[16/10] min-h-[220px] sm:min-h-[280px]'

  return (
    <motion.div
      ref={rootRef}
      role="img"
      aria-label="Prévia da sala de estudo Synoire com timer Pomodoro, silhueta noturna e vaga-lumes"
      className={`relative overflow-hidden rounded-2xl border border-border bg-night shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_24px_48px_-12px_rgba(0,0,0,0.55),0_0_40px_-8px_rgba(163,163,79,0.08)] ${heightClass} ${className}`}
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={
        reduced
          ? undefined
          : { duration: 7, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <div className="absolute inset-0 z-0">
        {active && (
          <ImmersiveCanvas
            presentCount={MOCK_PRESENT}
            variant="preview"
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-night/80 via-night/20 to-transparent" />

      <div
        className={`relative z-20 flex h-full flex-col items-center justify-center px-4 ${isCinema ? 'pb-8 pt-12' : 'py-8'}`}
        aria-hidden
      >
        <p className="text-center text-[0.65rem] font-medium uppercase tracking-[0.2em] text-firefly sm:text-xs">
          Sessão de foco
        </p>
        <p
          className={`mt-2 text-center font-mono font-light tabular-nums tracking-tight text-primary ${isCinema ? 'text-6xl sm:text-7xl md:text-8xl' : 'text-4xl sm:text-5xl md:text-6xl'}`}
        >
          25:00
        </p>
        <p className="mt-2 text-center text-xs text-secondary sm:text-sm">
          {MOCK_PRESENT} presentes
        </p>
      </div>

      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-3 sm:p-4"
        aria-hidden
      >
        <span className="rounded-lg px-2 py-1.5 text-xs text-secondary/80">
          Sair
        </span>
        <span className="rounded-lg px-2 py-1.5 text-xs text-secondary/80">
          Som
        </span>
      </div>
    </motion.div>
  )
}
