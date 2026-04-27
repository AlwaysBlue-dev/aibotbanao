import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import type { Order } from '@/lib/supabase'

type OrdersPayload = {
  slug?: unknown
  adminToken?: unknown
  page?: unknown
  pageSize?: unknown
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export async function POST(request: NextRequest) {
  let body: OrdersPayload
  try {
    body = (await request.json()) as OrdersPayload
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const slug = toStr(body.slug).trim()
  const adminToken = toStr(body.adminToken).trim()
  const requestedPage =
    typeof body.page === 'number' && Number.isFinite(body.page) ? Math.floor(body.page) : 1
  const requestedPageSize =
    typeof body.pageSize === 'number' && Number.isFinite(body.pageSize)
      ? Math.floor(body.pageSize)
      : 10
  const page = Math.max(1, requestedPage)
  const pageSize = Math.min(50, Math.max(1, requestedPageSize))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  if (!slug || !adminToken) {
    return Response.json({ error: 'slug and adminToken are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('slug, admin_token')
    .eq('slug', slug)
    .eq('admin_token', adminToken)
    .maybeSingle()

  if (!business) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [{ count, error: countError }, { data: recentOrders, error: ordersError }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('slug', slug),
    supabase
      .from('orders')
      .select('*')
      .eq('slug', slug)
      .order('created_at', { ascending: false })
      .range(from, to),
  ])

  if (countError || ordersError) {
    return Response.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return Response.json({
    total,
    page,
    pageSize,
    totalPages,
    recentOrders: (recentOrders ?? []) as Order[],
  })
}
