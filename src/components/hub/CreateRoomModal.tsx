import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { LockIcon } from '@/components/premium/LockIcon'
import { useUserPlan } from '@/contexts/UserPlanContext'
import {
  FOCUS_CYCLE_OPTIONS,
  THEME_MAX_LENGTH,
  validateTheme,
  type FocusCycle,
} from '@/lib/hubRooms'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type CreateRoomModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (theme: string, focusCycle: FocusCycle, isPrivate: boolean) => Promise<void>
  prefersReducedMotion: boolean
  isSubmitting?: boolean
}

export function CreateRoomModal({
  open,
  onClose,
  onCreate,
  prefersReducedMotion,
  isSubmitting = false,
}: CreateRoomModalProps) {
  const { hasGlowAccess, openPaywall } = useUserPlan()
  const [theme, setTheme] = useState('')
  const [focusCycle, setFocusCycle] = useState<FocusCycle>('25/5')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  const validation = validateTheme(theme)
  const canSubmit = validation.ok && !isSubmitting

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const result = validateTheme(theme)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (isPrivate && !hasGlowAccess) {
        openPaywall()
        return
      }
      setError(null)
      try {
        await onCreate(result.value, focusCycle, isPrivate)
        setTheme('')
        setFocusCycle('25/5')
        setIsPrivate(false)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível criar a sala')
      }
    },
    [theme, focusCycle, isPrivate, hasGlowAccess, openPaywall, onCreate, onClose],
  )

  const handlePrivateToggle = useCallback(() => {
    if (!hasGlowAccess) {
      openPaywall()
      return
    }
    setIsPrivate((v) => !v)
  }, [hasGlowAccess, openPaywall])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-xl"
        variants={staggerC}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="visible"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => void handleSubmit(e)}
      >
        <motion.h2
          id="create-room-title"
          variants={staggerItem}
          className="text-lg font-semibold text-primary"
        >
          O que vamos estudar agora?
        </motion.h2>

        <motion.label variants={staggerItem} className="mt-6 block text-sm text-secondary">
          Tema
          <input
            type="text"
            value={theme}
            maxLength={THEME_MAX_LENGTH}
            onChange={(e) => {
              setTheme(e.target.value)
              setError(null)
            }}
            placeholder="Ex: Direito Administrativo"
            className="mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary placeholder:text-secondary/60 focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30"
            autoFocus
          />
          <span className="mt-1 block text-right text-xs text-secondary/80">
            {theme.trim().length}/{THEME_MAX_LENGTH}
          </span>
        </motion.label>

        <motion.label variants={staggerItem} className="mt-4 block text-sm text-secondary">
          Ciclo de foco
          <select
            value={focusCycle}
            onChange={(e) => setFocusCycle(e.target.value as FocusCycle)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30"
          >
            {FOCUS_CYCLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </motion.label>

        <motion.div variants={staggerItem} className="mt-4">
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={handlePrivateToggle}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-night/40 px-4 py-3 text-left text-sm transition hover:bg-white/5"
          >
            <span className="flex items-center gap-2 text-secondary">
              Criar como Sala Privada
              {!hasGlowAccess && (
                <LockIcon className="h-4 w-4 text-firefly/80" />
              )}
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                isPrivate && hasGlowAccess ? 'bg-firefly' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-primary shadow transition ${
                  isPrivate && hasGlowAccess ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </motion.div>

        {error && (
          <motion.p variants={staggerItem} className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </motion.p>
        )}

        <motion.div variants={staggerItem} className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-secondary hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 rounded-xl bg-firefly px-4 py-3 text-sm font-medium text-night hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Criando…' : 'Criar'}
          </button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
