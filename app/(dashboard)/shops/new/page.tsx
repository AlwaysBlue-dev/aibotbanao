'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Step = 1 | 2 | 3

const LANGUAGE_OPTIONS = [
  { value: 'roman_urdu', label: 'Roman Urdu', desc: 'Urdu words in English letters' },
  { value: 'urdu', label: 'اردو', desc: 'Urdu script' },
  { value: 'english', label: 'English', desc: 'In English' },
  { value: 'auto', label: 'Auto-detect', desc: "Responds in customer's language" },
]

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
}

export default function NewShopPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  // Step 2
  const [products, setProducts] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState('')
  const [workingHours, setWorkingHours] = useState('')
  const [returnPolicy, setReturnPolicy] = useState('')

  // Step 3
  const [botLanguage, setBotLanguage] = useState('auto')
  const [description, setDescription] = useState('')

  function handleNameChange(val: string) {
    setShopName(val)
    setSlug(slugify(val))
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: insertError } = await supabase.from('shops').insert({
      owner_id: user.id,
      shop_name: shopName.trim(),
      slug: slug.trim(),
      whatsapp_number: whatsapp.trim() || null,
      description: description.trim() || null,
      bot_language: botLanguage,
      bot_config: {
        business_type: businessType.trim(),
        products: products.trim(),
        delivery_info: deliveryInfo.trim(),
        working_hours: workingHours.trim(),
        return_policy: returnPolicy.trim(),
      },
      status: 'active',
      is_active: true,
      deleted_at: null,
    })

    if (insertError) {
      setError(insertError.message.includes('Shop limit')
        ? 'You can create a maximum of 3 shops.'
        : insertError.message.includes('unique') || insertError.message.includes('duplicate')
        ? 'This slug is already taken. Try a different name.'
        : insertError.message)
      setLoading(false)
      return
    }

    router.push('/shops')
    router.refresh()
  }

  const canGoNext1 = shopName.trim().length >= 3 && slug.trim().length >= 2 && businessType.trim().length >= 2
  const canGoNext2 = products.trim().length >= 10 && deliveryInfo.trim().length >= 5 && returnPolicy.trim().length >= 5

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Shop</h1>
        <p className="text-sm text-gray-500 mt-1">Step {step} of 3</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-green-500' : 'bg-gray-100'}`} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-900">Shop ki basic info</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop ka naam <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ali Fashion Store"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug <span className="text-red-500">*</span></label>
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 flex-shrink-0">
                  /chat/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40))}
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  placeholder="ali-fashion"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business type <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Clothing, food, electronics..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp number</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="03001234567"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canGoNext1}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-900">Bot Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Products & Prices <span className="text-red-500">*</span></label>
              <textarea
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder={`Lawn Suit - Rs 2500\nEmbroided Shirt - Rs 1800\nDupatta - Rs 500`}
              />
              <p className="text-xs text-gray-400 mt-1">Enter each product on a separate line</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery info <span className="text-red-500">*</span></label>
              <textarea
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Karachi free delivery, rest of Pakistan Rs 200..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Working Hours</label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Mon-Sat 10am-8pm, Sunday closed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Return Policy <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Exchange within 3 days, no cash refund"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canGoNext2}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-900">Bot Language & Final Review</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bot Language</label>
              <div className="space-y-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="botLanguage"
                      value={opt.value}
                      checked={botLanguage === opt.value}
                      onChange={() => setBotLanguage(opt.value)}
                      className="mt-0.5 accent-green-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Brief description about your shop..."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
              <p className="font-medium text-gray-700 mb-2">Review:</p>
              <p className="text-gray-600"><span className="text-gray-400">Shop:</span> {shopName}</p>
              <p className="text-gray-600"><span className="text-gray-400">URL:</span> /chat/{slug}</p>
              <p className="text-gray-600"><span className="text-gray-400">Type:</span> {businessType}</p>
              <p className="text-gray-600"><span className="text-gray-400">Language:</span> {LANGUAGE_OPTIONS.find(l => l.value === botLanguage)?.label}</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Creating…' : 'Finish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
