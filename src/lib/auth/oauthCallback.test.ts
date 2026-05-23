import { describe, expect, it } from 'vitest'
import { isAuthSessionReady, isOAuthCallbackUrl } from './oauthCallback'

function mockLocation(parts: { search?: string; hash?: string }): Location {
  return {
    search: parts.search ?? '',
    hash: parts.hash ?? '',
  } as Location
}

describe('isOAuthCallbackUrl', () => {
  it('detects PKCE code in search', () => {
    expect(isOAuthCallbackUrl(mockLocation({ search: '?code=abc' }))).toBe(true)
  })

  it('detects error in search', () => {
    expect(
      isOAuthCallbackUrl(mockLocation({ search: '?error=access_denied' })),
    ).toBe(true)
  })

  it('detects access_token in hash', () => {
    expect(
      isOAuthCallbackUrl(mockLocation({ hash: '#access_token=xyz' })),
    ).toBe(true)
  })

  it('returns false for normal URLs', () => {
    expect(isOAuthCallbackUrl(mockLocation({ search: '', hash: '' }))).toBe(false)
  })
})

describe('isAuthSessionReady', () => {
  it('is false while loading', () => {
    expect(
      isAuthSessionReady({ access_token: 't' } as never, true),
    ).toBe(false)
  })

  it('is false without access_token', () => {
    expect(isAuthSessionReady({ user: {} } as never, false)).toBe(false)
    expect(isAuthSessionReady(null, false)).toBe(false)
  })

  it('is true with token and not loading', () => {
    expect(
      isAuthSessionReady({ access_token: 't' } as never, false),
    ).toBe(true)
  })
})
