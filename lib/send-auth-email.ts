import type { AuthEmailPayload } from '@/lib/auth-emails'
import { buildAuthEmail, buildEmailChangeEmails } from '@/lib/auth-emails'
import { getResendClient, getResendFromAddress } from '@/lib/resend'

export async function sendAuthEmailsViaResend(payload: AuthEmailPayload): Promise<void> {
  const action = payload.email_data.email_action_type
  const messages =
    action === 'email_change'
      ? buildEmailChangeEmails(payload)
      : (() => {
          const one = buildAuthEmail(payload)
          return one ? [one] : []
        })()

  if (messages.length === 0) {
    throw new Error(`Unsupported email action: ${action}`)
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
      throw new Error(`Resend: ${error.message}`)
    }
  }
}
