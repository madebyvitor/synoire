import { describe, expect, it } from 'vitest'
import { buildRoomInviteUrl } from './roomInviteUrl'

describe('buildRoomInviteUrl', () => {
  it('builds encoded room path under origin', () => {
    expect(buildRoomInviteUrl('room-abc', 'https://synoire.app')).toBe(
      'https://synoire.app/salas/room-abc',
    )
  })

  it('encodes special characters in room id', () => {
    expect(buildRoomInviteUrl('a/b c', 'http://localhost:5173')).toBe(
      'http://localhost:5173/salas/a%2Fb%20c',
    )
  })
})
