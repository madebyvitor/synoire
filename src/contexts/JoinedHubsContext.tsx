import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useUserPlan } from '@/contexts/UserPlanContext'
import {
  FREE_JOINED_HUB_LIMIT,
  isHubJoined,
  readJoinedHubSlugs,
  writeJoinedHubSlugs,
} from '@/lib/joinedHubs'

const HUB_LIMIT_PAYWALL_MESSAGE =
  'Glow users podem focar em concursos ilimitados.'

type JoinedHubsContextValue = {
  joinedSlugs: string[]
  isJoined: (slug: string) => boolean
  joinHub: (slug: string) => boolean
  leaveHub: (slug: string) => void
}

const JoinedHubsContext = createContext<JoinedHubsContextValue | null>(null)

export function JoinedHubsProvider({ children }: { children: ReactNode }) {
  const { hasGlowAccess, openPaywall } = useUserPlan()
  const [joinedSlugs, setJoinedSlugs] = useState(() => readJoinedHubSlugs())

  const persist = useCallback((next: string[]) => {
    setJoinedSlugs(next)
    writeJoinedHubSlugs(next)
  }, [])

  const isJoined = useCallback(
    (slug: string) => isHubJoined(slug, joinedSlugs),
    [joinedSlugs],
  )

  const joinHub = useCallback(
    (slug: string): boolean => {
      if (isHubJoined(slug, joinedSlugs)) return true

      if (!hasGlowAccess && joinedSlugs.length >= FREE_JOINED_HUB_LIMIT) {
        openPaywall(HUB_LIMIT_PAYWALL_MESSAGE)
        return false
      }

      persist([...joinedSlugs, slug])
      return true
    },
    [joinedSlugs, hasGlowAccess, openPaywall, persist],
  )

  const leaveHub = useCallback(
    (slug: string) => {
      if (!isHubJoined(slug, joinedSlugs)) return
      persist(joinedSlugs.filter((s) => s !== slug))
    },
    [joinedSlugs, persist],
  )

  const value = useMemo(
    () => ({
      joinedSlugs,
      isJoined,
      joinHub,
      leaveHub,
    }),
    [joinedSlugs, isJoined, joinHub, leaveHub],
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
