import { useMemo } from 'react'
import { useGlobalPresence } from '@/contexts/GlobalPresenceContext'
import type { PartnerPresenceEntry } from '@/lib/studyPartners'

export type { PartnerPresenceEntry }

function toPartnerEntry(
  global: { status: string; current_room: string | null; room_id: string | null } | undefined,
  presenceSynced: boolean,
): PartnerPresenceEntry {
  if (!global) {
    if (!presenceSynced) {
      return {
        presenceStatus: 'unknown',
        isOnline: false,
        roomId: null,
        roomLabel: null,
      }
    }
    return {
      presenceStatus: 'offline',
      isOnline: false,
      roomId: null,
      roomLabel: null,
    }
  }

  if (global.status === 'focando') {
    return {
      presenceStatus: 'focando',
      isOnline: true,
      roomId: global.room_id,
      roomLabel: global.current_room,
    }
  }

  if (global.status === 'online') {
    return {
      presenceStatus: 'online',
      isOnline: true,
      roomId: null,
      roomLabel: null,
    }
  }

  return {
    presenceStatus: 'offline',
    isOnline: false,
    roomId: null,
    roomLabel: null,
  }
}

export function usePartnerPresence(
  partnerUserIds: string[],
): Map<string, PartnerPresenceEntry> {
  const { presenceByUserId, presenceVersion, presenceSynced } = useGlobalPresence()
  const idsKey = partnerUserIds.join(',')

  return useMemo(() => {
    const map = new Map<string, PartnerPresenceEntry>()
    for (const id of partnerUserIds) {
      if (!id) continue
      map.set(id, toPartnerEntry(presenceByUserId.get(id), presenceSynced))
    }
    return map
  }, [idsKey, partnerUserIds, presenceByUserId, presenceVersion, presenceSynced])
}
