import { NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-accent-dim text-accent'
      : 'text-muted hover:bg-surface-2 hover:text-foreground',
  ].join(' ')

export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface-1 px-3 py-6">
        <div className="mb-8 px-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Synoire
          </p>
          <p className="mt-1 text-sm text-foreground">Modo foco</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/painel" className={navClass} end>
            Painel
          </NavLink>
          <NavLink to="/hubs" className={navClass}>
            Hubs
          </NavLink>
          <NavLink to="/salas/demo" className={navClass}>
            Sala de estudo
          </NavLink>
          <NavLink to="/perfil" className={navClass}>
            Perfil
          </NavLink>
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          <NavLink
            to="/entrar"
            className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
          >
            Sair (stub)
          </NavLink>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-surface-0 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
