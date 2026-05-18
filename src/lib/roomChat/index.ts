export type { RoomChatAdapter, RoomChatAuthor, RoomChatMessage } from './types'
export {
  DEMO_PEER_USER_ID,
  DEMO_USER_ID,
  ROOM_CHAT_FETCH_LIMIT,
  ROOM_CHAT_MAX_LENGTH,
} from './types'
export { mockRoomChatAdapter } from './mockRoomChatAdapter'
export { getRoomChatAdapter, supabaseRoomChatAdapter } from './supabaseRoomChatAdapter'
export {
  appendMessageIfNew,
  canSendRoomChat,
  dedupeMessagesById,
  formatMessageTime,
  isValidChatContent,
  sortMessagesAsc,
  trimChatContent,
} from './utils'
export type { RoomPhase, SessionMode } from './utils'
