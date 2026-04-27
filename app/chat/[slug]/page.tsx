import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/lib/supabase'
import ChatInterface from './ChatInterface'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabase
    .from('businesses')
    .select('name, business_type')
    .eq('slug', slug)
    .single()
  const businessMeta = data as Pick<Business, 'name' | 'business_type'> | null

  if (!businessMeta) {
    return { title: 'Bot Not Found | AIBotBanao' }
  }

  const title = `${businessMeta.name} — AI Assistant`
  const description = `Chat with ${businessMeta.name}'s AI assistant. Get instant answers about products, prices, delivery, and more.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ admin?: string }>
}) {
  const { slug } = await params
  const { admin } = await searchParams

  const { data: business } = await supabase
    .from('businesses')
    .select('name, slug, admin_token')
    .eq('slug', slug)
    .single()
  const businessData = business as Pick<Business, 'name' | 'slug' | 'admin_token'> | null

  if (!businessData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-6">🤖</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Bot not found</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            This link doesn&apos;t match any active bot. The URL might be wrong,
            or the bot was removed.
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

  const isAdmin = !!(admin && businessData.admin_token && admin === businessData.admin_token)

  return (
    <ChatInterface
      businessName={businessData.name}
      slug={businessData.slug}
      isAdmin={isAdmin}
      adminToken={isAdmin ? admin! : ''}
    />
  )
}
