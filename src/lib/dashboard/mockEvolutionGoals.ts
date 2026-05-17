import { getHubBySlug } from '@/data/sampleHubs'

export type EvolutionGoal = {
  hub_id: string
  target_hours: number
  current_hours: number
  period: string
}

export type EvolutionGoalWithHub = EvolutionGoal & {
  hubName: string
}

export const MOCK_EVOLUTION_GOALS: EvolutionGoal[] = [
  { hub_id: 'pf', target_hours: 10, current_hours: 7.5, period: 'Semanal' },
  { hub_id: 'bb', target_hours: 8, current_hours: 8, period: 'Semanal' },
  { hub_id: 'inss', target_hours: 6, current_hours: 3, period: 'Semanal' },
  { hub_id: 'rfb', target_hours: 5, current_hours: 4.25, period: 'Semanal' },
]

const goalByHubId = new Map(MOCK_EVOLUTION_GOALS.map((g) => [g.hub_id, g]))

function resolveHubName(hubId: string): string {
  return getHubBySlug(hubId)?.name ?? hubId
}

function toGoalWithHub(goal: EvolutionGoal): EvolutionGoalWithHub {
  return {
    ...goal,
    hubName: resolveHubName(goal.hub_id),
  }
}

export function goalsForJoinedHubs(slugs: string[]): EvolutionGoalWithHub[] {
  return slugs
    .map((slug) => goalByHubId.get(slug))
    .filter((g): g is EvolutionGoal => g !== undefined)
    .map(toGoalWithHub)
}

/** Placeholder goals for free-tier paywall teaser when user has no joined hubs. */
export function paywallTeaserGoals(): EvolutionGoalWithHub[] {
  return goalsForJoinedHubs(['pf', 'bb'])
}
