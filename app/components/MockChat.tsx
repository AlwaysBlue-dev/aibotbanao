'use client'

import { useState, useEffect } from 'react'

const messages = [
  { role: 'user' as const, text: 'کیا آپ کے پاس قمیص available ہے؟' },
  { role: 'bot' as const, text: 'جی بالکل! ہمارے پاس 5 رنگوں میں قمیضیں ہیں۔ آپ کا سائز کیا ہے؟' },
  { role: 'user' as const, text: 'Medium size chahiye, price kya hai?' },
  { role: 'bot' as const, text: 'Medium Rs 1,500 mein available ✓ Cash on delivery bhi hai!' },
]

export default function MockChat() {
  const [cycle, setCycle] = useState(0)
  const [visible, setVisible] = useState(0)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const add = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    add(0, () => setVisible(0))
    add(0, () => setTyping(false))

    add(700,  () => setVisible(1))
    add(1500, () => setTyping(true))
    add(2700, () => { setTyping(false); setVisible(2) })
    add(4000, () => setVisible(3))
    add(4900, () => setTyping(true))
    add(6100, () => { setTyping(false); setVisible(4) })
    add(9000, () => setCycle(c => c + 1))

    return () => timers.forEach(clearTimeout)
  }, [cycle])

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
      {/* Header */}
      <div className="bg-green-600 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">Ahmed&apos;s Clothing Store</p>
          <p className="text-green-200 text-xs">Powered by AIBotBanao</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
          <span className="text-green-200 text-xs">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-gray-50 px-4 py-4 space-y-3 min-h-[220px]">
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 shadow-sm max-w-[85%] text-sm text-gray-700">
            Asalam o Alaikum! 👋 Kaise madad kar sakta hoon?
          </div>
        </div>

        {messages.slice(0, visible).map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-2xl px-3 py-2 shadow-sm max-w-[85%] text-sm ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-br-none'
                  : 'bg-white text-gray-700 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400">
          Type a message...
        </div>
        <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
