import { Link } from 'react-router-dom'
import type { HubView } from '@/lib/hubs/types'

type FavoriteHubCardProps = {
  hub: HubView
}

export function FavoriteHubCard({ hub }: FavoriteHubCardProps) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface to-elevated shadow-[0_0_0_1px_rgba(0,0,0,0.12)] transition hover:border-firefly/25 hover:shadow-[0_0_20px_-4px_rgba(163,163,79,0.12)]">
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${hub.accentStripe}`}
        aria-hidden
      />
      <Link to={`/hubs/${hub.slug}`} className="relative block px-4 py-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug text-primary">
            {hub.iconEmoji && (
              <span className="mr-1" aria-hidden>
                {hub.iconEmoji}
              </span>
            )}
            {hub.name}
          </h3>
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide ${hub.accentBadge}`}
          >
            {hub.shortLabel}
          </span>
        </div>
      </Link>
    </article>
  )
}
