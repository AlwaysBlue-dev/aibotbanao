import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { normalizeWhatsAppPhone } from '@/lib/whatsapp'

const DAILY_CREATION_LIMIT = 3

type SetupPayload = {
  name?: unknown
  business_type?: unknown
  products?: unknown
  delivery_info?: unknown
  working_hours?: unknown
  return_policy?: unknown
  language?: unknown
  whatsapp?: unknown
  website?: unknown
}
type BusinessesWriter = {
  insert: (values: {
    name: string
    slug: string
    business_type: string
    products: string | null
    delivery_info: string | null
    working_hours: string | null
    return_policy: string | null
    language: string
    whatsapp: string | null
    admin_token: string
  }) => Promise<{ error: { message: string } | null }>
}
type CreationLogsWriter = {
  insert: (values: { ip_address: string }) => Promise<{ error: { message: string } | null }>
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  const safeBase = base || 'business'
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${safeBase}-${suffix}`
}

function generateAdminToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getBusinessNameValidationError(name: string): string | null {
  const cleaned = name.trim().replace(/\s+/g, ' ')
  if (!cleaned) return 'Business name is required'

  const lettersOnly = cleaned.replace(/[^a-zA-Z]/g, '')
  if (cleaned.length < 4 || lettersOnly.length < 3) {
    return 'Please enter a proper business name (at least 4 characters).'
  }

  if (!/^[a-zA-Z0-9&'().,\-\s]+$/.test(cleaned)) {
    return 'Business name contains unsupported characters.'
  }

  if (/^(.)\1+$/i.test(cleaned.replace(/\s/g, ''))) {
    return 'Please enter a real business name.'
  }

  return null
}

function getBaseUrl(request: NextRequest): string {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || request.headers.get('host') || request.nextUrl.host
  const protocol = forwardedProto || (host?.includes('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

function buildOwnerAdminWhatsAppUrl(
  ownerWhatsapp: string,
  customerUrl: string,
  adminUrl: string
): string | null {
  const phone = normalizeWhatsAppPhone(ownerWhatsapp)
  if (!phone) return null

  const text = [
    '🔐 AIBotBanao Admin Link - Save this!',
    '',
    `Your bot is live: ${customerUrl}`,
    '',
    'Your ADMIN link (keep this private):',
    adminUrl,
    '',
    'Use the admin link to update your products, prices and view orders.',
    '⚠️ Do not share the admin link with anyone.',
  ].join('\n')

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
}

export async function POST(request: NextRequest) {
  let body: SetupPayload

  try {
    body = (await request.json()) as SetupPayload
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = toStr(body.name).trim()
  const nameError = getBusinessNameValidationError(name)
  if (nameError) {
    return Response.json({ error: nameError }, { status: 400 })
  }

  const website = toStr(body.website).trim()
  if (website) {
    // Honeypot hit: return fake success, but don't create records.
    return Response.json({
      slug: generateSlug(name),
      adminToken: generateAdminToken(),
    })
  }

  const supabase = createAdminClient()
  const ipAddress = getRequestIp(request)
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const olderThan7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Keep log table small; failure should not block setup.
  await supabase.from('creation_logs').delete().lt('created_at', olderThan7Days)

  const { count, error: countError } = await supabase
    .from('creation_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ipAddress)
    .gte('created_at', last24Hours)

  if (countError) {
    console.error('creation_logs count error:', countError.message)
    return Response.json({ error: 'Failed to process setup request' }, { status: 500 })
  }

  if ((count ?? 0) >= DAILY_CREATION_LIMIT) {
    return Response.json(
      { error: 'Aaj ke liye bot creation limit ho gayi. Kal dobara try karein.' },
      { status: 429 }
    )
  }

  const slug = generateSlug(name)
  const adminToken = generateAdminToken()
  const baseUrl = getBaseUrl(request)
  const customerUrl = `${baseUrl}/chat/${slug}`
  const adminUrl = `${baseUrl}/chat/${slug}?admin=${adminToken}`
  const ownerWhatsapp = toStr(body.whatsapp)
  const ownerWhatsappUrl = buildOwnerAdminWhatsAppUrl(
    ownerWhatsapp,
    customerUrl,
    adminUrl
  )

  const businessesWriter = supabase.from('businesses') as unknown as BusinessesWriter
  const { error: createError } = await businessesWriter.insert({
    name,
    slug,
    business_type: toStr(body.business_type) || 'Other',
    products: toStr(body.products) || null,
    delivery_info: toStr(body.delivery_info) || null,
    working_hours: toStr(body.working_hours) || null,
    return_policy: toStr(body.return_policy) || null,
    language: toStr(body.language) || 'both',
    whatsapp: ownerWhatsapp || null,
    admin_token: adminToken,
  })

  if (createError) {
    console.error('business create error:', createError.message)
    return Response.json({ error: 'Failed to create bot. Please try again.' }, { status: 500 })
  }

  const creationLogsWriter = supabase.from('creation_logs') as unknown as CreationLogsWriter
  const { error: logError } = await creationLogsWriter.insert({
    ip_address: ipAddress,
  })

  if (logError) {
    console.error('creation_logs insert error:', logError.message)
  }

  return Response.json({ slug, adminToken, ownerWhatsappUrl })
}
