'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallContextValue {
  canInstall: boolean
  isIOS: boolean
  install: () => Promise<void>
}

const InstallCtx = createContext<InstallContextValue>({
  canInstall: false,
  isIOS: false,
  install: async () => {},
})

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [canInstall, setCanInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    if (ios) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    await prompt.prompt()
    deferredPrompt.current = null
  }, [])

  return (
    <InstallCtx.Provider value={{ canInstall, isIOS, install }}>
      {children}
    </InstallCtx.Provider>
  )
}

export const useInstall = () => useContext(InstallCtx)
