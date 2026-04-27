'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import BrandLogo from '@/app/components/BrandLogo'

const SLUG_KEY = 'aibotbanao-slug'
const LEGACY_SLUG_KEY = 'botbanao-slug'
const STORAGE_VERSION_KEY = 'aibotbanao-storage-version'
const CURRENT_STORAGE_VERSION = 'production-v1'

type FormData = {
  name: string
  business_type: string
  products: string
  delivery_info: string
  working_hours: string
  return_policy: string
  language: 'urdu' | 'english' | 'both' | 'roman_urdu'
  whatsapp: string
  website: string
}

type SuccessData = { slug: string; adminToken: string; ownerWhatsappUrl: string | null }

const BUSINESS_TYPES = [
  'Clothing',
  'Food/Restaurant',
  'Salon/Beauty',
  'Mobile Repair',
  'Tutoring',
  'Pharmacy',
  'General Store',
  'Other',
]

const STEPS = [
  { title: 'Your Business', subtitle: 'Start with the basics', icon: '🏪', hint: 'Step 1 of 3 · Just 5 minutes' },
  { title: 'Products & Services', subtitle: 'What do you offer?', icon: '📦', hint: 'Step 2 of 3 · Almost there' },
  { title: 'Final Touches', subtitle: "You're almost done!", icon: '✨', hint: 'Step 3 of 3 · Last step' },
]

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'
const hintCls = 'text-xs text-gray-400 mb-2'

function getBusinessNameValidationError(name: string): string | null {
  const cleaned = name.trim().replace(/\s+/g, ' ')
  if (!cleaned) return 'Business name is required.'

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

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        copied ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  )
}

function SuccessScreen({ success, origin }: { success: SuccessData; origin: string }) {
  const customerUrl = `${origin}/chat/${success.slug}`
  const adminUrl = `${origin}/chat/${success.slug}?admin=${success.adminToken}`
  const waText = encodeURIComponent(`Chat with us instantly! Ask about our products and prices: ${customerUrl}`)

  useEffect(() => {
    if (!success.ownerWhatsappUrl) return
    window.open(success.ownerWhatsappUrl, '_blank', 'noopener,noreferrer')
  }, [success.ownerWhatsappUrl])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 shrink-0">
        <div className="w-full px-4 sm:px-6 py-4 flex items-center">
          <BrandLogo />
        </div>
      </nav>

      <main className="flex-1 w-full px-4 sm:px-6 py-10 max-w-lg mx-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your bot is ready!</h1>
          <p className="text-gray-500 text-sm">Share the customer link with your customers to start chatting.</p>
        </div>

        <div className="space-y-4">
          {/* Customer link */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔗</span>
              <h2 className="text-sm font-semibold text-gray-900">Customer Link</h2>
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium ml-auto">
                Share this
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 overflow-hidden">
                <span className="block truncate font-mono text-xs text-gray-600">{customerUrl}</span>
              </div>
              <CopyButton text={customerUrl} label="Copy" />
            </div>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe59] text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share on WhatsApp
            </a>
          </div>

          {/* Admin link */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🔐</span>
              <h2 className="text-sm font-semibold text-amber-900">Your Admin Link</h2>
            </div>
            <p className="text-xs text-amber-700 mb-3 font-medium">
              Save this link! You need it to access your bot&apos;s settings and view orders.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-white border border-amber-200 rounded-lg px-3 py-2 overflow-hidden">
                <span className="block truncate font-mono text-xs text-gray-600">{adminUrl}</span>
              </div>
              <CopyButton text={adminUrl} label="Copy" />
            </div>
            <p className="text-xs text-amber-700 mt-3">
              Login authentication and personalized admin dashboard experience coming soon.
            </p>
          </div>

          {/* Open bot button */}
          <a
            href={adminUrl}
            className="block w-full text-center py-4 rounded-2xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-base font-bold transition-all shadow-sm"
          >
            Open My Bot →
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          You can update settings anytime via your admin link ·{' '}
          <Link href="/" className="text-green-500 hover:underline">AIBotBanao.com</Link>
        </p>
      </main>
    </div>
  )
}

export default function SetupPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissedExistingBot, setDismissedExistingBot] = useState(false)
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const existingSlug = useSyncExternalStore(
    () => () => {},
    () => localStorage.getItem(SLUG_KEY) ?? localStorage.getItem(LEGACY_SLUG_KEY),
    () => null
  )
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const [form, setForm] = useState<FormData>({
    name: '',
    business_type: 'Clothing',
    products: '',
    delivery_info: '',
    working_hours: '',
    return_policy: '',
    language: 'both',
    whatsapp: '',
    website: '',
  })

  useEffect(() => {
    if (existingSlug) localStorage.setItem(SLUG_KEY, existingSlug)
    localStorage.removeItem(LEGACY_SLUG_KEY)
  }, [existingSlug])

  useEffect(() => {
    const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY)
    if (currentVersion === CURRENT_STORAGE_VERSION) return

    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i)
      if (!key) continue
      if (
        key === SLUG_KEY ||
        key === LEGACY_SLUG_KEY ||
        key.startsWith('aibotbanao_chat_') ||
        key.startsWith('botbanao_chat_') ||
        key.startsWith('aibotbanao-admin-') ||
        key.startsWith('botbanao-admin-')
      ) {
        localStorage.removeItem(key)
      }
    }

    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION)
  }, [])

  const update =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const isGeneralStore = form.business_type === 'General Store'
  const productsPlaceholder = isGeneralStore
    ? 'Aata (per kg) - Rs 170\nChawal (per kg) - Rs 320\nCheeni (per kg) - Rs 155\nDaal Chana (per kg) - Rs 280\nCooking Oil (1L) - Rs 540'
    : 'Lawn suit - Rs 2500\nKurti - Rs 1200\nPajama - Rs 800'
  const deliveryPlaceholder = isGeneralStore
    ? 'Gulshan-e-Iqbal - Rs 80 (same day)\nJohar / PECHS - Rs 150 (same day)\nDHA / Clifton - Rs 250\nFree delivery on orders above Rs 3000'
    : 'Karachi - Free\nLahore - Rs 200\nAll Pakistan - Rs 150-300'
  const returnPolicyPlaceholder = isGeneralStore
    ? 'Sealed grocery items can be exchanged within 24 hours with bill. Opened/perishable items are not returnable.'
    : 'Exchange within 3 days with receipt'
  const businessNameError = getBusinessNameValidationError(form.name)

  const canAdvance =
    step === 0
      ? !businessNameError
      : step === 1
      ? form.products.trim().length > 0 &&
        form.delivery_info.trim().length > 0 &&
        form.return_policy.trim().length > 0
      : true

  const handleSubmit = async () => {
    const nameError = getBusinessNameValidationError(form.name)
    if (nameError) {
      setError(nameError)
      setStep(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          business_type: form.business_type,
          products: form.products,
          delivery_info: form.delivery_info,
          working_hours: form.working_hours,
          return_policy: form.return_policy,
          language: form.language,
          whatsapp: form.whatsapp,
          website: form.website,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 429) {
          setError('Aaj 3 bots already ban chuke hain. Kal dobara aayein!')
          return
        }
        throw new Error(
          typeof data.error === 'string' && data.error
            ? data.error
            : 'Something went wrong. Please try again.'
        )
      }

      const slug = typeof data.slug === 'string' ? data.slug : ''
      const adminToken = typeof data.adminToken === 'string' ? data.adminToken : ''
      const ownerWhatsappUrl =
        typeof data.ownerWhatsappUrl === 'string' ? data.ownerWhatsappUrl : null
      if (!slug || !adminToken) {
        throw new Error('Invalid setup response. Please try again.')
      }

      localStorage.setItem(SLUG_KEY, slug)
      setSuccess({ slug, adminToken, ownerWhatsappUrl })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const advance = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else handleSubmit()
  }

  // ── Success screen ──
  if (success) {
    return <SuccessScreen success={success} origin={origin} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shrink-0">
        <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {STEPS[step].hint}
          </span>
        </div>
      </nav>

      <main className="flex-1 w-full px-4 sm:px-6 py-10 max-w-4xl mx-auto">
        {/* Page heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Set up your free bot</h1>
          <p className="text-gray-500 mt-2 text-sm">No technical skills needed · Takes 5 minutes</p>
        </div>

        {/* Existing bot banner */}
        {hydrated && existingSlug && !dismissedExistingBot && (
          <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3 text-sm">
            <span className="text-blue-500 shrink-0 mt-0.5">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-blue-800 font-semibold mb-0.5">You already have a bot!</p>
              <p className="text-blue-600 text-xs">
                Your previous bot is still live.{' '}
                <Link href={`/chat/${existingSlug}`} className="underline font-medium hover:text-blue-800">
                  View your existing bot →
                </Link>
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(SLUG_KEY)
                setDismissedExistingBot(true)
              }}
              className="shrink-0 text-blue-400 hover:text-blue-700 transition-colors p-0.5"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Step indicator */}
        <div className="w-full mb-10">
          <div className="flex items-start w-full">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      i < step
                        ? 'bg-green-600 text-white cursor-pointer'
                        : i === step
                        ? 'bg-green-600 text-white ring-4 ring-green-100'
                        : 'bg-gray-200 text-gray-400 cursor-default'
                    }`}
                  >
                    {i < step ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </button>
                  <span className={`text-xs font-medium text-center max-w-[96px] ${i <= step ? 'text-green-700' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-10 sm:w-16 mt-4 mx-1 transition-all ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {/* Card header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-50">
            <span className="text-3xl">{STEPS[step].icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{STEPS[step].title}</h2>
              <p className="text-sm text-gray-400">{STEPS[step].subtitle}</p>
            </div>
          </div>

          {/* ── Step 0: Business basics ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Business name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="e.g. Ahmed's Clothing Store"
                  autoFocus
                  className={inputCls}
                  onKeyDown={(e) => e.key === 'Enter' && canAdvance && advance()}
                />
                {businessNameError && (
                  <p className="text-xs text-red-500 mt-1.5">{businessNameError}</p>
                )}
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={update('website')}
                  autoComplete="off"
                  tabIndex={-1}
                  className="hidden"
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <label className={labelCls}>Business type</label>
                <div className="relative">
                  <select
                    value={form.business_type}
                    onChange={update('business_type')}
                    className={`${inputCls} appearance-none pr-10 bg-white cursor-pointer`}
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
          )}

          {/* ── Step 1: Products & Services ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Products and prices <span className="text-red-400">*</span></label>
                <p className={hintCls}>List what you sell with prices — one item per line.</p>
                <textarea
                  value={form.products}
                  onChange={update('products')}
                  rows={5}
                  placeholder={productsPlaceholder}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Delivery areas and charges <span className="text-red-400">*</span></label>
                <p className={hintCls}>Where do you deliver and what does it cost?</p>
                <textarea
                  value={form.delivery_info}
                  onChange={update('delivery_info')}
                  rows={4}
                  placeholder={deliveryPlaceholder}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Return / exchange policy <span className="text-red-400">*</span></label>
                <textarea
                  value={form.return_policy}
                  onChange={update('return_policy')}
                  rows={3}
                  placeholder={returnPolicyPlaceholder}
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
          )}

          {/* ── Step 2: Final settings ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Language preference</label>
                <p className={hintCls}>Which language should your bot reply in?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'roman_urdu', label: 'Roman Urdu', sub: 'رومن اردو', desc: 'Aap ki tarah likhein', example: '"Jee! Suit 2500 mein milta hai."' },
                      { value: 'urdu',       label: 'اردو',        sub: 'Urdu Script', desc: 'اردو میں جواب',      example: '"جی! سوٹ ۲۵۰۰ میں ملتا ہے۔"' },
                      { value: 'english',    label: 'English',     sub: 'English only', desc: 'Reply in English',  example: '"Yes! The suit is Rs 2500."' },
                      { value: 'both',       label: 'Auto',        sub: 'Automatic',    desc: 'Customer ki zaban mein', example: '"Recommended ✓"' },
                    ] as const
                  ).map(({ value, label, sub, desc, example }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, language: value }))}
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
                <p className={hintCls}>Shared with customers who want to talk to a human.</p>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={update('whatsapp')}
                  placeholder="+92 300 1234567"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2 items-start">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span><span className="font-semibold">Oops! </span>{error}</span>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={loading}
                className="flex-none px-5 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={advance}
              disabled={!canAdvance || loading}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating your bot…</span>
                </>
              ) : step < STEPS.length - 1 ? (
                'Next →'
              ) : (
                'Create My Free Bot 🎉'
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          You can update everything later · 100% free · No account needed
        </p>
      </main>
    </div>
  )
}
