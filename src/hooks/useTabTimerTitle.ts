import { useEffect } from 'react'
import { formatTimerSeconds, type RoomPhase } from '@/lib/roomTimer'

const DEFAULT_TITLE = 'Synoire'

type UseTabTimerTitleInput = {
  remainingSeconds: number
  phase: RoomPhase
  isIdle: boolean
  enabled?: boolean
}

function buildTabTitle(
  remainingSeconds: number,
  phase: RoomPhase,
  isIdle: boolean,
): string {
  const time = formatTimerSeconds(remainingSeconds)
  if (isIdle) return `(${time}) Preparando - ${DEFAULT_TITLE}`
  const label =
    phase === 'focus'
      ? 'Foco'
      : phase === 'long_break'
        ? 'Pausa Longa'
        : 'Pausa'
  return `(${time}) ${label} - ${DEFAULT_TITLE}`
}

export function useTabTimerTitle({
  remainingSeconds,
  phase,
  isIdle,
  enabled = true,
}: UseTabTimerTitleInput): void {
  useEffect(() => {
    if (!enabled) {
      document.title = DEFAULT_TITLE
      return
    }

    document.title = buildTabTitle(remainingSeconds, phase, isIdle)

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [remainingSeconds, phase, isIdle, enabled])
}
