import { CYCLES_BEFORE_LONG_BREAK, LONG_BREAK_SECONDS } from '@/lib/hubRooms/cycles'

export const FOCUS_SECONDS = 25 * 60
export const BREAK_SECONDS = 5 * 60

export type RoomPhase = 'focus' | 'break' | 'long_break'

export type RoomCycleConfig = {
  focusSec: number
  breakSec: number
}

export const DEFAULT_CYCLE_CONFIG: RoomCycleConfig = {
  focusSec: FOCUS_SECONDS,
  breakSec: BREAK_SECONDS,
}

export type RoomTimerState = {
  phase: RoomPhase
  startedAt: string | Date
  presentCount?: number
  cycle?: RoomCycleConfig
  cycleCount?: number
}

export function getSegmentDuration(
  phase: RoomPhase,
  config: RoomCycleConfig = DEFAULT_CYCLE_CONFIG,
): number {
  if (phase === 'focus') return config.focusSec
  if (phase === 'long_break') return LONG_BREAK_SECONDS
  return config.breakSec
}

export function getNextPhase(phase: RoomPhase): RoomPhase {
  if (phase === 'focus') return 'break'
  return 'focus'
}

function toMs(value: string | Date): number {
  return typeof value === 'string' ? new Date(value).getTime() : value.getTime()
}

export function getCyclePosition(
  now: Date | number,
  startedAt: string | Date,
  phase: RoomPhase,
  config: RoomCycleConfig = DEFAULT_CYCLE_CONFIG,
) {
  const nowMs = typeof now === 'number' ? now : now.getTime()
  const startMs = toMs(startedAt)
  const segmentDuration = getSegmentDuration(phase, config)
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
  config: RoomCycleConfig = DEFAULT_CYCLE_CONFIG,
): number {
  const { phase, startedAt } = state
  const { remainingSeconds } = getCyclePosition(now, startedAt, phase, config)

  if (phase === 'break' || phase === 'long_break') {
    return remainingSeconds
  }

  return remainingSeconds + config.breakSec
}

export function buildAdvancedState(
  prev: RoomTimerState,
  now: Date = new Date(),
  config: RoomCycleConfig = prev.cycle ?? DEFAULT_CYCLE_CONFIG,
): RoomTimerState {
  const count = prev.cycleCount ?? 0
  if (prev.phase === 'focus') {
    const newCount = count + 1
    const phase: RoomPhase =
      newCount % CYCLES_BEFORE_LONG_BREAK === 0 ? 'long_break' : 'break'
    return {
      ...prev,
      phase,
      cycleCount: newCount,
      startedAt: now.toISOString(),
      cycle: config,
    }
  }
  return {
    ...prev,
    phase: 'focus',
    cycleCount: count,
    startedAt: now.toISOString(),
    cycle: config,
  }
}

export function formatTimerSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
