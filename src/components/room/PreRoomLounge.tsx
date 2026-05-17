import { motion } from 'motion/react'
import { formatTimerSeconds, type RoomPhase } from '@/lib/roomTimer'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type PreRoomLoungeProps = {
  /** Remaining time in the current segment (prep, focus, or break). */
  remainingSeconds: number
  phase: RoomPhase
  isPrep: boolean
  prefersReducedMotion: boolean
}

function loungeCopy(isPrep: boolean, phase: RoomPhase) {
  if (isPrep) {
    return {
      subtitle: 'Preparando a mente para o próximo bloco de foco…',
      countdownLabel: 'Ritual começa em',
    }
  }
  if (phase === 'focus') {
    return {
      subtitle: 'Aguardando a pausa do ciclo em andamento…',
      countdownLabel: 'Pausa começa em',
    }
  }
  return {
    subtitle: 'Aguardando o próximo bloco de foco…',
    countdownLabel: 'Próximo foco começa em',
  }
}

export function PreRoomLounge({
  remainingSeconds,
  phase,
  isPrep,
  prefersReducedMotion,
}: PreRoomLoungeProps) {
  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)
  const copy = loungeCopy(isPrep, phase)

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
        {copy.subtitle}
      </motion.p>
      <motion.p
        variants={staggerItem}
        className="mt-10 text-center text-xs font-medium uppercase tracking-[0.18em] text-firefly/80"
        aria-live="polite"
      >
        {copy.countdownLabel}
      </motion.p>
      <motion.p
        variants={staggerItem}
        className="mt-3 font-mono text-5xl font-light tabular-nums tracking-tight text-primary sm:text-6xl"
        aria-live="polite"
      >
        {formatTimerSeconds(remainingSeconds)}
      </motion.p>
    </motion.div>
  )
}
