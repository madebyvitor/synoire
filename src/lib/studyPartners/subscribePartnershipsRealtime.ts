import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import type { PartnershipRealtimeEvent } from './applyPartnershipRealtimeEvent'
import type { PartnershipRow } from './types'

export type PartnershipRealtimeCallback = (event: PartnershipRealtimeEvent) => void

function payloadToEvent(
  payload: RealtimePostgresChangesPayload<PartnershipRow>,
): PartnershipRealtimeEvent | null {
  if (payload.eventType === 'INSERT' && payload.new) {
    return { type: 'INSERT', row: payload.new }
  }
  if (payload.eventType === 'UPDATE' && payload.new) {
    return { type: 'UPDATE', row: payload.new }
  }
  if (payload.eventType === 'DELETE' && payload.old?.id) {
    return { type: 'DELETE', row: payload.old as PartnershipRow }
  }
  return null
}

/**
 * Subscribes to partnership rows where the user is sender or receiver.
 * Supabase client filters do not support OR in one listener, so we attach
 * two postgres_changes handlers (receiver_id and sender_id).
 * Returns an unsubscribe function that removes the Realtime channel.
 */
export function subscribePartnershipsRealtime(
  userId: string,
  onEvent: PartnershipRealtimeCallback,
): () => void {
  const supabase = getSupabase()
  if (!supabase) return () => {}

  const base = { schema: 'public' as const, table: 'partnerships' as const }

  const handlePayload = (payload: RealtimePostgresChangesPayload<PartnershipRow>) => {
    const event = payloadToEvent(payload)
    if (event) onEvent(event)
  }

  const channel = supabase
    .channel('realtime_partnerships')
    .on(
      'postgres_changes',
      { ...base, event: '*', filter: `receiver_id=eq.${userId}` },
      handlePayload,
    )
    .on(
      'postgres_changes',
      { ...base, event: '*', filter: `sender_id=eq.${userId}` },
      handlePayload,
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
