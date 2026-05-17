export const REQUEST_NAME_MIN = 2
export const REQUEST_NAME_MAX = 120

export type HubRequestStatus = 'pending' | 'approved' | 'rejected'

export type HubRequestRow = {
  id: string
  user_id: string
  requested_name: string
  status: HubRequestStatus
  created_at: string
}
