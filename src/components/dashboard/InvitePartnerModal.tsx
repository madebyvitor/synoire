import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type InvitePartnerModalProps = {
  open: boolean
  onClose: () => void
  prefersReducedMotion: boolean
  onSend: (username: string) => { ok: true } | { ok: false; error: string }
}

export function InvitePartnerModal({
  open,
  onClose,
  prefersReducedMotion,
  onSend,
}: InvitePartnerModalProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  const handleClose = useCallback(() => {
    setUsername('')
    setError(null)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const result = onSend(username)
      if (!result.ok) {
        setError(result.error)
        return
      }
      handleClose()
    },
    [username, onSend, handleClose],
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
          aria-labelledby="invite-partner-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/5 bg-panel p-6 shadow-[0_0_24px_-4px_rgba(163,163,79,0.25)]"
            variants={staggerC}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <motion.h2
                id="invite-partner-title"
                variants={staggerItem}
                className="text-lg font-semibold text-primary"
              >
                Convidar parceiro
              </motion.h2>
              <motion.p variants={staggerItem} className="mt-2 text-sm text-secondary">
                Digite o @username do estudante.
              </motion.p>

              <motion.label variants={staggerItem} className="mt-5 block text-sm text-secondary">
                Username
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError(null)
                  }}
                  placeholder="@usuario"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary placeholder:text-secondary/60 focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30"
                  autoFocus
                />
              </motion.label>

              {error && (
                <motion.p variants={staggerItem} className="mt-3 text-sm text-secondary" role="alert">
                  {error}
                </motion.p>
              )}

              <motion.div variants={staggerItem} className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl px-4 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-firefly/30 bg-firefly/10 px-4 py-2 text-sm font-medium text-firefly transition hover:border-firefly/50 hover:brightness-110"
                >
                  Enviar
                </button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
