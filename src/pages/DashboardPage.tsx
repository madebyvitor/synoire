import { motion, type Variants } from 'motion/react'
import { EvolutionTrails } from '@/components/dashboard/EvolutionTrails'
import { FocusPatterns } from '@/components/dashboard/FocusPatterns'
import { GlowLockedOverlay } from '@/components/premium/GlowLockedOverlay'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  pageStaggerContainer,
  pageStaggerItem,
  pageStaggerListInner,
} from '@/motion/pageStagger'

function StatCard({
  label,
  value,
  hint,
  variants,
}: {
  label: string
  value: string
  hint: string
  variants: Variants
}) {
  return (
    <motion.div variants={variants} className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-primary">
        {value}
      </p>
      <p className="mt-2 text-sm text-secondary">{hint}</p>
    </motion.div>
  )
}

const HEATMAP_WEEKS = 4
const HEATMAP_DAYS = 7

export function DashboardPage() {
  const reduced = usePrefersReducedMotion()
  const c = pageStaggerContainer(reduced)
  const item = pageStaggerItem(reduced)
  const listInner = pageStaggerListInner(reduced)

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      variants={c}
      initial={reduced ? false : 'hidden'}
      animate="visible"
    >
      <motion.header variants={item} className="mb-10">
        <h1 className="text-2xl font-semibold text-primary">Painel</h1>
        <p className="mt-1 text-sm text-secondary">
          Visão rápida de constância — dados reais virão do Supabase.
        </p>
      </motion.header>
      <motion.div
        variants={listInner}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          variants={item}
          label="Hoje"
          value="0 h"
          hint="Horas estudadas (placeholder)"
        />
        <StatCard
          variants={item}
          label="Streak"
          value="0 dias"
          hint="Sequência de dias com foco"
        />
        <StatCard
          variants={item}
          label="Meta semanal"
          value="0 / 20 h"
          hint="Progresso da meta (placeholder)"
        />
      </motion.div>
      <motion.section
        variants={item}
        className="mt-10 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-medium text-primary">Evolução semanal</h2>
        <p className="mt-2 text-sm text-secondary">
          Gráfico de barras / linha será adicionado com dados agregados.
        </p>
        <motion.div className="mt-6 flex h-32 items-end gap-2">
          {[35, 55, 40, 70, 25, 60, 45].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-firefly/30"
              style={{ height: `${h}%` }}
            />
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        variants={item}
        className="mt-6 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-medium text-primary">Previsão de Streak</h2>
        <p className="mt-2 text-sm text-secondary">
          Projeção com base no seu ritmo recente (placeholder).
        </p>
        <GlowLockedOverlay className="mt-6">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tabular-nums text-firefly">
                +4 dias
              </span>
              <span className="text-xs text-secondary">confiança 78%</span>
            </div>
            <div className="flex h-24 items-end gap-1">
              {[20, 35, 28, 50, 42, 65, 58, 72, 68, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-aqua/25"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-secondary">
              Mantendo o ritmo atual, você pode chegar a 12 dias de streak em duas semanas.
            </p>
          </div>
        </GlowLockedOverlay>
      </motion.section>

      <motion.section
        variants={item}
        className="mt-6 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-medium text-primary">Heatmap de constância</h2>
        <p className="mt-2 text-sm text-secondary">
          Intensidade de foco por dia nas últimas semanas (placeholder).
        </p>
        <GlowLockedOverlay className="mt-6">
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${HEATMAP_DAYS}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: HEATMAP_WEEKS * HEATMAP_DAYS }, (_, i) => {
              const intensity = (i * 17) % 5
              return (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor:
                      intensity === 0
                        ? 'rgb(42 51 64 / 0.5)'
                        : `rgb(216 255 94 / ${0.12 + intensity * 0.18})`,
                  }}
                />
              )
            })}
          </div>
        </GlowLockedOverlay>
      </motion.section>

      <motion.section variants={item} className="mt-6">
        <FocusPatterns />
      </motion.section>

      <motion.section variants={item} className="mt-6">
        <EvolutionTrails />
      </motion.section>
    </motion.div>
  )
}
