import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { LockIcon } from '@/components/premium/LockIcon'
import {
  PRIVATE_HUB_ICON_OPTIONS,
  PRIVATE_HUB_NAME_MAX,
  validatePrivateHubName,
} from '@/lib/privateHubs'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type CreatePrivateHubModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (payload: { name: string; iconEmoji?: string }) => Promise<void>
  prefersReducedMotion: boolean
}

export function CreatePrivateHubModal({
  open,
  onClose,
  onCreate,
  prefersReducedMotion,
}: CreatePrivateHubModalProps) {
  const [name, setName] = useState('')
  const [iconEmoji, setIconEmoji] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  const validation = validatePrivateHubName(name)
  const canSubmit = validation.ok && !isSubmitting

  const handleClose = useCallback(() => {
    setName('')
    setIconEmoji(undefined)
    setError(null)
    setIsSubmitting(false)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const result = validatePrivateHubName(name)
      if (result.ok === false) {
        setError(result.error)
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        await onCreate({ name: result.value, iconEmoji })
        setName('')
        setIconEmoji(undefined)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível criar o hub.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, iconEmoji, onCreate, onClose],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-private-hub-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-firefly/30 bg-panel p-6 shadow-[0_0_24px_-4px_rgba(163,163,79,0.25)]"
            variants={staggerC}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={(e) => void handleSubmit(e)}>
              <motion.div variants={staggerItem} className="flex items-start gap-2">
                <LockIcon className="mt-1 h-4 w-4 shrink-0 text-firefly/80" />
                <motion.h2
                  id="create-private-hub-title"
                  className="text-lg font-semibold leading-snug text-primary"
                >
                  Criar Hub Privado (Exclusivo Glow)
                </motion.h2>
              </motion.div>

              <motion.p variants={staggerItem} className="mt-3 text-sm leading-relaxed text-secondary">
                Este Hub será invisível para o público. Apenas você e as pessoas que convidar
                poderão aceder às salas de estudo.
              </motion.p>

              <motion.label variants={staggerItem} className="mt-6 block text-sm text-secondary">
                Nome do Hub
                <input
                  type="text"
                  value={name}
                  maxLength={PRIVATE_HUB_NAME_MAX}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError(null)
                  }}
                  placeholder="Ex: Mentoria Polícia Federal - Turma A"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary placeholder:text-secondary/60 focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30"
                  autoFocus
                />
              </motion.label>

              <motion.fieldset variants={staggerItem} className="mt-4">
                <legend className="text-sm text-secondary">Ícone (opcional)</legend>
                <motion.div className="mt-2 flex flex-wrap gap-2">
                  {PRIVATE_HUB_ICON_OPTIONS.map((emoji) => {
                    const selected = iconEmoji === emoji
                    return (
                      <button
                        key={emoji}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setIconEmoji(selected ? undefined : emoji)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition ${
                          selected
                            ? 'border-firefly/40 bg-firefly/10'
                            : 'border-white/10 bg-night/40 hover:border-white/20'
                        }`}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </motion.div>
              </motion.fieldset>

              {error && (
                <motion.p variants={staggerItem} className="mt-3 text-sm text-secondary" role="alert">
                  {error}
                </motion.p>
              )}

              <motion.div variants={staggerItem} className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-secondary hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 rounded-xl bg-firefly px-4 py-3 text-sm font-medium text-night hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? 'Criando…' : 'Criar Ambiente Privado'}
                </button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
