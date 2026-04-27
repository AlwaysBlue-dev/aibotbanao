import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '404 — Page Not Found | AIBotBanao',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-7xl mb-6">🤖</div>

        <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">
          404
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Page not found
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
          We couldn&apos;t find what you were looking for. The link might be
          wrong, or the page may have been removed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/setup"
            className="border border-gray-200 hover:bg-gray-50 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Create a Bot →
          </Link>
        </div>

        <p className="text-xs text-gray-300 mt-10 inline-flex items-center gap-2">
          AIBotBanao · Made in Pakistan
          <Image src="/pakistan-flag.svg" alt="Pakistan flag" width={16} height={12} className="rounded-[2px]" />
        </p>
      </div>
    </div>
  )
}
