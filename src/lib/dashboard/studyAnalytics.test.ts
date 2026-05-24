import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StudySessionView } from '@/lib/studySessions'
import {
  buildYearHeatmap,
  buildWeeklyBars,
  computeStreakFromSessions,
  formatCountdown,
  hasSessionToday,
  hourInTz,
  minutesForGoal,
  minutesStudiedToday,
  msUntilMidnightInTz,
  toSessionPoints,
  yearInTz,
} from './studyAnalytics'

afterEach(() => {
  vi.useRealTimers()
})

function session(
  iso: string,
  minutes: number,
  hubId: string | null = 'hub-1',
): StudySessionView {
  return {
    id: `s-${iso}`,
    roomId: 'room-1',
    hubId,
    durationMinutes: minutes,
    startedAt: new Date(iso),
  }
}

describe('minutesStudiedToday', () => {
  it('sums only sessions on the same calendar day in Sao Paulo', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-17T18:00:00.000Z'))
    const points = toSessionPoints([
      session('2026-05-17T15:00:00.000Z', 25),
      session('2026-05-16T15:00:00.000Z', 50),
    ])
    expect(minutesStudiedToday(points)).toBe(25)
    vi.useRealTimers()
  })
})

describe('buildWeeklyBars', () => {
  it('returns seven buckets', () => {
    const bars = buildWeeklyBars([])
    expect(bars).toHaveLength(7)
  })
})

describe('buildYearHeatmap', () => {
  it('includes cells from Jan 1 through today in the target year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-17T18:00:00.000Z'))
    const cells = buildYearHeatmap([], 2026)
    expect(cells.length).toBeGreaterThan(100)
    expect(cells[0]?.dateKey).toBe('2026-01-01')
    expect(cells.at(-1)?.dateKey).toBe('2026-05-17')
    vi.useRealTimers()
  })

  it('ignores sessions from other years', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-17T18:00:00.000Z'))
    const points = toSessionPoints([
      session('2025-12-31T15:00:00.000Z', 100),
      session('2026-05-17T15:00:00.000Z', 30),
    ])
    const cells = buildYearHeatmap(points, 2026)
    const may17 = cells.find((c) => c.dateKey === '2026-05-17')
    expect(may17?.minutes).toBe(30)
    vi.useRealTimers()
  })
})

describe('hasSessionToday', () => {
  it('returns true when a session exists today in SP', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-17T18:00:00.000Z'))
    const points = toSessionPoints([session('2026-05-17T15:00:00.000Z', 25)])
    expect(hasSessionToday(points)).toBe(true)
    vi.useRealTimers()
  })
})

describe('msUntilMidnightInTz', () => {
  it('returns positive milliseconds before next day in SP', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-17T20:00:00.000Z'))
    expect(msUntilMidnightInTz()).toBeGreaterThan(0)
    expect(msUntilMidnightInTz()).toBeLessThan(24 * 3_600_000)
    vi.useRealTimers()
  })
})

describe('formatCountdown', () => {
  it('formats as HH:MM:SS', () => {
    expect(formatCountdown(90_000)).toBe('00:01:30')
  })
})

describe('hourInTz and yearInTz', () => {
  it('reads hour in America/Sao_Paulo', () => {
    const d = new Date('2026-05-17T10:00:00.000Z')
    expect(hourInTz(d)).toBe(7)
    expect(yearInTz(d)).toBe(2026)
  })
})

describe('minutesForGoal', () => {
  it('sums sessions for hub in weekly period', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-17T18:00:00.000Z'))
    const sessions = [
      session('2026-05-17T10:00:00.000Z', 60, 'hub-a'),
      session('2026-05-17T11:00:00.000Z', 30, 'hub-b'),
    ]
    expect(minutesForGoal(sessions, 'hub-a', 'weekly')).toBe(60)
    vi.useRealTimers()
  })
})

describe('computeStreakFromSessions', () => {
  const todaySp = new Date('2026-05-19T12:00:00.000Z')

  it('returns 1 when only yesterday had a session (grace for today)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(todaySp)
    const points = toSessionPoints([session('2026-05-18T15:00:00.000Z', 25)])
    expect(computeStreakFromSessions(points)).toBe(1)
    vi.useRealTimers()
  })

  it('returns 0 after a full missed day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(todaySp)
    const points = toSessionPoints([session('2026-05-17T15:00:00.000Z', 25)])
    expect(computeStreakFromSessions(points)).toBe(0)
    vi.useRealTimers()
  })

  it('counts consecutive days through yesterday when today is empty', () => {
    vi.useFakeTimers()
    vi.setSystemTime(todaySp)
    const points = toSessionPoints([
      session('2026-05-17T15:00:00.000Z', 25),
      session('2026-05-18T15:00:00.000Z', 30),
    ])
    expect(computeStreakFromSessions(points)).toBe(2)
    vi.useRealTimers()
  })
})
