'use client'

import { useEffect, useState } from 'react'

export default function ServiceWorkerRegistration() {
  const [showToast, setShowToast] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered')

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker)
              setShowToast(true)
            }
          })
        })
      })
      .catch((error) => {
        console.log('SW registration failed', error)
      })
  }, [])

  const handleRefresh = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  if (!showToast) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 max-w-sm w-full pointer-events-auto">
        <p className="text-sm flex-1">App updated! Refresh for latest version.</p>
        <button
          onClick={handleRefresh}
          className="text-green-400 text-sm font-semibold shrink-0 hover:text-green-300 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
