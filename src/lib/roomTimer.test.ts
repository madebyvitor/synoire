import { describe, expect, it } from 'vitest'
import { LONG_BREAK_SECONDS } from '@/lib/hubRooms/cycles'
import {
  BREAK_SECONDS,
  FOCUS_SECONDS,
  buildAdvancedState,
  getCyclePosition,
  getNextPhase,
  getSegmentDuration,
  secondsUntilNextFocus,
} from './roomTimer'

const t0 = new Date('2026-05-16T12:00:00.000Z')

describe('getCyclePosition', () => {
  it('returns full remaining at segment start', () => {
    const pos = getCyclePosition(t0, t0, 'focus')
    expect(pos.remainingSeconds).toBe(FOCUS_SECONDS)
    expect(pos.isComplete).toBe(false)
  })

  it('returns mid-cycle remaining', () => {
    const now = new Date(t0.getTime() + 13 * 60 * 1000)
    const pos = getCyclePosition(now, t0, 'focus')
    expect(pos.remainingSeconds).toBe(FOCUS_SECONDS - 13 * 60)
  })

  it('clamps to zero when segment elapsed', () => {
    const now = new Date(t0.getTime() + FOCUS_SECONDS * 1000)
    const pos = getCyclePosition(now, t0, 'focus')
    expect(pos.remainingSeconds).toBe(0)
    expect(pos.isComplete).toBe(true)
  })
})

describe('getSegmentDuration', () => {
  it('uses fixed duration for long_break', () => {
    expect(getSegmentDuration('long_break')).toBe(LONG_BREAK_SECONDS)
  })
})

describe('secondsUntilNextFocus', () => {
  it('during break equals break remaining', () => {
    const startedAt = new Date(t0.getTime() - 2 * 60 * 1000)
    const secs = secondsUntilNextFocus(t0, { phase: 'break', startedAt })
    expect(secs).toBe(BREAK_SECONDS - 2 * 60)
  })

  it('during long_break equals long break remaining', () => {
    const startedAt = new Date(t0.getTime() - 5 * 60 * 1000)
    const secs = secondsUntilNextFocus(t0, { phase: 'long_break', startedAt })
    expect(secs).toBe(LONG_BREAK_SECONDS - 5 * 60)
  })

  it('during focus equals focus remaining plus full break', () => {
    const startedAt = new Date(t0.getTime() - 10 * 60 * 1000)
    const secs = secondsUntilNextFocus(t0, { phase: 'focus', startedAt })
    expect(secs).toBe(FOCUS_SECONDS - 10 * 60 + BREAK_SECONDS)
  })
})

describe('buildAdvancedState', () => {
  it('toggles phase and resets startedAt', () => {
    const prev = { phase: 'focus' as const, startedAt: t0.toISOString() }
    const now = new Date('2026-05-16T12:25:00.000Z')
    const next = buildAdvancedState(prev, now)
    expect(next.phase).toBe('break')
    expect(next.cycleCount).toBe(1)
    expect(next.startedAt).toBe(now.toISOString())
  })

  it('enters long_break after 4th focus in mock state', () => {
    const prev = {
      phase: 'focus' as const,
      startedAt: t0.toISOString(),
      cycleCount: 3,
    }
    const next = buildAdvancedState(prev, new Date('2026-05-16T12:25:00.000Z'))
    expect(next.phase).toBe('long_break')
    expect(next.cycleCount).toBe(4)
  })
})

describe('getNextPhase', () => {
  it('alternates focus and break', () => {
    expect(getNextPhase('focus')).toBe('break')
    expect(getNextPhase('break')).toBe('focus')
    expect(getNextPhase('long_break')).toBe('focus')
  })
})
