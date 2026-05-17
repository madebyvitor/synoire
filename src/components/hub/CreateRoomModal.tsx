import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
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
  onCreate: (theme: string, focusCycle: FocusCycle) => Promise<void>
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
  const [theme, setTheme] = useState('')
  const [focusCycle, setFocusCycle] = useState<FocusCycle>('25/5')
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
      setError(null)
      try {
        await onCreate(result.value, focusCycle)
        setTheme('')
        setFocusCycle('25/5')
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível criar a sala')
      }
    },
    [theme, focusCycle, onCreate, onClose],
  )

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
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#161C24] p-6 shadow-xl"
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
