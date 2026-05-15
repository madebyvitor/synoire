import { Link } from 'react-router-dom'
import { SAMPLE_HUBS } from '@/data/sampleHubs'

export function HubsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Hubs por concurso</h1>
        <p className="mt-1 text-sm text-muted">
          Cada hub agrupa salas e metas alinhadas ao edital — lista estática por
          enquanto.
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SAMPLE_HUBS.map((hub) => (
          <li key={hub.slug}>
            <Link
              to={`/hubs/${hub.slug}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface-1 px-5 py-4 transition hover:border-accent/40 hover:bg-surface-2"
            >
              <span className="font-medium text-foreground">{hub.name}</span>
              <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-medium text-muted">
                {hub.shortLabel}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
