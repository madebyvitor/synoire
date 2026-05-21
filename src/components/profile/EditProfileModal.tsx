import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { MAX_BIO_LENGTH } from '@/lib/profile'
import {
  validateWeeklyGoalHours,
  WEEKLY_GOAL_HOURS_MAX,
  WEEKLY_GOAL_HOURS_MIN,
} from '@/lib/userStats'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary placeholder:text-secondary/60 focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30'

export type EditProfileFormValues = {
  username: string
  targetExam: string
  bio: string
  weeklyGoalHours: string
}

export type EditProfileSavePayload = {
  username: string
  targetExam: string
  bio: string
  weeklyGoalHours: number
}

type EditProfileModalProps = {
  open: boolean
  onClose: () => void
  prefersReducedMotion: boolean
  initialValues: EditProfileFormValues
  onSave: (
    payload: EditProfileSavePayload,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  isSubmitting?: boolean
}

export function EditProfileModal({
  open,
  onClose,
  prefersReducedMotion,
  initialValues,
  onSave,
  isSubmitting = false,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(initialValues.username)
  const [targetExam, setTargetExam] = useState(initialValues.targetExam)
  const [bio, setBio] = useState(initialValues.bio)
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(initialValues.weeklyGoalHours)
  const [error, setError] = useState<string | null>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  useEffect(() => {
    if (!open) return
    setUsername(initialValues.username)
    setTargetExam(initialValues.targetExam)
    setBio(initialValues.bio)
    setWeeklyGoalHours(initialValues.weeklyGoalHours)
    setError(null)
  }, [open, initialValues])

  const handleClose = useCallback(() => {
    setError(null)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const hours = Number.parseFloat(weeklyGoalHours.replace(',', '.'))
      const validationError = validateWeeklyGoalHours(hours)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
      const result = await onSave({
        username,
        targetExam,
        bio,
        weeklyGoalHours: hours,
      })
      if (!result.ok) {
        setError(result.message)
      }
    },
    [username, targetExam, bio, weeklyGoalHours, onSave],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isSubmitting, handleClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={isSubmitting ? undefined : handleClose}
        >
          <motion.div
            className="pointer-events-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-panel p-6 shadow-xl"
            variants={staggerC}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={(e) => void handleSubmit(e)}>
              <motion.h2
                id="edit-profile-title"
                variants={staggerItem}
                className="text-lg font-semibold text-primary"
              >
                Editar perfil
              </motion.h2>
              <motion.p variants={staggerItem} className="mt-2 text-sm text-secondary">
                Atualize seu nome, concurso-alvo, bio e meta semanal.
              </motion.p>

              <motion.label variants={staggerItem} className="mt-5 block text-sm text-secondary">
                Nome de usuário
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError(null)
                  }}
                  placeholder="seu_usuario"
                  autoComplete="username"
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </motion.label>

              <motion.label variants={staggerItem} className="mt-4 block text-sm text-secondary">
                Concurso-alvo
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => {
                    setTargetExam(e.target.value)
                    setError(null)
                  }}
                  placeholder="policia-federal"
                  autoComplete="off"
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </motion.label>

              <motion.label variants={staggerItem} className="mt-4 block text-sm text-secondary">
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value)
                    setError(null)
                  }}
                  placeholder="Estudando 4h por dia. Rumo à aprovação!"
                  rows={4}
                  maxLength={MAX_BIO_LENGTH}
                  className={`${inputClass} resize-y`}
                  disabled={isSubmitting}
                />
              </motion.label>

              <motion.label variants={staggerItem} className="mt-4 block text-sm text-secondary">
                Meta semanal (horas)
                <input
                  type="number"
                  min={WEEKLY_GOAL_HOURS_MIN}
                  max={WEEKLY_GOAL_HOURS_MAX}
                  step={0.5}
                  value={weeklyGoalHours}
                  onChange={(e) => {
                    setWeeklyGoalHours(e.target.value)
                    setError(null)
                  }}
                  placeholder="20"
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </motion.label>

              {error && (
                <motion.p variants={staggerItem} className="mt-3 text-sm text-coral" role="alert">
                  {error}
                </motion.p>
              )}

              <motion.div variants={staggerItem} className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-xl px-4 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="rounded-xl border border-firefly/30 bg-firefly/10 px-4 py-2 text-sm font-medium text-firefly transition hover:border-firefly/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
