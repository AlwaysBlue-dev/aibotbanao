import { Webhook } from 'standardwebhooks'
import { type NextRequest, NextResponse } from 'next/server'
import {
  buildAuthEmail,
  buildEmailChangeEmails,
  type AuthEmailPayload,
} from '@/lib/auth-emails'
import { getResendClient, getResendFromAddress } from '@/lib/resend'

export const runtime = 'nodejs'

function getHookSecret(): string {
  const raw = process.env.SEND_EMAIL_HOOK_SECRET
  if (!raw) {
    throw new Error('SEND_EMAIL_HOOK_SECRET is not configured')
  }
  return raw.replace(/^v1,whsec_/, '')
}

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: { message: 'RESEND_API_KEY is not configured' } },
      { status: 500 }
    )
  }

  const payload = await request.text()
  const headers = Object.fromEntries(request.headers)

  let verified: AuthEmailPayload
  try {
    const wh = new Webhook(getHookSecret())
    verified = wh.verify(payload, headers) as AuthEmailPayload
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid webhook signature'
    return NextResponse.json({ error: { message } }, { status: 401 })
  }

  const { email_data } = verified
  const messages =
    email_data.email_action_type === 'email_change'
      ? buildEmailChangeEmails(verified)
      : (() => {
          const one = buildAuthEmail(verified)
          return one ? [one] : []
        })()

  if (messages.length === 0) {
    return NextResponse.json(
      { error: { message: `Unsupported email action: ${email_data.email_action_type}` } },
      { status: 400 }
    )
  }

  const resend = getResendClient()
  const from = getResendFromAddress()

  for (const msg of messages) {
    const { error } = await resend.emails.send({
      from,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
    })
    if (error) {
      return NextResponse.json(
        { error: { message: error.message, name: error.name } },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({})
}
