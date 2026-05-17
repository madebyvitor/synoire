import { describe, expect, it } from 'vitest'
import {
  buildRoomName,
  formatRoomCardTimeLabel,
  getPrepRemainingSeconds,
  isRoomExpired,
  validateTheme,
} from './utils'
import type { RoomTimerPayload, StudyRoom } from './types'
import { ROOM_EMPTY_TTL_HOURS, ROOM_PREP_SECONDS } from './types'

const t0 = new Date('2026-05-16T12:00:00.000Z')

function baseRoom(overrides: Partial<StudyRoom> = {}): StudyRoom {
  return {
    id: 'room-1',
    hub_slug: 'trt',
    name: 'Direito • 25/5',
    theme: 'Direito',
    focus_cycle: '25/5',
    is_private: false,
    current_timer_state: {
      status: 'idle',
      started_at: null,
      focus_sec: 1500,
      break_sec: 300,
    },
    present_count: 0,
    empty_since: t0.toISOString(),
    created_at: t0.toISOString(),
    ...overrides,
  }
}

describe('buildRoomName', () => {
  it('composes theme and cycle', () => {
    expect(buildRoomName('Informática', '50/10')).toBe('Informática • 50/10')
  })
})

describe('validateTheme', () => {
  it('rejects empty', () => {
    expect(validateTheme('   ').ok).toBe(false)
  })

  it('accepts trimmed theme up to 25 chars', () => {
    const r = validateTheme('  Redação  ')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('Redação')
  })

  it('rejects over 25 chars', () => {
    expect(validateTheme('a'.repeat(26)).ok).toBe(false)
  })
})

describe('getPrepRemainingSeconds', () => {
  it('counts down 60s prep from started_at', () => {
    const startedAt = new Date(t0.getTime() - 15 * 1000).toISOString()
    const state: RoomTimerPayload = {
      status: 'idle',
      started_at: startedAt,
      focus_sec: 5400,
      break_sec: 900,
    }
    expect(getPrepRemainingSeconds(state, t0)).toBe(ROOM_PREP_SECONDS - 15)
  })
})

describe('formatRoomCardTimeLabel', () => {
  it('shows 1 minute prep for idle room regardless of focus length', () => {
    const state: RoomTimerPayload = {
      status: 'idle',
      started_at: t0.toISOString(),
      focus_sec: 5400,
      break_sec: 900,
    }
    expect(formatRoomCardTimeLabel(state, t0)).toBe('Começa em 01:00')
  })

  it('shows em foco agora during active focus', () => {
    const startedAt = new Date(t0.getTime() - 5 * 60 * 1000).toISOString()
    const state: RoomTimerPayload = {
      status: 'focus',
      started_at: startedAt,
      focus_sec: 1500,
      break_sec: 300,
    }
    expect(formatRoomCardTimeLabel(state, t0)).toBe('Em foco agora')
  })

  it('shows countdown during break', () => {
    const startedAt = new Date(t0.getTime() - 2 * 60 * 1000).toISOString()
    const state: RoomTimerPayload = {
      status: 'break',
      started_at: startedAt,
      focus_sec: 1500,
      break_sec: 300,
    }
    expect(formatRoomCardTimeLabel(state, t0)).toBe('Começa em 03:00')
  })
})

describe('isRoomExpired', () => {
  it('expires empty room after TTL', () => {
    const old = new Date(
      t0.getTime() - (ROOM_EMPTY_TTL_HOURS + 1) * 60 * 60 * 1000,
    ).toISOString()
    expect(isRoomExpired(baseRoom({ empty_since: old }), t0.getTime())).toBe(true)
  })

  it('keeps room with presence', () => {
    const old = new Date(
      t0.getTime() - (ROOM_EMPTY_TTL_HOURS + 1) * 60 * 60 * 1000,
    ).toISOString()
    expect(
      isRoomExpired(baseRoom({ present_count: 2, empty_since: old }), t0.getTime()),
    ).toBe(false)
  })
})
