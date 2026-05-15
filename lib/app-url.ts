/** Canonical production URL when env is unset (e.g. email redirects). */
export const DEFAULT_APP_URL = 'https://aibotbanao.com'

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

/** Production URL for auth emails and post-login redirects (never localhost). */
export function getProductionAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return normalizeUrl(fromEnv)
  return DEFAULT_APP_URL
}

/**
 * Public site URL; prefers NEXT_PUBLIC_APP_URL.
 * In production, ignores localhost from clientOrigin.
 */
export function getAppUrl(clientOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return normalizeUrl(fromEnv)

  if (clientOrigin) {
    const origin = normalizeUrl(clientOrigin)
    const isLocal =
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      /^https?:\/\/192\.168\./.test(origin)
    if (isLocal && process.env.NODE_ENV === 'production') {
      return DEFAULT_APP_URL
    }
    return origin
  }

  return DEFAULT_APP_URL
}

export function authConfirmUrl(): string {
  return `${getProductionAppUrl()}/auth/confirm`
}

export function resetPasswordUrl(): string {
  return `${getProductionAppUrl()}/reset-password`
}
