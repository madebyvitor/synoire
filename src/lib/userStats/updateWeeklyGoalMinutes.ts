import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserStatsResult } from './types'
import {
  validateWeeklyGoalHours,
  weeklyGoalHoursToMinutes,
} from './validateWeeklyGoalHours'

function mapUpdateError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Entre na sua conta para continuar.'
  }
  return 'Não foi possível salvar sua meta. Tente novamente.'
}

export async function updateWeeklyGoalMinutes(
  userId: string,
  hours: number,
): Promise<UserStatsResult<{ weeklyGoalMinutes: number }>> {
  const validationError = validateWeeklyGoalHours(hours)
  if (validationError) {
    return { ok: false, message: validationError }
  }

  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const weekly_goal_minutes = weeklyGoalHoursToMinutes(hours)

  const { error } = await supabase
    .from('user_stats')
    .update({
      weekly_goal_minutes,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    if (import.meta.env.DEV) console.error('[userStats updateWeeklyGoalMinutes]', error)
    return { ok: false, message: mapUpdateError(error.message) }
  }

  return { ok: true, data: { weeklyGoalMinutes: weekly_goal_minutes } }
}
