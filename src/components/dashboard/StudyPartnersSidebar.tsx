import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PartnerAvatar } from '@/components/dashboard/PartnerAvatar'
import { InvitePartnerModal } from '@/components/dashboard/InvitePartnerModal'
import { AppToast } from '@/components/ui/AppToast'
import { useAuth } from '@/contexts/AuthContext'
import { useRoomInvites } from '@/contexts/RoomInvitesContext'
import { useGlobalPresence } from '@/contexts/GlobalPresenceContext'
import { useStudyPartners } from '@/contexts/StudyPartnersContext'
import { canJoinRoom } from '@/lib/roomAccess'
import type { IncomingRoomInvite } from '@/lib/roomAccess'
import type { StudyPartnerView } from '@/lib/studyPartners'

export type StudyPartnersSidebarProps = {
  open: boolean
  onClose: () => void
  prefersReducedMotion?: boolean
}

function StreakBadge({ days }: { days: number }) {
  return (
    <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-secondary">
      🔥 {days} {days === 1 ? 'dia' : 'dias'}
    </span>
  )
}

function OnlinePartnerRow({
  partner,
  onJoinRoom,
  joiningRoomId,
}: {
  partner: StudyPartnerView
  onJoinRoom: (roomId: string, partnerName: string) => void
  joiningRoomId: string | null
}) {
  const roomLabel = partner.currentRoomLabel
  const canJoin = Boolean(partner.currentRoomId && roomLabel)
  const isJoining = joiningRoomId === partner.currentRoomId

  return (
    <li className="group relative rounded-xl border border-transparent px-2 py-2.5 transition hover:border-white/5 hover:bg-white/[0.03]">
      <div className="flex items-start gap-3">
        <PartnerAvatar partner={partner} presenceIndicator="focando" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-medium text-primary">
              {partner.displayName}
            </span>
            <StreakBadge days={partner.currentStreak} />
          </div>
          {roomLabel && (
            <p className="mt-1 text-xs leading-snug text-firefly">
              Na sala: {roomLabel}
            </p>
          )}
        </div>
      </div>
      {canJoin && (
        <button
          type="button"
          disabled={isJoining}
          onClick={() => onJoinRoom(partner.currentRoomId!, partner.displayName)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-firefly/30 bg-panel/95 px-2.5 py-1.5 text-[11px] font-medium text-firefly opacity-0 shadow-sm transition group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-firefly/50 disabled:opacity-60"
        >
          {isJoining ? 'Verificando…' : 'Entrar na Sala'}
        </button>
      )}
    </li>
  )
}

function IdleOnlinePartnerRow({ partner }: { partner: StudyPartnerView }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:border-white/5 hover:bg-white/[0.03]">
      <PartnerAvatar partner={partner} className="h-8 w-8" presenceIndicator="online" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">{partner.displayName}</p>
      </div>
      <StreakBadge days={partner.currentStreak} />
    </li>
  )
}

function OfflinePartnerRow({ partner }: { partner: StudyPartnerView }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2 opacity-80">
      <PartnerAvatar partner={partner} className="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-primary">{partner.displayName}</p>
      </div>
      <StreakBadge days={partner.currentStreak} />
    </li>
  )
}

function IncomingInviteRow({
  partner,
  onAccept,
  onDecline,
  disabled,
}: {
  partner: StudyPartnerView
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  disabled?: boolean
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/5 px-2 py-2.5">
      <PartnerAvatar partner={partner} className="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-primary">@{partner.username}</p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAccept(partner.partnershipId)}
          className="rounded-lg border border-firefly/30 bg-firefly/10 px-2 py-1 text-[11px] font-medium text-firefly hover:brightness-110 disabled:opacity-50"
        >
          Aceitar
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDecline(partner.partnershipId)}
          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-secondary hover:bg-elevated hover:text-primary disabled:opacity-50"
        >
          Recusar
        </button>
      </div>
    </li>
  )
}

function OutgoingInviteRow({ partner }: { partner: StudyPartnerView }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2 opacity-75">
      <PartnerAvatar partner={partner} className="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-primary">@{partner.username}</p>
        <p className="text-[11px] text-secondary">Aguardando resposta</p>
      </div>
    </li>
  )
}

function IncomingRoomInviteRow({
  invite,
  onAccept,
  onDecline,
  disabled,
}: {
  invite: IncomingRoomInvite
  onAccept: (invite: IncomingRoomInvite) => void
  onDecline: (invite: IncomingRoomInvite) => void
  disabled?: boolean
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/5 px-2 py-2.5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">{invite.roomName}</p>
        <p className="text-[11px] text-secondary">
          Convite de @{invite.inviterUsername}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAccept(invite)}
          className="rounded-lg border border-firefly/30 bg-firefly/10 px-2 py-1 text-[11px] font-medium text-firefly hover:brightness-110 disabled:opacity-50"
        >
          Entrar
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onDecline(invite)}
          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-secondary hover:bg-elevated hover:text-primary disabled:opacity-50"
        >
          Recusar
        </button>
      </div>
    </li>
  )
}

function Section({
  title,
  children,
  empty,
}: {
  title: string
  children: React.ReactNode
  empty?: string
}) {
  return (
    <section className="border-b border-white/5 px-4 py-4 last:border-b-0">
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-secondary">
        {title}
      </h3>
      {empty ? (
        <p className="text-xs text-secondary/80">{empty}</p>
      ) : (
        <ul className="space-y-1">{children}</ul>
      )}
    </section>
  )
}

export function StudyPartnersSidebar({
  open,
  onClose,
  prefersReducedMotion = false,
}: StudyPartnersSidebarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    focusingPartners,
    onlinePartners,
    offlinePartners,
    incomingInvites,
    outgoingInvites,
    isLoading,
    error,
    sendPartnerInvite,
    acceptInvite,
    declineInvite,
  } = useStudyPartners()
  const {
    incomingRoomInvites,
    acceptRoomInvite,
    declineRoomInvite,
  } = useRoomInvites()
  const { presenceSynced } = useGlobalPresence()

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [actingRoomInviteKey, setActingRoomInviteKey] = useState<string | null>(null)
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  })

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true })
  }, [])

  const handleJoinRoom = useCallback(
    async (roomId: string, partnerName: string) => {
      if (!user?.id) {
        showToast('Entre na sua conta para entrar na sala.')
        return
      }

      setJoiningRoomId(roomId)
      const result = await canJoinRoom(roomId, user.id)
      setJoiningRoomId(null)

      if (result.status === 'allowed') {
        onClose()
        navigate(`/salas/${roomId}`)
        return
      }

      if (result.status === 'denied_private') {
        showToast(`Esta sala é privada. Peça um convite a ${partnerName}.`)
        return
      }

      if (result.status === 'not_found') {
        showToast('Sala não encontrada ou indisponível.')
        return
      }

      showToast(result.message || 'Não foi possível entrar na sala.')
    },
    [navigate, onClose, showToast, user?.id],
  )

  const handleSendInvite = useCallback(
    async (username: string) => {
      setIsSendingInvite(true)
      try {
        const result = await sendPartnerInvite(username)
        if (!result.ok) {
          if (result.error === 'not_found') {
            return {
              ok: false as const,
              error: 'Estudante não encontrado. Verifique o nome de usuário.',
            }
          }
          if (result.error === 'already_exists') {
            return {
              ok: false as const,
              error: 'Já existe convite ou parceria com este usuário.',
            }
          }
          if (result.error === 'self_invite') {
            return { ok: false as const, error: 'Você não pode convidar a si mesmo.' }
          }
          return { ok: false as const, error: 'Nome de usuário inválido.' }
        }
        showToast('Convite enviado com sucesso!')
        return { ok: true as const }
      } finally {
        setIsSendingInvite(false)
      }
    },
    [sendPartnerInvite, showToast],
  )

  const handleAccept = useCallback(
    async (partnershipId: string) => {
      setActingId(partnershipId)
      await acceptInvite(partnershipId)
      setActingId(null)
    },
    [acceptInvite],
  )

  const handleDecline = useCallback(
    async (partnershipId: string) => {
      setActingId(partnershipId)
      await declineInvite(partnershipId)
      setActingId(null)
    },
    [declineInvite],
  )

  const roomInviteKey = useCallback(
    (invite: IncomingRoomInvite) => `${invite.roomId}:${invite.grantedAt}`,
    [],
  )

  const handleAcceptRoomInvite = useCallback(
    (invite: IncomingRoomInvite) => {
      acceptRoomInvite(invite)
      void handleJoinRoom(invite.roomId, invite.inviterUsername)
    },
    [acceptRoomInvite, handleJoinRoom],
  )

  const handleDeclineRoomInvite = useCallback(
    async (invite: IncomingRoomInvite) => {
      const key = roomInviteKey(invite)
      setActingRoomInviteKey(key)
      await declineRoomInvite(invite)
      setActingRoomInviteKey(null)
    },
    [declineRoomInvite, roomInviteKey],
  )

  const slide = prefersReducedMotion
    ? { initial: false, animate: { x: 0 }, exit: { x: 0 } }
    : {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
      }

  return (
    <>
      <AnimatePresence>
        {open && (
            <motion.aside
            role="dialog"
            aria-label="Parceiros de estudo"
            className="pointer-events-auto fixed bottom-0 right-0 top-0 z-40 flex w-[min(100%,22rem)] flex-col border-l border-white/5 bg-panel shadow-xl"
            {...slide}
            transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.42, 0, 0.58, 1] }}
          >
            {error && (
              <p className="border-b border-white/5 px-4 py-2 text-xs text-secondary" role="alert">
                {error}
              </p>
            )}
            <header className="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
              <h2 className="text-sm font-medium text-primary">Parceiros</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-xs text-secondary hover:bg-white/5 hover:text-primary"
                aria-label="Fechar painel de parceiros"
              >
                Fechar
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="px-4 py-6 text-xs text-secondary">Carregando parceiros…</p>
              ) : (
                <>
              {!presenceSynced && (
                <p className="border-b border-white/5 px-4 py-2 text-xs text-secondary">
                  Atualizando presença…
                </p>
              )}
              <Section
                title="Focando agora"
                empty={
                  focusingPartners.length === 0
                    ? 'Nenhum parceiro estudando no momento.'
                    : undefined
                }
              >
                {focusingPartners.map((p) => (
                  <OnlinePartnerRow
                    key={p.partnershipId}
                    partner={p}
                    onJoinRoom={(roomId, name) => void handleJoinRoom(roomId, name)}
                    joiningRoomId={joiningRoomId}
                  />
                ))}
              </Section>

              <Section
                title="Online"
                empty={
                  onlinePartners.length === 0
                    ? 'Nenhum parceiro online no momento.'
                    : undefined
                }
              >
                {onlinePartners.map((p) => (
                  <IdleOnlinePartnerRow key={p.partnershipId} partner={p} />
                ))}
              </Section>

              <Section
                title="Offline"
                empty={
                  offlinePartners.length === 0
                    ? 'Nenhum parceiro offline no momento.'
                    : undefined
                }
              >
                {offlinePartners.map((p) => (
                  <OfflinePartnerRow key={p.partnershipId} partner={p} />
                ))}
              </Section>

              {incomingRoomInvites.length > 0 && (
                <Section title="Convites para salas">
                  {incomingRoomInvites.map((invite) => (
                    <IncomingRoomInviteRow
                      key={roomInviteKey(invite)}
                      invite={invite}
                      onAccept={handleAcceptRoomInvite}
                      onDecline={handleDeclineRoomInvite}
                      disabled={actingRoomInviteKey === roomInviteKey(invite)}
                    />
                  ))}
                </Section>
              )}

              {(incomingInvites.length > 0 || outgoingInvites.length > 0) && (
                <Section title="Convites de parceria">
                  {incomingInvites.map((p) => (
                    <IncomingInviteRow
                      key={p.partnershipId}
                      partner={p}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      disabled={actingId === p.partnershipId}
                    />
                  ))}
                  {outgoingInvites.map((p) => (
                    <OutgoingInviteRow key={p.partnershipId} partner={p} />
                  ))}
                </Section>
              )}
                </>
              )}
            </div>

            <footer className="shrink-0 border-t border-white/5 p-4">
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="w-full rounded-xl border border-firefly/30 bg-firefly/10 py-2.5 text-sm font-medium text-firefly transition hover:border-firefly/50 hover:brightness-110"
              >
                + Convidar Parceiro
              </button>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>

      <InvitePartnerModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        prefersReducedMotion={prefersReducedMotion}
        isSubmitting={isSendingInvite}
        onSend={handleSendInvite}
      />

      <AppToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </>
  )
}
