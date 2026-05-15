type EmailActionType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email'
  | 'reauthentication'
  | 'password_changed_notification'
  | 'email_changed_notification'
  | 'phone_changed_notification'
  | 'identity_linked_notification'
  | 'identity_unlinked_notification'
  | 'mfa_factor_enrolled_notification'
  | 'mfa_factor_unenrolled_notification'

export type AuthEmailPayload = {
  user: {
    email: string
    user_metadata?: { full_name?: string }
    new_email?: string
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: EmailActionType
    site_url: string
    token_new: string
    token_hash_new: string
  }
}

const SUBJECTS: Partial<Record<EmailActionType, string>> = {
  signup: 'Confirm your AIBotBanao account',
  recovery: 'Reset your AIBotBanao password',
  magiclink: 'Your AIBotBanao sign-in link',
  invite: 'You are invited to AIBotBanao',
  email_change: 'Confirm your email change',
  email: 'Confirm your email',
  reauthentication: 'Your AIBotBanao verification code',
  password_changed_notification: 'Your password was changed',
  email_changed_notification: 'Your email was changed',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildSupabaseVerifyUrl(
  tokenHash: string,
  actionType: string,
  redirectTo: string
): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
  const params = new URLSearchParams({
    token: tokenHash,
    type: actionType,
    redirect_to: redirectTo,
  })
  return `${base}/auth/v1/verify?${params.toString()}`
}

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#16a34a;">AIBotBanao</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">${escapeHtml(title)}</h1>
          ${body}
          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
            If you did not request this, you can ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px;">
      ${escapeHtml(label)}
    </a>
  </p>
  <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">${escapeHtml(href)}</p>`
}

function otpBlock(token: string): string {
  if (!token) return ''
  return `<p style="margin:16px 0 0;font-size:14px;color:#374151;">
    Or enter this code: <strong style="font-size:18px;letter-spacing:2px;">${escapeHtml(token)}</strong>
  </p>`
}

export function buildAuthEmail(
  payload: AuthEmailPayload,
  options?: { tokenHash?: string; token?: string; toEmail?: string }
): { to: string; subject: string; html: string } | null {
  const { user, email_data } = payload
  const action = email_data.email_action_type
  const to = options?.toEmail ?? user.email
  const tokenHash = options?.tokenHash ?? email_data.token_hash
  const token = options?.token ?? email_data.token
  const redirectTo = email_data.redirect_to
  const name = user.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  const subject = SUBJECTS[action]
  if (!subject) return null

  if (action.endsWith('_notification')) {
    return {
      to,
      subject,
      html: emailShell(
        subject,
        `<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
          Hi ${escapeHtml(name)}, this is a security notification for your AIBotBanao account.
        </p>`
      ),
    }
  }

  const verifyUrl = buildSupabaseVerifyUrl(tokenHash, action, redirectTo)

  const copy: Record<string, { title: string; intro: string; cta: string }> = {
    signup: {
      title: 'Confirm your email',
      intro: `Hi ${name}, thanks for signing up. Click below to activate your account and start building your AI bot.`,
      cta: 'Confirm email',
    },
    recovery: {
      title: 'Reset your password',
      intro: `Hi ${name}, we received a request to reset your password. Click below to choose a new one.`,
      cta: 'Reset password',
    },
    magiclink: {
      title: 'Sign in to AIBotBanao',
      intro: `Hi ${name}, use the button below to sign in. This link expires soon.`,
      cta: 'Sign in',
    },
    invite: {
      title: 'You are invited',
      intro: `You have been invited to join AIBotBanao. Click below to accept the invite.`,
      cta: 'Accept invite',
    },
    email_change: {
      title: 'Confirm email change',
      intro: `Confirm this email change for your AIBotBanao account.`,
      cta: 'Confirm change',
    },
    email: {
      title: 'Confirm your email',
      intro: `Confirm your email address for AIBotBanao.`,
      cta: 'Confirm email',
    },
    reauthentication: {
      title: 'Verification required',
      intro: `Confirm this action on your AIBotBanao account.`,
      cta: 'Continue',
    },
  }

  const content = copy[action]
  if (!content) return null

  const html = emailShell(
    content.title,
    `<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">${escapeHtml(content.intro)}</p>
     ${ctaButton(verifyUrl, content.cta)}
     ${otpBlock(token)}`
  )

  return { to, subject, html }
}

/** Secure email change sends two emails; token/hash field names are swapped per Supabase docs. */
export function buildEmailChangeEmails(payload: AuthEmailPayload): { to: string; subject: string; html: string }[] {
  const { user, email_data } = payload
  const emails: { to: string; subject: string; html: string }[] = []

  if (user.email && email_data.token_hash_new) {
    const current = buildAuthEmail(payload, {
      toEmail: user.email,
      tokenHash: email_data.token_hash_new,
      token: email_data.token,
    })
    if (current) emails.push({ ...current, subject: 'Confirm email change (current address)' })
  }

  if (user.new_email && email_data.token_hash) {
    const next = buildAuthEmail(payload, {
      toEmail: user.new_email,
      tokenHash: email_data.token_hash,
      token: email_data.token_new,
    })
    if (next) emails.push({ ...next, subject: 'Confirm your new email address' })
  }

  if (emails.length === 0) {
    const single = buildAuthEmail(payload)
    if (single) emails.push(single)
  }

  return emails
}
