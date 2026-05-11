import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Set Up Your Free Bot | AIBotBanao',
  description:
    'Create a free AI chatbot for your business in 5 minutes. No technical skills needed. Works in Urdu and English.',
  openGraph: {
    title: 'Set Up Your Free Bot — AIBotBanao',
    description: 'Create a free AI chatbot for your business in 5 minutes.',
  },
}

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/setup')
  return <>{children}</>
}
