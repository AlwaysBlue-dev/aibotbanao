'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import BrandLogo from './BrandLogo'
import ThemeToggle from './ThemeToggle'
import type { Profile } from '@/lib/supabase'

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Meri Shops', href: '/shops' },
  { label: 'Profile', href: '/profile' },
]

export default function MobileNav({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const navItems = profile?.role === 'super_admin'
    ? [...NAV, { label: 'Admin', href: '/admin' }]
    : NAV

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between">
        <BrandLogo textClassName="text-lg" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-50"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-white shadow-xl transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <BrandLogo textClassName="text-lg" />
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? 'Avatar'}
                  width={36}
                  height={36}
                  className="w-9 h-9 object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-sm font-bold text-green-700">
                  {(profile?.full_name || 'S').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {profile?.full_name || 'Shop Owner'}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {profile?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:underline"
            >
              Sign Out
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  )
}
