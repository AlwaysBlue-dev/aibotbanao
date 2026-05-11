import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Shop } from '@/lib/supabase'

export default async function ShopsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shopsRaw } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const shops = (shopsRaw ?? []) as Shop[]
  const canCreate = shops.length < 3

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meri Shops</h1>
          <p className="text-sm text-gray-500 mt-1">{shops.length} / 3 shops use ho rahi hain</p>
        </div>
        {canCreate && (
          <Link
            href="/shops/new"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Naya Shop
          </Link>
        )}
      </div>

      {shops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Koi shop nahi</h2>
          <p className="text-gray-500 text-sm mb-6">Apna pehla shop banayein aur AI bot shuru karein.</p>
          <Link
            href="/shops/new"
            className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Pehla Shop Banayein
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${shop.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{shop.shop_name}</p>
                  <p className="text-sm text-gray-400">aibotbanao.com/chat/{shop.slug}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    shop.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {shop.is_active ? 'Active' : 'Off'}
                  </span>
                  <Link
                    href={`/shops/${shop.id}`}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {!canCreate && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-800">
              Aap ne maximum 3 shops bana li hain. Naya shop banane ke liye pehle ek delete karein.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
