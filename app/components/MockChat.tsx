'use client'

import { useState, useEffect } from 'react'

type Lang = 'english' | 'roman_urdu' | 'urdu'

const CHATS: Record<Lang, { shopName: string; greeting: string; messages: { role: 'user' | 'bot'; text: string }[] }> = {
  english: {
    shopName: "StyleZone Clothing",
    greeting: 'Hello! 👋 How can I help you today?',
    messages: [
      { role: 'user', text: 'What sizes do you have?' },
      { role: 'bot',  text: 'Small, Medium & Large available ✓ Which one do you need?' },
      { role: 'user', text: "What's the price for Medium?" },
      { role: 'bot',  text: 'Medium is Rs 1,500 ✓ Cash on delivery available!' },
    ],
  },
  roman_urdu: {
    shopName: "Ahmad General Store",
    greeting: 'Asalam o Alaikum! 👋 Kaise madad kar sakta hoon?',
    messages: [
      { role: 'user', text: 'Shirt ka price kya hai?' },
      { role: 'bot',  text: 'Ji! Shirt Rs 1,500 mein hai ✓ Cash on delivery bhi available!' },
      { role: 'user', text: 'Medium size available hai?' },
      { role: 'bot',  text: 'Ji bilkul! Medium available hai ✓ Order karein?' },
    ],
  },
  urdu: {
    shopName: "النور جنرل اسٹور",
    greeting: 'السلام علیکم! 👋 میں آپ کی کیسے مدد کر سکتا ہوں؟',
    messages: [
      { role: 'user', text: 'شرٹ کا سائز کیا ہے؟' },
      { role: 'bot',  text: 'چھوٹا، درمیانہ اور بڑا دستیاب ہے ✓ کونسا چاہیے؟' },
      { role: 'user', text: 'قیمت کیا ہے؟' },
      { role: 'bot',  text: 'میڈیم Rs 1,500 میں ہے ✓ کیش آن ڈیلیوری بھی ہے!' },
    ],
  },
}

const TABS: { key: Lang; label: string }[] = [
  { key: 'english',    label: 'English' },
  { key: 'roman_urdu', label: 'Roman Urdu' },
  { key: 'urdu',       label: 'اردو' },
]

export default function MockChat() {
  const [lang, setLang] = useState<Lang>('english')
  const [cycle, setCycle] = useState(0)
  const [visible, setVisible] = useState(0)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    setVisible(0)
    setTyping(false)
    setCycle(0)
  }, [lang])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const add = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    add(700,  () => setVisible(1))
    add(1500, () => setTyping(true))
    add(2700, () => { setTyping(false); setVisible(2) })
    add(4000, () => setVisible(3))
    add(4900, () => setTyping(true))
    add(6100, () => { setTyping(false); setVisible(4) })
    add(9500, () => setCycle(c => c + 1))

    return () => timers.forEach(clearTimeout)
  }, [cycle])

  const chat = CHATS[lang]
  const isRtl = lang === 'urdu'

  return (
    <div className="w-full max-w-sm flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/80 border border-gray-100 bg-white">

      {/* Language tabs */}
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setLang(tab.key)}
            className={`flex-1 text-xs font-semibold py-1.5 px-2 rounded-xl transition-all duration-200 ${
              lang === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="bg-green-600 px-4 py-3.5 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl shadow-inner">
            🤖
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-300 border-2 border-green-500 rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{chat.shopName}</p>
          <p className="text-green-100 text-xs mt-0.5">Powered by AIBotBanao · Online</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40" />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="bg-gray-50 px-4 py-4 space-y-2.5 min-h-[230px]">
        {/* Bot greeting */}
        <div className="flex items-end gap-2 justify-start">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs shrink-0 mb-0.5">🤖</div>
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`bg-white rounded-2xl rounded-bl-none px-3.5 py-2.5 shadow-sm max-w-[78%] text-sm text-gray-800 leading-relaxed ${isRtl ? 'text-right' : ''}`}
          >
            {chat.greeting}
          </div>
        </div>

        {chat.messages.slice(0, visible).map((msg, i) => (
          <div key={`${lang}-${i}`} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs shrink-0 mb-0.5">🤖</div>
            )}
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className={`rounded-2xl px-3.5 py-2.5 shadow-sm max-w-[78%] text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none'
              } ${isRtl ? 'text-right' : ''}`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs shrink-0 mb-0.5">🤖</div>
            <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 160, 320].map(delay => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-400">
          {lang === 'urdu' ? 'پیغام لکھیں...' : lang === 'roman_urdu' ? 'Message likhein...' : 'Type a message...'}
        </div>
        <button className="w-9 h-9 bg-green-600 hover:bg-green-700 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm shadow-green-200">
          <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
