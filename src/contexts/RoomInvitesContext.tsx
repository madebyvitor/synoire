import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AppToast } from '@/components/ui/AppToast'
import { useAuth } from '@/contexts/AuthContext'
import { isDemoMode } from '@/lib/hubRooms/demo'
import {
  acknowledgeRoomInvite,
  fetchIncomingRoomInvites,
  inviteAckKey,
  revokeRoomAccess,
  subscribeRoomAccessRealtime,
  subscribeRoomAccessStorageSync,
  type IncomingRoomInvite,
} from '@/lib/roomAccess'
import { isSupabaseConfigured } from '@/lib/supabase'
import { enrichRoomAccessInvite } from '@/lib/roomAccess/enrichRoomInvite'
import { isRoomInviteAcknowledged } from '@/lib/roomAccess/inviteAcknowledgment'

type RoomInvitesContextValue = {
  incomingRoomInvites: IncomingRoomInvite[]
  isLoading: boolean
  acceptRoomInvite: (invite: IncomingRoomInvite) => void
  declineRoomInvite: (invite: IncomingRoomInvite) => Promise<boolean>
  refresh: () => Promise<void>
}

const RoomInvitesContext = createContext<RoomInvitesContextValue | null>(null)

function upsertInvite(
  list: IncomingRoomInvite[],
  invite: IncomingRoomInvite,
): IncomingRoomInvite[] {
  const key = inviteAckKey(invite.roomId, invite.grantedAt)
  const without = list.filter((i) => inviteAckKey(i.roomId, i.grantedAt) !== key)
  return [...without, invite]
}

export function RoomInvitesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [incomingRoomInvites, setIncomingRoomInvites] = useState<IncomingRoomInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState({ message: '', visible: false })

  const refresh = useCallback(async () => {
    const userId = user?.id
    if (!userId) {
      setIncomingRoomInvites([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const result = await fetchIncomingRoomInvites(userId)
    if (result.ok) {
      setIncomingRoomInvites(result.data)
    } else {
      setIncomingRoomInvites([])
    }
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, refresh])

  useEffect(() => {
    const userId = user?.id
    if (!userId || authLoading) return

    return subscribeRoomAccessRealtime(userId, (event) => {
      if (event.type === 'DELETE') {
        setIncomingRoomInvites((prev) =>
          prev.filter((i) => i.roomId !== event.row.room_id),
        )
        return
      }

      void enrichRoomAccessInvite(event.row, userId).then((invite) => {
        if (!invite) return
        if (isRoomInviteAcknowledged(invite.roomId, invite.grantedAt)) return

        setIncomingRoomInvites((prev) => upsertInvite(prev, invite))
        setToast({
          message: `Você foi convidado para "${invite.roomName}" por @${invite.inviterUsername}!`,
          visible: true,
        })
      })
    })
  }, [user?.id, authLoading])

  useEffect(() => {
    if (!user?.id || authLoading) return
    if (isSupabaseConfigured && !isDemoMode) return
    return subscribeRoomAccessStorageSync(() => {
      void refresh()
    })
  }, [user?.id, authLoading, refresh])

  const acceptRoomInvite = useCallback((invite: IncomingRoomInvite) => {
    acknowledgeRoomInvite(invite.roomId, invite.grantedAt)
    setIncomingRoomInvites((prev) =>
      prev.filter((i) => inviteAckKey(i.roomId, i.grantedAt) !== inviteAckKey(invite.roomId, invite.grantedAt)),
    )
  }, [])

  const declineRoomInvite = useCallback(
    async (invite: IncomingRoomInvite) => {
      const userId = user?.id
      if (!userId) return false

      const result = await revokeRoomAccess(invite.roomId, userId)
      if (!result.ok) {
        setToast({ message: result.message, visible: true })
        return false
      }

      acknowledgeRoomInvite(invite.roomId, invite.grantedAt)
      setIncomingRoomInvites((prev) =>
        prev.filter(
          (i) => inviteAckKey(i.roomId, i.grantedAt) !== inviteAckKey(invite.roomId, invite.grantedAt),
        ),
      )
      return true
    },
    [user?.id],
  )

  const value = useMemo(
    () => ({
      incomingRoomInvites,
      isLoading: authLoading || isLoading,
      acceptRoomInvite,
      declineRoomInvite,
      refresh,
    }),
    [
      incomingRoomInvites,
      authLoading,
      isLoading,
      acceptRoomInvite,
      declineRoomInvite,
      refresh,
    ],
  )

  return (
    <RoomInvitesContext.Provider value={value}>
      {children}
      <AppToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </RoomInvitesContext.Provider>
  )
}

export function useRoomInvites(): RoomInvitesContextValue {
  const ctx = useContext(RoomInvitesContext)
  if (!ctx) {
    throw new Error('useRoomInvites must be used within RoomInvitesProvider')
  }
  return ctx
}
