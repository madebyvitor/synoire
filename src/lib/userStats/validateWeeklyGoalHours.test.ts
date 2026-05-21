import { describe, expect, it } from 'vitest'
import {
  validateWeeklyGoalHours,
  weeklyGoalHoursToMinutes,
} from './validateWeeklyGoalHours'

describe('validateWeeklyGoalHours', () => {
  it('rejects non-finite and out-of-range values', () => {
    expect(validateWeeklyGoalHours(Number.NaN)).toMatch(/válido/)
    expect(validateWeeklyGoalHours(0)).toMatch(/pelo menos/)
    expect(validateWeeklyGoalHours(0.5)).toMatch(/pelo menos/)
    expect(validateWeeklyGoalHours(169)).toMatch(/não pode passar/)
  })

  it('accepts values within range', () => {
    expect(validateWeeklyGoalHours(1)).toBeNull()
    expect(validateWeeklyGoalHours(20)).toBeNull()
    expect(validateWeeklyGoalHours(168)).toBeNull()
  })
})

describe('weeklyGoalHoursToMinutes', () => {
  it('converts hours to rounded minutes', () => {
    expect(weeklyGoalHoursToMinutes(20)).toBe(1200)
    expect(weeklyGoalHoursToMinutes(1.5)).toBe(90)
  })
})
