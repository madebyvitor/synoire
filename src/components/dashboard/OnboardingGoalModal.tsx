import { motion } from 'motion/react'
import { useCallback, useState } from 'react'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'
import { validateWeeklyGoalHours } from '@/lib/userStats'

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
  const [hoursInput, setHoursInput] = useState('20')
  const [error, setError] = useState<string | null>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const hours = Number.parseFloat(hoursInput.replace(',', '.'))
      const validationError = validateWeeklyGoalHours(hours)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
      const result = await onSave(hours)
      if (!result.ok) {
        setError(result.message)
      }
    },
    [hoursInput, onSave],
  )

  if (!open) return null

  const parsedHours = Number.parseFloat(hoursInput.replace(',', '.'))
  const validationError = validateWeeklyGoalHours(parsedHours)
  const canSubmit = validationError === null && !isSubmitting

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-goal-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.form
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-xl"
        variants={staggerC}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="visible"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <motion.h2
          id="onboarding-goal-title"
          variants={staggerItem}
          className="text-lg font-semibold text-primary"
        >
          Qual é o seu objetivo?
        </motion.h2>
        <motion.p variants={staggerItem} className="mt-2 text-sm text-secondary">
          Defina quantas horas por semana você pretende focar.
        </motion.p>

        <motion.label variants={staggerItem} className="mt-6 block text-sm text-secondary">
          Horas por semana
          <input
            type="number"
            min={1}
            max={168}
            step={0.5}
            value={hoursInput}
            onChange={(e) => {
              setHoursInput(e.target.value)
              setError(null)
            }}
            placeholder="20"
            className="mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary placeholder:text-secondary/60 focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30"
            autoFocus
            disabled={isSubmitting}
          />
        </motion.label>

        {error && (
          <motion.p variants={staggerItem} className="mt-3 text-sm text-coral" role="alert">
            {error}
          </motion.p>
        )}

        <motion.div variants={staggerItem} className="mt-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-firefly px-4 py-2.5 text-sm font-medium text-night transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando…' : 'Salvar e Começar'}
          </button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
