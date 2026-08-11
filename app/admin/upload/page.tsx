'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'

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
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    document_type: '',
    category: 'PASSAPORTE',
    worker_name: '',
    worker_cpf: '',
    subcontractor_name: '',
    issue_date: '',
    expiry_date: '',
    status: 'APTO',
  })

  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setAnalyzing(true)
    setMessage(null)

    const payload = new FormData()
    payload.append('file', selectedFile)

    try {
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: payload,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Erro ao ler documento.')
      }

      const data = result.data
      setFormData({
        title: data.title || '',
        document_type: data.document_type || '',
        category: data.category || 'PASSAPORTE',
        worker_name: data.worker_name || '',
        worker_cpf: data.worker_cpf || '',
        subcontractor_name: data.subcontractor_name || '',
        issue_date: data.issue_date || '',
        expiry_date: data.expiry_date || '',
        status: data.status || 'APTO',
      })

      setMessage({ type: 'success', text: 'Dados extraídos com sucesso pela IA! Verifique e confirme abaixo.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao analisar o PDF.' })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setSaving(true)
    setMessage(null)

    try {
      const filePath = generateStandardFileName(
        formData.title,
        formData.worker_name,
        formData.expiry_date || formData.issue_date
      )

      const { error: storageError } = await supabase.storage
        .from('sst-documents')
        .upload(filePath, file, {
          upsert: true,
          contentType: 'application/pdf',
        })

      if (storageError) throw new Error(`Storage error: ${storageError.message}`)

      let subcontractorId: string | null = null
      if (formData.subcontractor_name) {
        const { data: existingSub } = await supabase
          .from('subcontractors')
          .select('id')
          .ilike('name', formData.subcontractor_name)
          .maybeSingle()

        if (existingSub) {
          subcontractorId = existingSub.id
        } else {
          const { data: newSub, error: subError } = await supabase
            .from('subcontractors')
            .insert({ name: formData.subcontractor_name })
            .select('id')
            .single()

          if (subError) throw subError
          subcontractorId = newSub.id
        }
      }

      let workerId: string | null = null
      if (formData.worker_name && subcontractorId) {
        const { data: existingWorker } = await supabase
          .from('workers')
          .select('id')
          .eq('cpf', formData.worker_cpf || '00000000000')
          .maybeSingle()

        if (existingWorker) {
          workerId = existingWorker.id
          await supabase
            .from('workers')
            .update({ status: formData.status as any })
            .eq('id', workerId)
        } else {
          const { data: newWorker, error: workerError } = await supabase
            .from('workers')
            .insert({
              full_name: formData.worker_name,
              cpf: formData.worker_cpf || '00000000000',
              subcontractor_id: subcontractorId,
              status: formData.status as any,
            })
            .select('id')
            .single()

          if (workerError) throw workerError
          workerId = newWorker.id
        }
      }

      const { error: docError } = await supabase.from('documents').insert({
        title: formData.title,
        document_type: formData.document_type || 'OUTROS',
        category: formData.category as any,
        file_path: filePath,
        file_name: filePath.split('/').pop() || file.name,
        issue_date: formData.issue_date || null,
        expiry_date: formData.expiry_date || null,
        worker_id: workerId,
        subcontractor_id: subcontractorId,
      })

      if (docError) throw docError

      setMessage({ type: 'success', text: 'Documento cadastrado e armazenado com nome padronizado!' })
      setFile(null)
      setFormData({
        title: '',
        document_type: '',
        category: 'PASSAPORTE',
        worker_name: '',
        worker_cpf: '',
        subcontractor_name: '',
        issue_date: '',
        expiry_date: '',
        status: 'APTO',
      })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar no banco de dados.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#2C2C2C] font-sans select-none w-full flex flex-col">
      <AdminHeader title="UPLOAD &" highlight="EXTRAÇÃO COM IA" />

      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 py-8 space-y-8 flex-1">
        <div>
          <h2 className="text-lg font-bold uppercase text-black tracking-wide">
            Upload & Leitura Automática de Documentos SST
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Selecione o arquivo PDF. A Inteligência Artificial extrairá os dados automaticamente para conferência.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            id="pdf-upload"
            className="hidden"
          />
          <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
              📄
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                {file ? file.name : 'Clique para selecionar o PDF do Colaborador'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Suporta ASOs, Treinamentos NRs, RGs e Fichas de EPI</p>
            </div>
          </label>
        </div>

        {analyzing && (
          <div className="bg-white border border-gray-200 p-6 rounded-2xl text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              A Inteligência Artificial está lendo o documento PDF...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b pb-3">
            Dados Extraídos para Validação
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Título do Documento</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Categoria de Exibição</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
              >
                <option value="PASSAPORTE">PASSAPORTE DE SEGURANÇA</option>
                <option value="SUBCONTRATADAS">SUBCONTRATADAS</option>
                <option value="TREINAMENTOS_CAMPANHAS">TREINAMENTOS E CAMPANHAS</option>
                <option value="OBRAS">OBRAS</option>
                <option value="PESSOAL">PESSOAL</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Nome do Colaborador</label>
              <input
                type="text"
                value={formData.worker_name}
                onChange={(e) => setFormData({ ...formData, worker_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">CPF do Colaborador</label>
              <input
                type="text"
                value={formData.worker_cpf}
                onChange={(e) => setFormData({ ...formData, worker_cpf: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Empresa Subcontratada</label>
              <input
                type="text"
                value={formData.subcontractor_name}
                onChange={(e) => setFormData({ ...formData, subcontractor_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Status de Aptidão</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white font-bold"
              >
                <option value="APTO">APTO</option>
                <option value="PENDENTE">PENDENTE</option>
                <option value="INAPTO">INAPTO</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Data de Emissão</label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Data de Validade</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !file}
            className="w-full py-3 bg-[#4A4D50] hover:bg-black text-white font-bold text-xs tracking-widest uppercase rounded-xl transition-colors disabled:opacity-50 mt-4 cursor-pointer"
          >
            {saving ? 'Gravando no Banco...' : 'Confirmar e Cadastrar Documento'}
          </button>
        </form>
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