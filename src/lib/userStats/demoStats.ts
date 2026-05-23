import { createDemoStudySession } from '@/lib/studySessions/demo'
import type { CreateStudySessionInput, StudySessionView } from '@/lib/studySessions/types'
import { STUDY_TIMEZONE, dateKeyInTz } from '@/lib/dashboard/studyAnalytics'

export const DEMO_USER_STATS_KEY = 'synoire_demo_user_stats'

export type DemoUserStats = {
  userId: string
  currentStreak: number
  totalHours: number
}

function readAll(): DemoUserStats[] {
  try {
    const raw = localStorage.getItem(DEMO_USER_STATS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DemoUserStats[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(rows: DemoUserStats[]): void {
  localStorage.setItem(DEMO_USER_STATS_KEY, JSON.stringify(rows))
}

export function getDemoUserStats(userId: string): DemoUserStats {
  const row = readAll().find((r) => r.userId === userId)
  return row ?? { userId, currentStreak: 0, totalHours: 0 }
}

function sessionCountToday(userId: string, now: Date): number {
  try {
    const raw = localStorage.getItem('synoire_demo_study_sessions')
    if (!raw) return 0
    const sessions = JSON.parse(raw) as { user_id: string; created_at: string }[]
    if (!Array.isArray(sessions)) return 0
    const todayKey = dateKeyInTz(now, STUDY_TIMEZONE)
    return sessions.filter(
      (s) =>
        s.user_id === userId &&
        dateKeyInTz(new Date(s.created_at), STUDY_TIMEZONE) === todayKey,
    ).length
  } catch {
    return 0
  }
}

function lastStudyDayBeforeToday(userId: string, now: Date): string | null {
  try {
    const raw = localStorage.getItem('synoire_demo_study_sessions')
    if (!raw) return null
    const sessions = JSON.parse(raw) as { user_id: string; created_at: string }[]
    if (!Array.isArray(sessions)) return null
    const todayKey = dateKeyInTz(now, STUDY_TIMEZONE)
    let maxKey: string | null = null
    for (const s of sessions) {
      if (s.user_id !== userId) continue
      const key = dateKeyInTz(new Date(s.created_at), STUDY_TIMEZONE)
      if (key >= todayKey) continue
      if (!maxKey || key > maxKey) maxKey = key
    }
    return maxKey
  } catch {
    return null
  }
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function recordDemoStudyTime(
  userId: string,
  input: CreateStudySessionInput,
): { stats: DemoUserStats; session: StudySessionView } {
  const now = new Date()
  const session = createDemoStudySession(userId, input)
  const isFirstSessionToday = sessionCountToday(userId, now) === 1

  const rows = readAll().filter((r) => r.userId !== userId)
  const prev = getDemoUserStats(userId)
  let currentStreak = prev.currentStreak
  const totalHours = prev.totalHours + input.durationMinutes / 60

  if (isFirstSessionToday) {
    const todayKey = dateKeyInTz(now, STUDY_TIMEZONE)
    const yesterdayKey = addDaysToDateKey(todayKey, -1)
    const lastDay = lastStudyDayBeforeToday(userId, now)
    if (lastDay === yesterdayKey) {
      currentStreak = prev.currentStreak + 1
    } else {
      currentStreak = 1
    }
  }

  const next: DemoUserStats = { userId, currentStreak, totalHours }
  rows.push(next)
  writeAll(rows)
  return { stats: next, session }
}
