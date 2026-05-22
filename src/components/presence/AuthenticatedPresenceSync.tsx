import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthenticatedGlobalPresence } from '@/hooks/useAuthenticatedGlobalPresence'
import { isRoomPath } from '@/lib/presence/resolveAuthenticatedPresence'

export function AuthenticatedPresenceSync() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const inRoom = isRoomPath(pathname)

  useAuthenticatedGlobalPresence({
    enabled: isAuthenticated && !inRoom,
    pathname,
    resetToOnlineOnUnmount: true,
  })

  return <Outlet />
}
