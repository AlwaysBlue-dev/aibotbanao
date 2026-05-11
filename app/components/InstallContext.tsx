'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallContextValue {
  canInstall: boolean
  isIOS: boolean
  isInstalled: boolean
  install: () => Promise<void>
}

const InstallCtx = createContext<InstallContextValue>({
  canInstall: false,
  isIOS: false,
  isInstalled: false,
  install: async () => {},
})

const INSTALLED_KEY = 'aibotbanao_installed'

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [canInstall, setCanInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (localStorage.getItem(INSTALLED_KEY) === 'true') {
      setIsInstalled(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    if (ios) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    const installedHandler = () => {
      setCanInstall(false)
      setIsInstalled(true)
      localStorage.setItem(INSTALLED_KEY, 'true')
      deferredPrompt.current = null
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const install = useCallback(async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
      setIsInstalled(true)
      localStorage.setItem(INSTALLED_KEY, 'true')
    }
    deferredPrompt.current = null
  }, [])

  return (
    <InstallCtx.Provider value={{ canInstall, isIOS, isInstalled, install }}>
      {children}
    </InstallCtx.Provider>
  )
}

export const useInstall = () => useContext(InstallCtx)
