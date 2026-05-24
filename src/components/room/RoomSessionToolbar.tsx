import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useState } from 'react'
import { RoomChatToggleButton } from '@/components/room/RoomChat'

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5" aria-hidden>
      <span
        className={[
          'absolute left-0 top-0 block h-0.5 w-5 rounded-full bg-primary transition-transform duration-200',
          open ? 'translate-y-1.5 rotate-45' : '',
        ].join(' ')}
      />
      <span
        className={[
          'absolute left-0 top-1.5 block h-0.5 w-5 rounded-full bg-primary transition-opacity duration-200',
          open ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      />
      <span
        className={[
          'absolute left-0 top-3 block h-0.5 w-5 rounded-full bg-primary transition-transform duration-200',
          open ? '-translate-y-1.5 -rotate-45' : '',
        ].join(' ')}
      />
    </span>
  )
}

const menuItemClass =
  'block w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-elevated'

type RoomSessionToolbarProps = {
  variant: 'active' | 'lounge'
  chromeClass: string
  isLeaving?: boolean
  onLeave?: () => void
  showInviteButton: boolean
  inviteLabel: string
  onInvite: () => void
  chatOpen: boolean
  unreadCount: number
  onToggleChat: () => void
  themeModalOpen?: boolean
  onOpenTheme?: () => void
}

export function RoomSessionToolbar({
  variant,
  chromeClass,
  isLeaving = false,
  onLeave,
  showInviteButton,
  inviteLabel,
  onInvite,
  chatOpen,
  unreadCount,
  onToggleChat,
  themeModalOpen = false,
  onOpenTheme,
}: RoomSessionToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuPanelId = useId()
  const hasUnread = unreadCount > 0 && !chatOpen
  const showTheme = variant === 'active' && onOpenTheme

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 770px)')
    const onWide = () => {
      if (mq.matches) setMenuOpen(false)
    }
    mq.addEventListener('change', onWide)
    return () => mq.removeEventListener('change', onWide)
  }, [menuOpen])

  const handleInvite = () => {
    closeMenu()
    onInvite()
  }

  const handleChat = () => {
    closeMenu()
    onToggleChat()
  }

  const handleTheme = () => {
    closeMenu()
    onOpenTheme?.()
  }

  const menuItems = (
    <>
      {showInviteButton && (
        <button
          type="button"
          onClick={handleInvite}
          className={`${menuItemClass} text-firefly`}
        >
          {inviteLabel}
        </button>
      )}
      <button
        type="button"
        onClick={handleChat}
        className={`${menuItemClass} ${
          hasUnread ? 'text-aqua' : 'text-secondary hover:text-primary'
        }`}
        aria-expanded={chatOpen}
      >
        <span className="flex items-center justify-between gap-2">
          Chat
          {hasUnread && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-aqua px-1.5 text-[10px] font-medium text-night tabular-nums">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
      </button>
      {showTheme && (
        <button
          type="button"
          onClick={handleTheme}
          className={`${menuItemClass} text-secondary hover:text-primary`}
          aria-expanded={themeModalOpen}
        >
          Ambiente
        </button>
      )}
    </>
  )

  const desktopActions = (
    <div className="pointer-events-auto hidden min-[770px]:flex items-center gap-2">
      {showInviteButton && (
        <button
          type="button"
          onClick={onInvite}
          className="rounded-lg px-3 py-2 text-sm text-firefly hover:bg-elevated"
        >
          {inviteLabel}
        </button>
      )}
      <RoomChatToggleButton
        open={chatOpen}
        unreadCount={unreadCount}
        onClick={onToggleChat}
      />
      {showTheme && (
        <button
          type="button"
          onClick={onOpenTheme}
          className="rounded-lg px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary"
          aria-expanded={themeModalOpen}
        >
          Ambiente
        </button>
      )}
    </div>
  )

  const mobileMenu = (
    <div className="pointer-events-auto min-[770px]:hidden">
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-night/40 text-primary backdrop-blur-sm transition hover:border-firefly/40 hover:bg-elevated/80"
        aria-expanded={menuOpen}
        aria-controls={menuPanelId}
        aria-label={menuOpen ? 'Fechar menu da sala' : 'Abrir menu da sala'}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <HamburgerIcon open={menuOpen} />
        {hasUnread && !menuOpen && (
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-aqua"
            aria-hidden
          />
        )}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-30 bg-night/50 backdrop-blur-[1px]"
              aria-label="Fechar menu"
              onClick={closeMenu}
            />
            <motion.div
              id={menuPanelId}
              role="menu"
              aria-label="Ações da sala"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.42, 0, 0.58, 1] }}
              className="absolute right-0 top-full z-40 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-border/80 bg-surface/95 py-1 shadow-xl backdrop-blur-md"
            >
              <div className="flex flex-col gap-0.5 px-1 py-1">{menuItems}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )

  if (variant === 'lounge') {
    return (
      <motion.div
        role="toolbar"
        aria-label="Ações da sala"
        className={`pointer-events-none fixed right-0 top-0 z-20 p-4 sm:p-6 ${chromeClass}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="pointer-events-auto relative flex justify-end">
          {desktopActions}
          {mobileMenu}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      role="toolbar"
      aria-label="Ações da sala"
      className={`pointer-events-none fixed left-0 right-0 top-0 z-20 flex items-start justify-between gap-3 p-4 transition-opacity duration-500 sm:p-6 ${chromeClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button
        type="button"
        disabled={isLeaving}
        onClick={onLeave}
        className="pointer-events-auto rounded-lg px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary disabled:opacity-50"
      >
        {isLeaving ? 'Salvando…' : 'Sair'}
      </button>
      <div className="pointer-events-auto relative flex items-center">
        {desktopActions}
        {mobileMenu}
      </div>
    </motion.div>
  )
}
