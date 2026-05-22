import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

export type UploadAvatarResult =
  | { ok: true; publicUrl: string }
  | { ok: false; message: string }

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<UploadAvatarResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase()
  const fileExt = rawExt && /^[a-z0-9]+$/.test(rawExt) ? rawExt : 'jpg'
  const filePath = `${userId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (uploadError) {
    if (import.meta.env.DEV) console.error('[profile uploadAvatar]', uploadError)
    return { ok: false, message: 'Não foi possível enviar a imagem.' }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath)

  return { ok: true, publicUrl }
}
