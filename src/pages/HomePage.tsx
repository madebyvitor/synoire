import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Synoire
        </p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Estudo coletivo sem ruído de rede social.
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
          Salas em tempo real, hubs por concurso e um painel claro de constância
          — feito para quem alterna picos de produtividade com semanas paradas.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/painel"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-surface-0 transition hover:brightness-110"
          >
            Entrar no painel
          </Link>
          <Link
            to="/entrar"
            className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:bg-surface-1"
          >
            Criar conta (em breve)
          </Link>
        </div>
        <p className="mt-12 text-sm text-muted">
          MVP: autenticação Supabase, hubs, salas com pomodoro sincronizado,
          metas e streaks.
        </p>
      </motion.div>
    </div>
  )
}
