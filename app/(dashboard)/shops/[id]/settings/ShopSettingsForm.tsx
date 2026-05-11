'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Shop } from '@/lib/supabase'

const LANGUAGE_OPTIONS = [
  { value: 'roman_urdu', label: 'Roman Urdu' },
  { value: 'urdu', label: 'اردو' },
  { value: 'english', label: 'English' },
  { value: 'auto', label: 'Auto-detect' },
]

export default function ShopSettingsForm({ shop }: { shop: Shop }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [shopName, setShopName] = useState(shop.shop_name)
  const [whatsapp, setWhatsapp] = useState(shop.whatsapp_number ?? '')
  const [description, setDescription] = useState(shop.description ?? '')
  const [botLanguage, setBotLanguage] = useState(shop.bot_language)
  const [businessType, setBusinessType] = useState(shop.bot_config?.business_type ?? '')
  const [products, setProducts] = useState(shop.bot_config?.products ?? '')
  const [deliveryInfo, setDeliveryInfo] = useState(shop.bot_config?.delivery_info ?? '')
  const [workingHours, setWorkingHours] = useState(shop.bot_config?.working_hours ?? '')
  const [returnPolicy, setReturnPolicy] = useState(shop.bot_config?.return_policy ?? '')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        shop_name: shopName.trim(),
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
      })
      .eq('id', shop.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Info</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop naam</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>
      </div>

      {/* Bot config */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Bot Configuration</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Business type</label>
          <input
            type="text"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Products aur Prices</label>
          <textarea
            value={products}
            onChange={(e) => setProducts(e.target.value)}
            rows={6}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery info</label>
          <textarea
            value={deliveryInfo}
            onChange={(e) => setDeliveryInfo(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Working Hours</label>
          <input
            type="text"
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Return Policy</label>
          <input
            type="text"
            value={returnPolicy}
            onChange={(e) => setReturnPolicy(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bot Language</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBotLanguage(opt.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  botLanguage === opt.value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl">Settings save ho gayi!</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Save ho rahi hain…' : 'Settings Save Karein'}
      </button>
    </form>
  )
}
