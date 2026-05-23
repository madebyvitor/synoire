import { useEffect, useRef } from 'react'
import type { RoomChatMessage } from '@/lib/roomChat'
import { RoomChatMessageLine } from './RoomChatMessageLine'

type RoomChatMessageListProps = {
  messages: RoomChatMessage[]
  loading?: boolean
  currentUserId: string
}

const SCROLL_THRESHOLD_PX = 48

export function RoomChatMessageList({
  messages,
  loading = false,
  currentUserId,
}: RoomChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)

  const checkAtBottom = () => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD_PX
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      atBottomRef.current = checkAtBottom()
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!atBottomRef.current) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, messages[messages.length - 1]?.id])

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Mensagens da sala"
    >
      {loading && messages.length === 0 && (
        <p className="text-sm text-secondary/70">Carregando conversa…</p>
      )}
      {!loading && messages.length === 0 && (
        <p className="text-sm text-secondary/70">
          Ainda em silêncio. Sussurre algo na pausa.
        </p>
      )}
      <ul className="space-y-4">
        {messages.map((msg) => (
          <li key={msg.id}>
            <RoomChatMessageLine
              message={msg}
              isOwn={msg.user_id === currentUserId}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
