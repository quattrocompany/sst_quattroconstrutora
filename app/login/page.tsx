'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/cliente')
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-start bg-gray-200 p-8 md:p-24 overflow-hidden select-none">
      
      {/* Imagem de Fundo Prédio (Lado Direito) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/img/login/background_login.png"
          alt="Background Quattro Construtora"
          fill
          className="object-cover object-right"
          priority
        />
      </div>

      {/* Container de Conteúdo Alinhado à Esquerda */}
      <div className="relative z-10 w-full max-w-2xl ml-0 md:ml-12 flex flex-col items-start">
        
        {/* Título do Portal */}
        <h1 className="text-black text-sm md:text-base font-normal tracking-wide uppercase leading-snug mb-8">
          PORTAL DE <span className="font-bold">SEGURANÇA</span><br />
          DO TRABALHO, SAÚDE E MEIO AMBIENTE
        </h1>

        {/* Estrutura Horizontal: Logo + Campos de Login (Alinhados ao Centro Vertical) */}
        <div className="flex flex-col sm:flex-row items-center gap-10 md:gap-12 w-full">
          
          {/* Badge Escura da Logo Quattro */}
          <div className="relative w-36 h-36 md:w-44 md:h-44 shrink-0 rounded-xl overflow-hidden shadow-sm">
            <Image
              src="/img/login/logo_construtora.png"
              alt="Quattro Construtora"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Form de Autenticação Alinhado ao Centro na Altura */}
          <form onSubmit={handleLogin} className="flex flex-col justify-center gap-2.5 w-full max-w-[250px]">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-600 text-xs p-2 rounded text-center">
                {error}
              </div>
            )}

            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="USUÁRIO"
                className="w-full px-4 py-2.5 bg-[#EDEDED] border border-gray-300/60 text-gray-800 text-xs rounded-md focus:outline-none focus:bg-white focus:border-gray-400 transition-colors placeholder-gray-500 uppercase font-medium tracking-wider"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SENHA"
                className="w-full px-4 py-2.5 bg-[#EDEDED] border border-gray-300/60 text-gray-800 text-xs rounded-md focus:outline-none focus:bg-white focus:border-gray-400 transition-colors placeholder-gray-500 uppercase font-medium tracking-wider"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-fit px-6 py-2.5 bg-[#3E3E3E] hover:bg-black text-white font-bold text-xs tracking-widest uppercase rounded-md transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'ACESSANDO...' : 'ACESSAR'}
            </button>
          </form>

        </div>

      </div>
    </div>
  )
}