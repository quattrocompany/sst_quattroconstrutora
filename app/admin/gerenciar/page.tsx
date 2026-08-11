'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'
import Footer from '@/components/Footer'

export const STANDARD_DOCS = [
  { id: 'RG_CPF', label: 'RG / CPF' },
  { id: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de Residência' },
  { id: 'CONTRATO_TRABALHO', label: 'Contrato de Trabalho' },
  { id: 'CTPS', label: 'CTPS / Carteira de Trabalho' },
  { id: 'ASO', label: 'ASO - Atestado de Saúde' },
  { id: 'NR01', label: 'NR-01 (Ordem de Serviço)' },
  { id: 'NR06', label: 'NR-06 (Ficha de EPI)' },
  { id: 'NR10', label: 'NR-10 (Eletricidade)' },
  { id: 'NR11', label: 'NR-11 (Movimentação de Cargas)' },
  { id: 'NR12', label: 'NR-12 (Máquinas/Equipamentos)' },
  { id: 'NR18', label: 'NR-18 (Construção Civil)' },
  { id: 'NR35', label: 'NR-35 (Trabalho em Altura)' },
]

interface WorkerItem {
  id: string
  full_name: string
  cpf: string
  status: 'APTO' | 'PENDENTE' | 'INAPTO'
  job_role?: string
  exempt_docs?: string[]
  subcontractor_id: string
  company_name: string
}

interface DocumentItem {
  id: string
  title: string
  document_type: string
  category: string
  file_path: string
  issue_date: string | null
  expiry_date: string | null
  worker_id: string | null
  subcontractor_id: string | null
  created_at: string
}

export default function AdminGerenciarPage() {
  const [activeTab, setActiveTab] = useState<'HOMOLOGACAO' | 'DOCUMENTOS'>('HOMOLOGACAO')
  const [workers, setWorkers] = useState<WorkerItem[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('TODAS')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal de Homologação
  const [selectedWorkerForHomolog, setSelectedWorkerForHomolog] = useState<WorkerItem | null>(null)
  const [tempExemptDocs, setTempExemptDocs] = useState<string[]>([])
  const [tempJobRole, setTempJobRole] = useState('')
  const [savingHomolog, setSavingHomolog] = useState(false)

  const supabase = createClient()

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: subs } = await supabase.from('subcontractors').select('id, name').order('name', { ascending: true })
      setCompanies(subs || [])
      const subMap = new Map((subs || []).map((s) => [s.id, s.name]))

      const { data: workersData } = await supabase.from('workers').select('*').order('full_name', { ascending: true })
      const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false })

      setDocuments(docsData || [])

      if (workersData) {
        const formattedWorkers: WorkerItem[] = workersData.map((w: any) => ({
          ...w,
          company_name: subMap.get(w.subcontractor_id) || 'Quattro Construtora',
          exempt_docs: w.exempt_docs || [],
          job_role: w.job_role || 'Operacional',
        }))
        setWorkers(formattedWorkers)
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao carregar registros.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Identifica o status de cada um dos 12 documentos de um colaborador
  const getWorkerDocStatus = (workerId: string, docId: string, exemptList: string[]) => {
    if (exemptList.includes(docId)) {
      return { status: 'DISPENSADO', label: 'Dispensado (N/A)', color: 'bg-gray-200 text-gray-700' }
    }

    const workerDocs = documents.filter((d) => d.worker_id === workerId)
    const matchingDoc = workerDocs.find((d) => {
      const docTypeUpper = (d.document_type || '').toUpperCase()
      const titleUpper = d.title.toUpperCase()
      return (
        docTypeUpper === docId ||
        docTypeUpper.includes(docId.replace('_', '')) ||
        titleUpper.includes(docId.replace('_', ' ')) ||
        (docId === 'RG_CPF' && (titleUpper.includes('RG') || titleUpper.includes('CPF'))) ||
        (docId === 'ASO' && titleUpper.includes('ASO')) ||
        (docId === 'CTPS' && titleUpper.includes('CTPS'))
      )
    })

    if (!matchingDoc) {
      return { status: 'PENDENTE', label: 'Pendente / Ausente', color: 'bg-red-100 text-red-700 font-bold' }
    }

    if (matchingDoc.expiry_date) {
      const exp = new Date(matchingDoc.expiry_date + 'T12:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (exp.getTime() < today.getTime()) {
        return { status: 'VENCIDO', label: 'Vencido', color: 'bg-amber-100 text-amber-800 font-bold' }
      }
    }

    return { status: 'ENTREGUE', label: 'Entregue / Válido', color: 'bg-emerald-100 text-emerald-800 font-bold' }
  }

  // Calcula se o colaborador está APTO baseado nos 12 documentos e nas dispensas do TST
  const calculateWorkerAptitude = (workerId: string, exemptList: string[]) => {
    for (const doc of STANDARD_DOCS) {
      const { status } = getWorkerDocStatus(workerId, doc.id, exemptList)
      if (status === 'PENDENTE' || status === 'VENCIDO') {
        return 'INAPTO'
      }
    }
    return 'APTO'
  }

  const handleOpenHomologModal = (worker: WorkerItem) => {
    setSelectedWorkerForHomolog(worker)
    setTempExemptDocs(worker.exempt_docs || [])
    setTempJobRole(worker.job_role || 'Operacional')
  }

  const toggleDocExemption = (docId: string) => {
    setTempExemptDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    )
  }

  const handleSaveHomologation = async () => {
    if (!selectedWorkerForHomolog) return
    setSavingHomolog(true)

    try {
      const newStatus = calculateWorkerAptitude(selectedWorkerForHomolog.id, tempExemptDocs)

      const { error } = await supabase
        .from('workers')
        .update({
          exempt_docs: tempExemptDocs,
          job_role: tempJobRole,
          status: newStatus,
        })
        .eq('id', selectedWorkerForHomolog.id)

      if (error) throw error

      setMessage({
        type: 'success',
        text: `Homologação de "${selectedWorkerForHomolog.full_name}" salva com sucesso! Status atual: ${newStatus}`,
      })

      setSelectedWorkerForHomolog(null)
      loadData()
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao salvar homologação: ${err.message}` })
    } finally {
      setSavingHomolog(false)
    }
  }

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm('Deseja excluir este documento permanentemente?')) return
    try {
      await supabase.storage.from('sst-documents').remove([filePath])
      const { error } = await supabase.from('documents').delete().eq('id', docId)
      if (error) throw error

      setMessage({ type: 'success', text: 'Documento excluído com sucesso!' })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.cpf.includes(searchQuery)
    const matchesCompany =
      selectedCompanyFilter === 'TODAS' ||
      w.company_name.toUpperCase() === selectedCompanyFilter.toUpperCase()
    return matchesSearch && matchesCompany
  })

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#2C2C2C] font-sans select-none w-full flex flex-col">
      <AdminHeader title="HOMOLOGAÇÃO &" highlight="GESTÃO DE DOCUMENTOS SST" />

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

        <div className="flex items-center justify-between border-b border-gray-200 pb-3 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('HOMOLOGACAO')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'HOMOLOGACAO'
                  ? 'bg-[#4A4D50] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              👷 Área de Homologação SST ({workers.length})
            </button>
            <button
              onClick={() => setActiveTab('DOCUMENTOS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'DOCUMENTOS'
                  ? 'bg-[#4A4D50] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              📄 Acervo de Documentos ({documents.length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="px-3.5 py-2 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl focus:outline-none uppercase"
            >
              <option value="TODAS">TODAS AS EMPRESAS</option>
              {companies.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome ou CPF..."
              className="px-4 py-2 bg-white border border-gray-300 text-xs rounded-xl focus:outline-none uppercase w-full sm:w-64 font-medium"
            />
          </div>
        </div>

        {/* ABA 1: ÁREA DE HOMOLOGAÇÃO */}
        {activeTab === 'HOMOLOGACAO' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Checklist de Homologação de Colaboradores (12 Documentos Padrão)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Clique em &quot;Homologar / Dispensar NRs&quot; para dispensar documentos que não se aplicam à função do colaborador.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-gray-400 uppercase">Carregando colaboradores...</div>
            ) : filteredWorkers.length === 0 ? (
              <div className="p-12 text-center text-xs font-medium text-gray-500">Nenhum colaborador encontrado.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredWorkers.map((worker) => {
                  const calculatedStatus = calculateWorkerAptitude(worker.id, worker.exempt_docs || [])

                  return (
                    <div key={worker.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-gray-50/60 transition-colors">
                      <div className="space-y-1.5 min-w-[260px]">
                        <div className="flex items-center gap-2.5">
                          <p className="text-sm font-bold text-gray-900 uppercase">{worker.full_name}</p>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                              calculatedStatus === 'APTO'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {calculatedStatus}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          Empresa: <strong className="text-gray-800">{worker.company_name}</strong> | CPF: {worker.cpf}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Função: <strong className="text-gray-700">{worker.job_role || 'Operacional'}</strong>
                        </p>
                      </div>

                      {/* Grade dos 12 Documentos em Miniatura */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 flex-1 max-w-2xl text-[10px]">
                        {STANDARD_DOCS.map((doc) => {
                          const docStatus = getWorkerDocStatus(worker.id, doc.id, worker.exempt_docs || [])
                          return (
                            <div
                              key={doc.id}
                              className={`p-1.5 rounded-lg border text-center font-semibold truncate ${
                                docStatus.status === 'ENTREGUE'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : docStatus.status === 'DISPENSADO'
                                  ? 'border-gray-200 bg-gray-100 text-gray-500 line-through'
                                  : 'border-red-200 bg-red-50 text-red-700'
                              }`}
                              title={`${doc.label}: ${docStatus.label}`}
                            >
                              {doc.id.replace('_', ' ')}
                            </div>
                          )
                        })}
                      </div>

                      <div>
                        <button
                          onClick={() => handleOpenHomologModal(worker)}
                          className="px-4 py-2 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Homologar / Dispensar NRs
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: ACERVO GERAL DE DOCUMENTOS */}
        {activeTab === 'DOCUMENTOS' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Todos os Documentos Cadastrados ({documents.length})
              </h3>
            </div>

            {documents.length === 0 ? (
              <div className="p-12 text-center text-xs font-medium text-gray-500">Nenhum documento cadastrado.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {documents.map((d) => (
                  <div key={d.id} className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-900 uppercase">{d.title}</p>
                      <p className="text-[11px] text-gray-500">
                        Tipo: <strong className="text-gray-700">{d.document_type || 'OUTROS'}</strong> | Categoria: {d.category} | Emissão: {d.issue_date || 'N/I'} | Validade: {d.expiry_date || 'Indeterminado'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const { data } = supabase.storage.from('sst-documents').getPublicUrl(d.file_path)
                          if (data?.publicUrl) window.open(data.publicUrl, '_blank')
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        Abrir PDF
                      </button>

                      <button
                        onClick={() => handleDeleteDocument(d.id, d.file_path)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-[10px] font-bold uppercase border border-red-200 transition-colors cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL DE HOMOLOGAÇÃO SST DO TST */}
      {selectedWorkerForHomolog && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
            <div className="bg-[#4A4D50] p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-300">
                  Área de Homologação Técnica de SST
                </span>
                <h3 className="text-lg font-bold uppercase tracking-wide">
                  {selectedWorkerForHomolog.full_name}
                </h3>
                <p className="text-xs text-gray-300">
                  Empresa: <strong className="text-white">{selectedWorkerForHomolog.company_name}</strong> | CPF: {selectedWorkerForHomolog.cpf}
                </p>
              </div>

              <button
                onClick={() => setSelectedWorkerForHomolog(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Função / Cargo do Colaborador
                </label>
                <input
                  type="text"
                  value={tempJobRole}
                  onChange={(e) => setTempJobRole(e.target.value)}
                  placeholder="Ex: Eletricista, Encarregado, Ajudante Geral, Engenheiro..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white uppercase"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Checklist dos 12 Documentos Obrigatórios
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    Marque a caixa para <strong>Dispensar / Não Exigir</strong> na função deste colaborador.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STANDARD_DOCS.map((doc) => {
                    const isExempt = tempExemptDocs.includes(doc.id)
                    const docStatus = getWorkerDocStatus(
                      selectedWorkerForHomolog.id,
                      doc.id,
                      tempExemptDocs
                    )

                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleDocExemption(doc.id)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isExempt
                            ? 'bg-gray-100 border-gray-300 opacity-70'
                            : docStatus.status === 'ENTREGUE'
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-red-50/60 border-red-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-900">{doc.label}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${docStatus.color}`}>
                            {docStatus.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-gray-600 uppercase">Dispensar:</label>
                          <input
                            type="checkbox"
                            checked={isExempt}
                            onChange={() => {}}
                            className="w-4 h-4 text-[#4A4D50] rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Status Calculado Automaticamente:</p>
                  <p className="text-xs font-black text-gray-900">
                    {calculateWorkerAptitude(selectedWorkerForHomolog.id, tempExemptDocs) === 'APTO'
                      ? '✓ APTO AO TRABALHO (Todos os documentos obrigatórios entregues)'
                      : '✕ INAPTO (Faltam documentos obrigatórios não dispensados)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedWorkerForHomolog(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveHomologation}
                disabled={savingHomolog}
                className="px-6 py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingHomolog ? 'Salvando...' : 'Salvar Homologação SST'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer compact />
    </div>
  )
}