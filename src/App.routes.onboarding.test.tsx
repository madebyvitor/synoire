import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  getSupabase: () => null,
}))

vi.mock('@/hooks/useUserStats', () => ({
  useUserStats: () => ({
    stats: {
      currentStreak: 0,
      totalHours: 0,
      weeklyGoalMinutes: 0,
      hasSeenWelcome: true,
    },
    isLoading: false,
    error: null,
    isSaving: false,
    refresh: vi.fn(),
    saveWeeklyGoal: vi.fn(async () => ({ ok: true as const })),
    completeWelcomeOnboarding: vi.fn(async () => ({ ok: true as const })),
  }),
}))

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}))

vi.mock('@/lib/hubs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/hubs')>()
  const { SAMPLE_HUBS } = await import('@/data/sampleHubs')
  return {
    ...actual,
    listHubs: vi.fn(async () => ({ ok: true as const, data: SAMPLE_HUBS })),
    getHubBySlug: vi.fn(async () => ({ ok: true as const, data: null })),
    listUserHubs: vi.fn(async () => ({ ok: true as const, data: [] })),
    joinUserHub: vi.fn(async () => ({ ok: true as const, data: undefined })),
    leaveUserHub: vi.fn(async () => ({ ok: true as const, data: undefined })),
    createPrivateHub: vi.fn(async () => ({
      ok: true as const,
      data: SAMPLE_HUBS[0],
    })),
  }
})

import { AppRoutes } from './App'
import { AuthProvider } from '@/contexts/AuthContext'
import { GlobalPresenceProvider } from '@/contexts/GlobalPresenceContext'
import { HubsProvider } from '@/contexts/HubsContext'
import { JoinedHubsProvider } from '@/contexts/JoinedHubsContext'
import { RoomInvitesProvider } from '@/contexts/RoomInvitesContext'
import { StudyPartnersProvider } from '@/contexts/StudyPartnersContext'
import { UserPlanProvider } from '@/contexts/UserPlanContext'

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <GlobalPresenceProvider>
        <UserPlanProvider>
          <StudyPartnersProvider>
            <RoomInvitesProvider>
              <HubsProvider>
                <JoinedHubsProvider>
                  <MemoryRouter initialEntries={[path]}>
                    <AppRoutes />
                  </MemoryRouter>
                </JoinedHubsProvider>
              </HubsProvider>
            </RoomInvitesProvider>
          </StudyPartnersProvider>
        </UserPlanProvider>
      </GlobalPresenceProvider>
    </AuthProvider>,
  )
}

describe('rotas com meta semanal pendente', () => {
  it('/hubs permanece em hubs e exibe modal de onboarding', async () => {
    renderAt('/hubs')
    expect(
      await screen.findByRole('heading', { name: /hubs por concurso/i, hidden: true }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^painel$/i })).not.toBeInTheDocument()
    expect(
      screen.getByRole('dialog', { name: /qual é o seu objetivo/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /não encontrou seu concurso/i, hidden: true }),
    ).toBeInTheDocument()
  })
})
