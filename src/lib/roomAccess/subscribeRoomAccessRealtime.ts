import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/hubRooms/demo'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  ROOM_ACCESS_CHANGED_EVENT,
  type RoomAccessLocalChange,
} from './storage'
import { ROOM_ACCESS_STORAGE_KEY, type RoomAccessRow } from './types'

export type RoomAccessRealtimeEvent =
  | { type: 'INSERT'; row: RoomAccessRow }
  | { type: 'DELETE'; row: Pick<RoomAccessRow, 'room_id' | 'user_id'> }

export type RoomAccessRealtimeCallback = (event: RoomAccessRealtimeEvent) => void

function payloadToEvent(
  payload: RealtimePostgresChangesPayload<RoomAccessRow>,
): RoomAccessRealtimeEvent | null {
  if (payload.eventType === 'INSERT' && payload.new) {
    return { type: 'INSERT', row: payload.new }
  }
  if (payload.eventType === 'DELETE' && payload.old) {
    return {
      type: 'DELETE',
      row: {
        room_id: payload.old.room_id,
        user_id: payload.old.user_id,
      },
    }
  }
  return null
}

function subscribeRoomAccessSupabase(
  userId: string,
  onEvent: RoomAccessRealtimeCallback,
): () => void {
  const supabase = getSupabase()
  if (!supabase) return () => {}

  const channel = supabase
    .channel(`realtime_room_access_${userId}`)
    .on(
      'postgres_changes',
      {
        schema: 'public',
        table: 'room_access',
        event: 'INSERT',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<RoomAccessRow>) => {
        const event = payloadToEvent(payload)
        if (event) onEvent(event)
      },
    )
    .on(
      'postgres_changes',
      {
        schema: 'public',
        table: 'room_access',
        event: 'DELETE',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<RoomAccessRow>) => {
        const event = payloadToEvent(payload)
        if (event) onEvent(event)
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

function localChangeToEvent(
  detail: RoomAccessLocalChange,
  userId: string,
): RoomAccessRealtimeEvent | null {
  if (detail.type === 'INSERT') {
    if (detail.grant.userId !== userId) return null
    return {
      type: 'INSERT',
      row: {
        room_id: detail.grant.roomId,
        user_id: detail.grant.userId,
        created_at: detail.grant.grantedAt,
      },
    }
  }
  if (detail.userId !== userId) return null
  return {
    type: 'DELETE',
    row: { room_id: detail.roomId, user_id: detail.userId },
  }
}

function subscribeRoomAccessLocal(
  userId: string,
  onEvent: RoomAccessRealtimeCallback,
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleChange = (event: Event) => {
    const detail = (event as CustomEvent<RoomAccessLocalChange>).detail
    if (!detail) return
    const mapped = localChangeToEvent(detail, userId)
    if (mapped) onEvent(mapped)
  }

  window.addEventListener(ROOM_ACCESS_CHANGED_EVENT, handleChange)

  return () => {
    window.removeEventListener(ROOM_ACCESS_CHANGED_EVENT, handleChange)
  }
}

/** Cross-tab localStorage sync (storage event does not fire in the same tab). */
export function subscribeRoomAccessStorageSync(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== ROOM_ACCESS_STORAGE_KEY) return
    onChange()
  }

  window.addEventListener('storage', handleStorage)
  return () => window.removeEventListener('storage', handleStorage)
}

/** Notifies when the current user is granted or loses access to a room. */
export function subscribeRoomAccessRealtime(
  userId: string,
  onEvent: RoomAccessRealtimeCallback,
): () => void {
  if (isSupabaseConfigured && !isDemoMode) {
    return subscribeRoomAccessSupabase(userId, onEvent)
  }
  return subscribeRoomAccessLocal(userId, onEvent)
}
