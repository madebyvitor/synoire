import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { isForbiddenError, mapRoomQueryError } from '@/lib/hubRooms/errors'
import { isDuplicateRoomAccessError } from './errors'
import { mapAccessRow } from './mapAccessRow'
import type { RoomAccessGrant, RoomAccessResult, RoomAccessRow } from './types'

export async function grantRoomAccessSupabase(
  roomId: string,
  userId: string,
): Promise<RoomAccessResult<RoomAccessGrant>> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { data, error } = await supabase
    .from('room_access')
    .insert({ room_id: roomId, user_id: userId })
    .select('room_id, user_id, created_at, profiles(username, avatar_url)')
    .single()

  if (error) {
    if (import.meta.env.DEV) console.error('[roomAccess grant]', error)
    if (isForbiddenError(error)) {
      return {
        ok: false,
        message: 'Apenas o criador da sala pode convidar parceiros.',
        code: 'forbidden',
      }
    }
    if (isDuplicateRoomAccessError(error)) {
      return {
        ok: true,
        data: { roomId, userId, grantedAt: new Date().toISOString() },
        alreadyGranted: true,
      }
    }
    return { ok: false, message: mapRoomQueryError(error.message) }
  }

  return { ok: true, data: mapAccessRow(data as unknown as RoomAccessRow) }
}

export async function listRoomAccessSupabase(
  roomId: string,
): Promise<RoomAccessResult<RoomAccessGrant[]>> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { data, error } = await supabase
    .from('room_access')
    .select('room_id, user_id, created_at, profiles(username, avatar_url)')
    .eq('room_id', roomId)

  if (error) {
    if (import.meta.env.DEV) console.error('[roomAccess list]', error)
    if (isForbiddenError(error)) {
      return { ok: false, message: mapRoomQueryError(error.message), code: 'forbidden' }
    }
    return { ok: false, message: mapRoomQueryError(error.message) }
  }

  const rows = (data ?? []) as unknown as RoomAccessRow[]
  return { ok: true, data: rows.map(mapAccessRow) }
}

export async function revokeRoomAccessSupabase(
  roomId: string,
  userId: string,
): Promise<RoomAccessResult<void>> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { error } = await supabase
    .from('room_access')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId)

  if (error) {
    if (import.meta.env.DEV) console.error('[roomAccess revoke]', error)
    if (isForbiddenError(error)) {
      return { ok: false, message: mapRoomQueryError(error.message), code: 'forbidden' }
    }
    return { ok: false, message: mapRoomQueryError(error.message) }
  }

  return { ok: true, data: undefined }
}
