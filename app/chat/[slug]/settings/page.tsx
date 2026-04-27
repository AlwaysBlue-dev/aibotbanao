'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/lib/supabase'

type Language = 'roman_urdu' | 'urdu' | 'english' | 'both'

type FormData = {
  name: string
  business_type: string
  products: string
  delivery_info: string
  working_hours: string
  return_policy: string
  language: Language
  whatsapp: string
}
type BusinessesUpdater = {
  update: (values: {
    name: string
    business_type: string
    products: string | null
    delivery_info: string | null
    working_hours: string | null
    return_policy: string | null
    language: Language
    whatsapp: string | null
  }) => {
    eq: (column: 'slug', value: string) => Promise<{ error: { message: string } | null }>
  }
}

const BUSINESS_TYPES = [
  'Clothing', 'Food/Restaurant', 'Salon/Beauty', 'Mobile Repair',
  'Tutoring', 'Pharmacy', 'General Store', 'Other',
]

const LANGUAGE_OPTIONS: {
  value: Language; label: string; sub: string; desc: string; example: string
}[] = [
  { value: 'roman_urdu', label: 'Roman Urdu', sub: 'رومن اردو', desc: 'Aap ki tarah likhein', example: '"Jee! Suit 2500 mein milta hai."' },
  { value: 'urdu',       label: 'اردو',        sub: 'Urdu Script', desc: 'اردو میں جواب',      example: '"جی! سوٹ ۲۵۰۰ میں ملتا ہے۔"' },
  { value: 'english',    label: 'English',     sub: 'English only', desc: 'Reply in English',  example: '"Yes! The suit is Rs 2500."' },
  { value: 'both',       label: 'Auto',        sub: 'Automatic',    desc: 'Customer ki zaban mein', example: '"Recommended ✓"' },
]

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'
const hintCls = 'text-xs text-gray-400 mb-2'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function SettingsPage() {
  const { slug } = useParams() as { slug: string }
  const router = useRouter()

  const [form, setForm] = useState<FormData | null>(null)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<'customer' | 'admin' | null>(null)

  // Orders
  const [orderCount, setOrderCount] = useState<number>(0)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [resolvedAdminToken, setResolvedAdminToken] = useState('')

  useEffect(() => {
    const key = `aibotbanao-admin-${slug}`
    const legacyKey = `botbanao-admin-${slug}`
    const stored = localStorage.getItem(key) ?? localStorage.getItem(legacyKey)
    const urlParams = new URLSearchParams(window.location.search)
    const urlAdmin = urlParams.get('admin')

    // Accept token from URL if not in localStorage
    if (!stored && !urlAdmin) {
      router.replace(`/chat/${slug}`)
      return
    }
    if (!stored && urlAdmin) {
      localStorage.setItem(key, urlAdmin)
    }
    if (stored) {
      localStorage.setItem(key, stored)
      localStorage.removeItem(legacyKey)
    }
    Promise.resolve().then(() => setResolvedAdminToken(stored || urlAdmin || ''))

    supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        const businessData = data as {
          name: string
          business_type: string
          products: string | null
          delivery_info: string | null
          working_hours: string | null
          return_policy: string | null
          language: Language | null
          whatsapp: string | null
        } | null
        if (error || !businessData) {
          router.replace(`/chat/${slug}`)
          return
        }
        setForm({
          name: businessData.name,
          business_type: businessData.business_type,
          products: businessData.products ?? '',
          delivery_info: businessData.delivery_info ?? '',
          working_hours: businessData.working_hours ?? '',
          return_policy: businessData.return_policy ?? '',
          language: businessData.language || 'both',
          whatsapp: businessData.whatsapp ?? '',
        })
        setReady(true)
      })

    const tokenForOrders = stored || urlAdmin
    if (!tokenForOrders) {
      Promise.resolve().then(() => setOrdersLoading(false))
      return
    }

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, adminToken: tokenForOrders, page: ordersPage, pageSize: 10 }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch orders')
        return (await res.json()) as {
          total?: number
          totalPages?: number
          recentOrders?: Order[]
        }
      })
      .then((payload) => {
        setOrderCount(typeof payload.total === 'number' ? payload.total : 0)
        setOrdersTotalPages(
          typeof payload.totalPages === 'number' && payload.totalPages > 0
            ? payload.totalPages
            : 1
        )
        setRecentOrders(Array.isArray(payload.recentOrders) ? payload.recentOrders : [])
      })
      .catch(() => {
        setOrderCount(0)
        setOrdersTotalPages(1)
        setRecentOrders([])
      })
      .finally(() => {
        setOrdersLoading(false)
      })
  }, [ordersPage, router, slug])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const update =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => (prev ? { ...prev, [field]: e.target.value } : prev))

  const customerLink =
    typeof window !== 'undefined' ? `${window.location.origin}/chat/${slug}` : `/chat/${slug}`
  const adminLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/chat/${slug}/settings?admin=${encodeURIComponent(resolvedAdminToken)}`
      : `/chat/${slug}/settings`

  const handleCopyLink = async (type: 'customer' | 'admin') => {
    const text = type === 'customer' ? customerLink : adminLink
    await navigator.clipboard.writeText(text)
    setCopiedLink(type)
    setTimeout(() => setCopiedLink(null), 1800)
  }

  const handleSave = async () => {
    if (!form || !form.name.trim()) return
    setSaving(true)
    setSaveError(null)

    const businessesUpdater = supabase.from('businesses') as unknown as BusinessesUpdater
    const { error } = await businessesUpdater
      .update({
        name: form.name.trim(),
        business_type: form.business_type,
        products: form.products || null,
        delivery_info: form.delivery_info || null,
        working_hours: form.working_hours || null,
        return_policy: form.return_policy || null,
        language: form.language,
        whatsapp: form.whatsapp || null,
      })
      .eq('slug', slug)

    setSaving(false)

    if (error) {
      setSaveError(error.message)
    } else {
      showToast('Settings updated!')
      router.push(`/chat/${slug}`)
    }
  }

  if (!ready || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            href={`/chat/${slug}`}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1 rounded-lg"
            aria-label="Back to chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 leading-tight">Bot Settings</h1>
            <p className="text-xs text-gray-400 truncate">{slug}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5 pb-16">
        {/* ── Quick Links ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">🔗 Quick Links</h2>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Customer Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 overflow-hidden">
                <span className="block truncate font-mono text-xs text-gray-700">{customerLink}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyLink('customer')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  copiedLink === 'customer'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {copiedLink === 'customer' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Admin Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 overflow-hidden">
                <span className="block truncate font-mono text-xs text-amber-900">{adminLink}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyLink('admin')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  copiedLink === 'admin'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {copiedLink === 'admin' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-amber-700">Keep admin link private.</p>
          </div>
        </div>

        {/* ── Orders Summary ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              📦 Orders
            </h2>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-semibold">
              {ordersLoading ? '…' : `${orderCount} total`}
            </span>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No orders yet — share your bot link to start receiving orders.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-800">{order.order_number}</span>
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                        New
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {order.customer_name ?? 'Unknown'} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">
                    Rs {order.total_amount ?? '—'}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!ordersLoading && recentOrders.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                disabled={ordersPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {ordersPage} of {ordersTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                disabled={ordersPage >= ordersTotalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* ── Basic Info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">🏪 Basic Info</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Business name <span className="text-red-400">*</span></label>
              <input type="text" value={form.name} onChange={update('name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Business type</label>
              <div className="relative">
                <select
                  value={form.business_type}
                  onChange={update('business_type')}
                  className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                >
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Products & Services ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">📦 Products &amp; Services</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Products and prices</label>
              <p className={hintCls}>One item per line — e.g. Lawn suit - Rs 2500</p>
              <textarea
                value={form.products}
                onChange={update('products')}
                rows={5}
                placeholder={'Lawn suit - Rs 2500\nKurti - Rs 1200\nPajama - Rs 800'}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className={labelCls}>Delivery areas and charges</label>
              <textarea
                value={form.delivery_info}
                onChange={update('delivery_info')}
                rows={3}
                placeholder={'Karachi - Free\nLahore - Rs 200\nAll Pakistan - Rs 150–300'}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className={labelCls}>Working hours</label>
              <input
                type="text"
                value={form.working_hours}
                onChange={update('working_hours')}
                placeholder="Mon-Sat 10am-8pm"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ── Policies & Preferences ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">📋 Policies &amp; Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Return / exchange policy</label>
              <textarea
                value={form.return_policy}
                onChange={update('return_policy')}
                rows={3}
                placeholder="Exchange within 3 days with receipt"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className={labelCls}>Language preference</label>
              <p className={hintCls}>Which language should your bot reply in?</p>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGE_OPTIONS.map(({ value, label, sub, desc, example }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((prev) => (prev ? { ...prev, language: value } : prev))}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-start gap-1 text-left ${
                      form.language === value
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="font-semibold">{label}</span>
                      <span className={`text-xs ${form.language === value ? 'text-green-200' : 'text-gray-400'}`}>· {sub}</span>
                    </div>
                    <span className={`text-xs ${form.language === value ? 'text-green-100' : 'text-gray-500'}`}>{desc}</span>
                    <span className={`text-xs italic truncate w-full ${form.language === value ? 'text-green-200' : 'text-gray-400'}`}>{example}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>
                WhatsApp number <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <p className={hintCls}>Shared with customers who want to order directly.</p>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={update('whatsapp')}
                placeholder="+92 300 1234567"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {saveError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2 items-start">
            <span className="shrink-0">⚠️</span>
            <span><span className="font-semibold">Save failed. </span>{saveError}</span>
          </div>
        )}

        {/* ── Save button ── */}
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Save Settings'
          )}
        </button>

      </main>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-xl pointer-events-none">
          ✓ {toast}
        </div>
      )}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Order {selectedOrder.order_number}</h3>
                <p className="text-xs text-gray-500">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
                aria-label="Close order details"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Customer</p>
              <p className="text-sm text-gray-800">{selectedOrder.customer_name ?? 'Unknown'}</p>
              <p className="text-sm text-gray-600">{selectedOrder.customer_phone ?? 'No phone'}</p>
              <p className="text-sm text-gray-600">{selectedOrder.customer_address ?? 'No address'}</p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Items</p>
              {(selectedOrder.items ?? []).map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-gray-700">
                    {item.name} x{item.quantity}
                    {item.size ? <span className="text-gray-400"> ({item.size})</span> : null}
                  </span>
                  <span className="text-sm font-medium text-gray-900">Rs {item.price}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>Rs {selectedOrder.subtotal ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery</span>
                <span>Rs {selectedOrder.delivery_charge ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span>Rs {selectedOrder.total_amount ?? 0}</span>
              </div>
            </div>
            {selectedOrder.special_notes && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-amber-900">{selectedOrder.special_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
