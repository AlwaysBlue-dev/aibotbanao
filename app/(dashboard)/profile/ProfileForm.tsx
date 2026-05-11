'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Profile } from '@/lib/supabase'

export default function ProfileForm({
  profile,
  userEmail,
}: {
  profile: Profile | null
  userEmail: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileError, setProfileError] = useState('')

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('File must not exceed 2MB.')
      return
    }

    setUploading(true)
    setProfileError('')
    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setProfileError('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(urlData.publicUrl)
    setUploading(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg('')
    setProfileError('')
    setSaving(true)

    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), avatar_url: avatarUrl || null })
      .eq('id', user.id)

    if (error) {
      setProfileError(error.message)
    } else {
      setProfileMsg('Profile updated!')
      router.refresh()
    }
    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg('')
    setPwdError('')

    if (newPwd.length < 8) {
      setPwdError('New password must be at least 8 characters.')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Passwords do not match.')
      return
    }

    setPwdLoading(true)
    const supabase = createSupabaseBrowserClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { router.push('/login'); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPwd,
    })

    if (signInError) {
      setPwdError('Current password is incorrect.')
      setPwdLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) {
      setPwdError(error.message)
    } else {
      setPwdMsg('Password updated!')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    }
    setPwdLoading(false)
  }

  const initials = fullName.trim()
    ? fullName.trim().split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Personal Info</h2>

        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-green-100 flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xl font-bold text-green-700">
                {initials}
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-green-600 hover:underline disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG — max 2MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={userEmail}
            disabled
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
        </div>

        {profileError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{profileError}</p>}
        {profileMsg && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{profileMsg}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      <form onSubmit={changePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Change Password</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
            minLength={8}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="••••••••"
          />
        </div>

        {pwdError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwdError}</p>}
        {pwdMsg && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{pwdMsg}</p>}

        <button
          type="submit"
          disabled={pwdLoading}
          className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {pwdLoading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
