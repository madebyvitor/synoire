import { motion, type Variants } from 'motion/react'
import { useCallback, useState } from 'react'
import { validateWeeklyGoalHours } from '@/lib/userStats'

type WeeklyGoalOnboardingFieldsProps = {
  staggerItem: Variants
  onSubmit: (hours: number) => void | Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  titleId?: string
  showHeading?: boolean
  externalError?: string | null
  useStagger?: boolean
}

export function WeeklyGoalOnboardingFields({
  staggerItem,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Salvar e Começar',
  titleId = 'weekly-goal-title',
  showHeading = true,
  externalError = null,
  useStagger = true,
}: WeeklyGoalOnboardingFieldsProps) {
  const [hoursInput, setHoursInput] = useState('20')
  const [error, setError] = useState<string | null>(null)

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
      await onSubmit(hours)
    },
    [hoursInput, onSubmit],
  )

  const parsedHours = Number.parseFloat(hoursInput.replace(',', '.'))
  const validationError = validateWeeklyGoalHours(parsedHours)
  const canSubmit = validationError === null && !isSubmitting
  const displayError = error ?? externalError

  const Title = useStagger ? motion.h2 : 'h2'
  const Subtitle = useStagger ? motion.p : 'p'
  const Label = useStagger ? motion.label : 'label'
  const ErrorText = useStagger ? motion.p : 'p'
  const SubmitWrap = useStagger ? motion.div : 'div'
  const staggerProps = useStagger ? { variants: staggerItem } : {}

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      {showHeading && (
        <>
          <Title
            id={titleId}
            {...staggerProps}
            className="text-lg font-semibold text-primary"
          >
            Qual é o seu objetivo?
          </Title>
          <Subtitle {...staggerProps} className="mt-2 text-sm text-secondary">
            Defina quantas horas por semana você pretende focar.
          </Subtitle>
        </>
      )}

      <Label {...staggerProps} className="mt-6 block text-sm text-secondary">
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
      </Label>

      {displayError && (
        <ErrorText {...staggerProps} className="mt-3 text-sm text-coral" role="alert">
          {displayError}
        </ErrorText>
      )}

      <SubmitWrap {...staggerProps} className="mt-6">
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-firefly px-4 py-2.5 text-sm font-medium text-night shadow-[0_0_24px_-4px_rgba(163,163,79,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando…' : submitLabel}
        </button>
      </SubmitWrap>
    </form>
  )
}
