import Image from 'next/image'
import UserMenu from '@/components/UserMenu'

interface AdminHeaderProps {
  title: string
  highlight?: string
}

export default function AdminHeader({ title, highlight }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full h-24 sm:h-28 bg-gray-100 shadow-md">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Image
          src="/img/cliente/bg_testeira.png"
          alt="Testeira Quattro Construtora"
          fill
          className="object-cover object-right"
          priority
        />
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto h-full px-4 sm:px-8 md:px-12 flex items-center justify-between">
        <div className="absolute -top-3 sm:-top-4 left-4 sm:left-8 md:left-12 w-20 h-20 sm:w-24 sm:h-24 z-20">
          <Image
            src="/img/cliente/logo_construtora.png"
            alt="Quattro Construtora"
            fill
            className="object-contain object-top"
            priority
          />
        </div>

        <div className="pl-20 sm:pl-28 md:pl-36">
          <h1 className="text-white md:text-black text-xs sm:text-sm md:text-base font-normal tracking-wider uppercase leading-snug drop-shadow-sm md:drop-shadow-none">
            {title} {highlight && <span className="font-bold">{highlight}</span>}
          </h1>
        </div>

        <UserMenu />
      </div>
    </header>
  )
}