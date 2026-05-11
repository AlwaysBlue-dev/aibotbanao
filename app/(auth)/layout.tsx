import type { Metadata } from 'next'
import BrandLogo from '@/app/components/BrandLogo'

export const metadata: Metadata = {
  title: 'AIBotBanao — Account',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="py-5 px-6">
        <BrandLogo textClassName="text-xl" />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  )
}
