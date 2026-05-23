import { PartnerAvatar } from '@/components/dashboard/PartnerAvatar'
import { formatMessageTime, type RoomChatMessage } from '@/lib/roomChat'

type RoomChatMessageLineProps = {
  message: RoomChatMessage
  isOwn?: boolean
}

export function RoomChatMessageLine({
  message,
  isOwn = false,
}: RoomChatMessageLineProps) {
  const time = formatMessageTime(message.created_at)
  const username = message.author.username
  const avatarUrl = message.author.avatar_url?.trim() || null

  return (
    <article className="flex gap-3" aria-label={`Mensagem de ${username}`}>
      <PartnerAvatar
        partner={{ displayName: username, avatarUrl }}
        className="h-10 w-10 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-tight ${
            isOwn ? 'text-firefly' : 'text-primary'
          }`}
        >
          {username}
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary">
          {message.content}
        </p>
        <div className="mt-1 flex justify-end">
          <time
            dateTime={message.created_at}
            className="text-[0.65rem] tabular-nums text-secondary/60"
          >
            {time}
          </time>
        </div>
      </div>
    </article>
  )
}
