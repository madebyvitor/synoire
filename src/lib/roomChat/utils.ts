import type { RoomChatMessage } from './types'

export type SessionMode = 'onboarding' | 'lounge' | 'active'
export type RoomPhase = 'focus' | 'break' | 'long_break'

/** Chat send allowed in lounge or during break in active session. */
export function canSendRoomChat(
  sessionMode: SessionMode,
  phase: RoomPhase,
): boolean {
  return (
    sessionMode === 'lounge' ||
    (sessionMode === 'active' && (phase === 'break' || phase === 'long_break'))
  )
}

export function formatMessageTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function sortMessagesAsc(messages: RoomChatMessage[]): RoomChatMessage[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

export function dedupeMessagesById(
  messages: RoomChatMessage[],
): RoomChatMessage[] {
  const seen = new Set<string>()
  const out: RoomChatMessage[] = []
  for (const m of messages) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    out.push(m)
  }
  return out
}

export function appendMessageIfNew(
  prev: RoomChatMessage[],
  msg: RoomChatMessage,
): RoomChatMessage[] {
  if (prev.some((m) => m.id === msg.id)) return prev
  return [...prev, msg]
}

export function trimChatContent(raw: string): string {
  return raw.trim()
}

export function isValidChatContent(content: string): boolean {
  const trimmed = trimChatContent(content)
  return trimmed.length > 0 && trimmed.length <= 500
}
