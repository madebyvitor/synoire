import { advanceTimerOnSegmentComplete } from './advanceTimerSegment'
export { advanceTimerOnSegmentComplete } from './advanceTimerSegment'
import { toPersistedTimer } from './mapRoomRow'
import { resolveTimerCatchUp } from './resolveTimerCatchUp'
import type { PersistedTimerState, StudyRoom } from './types'

/** Wall-clock catch-up; null if persisted state is already current. */
export function catchUpTimerState(
  room: StudyRoom,
  now: Date | number = Date.now(),
): PersistedTimerState | null {
  const { resolved, changed } = resolveTimerCatchUp(room.current_timer_state, now)
  if (!changed) return null
  return toPersistedTimer(resolved, room.focus_cycle)
}

export function nextFocusTimerState(room: StudyRoom): PersistedTimerState | null {
  const ts = room.current_timer_state
  if (ts.status !== 'idle') return null
  const now = new Date().toISOString()
  return toPersistedTimer(
    {
      ...ts,
      status: 'focus',
      started_at: now,
    },
    room.focus_cycle,
  )
}

export function nextAdvancedTimerState(room: StudyRoom): PersistedTimerState | null {
  const ts = room.current_timer_state
  if (ts.status === 'idle' || !ts.started_at) return null
  const advanced = advanceTimerOnSegmentComplete(ts)
  if (!advanced) return null
  const now = new Date().toISOString()
  return toPersistedTimer({ ...advanced, started_at: now }, room.focus_cycle)
}
