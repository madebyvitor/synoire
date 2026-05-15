export type HubSummary = {
  slug: string
  name: string
  shortLabel: string
}

/** Hubs exemplo — futuramente virão do Supabase */
export const SAMPLE_HUBS: HubSummary[] = [
  { slug: 'pf', name: 'Polícia Federal', shortLabel: 'PF' },
  { slug: 'bb', name: 'Banco do Brasil', shortLabel: 'BB' },
  { slug: 'inss', name: 'INSS', shortLabel: 'INSS' },
  { slug: 'trt', name: 'TRT', shortLabel: 'TRT' },
  { slug: 'rfb', name: 'Receita Federal', shortLabel: 'RFB' },
]
