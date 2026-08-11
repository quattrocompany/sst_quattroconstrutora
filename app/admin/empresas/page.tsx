'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'

interface CompanyItem {
  id: string
  name: string
  logo_url?: string | null
  created_at: string
}

export default function AdminEmpresasPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
  })

  const supabase = createClient()

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setCompanies(data || [])
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao carregar lista de empresas.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    setMessage(null)

    try {
      let logoUrl: string | null = null

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const logoPath = `logos/${Date.now()}_${formData.name.trim().toLowerCase().replace(/\s+/g, '_')}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('sst-documents')
          .upload(logoPath, logoFile, {
            upsert: true,
            contentType: logoFile.type || 'image/png',
          })

        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage.from('sst-documents').getPublicUrl(logoPath)
        logoUrl = publicData.publicUrl
      }

      const { error } = await supabase.from('subcontractors').insert({
        name: formData.name.trim().toUpperCase(),
        logo_url: logoUrl,
      })

      if (error) throw error

      setMessage({ type: 'success', text: `Empresa/Cliente "${formData.name.toUpperCase()}" cadastrado com sucesso!` })
      setFormData({ name: '' })
      setLogoFile(null)
      loadCompanies()
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao salvar: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir a empresa "${name}"?`)) return

    try {
      const { error } = await supabase.from('subcontractors').delete().eq('id', id)
      if (error) throw error

      setMessage({ type: 'success', text: 'Empresa removida com sucesso!' })
      setCompanies((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao excluir: ${err.message}` })
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#2C2C2C] font-sans select-none w-full flex flex-col">
      <AdminHeader title="CADASTRO DE" highlight="EMPRESAS & CLIENTES" />

      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 py-8 space-y-8 flex-1">
        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-bold ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-3">
            Cadastrar Empresa ou Cliente
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Razão Social ou Nome Fantasia *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: AMAZON BRASIL / SERTTA ENGENHARIA"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Logotipo da Empresa (PNG / SVG sem fundo)
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Cadastrando...' : '+ Cadastrar Empresa e Logotipo'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Empresas Cadastradas ({companies.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              Carregando empresas...
            </div>
          ) : companies.length === 0 ? (
            <div className="p-12 text-center text-xs font-medium text-gray-500">
              Nenhuma empresa cadastrada no momento.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {company.logo_url ? (
                      <div className="relative w-16 h-10 bg-gray-50 rounded border p-1">
                        <Image src={company.logo_url} alt={company.name} fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-gray-500">
                        SEM LOGO
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-900 uppercase">{company.name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(company.id, company.name)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-[10px] font-bold uppercase border border-red-200 transition-colors cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="relative w-full h-24 md:h-28 mt-auto overflow-hidden">
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
    </div>
  )
}