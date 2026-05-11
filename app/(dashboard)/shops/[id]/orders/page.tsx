import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Shop, Order, OrderItem } from '@/lib/supabase'

function maskWhatsApp(phone: string | null): string {
  if (!phone) return '—'
  if (phone.length <= 5) return phone
  return phone.slice(0, 3) + '***' + phone.slice(-3)
}

function statusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-700'
    case 'confirmed': return 'bg-blue-50 text-blue-700'
    case 'delivered': return 'bg-green-50 text-green-700'
    case 'cancelled': return 'bg-red-50 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default async function ShopOrdersPage({
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
    .select('id, shop_name, slug')
    .eq('id', id)
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!shopRaw) notFound()
  const shop = shopRaw as Pick<Shop, 'id' | 'shop_name' | 'slug'>

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  const orders = (ordersRaw ?? []) as Order[]

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
        <p className="text-sm text-gray-500 mt-0.5">{orders.length} orders total</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500 text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Items</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">WhatsApp</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const items = (order.items ?? []) as OrderItem[]
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-900 font-medium">
                          {items.length > 0
                            ? items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                            : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-gray-500 font-mono">
                        {maskWhatsApp(order.customer_whatsapp)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        {order.total_amount != null ? `Rs ${order.total_amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
