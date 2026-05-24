import { isDemoMode } from '@/lib/studySessions/demo'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { getDemoUserStats } from './demoStats'
import type { UserStatsResult, UserStatsRow, UserStatsView } from './types'

function mapUserStatsRow(row: UserStatsRow): UserStatsView {
  return {
    currentStreak: row.current_streak ?? 0,
    totalHours: Number(row.total_hours ?? 0),
    weeklyGoalMinutes: row.weekly_goal_minutes ?? 0,
  }
}

const EMPTY_STATS: UserStatsView = {
  currentStreak: 0,
  totalHours: 0,
  weeklyGoalMinutes: 0,
}

function mapQueryError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Entre na sua conta para continuar.'
  }
  return 'Não foi possível carregar suas estatísticas. Tente novamente.'
}

export async function getUserStats(userId: string): Promise<UserStatsResult<UserStatsView>> {
  if (isDemoMode) {
    const demo = getDemoUserStats(userId)
    return {
      ok: true,
      data: {
        currentStreak: demo.currentStreak,
        totalHours: demo.totalHours,
        weeklyGoalMinutes: 0,
      },
    }
  }

  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const [statsResult, streakResult] = await Promise.all([
    supabase
      .from('user_stats')
      .select('user_id, current_streak, total_hours, weekly_goal_minutes')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.rpc('compute_streak_from_sessions', { p_user_id: userId }),
  ])

  if (statsResult.error) {
    if (import.meta.env.DEV) console.error('[userStats getUserStats]', statsResult.error)
    return { ok: false, message: mapQueryError(statsResult.error.message) }
  }

  if (streakResult.error) {
    if (import.meta.env.DEV) console.error('[userStats getUserStats streak]', streakResult.error)
    return { ok: false, message: mapQueryError(streakResult.error.message) }
  }

  if (!statsResult.data) {
    const computedStreak =
      typeof streakResult.data === 'number' ? streakResult.data : 0
    return {
      ok: true,
      data: { ...EMPTY_STATS, currentStreak: computedStreak },
    }
  }

  const row = statsResult.data as UserStatsRow
  const computedStreak =
    typeof streakResult.data === 'number' ? streakResult.data : (row.current_streak ?? 0)
  const storedStreak = row.current_streak ?? 0

  if (computedStreak !== storedStreak) {
    const { error: syncError } = await supabase
      .from('user_stats')
      .update({ current_streak: computedStreak, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (syncError && import.meta.env.DEV) {
      console.error('[userStats getUserStats sync streak]', syncError)
    }
  }

  return {
    ok: true,
    data: {
      ...mapUserStatsRow(row),
      currentStreak: computedStreak,
    },
  }
}
