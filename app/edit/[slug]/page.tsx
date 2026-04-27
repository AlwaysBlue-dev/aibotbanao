import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/lib/supabase'
import EditForm from './EditForm'
import BrandLogo from '@/app/components/BrandLogo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabase
    .from('businesses')
    .select('name')
    .eq('slug', slug)
    .single()
  const businessMeta = data as Pick<Business, 'name'> | null

  return {
    title: businessMeta ? `Edit ${businessMeta.name} | AIBotBanao` : 'Edit Bot | AIBotBanao',
  }
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single()
  const businessData = business as Business | null

  if (!businessData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-6">🤖</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Bot not found</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            No bot exists for this link. Double-check your URL or create a new bot.
          </p>
          <Link
            href="/setup"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Create My Free Bot →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <Link
            href={`/chat/${businessData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
          >
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            View Live Bot
          </Link>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Edit your bot
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Changes take effect instantly — no restart needed.
          </p>
        </div>

        <EditForm business={businessData} />
      </main>
    </div>
  )
}
