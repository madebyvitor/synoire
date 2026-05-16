import { useEffect, useId, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-firefly-dim text-firefly'
      : 'text-secondary hover:bg-elevated hover:text-primary',
  ].join(' ')

const NAV_LINKS: readonly { to: string; label: string; end?: boolean }[] = [
  { to: '/painel', label: 'Painel', end: true },
  { to: '/hubs', label: 'Hubs' },
  { to: '/salas/demo', label: 'Sala de estudo' },
  { to: '/perfil', label: 'Perfil' },
]

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

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const menuPanelId = useId()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

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
    const mq = window.matchMedia('(max-width: 769px)')
    if (!mq.matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 770px)')
    const onWide = () => {
      if (mq.matches) setMenuOpen(false)
    }
    mq.addEventListener('change', onWide)
    return () => mq.removeEventListener('change', onWide)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col min-[770px]:flex-row">
      {/* Barra + menu sanduíche: 320px–769px */}
      <header className="sticky top-0 z-50 flex min-[770px]:hidden items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-primary transition hover:border-firefly/40 hover:bg-surface"
          aria-expanded={menuOpen}
          aria-controls={menuPanelId}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <HamburgerIcon open={menuOpen} />
        </button>
        <NavLink
          to="/"
          className="min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-firefly/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/logoSynoire.svg"
            alt="Synoire"
            className="ml-auto block h-auto max-h-10 w-auto max-w-[10rem] object-contain object-right"
          />
        </NavLink>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 min-[770px]:hidden bg-night/75 backdrop-blur-[2px]"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id={menuPanelId}
            role="navigation"
            aria-label="Navegação principal"
            className="fixed left-0 right-0 top-16 z-50 max-h-[min(calc(100dvh-4rem),32rem)] min-[770px]:hidden overflow-y-auto border-b border-border bg-surface px-3 py-4 shadow-xl"
          >
            <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-secondary">
              Modo foco
            </p>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={navClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-border pt-4">
              <NavLink
                to="/entrar"
                className="block rounded-lg px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary"
                onClick={() => setMenuOpen(false)}
              >
                Sair (stub)
              </NavLink>
            </div>
          </div>
        </>
      )}

      <aside className="hidden min-[770px]:flex w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-6">
        <div className="mb-8 px-2">
          <NavLink
            to="/"
            className="block w-full max-w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-firefly/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <img
              src="/logoSynoire.svg"
              alt="Synoire"
              className="block h-auto w-full max-h-28 object-contain object-left sm:max-h-32"
            />
          </NavLink>
          <p className="mt-1 text-sm text-primary">Modo foco</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          <NavLink
            to="/entrar"
            className="block rounded-lg px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary"
          >
            Sair (stub)
          </NavLink>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-night p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
