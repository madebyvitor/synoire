import { describe, expect, it } from 'vitest'
import { getCyclePosition } from '@/lib/roomTimer'
import { resolveTimerCatchUp } from './resolveTimerCatchUp'
import type { RoomTimerPayload } from './types'
import { ROOM_PREP_SECONDS } from './types'

const t0 = new Date('2026-05-16T12:00:00.000Z')
const cycle25_5 = { focus_sec: 1500, break_sec: 300 }

function payload(
  overrides: Partial<RoomTimerPayload> & Pick<RoomTimerPayload, 'status'>,
): RoomTimerPayload {
  return { ...cycle25_5, started_at: null, ...overrides }
}

describe('resolveTimerCatchUp', () => {
  it('keeps idle with ~58s prep when only 2s elapsed', () => {
    const state = payload({
      status: 'idle',
      started_at: new Date(t0.getTime() - 2 * 1000).toISOString(),
    })
    const { resolved, changed } = resolveTimerCatchUp(state, t0)
    expect(changed).toBe(false)
    expect(resolved.status).toBe('idle')
    expect(
      ROOM_PREP_SECONDS -
        Math.floor((t0.getTime() - new Date(resolved.started_at!).getTime()) / 1000),
    ).toBe(58)
  })

  it('promotes idle to focus after prep window (90s elapsed)', () => {
    const prepStart = new Date(t0.getTime() - 90 * 1000).toISOString()
    const state = payload({ status: 'idle', started_at: prepStart })
    const { resolved, changed } = resolveTimerCatchUp(state, t0)
    expect(changed).toBe(true)
    expect(resolved.status).toBe('focus')
    const prepEndMs = new Date(prepStart).getTime() + ROOM_PREP_SECONDS * 1000
    expect(resolved.started_at).toBe(new Date(prepEndMs).toISOString())
    const { remainingSeconds } = getCyclePosition(
      t0,
      resolved.started_at!,
      'focus',
      { focusSec: 1500, breakSec: 300 },
    )
    expect(remainingSeconds).toBe(1500 - 30)
  })

  it('lands in break with time left after long focus (27 min ago)', () => {
    const focusStart = new Date(t0.getTime() - 27 * 60 * 1000).toISOString()
    const state = payload({ status: 'focus', started_at: focusStart })
    const { resolved, changed } = resolveTimerCatchUp(state, t0)
    expect(changed).toBe(true)
    expect(resolved.status).toBe('break')
    const { remainingSeconds } = getCyclePosition(
      t0,
      resolved.started_at!,
      'break',
      { focusSec: 1500, breakSec: 300 },
    )
    expect(remainingSeconds).toBeGreaterThan(0)
    expect(remainingSeconds).toBeLessThanOrEqual(300)
  })

  it('advances completed break into new focus segment (6 min in break)', () => {
    const breakStart = new Date(t0.getTime() - 6 * 60 * 1000).toISOString()
    const state = payload({ status: 'break', started_at: breakStart })
    const { resolved, changed } = resolveTimerCatchUp(state, t0)
    expect(changed).toBe(true)
    expect(resolved.status).toBe('focus')
    const { remainingSeconds, isComplete } = getCyclePosition(
      t0,
      resolved.started_at!,
      'focus',
      { focusSec: 1500, breakSec: 300 },
    )
    expect(isComplete).toBe(false)
    expect(remainingSeconds).toBeGreaterThan(0)
  })

  it('does not change idle without started_at', () => {
    const state = payload({ status: 'idle', started_at: null })
    const { resolved, changed } = resolveTimerCatchUp(state, t0)
    expect(changed).toBe(false)
    expect(resolved).toEqual(state)
  })

  it('enters long_break after 4th focus when cycle_count was 3', () => {
    const focusStart = new Date(t0.getTime() - 26 * 60 * 1000).toISOString()
    const state = payload({
      status: 'focus',
      started_at: focusStart,
      cycle_count: 3,
    })
    const { resolved, changed } = resolveTimerCatchUp(state, t0)
    expect(changed).toBe(true)
    expect(resolved.status).toBe('long_break')
    expect(resolved.cycle_count).toBe(4)
  })

  it('advances completed long_break into focus', () => {
    const longBreakStart = new Date(t0.getTime() - 16 * 60 * 1000).toISOString()
    const state = payload({
      status: 'long_break',
      started_at: longBreakStart,
      cycle_count: 4,
    })
    const { resolved, changed } = resolveTimerCatchUp(state, t0)
    expect(changed).toBe(true)
    expect(resolved.status).toBe('focus')
    expect(resolved.cycle_count).toBe(4)
  })

  it('defaults missing cycle_count to 0 on first focus completion', () => {
    const focusStart = new Date(t0.getTime() - 26 * 60 * 1000).toISOString()
    const state = payload({ status: 'focus', started_at: focusStart })
    const { resolved, changed } = resolveTimerCatchUp(state, t0)
    expect(changed).toBe(true)
    expect(resolved.status).toBe('break')
    expect(resolved.cycle_count).toBe(1)
  })
})
