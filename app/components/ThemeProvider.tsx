'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ThemeCtx = { isDark: boolean; toggle: () => void }
const Ctx = createContext<ThemeCtx>({ isDark: false, toggle: () => {} })
export const useTheme = () => useContext(Ctx)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('aibotbanao_theme') === 'dark') setIsDark(true)
    } catch { /* localStorage unavailable */ }
  }, [])

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      try { localStorage.setItem('aibotbanao_theme', next ? 'dark' : 'light') } catch { /* */ }
      return next
    })
  }, [])

  return (
    <Ctx.Provider value={{ isDark, toggle }}>
      {/*
        isDark starts false on SSR and client (no hydration mismatch).
        After mount, useEffect applies saved preference.
      */}
      <div className={isDark ? 'dark' : ''}>
        {children}
      </div>
    </Ctx.Provider>
  )
}
