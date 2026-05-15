'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { resetPasswordUrl } from '@/lib/app-url'
import { formatAuthError } from '@/lib/format-auth-error'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetPasswordUrl(),
    })

    if (authError) {
      setError(formatAuthError(authError.message))
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">📨</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email sent</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            If <strong>{email}</strong> is registered, you&apos;ll receive a password reset link.
            Check your inbox.
          </p>
          <Link href="/login" className="inline-block mt-6 text-sm text-green-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter your email — we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-green-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
