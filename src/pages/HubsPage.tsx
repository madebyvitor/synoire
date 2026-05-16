import { Link } from 'react-router-dom'
import { SAMPLE_HUBS } from '@/data/sampleHubs'

export function HubsPage() {
  const count = SAMPLE_HUBS.length

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            Hubs por concurso
          </h1>
          <span className="inline-flex items-center rounded-md border border-aqua/35 bg-[#13243a] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
            Beta
          </span>
          <p className="text-sm text-secondary">{count} hubs disponíveis</p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary">
          Cada hub agrupa salas e metas alinhadas ao edital — lista estática por
          enquanto.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_HUBS.map((hub) => (
          <li key={hub.slug}>
            <Link
              to={`/hubs/${hub.slug}`}
              className="group relative block overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-elevated shadow-[0_0_0_1px_rgba(0,0,0,0.15)] transition hover:border-firefly/25 hover:shadow-[0_0_24px_-4px_rgba(216,255,94,0.12)]"
            >
              <div
                className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${hub.accentStripe}`}
                aria-hidden
              />
              <div className="relative px-5 py-5 pl-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold leading-snug text-primary">
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
                    className="h-2 w-2 shrink-0 rounded-full bg-firefly shadow-[0_0_8px_rgba(216,255,94,0.65)]"
                    aria-hidden
                  />
                  <span className="text-[0.65rem] font-medium uppercase tracking-widest text-primary">
                    Ativo
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
