import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Profile, Shop } from '@/lib/supabase'

function StatCard({
  label,
  value,
  sub,
  color = 'green',
}: {
  label: string
  value: string | number
  sub?: string
  color?: 'green' | 'blue' | 'violet' | 'amber'
}) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-3">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {sub && <p className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${colors[color]}`}>{sub}</p>}
    </div>
  )
}

function ShopSlotIndicator({ used, max }: { used: number; max: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-3">Shop Slots</p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-gray-900">{used}</span>
        <span className="text-lg text-gray-400 mb-0.5">/ {max}</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${i < used ? 'bg-green-500' : 'bg-gray-100'}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">{max - used} slot{max - used !== 1 ? 's' : ''} baaki hain</p>
    </div>
  )
}

function greeting(name: string | null) {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'Subah bakhair' : hour < 17 ? 'Dopehar bakhair' : 'Shaam bakhair'
  return `${time}, ${name?.split(' ')[0] || 'Sahib'}!`
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profileRaw }, { data: shopsRaw }, { data: ordersRaw }, { data: sessionsRaw }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('shops').select('*').eq('owner_id', user.id).is('deleted_at', null),
      supabase
        .from('orders')
        .select('id, shop_id, created_at')
        .in(
          'shop_id',
          ((await supabase.from('shops').select('id').eq('owner_id', user.id).is('deleted_at', null)).data ?? []).map(
            (s: { id: string }) => s.id
          )
        ),
      supabase
        .from('chat_sessions')
        .select('id, shop_id, started_at')
        .in(
          'shop_id',
          ((await supabase.from('shops').select('id').eq('owner_id', user.id).is('deleted_at', null)).data ?? []).map(
            (s: { id: string }) => s.id
          )
        ),
    ])

  const profile = profileRaw as Profile | null
  const shops = (shopsRaw ?? []) as Shop[]
  const orders = (ordersRaw ?? []) as { id: string; shop_id: string; created_at: string }[]
  const sessions = (sessionsRaw ?? []) as { id: string; shop_id: string; started_at: string }[]

  const today = new Date().toISOString().split('T')[0]
  const ordersToday = orders.filter((o) => o.created_at.startsWith(today)).length
  const chatsToday = sessions.filter((s) => s.started_at.startsWith(today)).length

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{greeting(profile?.full_name ?? null)}</h1>
        <p className="text-gray-500 text-sm mt-1">Yahan aapke sabhi shops ka overview hai.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ShopSlotIndicator used={shops.length} max={3} />
        <StatCard label="Kul Orders" value={orders.length} sub="Total" color="blue" />
        <StatCard label="Aaj ke Orders" value={ordersToday} sub="Aaj" color="violet" />
        <StatCard label="Aaj ki Chats" value={chatsToday} sub="Aaj" color="amber" />
      </div>

      {/* Shops quick list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Meri Shops</h2>
          {shops.length < 3 && (
            <Link
              href="/shops/new"
              className="text-sm font-medium text-green-600 hover:underline"
            >
              + Naya Shop
            </Link>
          )}
        </div>

        {shops.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm mb-4">Abhi koi shop nahi hai.</p>
            <Link
              href="/shops/new"
              className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Pehla Shop Banayein
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {shops.map((shop) => {
              const shopOrders = orders.filter((o) => o.shop_id === shop.id).length
              const shopChats = sessions.filter((s) => s.shop_id === shop.id).length
              return (
                <li key={shop.id}>
                  <Link
                    href={`/shops/${shop.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${shop.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{shop.shop_name}</p>
                        <p className="text-xs text-gray-400 truncate">/{shop.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0 ml-4">
                      <span>{shopOrders} orders</span>
                      <span>{shopChats} chats</span>
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
