import { useMemo } from 'react'
import { useGlobalPresence } from '@/contexts/GlobalPresenceContext'
import type { PartnerPresenceEntry } from '@/lib/studyPartners'

export type { PartnerPresenceEntry }

function toPartnerEntry(
  global: { status: string; current_room: string | null; room_id: string | null } | undefined,
): PartnerPresenceEntry {
  if (!global) {
    return { isOnline: false, roomId: null, roomLabel: null }
  }

  if (global.status === 'focando') {
    return {
      isOnline: true,
      roomId: global.room_id,
      roomLabel: global.current_room,
    }
  }

  return { isOnline: false, roomId: null, roomLabel: null }
}

export function usePartnerPresence(
  partnerUserIds: string[],
): Map<string, PartnerPresenceEntry> {
  const { presenceByUserId } = useGlobalPresence()
  const idsKey = partnerUserIds.join(',')

  return useMemo(() => {
    const map = new Map<string, PartnerPresenceEntry>()
    for (const id of partnerUserIds) {
      if (!id) continue
      map.set(id, toPartnerEntry(presenceByUserId.get(id)))
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable map per id set + presence snapshot
  }, [idsKey, presenceByUserId])
}
