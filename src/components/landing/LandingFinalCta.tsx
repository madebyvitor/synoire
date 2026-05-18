import { motion } from 'motion/react'
import { LandingButton, Section } from '@/components/landing/primitives'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  scrollRevealContainer,
  scrollRevealItem,
  scrollRevealViewport,
} from '@/motion/scrollReveal'

export function LandingFinalCta() {
  const reduced = usePrefersReducedMotion()
  const c = scrollRevealContainer(reduced)
  const item = scrollRevealItem(reduced)

  return (
    <Section id="comecar" className="relative overflow-hidden border-t border-border/50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,163,79,0.09)_0%,transparent_55%)]"
        aria-hidden
      />

      <motion.div
        variants={c}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
        className="relative text-center"
      >
        <motion.h2
          variants={item}
          className="text-balance text-3xl font-bold tracking-tight text-primary md:text-4xl"
        >
          Sua próxima sessão começa aqui.
        </motion.h2>
        <motion.p
          variants={item}
          className="mx-auto mt-8 max-w-md text-pretty text-lg text-secondary"
        >
          Pare de depender de motivação.
          <br />
          Comece a construir ritmo.
        </motion.p>
        <motion.div
          variants={item}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          <LandingButton to="/entrar">Criar conta</LandingButton>
          <LandingButton to="/entrar" variant="ghost">
            Entrar
          </LandingButton>
        </motion.div>
      </motion.div>
    </Section>
  )
}
