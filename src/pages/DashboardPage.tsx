const Stat = ({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) => (
  <div className="rounded-2xl border border-border bg-surface-1 p-5">
    <p className="text-xs font-medium uppercase tracking-wide text-muted">
      {label}
    </p>
    <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
      {value}
    </p>
    <p className="mt-2 text-sm text-muted">{hint}</p>
  </div>
)

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-foreground">Painel</h1>
        <p className="mt-1 text-sm text-muted">
          Visão rápida de constância — dados reais virão do Supabase.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Hoje"
          value="0 h"
          hint="Horas estudadas (placeholder)"
        />
        <Stat label="Streak" value="0 dias" hint="Sequência de dias com foco" />
        <Stat
          label="Meta semanal"
          value="0 / 20 h"
          hint="Progresso da meta (placeholder)"
        />
      </div>
      <section className="mt-10 rounded-2xl border border-border bg-surface-1 p-6">
        <h2 className="text-sm font-medium text-foreground">Evolução semanal</h2>
        <p className="mt-2 text-sm text-muted">
          Gráfico de barras / linha será adicionado com dados agregados.
        </p>
        <div className="mt-6 flex h-32 items-end gap-2">
          {[35, 55, 40, 70, 25, 60, 45].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-accent/30"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
