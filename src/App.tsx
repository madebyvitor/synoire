import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
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
      <Route element={<AppShell />}>
        <Route path="/painel" element={<DashboardPage />} />
        <Route path="/hubs" element={<HubsPage />} />
        <Route path="/hubs/:slug" element={<HubDetailPage />} />
        <Route path="/salas/:roomId" element={<RoomPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
