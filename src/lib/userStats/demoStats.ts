import {
  computeStreakFromSessions,
  toSessionPoints,
} from '@/lib/dashboard/studyAnalytics'
import { createDemoStudySession, listDemoStudySessions } from '@/lib/studySessions/demo'
import type { CreateStudySessionInput, StudySessionView } from '@/lib/studySessions/types'

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

function computeDemoStreak(userId: string): number {
  const sessions = listDemoStudySessions(userId)
  return computeStreakFromSessions(toSessionPoints(sessions))
}

export function getDemoUserStats(userId: string): DemoUserStats {
  const row = readAll().find((r) => r.userId === userId)
  const currentStreak = computeDemoStreak(userId)
  if (!row) {
    return { userId, currentStreak, totalHours: 0 }
  }
  return { ...row, currentStreak }
}

export function recordDemoStudyTime(
  userId: string,
  input: CreateStudySessionInput,
): { stats: DemoUserStats; session: StudySessionView } {
  const session = createDemoStudySession(userId, input)

  const rows = readAll().filter((r) => r.userId !== userId)
  const prev = readAll().find((r) => r.userId === userId)
  const totalHours = (prev?.totalHours ?? 0) + input.durationMinutes / 60
  const currentStreak = computeDemoStreak(userId)

  const next: DemoUserStats = { userId, currentStreak, totalHours }
  rows.push(next)
  writeAll(rows)
  return { stats: next, session }
}
