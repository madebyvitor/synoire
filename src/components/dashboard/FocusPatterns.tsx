import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { GlowLockedOverlay } from '@/components/premium/GlowLockedOverlay'
import {
  aggregateByTimeBlock,
  generateMockSessions,
} from '@/lib/dashboard/focusPatterns'

export function FocusPatterns() {
  const stats = useMemo(() => {
    const sessions = generateMockSessions()
    return aggregateByTimeBlock(sessions)
  }, [])

  const { chartData, peakBlock, peakLabel, boostPercent } = stats

  return (
    <section className="rounded-2xl border border-white/5 bg-panel p-6">
      <h2 className="text-sm font-medium text-primary">Inteligência de Foco</h2>
      <GlowLockedOverlay className="mt-4">
        <p className="text-sm leading-relaxed text-secondary">
          Seu pico de produtividade é à{' '}
          <span className="font-semibold text-firefly">{peakLabel}</span>. Você rende{' '}
          {boostPercent}% mais neste período.
        </p>
        <div className="mt-6 h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A4AFBD', fontSize: 12 }}
              />
              <YAxis hide />
              <Bar dataKey="minutes" barSize={32} radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.block}
                    fill={entry.block === peakBlock ? '#a3a34f' : '#5a5a4a'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlowLockedOverlay>
    </section>
  )
}
