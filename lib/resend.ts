import { Resend } from 'resend'

const FROM_DISPLAY_NAME = 'AIBotBanao'

let client: Resend | null = null

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!client) {
    client = new Resend(apiKey)
  }
  return client
}

export function getResendFromAddress(): string {
  const raw = process.env.RESEND_FROM_EMAIL?.trim()
  if (!raw) {
    throw new Error('RESEND_FROM_EMAIL is not configured in .env')
  }
  if (raw.includes('<') && raw.includes('>')) return raw
  return `${FROM_DISPLAY_NAME} <${raw}>`
}
