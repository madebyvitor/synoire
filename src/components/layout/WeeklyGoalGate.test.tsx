import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { WeeklyGoalGate } from './WeeklyGoalGate'

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}))

const saveWeeklyGoal = vi.fn(async () => ({ ok: true as const }))
const completeWelcomeOnboarding = vi.fn(async () => ({ ok: true as const }))

const mockStats = vi.hoisted(() => ({
  hasSeenWelcome: true,
  weeklyGoalMinutes: 0,
}))

vi.mock('@/hooks/useUserStats', () => ({
  useUserStats: () => ({
    stats: {
      currentStreak: 0,
      totalHours: 0,
      weeklyGoalMinutes: mockStats.weeklyGoalMinutes,
      hasSeenWelcome: mockStats.hasSeenWelcome,
    },
    isLoading: false,
    error: null,
    isSaving: false,
    refresh: vi.fn(),
    saveWeeklyGoal,
    completeWelcomeOnboarding,
  }),
}))

function HubsStub() {
  return <h1>Hubs por concurso</h1>
}

function PainelStub() {
  return <h1>Painel</h1>
}

describe('WeeklyGoalGate', () => {
  it('mantém /hubs sem redirecionar ao painel quando onboarding de meta pendente', () => {
    mockStats.hasSeenWelcome = true
    mockStats.weeklyGoalMinutes = 0

    render(
      <MemoryRouter initialEntries={['/hubs']}>
        <Routes>
          <Route element={<WeeklyGoalGate />}>
            <Route path="/hubs" element={<HubsStub />} />
            <Route path="/painel" element={<PainelStub />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /hubs por concurso/i, hidden: true }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^painel$/i)).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /qual é o seu objetivo/i })).toBeInTheDocument()
  })

  it('exibe welcome modal antes do onboarding de meta', () => {
    mockStats.hasSeenWelcome = false
    mockStats.weeklyGoalMinutes = 0

    render(
      <MemoryRouter initialEntries={['/hubs']}>
        <Routes>
          <Route element={<WeeklyGoalGate />}>
            <Route path="/hubs" element={<HubsStub />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('dialog', { name: /bem-vindo ao synoire/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /qual é o seu objetivo/i })).not.toBeInTheDocument()
  })

  it('avança para passo de meta ao clicar em Definir minha Meta', () => {
    mockStats.hasSeenWelcome = false
    mockStats.weeklyGoalMinutes = 0

    render(
      <MemoryRouter initialEntries={['/painel']}>
        <Routes>
          <Route element={<WeeklyGoalGate />}>
            <Route path="/painel" element={<PainelStub />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /definir minha meta/i }))
    expect(screen.getByRole('dialog', { name: /qual é o seu objetivo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/horas por semana/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvar e começar/i })).toBeInTheDocument()
  })
})
