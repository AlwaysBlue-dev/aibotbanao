import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import type { Business, Shop } from '@/lib/supabase'
import ChatInterface from './ChatInterface'

type BotMeta = { name: string; slug: string; isActive: boolean }

async function fetchBotMeta(slug: string): Promise<BotMeta | null> {
  const supabase = createAdminClient()

  // Try shops first
  const { data: shopRaw } = await supabase
    .from('shops')
    .select('shop_name, slug, is_active')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (shopRaw) {
    const shop = shopRaw as Pick<Shop, 'shop_name' | 'slug' | 'is_active'>
    return { name: shop.shop_name, slug: shop.slug, isActive: shop.is_active }
  }

  // Legacy businesses table fallback
  const { data: bizRaw } = await supabase
    .from('businesses')
    .select('name, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (bizRaw) {
    const biz = bizRaw as Pick<Business, 'name' | 'slug'>
    return { name: biz.name, slug: biz.slug, isActive: true }
  }

  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const bot = await fetchBotMeta(slug)

  if (!bot) return { title: 'Bot Not Found | AIBotBanao' }

  const title = `${bot.name} — AI Assistant`
  const description = `Chat with ${bot.name}'s AI assistant. Get instant answers about products, prices, delivery, and more.`
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const bot = await fetchBotMeta(slug)

  if (!bot) {
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

  if (!bot.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-6">😴</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Bot is currently offline</h1>
          <p className="text-gray-500 mb-4">
            {bot.name}&apos;s AI assistant is temporarily unavailable.
          </p>
        </div>
      </div>
    )
  }

  return <ChatInterface businessName={bot.name} slug={bot.slug} isAdmin={false} adminToken="" />
}
