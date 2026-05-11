'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function DeleteShopButton({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    await supabase
      .from('shops')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', shopId)
    router.push('/shops')
    router.refresh()
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-sm font-medium text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
      >
        Shop Delete Karein
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-red-700 font-medium">
        Kya aap sure hain? &ldquo;{shopName}&rdquo; delete ho jayegi.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirm(false)}
          className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 rounded-xl transition-colors"
        >
          {loading ? 'Delete ho raha hai…' : 'Haan, Delete Karein'}
        </button>
      </div>
    </div>
  )
}
