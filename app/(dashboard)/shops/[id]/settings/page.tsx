import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Shop } from '@/lib/supabase'
import ShopSettingsForm from './ShopSettingsForm'

export default async function ShopSettingsPage({
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

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Shop Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Update bot config and shop details</p>
      </div>
      <ShopSettingsForm shop={shopRaw as Shop} />
    </div>
  )
}
