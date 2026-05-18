import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import {
  REQUEST_NAME_MAX,
  submitHubRequest,
  validateRequestName,
} from '@/lib/hubRequests'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type HubRequestModalProps = {
  open: boolean
  onClose: () => void
  prefersReducedMotion: boolean
}

export function HubRequestModal({
  open,
  onClose,
  prefersReducedMotion,
}: HubRequestModalProps) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  const validation = validateRequestName(name)
  const canSubmit = validation.ok && !isSubmitting

  const handleClose = useCallback(() => {
    setName('')
    setError(null)
    setIsSuccess(false)
    setIsSubmitting(false)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const result = validateRequestName(name)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        await submitHubRequest(result.value)
        setIsSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível enviar a sugestão.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name],
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
          aria-labelledby="hub-request-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-xl"
            variants={staggerC}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            onClick={(e) => e.stopPropagation()}
          >
            {isSuccess ? (
              <div>
                <motion.h2
                  id="hub-request-title"
                  variants={staggerItem}
                  className="text-lg font-semibold text-primary"
                >
                  Sugestão enviada
                </motion.h2>
                <motion.p variants={staggerItem} className="mt-4 text-sm leading-relaxed text-secondary">
                  Sua sugestão foi enviada! Avaliaremos a criação deste ambiente em breve.
                </motion.p>
                <motion.div variants={staggerItem} className="mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full rounded-xl bg-firefly px-4 py-3 text-sm font-medium text-night hover:brightness-110"
                  >
                    Fechar
                  </button>
                </motion.div>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)}>
                <motion.h2
                  id="hub-request-title"
                  variants={staggerItem}
                  className="text-lg font-semibold text-primary"
                >
                  Sugerir novo Hub
                </motion.h2>
                <motion.p variants={staggerItem} className="mt-2 text-sm leading-relaxed text-secondary">
                  Qual concurso você gostaria de ver aqui? Nossa equipe avaliará a criação
                  deste ambiente.
                </motion.p>

                <motion.label variants={staggerItem} className="mt-6 block text-sm text-secondary">
                  Nome do concurso
                  <input
                    type="text"
                    value={name}
                    maxLength={REQUEST_NAME_MAX}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError(null)
                    }}
                    placeholder="Ex: Tribunal de Justiça de SP"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary placeholder:text-secondary/60 focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30"
                    autoFocus
                  />
                </motion.label>

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
                    {isSubmitting ? 'Enviando…' : 'Enviar Sugestão'}
                  </button>
                </motion.div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
