export function ProfilePage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">Perfil</h1>
      <p className="mt-2 text-sm text-muted">
        Nome público, concurso-alvo e preferências de foco — persistência no
        Supabase após auth.
      </p>
      <dl className="mt-8 space-y-4 rounded-2xl border border-border bg-surface-1 p-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Nome</dt>
          <dd className="text-foreground">—</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Hub principal</dt>
          <dd className="text-foreground">—</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">XP / nível</dt>
          <dd className="text-foreground">Em breve</dd>
        </div>
      </dl>
    </div>
  )
}
