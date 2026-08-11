'use client'

import Image from 'next/image'
import UserMenu from '@/components/UserMenu'

interface ClientHeaderProps {
  isScrolled: boolean
  clientLogoUrl?: string | null
}

export default function ClientHeader({ isScrolled, clientLogoUrl }: ClientHeaderProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 w-full bg-gray-100 shadow-md transition-all duration-300 ease-out ${
        isScrolled ? 'h-20 sm:h-22' : 'h-48 sm:h-52'
      }`}
    >
      {/* Recorte isolado do fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Image
          src="/img/cliente/bg_testeira.png"
          alt="Testeira Quattro Construtora"
          fill
          className="object-cover object-right"
          priority
        />
      </div>

      <div className="relative w-full max-w-[1440px] mx-auto h-full px-4 sm:px-8 md:px-12 flex items-center justify-between">
        
        {/* LOGOTIPOS INTEGRADOS LADO A LADO (QUATTRO | AMAZON) */}
        <div
          className={`absolute z-50 flex items-center gap-3 sm:gap-4 transition-all duration-300 ease-out ${
            isScrolled
              ? '-top-3 sm:-top-4 left-4 sm:left-8 md:left-12'
              : '-top-6 sm:-top-7 md:-top-8 left-4 sm:left-8 md:left-12'
          }`}
        >
          {/* Logo Quattro */}
          <div
            className={
              isScrolled
                ? 'relative w-20 h-24 sm:w-22 sm:h-28'
                : 'relative w-28 h-36 sm:w-32 sm:h-40 md:w-36 md:h-44'
            }
          >
            <Image
              src="/img/cliente/logo_construtora.png"
              alt="Quattro Construtora"
              fill
              className="object-contain object-top drop-shadow-md"
              priority
            />
          </div>

          {/* Linha Divisória */}
          <div className="h-8 sm:h-10 w-[1.5px] bg-gray-400/50" />

          {/* Logo Dinâmico do Cliente */}
          <div className="flex flex-col justify-center">
            {clientLogoUrl ? (
              <div className="relative w-20 sm:w-28 md:w-32 h-8 sm:h-10">
                <Image src={clientLogoUrl} alt="Cliente" fill className="object-contain object-left" />
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-[14px] sm:text-base md:text-lg font-black tracking-widest text-[#232F3E] uppercase font-sans leading-none">
                  amazon
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                  BRASIL
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Título Principal - Afastado para não encavalar com o Logo no Scroll */}
        <div
          className={`absolute z-30 transition-all duration-300 ease-out ${
            isScrolled
              ? 'left-[230px] sm:left-[280px] md:left-[330px] top-1/2 -translate-y-1/2'
              : 'left-4 sm:left-8 md:left-12 bottom-3 sm:bottom-3.5 translate-y-0'
          }`}
        >
          <h1
            className={`text-white md:text-black font-normal tracking-wide uppercase leading-snug drop-shadow-sm md:drop-shadow-none transition-all duration-300 ${
              isScrolled ? 'text-[10px] sm:text-xs md:text-sm' : 'text-xs sm:text-sm md:text-base'
            }`}
          >
            PORTAL DE <span className="font-bold">SEGURANÇA</span><br />
            DO TRABALHO E MEIO AMBIENTE
          </h1>
        </div>

        {/* Menu do Usuário */}
        <div className="absolute right-4 sm:right-8 md:right-12 z-[100]">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}