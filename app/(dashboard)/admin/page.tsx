import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { Profile, Shop, AuditLog } from '@/lib/supabase'
import AdminActions from './AdminActions'

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profileRaw || (profileRaw as { role: string }).role !== 'super_admin') notFound()

  const admin = await createSupabaseAdminClient()

  const [{ data: usersRaw }, { data: shopsRaw }, { data: logsRaw }] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('shops').select('id, shop_name, slug, owner_id, status, is_active, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
    admin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  const profiles = (usersRaw ?? []) as Profile[]
  const shops = (shopsRaw ?? []) as (Pick<Shop, 'id' | 'shop_name' | 'slug' | 'owner_id' | 'status' | 'is_active' | 'created_at'>)[]
  const logs = (logsRaw ?? []) as AuditLog[]

  const totalUsers = profiles.length
  const verifiedUsers = profiles.filter((p) => p.is_verified).length
  const totalShops = shops.length
  const activeShops = shops.filter((s) => s.is_active).length

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
        </div>
        <p className="text-sm text-gray-500 ml-11">Platform management — super admin only</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={totalUsers}
          accent="bg-blue-50"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Verified"
          value={verifiedUsers}
          accent="bg-green-50"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Shops"
          value={totalShops}
          accent="bg-violet-50"
          icon={
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Shops"
          value={activeShops}
          accent="bg-amber-50"
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Users table */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Users</h2>
            <p className="text-xs text-gray-400 mt-0.5">{totalUsers} registered</p>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {totalUsers}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === profiles.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">
                          {(p.full_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.full_name || <span className="text-gray-400 italic">No name</span>}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.role === 'super_admin'
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.role === 'super_admin' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
                      )}
                      {p.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.is_verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${p.is_verified ? 'bg-green-500' : 'bg-amber-400'}`} />
                      {p.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(p.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <AdminActions profileId={p.id} currentRole={p.role} actorId={user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Shops table */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Shops</h2>
            <p className="text-xs text-gray-400 mt-0.5">{activeShops} active of {totalShops}</p>
          </div>
          <span className="bg-violet-50 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {totalShops}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s, i) => (
                <tr
                  key={s.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === shops.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{s.shop_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/chat/{s.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">{s.owner_id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(s.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit log */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Audit Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last 50 events</p>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        {logs.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Koi log nahi abhi tak</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {logs.map((log) => (
              <li key={log.id} className="px-6 py-3.5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{log.action}</p>
                    <time className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {new Date(log.created_at).toLocaleString('en-PK', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  {log.target_type && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.target_type}
                      {log.target_id && <span className="font-mono ml-1">{log.target_id.slice(0, 8)}</span>}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
