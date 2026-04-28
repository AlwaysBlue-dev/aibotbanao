'use client'

import { useEffect, useRef, useState } from 'react'

const VISIT_KEY = 'aibotbanao_visit_count'
const DISMISSED_KEY = 'aibotbanao_install_dismissed'
const INSTALLED_KEY = 'aibotbanao_installed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // iOS uses IOSInstallBanner instead — beforeinstallprompt never fires there anyway,
    // but guard explicitly so nothing leaks through on iOS Chrome forks.
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return

    // Increment visit count
    const visits = parseInt(localStorage.getItem(VISIT_KEY) ?? '0', 10) + 1
    localStorage.setItem(VISIT_KEY, String(visits))

    // Already installed — never show
    if (localStorage.getItem(INSTALLED_KEY) === 'true') return

    // Check dismissal — hide for 7 days after "Not now"
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedAt < sevenDays) return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      // Only show banner on second visit onwards
      if (visits >= 2) setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setVisible(false)
      localStorage.setItem(INSTALLED_KEY, 'true')
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    console.log('[PWA] install outcome:', outcome)
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, 'true')
    }
    deferredPrompt.current = null
    setVisible(false)
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
  }

  return (
    <div
      role="region"
      aria-label="Install app"
      className={[
        'fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none',
      ].join(' ')}
    >
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
        {/* Icon */}
        <div className="shrink-0">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="26" height="26" rx="9" fill="#16A34A" />
            <path d="M16 7.2V9.1" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16" cy="6.1" r="1.3" fill="white" />
            <rect x="8.2" y="10.2" width="15.6" height="12.8" rx="4.6" fill="white" />
            <circle cx="6.9" cy="16.6" r="1.6" fill="white" />
            <circle cx="25.1" cy="16.6" r="1.6" fill="white" />
            <circle cx="13.3" cy="15.8" r="1.65" fill="#16A34A" />
            <circle cx="18.7" cy="15.8" r="1.65" fill="#16A34A" />
            <path
              d="M12.5 19.1C13.3 20.1 14.5 20.7 16 20.7C17.5 20.7 18.7 20.1 19.5 19.1"
              stroke="#16A34A"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">Install AIBotBanao</p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">
            Get faster access from your home screen
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1 py-1"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
