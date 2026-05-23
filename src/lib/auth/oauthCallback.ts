import type { Session } from '@supabase/supabase-js'

export function isOAuthCallbackUrl(location: Location = window.location): boolean {
  const search = new URLSearchParams(location.search)
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''))
  return (
    search.has('code') ||
    search.has('error') ||
    search.has('error_description') ||
    hash.has('access_token') ||
    hash.has('error')
  )
}

export function isAuthSessionReady(
  session: Session | null,
  authLoading: boolean,
): boolean {
  return !authLoading && Boolean(session?.access_token)
}

/** Remove OAuth query/hash params after session is established. */
export function clearOAuthCallbackFromUrl(location: Location = window.location): void {
  const url = new URL(location.href)
  const hadSearch =
    url.searchParams.has('code') ||
    url.searchParams.has('error') ||
    url.searchParams.has('error_description')
  const hadHash =
    url.hash.includes('access_token') || url.hash.includes('error')

  if (!hadSearch && !hadHash) return

  url.searchParams.delete('code')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  url.hash = ''
  window.history.replaceState({}, '', url.pathname + url.search)
}
