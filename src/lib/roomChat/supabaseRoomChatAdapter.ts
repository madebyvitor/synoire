import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockRoomChatAdapter } from './mockRoomChatAdapter'
import type { RoomChatAdapter, RoomChatMessage } from './types'
import { ROOM_CHAT_FETCH_LIMIT } from './types'

type ProfileSnippet = { username: string; avatar_url: string | null }

type MessageRow = {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: ProfileSnippet | ProfileSnippet[] | null
}

function resolveProfile(
  profiles: MessageRow['profiles'],
): ProfileSnippet | null {
  if (!profiles) return null
  if (Array.isArray(profiles)) return profiles[0] ?? null
  return profiles
}

function mapRow(row: MessageRow): RoomChatMessage {
  const profile = resolveProfile(row.profiles)
  return {
    id: row.id,
    room_id: row.room_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    author: {
      username: profile?.username ?? 'estudante',
      avatar_url: profile?.avatar_url ?? null,
    },
  }
}

export const supabaseRoomChatAdapter: RoomChatAdapter = {
  async fetchRecent(roomId, limit = ROOM_CHAT_FETCH_LIMIT) {
    const supabase = getSupabase()
    if (!supabase) return []

    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(username, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[roomChat] fetchRecent', error)
      return []
    }

    const rows = (data ?? []) as unknown as MessageRow[]
    return rows.map(mapRow).reverse()
  },

  async send(roomId, content, userId) {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    if (!userId) throw new Error('Not authenticated')

    const trimmed = content.trim()
    if (!trimmed) throw new Error('Empty message')

    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, user_id: userId, content: trimmed })
      .select('*, profiles(username, avatar_url)')
      .single()

    if (error || !data) {
      console.error('[roomChat] send', error)
      throw error ?? new Error('Failed to send message')
    }

    return mapRow(data as unknown as MessageRow)
  },

  subscribe(roomId, onInsert) {
    const supabase = getSupabase()
    if (!supabase) return () => {}

    const channel = supabase
      .channel(`room_chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const row = payload.new as Omit<MessageRow, 'profiles'>
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', row.user_id)
            .maybeSingle()

          onInsert(
            mapRow({
              ...row,
              profiles: profile ?? { username: 'estudante', avatar_url: null },
            }),
          )
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  },
}

export function getRoomChatAdapter(): RoomChatAdapter {
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  if (isSupabaseConfigured && !demoMode) {
    return supabaseRoomChatAdapter
  }
  return mockRoomChatAdapter
}
