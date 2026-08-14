'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'
import Footer from '@/components/Footer'

export const STANDARD_DOC_OPTIONS = [
  { value: 'RG_CPF', label: 'RG / CPF' },
  { value: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de Residência' },
  { value: 'CONTRATO_TRABALHO', label: 'Contrato de Trabalho' },
  { value: 'CTPS', label: 'CTPS / Carteira de Trabalho' },
  { value: 'ASO', label: 'ASO - Atestado de Saúde Ocupacional' },
  { value: 'NR01', label: 'NR-01 (Ordem de Serviço)' },
  { value: 'NR06', label: 'NR-06 (Ficha de EPI)' },
  { value: 'NR10', label: 'NR-10 (Segurança em Eletricidade)' },
  { value: 'NR11', label: 'NR-11 (Movimentação de Cargas)' },
  { value: 'NR12', label: 'NR-12 (Máquinas e Equipamentos)' },
  { value: 'NR18', label: 'NR-18 (Construção Civil)' },
  { value: 'NR35', label: 'NR-35 (Trabalho em Altura)' },
  { value: 'OUTROS', label: 'Outros Documentos Técnicos' },
]

interface CompanyItem {
  id: string
  name: string
}

interface DocumentFormData {
  title: string
  document_type: string
  category: string
  worker_name: string
  worker_cpf: string
  subcontractor_name: string
  work_site: string
  issue_date: string
  expiry_date: string
  status: 'APTO' | 'PENDENTE' | 'INAPTO'
}

interface QueueItem {
  id: string
  file: File
  status: 'analyzing' | 'ready' | 'saving' | 'saved' | 'error'
  errorMessage?: string
  formData: DocumentFormData
}

function generateStandardFileName(title: string, workerName: string, dateStr?: string | null) {
  const cleanTitle = (title || 'DOCUMENTO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 -]/g, '')
    .trim()
    .toUpperCase()

  const cleanWorker = (workerName || 'COLABORADOR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 -]/g, '')
    .trim()
    .toUpperCase()

  let formattedDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '.')
  if (dateStr && dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-')
    if (year && month && day) {
      formattedDate = `${day}.${month}.${year}`
    }
  }

  return `documents/${cleanTitle} - ${cleanWorker} - ${formattedDate}.pdf`
}

export default function AdminUploadPage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [globalMessage, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadCompanies() {
      const { data } = await supabase.from('subcontractors').select('id, name').order('name', { ascending: true })
      if (data) setCompanies(data)
    }
    loadCompanies()
  }, [])

  const analyzeSingleFile = async (item: QueueItem) => {
    const payload = new FormData()
    payload.append('file', item.file)

    try {
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: payload,
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Erro ao ler PDF.')

      const data = result.data
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: 'ready',
                formData: {
                  title: data.title || item.file.name.replace('.pdf', '').toUpperCase(),
                  document_type: data.document_type || 'OUTROS',
                  category: data.category || 'PASSAPORTE',
                  worker_name: data.worker_name || '',
                  worker_cpf: data.worker_cpf || '',
                  subcontractor_name: data.subcontractor_name || '',
                  work_site: data.work_site || '',
                  issue_date: data.issue_date || '',
                  expiry_date: data.expiry_date || '',
                  status: (data.status as any) || 'APTO',
                },
              }
            : q
        )
      )
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'error', errorMessage: err.message || 'Falha ao ler arquivo.' }
            : q
        )
      )
    }
  }

  const handleAddFiles = (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    )

    if (pdfFiles.length === 0) {
      setMessage({ type: 'error', text: 'Por favor, selecione apenas arquivos no formato PDF.' })
      return
    }

    setMessage(null)

    const newItems: QueueItem[] = pdfFiles.map((f) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      file: f,
      status: 'analyzing',
      formData: {
        title: f.name.replace('.pdf', '').toUpperCase(),
        document_type: 'ASO',
        category: 'PASSAPORTE',
        worker_name: '',
        worker_cpf: '',
        subcontractor_name: '',
        work_site: '',
        issue_date: '',
        expiry_date: '',
        status: 'APTO',
      },
    }))

    setQueue((prev) => [...newItems, ...prev])
    newItems.forEach((item) => analyzeSingleFile(item))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files)
    }
  }

  const handleFieldChange = (id: string, field: keyof DocumentFormData, value: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, formData: { ...item.formData, [field]: value } }
          : item
      )
    )
  }

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }

  const saveItemToDatabase = async (item: QueueItem): Promise<boolean> => {
    try {
      const filePath = generateStandardFileName(
        item.formData.title,
        item.formData.worker_name,
        item.formData.expiry_date || item.formData.issue_date
      )

      const { error: storageError } = await supabase.storage
        .from('sst-documents')
        .upload(filePath, item.file, {
          upsert: true,
          contentType: 'application/pdf',
        })

      if (storageError) throw new Error(`Storage: ${storageError.message}`)

      // Apenas busca empresa existente (NÃO cria empresas automaticamente no cadastro)
      let subcontractorId: string | null = null
      if (item.formData.subcontractor_name) {
        const { data: existingSub } = await supabase
          .from('subcontractors')
          .select('id')
          .ilike('name', item.formData.subcontractor_name)
          .maybeSingle()

        if (existingSub) {
          subcontractorId = existingSub.id
        }
      }

      let workerId: string | null = null
      if (item.formData.worker_name) {
        const { data: existingWorker } = await supabase
          .from('workers')
          .select('id')
          .eq('cpf', item.formData.worker_cpf || '00000000000')
          .maybeSingle()

        if (existingWorker) {
          workerId = existingWorker.id
          
          if (item.formData.work_site) {
             await supabase.from('workers').update({ work_site: item.formData.work_site.toUpperCase() }).eq('id', workerId)
          }

        } else if (subcontractorId) {
          const { data: newWorker, error: workerError } = await supabase
            .from('workers')
            .insert({
              full_name: item.formData.worker_name,
              cpf: item.formData.worker_cpf || '00000000000',
              subcontractor_id: subcontractorId,
              status: item.formData.status as any,
              work_site: item.formData.work_site.toUpperCase(),
              exempt_docs: [],
            })
            .select('id')
            .single()

          if (workerError) throw workerError
          workerId = newWorker.id
        }
      }

      const { error: docError } = await supabase.from('documents').insert({
        title: item.formData.title,
        document_type: item.formData.document_type || 'OUTROS',
        category: item.formData.category as any,
        file_path: filePath,
        file_name: filePath.split('/').pop() || item.file.name,
        issue_date: item.formData.issue_date || null,
        expiry_date: item.formData.expiry_date || null,
        worker_id: workerId,
        subcontractor_id: subcontractorId,
        work_site: item.formData.work_site.toUpperCase() || null,
      })

      if (docError) throw docError
      return true
    } catch (err: any) {
      console.error('Erro ao salvar item:', err)
      return false
    }
  }

  const handleSaveAll = async () => {
    const readyItems = queue.filter((q) => q.status === 'ready')
    if (readyItems.length === 0) return

    setMessage(null)

    setQueue((prev) =>
      prev.map((q) => (q.status === 'ready' ? { ...q, status: 'saving' } : q))
    )

    let successCount = 0

    for (const item of readyItems) {
      const ok = await saveItemToDatabase(item)
      if (ok) {
        successCount++
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'saved' } : q))
        )
      } else {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', errorMessage: 'Erro ao salvar registro.' }
              : q
          )
        )
      }
    }

    if (successCount > 0) {
      setMessage({
        type: 'success',
        text: `Sucesso! ${successCount} documento(s) cadastrado(s) e vinculado(s) ao colaborador!`,
      })
    }
  }

  const readyCount = queue.filter((q) => q.status === 'ready').length
  const analyzingCount = queue.filter((q) => q.status === 'analyzing').length

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#2C2C2C] font-sans select-none w-full flex flex-col">
      <AdminHeader title="UPLOAD &" highlight="EXTRAÇÃO EM LOTE COM IA" />

      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 py-8 space-y-8 flex-1">
        <div>
          <h2 className="text-lg font-bold uppercase text-black tracking-wide">
            Upload & Extração Automática de Documentos Regulatórios
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Selecione múltiplos PDFs (ASOs, NRs, RG/CPF, Contratos, etc.). O sistema preencherá os dados e vinculará ao checklist de homologação.
          </p>
        </div>

        {globalMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-bold ${
              globalMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {globalMessage.text}
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-black bg-gray-200/60 scale-[1.01]'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf"
            onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xl shadow-sm">
              📂
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                ARRASTE E SOLTE OS PDFs AQUI OU CLIQUE PARA SELECIONAR
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Suporta ASOs, Treinamentos NRs, RGs, Fichas de EPI (Selecione múltiplos PDFs)
              </p>
            </div>
          </div>
        </div>

        {queue.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-600 space-x-3">
              <span>Fila total: <strong className="text-gray-900">{queue.length}</strong></span>
              {analyzingCount > 0 && (
                <span className="text-amber-600 font-bold">Lendo {analyzingCount} com IA...</span>
              )}
              {readyCount > 0 && (
                <span className="text-emerald-700 font-bold">{readyCount} pronto(s) para salvar</span>
              )}
            </div>

            <button
              onClick={handleSaveAll}
              disabled={readyCount === 0}
              className="w-full sm:w-auto px-8 py-3 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
            >
              Confirmar e Salvar Todos ({readyCount})
            </button>
          </div>
        )}

        {queue.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Documentos na Fila ({queue.length})
            </h3>

            <div className="space-y-4">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-2xl p-5 md:p-6 transition-all ${
                    item.status === 'saved'
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : item.status === 'error'
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <div>
                        <p className="text-xs font-bold text-gray-900 uppercase">{item.file.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.status === 'analyzing' && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase">
                          <span className="animate-spin text-xs">⏳</span> Lendo com IA...
                        </span>
                      )}

                      {item.status === 'ready' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase">
                          ● Pronto para Salvar
                        </span>
                      )}

                      {item.status === 'saving' && (
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full uppercase">
                          Gravando...
                        </span>
                      )}

                      {item.status === 'saved' && (
                        <span className="text-[10px] font-bold text-white bg-emerald-600 px-3 py-1 rounded-full uppercase">
                          ✓ Salvo com Sucesso
                        </span>
                      )}

                      {item.status === 'error' && (
                        <span className="text-[10px] font-bold text-red-800 bg-red-100 px-3 py-1 rounded-full uppercase">
                          ✕ Erro
                        </span>
                      )}

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-600 text-xs font-bold px-2 py-1 uppercase transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {item.errorMessage && (
                    <p className="text-xs font-bold text-red-600 mb-3">{item.errorMessage}</p>
                  )}

                  {item.status !== 'analyzing' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Título do Documento
                        </label>
                        <input
                          type="text"
                          value={item.formData.title}
                          onChange={(e) => handleFieldChange(item.id, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white uppercase"
                        />
                      </div>

                      {/* DROPDOWN DOS 12 DOCUMENTOS PADRONIZADOS */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Tipo de Documento *
                        </label>
                        <select
                          value={item.formData.document_type}
                          onChange={(e) => handleFieldChange(item.id, 'document_type', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white"
                        >
                          {STANDARD_DOC_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Colaborador
                        </label>
                        <input
                          type="text"
                          value={item.formData.worker_name}
                          onChange={(e) => handleFieldChange(item.id, 'worker_name', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white uppercase"
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          CPF
                        </label>
                        <input
                          type="text"
                          value={item.formData.worker_cpf}
                          onChange={(e) => handleFieldChange(item.id, 'worker_cpf', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white"
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Empresa
                        </label>
                        <select
                          value={item.formData.subcontractor_name}
                          onChange={(e) => handleFieldChange(item.id, 'subcontractor_name', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white uppercase"
                        >
                          <option value="">Selecione...</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Obra / Unidade
                        </label>
                        <input
                          type="text"
                          value={item.formData.work_site}
                          onChange={(e) => handleFieldChange(item.id, 'work_site', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white uppercase"
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Categoria no Portal
                        </label>
                        <select
                          value={item.formData.category}
                          onChange={(e) => handleFieldChange(item.id, 'category', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white"
                        >
                          <option value="PASSAPORTE">PASSAPORTE DE SEG. (Trabalhador)</option>
                          <option value="SUBCONTRATADAS">SUBCONTRATADAS (Empresa)</option>
                          <option value="OBRAS">OBRAS (Canteiro)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Emissão
                        </label>
                        <input
                          type="date"
                          value={item.formData.issue_date}
                          onChange={(e) => handleFieldChange(item.id, 'issue_date', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white"
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Validade
                        </label>
                        <input
                          type="date"
                          value={item.formData.expiry_date}
                          onChange={(e) => handleFieldChange(item.id, 'expiry_date', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-gray-300 rounded-lg font-bold focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer compact />
    </div>
  )
}