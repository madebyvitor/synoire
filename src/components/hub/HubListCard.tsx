import { Link } from 'react-router-dom'
import { LockIcon } from '@/components/premium/LockIcon'
import type { HubSummary } from '@/data/sampleHubs'

type HubListCardProps = {
  hub: HubSummary
  isJoined: boolean
  onJoin: () => void
  onLeave: () => void
}

export function HubListCard({ hub, isJoined, onJoin, onLeave }: HubListCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-surface to-elevated shadow-[0_0_0_1px_rgba(0,0,0,0.15)] transition hover:shadow-[0_0_24px_-4px_rgba(163,163,79,0.12)] ${
        hub.isPrivate
          ? 'border-firefly/20 hover:border-firefly/30'
          : 'border-border hover:border-firefly/25'
      }`}
    >
      {hub.isPrivate && (
        <LockIcon
          className="absolute top-4 right-4 z-10 h-3.5 w-3.5 text-firefly/70"
          aria-hidden
        />
      )}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${hub.accentStripe}`}
        aria-hidden
      />
      <Link
        to={`/hubs/${hub.slug}`}
        className="relative block px-5 py-5 pl-6"
      >
        <div className="flex items-start justify-between gap-3 pr-6">
          <h2 className="text-base font-semibold leading-snug text-primary">
            {hub.iconEmoji && (
              <span className="mr-1.5" aria-hidden>
                {hub.iconEmoji}
              </span>
            )}
            {hub.name}
          </h2>
          <span
            className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tracking-wide ${hub.accentBadge}`}
          >
            {hub.shortLabel}
          </span>
        </div>
        <p className="mt-2.5 text-sm text-secondary">Salas · Metas</p>
        <div className="mt-6 flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-firefly shadow-[0_0_8px_rgba(163,163,79,0.65)]"
            aria-hidden
          />
          <span className="text-[0.65rem] font-medium uppercase tracking-widest text-primary">
            Ativo
          </span>
        </div>
      </Link>
      <div className="border-t border-white/5 px-5 py-3">
        {isJoined ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onLeave()
            }}
            className="w-full rounded-lg border border-firefly/25 bg-firefly/10 px-3 py-2 text-xs font-medium text-firefly transition hover:border-firefly/40 hover:bg-firefly/15"
          >
            <span className="group-hover:hidden">Membro ✓</span>
            <span className="hidden group-hover:inline">Sair</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onJoin()
            }}
            className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-secondary transition hover:border-white/20 hover:text-primary"
          >
            Entrar no Hub
          </button>
        )}
      </div>
    </article>
  )
}
