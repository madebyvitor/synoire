import { motion } from 'motion/react'
import { Section } from '@/components/landing/primitives'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  scrollRevealItem,
  scrollRevealListInner,
  scrollRevealViewport,
} from '@/motion/scrollReveal'

const FEATURES = [
  'Salas silenciosas compartilhadas',
  'Sincronização Pomodoro',
  'Rastreamento de streaks',
  'Dashboard de metas',
  'Hubs comunitários',
  'Modos de música ambiente',
] as const

export function LandingFeaturesGrid() {
  const reduced = usePrefersReducedMotion()
  const item = scrollRevealItem(reduced)
  const list = scrollRevealListInner(reduced)

  return (
    <Section id="recursos" className="border-t border-border/50">
      <motion.ul
        variants={list}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
        className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
      >
        {FEATURES.map((label) => (
          <motion.li
            key={label}
            variants={item}
            className="rounded-2xl border border-border bg-surface px-5 py-6 text-sm font-medium text-primary transition hover:border-firefly/25 hover:shadow-[0_0_20px_-6px_rgba(163,163,79,0.1)]"
          >
            {label}
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  )
}
