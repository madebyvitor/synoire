import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AuthenticatedPresenceSync } from '@/components/presence/AuthenticatedPresenceSync'
import { GlowPaywallModal } from '@/components/premium/GlowPaywallModal'
import { AppShell } from '@/components/layout/AppShell'
import { WeeklyGoalGate } from '@/components/layout/WeeklyGoalGate'
import { AuthProvider } from '@/contexts/AuthContext'
import { GlobalPresenceProvider } from '@/contexts/GlobalPresenceContext'
import { HubsProvider } from '@/contexts/HubsContext'
import { JoinedHubsProvider } from '@/contexts/JoinedHubsContext'
import { RoomInvitesProvider } from '@/contexts/RoomInvitesContext'
import { StudyPartnersProvider } from '@/contexts/StudyPartnersContext'
import { UserPlanProvider } from '@/contexts/UserPlanContext'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HomePage } from '@/pages/HomePage'
import { HubDetailPage } from '@/pages/HubDetailPage'
import { HubsPage } from '@/pages/HubsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RoomPage } from '@/pages/RoomPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/entrar" element={<AuthPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedPresenceSync />}>
          <Route path="/salas/:roomId" element={<RoomPage />} />
          <Route element={<AppShell />}>
            <Route element={<WeeklyGoalGate />}>
              <Route path="/painel" element={<DashboardPage />} />
              <Route path="/hubs" element={<HubsPage />} />
              <Route path="/hubs/:slug" element={<HubDetailPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalPresenceProvider>
        <UserPlanProvider>
          <StudyPartnersProvider>
            <RoomInvitesProvider>
              <HubsProvider>
                <JoinedHubsProvider>
                  <BrowserRouter>
                    <AppRoutes />
                    <GlowPaywallModal />
                  </BrowserRouter>
                </JoinedHubsProvider>
              </HubsProvider>
            </RoomInvitesProvider>
          </StudyPartnersProvider>
        </UserPlanProvider>
      </GlobalPresenceProvider>
    </AuthProvider>
  )
}
