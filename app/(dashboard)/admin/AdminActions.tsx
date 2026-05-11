'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase'

export default function AdminActions({
  profileId,
  currentRole,
  actorId,
}: {
  profileId: string
  currentRole: UserRole
  actorId: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (profileId === actorId) return <span className="text-xs text-gray-300">You</span>

  async function doAction(action: 'promote' | 'demote') {
    setLoading(true)
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, action }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {currentRole === 'shop_owner' ? (
        <button
          onClick={() => doAction('promote')}
          disabled={loading}
          className="text-xs text-violet-600 hover:underline disabled:opacity-50"
        >
          Promote
        </button>
      ) : (
        <button
          onClick={() => doAction('demote')}
          disabled={loading}
          className="text-xs text-amber-600 hover:underline disabled:opacity-50"
        >
          Demote
        </button>
      )}
    </div>
  )
}
