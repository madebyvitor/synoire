import { motion } from 'motion/react'
import { formatTimerSeconds, type RoomPhase } from '@/lib/roomTimer'
import {
  pageStaggerContainer,
  pageStaggerItem,
  pageStaggerListInner,
} from '@/motion/pageStagger'

type SessionOnboardingProps = {
  title: string
  phase: RoomPhase
  remainingSeconds: number
  presentCount: number
  prefersReducedMotion: boolean
  onJoinCurrent: () => void
  onWaitNext: () => void
}

export function SessionOnboarding({
  title,
  phase,
  remainingSeconds,
  presentCount,
  prefersReducedMotion,
  onJoinCurrent,
  onWaitNext,
}: SessionOnboardingProps) {
  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)
  const staggerBtnRow = pageStaggerListInner(prefersReducedMotion)

  const contextLabel =
    phase === 'focus' ? 'Sala em foco agora' : 'Sala em pausa'

  return (
    <motion.div
      role="dialog"
      aria-label="Onboarding da sessão"
      className="pointer-events-auto fixed inset-0 z-30 flex flex-col items-center justify-center bg-night/75 px-6 backdrop-blur-sm"
      variants={staggerC}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
    >
      <motion.p
        variants={staggerItem}
        className={`text-center text-xs font-medium uppercase tracking-[0.2em] ${
          phase === 'focus' ? 'text-firefly' : 'text-aqua'
        }`}
      >
        {contextLabel}
      </motion.p>

      {title ? (
        <motion.h1
          variants={staggerItem}
          className="mt-3 text-center text-lg font-normal text-primary sm:text-xl"
        >
          {title}
        </motion.h1>
      ) : null}

      <motion.p
        variants={staggerItem}
        className="mt-8 text-center text-sm text-secondary"
      >
        {formatTimerSeconds(remainingSeconds)} restantes
      </motion.p>

      <motion.p
        variants={staggerItem}
        className="mt-4 text-center text-sm text-secondary"
      >
        {presentCount} luzes ativas
      </motion.p>

      <motion.div
        variants={staggerBtnRow}
        className="mt-12 flex max-w-sm flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
      >
        <motion.div variants={staggerItem} className="w-full sm:w-auto">
          <button
            type="button"
            onClick={onJoinCurrent}
            className="w-full rounded-xl bg-firefly px-6 py-3 text-sm font-medium text-night hover:brightness-110 sm:w-auto"
          >
            Entrar no ciclo atual
          </button>
        </motion.div>
        <motion.div variants={staggerItem} className="w-full sm:w-auto">
          <button
            type="button"
            onClick={onWaitNext}
            className="w-full rounded-xl border border-border px-6 py-3 text-sm font-medium text-primary hover:bg-elevated sm:w-auto"
          >
            Aguardar próximo ciclo
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
