import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Shop } from '@/lib/supabase'
import ShopSubNav from './ShopSubNav'
import BotToggle from './BotToggle'

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shopRaw } = await supabase
    .from('shops')
    .select('id, shop_name, slug, is_active')
    .eq('id', id)
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!shopRaw) notFound()
  const shop = shopRaw as Pick<Shop, 'id' | 'shop_name' | 'slug' | 'is_active'>

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/shops"
          className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Shops
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shop.shop_name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">/chat/{shop.slug}</p>
          </div>
          <BotToggle shopId={shop.id} isActive={shop.is_active} />
        </div>
      </div>

      <ShopSubNav shopId={id} />

      <div className="mt-6">{children}</div>
    </div>
  )
}
