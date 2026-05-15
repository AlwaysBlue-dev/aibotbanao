import { Webhook } from 'standardwebhooks'
import { type NextRequest, NextResponse } from 'next/server'
import { normalizeAuthEmailPayload } from '@/lib/auth-emails'
import { getSendEmailHookSecret, getWebhookHeaders } from '@/lib/hook-secret'
import { sendAuthEmailsViaResend } from '@/lib/send-auth-email'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  console.error(`[send-email] ${status}: ${message}`)
  return NextResponse.json({ error: { message } }, { status })
}

/** Supabase Send Email hook → all auth mail sent through Resend. */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY?.trim()) {
      return jsonError('RESEND_API_KEY is not configured on the server', 500)
    }
    if (!process.env.RESEND_FROM_EMAIL?.trim()) {
      return jsonError('RESEND_FROM_EMAIL is not configured on the server', 500)
    }
    if (!process.env.SEND_EMAIL_HOOK_SECRET?.trim()) {
      return jsonError('SEND_EMAIL_HOOK_SECRET is not configured on the server', 500)
    }

    const payload = await request.text()
    const headers = getWebhookHeaders(request)

    let verified
    try {
      const wh = new Webhook(getSendEmailHookSecret())
      verified = normalizeAuthEmailPayload(
        wh.verify(payload, headers) as Record<string, unknown>
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid webhook signature'
      return jsonError(message, 401)
    }

    await sendAuthEmailsViaResend(verified)
    return NextResponse.json({})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected send-email error'
    return jsonError(message, 500)
  }
}
