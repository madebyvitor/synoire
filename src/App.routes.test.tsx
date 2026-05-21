import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  getSupabase: () => null,
}))

vi.mock('@/hooks/useUserStats', () => ({
  useUserStats: () => ({
    stats: { currentStreak: 0, totalHours: 0, weeklyGoalMinutes: 1200 },
    isLoading: false,
    error: null,
    isSaving: false,
    refresh: vi.fn(),
    saveWeeklyGoal: vi.fn(async () => ({ ok: true as const })),
  }),
}))

vi.mock('@/hooks/useRoomEntry', () => ({
  useRoomEntry: () => ({
    room: {
      id: 'demo',
      hub_slug: 'pf',
      name: 'Sala demo',
      focus_cycle: '25/5',
      is_private: false,
      creator_id: 'user-1',
      current_timer_state: {
        status: 'idle',
        started_at: null,
        focus_sec: 1500,
        break_sec: 300,
      },
      present_count: 0,
      empty_since: null,
      created_at: '2026-05-16T12:00:00.000Z',
    },
    entryStatus: 'ready',
    entryMessage: null,
    roomLoading: false,
  }),
}))

vi.mock('@/lib/hubs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/hubs')>()
  const { SAMPLE_HUBS } = await import('@/data/sampleHubs')
  return {
    ...actual,
    listHubs: vi.fn(async () => ({ ok: true as const, data: SAMPLE_HUBS })),
    getHubBySlug: vi.fn(async (slug: string) => ({
      ok: true as const,
      data: SAMPLE_HUBS.find((h) => h.slug === slug) ?? null,
    })),
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

describe('rotas (smoke, sem backend)', () => {
  it('renderiza a home', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', {
        name: /estude junto/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /criar conta/i }).length).toBeGreaterThan(0)
  })

  it('renderiza o painel dentro do shell', () => {
    renderAt('/painel')
    expect(screen.getByRole('heading', { name: /painel/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renderiza a lista de hubs', async () => {
    renderAt('/hubs')
    expect(
      screen.getByRole('heading', { name: /hubs por concurso/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /não encontrou seu concurso/i }),
    ).toBeInTheDocument()
  })

  it('renderiza detalhe de hub por slug', async () => {
    renderAt('/hubs/pf')
    expect(
      await screen.findByRole('heading', { name: /polícia federal/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar sala/i })).toBeInTheDocument()
  })

  it('renderiza sala de estudo com onboarding de sessão', () => {
    renderAt('/salas/demo')
    expect(
      screen.getByRole('main', {
        name: /^sala de estudo:/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /entrar no ciclo atual/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /aguardar próximo ciclo/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^iniciar$/i })).not.toBeInTheDocument()
  })

  it('sala de estudo não usa o shell lateral', () => {
    renderAt('/salas/demo')
    expect(screen.queryByRole('link', { name: /^hubs$/i })).not.toBeInTheDocument()
  })

  it('renderiza perfil', () => {
    renderAt('/perfil')
    expect(screen.getByRole('heading', { name: /^perfil$/i })).toBeInTheDocument()
  })

  it('renderiza página de entrar com formulário', () => {
    renderAt('/entrar')
    expect(screen.getByRole('heading', { name: /^entrar$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^entrar$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /criar conta/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument()
  })
})
