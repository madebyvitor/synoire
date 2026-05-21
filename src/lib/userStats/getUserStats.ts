import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
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
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { data, error } = await supabase
    .from('user_stats')
    .select('user_id, current_streak, total_hours, weekly_goal_minutes')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (import.meta.env.DEV) console.error('[userStats getUserStats]', error)
    return { ok: false, message: mapQueryError(error.message) }
  }

  if (!data) {
    return { ok: true, data: EMPTY_STATS }
  }

  return { ok: true, data: mapUserStatsRow(data as UserStatsRow) }
}
