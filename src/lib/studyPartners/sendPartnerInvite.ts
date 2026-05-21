import { createPartnership } from './createPartnership'
import { deletePartnership } from './deletePartnership'
import { findProfileByUsername } from './findProfileByUsername'
import { mapPartnershipRow } from './mapPartnershipRow'
import { listPartnerships } from './listPartnerships'
import { listPartnershipRowsForPair } from './listPartnershipRowsForPair'
import type { SendInviteResult } from './types'

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, '')
}

export async function sendPartnerInvite(
  userId: string,
  username: string,
): Promise<SendInviteResult> {
  const normalized = normalizeUsername(username)
  if (normalized.length < 2) {
    return { ok: false, error: 'invalid_username' }
  }

  const profileResult = await findProfileByUsername(normalized)
  if (!profileResult.ok) {
    return { ok: false, error: 'not_found' }
  }

  const receiverId = profileResult.data.id
  if (receiverId === userId) {
    return { ok: false, error: 'self_invite' }
  }

  const existingResult = await listPartnerships(userId)
  if (!existingResult.ok) {
    return { ok: false, error: 'not_found' }
  }

  const existing = existingResult.data.find((p) => p.partnerUserId === receiverId)
  if (existing) {
    return { ok: false, error: 'already_exists' }
  }

  const rejectedRows = await listPartnershipRowsForPair(userId, receiverId)
  for (const row of rejectedRows) {
    if (row.status === 'rejected') {
      const del = await deletePartnership(row.id)
      if (!del.ok) return { ok: false, error: 'not_found' }
    }
  }

  const createResult = await createPartnership(userId, receiverId)
  if (!createResult.ok) {
    if (createResult.message.includes('Já existe')) {
      return { ok: false, error: 'already_exists' }
    }
    return { ok: false, error: 'not_found' }
  }

  const partnership = mapPartnershipRow(createResult.data, userId)
  if (!partnership) {
    return { ok: false, error: 'not_found' }
  }

  return { ok: true, partnership }
}
