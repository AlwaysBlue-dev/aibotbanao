'use client'

import { useEffect, useState } from 'react'

const IOS_DISMISSED_KEY = 'aibotbanao_ios_dismissed'
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (!isIOS || isStandalone) return

    const dismissed = localStorage.getItem(IOS_DISMISSED_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < FOURTEEN_DAYS) return
    }

    setVisible(true)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(IOS_DISMISSED_KEY, String(Date.now()))
  }

  return (
    <div
      role="region"
      aria-label="Install on iPhone"
      className={[
        'fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none',
      ].join(' ')}
    >
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
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
          <p className="text-sm font-bold text-gray-900 leading-tight">Install on iPhone</p>
          <p className="text-xs text-gray-500 leading-snug mt-1 flex items-center flex-wrap gap-x-1">
            <span>Tap</span>
            {/* iOS share icon: box with arrow up */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Share"
              className="inline shrink-0 text-blue-500"
            >
              <path
                d="M12 3L12 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M8 7L12 3L16 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 11H5C4.44772 11 4 11.4477 4 12V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V12C20 11.4477 19.5523 11 19 11H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>then &lsquo;Add to Home Screen&rsquo;</span>
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors p-1 -mt-1 -mr-1"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
