'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import BrandLogo from '@/app/components/BrandLogo'

type OrderItem = {
  name: string
  quantity: number
  size?: string
  price: number
}

type OrderConfirmedData = {
  orderNumber: string
  items: OrderItem[]
  customerName: string
  customerPhone: string
  customerAddress: string
  subtotal: number
  deliveryCharge: number
  total: number
  notes?: string
  customerWhatsappUrl?: string
}

type Message = {
  id: string
  role: 'user' | 'bot' | 'order'
  text: string
  orderData?: OrderConfirmedData
  isError?: boolean
}

type HistoryEntry = { role: 'user' | 'bot'; text: string }

function readStoredHistory(storageKey: string, legacyStorageKey: string): HistoryEntry[] {
  if (typeof window === 'undefined') return []

  const savedHistory = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey)
  if (!savedHistory) return []

  try {
    const parsed = JSON.parse(savedHistory)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (entry: unknown): entry is HistoryEntry =>
          typeof entry === 'object' &&
          entry !== null &&
          'role' in entry &&
          'text' in entry &&
          ((entry as { role: string }).role === 'user' || (entry as { role: string }).role === 'bot') &&
          typeof (entry as { text: unknown }).text === 'string'
      )
      .slice(-30)
  } catch {
    return []
  }
}

function OrderConfirmedCard({ order }: { order: OrderConfirmedData }) {
  return (
    <div className="flex flex-row items-start gap-2 mt-1">
      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs shrink-0">
        🤖
      </div>
      <div className="max-w-[75%] sm:max-w-[60%] rounded-2xl rounded-bl-none overflow-hidden shadow-sm border border-green-200">
        {/* Header */}
        <div className="bg-green-600 px-4 py-3">
          <p className="text-white font-bold text-sm">✅ Order Confirmed!</p>
          <p className="text-green-100 text-xs mt-0.5">#{order.orderNumber}</p>
        </div>

        {/* Body */}
        <div className="bg-green-50 px-4 py-3 space-y-3">
          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1.5">Items</p>
            <div className="space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-baseline gap-2">
                  <span className="text-xs text-gray-700">
                    {item.name} x{item.quantity}
                    {item.size ? <span className="text-gray-400"> ({item.size})</span> : null}
                  </span>
                  <span className="text-xs font-medium text-gray-800 shrink-0">Rs {item.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-green-200" />

          {/* Customer */}
          <div>
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1.5">Customer</p>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-700">{order.customerName}</p>
              <p className="text-xs text-gray-700">{order.customerPhone}</p>
              <p className="text-xs text-gray-700">{order.customerAddress}</p>
            </div>
          </div>

          <div className="border-t border-green-200" />

          {/* Bill */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Subtotal</span><span>Rs {order.subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Delivery</span><span>Rs {order.deliveryCharge}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-900 pt-1 border-t border-green-200">
              <span>Total</span><span>Rs {order.total}</span>
            </div>
          </div>

          {/* WhatsApp note */}
          <div className="bg-white rounded-lg px-3 py-2.5 border border-green-200 space-y-2">
            <p className="text-xs text-green-800 font-medium flex items-center gap-1.5">
              <span>📲</span> Order notification has been sent on WhatsApp.
            </p>
            {order.customerWhatsappUrl && (
              <a
                href={order.customerWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-[#128C7E] hover:bg-[#0f7469] text-white text-xs font-semibold transition-colors"
              >
                Send confirmation to me
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatInterface({
  businessName,
  slug,
  isAdmin,
  adminToken,
}: {
  businessName: string
  slug: string
  isAdmin: boolean
  adminToken: string
}) {
  const welcomeText = `Salam! 👋 I'm the AI assistant for ${businessName}. Ask me anything about our products, prices, delivery, or policies!`
  const storageKey = `aibotbanao_chat_${slug}`
  const legacyStorageKey = `botbanao_chat_${slug}`

  const [conversationHistory, setConversationHistory] = useState<HistoryEntry[]>([])
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', text: welcomeText },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [storedAdminToken, setStoredAdminToken] = useState(adminToken)
  const [showBanner, setShowBanner] = useState(Boolean(isAdmin && adminToken))
  const [copied, setCopied] = useState(false)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const adminKey = `aibotbanao-admin-${slug}`
  const legacyAdminKey = `botbanao-admin-${slug}`
  const admin = Boolean(isAdmin || storedAdminToken)

  useEffect(() => {
    const validHistory = readStoredHistory(storageKey, legacyStorageKey)
    Promise.resolve().then(() => {
      if (validHistory.length > 0) {
        // Migrate legacy key history to the new branding key.
        localStorage.setItem(storageKey, JSON.stringify(validHistory))
        localStorage.removeItem(legacyStorageKey)
        setConversationHistory(validHistory)
        setMessages([
          { id: 'welcome', role: 'bot', text: welcomeText },
          ...validHistory.map((entry, index) => ({
            id: `h-${index}-${Date.now()}`,
            role: entry.role,
            text: entry.text,
          })),
        ])
      }

      const storedFromLocal =
        localStorage.getItem(adminKey) ?? localStorage.getItem(legacyAdminKey) ?? ''
      const tokenToUse = storedAdminToken || storedFromLocal
      if (tokenToUse) {
        localStorage.setItem(adminKey, tokenToUse)
        setStoredAdminToken(tokenToUse)
        setShowBanner(true)
      }
      localStorage.removeItem(legacyAdminKey)
    })
  }, [adminKey, legacyAdminKey, legacyStorageKey, storageKey, storedAdminToken, welcomeText])

  useEffect(() => {
    const historyToSave = conversationHistory.slice(-30)
    localStorage.setItem(storageKey, JSON.stringify(historyToSave))
  }, [conversationHistory, storageKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const pageUrl = isHydrated ? window.location.href : ''
  const shareUrl = pageUrl ? pageUrl.split('?')[0] : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const settingsHref = storedAdminToken
    ? `/chat/${slug}/settings?admin=${storedAdminToken}`
    : `/chat/${slug}/settings`

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    // Snapshot history before any state mutations
    const historySnapshot = [...conversationHistory]

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text }])
    setConversationHistory(prev => [...prev, { role: 'user' as const, text }].slice(-30))
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, slug, conversationHistory: historySnapshot }),
      })
      const data = await res.json().catch(() => ({}))

      const replyText = res.ok
        ? data.reply
        : (typeof data.message === 'string' && data.message.trim()
            ? data.message
            : 'Kuch masla aa gaya. Dobara try karein.')
      const isErrorReply = !res.ok

      setMessages(prev => [
        ...prev,
        { id: `b-${Date.now()}`, role: 'bot', text: replyText, isError: isErrorReply },
      ])
      if (!isErrorReply) {
        setConversationHistory(prev => [...prev, { role: 'bot' as const, text: replyText }].slice(-30))
      }

      // Append Order Confirmed card when orderData is present
      if (res.ok && data.orderData) {
        setMessages(prev => [
          ...prev,
          {
            id: `order-${Date.now()}`,
            role: 'order',
            text: '',
            orderData: data.orderData as OrderConfirmedData,
          },
        ])
        if (data.customerWhatsappUrl) {
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (!last || last.role !== 'order' || !last.orderData) return prev
            const next = [...prev]
            next[next.length - 1] = {
              ...last,
              orderData: {
                ...last.orderData,
                customerWhatsappUrl: data.customerWhatsappUrl,
              },
            }
            return next
          })
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: 'Connection error. Please check your internet and try again.',
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const waShareText = encodeURIComponent(
    `Chat with us instantly! Ask about our products and prices: ${shareUrl}`
  )

  const clearChat = () => {
    const confirmed = window.confirm('Chat history clear karein?')
    if (!confirmed) return

    localStorage.removeItem(storageKey)
    setConversationHistory([])
    setMessages([{ id: 'welcome', role: 'bot', text: welcomeText }])
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm z-10">
        <BrandLogo textClassName="text-sm" className="shrink-0" />
        <div className="w-px h-4 bg-gray-200 shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h1 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{businessName}</h1>
          <span className="hidden sm:inline shrink-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
            AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={clearChat}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear chat
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
          {admin && (
            <Link
              href={settingsHref}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors flex items-center gap-1"
              title="Bot settings"
            >
              ⚙️ Settings
            </Link>
          )}
        </div>
      </header>

      {/* ── Share banner (admin only) ── */}
      {admin && showBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 sm:px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="flex-1 text-xs sm:text-sm font-semibold text-amber-800">
              🎉 Your bot is live! Share this link with customers:
            </p>
            <button
              onClick={() => setShowBanner(false)}
              className="shrink-0 text-amber-500 hover:text-amber-900 p-1 transition-colors"
              aria-label="Dismiss banner"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-white border border-amber-200 rounded-lg px-3 py-1.5 overflow-hidden">
              <span className="block truncate font-mono text-xs text-gray-600">{shareUrl}</span>
            </div>
            <button
              onClick={handleCopy}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copied ? 'bg-green-600 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
            <a
              href={`https://wa.me/?text=${waShareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#1ebe59] text-white transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
        {messages.map((msg) => {
          // Order confirmed card
          if (msg.role === 'order' && msg.orderData) {
            return <OrderConfirmedCard key={msg.id} order={msg.orderData} />
          }

          // Regular user / bot bubble
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  msg.role === 'bot'
                    ? msg.isError
                      ? 'bg-orange-100'
                      : 'bg-green-100'
                    : 'bg-gray-200'
                }`}
              >
                {msg.role === 'bot' ? '🤖' : '👤'}
              </div>
              <div
                className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-none'
                    : msg.isError
                    ? 'bg-orange-50 text-orange-900 rounded-bl-none border border-orange-200'
                    : 'bg-white text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-xs shrink-0">🤖</div>
            <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-gray-100 px-3 sm:px-4 pt-2 pb-3 shrink-0">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={loading ? 'Waiting for reply…' : 'Type your message…'}
            autoComplete="off"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition disabled:opacity-60"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="w-10 h-10 bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-1.5">
          Powered by AI —{' '}
          <Link href="/" className="text-green-400 hover:text-green-500 hover:underline font-medium transition-colors">
            AIBotBanao.com
          </Link>
        </p>
      </div>
    </div>
  )
}
