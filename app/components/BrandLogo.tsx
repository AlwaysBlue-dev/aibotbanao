import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  className?: string
  textClassName?: string
}

export default function BrandLogo({
  href = '/',
  className = '',
  textClassName = 'text-xl',
}: BrandLogoProps) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 text-green-600 ${className}`}>
      <svg
        className="h-7 w-7 shrink-0"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="26" height="26" rx="9" fill="#16A34A" />
        <path d="M16 7.2V9.1" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="6.1" r="1.3" fill="white" />
        <rect x="8.2" y="10.2" width="15.6" height="12.8" rx="4.6" fill="white" />
        <circle cx="6.9" cy="16.6" r="1.6" fill="white" />
        <circle cx="25.1" cy="16.6" r="1.6" fill="white" />
        <circle cx="13.3" cy="15.8" r="1.65" fill="#16A34A" />
        <circle cx="18.7" cy="15.8" r="1.65" fill="#16A34A" />
        <path
          d="M12.5 19.1C13.3 20.1 14.5 20.7 16 20.7C17.5 20.7 18.7 20.1 19.5 19.1"
          stroke="#16A34A"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span className={`font-bold ${textClassName}`}>AIBotBanao</span>
    </Link>
  )
}
