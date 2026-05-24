type RoomPresenceBadgeProps = {
  presentCount: number
  prefersReducedMotion?: boolean
}

export function RoomPresenceBadge({
  presentCount,
  prefersReducedMotion = false,
}: RoomPresenceBadgeProps) {
  const displayCount = Math.max(1, presentCount || 1)

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-white/5 bg-black/20 px-3 py-1 backdrop-blur-md"
      aria-label={`${displayCount} pessoas focando`}
    >
      <div
        className={[
          'h-2 w-2 rounded-full bg-green-500',
          prefersReducedMotion ? '' : 'animate-pulse',
        ].join(' ')}
        aria-hidden
      />
      <span
        className="text-sm font-medium text-white/80 tabular-nums"
        aria-live="polite"
      >
        {displayCount} focando
      </span>
    </div>
  )
}
