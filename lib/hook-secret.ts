/** Parse Supabase Send Email hook secret for standardwebhooks. */
export function getSendEmailHookSecret(): string {
  const raw = process.env.SEND_EMAIL_HOOK_SECRET?.trim()
  if (!raw) {
    throw new Error('SEND_EMAIL_HOOK_SECRET is not configured')
  }
  if (raw.startsWith('v1,whsec_')) {
    return raw.slice('v1,whsec_'.length)
  }
  if (raw.startsWith('whsec_')) {
    return raw.slice('whsec_'.length)
  }
  return raw
}

export function getWebhookHeaders(request: Request): Record<string, string> {
  const get = (name: string) => request.headers.get(name) ?? ''
  return {
    'webhook-id': get('webhook-id'),
    'webhook-timestamp': get('webhook-timestamp'),
    'webhook-signature': get('webhook-signature'),
  }
}
