import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Shop } from '@/lib/supabase'
import DeleteShopButton from './DeleteShopButton'
import EmbedCodeBlock from './EmbedCodeBlock'

function EmbedCode({ slug }: { slug: string }) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://aibotbanao.com').replace(/\/$/, '')
  const scriptTag = `<script src="${appUrl}/embed.js" data-shop="${slug}" defer></script>`
  const chatUrl = `${appUrl}/chat/${slug}`
  return <EmbedCodeBlock scriptTag={scriptTag} chatUrl={chatUrl} />
}

export default async function ShopOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shopRaw } = await supabase
    .from('shops')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!shopRaw) notFound()
  const shop = shopRaw as Shop

  const [{ count: orderCount }, { count: chatCount }] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', id),
    supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('shop_id', id),
  ])

  return (
    <div className="w-full">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orderCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Chats</p>
          <p className="text-2xl font-bold text-gray-900">{chatCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Language</p>
          <p className="text-sm font-semibold text-gray-900 capitalize">{shop.bot_language.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Embed code */}
      <div className="mb-6">
        <EmbedCode slug={shop.slug} />
      </div>

      {/* Shop details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Bot Config</h2>
          <Link href={`/shops/${id}/settings`} className="text-sm text-green-600 hover:underline">
            Edit
          </Link>
        </div>
        <dl className="space-y-3 text-sm">
          {shop.bot_config?.business_type && (
            <div><dt className="text-gray-400 text-xs mb-0.5">Business Type</dt><dd className="text-gray-700">{shop.bot_config.business_type}</dd></div>
          )}
          {shop.whatsapp_number && (
            <div><dt className="text-gray-400 text-xs mb-0.5">WhatsApp</dt><dd className="text-gray-700">{shop.whatsapp_number}</dd></div>
          )}
          {shop.bot_config?.products && (
            <div><dt className="text-gray-400 text-xs mb-0.5">Products</dt><dd className="text-gray-700 whitespace-pre-line">{shop.bot_config.products}</dd></div>
          )}
        </dl>
      </div>

      {/* Danger zone */}
      <div className="border border-red-100 rounded-2xl p-5">
        <h2 className="font-semibold text-red-700 mb-1">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">Deleting this shop will permanently remove all its data.</p>
        <DeleteShopButton shopId={shop.id} shopName={shop.shop_name} />
      </div>
    </div>
  )
}
