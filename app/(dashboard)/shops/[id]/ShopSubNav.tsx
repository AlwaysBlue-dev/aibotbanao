'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Overview', segment: '' },
  { label: 'Orders', segment: 'orders' },
  { label: 'Analytics', segment: 'analytics' },
  { label: 'Settings', segment: 'settings' },
]

export default function ShopSubNav({ shopId }: { shopId: string }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {tabs.map(({ label, segment }) => {
        const href = segment ? `/shops/${shopId}/${segment}` : `/shops/${shopId}`
        const isActive = segment
          ? pathname.startsWith(`/shops/${shopId}/${segment}`)
          : pathname === `/shops/${shopId}`

        return (
          <Link
            key={segment || 'overview'}
            href={href}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
