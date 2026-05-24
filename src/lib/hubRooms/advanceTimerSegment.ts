import { CYCLES_BEFORE_LONG_BREAK } from './cycles'
import type { RoomTimerPayload } from './types'

/** Next timer payload after a focus/break/long_break segment completes (started_at unchanged). */
export function advanceTimerOnSegmentComplete(
  state: RoomTimerPayload,
): RoomTimerPayload | null {
  const count = state.cycle_count ?? 0
  if (state.status === 'focus') {
    const newCount = count + 1
    if (newCount % CYCLES_BEFORE_LONG_BREAK === 0) {
      return { ...state, status: 'long_break', cycle_count: newCount }
    }
    return { ...state, status: 'break', cycle_count: newCount }
  }
  if (state.status === 'break' || state.status === 'long_break') {
    return { ...state, status: 'focus', cycle_count: count }
  }
  return null
}
