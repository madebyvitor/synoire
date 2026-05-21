import { describe, expect, it } from 'vitest'
import { needsWeeklyGoalOnboarding } from './needsWeeklyGoalOnboarding'

describe('needsWeeklyGoalOnboarding', () => {
  it('returns true for null, undefined, and zero', () => {
    expect(needsWeeklyGoalOnboarding(null)).toBe(true)
    expect(needsWeeklyGoalOnboarding(undefined)).toBe(true)
    expect(needsWeeklyGoalOnboarding(0)).toBe(true)
  })

  it('returns false when minutes are positive', () => {
    expect(needsWeeklyGoalOnboarding(60)).toBe(false)
    expect(needsWeeklyGoalOnboarding(1200)).toBe(false)
  })
})
