import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useHubs } from '@/contexts/HubsContext'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { FREE_JOINED_HUB_LIMIT } from '@/lib/joinedHubs'
import {
  joinUserHub,
  leaveUserHub,
  listUserHubs,
  type HubView,
} from '@/lib/hubs'

const HUB_LIMIT_PAYWALL_MESSAGE =
  'Glow users podem focar em concursos ilimitados.'

type JoinedHubsContextValue = {
  joinedHubs: HubView[]
  joinedSlugs: string[]
  isLoading: boolean
  isJoined: (slug: string) => boolean
  joinHub: (slug: string) => Promise<boolean>
  leaveHub: (slug: string) => Promise<void>
  refreshJoined: () => Promise<void>
}

const JoinedHubsContext = createContext<JoinedHubsContextValue | null>(null)

export function JoinedHubsProvider({ children }: { children: ReactNode }) {
  const { user, isSessionReady } = useAuth()
  const { getHubId } = useHubs()
  const { hasGlowAccess, openPaywall } = useUserPlan()
  const [joinedHubs, setJoinedHubs] = useState<HubView[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const joinedSlugs = useMemo(
    () => joinedHubs.map((h) => h.slug),
    [joinedHubs],
  )

  const refreshJoined = useCallback(async () => {
    if (!isSessionReady || !user?.id) {
      setJoinedHubs([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const result = await listUserHubs(user.id)
    if (result.ok) {
      setJoinedHubs(result.data)
    } else {
      setJoinedHubs([])
    }
    setIsLoading(false)
  }, [isSessionReady, user?.id])

  useEffect(() => {
    void refreshJoined()
  }, [refreshJoined])

  const isJoined = useCallback(
    (slug: string) => joinedSlugs.includes(slug),
    [joinedSlugs],
  )

  const joinHub = useCallback(
    async (slug: string): Promise<boolean> => {
      if (!user?.id) return false
      if (joinedSlugs.includes(slug)) return true

      if (!hasGlowAccess && joinedSlugs.length >= FREE_JOINED_HUB_LIMIT) {
        openPaywall(HUB_LIMIT_PAYWALL_MESSAGE)
        return false
      }

      const hubId = getHubId(slug)
      if (!hubId) return false

      const result = await joinUserHub(user.id, hubId, slug)
      if (!result.ok) return false

      await refreshJoined()
      return true
    },
    [
      user?.id,
      joinedSlugs,
      hasGlowAccess,
      openPaywall,
      getHubId,
      refreshJoined,
    ],
  )

  const leaveHub = useCallback(
    async (slug: string) => {
      if (!user?.id || !joinedSlugs.includes(slug)) return

      const hubId = getHubId(slug) ?? joinedHubs.find((h) => h.slug === slug)?.id
      if (!hubId) return

      const result = await leaveUserHub(user.id, hubId, slug)
      if (!result.ok) return

      await refreshJoined()
    },
    [user?.id, joinedSlugs, getHubId, joinedHubs, refreshJoined],
  )

  const value = useMemo(
    () => ({
      joinedHubs,
      joinedSlugs,
      isLoading,
      isJoined,
      joinHub,
      leaveHub,
      refreshJoined,
    }),
    [joinedHubs, joinedSlugs, isLoading, isJoined, joinHub, leaveHub, refreshJoined],
  )

  return (
    <JoinedHubsContext.Provider value={value}>{children}</JoinedHubsContext.Provider>
  )
}

export function useJoinedHubs(): JoinedHubsContextValue {
  const ctx = useContext(JoinedHubsContext)
  if (!ctx) {
    throw new Error('useJoinedHubs must be used within JoinedHubsProvider')
  }
  return ctx
}
