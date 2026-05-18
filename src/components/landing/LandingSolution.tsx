import { motion } from 'motion/react'
import { Eyebrow, Section } from '@/components/landing/primitives'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  scrollRevealContainer,
  scrollRevealItem,
  scrollRevealListInner,
  scrollRevealViewport,
} from '@/motion/scrollReveal'

const FEATURES = [
  {
    title: 'Salas de foco',
    description:
      'Entre em ambientes de estudo ao vivo com presença em tempo real.',
  },
  {
    title: 'Timer sincronizado',
    description: 'Todos seguem o mesmo ritmo Pomodoro.',
  },
  {
    title: 'Caminhos de progresso',
    description: 'Construa streaks, marcos e evolução visível.',
  },
] as const

export function LandingSolution() {
  const reduced = usePrefersReducedMotion()
  const c = scrollRevealContainer(reduced)
  const item = scrollRevealItem(reduced)
  const list = scrollRevealListInner(reduced)

  return (
    <Section id="diferencial" className="border-t border-border/50">
      <motion.div
        variants={c}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
      >
        <motion.div variants={item} className="max-w-2xl">
          <Eyebrow>O diferencial Synoire</Eyebrow>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Presença coletiva.
            <br />
            Foco silencioso.
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-secondary">
            O Synoire cria espaços compartilhados onde estudantes reais estudam
            juntos em silêncio.
          </p>
          <p className="mt-4 text-pretty text-secondary">
            Sem ruído.
            <br />
            Sem distração.
            <br />
            Apenas presença visível e disciplina sincronizada.
          </p>
        </motion.div>

        <motion.ul
          variants={list}
          className="mt-16 grid gap-5 md:grid-cols-3 md:gap-6"
        >
          {FEATURES.map((f) => (
            <motion.li
              key={f.title}
              variants={item}
              className="rounded-2xl border border-border bg-gradient-to-br from-surface to-elevated p-6 transition hover:border-firefly/25 hover:shadow-[0_0_24px_-4px_rgba(163,163,79,0.12)]"
            >
              <h3 className="text-base font-semibold text-primary">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                {f.description}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </Section>
  )
}
