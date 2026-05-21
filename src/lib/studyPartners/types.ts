export type PartnershipDbStatus = 'pending' | 'accepted' | 'rejected'

export type PartnershipStatus =
  | 'pending_incoming'
  | 'pending_outgoing'
  | 'accepted'

export type PartnershipRow = {
  id: string
  sender_id: string
  receiver_id: string
  status: PartnershipDbStatus
  created_at?: string | null
}

export type MappedPartnership = {
  id: string
  partnerUserId: string
  status: PartnershipStatus
  createdAt: string
}

export type PartnerProfileEnrichment = {
  id: string
  username: string
  displayName: string
  avatarUrl: string
  currentStreak: number
}

export type PartnerPresenceEntry = {
  isOnline: boolean
  roomId: string | null
  roomLabel: string | null
}

export type StudyPartnerView = {
  id: string
  username: string
  displayName: string
  avatarUrl: string
  currentStreak: number
  isOnline: boolean
  currentRoomLabel: string | null
  currentRoomId: string | null
  partnershipStatus: PartnershipStatus
  partnershipId: string
}

export type PartnerLists = {
  acceptedPartners: StudyPartnerView[]
  onlinePartners: StudyPartnerView[]
  offlinePartners: StudyPartnerView[]
  incomingInvites: StudyPartnerView[]
  outgoingInvites: StudyPartnerView[]
}

export type PartnershipsResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }

export type SendInviteResult =
  | { ok: true; partnership: MappedPartnership }
  | { ok: false; error: 'not_found' | 'already_exists' | 'invalid_username' | 'self_invite' }
