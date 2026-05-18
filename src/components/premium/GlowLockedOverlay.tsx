import { LockIcon } from '@/components/premium/LockIcon'
import { useUserPlan } from '@/contexts/UserPlanContext'

type GlowLockedOverlayProps = {
  children: React.ReactNode
  className?: string
}

export function GlowLockedOverlay({ children, className = '' }: GlowLockedOverlayProps) {
  const { hasGlowAccess, openPaywall } = useUserPlan()

  if (hasGlowAccess) {
    return <>{children}</>
  }

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-night/20 backdrop-blur-[2px]">
        <button
          type="button"
          onClick={() => openPaywall()}
          className="pointer-events-auto flex items-center gap-2 rounded-xl border border-firefly/30 bg-panel/90 px-4 py-2.5 text-sm font-medium text-firefly shadow-[0_0_24px_-4px_rgba(163,163,79,0.25)] transition hover:border-firefly/50 hover:brightness-110"
        >
          <LockIcon className="h-4 w-4 text-firefly" />
          Desbloquear Inteligência Glow
        </button>
      </div>
    </div>
  )
}
