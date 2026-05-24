import { describe, expect, it } from 'vitest'
import { advanceTimerOnSegmentComplete } from './advanceTimerSegment'
import { nextAdvancedTimerState } from './timerMutations'
import type { RoomTimerPayload, StudyRoom } from './types'

function payload(
  overrides: Partial<RoomTimerPayload> & Pick<RoomTimerPayload, 'status'>,
): RoomTimerPayload {
  return {
    focus_sec: 1500,
    break_sec: 300,
    started_at: '2026-05-16T12:00:00.000Z',
    ...overrides,
  }
}

describe('advanceTimerOnSegmentComplete', () => {
  it('moves focus to break and increments cycle_count from 0', () => {
    const next = advanceTimerOnSegmentComplete(payload({ status: 'focus' }))
    expect(next).toEqual({
      focus_sec: 1500,
      break_sec: 300,
      started_at: '2026-05-16T12:00:00.000Z',
      status: 'break',
      cycle_count: 1,
    })
  })

  it('moves 3rd completed focus to break with cycle_count 3', () => {
    const next = advanceTimerOnSegmentComplete(
      payload({ status: 'focus', cycle_count: 2 }),
    )
    expect(next?.status).toBe('break')
    expect(next?.cycle_count).toBe(3)
  })

  it('moves 4th completed focus to long_break with cycle_count 4', () => {
    const next = advanceTimerOnSegmentComplete(
      payload({ status: 'focus', cycle_count: 3 }),
    )
    expect(next?.status).toBe('long_break')
    expect(next?.cycle_count).toBe(4)
  })

  it('returns to focus after break without changing cycle_count', () => {
    const next = advanceTimerOnSegmentComplete(
      payload({ status: 'break', cycle_count: 2 }),
    )
    expect(next?.status).toBe('focus')
    expect(next?.cycle_count).toBe(2)
  })

  it('returns to focus after long_break keeping cycle_count', () => {
    const next = advanceTimerOnSegmentComplete(
      payload({ status: 'long_break', cycle_count: 4 }),
    )
    expect(next?.status).toBe('focus')
    expect(next?.cycle_count).toBe(4)
  })
})

describe('nextAdvancedTimerState', () => {
  const baseRoom: StudyRoom = {
    id: 'r1',
    hub_slug: 'trt',
    name: 'Sala',
    focus_cycle: '25/5',
    is_private: false,
    creator_id: 'u1',
    present_count: 0,
    empty_since: null,
    created_at: '2026-05-16T12:00:00.000Z',
    current_timer_state: payload({ status: 'focus', cycle_count: 3 }),
  }

  it('persists long_break after 4th focus', () => {
    const next = nextAdvancedTimerState(baseRoom)
    expect(next?.status).toBe('long_break')
    expect(next?.cycle_count).toBe(4)
    expect(next?.focus_cycle).toBe('25/5')
  })
})
