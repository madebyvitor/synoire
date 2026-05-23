import { motion } from 'motion/react'
import { FocusCoreVisual } from '@/components/landing/FocusCoreVisual'
import { NightAtmosphere } from '@/components/landing/NightAtmosphere'
import { Eyebrow, LandingButton } from '@/components/landing/primitives'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  pageFloatItem,
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

export function LandingHero() {
  const reduced = usePrefersReducedMotion()
  const c = pageStaggerContainer(reduced)
  const item = pageStaggerItem(reduced)
  const floatItem = pageFloatItem(reduced)

  return (
    <section className="relative min-h-dvh overflow-hidden pt-40 pb-20 md:pt-44 md:pb-28 lg:pt-48">
      <NightAtmosphere />

      <motion.div
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center"
        variants={c}
        initial={reduced ? false : 'hidden'}
        animate="visible"
      >
        <motion.div variants={item}>
          <Eyebrow variant="pill">Plataforma social de estudos · Beta</Eyebrow>
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-8 font-serif text-balance text-4xl font-semibold tracking-tight text-primary md:text-5xl lg:text-[3.25rem] lg:leading-[1.12]"
        >
          Estude junto.
          <br />
          Construa constância.
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-secondary"
        >
          Entre em salas silenciosas de foco, sincronize seu ritmo de estudo e
          transforme presença coletiva em disciplina duradoura.
        </motion.p>

        <motion.div variants={item} className="mt-12">
          <motion.div
            animate={
              reduced
                ? undefined
                : {
                    boxShadow: [
                      '0 0 0 0 rgba(163,163,79,0)',
                      '0 0 28px 2px rgba(163,163,79,0.35)',
                      '0 0 0 0 rgba(163,163,79,0)',
                    ],
                  }
            }
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="inline-block rounded-xl"
          >
            <LandingButton to="/entrar" className="px-8 py-3.5 text-base">
              Criar conta
            </LandingButton>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={floatItem}
        initial={reduced ? false : 'hidden'}
        animate="visible"
        transition={reduced ? undefined : { delay: 0.55 }}
        className="relative z-10 mx-auto mt-16 w-full max-w-5xl px-6 md:mt-20 lg:max-w-6xl"
      >
        <FocusCoreVisual />
      </motion.div>
    </section>
  )
}
