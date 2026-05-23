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
import {
  clearDevPlanTier,
  readDevPlanTier,
  writeDevPlanTier,
} from '@/lib/plan/devStorage'
import { hasGlowAccess, isPlanTier, type PlanTier } from '@/lib/plan/types'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

const GLOW_ACTIVATION_POLL_ATTEMPTS = 10
const GLOW_ACTIVATION_POLL_INTERVAL_MS = 2000

type UserPlanContextValue = {
  planTier: PlanTier
  isLoading: boolean
  hasGlowAccess: boolean
  setPlanTier: (tier: PlanTier) => void
  refreshPlanTier: (options?: { clearDevOverride?: boolean }) => Promise<void>
  waitForGlowActivation: (options?: {
    clearDevOverride?: boolean
    maxAttempts?: number
    intervalMs?: number
  }) => Promise<boolean>
  paywallOpen: boolean
  paywallMessage: string | null
  openPaywall: (message?: string) => void
  closePaywall: () => void
}

const UserPlanContext = createContext<UserPlanContextValue | null>(null)

async function fetchPlanTierFromDb(): Promise<PlanTier> {
  const supabase = getSupabase()
  if (!isSupabaseConfigured || !supabase) return 'free'

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'free'

  const { data, error } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', user.id)
    .maybeSingle()

  if (!error && data?.plan_tier && isPlanTier(data.plan_tier)) {
    return data.plan_tier
  }
  return 'free'
}

export function UserPlanProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, isSessionReady } = useAuth()
  const [planTier, setPlanTierState] = useState<PlanTier>(() => readDevPlanTier() ?? 'free')
  const [isLoading, setIsLoading] = useState(true)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null)

  const refreshPlanTier = useCallback(
    async (options?: { clearDevOverride?: boolean }) => {
      if (options?.clearDevOverride) {
        clearDevPlanTier()
      }

      const devOverride = readDevPlanTier()
      if (devOverride && !options?.clearDevOverride) {
        setPlanTierState(devOverride)
        return
      }

      try {
        const tier = await fetchPlanTierFromDb()
        setPlanTierState(tier)
      } catch {
        setPlanTierState('free')
      }
    },
    [],
  )

  const waitForGlowActivation = useCallback(
    async (options?: {
      clearDevOverride?: boolean
      maxAttempts?: number
      intervalMs?: number
    }) => {
      if (options?.clearDevOverride) {
        clearDevPlanTier()
      }

      const maxAttempts = options?.maxAttempts ?? GLOW_ACTIVATION_POLL_ATTEMPTS
      const intervalMs = options?.intervalMs ?? GLOW_ACTIVATION_POLL_INTERVAL_MS

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const tier = await fetchPlanTierFromDb()
          setPlanTierState(tier)
          if (hasGlowAccess(tier)) return true
        } catch {
          setPlanTierState('free')
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs))
        }
      }

      return false
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    async function loadPlanTier() {
      const devOverride = readDevPlanTier()
      if (devOverride) {
        if (!cancelled) {
          setPlanTierState(devOverride)
          setIsLoading(false)
        }
        return
      }

      if (!isSessionReady) {
        if (!cancelled) setIsLoading(authLoading)
        return
      }

      setIsLoading(true)
      try {
        const tier = await fetchPlanTierFromDb()
        if (!cancelled) setPlanTierState(tier)
      } catch {
        if (!cancelled) setPlanTierState('free')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadPlanTier()
    return () => {
      cancelled = true
    }
  }, [user?.id, isSessionReady, authLoading])

  const setPlanTier = useCallback((tier: PlanTier) => {
    setPlanTierState(tier)
    writeDevPlanTier(tier)
  }, [])

  const openPaywall = useCallback((message?: string) => {
    setPaywallMessage(message ?? null)
    setPaywallOpen(true)
  }, [])
  const closePaywall = useCallback(() => {
    setPaywallOpen(false)
    setPaywallMessage(null)
  }, [])

  const value = useMemo(
    () => ({
      planTier,
      isLoading,
      hasGlowAccess: hasGlowAccess(planTier),
      setPlanTier,
      refreshPlanTier,
      waitForGlowActivation,
      paywallOpen,
      paywallMessage,
      openPaywall,
      closePaywall,
    }),
    [
      planTier,
      isLoading,
      setPlanTier,
      refreshPlanTier,
      waitForGlowActivation,
      paywallOpen,
      paywallMessage,
      openPaywall,
      closePaywall,
    ],
  )

  return <UserPlanContext.Provider value={value}>{children}</UserPlanContext.Provider>
}

export function useUserPlan(): UserPlanContextValue {
  const ctx = useContext(UserPlanContext)
  if (!ctx) {
    throw new Error('useUserPlan must be used within UserPlanProvider')
  }
  return ctx
}
