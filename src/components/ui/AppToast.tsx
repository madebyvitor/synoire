import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'

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
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(() => onDismissRef.current(), durationMs)
    return () => window.clearTimeout(id)
  }, [visible, message, durationMs])

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
          <p className="rounded-xl border border-firefly/30 bg-panel px-5 py-3 text-sm font-medium text-primary shadow-[0_0_24px_-4px_rgba(163,163,79,0.25)]">
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
