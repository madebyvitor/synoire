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
import { useGlobalPresence } from '@/contexts/GlobalPresenceContext'
import { usePartnerPresence } from '@/hooks/usePartnerPresence'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  applyPartnershipRealtimeEvent,
  buildPartnerLists,
  fetchPartnerEnrichment,
  isDemoMode,
  listPartnerships,
  sendPartnerInvite as sendPartnerInviteLib,
  subscribePartnershipsRealtime,
  updatePartnershipStatus,
  type ApplyPartnershipRealtimeResult,
  type MappedPartnership,
  type PartnerLists,
  type PartnerProfileEnrichment,
  type SendInviteResult,
} from '@/lib/studyPartners'

type StudyPartnersContextValue = PartnerLists & {
  isLoading: boolean
  error: string | null
  sendPartnerInvite: (username: string) => Promise<SendInviteResult>
  acceptInvite: (partnershipId: string) => Promise<void>
  declineInvite: (partnershipId: string) => Promise<void>
  refresh: (options?: { silent?: boolean }) => Promise<void>
}

const StudyPartnersContext = createContext<StudyPartnersContextValue | null>(null)

export function StudyPartnersProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [partnerships, setPartnerships] = useState<MappedPartnership[]>([])
  const [enrichment, setEnrichment] = useState(
    () => new Map<string, PartnerProfileEnrichment>(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteToast, setInviteToast] = useState({ message: '', visible: false })

  const partnerUserIds = useMemo(
    () => partnerships.map((p) => p.partnerUserId),
    [partnerships],
  )
  const { presenceVersion, presenceSynced } = useGlobalPresence()
  const presence = usePartnerPresence(partnerUserIds)

  const lists = useMemo(
    () => buildPartnerLists(partnerships, enrichment, presence),
    [partnerships, enrichment, presence, presenceVersion, presenceSynced],
  )

  const applyRealtimeSideEffects = useCallback((result: ApplyPartnershipRealtimeResult) => {
    if (result.removedPartnerUserId) {
      setEnrichment((prev) => {
        const next = new Map(prev)
        next.delete(result.removedPartnerUserId!)
        return next
      })
    }

    if (!result.partnerUserIdToEnrich) return

    const partnerId = result.partnerUserIdToEnrich
    const showToast = result.showIncomingInviteToast

    void fetchPartnerEnrichment([partnerId]).then((fetched) => {
      setEnrichment((prev) => {
        const next = new Map(prev)
        for (const [id, profile] of fetched) next.set(id, profile)
        return next
      })
      if (showToast) {
        const username = fetched.get(partnerId)?.username ?? 'estudante'
        setInviteToast({
          message: `Você recebeu um novo convite de @${username}!`,
          visible: true,
        })
      }
    })
  }, [])

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const userId = user?.id
    const silent = options?.silent === true

    if (!userId) {
      setPartnerships([])
      setEnrichment(new Map())
      setError(null)
      if (!silent) setIsLoading(false)
      return
    }

    if (!silent) setIsLoading(true)
    setError(null)

    const partnershipsResult = await listPartnerships(userId)
    if (!partnershipsResult.ok) {
      setPartnerships([])
      setEnrichment(new Map())
      setError(partnershipsResult.message)
      if (!silent) setIsLoading(false)
      return
    }

    setPartnerships(partnershipsResult.data)
    const partnerIds = partnershipsResult.data.map((p) => p.partnerUserId)
    setEnrichment(await fetchPartnerEnrichment(partnerIds))
    setError(null)
    if (!silent) setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, refresh])

  useEffect(() => {
    const userId = user?.id
    if (!userId || authLoading || isDemoMode || !isSupabaseConfigured) return

    return subscribePartnershipsRealtime(userId, (event) => {
      let sideEffect: ApplyPartnershipRealtimeResult | null = null
      setPartnerships((prev) => {
        const result = applyPartnershipRealtimeEvent(prev, event, userId)
        sideEffect = result
        return result.partnerships
      })
      if (sideEffect) applyRealtimeSideEffects(sideEffect)
    })
  }, [user?.id, authLoading, applyRealtimeSideEffects])

  const sendInvite = useCallback(
    async (username: string): Promise<SendInviteResult> => {
      const userId = user?.id
      if (!userId) {
        return { ok: false, error: 'invalid_username' }
      }

      const result = await sendPartnerInviteLib(userId, username)
      if (result.ok) {
        const { partnership } = result
        setPartnerships((prev) => {
          const index = prev.findIndex((p) => p.id === partnership.id)
          if (index === -1) return [...prev, partnership]
          const next = [...prev]
          next[index] = partnership
          return next
        })

        void fetchPartnerEnrichment([partnership.partnerUserId]).then((fetched) => {
          setEnrichment((prev) => {
            const next = new Map(prev)
            for (const [id, profile] of fetched) next.set(id, profile)
            return next
          })
        })

        void refresh({ silent: true })
      }
      return result
    },
    [user?.id, refresh],
  )

  const acceptInvite = useCallback(
    async (partnershipId: string) => {
      const update = await updatePartnershipStatus(partnershipId, 'accepted')
      if (update.ok) {
        await refresh()
      }
    },
    [refresh],
  )

  const declineInvite = useCallback(
    async (partnershipId: string) => {
      const update = await updatePartnershipStatus(partnershipId, 'rejected')
      if (update.ok) {
        await refresh()
      }
    },
    [refresh],
  )

  const value = useMemo(
    () => ({
      ...lists,
      isLoading: authLoading || isLoading,
      error,
      sendPartnerInvite: sendInvite,
      acceptInvite,
      declineInvite,
      refresh,
    }),
    [lists, authLoading, isLoading, error, sendInvite, acceptInvite, declineInvite, refresh],
  )

  return (
    <StudyPartnersContext.Provider value={value}>
      {children}
      <AppToast
        message={inviteToast.message}
        visible={inviteToast.visible}
        onDismiss={() => setInviteToast((t) => ({ ...t, visible: false }))}
      />
    </StudyPartnersContext.Provider>
  )
}

export function useStudyPartners(): StudyPartnersContextValue {
  const ctx = useContext(StudyPartnersContext)
  if (!ctx) {
    throw new Error('useStudyPartners must be used within StudyPartnersProvider')
  }
  return ctx
}
