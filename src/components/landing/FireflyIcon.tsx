type FireflyIconProps = {
  className?: string
}

export function FireflyIcon({ className = 'h-2 w-2' }: FireflyIconProps) {
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      aria-hidden
    >
      <span className="absolute inset-0 rounded-full bg-firefly/40 blur-[3px]" />
      <span className="relative block h-full w-full rounded-full bg-firefly shadow-[0_0_8px_rgba(163,163,79,0.7)]" />
    </span>
  )
}
