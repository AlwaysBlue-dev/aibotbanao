import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Sidebar from '@/app/components/Sidebar'
import MobileNav from '@/app/components/MobileNav'
import ThemeProvider from '@/app/components/ThemeProvider'
import type { Profile } from '@/lib/supabase'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as Profile | null

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar profile={typedProfile} />
        <MobileNav profile={typedProfile} />
        <div className="lg:pl-60">
          <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
