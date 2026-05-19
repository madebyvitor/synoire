import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isDemoMode } from '@/lib/studyPartners/demo'
import {
  GLOBAL_PRESENCE_CHANNEL,
  parseGlobalPresenceState,
  type GlobalPresencePayload,
} from '@/lib/presence/globalPresence'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

type GlobalPresenceContextValue = {
  presenceByUserId: Map<string, GlobalPresencePayload>
  trackPresence: (payload: Omit<GlobalPresencePayload, 'user_id'>) => void
}

const GlobalPresenceContext = createContext<GlobalPresenceContextValue | null>(null)

export function GlobalPresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [presenceByUserId, setPresenceByUserId] = useState(
    () => new Map<string, GlobalPresencePayload>(),
  )
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabase>>['channel']> | null>(
    null,
  )
  const subscribedRef = useRef(false)
  const pendingTrackRef = useRef<Omit<GlobalPresencePayload, 'user_id'> | null>(null)

  const syncPresence = useCallback(() => {
    const channel = channelRef.current
    if (!channel) return
    const state = channel.presenceState() as Record<string, unknown[]>
    setPresenceByUserId(parseGlobalPresenceState(state))
  }, [])

  const trackPresence = useCallback(
    (payload: Omit<GlobalPresencePayload, 'user_id'>) => {
      if (!user?.id) return
      pendingTrackRef.current = payload
      const channel = channelRef.current
      if (!channel || !subscribedRef.current) return
      void channel.track({
        user_id: user.id,
        ...payload,
      })
    },
    [user?.id],
  )

  useEffect(() => {
    if (!user?.id || isDemoMode || !isSupabaseConfigured) {
      setPresenceByUserId(new Map())
      channelRef.current = null
      subscribedRef.current = false
      pendingTrackRef.current = null
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    const channel = supabase.channel(GLOBAL_PRESENCE_CHANNEL, {
      config: { presence: { key: user.id } },
    })
    channelRef.current = channel
    subscribedRef.current = false

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true
          const pending = pendingTrackRef.current
          if (pending) {
            await channel.track({
              user_id: user.id,
              ...pending,
            })
          }
          syncPresence()
        }
      })

    const onUnload = () => {
      void channel.untrack()
    }
    window.addEventListener('beforeunload', onUnload)

    return () => {
      window.removeEventListener('beforeunload', onUnload)
      subscribedRef.current = false
      pendingTrackRef.current = null
      void channel.untrack()
      void supabase.removeChannel(channel)
      channelRef.current = null
      setPresenceByUserId(new Map())
    }
  }, [user?.id, syncPresence])

  const value: GlobalPresenceContextValue = {
    presenceByUserId,
    trackPresence,
  }

  return (
    <GlobalPresenceContext.Provider value={value}>{children}</GlobalPresenceContext.Provider>
  )
}

export function useGlobalPresence(): GlobalPresenceContextValue {
  const ctx = useContext(GlobalPresenceContext)
  if (!ctx) {
    throw new Error('useGlobalPresence must be used within GlobalPresenceProvider')
  }
  return ctx
}
