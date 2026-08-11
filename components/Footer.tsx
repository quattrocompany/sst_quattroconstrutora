import Image from 'next/image'

interface FooterProps {
  compact?: boolean
}

export default function Footer({ compact = false }: FooterProps) {
  return (
    <footer
      className={`relative w-full mt-auto overflow-hidden ${
        compact ? 'h-24 md:h-28' : 'h-32 md:h-40'
      }`}
    >
      <Image
        src="/img/rodape/bg_rodape.png"
        alt="Rodapé Quattro Construtora"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="relative z-10 w-full h-full flex items-end justify-center pb-4 bg-black/10">
        <p className="text-[10px] sm:text-[11px] text-gray-300 font-medium tracking-wide text-center px-4">
          © 2026 Quattro Company Construtora e Incorporadora Ltda. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}