export type RoomChatAuthor = {
  username: string
  avatar_url?: string | null
}

export type RoomChatMessage = {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  author: RoomChatAuthor
}

export type RoomChatAdapter = {
  fetchRecent(roomId: string, limit?: number): Promise<RoomChatMessage[]>
  send(roomId: string, content: string, userId: string): Promise<RoomChatMessage>
  subscribe(roomId: string, onInsert: (msg: RoomChatMessage) => void): () => void
}

export const ROOM_CHAT_MAX_LENGTH = 500
export const ROOM_CHAT_FETCH_LIMIT = 50

export const DEMO_USER_ID = 'demo-local-user'
export const DEMO_PEER_USER_ID = 'demo-peer-user'
