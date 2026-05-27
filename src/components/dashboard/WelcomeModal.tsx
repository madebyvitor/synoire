import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'
import { WeeklyGoalOnboardingFields } from './WeeklyGoalOnboardingFields'

const FEATURES = [
  {
    emoji: '🏛️',
    title: 'Hubs & Salas',
    description: 'Junte-se a comunidades ou crie o seu próprio espaço.',
  },
  {
    emoji: '🍅',
    title: 'Pomodoro Inteligente',
    description: 'Ciclos de foco com pausas curtas e longas.',
  },
  {
    emoji: '🔥',
    title: 'Streaks',
    description: 'Estude todos os dias e mantenha a sua ofensiva viva.',
  },
] as const

type WelcomeModalProps = {
  open: boolean
  onComplete: (hours: number) => Promise<{ ok: true } | { ok: false; message: string }>
  prefersReducedMotion: boolean
  isSubmitting?: boolean
}

export function WelcomeModal({
  open,
  onComplete,
  prefersReducedMotion,
  isSubmitting = false,
}: WelcomeModalProps) {
  const [step, setStep] = useState<'welcome' | 'goal'>('welcome')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  useEffect(() => {
    if (!open) {
      setStep('welcome')
      setSubmitError(null)
    }
  }, [open])

  const handleGoalSubmit = useCallback(
    async (hours: number) => {
      setSubmitError(null)
      const result = await onComplete(hours)
      if (!result.ok) {
        setSubmitError(result.message)
      }
    },
    [onComplete],
  )

  if (!open) return null

  const stepExit = prefersReducedMotion
    ? undefined
    : { opacity: 0, x: 12 as const }

  const stepExitGoal = prefersReducedMotion
    ? undefined
    : { opacity: 0, x: -12 as const }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={step === 'welcome' ? 'welcome-title' : 'welcome-goal-title'}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/80 p-6 shadow-xl shadow-firefly/5 backdrop-blur-md"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {step === 'welcome' ? (
            <motion.div
              key="welcome"
              variants={staggerC}
              initial={prefersReducedMotion ? false : 'hidden'}
              animate="visible"
              exit={stepExit}
              transition={{ duration: 0.2 }}
            >
              <motion.div variants={staggerItem} className="flex justify-center px-4">
                <img
                  src="/logoSynoire.svg"
                  alt=""
                  aria-hidden
                  className="h-auto w-full max-w-[12rem] max-h-20 object-contain drop-shadow-[0_0_20px_rgba(163,163,79,0.55)]"
                />
              </motion.div>

              <motion.h2
                id="welcome-title"
                variants={staggerItem}
                className="mt-4 text-center text-xl font-semibold text-primary"
              >
                Bem-vindo ao Synoire
              </motion.h2>
              <motion.p variants={staggerItem} className="mt-3 text-center text-sm text-secondary">
                Seu novo refúgio de foco profundo. Esqueça as distrações e mergulhe em um ambiente
                feito para a sua máxima produtividade.
              </motion.p>

              <motion.ul variants={staggerItem} className="mt-6 space-y-4">
                {FEATURES.map((feature) => (
                  <li
                    key={feature.title}
                    className="flex gap-3 rounded-xl border border-white/5 bg-night/40 px-4 py-3"
                  >
                    <span className="text-xl" aria-hidden>
                      {feature.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-primary">{feature.title}</p>
                      <p className="mt-0.5 text-xs text-secondary">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </motion.ul>

              <motion.div variants={staggerItem} className="mt-8">
                <button
                  type="button"
                  onClick={() => setStep('goal')}
                  className="w-full rounded-xl bg-firefly px-4 py-3 text-sm font-medium text-night shadow-[0_0_28px_-4px_rgba(163,163,79,0.55)] transition hover:brightness-110"
                >
                  Definir minha Meta
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="goal"
              variants={staggerC}
              initial={prefersReducedMotion ? false : 'hidden'}
              animate="visible"
              exit={stepExitGoal}
              transition={{ duration: 0.2 }}
            >
              <WeeklyGoalOnboardingFields
                staggerItem={staggerItem}
                onSubmit={handleGoalSubmit}
                isSubmitting={isSubmitting}
                titleId="welcome-goal-title"
                externalError={submitError}
                useStagger
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
