import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { MAX_BIO_LENGTH } from './constants'
import { mapProfileRow, type ProfileRow, type ProfileView } from './types'
import { validateUsername } from './validateUsername'

export type UpdateProfileInput = {
  username: string
  targetExam: string
  bio: string
  avatarUrl?: string
}

export type UpdateProfileResult =
  | { ok: true; profile: ProfileView }
  | { ok: false; message: string }

function validateProfileInput(input: UpdateProfileInput): string | null {
  const usernameError = validateUsername(input.username)
  if (usernameError) return usernameError

  const target = input.targetExam.trim()
  if (!target) {
    return 'Informe o concurso-alvo.'
  }
  if (target.length > 120) {
    return 'O concurso-alvo deve ter no máximo 120 caracteres.'
  }

  const bio = input.bio.trim()
  if (bio.length > MAX_BIO_LENGTH) {
    return `A bio deve ter no máximo ${MAX_BIO_LENGTH} caracteres.`
  }

  return null
}

function mapUpdateError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Entre na sua conta para atualizar o perfil.'
  }
  if (lower.includes('duplicate') || lower.includes('unique')) {
    return 'Este nome de usuário já está em uso.'
  }
  return 'Não foi possível atualizar o perfil.'
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const validationError = validateProfileInput(input)
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

  const username = input.username.trim()
  const target_exam = input.targetExam.trim()
  const bio = input.bio.trim() || null

  const patch: Record<string, string | null> = {
    username,
    target_exam,
    bio,
    updated_at: new Date().toISOString(),
  }
  if (input.avatarUrl !== undefined) {
    patch.avatar_url = input.avatarUrl
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    if (import.meta.env.DEV) console.error('[profile updateProfile]', error)
    return { ok: false, message: mapUpdateError(error.message) }
  }

  if (!data) {
    return { ok: false, message: 'Não foi possível atualizar o perfil.' }
  }

  return { ok: true, profile: mapProfileRow(data as ProfileRow) }
}
