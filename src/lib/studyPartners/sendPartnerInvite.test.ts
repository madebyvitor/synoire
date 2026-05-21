import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendPartnerInvite } from './sendPartnerInvite'

const findProfileByUsernameMock = vi.fn()
const listPartnershipsMock = vi.fn()
const listPartnershipRowsForPairMock = vi.fn()
const deletePartnershipMock = vi.fn()
const createPartnershipMock = vi.fn()

vi.mock('./findProfileByUsername', () => ({
  findProfileByUsername: (...args: unknown[]) => findProfileByUsernameMock(...args),
}))

vi.mock('./listPartnerships', () => ({
  listPartnerships: (...args: unknown[]) => listPartnershipsMock(...args),
}))

vi.mock('./listPartnershipRowsForPair', () => ({
  listPartnershipRowsForPair: (...args: unknown[]) => listPartnershipRowsForPairMock(...args),
}))

vi.mock('./deletePartnership', () => ({
  deletePartnership: (...args: unknown[]) => deletePartnershipMock(...args),
}))

vi.mock('./createPartnership', () => ({
  createPartnership: (...args: unknown[]) => createPartnershipMock(...args),
}))

const SENDER = 'user-sender'
const RECEIVER = 'user-receiver'

describe('sendPartnerInvite', () => {
  beforeEach(() => {
    findProfileByUsernameMock.mockReset()
    listPartnershipsMock.mockReset()
    listPartnershipRowsForPairMock.mockReset()
    deletePartnershipMock.mockReset()
    createPartnershipMock.mockReset()

    findProfileByUsernameMock.mockResolvedValue({
      ok: true,
      data: { id: RECEIVER, username: 'marina', avatarUrl: null },
    })
    listPartnershipsMock.mockResolvedValue({ ok: true, data: [] })
    listPartnershipRowsForPairMock.mockResolvedValue([])
    createPartnershipMock.mockResolvedValue({
      ok: true,
      data: {
        id: 'ps-new',
        sender_id: SENDER,
        receiver_id: RECEIVER,
        status: 'pending',
        created_at: '2026-05-20T12:00:00Z',
      },
    })
  })

  it('returns pending_outgoing partnership on success', async () => {
    const result = await sendPartnerInvite(SENDER, 'marina')

    expect(result).toEqual({
      ok: true,
      partnership: {
        id: 'ps-new',
        partnerUserId: RECEIVER,
        status: 'pending_outgoing',
        createdAt: '2026-05-20T12:00:00Z',
      },
    })
    expect(createPartnershipMock).toHaveBeenCalledWith(SENDER, RECEIVER)
  })

  it('strips leading @ from username before lookup', async () => {
    await sendPartnerInvite(SENDER, '@marina')
    expect(findProfileByUsernameMock).toHaveBeenCalledWith('marina')
  })
})
