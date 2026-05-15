/** Canonical production URL when env is unset (e.g. email redirects). */
export const DEFAULT_APP_URL = 'https://aibotbanao.com'

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

/**
 * Public site URL for auth email links and post-confirm redirects.
 * Prefer NEXT_PUBLIC_APP_URL; in production builds never fall back to localhost.
 */
export function getAppUrl(clientOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
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

export function authConfirmUrl(clientOrigin?: string): string {
  return `${getAppUrl(clientOrigin)}/auth/confirm`
}

export function resetPasswordUrl(clientOrigin?: string): string {
  return `${getAppUrl(clientOrigin)}/reset-password`
}
