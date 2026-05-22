import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  GlobalPresenceProvider,
  useGlobalPresence,
} from '@/contexts/GlobalPresenceContext'
import { ONLINE_PRESENCE } from '@/lib/presence/resolveAuthenticatedPresence'

let subscribeCallback: ((status: string) => void | Promise<void>) | null = null

const track = vi.fn().mockResolvedValue('ok')
const untrack = vi.fn().mockResolvedValue('ok')
const presenceState = vi.fn().mockReturnValue({})
const removeChannel = vi.fn()

function createMockChannel() {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb: (status: string) => void | Promise<void>) => {
      subscribeCallback = cb
      return channel
    }),
    track,
    untrack,
    presenceState,
  }
  return channel
}

const mockChannel = createMockChannel()

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({
    channel: vi.fn(() => mockChannel),
    removeChannel,
  }),
}))

vi.mock('@/lib/studyPartners/demo', () => ({
  isDemoMode: false,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    isLoading: false,
    isAuthenticated: true,
  }),
}))

vi.mock('@/lib/presence/presenceTabId', () => ({
  getPresenceTabId: () => 'tab-test',
  buildPresenceChannelKey: (userId: string, tabId: string) => `${userId}:${tabId}`,
}))

function PresenceProbe({
  onReady,
}: {
  onReady: (api: ReturnType<typeof useGlobalPresence>) => void
}) {
  const api = useGlobalPresence()
  onReady(api)
  return null
}

describe('GlobalPresenceProvider', () => {
  beforeEach(() => {
    subscribeCallback = null
    track.mockClear()
    untrack.mockClear()
    presenceState.mockClear()
    removeChannel.mockClear()
    mockChannel.on.mockClear()
    mockChannel.subscribe.mockClear()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  it('tracks ONLINE_PRESENCE on SUBSCRIBED when no pending payload', async () => {
    let api: ReturnType<typeof useGlobalPresence> | null = null

    render(
      <GlobalPresenceProvider>
        <PresenceProbe onReady={(value) => { api = value }} />
      </GlobalPresenceProvider>,
    )

    await waitFor(() => expect(subscribeCallback).not.toBeNull())
    await subscribeCallback!('SUBSCRIBED')

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        ...ONLINE_PRESENCE,
        tracked_at: expect.any(String),
      }),
    )
    expect(presenceState).toHaveBeenCalled()
    await waitFor(() => expect(api?.presenceSynced).toBe(true))
  })

  it('tracks pending focando payload on SUBSCRIBED when set before subscribe', async () => {
    let api: ReturnType<typeof useGlobalPresence> | null = null

    render(
      <GlobalPresenceProvider>
        <PresenceProbe onReady={(value) => { api = value }} />
      </GlobalPresenceProvider>,
    )

    await waitFor(() => expect(api).not.toBeNull())

    api!.updateGlobalPresence({
      status: 'focando',
      current_room: 'Entrando na sala…',
      room_id: 'room-1',
    })

    await waitFor(() => expect(subscribeCallback).not.toBeNull())
    track.mockClear()
    await subscribeCallback!('SUBSCRIBED')

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        status: 'focando',
        current_room: 'Entrando na sala…',
        room_id: 'room-1',
        tracked_at: expect.any(String),
      }),
    )
  })

  it('dedupes identical consecutive track requests', async () => {
    let api: ReturnType<typeof useGlobalPresence> | null = null
    const focando = {
      status: 'focando' as const,
      current_room: 'Sala A',
      room_id: 'room-1',
    }

    render(
      <GlobalPresenceProvider>
        <PresenceProbe onReady={(value) => { api = value }} />
      </GlobalPresenceProvider>,
    )

    await waitFor(() => expect(subscribeCallback).not.toBeNull())
    await subscribeCallback!('SUBSCRIBED')
    track.mockClear()

    api!.trackPresence(focando)
    await waitFor(() => expect(track).toHaveBeenCalledTimes(1))

    track.mockClear()
    api!.trackPresence(focando)
    api!.trackPresence(focando)

    await waitFor(() => expect(track).toHaveBeenCalledTimes(0))
  })

  it('sets presenceSynced after subscribe and sync', async () => {
    let api: ReturnType<typeof useGlobalPresence> | null = null

    render(
      <GlobalPresenceProvider>
        <PresenceProbe onReady={(value) => { api = value }} />
      </GlobalPresenceProvider>,
    )

    expect(api?.presenceSynced).toBe(false)
    await waitFor(() => expect(subscribeCallback).not.toBeNull())
    await subscribeCallback!('SUBSCRIBED')
    await waitFor(() => expect(api?.presenceSynced).toBe(true))
  })
})
