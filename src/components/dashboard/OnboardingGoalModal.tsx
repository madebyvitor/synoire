import { motion } from 'motion/react'
import { useCallback, useState } from 'react'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'
import { WeeklyGoalOnboardingFields } from './WeeklyGoalOnboardingFields'

type OnboardingGoalModalProps = {
  open: boolean
  onSave: (hours: number) => Promise<{ ok: true } | { ok: false; message: string }>
  prefersReducedMotion: boolean
  isSubmitting?: boolean
}

export function OnboardingGoalModal({
  open,
  onSave,
  prefersReducedMotion,
  isSubmitting = false,
}: OnboardingGoalModalProps) {
  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (hours: number) => {
      setSubmitError(null)
      const result = await onSave(hours)
      if (!result.ok) {
        setSubmitError(result.message)
      }
    },
    [onSave],
  )

  if (!open) return null

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-goal-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-xl"
        variants={staggerC}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="visible"
      >
        <WeeklyGoalOnboardingFields
          staggerItem={staggerItem}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          titleId="onboarding-goal-title"
          externalError={submitError}
        />
      </motion.div>
    </motion.div>
  )
}
