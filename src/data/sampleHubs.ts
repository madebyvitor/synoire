import { readPrivateHubs } from '@/lib/privateHubs/storage'

export type HubSummary = {
  slug: string
  name: string
  shortLabel: string
  /** Barra vertical à esquerda do card */
  accentStripe: string
  /** Badge do acrônimo (cor alinhada à barra) */
  accentBadge: string
  isPrivate?: boolean
  iconEmoji?: string
}

export function getHubBySlug(slug: string | undefined): HubSummary | undefined {
  if (!slug) return undefined
  return SAMPLE_HUBS.find((h) => h.slug === slug) ?? readPrivateHubs().find((h) => h.slug === slug)
}

/** Hubs exemplo — futuramente virão do Supabase */
export const SAMPLE_HUBS: HubSummary[] = [
  {
    slug: 'pf',
    name: 'Polícia Federal',
    shortLabel: 'PF',
    accentStripe: 'bg-firefly shadow-[0_0_16px_rgba(163,163,79,0.3)]',
    accentBadge: 'border-firefly/40 bg-firefly/10 text-firefly',
  },
  {
    slug: 'bb',
    name: 'Banco do Brasil',
    shortLabel: 'BB',
    accentStripe: 'bg-aqua shadow-[0_0_16px_rgba(103,199,255,0.28)]',
    accentBadge: 'border-aqua/45 bg-aqua/10 text-aqua',
  },
  {
    slug: 'inss',
    name: 'INSS',
    shortLabel: 'INSS',
    accentStripe: 'bg-primary/35',
    accentBadge: 'border-border bg-elevated text-primary',
  },
  {
    slug: 'trt',
    name: 'TRT',
    shortLabel: 'TRT',
    accentStripe:
      'bg-[#60a5fa] shadow-[0_0_14px_rgba(96,165,250,0.35)]',
    accentBadge: 'border-[#60a5fa]/45 bg-[#60a5fa]/12 text-[#93c5fd]',
  },
  {
    slug: 'rfb',
    name: 'Receita Federal',
    shortLabel: 'RFB',
    accentStripe: 'bg-firefly shadow-[0_0_16px_rgba(163,163,79,0.3)]',
    accentBadge: 'border-firefly/40 bg-firefly/10 text-firefly',
  },
]
