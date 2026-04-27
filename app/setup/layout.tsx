import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set Up Your Free Bot | AIBotBanao',
  description:
    'Create a free AI chatbot for your business in 5 minutes. No technical skills needed. Works in Urdu and English.',
  openGraph: {
    title: 'Set Up Your Free Bot — AIBotBanao',
    description: 'Create a free AI chatbot for your business in 5 minutes.',
  },
}

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
