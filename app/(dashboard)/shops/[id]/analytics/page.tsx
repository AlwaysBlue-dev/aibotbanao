import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Shop } from '@/lib/supabase'
import AnalyticsCharts from './AnalyticsCharts'

export default async function ShopAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ days?: string }>
}) {
  const { id } = await params
  const { days: daysParam } = await searchParams
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shopRaw } = await supabase
    .from('shops')
    .select('id, shop_name')
    .eq('id', id)
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!shopRaw) notFound()
  const shop = shopRaw as Pick<Shop, 'id' | 'shop_name'>

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: sessionsRaw }, { data: ordersRaw }] = await Promise.all([
    supabase
      .from('chat_sessions')
      .select('started_at, language_detected, message_count')
      .eq('shop_id', id)
      .gte('started_at', since),
    supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('shop_id', id)
      .gte('created_at', since),
  ])

  const sessions = sessionsRaw ?? []
  const orders = ordersRaw ?? []

  // Build daily buckets for the period
  const buckets: Record<string, { chats: number; orders: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    buckets[d] = { chats: 0, orders: 0 }
  }

  for (const s of sessions) {
    const d = (s as { started_at: string }).started_at.split('T')[0]
    if (buckets[d]) buckets[d].chats++
  }
  for (const o of orders) {
    const d = (o as { created_at: string }).created_at.split('T')[0]
    if (buckets[d]) buckets[d].orders++
  }

  // Language breakdown
  const langMap: Record<string, number> = {}
  for (const s of sessions) {
    const lang = (s as { language_detected: string | null }).language_detected ?? 'unknown'
    langMap[lang] = (langMap[lang] ?? 0) + 1
  }
  const langBreakdown = Object.entries(langMap).map(([lang, count]) => ({ lang, count }))

  const totalChats = sessions.length
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + ((o as { total_amount: number | null }).total_amount ?? 0), 0)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([7, 30, 90] as const).map((d) => (
            <a
              key={d}
              href={`/shops/${id}/analytics?days=${d}`}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                days === d ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Chats</p>
          <p className="text-2xl font-bold text-gray-900">{totalChats}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Orders</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">Rs {totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <AnalyticsCharts buckets={buckets} langBreakdown={langBreakdown} days={days} />
    </div>
  )
}
