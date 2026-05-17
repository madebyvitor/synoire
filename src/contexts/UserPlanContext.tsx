import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readDevPlanTier, writeDevPlanTier } from '@/lib/plan/devStorage'
import { hasGlowAccess, isPlanTier, type PlanTier } from '@/lib/plan/types'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

type UserPlanContextValue = {
  planTier: PlanTier
  isLoading: boolean
  hasGlowAccess: boolean
  setPlanTier: (tier: PlanTier) => void
  paywallOpen: boolean
  paywallMessage: string | null
  openPaywall: (message?: string) => void
  closePaywall: () => void
}

const UserPlanContext = createContext<UserPlanContextValue | null>(null)

export function UserPlanProvider({ children }: { children: ReactNode }) {
  const [planTier, setPlanTierState] = useState<PlanTier>(() => readDevPlanTier() ?? 'free')
  const [isLoading, setIsLoading] = useState(true)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null)

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

      try {
        const supabase = getSupabase()
        if (!isSupabaseConfigured || !supabase) {
          if (!cancelled) setPlanTierState('free')
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) setPlanTierState('free')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('plan_tier')
          .eq('id', user.id)
          .maybeSingle()

        if (!cancelled && !error && data?.plan_tier && isPlanTier(data.plan_tier)) {
          setPlanTierState(data.plan_tier)
        } else if (!cancelled) {
          setPlanTierState('free')
        }
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
  }, [])

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
      paywallOpen,
      paywallMessage,
      openPaywall,
      closePaywall,
    }),
    [planTier, isLoading, setPlanTier, paywallOpen, paywallMessage, openPaywall, closePaywall],
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
