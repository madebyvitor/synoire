import { motion } from 'motion/react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const SUBTLE_SPOTS = [
  { left: '14%', top: '20%', delay: 0, size: 2, duration: 5.2 },
  { left: '72%', top: '16%', delay: 1.4, size: 3, duration: 4.8 },
  { left: '48%', top: '38%', delay: 0.7, size: 2, duration: 5.6 },
  { left: '86%', top: '52%', delay: 2.2, size: 2, duration: 4.4 },
  { left: '24%', top: '58%', delay: 1.1, size: 3, duration: 5 },
  { left: '58%', top: '72%', delay: 0.3, size: 2, duration: 4.6 },
  { left: '8%', top: '78%', delay: 1.8, size: 2, duration: 5.4 },
  { left: '38%', top: '12%', delay: 2.6, size: 3, duration: 4.2 },
]

const MARKETING_SPOTS = [
  { left: '12%', top: '18%', delay: 0, size: 4, duration: 4.2 },
  { left: '78%', top: '22%', delay: 1.2, size: 3, duration: 5.1 },
  { left: '45%', top: '12%', delay: 0.6, size: 5, duration: 3.8 },
  { left: '88%', top: '38%', delay: 2.1, size: 3, duration: 4.6 },
  { left: '22%', top: '42%', delay: 1.8, size: 4, duration: 5.4 },
  { left: '62%', top: '32%', delay: 0.3, size: 3, duration: 4 },
  { left: '8%', top: '58%', delay: 2.4, size: 5, duration: 3.6 },
  { left: '52%', top: '48%', delay: 1.1, size: 4, duration: 4.8 },
  { left: '35%', top: '28%', delay: 1.5, size: 3, duration: 5.2 },
  { left: '92%', top: '62%', delay: 0.9, size: 4, duration: 4.4 },
  { left: '18%', top: '72%', delay: 0.4, size: 3, duration: 5.6 },
  { left: '70%', top: '68%', delay: 1.7, size: 5, duration: 4.1 },
]

const INTENSITY = {
  subtle: {
    glowPrimary: 'rgba(163,163,79,0.05)',
    glowSecondary: 'rgba(163,163,79,0.03)',
    glowBottom: 'rgba(26,26,18,0.12)',
    particleShadow: '0 0 6px rgba(163,163,79,0.25)',
    particleOpacity: [0.08, 0.2, 0.08] as const,
    spots: SUBTLE_SPOTS,
  },
  marketing: {
    glowPrimary: 'rgba(163,163,79,0.09)',
    glowSecondary: 'rgba(107,143,122,0.06)',
    glowBottom: 'rgba(26,26,18,0.35)',
    particleShadow: '0 0 10px rgba(163,163,79,0.45)',
    particleOpacity: [0.2, 1, 0.2] as const,
    spots: MARKETING_SPOTS,
  },
} as const

export type AppAtmosphereIntensity = keyof typeof INTENSITY

type AppAtmosphereProps = {
  className?: string
  intensity?: AppAtmosphereIntensity
}

export function AppAtmosphere({
  className = '',
  intensity = 'subtle',
}: AppAtmosphereProps) {
  const reduced = usePrefersReducedMotion()
  const cfg = INTENSITY[intensity]

  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <motion.div
        className="absolute -left-1/4 top-0 h-[60%] w-[75%]"
        style={{
          background: `radial-gradient(ellipse at center, ${cfg.glowPrimary} 0%, transparent 72%)`,
        }}
        animate={
          reduced
            ? undefined
            : {
                opacity: intensity === 'subtle' ? [0.7, 1, 0.7] : [0.55, 0.95, 0.55],
                scale: intensity === 'subtle' ? 1 : [1, 1.08, 1],
                x: intensity === 'subtle' ? 0 : [0, 24, 0],
                y: intensity === 'subtle' ? 0 : [0, 12, 0],
              }
        }
        transition={{
          duration: intensity === 'subtle' ? 18 : 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -right-1/4 top-1/4 h-[55%] w-[65%]"
        style={{
          background: `radial-gradient(ellipse at center, ${cfg.glowSecondary} 0%, transparent 70%)`,
        }}
        animate={
          reduced
            ? undefined
            : {
                opacity: intensity === 'subtle' ? [0.6, 0.9, 0.6] : [0.4, 0.75, 0.4],
                scale: intensity === 'subtle' ? 1 : [1, 1.06, 1],
                x: intensity === 'subtle' ? 0 : [0, -18, 0],
              }
        }
        transition={{
          duration: intensity === 'subtle' ? 20 : 16,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 h-[50%] w-full -translate-x-1/2"
        style={{
          background: `radial-gradient(ellipse at bottom, ${cfg.glowBottom} 0%, transparent 68%)`,
        }}
        animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {cfg.spots.map((spot, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-firefly"
          style={{
            left: spot.left,
            top: spot.top,
            width: spot.size,
            height: spot.size,
            boxShadow: cfg.particleShadow,
          }}
          animate={
            reduced
              ? { opacity: 0.12 }
              : {
                  opacity: [...cfg.particleOpacity],
                  scale: intensity === 'subtle' ? [0.9, 1.1, 0.9] : [0.75, 1.35, 0.75],
                  y: intensity === 'subtle' ? [0, -6, 0] : [0, -14 - (i % 3) * 4, 0],
                  x: intensity === 'subtle' ? 0 : [0, i % 2 === 0 ? 6 : -6, 0],
                }
          }
          transition={{
            duration: spot.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: spot.delay,
          }}
        />
      ))}
    </motion.div>
  )
}
