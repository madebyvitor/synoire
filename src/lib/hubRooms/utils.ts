import { getCycleDurations } from './cycles'
import {
  formatTimerSeconds,
  getCyclePosition,
  secondsUntilNextFocus,
  type RoomCycleConfig,
} from '@/lib/roomTimer'
import type { FocusCycle, RoomTimerPayload, StudyRoom } from './types'
import {
  ROOM_EMPTY_TTL_HOURS,
  ROOM_PREP_SECONDS,
  THEME_MAX_LENGTH as MAX_LEN,
} from './types'

export { THEME_MAX_LENGTH } from './types'

export function buildRoomName(theme: string, cycle: FocusCycle): string {
  return `${theme.trim()} • ${cycle}`
}

export function validateTheme(theme: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = theme.trim()
  if (!value) return { ok: false, error: 'Informe o tema do estudo.' }
  if (value.length > MAX_LEN) {
    return { ok: false, error: `Máximo de ${MAX_LEN} caracteres.` }
  }
  return { ok: true, value }
}

export function buildIdleTimerState(
  cycle: FocusCycle,
  prepStartedAt: string = new Date().toISOString(),
): RoomTimerPayload {
  const { focusSec, breakSec } = getCycleDurations(cycle)
  return {
    status: 'idle',
    started_at: prepStartedAt,
    focus_sec: focusSec,
    break_sec: breakSec,
  }
}

export function getPrepRemainingSeconds(
  state: RoomTimerPayload,
  now: Date | number = Date.now(),
): number {
  if (state.status !== 'idle') return 0
  if (!state.started_at) return ROOM_PREP_SECONDS
  const nowMs = typeof now === 'number' ? now : now.getTime()
  const startMs = new Date(state.started_at).getTime()
  if (!Number.isFinite(startMs)) return ROOM_PREP_SECONDS
  const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000))
  return Math.max(0, ROOM_PREP_SECONDS - elapsed)
}

export function isPrepComplete(
  state: RoomTimerPayload,
  now: Date | number = Date.now(),
): boolean {
  return state.status === 'idle' && getPrepRemainingSeconds(state, now) === 0
}

/** Payload shape for future Supabase `rooms.insert`. */
export function buildCreatePayload(
  hubSlug: string,
  theme: string,
  cycle: FocusCycle,
  prepStartedAt: string = new Date().toISOString(),
) {
  const trimmed = theme.trim()
  return {
    hub_slug: hubSlug,
    name: buildRoomName(trimmed, cycle),
    is_private: false,
    current_timer_state: buildIdleTimerState(cycle, prepStartedAt),
  }
}

export function timerPayloadToCycleConfig(state: RoomTimerPayload): RoomCycleConfig {
  return { focusSec: state.focus_sec, breakSec: state.break_sec }
}

export function isRoomExpired(room: StudyRoom, nowMs = Date.now()): boolean {
  if (room.present_count > 0) return false
  if (!room.empty_since) return false
  const emptyMs = new Date(room.empty_since).getTime()
  if (!Number.isFinite(emptyMs)) return false
  return nowMs - emptyMs >= ROOM_EMPTY_TTL_HOURS * 60 * 60 * 1000
}

export function filterVisibleRooms(rooms: StudyRoom[], nowMs = Date.now()): StudyRoom[] {
  return rooms.filter((r) => !isRoomExpired(r, nowMs))
}

export function formatRoomCardTimeLabel(
  state: RoomTimerPayload,
  now: Date | number = Date.now(),
): string {
  if (state.status === 'focus' && state.started_at) {
    const { isComplete } = getCyclePosition(
      now,
      state.started_at,
      'focus',
      timerPayloadToCycleConfig(state),
    )
    if (!isComplete) return 'Em foco agora'
  }

  if (state.status === 'idle') {
    return `Começa em ${formatTimerSeconds(getPrepRemainingSeconds(state, now))}`
  }

  if (state.status === 'break' && state.started_at) {
    const secs = secondsUntilNextFocus(
      now,
      { phase: 'break', startedAt: state.started_at },
      timerPayloadToCycleConfig(state),
    )
    return `Começa em ${formatTimerSeconds(secs)}`
  }

  if (state.status === 'focus' && state.started_at) {
    const secs = secondsUntilNextFocus(
      now,
      { phase: 'focus', startedAt: state.started_at },
      timerPayloadToCycleConfig(state),
    )
    return `Começa em ${formatTimerSeconds(secs)}`
  }

  return `Começa em ${formatTimerSeconds(ROOM_PREP_SECONDS)}`
}

export function timerPayloadToRoomPhase(
  state: RoomTimerPayload,
): 'focus' | 'break' | null {
  if (state.status === 'idle') return null
  if (state.status === 'focus') return 'focus'
  return 'break'
}
