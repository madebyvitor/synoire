import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'

type AppToastProps = {
  message: string
  visible: boolean
  onDismiss: () => void
  durationMs?: number
}

export function AppToast({
  message,
  visible,
  onDismiss,
  durationMs = 3000,
}: AppToastProps) {
  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(id)
  }, [visible, message, durationMs, onDismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <p className="rounded-xl border border-firefly/30 bg-[#161C24] px-5 py-3 text-sm font-medium text-primary shadow-[0_0_24px_-4px_#D8FF5E40]">
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
