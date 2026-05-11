import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase'
import type { Business, OrderItem, Shop } from '@/lib/supabase'
import { normalizeWhatsAppPhone } from '@/lib/whatsapp'

const DAILY_LIMIT = 50

type ConversationMessage = { role: 'user' | 'bot'; text: string }
type OrderData = {
  items: OrderItem[]
  customerName: string
  customerPhone: string
  customerAddress: string
  subtotal: number
  deliveryCharge: number
  total: number
  notes?: string
}
type ApiErrorCode = 'rate_limit' | 'ai_error' | 'db_error' | 'timeout'
type ProviderInfo = { provider: 'gemini' | 'openrouter' | 'groq'; model: string }
type MessageLogRow = { message_count: number | null }

// ─── Normalised bot context (works with both shop + legacy business) ──────────
type BotContext = {
  name: string
  businessType: string
  products: string
  deliveryInfo: string
  workingHours: string
  returnPolicy: string
  language: string
  whatsapp: string | null
  shopId: string | null        // null for legacy businesses
  isActive: boolean
}

function shopToBotContext(shop: Shop): BotContext {
  const cfg = shop.bot_config ?? {}
  return {
    name: shop.shop_name,
    businessType: cfg.business_type ?? '',
    products: cfg.products ?? '',
    deliveryInfo: cfg.delivery_info ?? '',
    workingHours: cfg.working_hours ?? '',
    returnPolicy: cfg.return_policy ?? '',
    language: shop.bot_language,
    whatsapp: shop.whatsapp_number,
    shopId: shop.id,
    isActive: shop.is_active,
  }
}

function businessToBotContext(b: Business): BotContext {
  return {
    name: b.name,
    businessType: b.business_type,
    products: b.products ?? '',
    deliveryInfo: b.delivery_info ?? '',
    workingHours: b.working_hours ?? '',
    returnPolicy: b.return_policy ?? '',
    language: b.language,
    whatsapp: b.whatsapp,
    shopId: null,
    isActive: true,
  }
}

// ─── AI provider helpers ──────────────────────────────────────────────────────

function getErrorStatus(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null
  const e = err as { status?: unknown; response?: { status?: unknown } }
  if (typeof e.status === 'number') return e.status
  if (typeof e.response?.status === 'number') return e.response.status
  return null
}
function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
function isTimeoutError(err: unknown): boolean {
  return err instanceof Error && err.message === 'GEMINI_TIMEOUT'
}

async function generateWithGemini(
  apiKey: string,
  systemInstruction: string,
  message: string,
  history: ConversationMessage[]
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction })
  const chat = model.startChat({
    history: history.slice(-10).map((m) => ({
      role: m.role === 'user' ? 'user' : ('model' as const),
      parts: [{ text: m.text }],
    })),
  })
  const result = await Promise.race([
    chat.sendMessage(message.trim()),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('GEMINI_TIMEOUT')), 15000)),
  ])
  return result.response.text()
}

async function generateWithGroq(
  apiKey: string,
  systemInstruction: string,
  message: string,
  history: ConversationMessage[]
): Promise<string> {
  const sys = systemInstruction + '\n\nFALLBACK COMPLIANCE RULES:\n- Behave exactly like the primary model.\n- Never add markdown wrappers around JSON.\n- If order is confirmed, output ORDER_CONFIRMED JSON exactly as instructed.'
  const messages = [
    { role: 'system', content: sys },
    ...history.slice(-10).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: message.trim() },
  ]
  const res = await Promise.race([
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', messages, temperature: 0.05 }),
    }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('GROQ_TIMEOUT')), 15000)),
  ])
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error?.message ?? `Groq ${res.status}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) throw new Error('Groq returned empty response')
  return content.replace(/```(?:json)?/gi, '').trim()
}

async function generateWithOpenRouter(
  apiKey: string,
  systemInstruction: string,
  message: string,
  history: ConversationMessage[]
): Promise<string> {
  const sys = systemInstruction + '\n\nFALLBACK COMPLIANCE RULES:\n- Behave exactly like the primary model.\n- Never add markdown wrappers around JSON.\n- If order is confirmed, output ORDER_CONFIRMED JSON exactly as instructed.'
  const messages = [
    { role: 'system', content: sys },
    ...history.slice(-10).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: message.trim() },
  ]
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'
  const res = await Promise.race([
    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.05 }),
    }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('OPENROUTER_TIMEOUT')), 15000)),
  ])
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error?.message ?? `OpenRouter ${res.status}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) throw new Error('OpenRouter empty response')
  return content.replace(/```(?:json)?/gi, '').trim()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonError(code: ApiErrorCode, message: string, status: number) {
  return Response.json({ error: code, message }, { status })
}

function generateOrderNumber(): string {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`
}

function toSafeInt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ''), 10)
    if (Number.isFinite(parsed)) return Math.max(0, parsed)
  }
  return 0
}

function normalizeOrderData(raw: unknown): OrderData {
  const src = (raw ?? {}) as Partial<OrderData> & { items?: unknown[] }
  const items: OrderItem[] = Array.isArray(src.items)
    ? src.items
        .map((i) => {
          const item = i as Partial<OrderItem>
          return {
            name: typeof item?.name === 'string' ? item.name.trim() : '',
            quantity: toSafeInt(item?.quantity),
            size: typeof item?.size === 'string' ? item.size.trim() : undefined,
            price: toSafeInt(item?.price),
          }
        })
        .filter((i) => i.name.length > 0 && i.quantity > 0)
    : []
  return {
    items,
    customerName: typeof src.customerName === 'string' ? src.customerName.trim() : '',
    customerPhone: typeof src.customerPhone === 'string' ? src.customerPhone.trim() : '',
    customerAddress: typeof src.customerAddress === 'string' ? src.customerAddress.trim() : '',
    subtotal: toSafeInt(src.subtotal),
    deliveryCharge: toSafeInt(src.deliveryCharge),
    total: toSafeInt(src.total),
    notes: typeof src.notes === 'string' ? src.notes.trim() : undefined,
  }
}

function buildCustomerWhatsAppUrl(order: OrderData & { orderNumber: string }, businessName: string): string | null {
  const phone = normalizeWhatsAppPhone(order.customerPhone)
  if (!phone) return null
  const text = [
    `✅ Order Confirmed - ${businessName}`,
    `Order #: ${order.orderNumber}`,
    '',
    `Shukriya ${order.customerName}! Aap ka order receive ho gaya hai.`,
    `Total: Rs ${order.total}`,
    'Hum jald aap se contact karenge for dispatch details.',
  ].join('\n')
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
}

function normalizeBotReply(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(^|\s)@(?=[a-zA-Z])/g, '$1')
    .replace(/[""]/g, '"')
    .trim()
}

function buildSystemPrompt(ctx: BotContext): string {
  const whatsappLine = ctx.whatsapp
    ? `Yeh item hmare paas available nahi hai. WhatsApp pe contact karein: ${ctx.whatsapp}`
    : `Yeh item hmare paas available nahi hai. WhatsApp pe contact karein.`

  const lines = [
    `You are the AI customer support assistant for ${ctx.name}, a ${ctx.businessType || 'general'} business.`,
    ``,
    `ABOUT THE BUSINESS:`,
    `Products and Prices: ${ctx.products || 'Not specified'}`,
    `Delivery: ${ctx.deliveryInfo || 'Not specified'}`,
    `Working Hours: ${ctx.workingHours || 'Not specified'}`,
    `Return Policy: ${ctx.returnPolicy || 'Not specified'}`,
    ``,
    `STRICT RULES — NEVER BREAK THESE:`,
    `1. You ONLY know what is written above. Nothing more.`,
    `2. If a customer asks about a product not listed above, say clearly: '${whatsappLine}'`,
    `3. NEVER invent prices, delivery charges, or policies.`,
    `4. NEVER say 'I think', 'probably', or 'I believe' about business facts.`,
    `5. If a customer pushes you to guess, still refuse and direct to WhatsApp.`,
    `6. Do not mention competitor shops.`,
    ``,
    `LANGUAGE RULES:`,
    `- roman_urdu: Always reply in Roman Urdu (Urdu words in English letters)`,
    `- urdu: Reply in Urdu script only`,
    `- english: Reply in English only`,
    `- auto: Match the customer's language/script`,
    `- Never mix scripts in one reply`,
    `- Keep a friendly shopkeeper tone`,
    ``,
    `Current language setting: ${ctx.language}`,
    ``,
    `ORDER TAKING RULES:`,
    `- If asked for products/catalog, list them clearly line-by-line`,
    `- When customer wants to order: confirm items, ask name/phone/address`,
    `- For clothing ask size, for food ask quantity`,
    `- Calculate total (items + delivery) and show summary`,
    `- Ask 'Confirm karna chahte hain? (yes/no)'`,
    `- On confirmation output EXACTLY this on its own line:`,
    `ORDER_CONFIRMED:{"items":[{"name":"...","quantity":1,"size":"...","price":0}],"customerName":"...","customerPhone":"...","customerAddress":"...","subtotal":0,"deliveryCharge":0,"total":0,"notes":"..."}`,
    `- Then add a friendly confirmation message`,
    ``,
    `If customer says 'cancel': stop flow, confirm cancellation, return to normal chat`,
    `STRICT: Only answer questions about this business`,
  ]

  if (ctx.whatsapp) {
    lines.push(`- If customer wants to contact directly: ${ctx.whatsapp}`)
  }

  return lines.join('\n')
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let message: string
  let slug: string
  let sessionId: string | undefined
  let conversationHistory: ConversationMessage[] = []

  try {
    const body = await request.json()
    message = body?.message
    slug = body?.slug
    sessionId = body?.sessionId
    conversationHistory = Array.isArray(body?.conversationHistory) ? body.conversationHistory : []
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }

  message = message.replace(/<[^>]*>/g, '').trim()

  if (message.length > 500) {
    return Response.json({ error: 'Message too long. Please keep it under 500 characters.' }, { status: 400 })
  }
  if (!slug || typeof slug !== 'string') {
    return Response.json({ error: 'slug is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── 1. Look up bot context: shops first, fall back to businesses ─────────────
  let botCtx: BotContext | null = null

  const { data: shopRaw } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (shopRaw) {
    const shop = shopRaw as Shop
    if (!shop.is_active) {
      return Response.json({ error: 'db_error', message: 'This bot is currently inactive.' }, { status: 503 })
    }
    botCtx = shopToBotContext(shop)
  } else {
    const { data: bizRaw } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (bizRaw) botCtx = businessToBotContext(bizRaw as Business)
  }

  if (!botCtx) {
    return jsonError('db_error', 'Service temporarily unavailable. Please try again.', 503)
  }

  // ── 2. Prompt injection check ─────────────────────────────────────────────
  if (/ignore previous instructions|you are now|new system prompt|forget everything/i.test(message)) {
    return Response.json({ reply: `Main sirf ${botCtx.name} ke baare mein baat kar sakta hoon!` })
  }

  // ── 3. Rate limit check (shops use shop_id key, legacy use slug) ──────────
  const today = new Date().toISOString().split('T')[0]
  const rateLimitKey = botCtx.shopId ?? slug

  const { data: logRow } = await supabase
    .from('message_logs')
    .select('message_count')
    .eq('slug', rateLimitKey)
    .eq('date', today)
    .maybeSingle()
  const currentCount = (logRow as MessageLogRow | null)?.message_count ?? 0

  if (currentCount >= DAILY_LIMIT) {
    return Response.json({ error: 'Daily limit reached. Please try again tomorrow.' }, { status: 429 })
  }

  // ── 4. Increment rate limit counter ──────────────────────────────────────
  await (supabase.from('message_logs') as unknown as {
    upsert: (v: object, o: object) => Promise<unknown>
  }).upsert(
    { slug: rateLimitKey, date: today, message_count: currentCount + 1 },
    { onConflict: 'slug,date' }
  )

  // ── 5. Upsert chat session for shops ─────────────────────────────────────
  if (botCtx.shopId && sessionId) {
    await (supabase.from('chat_sessions') as unknown as {
      upsert: (v: object, o: object) => Promise<unknown>
    }).upsert(
      {
        shop_id: botCtx.shopId,
        session_id: sessionId,
        message_count: (conversationHistory.length ?? 0) + 1,
      },
      { onConflict: 'shop_id,session_id' }
    )
  }

  // ── 6. Build prompt and call AI ───────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY
  const openRouterKey = process.env.OPEN_ROUTER_API_KEY || process.env.OPENROUTER_API_KEY
  const groqKey = process.env.GROQ_API_KEY
  if (!geminiKey && !openRouterKey && !groqKey) {
    return Response.json({ error: 'AI service is not configured' }, { status: 500 })
  }

  const systemPrompt = buildSystemPrompt(botCtx)
  const openRouterModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

  try {
    let rawReply = ''
    let providerInfo: ProviderInfo | null = null

    const tryOpenRouterOrGroq = async () => {
      if (openRouterKey) {
        try {
          rawReply = await generateWithOpenRouter(openRouterKey, systemPrompt, message, conversationHistory)
          providerInfo = { provider: 'openrouter', model: openRouterModel }
          return
        } catch { if (!groqKey) throw new Error('no_provider') }
      }
      if (groqKey) {
        rawReply = await generateWithGroq(groqKey, systemPrompt, message, conversationHistory)
        providerInfo = { provider: 'groq', model: groqModel }
      }
    }

    if (geminiKey) {
      try {
        rawReply = await generateWithGemini(geminiKey, systemPrompt, message, conversationHistory)
        providerInfo = { provider: 'gemini', model: 'gemini-2.5-flash' }
      } catch {
        await tryOpenRouterOrGroq()
        if (!providerInfo) throw new Error('All providers failed')
      }
    } else if (openRouterKey) {
      try {
        rawReply = await generateWithOpenRouter(openRouterKey, systemPrompt, message, conversationHistory)
        providerInfo = { provider: 'openrouter', model: openRouterModel }
      } catch {
        if (groqKey) {
          rawReply = await generateWithGroq(groqKey, systemPrompt, message, conversationHistory)
          providerInfo = { provider: 'groq', model: groqModel }
        } else throw new Error('All providers failed')
      }
    } else if (groqKey) {
      rawReply = await generateWithGroq(groqKey, systemPrompt, message, conversationHistory)
      providerInfo = { provider: 'groq', model: groqModel }
    }

    // ── 7. Detect ORDER_CONFIRMED ────────────────────────────────────────────
    const lines = rawReply.split('\n')
    const orderLine = lines.find((l) => l.trim().startsWith('ORDER_CONFIRMED:'))

    if (orderLine) {
      const jsonStr = orderLine.trim().slice('ORDER_CONFIRMED:'.length)
      const cleanReply = normalizeBotReply(
        lines.filter((l) => !l.trim().startsWith('ORDER_CONFIRMED:')).join('\n').trim()
      )

      try {
        const orderJson = normalizeOrderData(JSON.parse(jsonStr))
        const orderNumber = generateOrderNumber()

        // Save order — new shops table or legacy
        if (botCtx.shopId) {
          await (supabase.from('orders') as unknown as {
            insert: (v: object) => Promise<unknown>
          }).insert({
            shop_id: botCtx.shopId,
            session_id: sessionId ?? null,
            items: orderJson.items,
            customer_whatsapp: orderJson.customerPhone || null,
            total_amount: orderJson.total,
            status: 'pending',
          })
        } else {
          // Legacy businesses table order
          await (supabase.from('orders') as unknown as {
            insert: (v: object) => Promise<unknown>
          }).insert({
            order_number: orderNumber,
            slug,
            items: orderJson.items,
            customer_name: orderJson.customerName,
            customer_phone: orderJson.customerPhone,
            customer_address: orderJson.customerAddress,
            subtotal: orderJson.subtotal,
            delivery_charge: orderJson.deliveryCharge,
            total_amount: orderJson.total,
            special_notes: orderJson.notes || null,
            status: 'new',
          })
        }

        const customerWhatsappUrl = buildCustomerWhatsAppUrl({ ...orderJson, orderNumber }, botCtx.name)

        return Response.json({ reply: cleanReply, orderData: { ...orderJson, orderNumber }, customerWhatsappUrl, providerInfo })
      } catch {
        return Response.json({ reply: cleanReply || normalizeBotReply(rawReply) })
      }
    }

    return Response.json({ reply: normalizeBotReply(rawReply), providerInfo })
  } catch (err) {
    if (isTimeoutError(err) || (err instanceof Error && /GROQ_TIMEOUT|OPENROUTER_TIMEOUT/.test(err.message))) {
      return jsonError('timeout', 'Reply mein der ho rahi hai. Dobara try karein!', 504)
    }
    const status = getErrorStatus(err)
    const msg = getErrorMessage(err)
    if (status === 429 || /429|rate limit|quota|resource_exhausted/i.test(msg)) {
      return jsonError('rate_limit', 'Thoda wait karein, abhi busy hain. 1 minute mein dobara try karein!', 429)
    }
    return jsonError('ai_error', 'Kuch masla aa gaya. Dobara try karein ya WhatsApp pe contact karein.', 500)
  }
}
