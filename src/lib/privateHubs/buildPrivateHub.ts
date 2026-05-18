import type { HubSummary } from '@/data/sampleHubs'

function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'hub'
}

export function buildPrivateHub(
  name: string,
  iconEmoji?: string,
  existingSlugs: string[] = [],
): HubSummary {
  const base = slugifyName(name)
  let slug = `privado-${base}`
  let suffix = 0
  while (existingSlugs.includes(slug)) {
    suffix += 1
    slug = `privado-${base}-${suffix}`
  }

  return {
    slug,
    name: name.trim(),
    shortLabel: 'Privado',
    accentStripe: 'bg-firefly shadow-[0_0_16px_rgba(163,163,79,0.3)]',
    accentBadge: 'border-firefly/40 bg-firefly/10 text-firefly',
    isPrivate: true,
    iconEmoji,
  }
}
