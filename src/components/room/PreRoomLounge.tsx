import { motion } from 'motion/react'
import { formatTimerSeconds } from '@/lib/roomTimer'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type PreRoomLoungeProps = {
  secondsUntilNextFocus: number
  prefersReducedMotion: boolean
}

export function PreRoomLounge({
  secondsUntilNextFocus,
  prefersReducedMotion,
}: PreRoomLoungeProps) {
  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  return (
    <motion.div
      role="dialog"
      aria-label="Pré-sala de espera"
      className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center bg-night/90 px-6"
      variants={staggerC}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
    >
      <motion.p
        variants={staggerItem}
        className="max-w-md text-center text-sm leading-relaxed text-secondary"
      >
        Preparando a mente para o próximo bloco de foco…
      </motion.p>
      <motion.p
        variants={staggerItem}
        className="mt-10 text-center text-xs font-medium uppercase tracking-[0.18em] text-firefly/80"
        aria-live="polite"
      >
        Próximo ciclo começa em
      </motion.p>
      <motion.p
        variants={staggerItem}
        className="mt-3 font-mono text-5xl font-light tabular-nums tracking-tight text-primary sm:text-6xl"
        aria-live="polite"
      >
        {formatTimerSeconds(secondsUntilNextFocus)}
      </motion.p>
    </motion.div>
  )
}
