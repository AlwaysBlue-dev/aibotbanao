/** User-friendly messages for Supabase Auth errors (signup, reset, etc.). */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase()

  if (
    lower.includes('rate limit') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('email rate limit')
  ) {
    return 'Too many emails were sent recently. Please wait about an hour, or try a different email address.'
  }

  if (lower.includes('already registered') || lower.includes('user already registered')) {
    return 'This email is already registered. Try signing in instead.'
  }

  if (lower.includes('hook') && lower.includes('500')) {
    return 'We could not send the verification email. Please try again in a few minutes.'
  }

  if (lower.includes('invalid login')) {
    return 'Incorrect email or password.'
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email first. Check your inbox for the verification link.'
  }

  return message
}
