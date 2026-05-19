import { describe, expect, it } from 'vitest'
import { shouldPromoteLoungeToActive } from './loungePromotion'

describe('shouldPromoteLoungeToActive', () => {
  it('promotes when prep countdown finishes', () => {
    expect(shouldPromoteLoungeToActive('prep', 'prep', 'focus', true, 0)).toBe(true)
  })

  it('promotes prep waiters when the room already left idle', () => {
    expect(shouldPromoteLoungeToActive('prep', 'prep', 'focus', false, 1200)).toBe(true)
    expect(shouldPromoteLoungeToActive('prep', 'prep', 'break', false, 300)).toBe(true)
  })

  it('does not promote prep waiters while prep is still running', () => {
    expect(shouldPromoteLoungeToActive('prep', 'prep', 'focus', true, 45)).toBe(false)
  })

  it('promotes break waiters when the room is in break', () => {
    expect(shouldPromoteLoungeToActive('break', 'focus', 'break', false, 300)).toBe(true)
    expect(shouldPromoteLoungeToActive('break', 'prep', 'break', false, 300)).toBe(true)
  })

  it('does not promote break waiters during focus', () => {
    expect(shouldPromoteLoungeToActive('break', 'focus', 'focus', false, 1200)).toBe(false)
  })

  it('promotes focus waiters after break ends', () => {
    expect(shouldPromoteLoungeToActive('focus', 'break', 'focus', false, 1200)).toBe(true)
  })

  it('does not promote focus waiters during break', () => {
    expect(shouldPromoteLoungeToActive('focus', 'break', 'break', false, 300)).toBe(false)
  })
})
