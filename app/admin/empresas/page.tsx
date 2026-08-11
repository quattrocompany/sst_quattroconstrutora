'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'
import Footer from '@/components/Footer'

interface CompanyItem {
  id: string
  name: string
  logo_url?: string | null
  created_at: string
}

interface ProfileItem {
  id: string
  full_name: string
  email: string
  role: string
  work_site: string
  company_id: string | null
  company_name?: string
}

export default function AdminEmpresasPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [activeTab, setActiveTab] = useState<'EMPRESAS' | 'USUARIOS'>('EMPRESAS')
  const [loading, setLoading] = useState(true)
  const [savingCompany, setSavingCompany] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form de Empresa
  const [companyForm, setCompanyForm] = useState({ name: '' })

  // Form de Criação de Usuário
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    company_id: '',
    role: 'CLIENTE',
    work_site: 'Amazon Fulfillment Center - SP02',
  })

  // Modal de Edição de Usuário
  const [editingUser, setEditingUser] = useState<ProfileItem | null>(null)
  const [editForm, setEditForm] = useState({
    userId: '',
    full_name: '',
    email: '',
    password: '',
    company_id: '',
    role: 'CLIENTE',
    work_site: '',
  })

  const supabase = createClient()

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: subs, error: subError } = await supabase
        .from('subcontractors')
        .select('*')
        .order('name', { ascending: true })

      if (subError) throw subError
      setCompanies(subs || [])

      const companyMap = new Map((subs || []).map((s) => [s.id, s.name]))

      const { data: profs, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!profError && profs) {
        const formatted = profs.map((p: any) => ({
          ...p,
          company_name: p.company_id ? companyMap.get(p.company_id) : 'Quattro Construtora',
        }))
        setProfiles(formatted)
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao carregar dados do sistema.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Cadastrar Empresa
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyForm.name.trim()) return

    setSavingCompany(true)
    setMessage(null)

    try {
      let logoUrl: string | null = null

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const logoPath = `logos/${Date.now()}_${companyForm.name.trim().toLowerCase().replace(/\s+/g, '_')}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('sst-documents')
          .upload(logoPath, logoFile, { upsert: true, contentType: logoFile.type || 'image/png' })

        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage.from('sst-documents').getPublicUrl(logoPath)
        logoUrl = publicData.publicUrl
      }

      const { error } = await supabase.from('subcontractors').insert({
        name: companyForm.name.trim().toUpperCase(),
        logo_url: logoUrl,
      })

      if (error) throw error

      setMessage({ type: 'success', text: `Empresa "${companyForm.name.toUpperCase()}" cadastrada!` })
      setCompanyForm({ name: '' })
      setLogoFile(null)
      loadData()
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao salvar empresa: ${err.message}` })
    } finally {
      setSavingCompany(false)
    }
  }

  // Criar Usuário (executado via RPC direto no banco)
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userForm.email || !userForm.password || !userForm.full_name) return

    setSavingUser(true)
    setMessage(null)

    try {
      const { error } = await supabase.rpc('admin_create_user', {
        new_email: userForm.email.trim(),
        new_password: userForm.password,
        new_full_name: userForm.full_name.trim(),
        new_company_id: userForm.company_id || null,
        new_role: userForm.role,
        new_work_site: userForm.role === 'ADMIN_QUATTRO' ? '' : userForm.work_site,
      })

      if (error) throw error

      setMessage({ type: 'success', text: `Acesso de "${userForm.full_name}" criado com sucesso!` })
      setUserForm({
        full_name: '',
        email: '',
        password: '',
        company_id: '',
        role: 'CLIENTE',
        work_site: 'Amazon Fulfillment Center - SP02',
      })

      await loadData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao criar conta de usuário.' })
    } finally {
      setSavingUser(false)
    }
  }

  // Abrir Modal de Edição
  const handleOpenEditModal = (user: ProfileItem) => {
    setEditingUser(user)
    setEditForm({
      userId: user.id,
      full_name: user.full_name,
      email: user.email,
      password: '',
      company_id: user.company_id || '',
      role: user.role || 'CLIENTE',
      work_site: user.work_site || '',
    })
  }

  // Salvar Edição de Usuário (executado via RPC)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.full_name || !editForm.email || !editForm.userId) return

    setSavingEdit(true)
    setMessage(null)

    try {
      const { error } = await supabase.rpc('admin_update_user', {
        target_user_id: editForm.userId,
        new_email: editForm.email.trim(),
        new_password: editForm.password.trim() || null,
        new_full_name: editForm.full_name.trim(),
        new_company_id: editForm.company_id || null,
        new_role: editForm.role,
        new_work_site: editForm.role === 'ADMIN_QUATTRO' ? '' : editForm.work_site,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: `Cadastro de "${editForm.full_name}" atualizado com sucesso!`,
      })
      setEditingUser(null)
      await loadData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar dados.' })
    } finally {
      setSavingEdit(false)
    }
  }

  // Excluir Empresa
  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir a empresa "${name}"?`)) return
    try {
      const { error } = await supabase.from('subcontractors').delete().eq('id', id)
      if (error) throw error
      setMessage({ type: 'success', text: 'Empresa removida com sucesso!' })
      setCompanies((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  // Excluir Usuário (executado via RPC)
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Deseja remover o acesso de "${name}"?`)) return
    setDeletingUserId(id)
    setMessage(null)

    try {
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: id })
      if (error) throw error

      setMessage({ type: 'success', text: `Acesso de "${name}" removido!` })
      setProfiles((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao remover usuário: ${err.message}` })
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#2C2C2C] font-sans select-none w-full flex flex-col">
      <AdminHeader title="CADASTRO DE" highlight="EMPRESAS & ACESSOS" />

      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 py-8 space-y-6 flex-1">
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

        <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveTab('EMPRESAS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'EMPRESAS'
                ? 'bg-[#4A4D50] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            🏢 Empresas & Clientes ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab('USUARIOS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'USUARIOS'
                ? 'bg-[#4A4D50] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            👤 Logins & Usuários ({profiles.length})
          </button>
        </div>

        {activeTab === 'EMPRESAS' && (
          <div className="space-y-6">
            <form onSubmit={handleCompanySubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-5">
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
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ name: e.target.value })}
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
                  disabled={savingCompany}
                  className="px-6 py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingCompany ? 'Cadastrando...' : '+ Cadastrar Empresa e Logo'}
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
                <div className="p-12 text-center text-xs font-bold text-gray-400 uppercase">Carregando...</div>
              ) : companies.length === 0 ? (
                <div className="p-12 text-center text-xs font-medium text-gray-500">Nenhuma empresa cadastrada.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {companies.map((company) => (
                    <div key={company.id} className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
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
                        onClick={() => handleDeleteCompany(company.id, company.name)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-[10px] font-bold uppercase border border-red-200 transition-colors cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'USUARIOS' && (
          <div className="space-y-6">
            <form onSubmit={handleUserSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-3">
                Criar Acesso / Login de Usuário
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Nome Completo do Usuário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@empresa.com.br"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Senha de Acesso *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Empresa Vinculada
                  </label>
                  <select
                    value={userForm.company_id}
                    onChange={(e) => setUserForm({ ...userForm, company_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                  >
                    <option value="">Selecione a Empresa...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Tipo de Perfil
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                  >
                    <option value="CLIENTE">CLIENTE / FISCAL DE OBRA</option>
                    <option value="ADMIN_QUATTRO">ADMINISTRADOR QUATTRO SST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Obra / Unidade
                  </label>
                  <input
                    type="text"
                    value={userForm.work_site}
                    onChange={(e) => setUserForm({ ...userForm, work_site: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-6 py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingUser ? 'Criando Conta...' : '+ Criar Conta de Acesso'}
                </button>
              </div>
            </form>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Usuários com Acesso Ativo ({profiles.length})
                </h3>
              </div>

              {profiles.length === 0 ? (
                <div className="p-12 text-center text-xs font-medium text-gray-500">
                  Nenhum usuário cadastrado no momento.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {profiles.map((p) => (
                    <div key={p.id} className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors flex-wrap gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-900 uppercase">{p.full_name}</p>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              p.role === 'ADMIN_QUATTRO' || p.role === 'admin_quattro'
                                ? 'bg-black text-white'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono">{p.email}</p>
                        <p className="text-[10px] text-gray-400">
                          Empresa: <strong className="text-gray-700">{p.company_name}</strong> | Obra: {p.work_site || 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[10px] font-bold uppercase border border-gray-200 transition-colors cursor-pointer"
                        >
                          ✏️ Editar Acesso
                        </button>

                        <button
                          onClick={() => handleDeleteUser(p.id, p.full_name)}
                          disabled={deletingUserId === p.id}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-[10px] font-bold uppercase border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {deletingUserId === p.id ? 'Excluindo...' : 'Excluir Acesso'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Edição de Usuário / Senha */}
      {editingUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col shadow-2xl border border-gray-200">
            <div className="bg-[#4A4D50] p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-300">
                  Gestão de Acesso
                </span>
                <h3 className="text-base font-bold uppercase tracking-wide">
                  Editar Cadastro de {editingUser.full_name}
                </h3>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Nova Senha (opcional)
                  </label>
                  <input
                    type="password"
                    placeholder="Deixe em branco para não alterar"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Empresa Vinculada
                  </label>
                  <select
                    value={editForm.company_id}
                    onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                  >
                    <option value="">Quattro Construtora (Interna)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Tipo de Perfil
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                  >
                    <option value="CLIENTE">CLIENTE / FISCAL DE OBRA</option>
                    <option value="ADMIN_QUATTRO">ADMINISTRADOR QUATTRO SST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Obra / Unidade
                  </label>
                  <input
                    type="text"
                    value={editForm.work_site}
                    onChange={(e) => setEditForm({ ...editForm, work_site: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer compact />
    </div>
  )
}