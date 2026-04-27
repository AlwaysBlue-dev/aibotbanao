import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase'
import type { Business, OrderItem } from '@/lib/supabase'
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
type MessageLogsWriter = {
  upsert: (
    values: { slug: string; date: string; message_count: number },
    options: { onConflict: string }
  ) => Promise<{ error: { message: string } | null }>
}
type OrdersWriter = {
  insert: (values: {
    order_number: string
    slug: string
    items: OrderItem[]
    customer_name: string
    customer_phone: string
    customer_address: string
    subtotal: number
    delivery_charge: number
    total_amount: number
    special_notes: string | null
    status: string
  }) => Promise<{ error: { message: string } | null }>
}

function getErrorStatus(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null
  const maybeError = err as { status?: unknown; response?: { status?: unknown } }
  if (typeof maybeError.status === 'number') return maybeError.status
  if (typeof maybeError.response?.status === 'number') return maybeError.response.status
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
  conversationHistory: ConversationMessage[]
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
  })

  const trimmedHistory = conversationHistory.slice(-10)
  const geminiHistory = trimmedHistory.map(msg => ({
    role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
    parts: [{ text: msg.text }],
  }))

  const chat = model.startChat({ history: geminiHistory })
  const result = await Promise.race([
    chat.sendMessage(message.trim()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 15000)
    ),
  ])

  return result.response.text()
}

async function generateWithGroq(
  apiKey: string,
  systemInstruction: string,
  message: string,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  const strictSystemInstruction = [
    systemInstruction,
    '',
    'FALLBACK COMPLIANCE RULES:',
    '- Behave exactly like the primary model.',
    '- Follow all language and business constraints exactly.',
    '- Never add markdown wrappers around JSON.',
    '- If order is confirmed, output ORDER_CONFIRMED JSON exactly as instructed.',
  ].join('\n')

  const trimmedHistory = conversationHistory.slice(-10)
  const messages = [
    { role: 'system', content: strictSystemInstruction },
    ...trimmedHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: message.trim() },
  ]

  const response = await Promise.race([
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.05,
      }),
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GROQ_TIMEOUT')), 15000)
    ),
  ])

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}))
    const errMsg =
      errJson?.error?.message || `Groq request failed with status ${response.status}`
    throw new Error(errMsg)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Groq returned empty response')
  }
  // Remove accidental markdown fences some models may add.
  return content.replace(/```(?:json)?/gi, '').trim()
}

async function generateWithOpenRouter(
  apiKey: string,
  systemInstruction: string,
  message: string,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  const strictSystemInstruction = [
    systemInstruction,
    '',
    'FALLBACK COMPLIANCE RULES:',
    '- Behave exactly like the primary model.',
    '- Follow all language and business constraints exactly.',
    '- Never add markdown wrappers around JSON.',
    '- If order is confirmed, output ORDER_CONFIRMED JSON exactly as instructed.',
  ].join('\n')

  const trimmedHistory = conversationHistory.slice(-10)
  const messages = [
    { role: 'system', content: strictSystemInstruction },
    ...trimmedHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: message.trim() },
  ]

  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'

  const response = await Promise.race([
    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.05,
      }),
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OPENROUTER_TIMEOUT')), 15000)
    ),
  ])

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}))
    const errMsg =
      errJson?.error?.message ||
      `OpenRouter request failed with status ${response.status}`
    throw new Error(errMsg)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenRouter returned empty response')
  }
  return content.replace(/```(?:json)?/gi, '').trim()
}

function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number
) {
  return Response.json({ error: code, message }, { status })
}

function generateOrderNumber(): string {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`
}

function toSafeInt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  if (typeof value === 'string') {
    const digits = value.replace(/[^\d-]/g, '')
    const parsed = Number.parseInt(digits, 10)
    if (Number.isFinite(parsed)) return Math.max(0, parsed)
  }
  return 0
}

function normalizeOrderData(raw: unknown): OrderData {
  const source = (raw ?? {}) as Partial<OrderData> & {
    items?: Array<Partial<OrderItem> & { name?: unknown; quantity?: unknown; price?: unknown; size?: unknown }>
  }

  const normalizedItems: OrderItem[] = Array.isArray(source.items)
    ? source.items
        .map((item) => ({
          name: typeof item?.name === 'string' ? item.name.trim() : '',
          quantity: toSafeInt(item?.quantity),
          size: typeof item?.size === 'string' ? item.size.trim() : undefined,
          price: toSafeInt(item?.price),
        }))
        .filter((item) => item.name.length > 0 && item.quantity > 0)
    : []

  return {
    items: normalizedItems,
    customerName: typeof source.customerName === 'string' ? source.customerName.trim() : '',
    customerPhone: typeof source.customerPhone === 'string' ? source.customerPhone.trim() : '',
    customerAddress: typeof source.customerAddress === 'string' ? source.customerAddress.trim() : '',
    subtotal: toSafeInt(source.subtotal),
    deliveryCharge: toSafeInt(source.deliveryCharge),
    total: toSafeInt(source.total),
    notes: typeof source.notes === 'string' ? source.notes.trim() : undefined,
  }
}

function buildCustomerConfirmationWhatsAppUrl(
  order: OrderData & { orderNumber: string },
  businessName: string
): string | null {
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
    .replace(/[“”]/g, '"')
    .trim()
}

function buildSystemPrompt(b: Business): string {
  const whatsappLine = b.whatsapp
    ? `Yeh item hmare paas available nahi hai. WhatsApp pe contact karein custom orders ke liye: ${b.whatsapp}`
    : `Yeh item hmare paas available nahi hai. WhatsApp pe contact karein custom orders ke liye.`

  const lines = [
    `You are the AI customer support assistant for ${b.name}, a ${b.business_type} business.`,
    ``,
    `ABOUT THE BUSINESS:`,
    `Products and Prices: ${b.products ?? 'Not specified'}`,
    `Delivery: ${b.delivery_info ?? 'Not specified'}`,
    `Working Hours: ${b.working_hours ?? 'Not specified'}`,
    `Return Policy: ${b.return_policy ?? 'Not specified'}`,
    ``,
    `STRICT RULES — NEVER BREAK THESE:`,
    `1. You ONLY know what is written above in the business information. Nothing more, nothing less.`,
    `2. If a customer asks about a product, size, color, or service that is NOT listed above, say clearly: '${whatsappLine}'`,
    `3. NEVER invent prices, never guess delivery charges, never make up policies. If you don't have the information, say you don't have it and direct to WhatsApp.`,
    `4. NEVER say 'I think', 'probably', 'maybe', or 'I believe' about business facts. Only state what is confirmed in the business info above.`,
    `5. If a customer pushes you to guess ('just give me an approximate price'), still refuse to guess. Say the owner needs to confirm on WhatsApp.`,
    `6. Do not mention competitor shops or recommend other businesses.`,
    ``,
    `LANGUAGE RULES:`,
    `- If language setting is 'roman_urdu': Always reply in Roman Urdu (Urdu words spelled in English letters). Example style: 'Jee zaroor! Humara lawn suit 2500 mein milta hai. Delivery free hai Karachi mein. Koi aur sawaal?'`,
    `- If language setting is 'urdu': Reply in Urdu script only`,
    `- If language setting is 'english': Reply in English only`,
    `- If language setting is 'both': Detect the script/language the customer is using and reply in the same style. Roman Urdu gets Roman Urdu reply, English gets English reply, Urdu script gets Urdu script reply.`,
    `- Never mix scripts in a single reply — pick one and stay consistent`,
    `- Keep a friendly, conversational tone like a helpful shopkeeper`,
    ``,
    `Current language setting: ${b.language}`,
    ``,
    `ORDER TAKING RULES:`,
    `- If customer asks for available products/items/menu/catalog (e.g. "kya available hai?", "products dikhao", "what do you have?"), list the products from "Products and Prices" clearly line-by-line`,
    `- Keep that list complete and concise. Do not skip items that are present in business info`,
    `When a customer says they want to order (e.g. 'order karna hai', 'buy', 'lena hai', 'I want to order'):`,
    `- Acknowledge and ask what they want to order with quantity/size/details`,
    `- For clothing: ask size (S/M/L/XL or custom measurements)`,
    `- For food: ask quantity (how many plates / how many kg)`,
    `- For other: ask relevant details`,
    `- Once items are confirmed, ask: full name, phone number, complete delivery address`,
    `- Calculate total: item prices + delivery charge for their area`,
    `- Show a complete order summary and ask 'Confirm karna chahte hain? (yes/no)'`,
    `- On confirmation: respond with EXACTLY this JSON on its own line (no spaces before or after):`,
    `ORDER_CONFIRMED:{"items":[{"name":"...","quantity":1,"size":"...","price":0}],"customerName":"...","customerPhone":"...","customerAddress":"...","subtotal":0,"deliveryCharge":0,"total":0,"notes":"..."}`,
    `- Immediately after that line, add a friendly confirmation message`,
    ``,
    `If customer says 'cancel' or 'cancel karo' during ordering: stop the flow, confirm cancellation, return to normal chat`,
    ``,
    `STRICT RULES:`,
    `- Only answer questions about this business`,
    `- If asked anything unrelated, politely redirect to the business`,
    `- Keep replies short and clear`,
  ]

  if (b.whatsapp) {
    lines.push(`- If customer wants to contact directly, give them the WhatsApp number: ${b.whatsapp}`)
  }

  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  let message: string
  let slug: string
  let conversationHistory: ConversationMessage[] = []

  try {
    const body = await request.json()
    message = body?.message
    slug = body?.slug
    conversationHistory = Array.isArray(body?.conversationHistory)
      ? body.conversationHistory
      : []
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }

  // Basic input sanitization to reduce malformed/prompt-injection payloads.
  message = message.replace(/<[^>]*>/g, '').trim()

  if (message.length > 500) {
    return Response.json(
      { error: 'Message too long. Please keep it under 500 characters.' },
      { status: 400 }
    )
  }
  if (!slug || typeof slug !== 'string') {
    return Response.json({ error: 'slug is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Fetch business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single()

  if (bizError || !business) {
    return jsonError(
      'db_error',
      'Service temporarily unavailable. Please try again.',
      503
    )
  }
  const currentBusiness = business as Business

  const promptInjectionPattern =
    /ignore previous instructions|you are now|new system prompt|forget everything/i
  if (promptInjectionPattern.test(message)) {
    return Response.json({
      reply: `Main sirf ${currentBusiness.name} ke baare mein baat kar sakta hoon!`,
    })
  }

  // 2. Rate limit check
  const today = new Date().toISOString().split('T')[0]

  const { data: log } = await supabase
    .from('message_logs')
    .select('message_count')
    .eq('slug', slug)
    .eq('date', today)
    .maybeSingle()
  const messageLog = log as MessageLogRow | null

  const currentCount = messageLog?.message_count ?? 0

  if (currentCount >= DAILY_LIMIT) {
    return Response.json(
      { error: 'Daily limit reached. Please try again tomorrow.' },
      { status: 429 }
    )
  }

  // 3. Increment counter (non-fatal)
  const messageLogsWriter = supabase.from('message_logs') as unknown as MessageLogsWriter
  const { error: upsertError } = await messageLogsWriter.upsert(
    { slug, date: today, message_count: currentCount + 1 },
    { onConflict: 'slug,date' }
  )

  if (upsertError) {
    console.error('message_logs upsert error:', upsertError.message)
  }

  // 4. Call AI provider with Gemini -> OpenRouter -> Groq fallback.
  const geminiApiKey = process.env.GEMINI_API_KEY
  const openRouterApiKey = process.env.OPEN_ROUTER_API_KEY || process.env.OPENROUTER_API_KEY
  const groqApiKey = process.env.GROQ_API_KEY
  if (!geminiApiKey && !openRouterApiKey && !groqApiKey) {
    return Response.json({ error: 'AI service is not configured' }, { status: 500 })
  }

  try {
    const systemPrompt = buildSystemPrompt(currentBusiness)
    let providerInfo: ProviderInfo | null = null
    let rawReply = ''
    const openRouterModel =
      process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'
    const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

    const fallbackToOpenRouterOrGroq = async () => {
      if (openRouterApiKey) {
        try {
          rawReply = await generateWithOpenRouter(
            openRouterApiKey,
            systemPrompt,
            message,
            conversationHistory
          )
          providerInfo = {
            provider: 'openrouter',
            model: openRouterModel,
          }
          return
        } catch (openRouterErr) {
          if (!groqApiKey) throw openRouterErr
        }
      }

      if (groqApiKey) {
        rawReply = await generateWithGroq(
          groqApiKey,
          systemPrompt,
          message,
          conversationHistory
        )
        providerInfo = {
          provider: 'groq',
          model: groqModel,
        }
        return
      }
    }

    if (geminiApiKey) {
      try {
        rawReply = await generateWithGemini(
          geminiApiKey,
          systemPrompt,
          message,
          conversationHistory
        )
        providerInfo = { provider: 'gemini', model: 'gemini-2.5-flash' }
      } catch (geminiErr) {
        // Any Gemini failure (503/500/429/timeout/network) should fail over automatically.
        await fallbackToOpenRouterOrGroq()
        if (!providerInfo) throw geminiErr
      }
    } else if (openRouterApiKey) {
      try {
        rawReply = await generateWithOpenRouter(
          openRouterApiKey,
          systemPrompt,
          message,
          conversationHistory
        )
        providerInfo = {
          provider: 'openrouter',
          model: openRouterModel,
        }
      } catch (openRouterErr) {
        if (groqApiKey) {
          rawReply = await generateWithGroq(
            groqApiKey,
            systemPrompt,
            message,
            conversationHistory
          )
          providerInfo = {
            provider: 'groq',
            model: groqModel,
          }
        } else {
          throw openRouterErr
        }
      }
    } else if (groqApiKey) {
      rawReply = await generateWithGroq(
        groqApiKey,
        systemPrompt,
        message,
        conversationHistory
      )
      providerInfo = {
        provider: 'groq',
        model: groqModel,
      }
    }

    // 5. Detect ORDER_CONFIRMED
    const lines = rawReply.split('\n')
    const orderLine = lines.find(l => l.trim().startsWith('ORDER_CONFIRMED:'))

    if (orderLine) {
      const jsonStr = orderLine.trim().slice('ORDER_CONFIRMED:'.length)
      // Strip the JSON line — customer only sees the friendly message
      const cleanReply = normalizeBotReply(
        lines
        .filter(l => !l.trim().startsWith('ORDER_CONFIRMED:'))
        .join('\n')
        .trim()
      )

      try {
        const orderJson = normalizeOrderData(JSON.parse(jsonStr))
        const orderNumber = generateOrderNumber()

        // Save order to Supabase
        const ordersWriter = supabase.from('orders') as unknown as OrdersWriter
        const { error: orderError } = await ordersWriter.insert({
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

        if (orderError) {
          console.error('Order save error:', orderError)
        }

        const customerWhatsappUrl = buildCustomerConfirmationWhatsAppUrl(
          { ...orderJson, orderNumber },
          currentBusiness.name
        )

        return Response.json({
          reply: cleanReply,
          orderData: { ...orderJson, orderNumber },
          customerWhatsappUrl,
          providerInfo,
        })
      } catch (parseErr) {
        console.error('ORDER_CONFIRMED parse error:', parseErr)
        // JSON malformed — continue with friendly text only.
        return Response.json({ reply: cleanReply || normalizeBotReply(rawReply) })
      }
    }

    return Response.json({ reply: normalizeBotReply(rawReply), providerInfo })
  } catch (err) {
    if (
      isTimeoutError(err) ||
      (err instanceof Error &&
        (err.message === 'GROQ_TIMEOUT' || err.message === 'OPENROUTER_TIMEOUT'))
    ) {
      return jsonError(
        'timeout',
        'Reply mein der ho rahi hai. Dobara try karein!',
        504
      )
    }

    const status = getErrorStatus(err)
    const msg = getErrorMessage(err)
    console.error('Gemini error:', msg)

    if (status === 429 || /429|rate limit|quota|resource_exhausted/i.test(msg)) {
      return jsonError(
        'rate_limit',
        'Thoda wait karein, abhi busy hain. 1 minute mein dobara try karein!',
        429
      )
    }

    if ((status !== null && status >= 500) || status === null) {
      return jsonError(
        'ai_error',
        'Kuch masla aa gaya. Dobara try karein ya WhatsApp pe contact karein.',
        500
      )
    }

    return jsonError(
      'ai_error',
      'Kuch masla aa gaya. Dobara try karein ya WhatsApp pe contact karein.',
      500
    )
  }
}
