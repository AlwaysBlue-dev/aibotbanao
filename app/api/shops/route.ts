import { type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ shops: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid JSON' }, { status: 400 })

  const { shop_name, slug, whatsapp_number, description, bot_language, bot_config } = body

  if (!shop_name?.trim() || !slug?.trim()) {
    return Response.json({ error: 'shop_name and slug are required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('shops').insert({
    owner_id: user.id,
    shop_name: shop_name.trim(),
    slug: slug.trim(),
    whatsapp_number: whatsapp_number?.trim() || null,
    description: description?.trim() || null,
    bot_language: bot_language ?? 'auto',
    bot_config: bot_config ?? {},
    status: 'active',
    is_active: true,
    deleted_at: null,
  }).select().single()

  if (error) {
    const msg = error.message.includes('Shop limit')
      ? 'Shop limit reached. You can only create up to 3 shops.'
      : error.message.includes('unique') || error.message.includes('duplicate')
      ? 'Slug already taken.'
      : error.message
    return Response.json({ error: msg }, { status: 400 })
  }

  return Response.json({ shop: data }, { status: 201 })
}
