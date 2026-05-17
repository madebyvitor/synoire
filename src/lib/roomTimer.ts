export const FOCUS_SECONDS = 25 * 60
export const BREAK_SECONDS = 5 * 60

export type RoomPhase = 'focus' | 'break'

export type RoomTimerState = {
  phase: RoomPhase
  startedAt: string | Date
  presentCount?: number
}

export function getSegmentDuration(phase: RoomPhase): number {
  return phase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS
}

export function getNextPhase(phase: RoomPhase): RoomPhase {
  return phase === 'focus' ? 'break' : 'focus'
}

function toMs(value: string | Date): number {
  return typeof value === 'string' ? new Date(value).getTime() : value.getTime()
}

export function getCyclePosition(
  now: Date | number,
  startedAt: string | Date,
  phase: RoomPhase,
) {
  const nowMs = typeof now === 'number' ? now : now.getTime()
  const startMs = toMs(startedAt)
  const segmentDuration = getSegmentDuration(phase)
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000))
  const remainingSeconds = Math.max(0, segmentDuration - elapsedSeconds)
  const isComplete = elapsedSeconds >= segmentDuration

  return {
    elapsedSeconds,
    remainingSeconds,
    segmentDuration,
    isComplete,
  }
}

export function secondsUntilNextFocus(
  now: Date | number,
  state: Pick<RoomTimerState, 'phase' | 'startedAt'>,
): number {
  const { phase, startedAt } = state
  const { remainingSeconds } = getCyclePosition(now, startedAt, phase)

  if (phase === 'break') {
    return remainingSeconds
  }

  return remainingSeconds + BREAK_SECONDS
}

export function buildAdvancedState(
  prev: RoomTimerState,
  now: Date = new Date(),
): RoomTimerState {
  return {
    ...prev,
    phase: getNextPhase(prev.phase),
    startedAt: now.toISOString(),
  }
}

export function formatTimerSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
