import { getSupabase } from '@/lib/supabase'
import { mapAuthError } from './errors'

export type SignInWithGoogleResult =
  | { ok: true }
  | { ok: false; message: string }

export async function signInWithGoogle(): Promise<SignInWithGoogleResult> {
  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const redirectTo = `${window.location.origin}/painel`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  if (error) {
    if (import.meta.env.DEV) console.error('[auth signInWithGoogle]', error)
    return { ok: false, message: mapAuthError(error) }
  }

  return { ok: true }
}
