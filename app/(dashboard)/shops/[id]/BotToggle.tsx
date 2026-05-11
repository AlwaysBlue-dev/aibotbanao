'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function BotToggle({ shopId, isActive }: { shopId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.from('shops').update({ is_active: !active }).eq('id', shopId)
    setActive(!active)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        active ? 'bg-green-500' : 'bg-gray-200'
      } disabled:opacity-60`}
      aria-label={active ? 'Bot off karein' : 'Bot on karein'}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
