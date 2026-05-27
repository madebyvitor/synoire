export type UserStatsRow = {
  user_id: string
  current_streak: number | null
  total_hours: number | string | null
  daily_goal_minutes: number | null
  weekly_goal_minutes: number | null
  has_seen_welcome: boolean | null
}

export type UserStatsView = {
  currentStreak: number
  totalHours: number
  weeklyGoalMinutes: number
  hasSeenWelcome: boolean
}

export type UserStatsResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }
