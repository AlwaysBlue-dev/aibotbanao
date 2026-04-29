import Link from 'next/link'
import Image from 'next/image'

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
      <Image src="/newlogo.png" alt="AIBotBanao logo" width={28} height={28} className="h-7 w-7 shrink-0" />
      <span className={`font-bold ${textClassName}`}>AIBotBanao</span>
    </Link>
  )
}
