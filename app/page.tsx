import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import MockChat from './components/MockChat'
import BrandLogo from './components/BrandLogo'

export const metadata: Metadata = {
  title: 'AIBotBanao — Free AI Chatbot for Your Shop',
  description:
    'Create a free AI chatbot for your business in 5 minutes. Works in Urdu and English. Share on WhatsApp, Instagram, and Facebook.',
  openGraph: {
    title: 'AIBotBanao — Free AI Chatbot for Your Shop',
    description:
      'Customers get instant answers. You save hours every day. 100% free to start.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'AIBotBanao — Free AI Chatbot for Your Shop',
    description: 'Customers get instant answers. You save hours every day.',
  },
}

const features = [
  {
    icon: '🗣️',
    title: 'Works in Urdu + English',
    desc: 'Customers can chat in Urdu, Roman Urdu, or English. The bot understands all three naturally.',
  },
  {
    icon: '📤',
    title: 'Share anywhere',
    desc: 'WhatsApp, Instagram, Facebook — share your bot link wherever your customers find you.',
  },
  {
    icon: '🎁',
    title: '100% Free to start',
    desc: 'No monthly fees, no credit card required. Start free and only pay when you need more.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <BrandLogo textClassName="text-2xl" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              Admin Dashboard
              <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-0.5 rounded-full shadow-sm">
                Coming Soon
              </span>
            </button>
            <Link
              href="/setup"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-8 pb-14 sm:pt-12 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full mb-6 border border-green-200">
              <span className="inline-flex items-center gap-2">
                <Image src="/pakistan-flag.svg" alt="Pakistan flag" width={16} height={12} className="rounded-[2px]" />
                Built for Pakistani businesses
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Free AI chatbot for your shop —{' '}
              <span className="text-green-600">ready in 5 minutes</span>
            </h1>
            <p className="text-xl text-gray-500 mb-8 leading-relaxed">
              Customers get instant answers. You save hours every day.
            </p>
            <Link
              href="/setup"
              className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Create My Free Bot →
            </Link>
            <p className="text-sm text-gray-400 mt-4">
              No credit card required · Setup in 5 minutes
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <MockChat />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            Everything you need
          </h2>
          <p className="text-center text-gray-500 mb-12">Simple tools that actually work for your business.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to save time?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Join shop owners across Pakistan who automated their customer support.
          </p>
          <Link
            href="/setup"
            className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-semibold px-10 py-4 rounded-xl shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Create My Free Bot →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-400">
          <span className="font-semibold text-gray-600">AIBotBanao</span>
          <span className="inline-flex items-center gap-2">
            Made in Pakistan
            <Image src="/pakistan-flag.svg" alt="Pakistan flag" width={16} height={12} className="rounded-[2px]" />
          </span>
        </div>
      </footer>
    </div>
  )
}
