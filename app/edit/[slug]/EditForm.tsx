'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/lib/supabase'

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

type FormData = {
  name: string
  business_type: string
  products: string
  delivery_info: string
  working_hours: string
  return_policy: string
  language: string
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
    language: string
    whatsapp: string | null
  }) => {
    eq: (column: 'slug', value: string) => Promise<{ error: { message: string } | null }>
  }
}


const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'
const hintCls = 'text-xs text-gray-400 mb-2'

type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function EditForm({ business }: { business: Business }) {
  const [form, setForm] = useState<FormData>({
    name: business.name,
    business_type: business.business_type,
    products: business.products ?? '',
    delivery_info: business.delivery_info ?? '',
    working_hours: business.working_hours ?? '',
    return_policy: business.return_policy ?? '',
    language: business.language,
    whatsapp: business.whatsapp ?? '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update =
    (field: keyof FormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setStatus('saving')
    setErrorMsg('')

    try {
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
        .eq('slug', business.slug)

      if (error) throw new Error(error.message)

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
      setStatus('error')
    }
  }

  const chatUrl = `/chat/${business.slug}`
  const isSaving = status === 'saving'

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {status === 'saved' && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3 text-sm text-green-800">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>
            <span className="font-semibold">Changes saved!</span> Your bot is updated instantly.
          </span>
        </div>
      )}

      {/* ── Section: Basic Info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🏪</span> Basic Info
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>
              Business name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              className={inputCls}
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
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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

      {/* ── Section: Products & Services ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📦</span> Products &amp; Services
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Products and prices</label>
            <p className={hintCls}>One item per line.</p>
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
              rows={4}
              placeholder={'Karachi - Free\nLahore - Rs 200\nAll Pakistan - Rs 150-300'}
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

      {/* ── Section: Policies & Preferences ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚙️</span> Policies &amp; Preferences
        </h2>
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
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'urdu', label: 'اردو', sub: 'Urdu' },
                  { value: 'english', label: 'English', sub: 'English' },
                  { value: 'both', label: 'دونوں', sub: 'Both' },
                ] as const
              ).map(({ value, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, language: value }))
                  }
                  className={`py-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-0.5 ${
                    form.language === value
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
                  }`}
                >
                  <span className="text-base">{label}</span>
                  <span
                    className={`text-xs ${
                      form.language === value
                        ? 'text-green-200'
                        : 'text-gray-400'
                    }`}
                  >
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>
              WhatsApp number{' '}
              <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
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

      {/* Error */}
      {status === 'error' && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2">
          <span>⚠️</span>
          <span>
            <span className="font-semibold">Save failed. </span>
            {errorMsg}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving || !form.name.trim()}
          className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </button>
        <Link
          href={chatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition text-center"
        >
          View Live Bot →
        </Link>
      </div>

      {/* Bot link */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-500 mb-1 font-medium">Your bot link</p>
        <p className="font-mono text-xs text-gray-700 break-all">
          {typeof window !== 'undefined'
            ? `${window.location.origin}${chatUrl}`
            : chatUrl}
        </p>
      </div>
    </div>
  )
}
