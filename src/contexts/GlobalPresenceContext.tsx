import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isDemoMode } from '@/lib/studyPartners/demo'
import {
  GLOBAL_PRESENCE_CHANNEL,
  isSamePresencePayload,
  parseGlobalPresenceState,
  withTrackedAt,
  type GlobalPresencePayload,
  type GlobalPresenceTrackInput,
} from '@/lib/presence/globalPresence'
import {
  buildPresenceChannelKey,
  getPresenceTabId,
} from '@/lib/presence/presenceTabId'
import { ONLINE_PRESENCE } from '@/lib/presence/resolveAuthenticatedPresence'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

type GlobalPresenceContextValue = {
  presenceByUserId: Map<string, GlobalPresencePayload>
  /** True after the first presence sync on the global channel. */
  presenceSynced: boolean
  /** Bumps on every presence sync so consumers re-render reliably. */
  presenceVersion: number
  trackPresence: (payload: GlobalPresenceTrackInput) => void
  /** Updates own presence on the global channel (same as trackPresence). */
  updateGlobalPresence: (payload: GlobalPresenceTrackInput) => void
}

const GlobalPresenceContext = createContext<GlobalPresenceContextValue | null>(null)

export function GlobalPresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const tabIdRef = useRef(getPresenceTabId())
  const [presenceByUserId, setPresenceByUserId] = useState(
    () => new Map<string, GlobalPresencePayload>(),
  )
  const [presenceSynced, setPresenceSynced] = useState(false)
  const [presenceVersion, setPresenceVersion] = useState(0)
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabase>>['channel']> | null>(
    null,
  )
  const subscribedRef = useRef(false)
  const pendingTrackRef = useRef<GlobalPresenceTrackInput | null>(null)
  const lastRequestedRef = useRef<GlobalPresenceTrackInput | null>(null)
  const lastTrackedRef = useRef<GlobalPresenceTrackInput | null>(null)
  const trackQueueRef = useRef(Promise.resolve())
  const hasSyncedRef = useRef(false)

  const applyOptimisticOwnPresence = useCallback(
    (payload: GlobalPresenceTrackInput) => {
      if (!user?.id) return
      const optimistic: GlobalPresencePayload = {
        user_id: user.id,
        ...withTrackedAt(payload),
      }
      setPresenceByUserId((prev) => {
        const next = new Map(prev)
        next.set(user.id, optimistic)
        return next
      })
      setPresenceVersion((v) => v + 1)
    },
    [user?.id],
  )

  const markSynced = useCallback(() => {
    if (hasSyncedRef.current) return
    hasSyncedRef.current = true
    setPresenceSynced(true)
  }, [])

  const applyPresenceState = useCallback(() => {
    const channel = channelRef.current
    if (!channel) return
    const state = channel.presenceState() as Record<string, unknown[]>
    setPresenceByUserId(parseGlobalPresenceState(state))
    setPresenceVersion((v) => v + 1)
    markSynced()
  }, [markSynced])

  const schedulePresenceSync = useCallback(() => {
    queueMicrotask(() => {
      applyPresenceState()
    })
  }, [applyPresenceState])

  const flushTrack = useCallback(() => {
    if (!user?.id) return

    trackQueueRef.current = trackQueueRef.current
      .then(async () => {
        const payload = lastRequestedRef.current
        const channel = channelRef.current
        if (!payload || !channel || !subscribedRef.current) return
        if (document.visibilityState === 'hidden') return
        if (isSamePresencePayload(payload, lastTrackedRef.current)) return

        await channel.track({
          user_id: user.id,
          ...withTrackedAt(payload),
        })
        lastTrackedRef.current = payload
        pendingTrackRef.current = null
        applyOptimisticOwnPresence(payload)
        schedulePresenceSync()
      })
      .catch(() => {
        /* allow queue to continue */
      })
  }, [user?.id, applyOptimisticOwnPresence, schedulePresenceSync])

  const trackPresence = useCallback(
    (payload: GlobalPresenceTrackInput) => {
      if (!user?.id) return
      lastRequestedRef.current = payload
      pendingTrackRef.current = payload

      const channel = channelRef.current
      if (!channel || !subscribedRef.current) return
      if (document.visibilityState === 'hidden') return

      flushTrack()
    },
    [user?.id, flushTrack],
  )

  const updateGlobalPresence = trackPresence

  useEffect(() => {
    if (!user?.id || isDemoMode || !isSupabaseConfigured) {
      setPresenceByUserId(new Map())
      setPresenceSynced(false)
      setPresenceVersion(0)
      channelRef.current = null
      subscribedRef.current = false
      pendingTrackRef.current = null
      lastRequestedRef.current = null
      lastTrackedRef.current = null
      hasSyncedRef.current = false
      trackQueueRef.current = Promise.resolve()
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    const presenceKey = buildPresenceChannelKey(user.id, tabIdRef.current)
    const channel = supabase.channel(GLOBAL_PRESENCE_CHANNEL, {
      config: { presence: { key: presenceKey } },
    })
    channelRef.current = channel
    subscribedRef.current = false
    hasSyncedRef.current = false
    setPresenceSynced(false)

    const onPresenceEvent = () => {
      schedulePresenceSync()
    }

    channel
      .on('presence', { event: 'sync' }, onPresenceEvent)
      .on('presence', { event: 'join' }, onPresenceEvent)
      .on('presence', { event: 'leave' }, onPresenceEvent)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true
          const payload = pendingTrackRef.current ?? ONLINE_PRESENCE
          lastRequestedRef.current = payload
          if (document.visibilityState !== 'hidden') {
            await channel.track({
              user_id: user.id,
              ...withTrackedAt(payload),
            })
            lastTrackedRef.current = payload
            pendingTrackRef.current = null
            applyOptimisticOwnPresence(payload)
          }
          applyPresenceState()
        }
      })

    const untrackAndSync = () => {
      void channel.untrack().then(() => {
        lastTrackedRef.current = null
        schedulePresenceSync()
      })
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        untrackAndSync()
        return
      }
      const payload = lastRequestedRef.current
      if (payload && subscribedRef.current) {
        lastTrackedRef.current = null
        flushTrack()
      }
    }

    const onPageHide = () => {
      untrackAndSync()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onPageHide)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onPageHide)
      subscribedRef.current = false
      pendingTrackRef.current = null
      lastRequestedRef.current = null
      lastTrackedRef.current = null
      hasSyncedRef.current = false
      trackQueueRef.current = Promise.resolve()
      void channel.untrack().then(() => schedulePresenceSync())
      void supabase.removeChannel(channel)
      channelRef.current = null
      setPresenceByUserId(new Map())
      setPresenceSynced(false)
      setPresenceVersion(0)
    }
  }, [
    user?.id,
    applyPresenceState,
    schedulePresenceSync,
    applyOptimisticOwnPresence,
    flushTrack,
  ])

  const value = useMemo(
    (): GlobalPresenceContextValue => ({
      presenceByUserId,
      presenceSynced,
      presenceVersion,
      trackPresence,
      updateGlobalPresence,
    }),
    [presenceByUserId, presenceSynced, presenceVersion, trackPresence, updateGlobalPresence],
  )

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
