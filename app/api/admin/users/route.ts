import { type NextRequest } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify caller is super_admin
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!callerProfile || (callerProfile as { role: string }).role !== 'super_admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { profileId, action } = body ?? {}

  if (!profileId || !['promote', 'demote'].includes(action)) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const newRole = action === 'promote' ? 'super_admin' : 'shop_owner'
  const admin = await createSupabaseAdminClient()

  const { error } = await admin.from('profiles').update({ role: newRole }).eq('id', profileId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Write audit log
  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: `user_${action}d`,
    target_type: 'profile',
    target_id: profileId,
    metadata: { new_role: newRole },
  })

  return Response.json({ ok: true })
}
