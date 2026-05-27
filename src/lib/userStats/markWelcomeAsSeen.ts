import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserStatsResult } from './types'

function mapUpdateError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Entre na sua conta para continuar.'
  }
  return 'Não foi possível concluir o onboarding. Tente novamente.'
}

export async function markWelcomeAsSeen(
  userId: string,
): Promise<UserStatsResult<{ hasSeenWelcome: true }>> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { error } = await supabase
    .from('user_stats')
    .update({
      has_seen_welcome: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    if (import.meta.env.DEV) console.error('[userStats markWelcomeAsSeen]', error)
    return { ok: false, message: mapUpdateError(error.message) }
  }

  return { ok: true, data: { hasSeenWelcome: true } }
}
