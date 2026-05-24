import { getCyclePosition, type RoomCycleConfig, type RoomPhase } from '@/lib/roomTimer'
import { advanceTimerOnSegmentComplete } from './advanceTimerSegment'
import { timerPayloadToCycleConfig } from './utils'
import type { RoomTimerPayload, RoomTimerStatus } from './types'
import { ROOM_PREP_SECONDS } from './types'

const MAX_CATCH_UP_STEPS = 10_000

function activePhase(status: Exclude<RoomTimerStatus, 'idle'>): RoomPhase {
  return status
}

export function timerStatesEqual(a: RoomTimerPayload, b: RoomTimerPayload): boolean {
  return (
    a.status === b.status &&
    a.started_at === b.started_at &&
    a.focus_sec === b.focus_sec &&
    a.break_sec === b.break_sec &&
    (a.cycle_count ?? 0) === (b.cycle_count ?? 0)
  )
}

function toNowMs(now: Date | number): number {
  return typeof now === 'number' ? now : now.getTime()
}

function advanceCompletedSegment(
  payload: RoomTimerPayload,
  startedAt: string,
  config: RoomCycleConfig,
  nowMs: number,
): { payload: RoomTimerPayload; startedAt: string; done: boolean } {
  const status = payload.status as Exclude<RoomTimerStatus, 'idle'>
  const phase = activePhase(status)
  const { isComplete, segmentDuration } = getCyclePosition(
    nowMs,
    startedAt,
    phase,
    config,
  )
  if (!isComplete) {
    return { payload, startedAt, done: true }
  }

  const startMs = new Date(startedAt).getTime()
  if (!Number.isFinite(startMs)) {
    return { payload, startedAt, done: true }
  }

  const advanced = advanceTimerOnSegmentComplete(payload)
  if (!advanced) {
    return { payload, startedAt, done: true }
  }

  const nextStartMs = startMs + segmentDuration * 1000
  const nextStartedAt = new Date(nextStartMs).toISOString()
  return {
    payload: advanced,
    startedAt: nextStartedAt,
    done: false,
  }
}

/**
 * Derives wall-clock timer state from persisted payload (idle prep + focus/break cycle).
 * Presence is not required; used for display and one-shot DB sync.
 */
export function resolveTimerCatchUp(
  state: RoomTimerPayload,
  now: Date | number = Date.now(),
): { resolved: RoomTimerPayload; changed: boolean } {
  const nowMs = toNowMs(now)
  const config = timerPayloadToCycleConfig(state)

  let status = state.status
  let started_at = state.started_at
  let cycle_count = state.cycle_count

  if (status === 'idle') {
    if (!started_at) {
      return { resolved: state, changed: false }
    }
    const prepStartMs = new Date(started_at).getTime()
    if (!Number.isFinite(prepStartMs)) {
      return { resolved: state, changed: false }
    }
    const prepEndMs = prepStartMs + ROOM_PREP_SECONDS * 1000
    if (nowMs < prepEndMs) {
      return { resolved: state, changed: false }
    }
    status = 'focus'
    started_at = new Date(prepEndMs).toISOString()
  }

  if (!started_at) {
    return { resolved: state, changed: false }
  }

  let payload: RoomTimerPayload = {
    status,
    started_at,
    focus_sec: state.focus_sec,
    break_sec: state.break_sec,
    cycle_count,
  }

  let steps = 0
  while (steps < MAX_CATCH_UP_STEPS) {
    steps += 1
    const step = advanceCompletedSegment(payload, started_at!, config, nowMs)
    payload = step.payload
    started_at = step.startedAt
    cycle_count = payload.cycle_count
    if (step.done) break
  }

  const resolved: RoomTimerPayload = {
    status: payload.status,
    started_at,
    focus_sec: state.focus_sec,
    break_sec: state.break_sec,
    cycle_count: payload.cycle_count,
  }

  return {
    resolved,
    changed: !timerStatesEqual(state, resolved),
  }
}
