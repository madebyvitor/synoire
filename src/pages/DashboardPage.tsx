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

const WEEKLY_BARS = [35, 55, 40, 70, 25, 60, 45] as const
const HIGHLIGHT_BAR_INDEX = 3

function MetricColumn({
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
    <motion.div variants={variants} className="px-6 py-2 first:pl-0 last:pr-0">
      <p className="text-xs font-medium uppercase tracking-widest text-firefly">{label}</p>
      <p className="mt-3 text-4xl font-semibold tabular-nums text-primary">{value}</p>
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
        <h1 className="text-2xl font-semibold text-primary">
          <span className="text-firefly">|</span> Painel
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Visão rápida de constância — dados reais virão do Supabase.
        </p>
      </motion.header>

      <motion.div
        variants={listInner}
        className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <MetricColumn
          variants={item}
          label="Hoje"
          value="0h"
          hint="Horas estudadas nos últimos ciclos"
        />
        <MetricColumn
          variants={item}
          label="Streak"
          value="0 dias"
          hint="Sua sequência atual de consistência"
        />
        <MetricColumn
          variants={item}
          label="Meta semanal"
          value="0 / 20 h"
          hint="Progresso em relação ao seu objetivo"
        />
      </motion.div>

      <motion.section variants={item} className="mt-12">
        <motion.div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-primary">Evolução semanal</h2>
            <span className="rounded-full border border-firefly/40 bg-firefly/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-firefly">
              Live
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-elevated/80 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            <span className="text-firefly" aria-hidden>
              ↑
            </span>
            +12.4% crescimento
          </div>
        </motion.div>
        <div className="mt-8 flex h-36 items-end gap-2 sm:gap-3">
          {WEEKLY_BARS.map((h, i) => {
            const isHighlight = i === HIGHLIGHT_BAR_INDEX
            return (
              <motion.div key={i} className="relative flex h-full flex-1 flex-col justify-end" variants={item}>
                <div className="absolute inset-0 rounded-t-sm bg-chart-track" aria-hidden />
                <div
                  className={[
                    'relative w-full rounded-t-sm',
                    isHighlight ? 'bg-chart-highlight' : 'bg-chart-fill',
                  ].join(' ')}
                  style={{ height: `${h}%` }}
                >
                  {isHighlight && (
                    <span
                      className="absolute inset-x-0 top-0 h-px bg-white/80 shadow-[0_0_8px_rgba(245,245,240,0.6)]"
                      aria-hidden
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      <motion.section
        variants={item}
        className="mt-10 rounded-2xl border border-border bg-surface p-6"
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
            <motion.div className="flex h-24 items-end gap-1">
              {[20, 35, 28, 50, 42, 65, 58, 72, 68, 80].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t bg-aqua/25"
                  style={{ height: `${h}%` }}
                />
              ))}
            </motion.div>
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
                        ? 'rgb(26 26 18 / 0.5)'
                        : `rgb(163 163 79 / ${0.12 + intensity * 0.18})`,
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
