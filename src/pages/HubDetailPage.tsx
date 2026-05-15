import { Link, useParams } from 'react-router-dom'
import { SAMPLE_HUBS } from '@/data/sampleHubs'

export function HubDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const hub = SAMPLE_HUBS.find((h) => h.slug === slug)

  if (!hub) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted">Hub não encontrado.</p>
        <Link to="/hubs" className="mt-4 inline-block text-sm text-accent">
          Voltar aos hubs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/hubs"
        className="text-sm text-muted hover:text-foreground"
      >
        ← Hubs
      </Link>
      <header className="mt-6">
        <h1 className="text-2xl font-semibold text-foreground">{hub.name}</h1>
        <p className="mt-2 text-sm text-muted">
          Salas ativas e metas do hub aparecerão aqui. Realtime para presença
          será plugado no Supabase.
        </p>
      </header>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-1/50 p-8 text-center text-sm text-muted">
        Lista de salas (placeholder)
      </div>
    </div>
  )
}
