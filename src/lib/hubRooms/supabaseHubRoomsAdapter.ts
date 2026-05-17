import { isSupabaseConfigured } from '@/lib/supabase'
import { mockHubRoomsAdapter } from './mockHubRoomsAdapter'
import type { HubRoomsAdapter } from './types'

/**
 * Future Supabase adapter — requires `rooms` migration.
 *
 * ```ts
 * const payload = buildCreatePayload(hubId, theme, cycle)
 * await supabase.from('rooms').insert({
 *   hub_id: hubId,
 *   name: payload.name,
 *   is_private: payload.is_private,
 *   current_timer_state: payload.current_timer_state,
 * })
 * ```
 *
 * Map `hub_slug` (mock) → `hub_id` UUID when hubs table exists.
 */
const notReady: HubRoomsAdapter = {
  async listRooms() {
    throw new Error('Supabase rooms table not migrated yet')
  },
  async getRoom() {
    throw new Error('Supabase rooms table not migrated yet')
  },
  async createRoom() {
    throw new Error('Supabase rooms table not migrated yet')
  },
  async startFocusTimer() {
    throw new Error('Supabase rooms table not migrated yet')
  },
  async advanceTimerPhase() {
    throw new Error('Supabase rooms table not migrated yet')
  },
  async incrementPresence() {
    throw new Error('Supabase rooms table not migrated yet')
  },
  async decrementPresence() {
    throw new Error('Supabase rooms table not migrated yet')
  },
  subscribe() {
    return () => {}
  },
}

export const supabaseHubRoomsAdapter = notReady

export function getHubRoomsAdapter(): HubRoomsAdapter {
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  if (isSupabaseConfigured && !demoMode) {
    return supabaseHubRoomsAdapter
  }
  return mockHubRoomsAdapter
}
