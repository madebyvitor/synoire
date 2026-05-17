import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { validateRequestName } from './validateRequestName'

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

function mapInsertError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('hub_requests_name_length')) {
    return 'O nome deve ter entre 2 e 120 caracteres.'
  }
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Entre na sua conta para enviar uma sugestão.'
  }
  return 'Não foi possível enviar a sugestão. Tente novamente.'
}

export async function submitHubRequest(requestedName: string): Promise<void> {
  const validation = validateRequestName(requestedName)
  if (!validation.ok) {
    throw new Error(validation.error)
  }

  if (demoMode) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado.')
  }

  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase não configurado.')
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    throw new Error('Entre na sua conta para enviar uma sugestão.')
  }

  const { error } = await supabase.from('hub_requests').insert({
    user_id: authData.user.id,
    requested_name: validation.value,
  })

  if (error) {
    throw new Error(mapInsertError(error.message))
  }
}
