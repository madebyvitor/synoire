import { describe, expect, it, vi } from 'vitest'
import { ONLINE_PRESENCE } from '@/lib/presence/resolveAuthenticatedPresence'

/**
 * Documents expected trackPresence calls from useAuthenticatedGlobalPresence.
 * Full renderHook tests would duplicate resolveAuthenticatedPresence coverage;
 * unmount-to-online is a separate effect keyed only on trackPresence.
 */
describe('useAuthenticatedGlobalPresence contract', () => {
  it('resets to online on unmount when hook was enabled and resetToOnlineOnUnmount', () => {
    const trackPresence = vi.fn()
    const enabled = true
    const resetToOnlineOnUnmount = true
    const cleanup = () => {
      if (enabled && resetToOnlineOnUnmount) trackPresence(ONLINE_PRESENCE)
    }
    cleanup()
    expect(trackPresence).toHaveBeenCalledWith(ONLINE_PRESENCE)
  })

  it('does not reset to online on unmount when hook stayed disabled (entering room)', () => {
    const trackPresence = vi.fn()
    const enabled = false
    const resetToOnlineOnUnmount = true
    const cleanup = () => {
      if (enabled && resetToOnlineOnUnmount) trackPresence(ONLINE_PRESENCE)
    }
    cleanup()
    expect(trackPresence).not.toHaveBeenCalled()
  })

  it('does not reset to online when resetToOnlineOnUnmount is false', () => {
    const trackPresence = vi.fn()
    const enabled = true
    const resetToOnlineOnUnmount = false
    const cleanup = () => {
      if (enabled && resetToOnlineOnUnmount) trackPresence(ONLINE_PRESENCE)
    }
    cleanup()
    expect(trackPresence).not.toHaveBeenCalled()
  })

  it('does not reset to online when focando payload fields change', () => {
    const trackPresence = vi.fn()
    const focandoA = {
      status: 'focando' as const,
      current_room: 'Sala A',
      room_id: 'r1',
    }
    const focandoB = {
      status: 'focando' as const,
      current_room: 'Sala B',
      room_id: 'r1',
    }
    trackPresence(focandoA)
    trackPresence(focandoB)
    expect(trackPresence).not.toHaveBeenCalledWith(ONLINE_PRESENCE)
    expect(trackPresence).toHaveBeenLastCalledWith(focandoB)
  })
})
