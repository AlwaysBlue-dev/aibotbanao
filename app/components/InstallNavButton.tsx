'use client'

import { useState } from 'react'
import { useInstall } from './InstallContext'

export default function InstallNavButton() {
  const { canInstall, isIOS, isInstalled, install } = useInstall()
  const [showTip, setShowTip] = useState(false)

  if (isInstalled || (!canInstall && !isIOS)) return null

  const handleClick = async () => {
    if (canInstall) {
      await install()
    } else {
      setShowTip((p) => !p)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
        aria-label="Install app"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="hidden sm:inline">Get App</span>
      </button>

      {/* iOS tip popover */}
      {showTip && isIOS && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50">
          <button
            onClick={() => setShowTip(false)}
            className="absolute top-2 right-2 text-gray-300 hover:text-gray-500"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <p className="text-xs font-semibold text-gray-800 mb-1">Add to Home Screen</p>
          <p className="text-xs text-gray-500 leading-relaxed flex items-center flex-wrap gap-x-1">
            <span>Tap</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="inline text-blue-500" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M8 7l4-4 4 4M8 11H5a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1v-8a1 1 0 00-1-1h-3" />
            </svg>
            <span>then &lsquo;Add to Home Screen&rsquo;</span>
          </p>
        </div>
      )}
    </div>
  )
}
