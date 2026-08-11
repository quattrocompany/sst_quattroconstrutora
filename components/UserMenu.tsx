'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function isQuattroAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const domain = email.toLowerCase().split('@')[1]
  return domain === 'quattroinc.com.br' || domain === 'quattroconstrutora.com.br'
}

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState({
    name: 'Equipe Quattro SST',
    email: 'admin.sst@quattroinc.com.br',
    company: 'Quattro Construtora',
    role: 'Gestor Geral de SST',
    workSite: 'Amazon Fulfillment Center - SP02',
  })

  const isQuattroUser = isQuattroAdminEmail(currentUser.email)

  useEffect(() => {
    async function loadAuthUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        const isAdmin = isQuattroAdminEmail(user.email)
        setCurrentUser({
          name: user.user_metadata?.full_name || user.email.split('@')[0].toUpperCase(),
          email: user.email,
          company: isAdmin ? 'Quattro Construtora' : 'Amazon Brasil',
          role: isAdmin ? 'Administrador / SST Interno' : 'Fiscal de Obra / Cliente',
          workSite: 'Amazon Fulfillment Center - SP02',
        })
      }
    }
    loadAuthUser()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { href: '/admin/upload', label: 'Upload & Extração com IA', icon: '🤖' },
    { href: '/admin/gerenciar', label: 'Gerenciar Documentos SST', icon: '📋' },
    { href: '/admin/midia', label: 'Gestão de Mídias & Treinamentos', icon: '🎬' },
    { href: '/admin/empresas', label: 'Cadastrar Empresas & Clientes', icon: '🏢' },
    { href: '/cliente', label: 'Visualizar Portal do Cliente', icon: '📄' },
  ]

  return (
    <div className="relative z-[100]" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-white/90 hover:bg-white backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-sm transition-all hover:shadow cursor-pointer"
      >
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm ${
            isQuattroUser
              ? 'bg-[#4A4D50] text-white'
              : 'bg-[#131921] text-amber-400 font-black'
          }`}
        >
          {isQuattroUser ? 'Q' : 'A'}
        </div>

        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-bold text-gray-900 leading-none uppercase">
              {currentUser.company}
            </p>
            {isQuattroUser && (
              <span className="bg-black text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                Admin
              </span>
            )}
          </div>
          <p className="text-[9px] text-gray-500 font-medium leading-none mt-1 truncate max-w-[140px]">
            {currentUser.name}
          </p>
        </div>
        <span className="text-[10px] text-gray-400">▼</span>
      </button>

      {/* DROPDOWN DINÂMICO */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 space-y-3 z-[100] text-left animate-in fade-in duration-150">
          <div className="border-b border-gray-100 pb-3">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isQuattroUser ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              ● {isQuattroUser ? 'Equipe Interna Quattro' : 'Acesso Cliente'}
            </span>
            <h4 className="text-xs font-bold text-gray-900 uppercase mt-2">{currentUser.company}</h4>
            <p className="text-[11px] text-gray-600">{currentUser.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
          </div>

          <div className="space-y-1 text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <p className="text-gray-400 text-[10px] uppercase font-bold">Obra / Unidade:</p>
            <p className="font-semibold text-gray-800">{currentUser.workSite}</p>
          </div>

          {isQuattroUser ? (
            <div className="space-y-1.5 pt-1 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                Menu Administrativo (Quattro)
              </p>
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gray-100 text-black font-bold'
                          : 'text-gray-700 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="pt-1 text-[11px] text-gray-500 italic px-1">
              Modo de consulta exclusivo para documentações e treinamentos.
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                alert('Sessão encerrada com sucesso.')
                setIsOpen(false)
              }}
              className="w-full text-center py-2 text-red-600 hover:bg-red-50 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      )}
    </div>
  )
}