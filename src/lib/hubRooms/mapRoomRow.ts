import { getCycleDurations } from './cycles'
import type {
  FocusCycle,
  PersistedTimerState,
  RoomRow,
  RoomTimerPayload,
  StudyRoom,
} from './types'

const FOCUS_CYCLES: FocusCycle[] = ['25/5', '50/10', '90/15']

export function inferFocusCycle(focusSec: number, breakSec: number): FocusCycle {
  for (const cycle of FOCUS_CYCLES) {
    const d = getCycleDurations(cycle)
    if (d.focusSec === focusSec && d.breakSec === breakSec) return cycle
  }
  return '25/5'
}

export function persistedToPayload(state: PersistedTimerState): RoomTimerPayload {
  const { focus_cycle: _cycle, ...payload } = state
  return payload
}

export function toPersistedTimer(
  payload: RoomTimerPayload,
  focusCycle: FocusCycle,
): PersistedTimerState {
  return { ...payload, focus_cycle: focusCycle }
}

export function mapRoomRow(
  row: RoomRow,
  hubSlug: string,
  ephemeral: { present_count?: number; empty_since?: string | null } = {},
): StudyRoom {
  const timer = row.current_timer_state ?? ({} as PersistedTimerState)
  const focus_cycle =
    timer.focus_cycle ?? inferFocusCycle(timer.focus_sec ?? 1500, timer.break_sec ?? 300)

  return {
    id: row.id,
    hub_slug: hubSlug,
    name: row.name,
    focus_cycle,
    is_private: row.is_private,
    creator_id: row.creator_id,
    current_timer_state: persistedToPayload({
      status: timer.status ?? 'idle',
      started_at: timer.started_at ?? null,
      focus_sec: timer.focus_sec ?? getCycleDurations(focus_cycle).focusSec,
      break_sec: timer.break_sec ?? getCycleDurations(focus_cycle).breakSec,
      cycle_count: timer.cycle_count,
      focus_cycle,
    }),
    created_at: row.created_at,
    present_count: ephemeral.present_count ?? 0,
    empty_since: ephemeral.empty_since ?? null,
  }
}

export function toTimerPatch(state: PersistedTimerState): {
  current_timer_state: PersistedTimerState
} {
  return { current_timer_state: state }
}
