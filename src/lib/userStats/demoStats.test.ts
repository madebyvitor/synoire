import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER_STATS_KEY, getDemoUserStats, recordDemoStudyTime } from './demoStats'

const DEMO_SESSIONS_KEY = 'synoire_demo_study_sessions'

describe('recordDemoStudyTime', () => {
  const userId = 'demo-user-streak'

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds total hours from duration minutes', () => {
    recordDemoStudyTime(userId, { roomId: 'demo-room-1', durationMinutes: 30 })
    const stats = getDemoUserStats(userId)
    expect(stats.totalHours).toBeCloseTo(0.5)
  })

  it('sets streak to 1 on first study day', () => {
    recordDemoStudyTime(userId, { roomId: 'demo-room-1', durationMinutes: 10 })
    expect(getDemoUserStats(userId).currentStreak).toBe(1)
  })

  it('does not increment streak twice on same day', () => {
    recordDemoStudyTime(userId, { roomId: 'demo-room-1', durationMinutes: 10 })
    recordDemoStudyTime(userId, { roomId: 'demo-room-1', durationMinutes: 5 })
    expect(getDemoUserStats(userId).currentStreak).toBe(1)
  })

  it('increments streak when last session was yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    localStorage.setItem(
      DEMO_SESSIONS_KEY,
      JSON.stringify([
        {
          id: 'old',
          user_id: userId,
          room_id: 'demo-room-1',
          duration_minutes: 25,
          created_at: yesterday.toISOString(),
        },
      ]),
    )
    localStorage.setItem(
      DEMO_USER_STATS_KEY,
      JSON.stringify([{ userId, currentStreak: 3, totalHours: 1 }]),
    )

    recordDemoStudyTime(userId, { roomId: 'demo-room-1', durationMinutes: 10 })
    expect(getDemoUserStats(userId).currentStreak).toBe(2)
  })

  it('resets streak to 1 after a gap', () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    localStorage.setItem(
      DEMO_SESSIONS_KEY,
      JSON.stringify([
        {
          id: 'old',
          user_id: userId,
          room_id: 'demo-room-1',
          duration_minutes: 25,
          created_at: threeDaysAgo.toISOString(),
        },
      ]),
    )
    localStorage.setItem(
      DEMO_USER_STATS_KEY,
      JSON.stringify([{ userId, currentStreak: 5, totalHours: 2 }]),
    )

    recordDemoStudyTime(userId, { roomId: 'demo-room-1', durationMinutes: 10 })
    expect(getDemoUserStats(userId).currentStreak).toBe(1)
  })

  it('returns streak 0 after a full day without study', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-19T12:00:00.000Z'))
    localStorage.setItem(
      DEMO_SESSIONS_KEY,
      JSON.stringify([
        {
          id: 'old',
          user_id: userId,
          room_id: 'demo-room-1',
          duration_minutes: 25,
          created_at: '2026-05-17T15:00:00.000Z',
          rooms: { hub_id: 'demo-hub' },
        },
      ]),
    )
    localStorage.setItem(
      DEMO_USER_STATS_KEY,
      JSON.stringify([{ userId, currentStreak: 1, totalHours: 1 }]),
    )

    expect(getDemoUserStats(userId).currentStreak).toBe(0)
  })
})
