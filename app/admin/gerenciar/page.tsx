'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'
import Image from 'next/image'

interface DocumentItem {
  id: string
  title: string
  category: string
  file_path: string
  issue_date: string | null
  expiry_date: string | null
  worker_id: string | null
  worker_name: string
  worker_cpf: string
  worker_status: 'APTO' | 'PENDENTE' | 'INAPTO'
  company_name: string
  created_at: string
}

export default function AdminGerenciarPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const { data: subs } = await supabase.from('subcontractors').select('id, name')
      const { data: workers } = await supabase.from('workers').select('id, full_name, cpf, status')
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const workerMap = new Map((workers || []).map((w) => [w.id, w]))
      const subMap = new Map((subs || []).map((s) => [s.id, s]))

      const formatted: DocumentItem[] = (docs || []).map((d: any) => {
        const worker = d.worker_id ? workerMap.get(d.worker_id) : null
        const sub = d.subcontractor_id ? subMap.get(d.subcontractor_id) : null

        return {
          id: d.id,
          title: d.title,
          category: d.category || 'SUBCONTRATADAS',
          file_path: d.file_path,
          issue_date: d.issue_date,
          expiry_date: d.expiry_date
            ? new Date(d.expiry_date + 'T12:00:00').toLocaleDateString('pt-BR')
            : 'Indeterminado',
          worker_id: d.worker_id,
          worker_name: worker?.full_name || 'Não informado',
          worker_cpf: worker?.cpf || '-',
          worker_status: (worker?.status as any) || 'APTO',
          company_name: sub?.name || 'Quattro Construtora',
          created_at: new Date(d.created_at).toLocaleDateString('pt-BR'),
        }
      })

      setDocuments(formatted)
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao carregar os documentos.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(`Deseja realmente excluir o documento "${doc.title}" de ${doc.worker_name}?`)) return

    setDeletingId(doc.id)
    setMessage(null)

    try {
      if (doc.file_path) {
        await supabase.storage.from('sst-documents').remove([doc.file_path])
      }

      const { error } = await supabase.from('documents').delete().eq('id', doc.id)
      if (error) throw error

      setMessage({ type: 'success', text: 'Documento excluído com sucesso!' })
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao excluir documento: ${err.message}` })
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdateStatus = async (workerId: string | null, newStatus: 'APTO' | 'PENDENTE' | 'INAPTO') => {
    if (!workerId) return

    try {
      const { error } = await supabase.from('workers').update({ status: newStatus }).eq('id', workerId)
      if (error) throw error

      setDocuments((prev) =>
        prev.map((d) => (d.worker_id === workerId ? { ...d, worker_status: newStatus } : d))
      )
      setMessage({ type: 'success', text: 'Status de aptidão atualizado com sucesso!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao atualizar status: ${err.message}` })
    }
  }

  const handleOpenPdf = (filePath: string) => {
    const { data } = supabase.storage.from('sst-documents').getPublicUrl(filePath)
    if (data?.publicUrl) window.open(data.publicUrl, '_blank')
  }

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.worker_name.toLowerCase().includes(search.toLowerCase()) ||
      d.company_name.toLowerCase().includes(search.toLowerCase()) ||
      d.worker_cpf.includes(search)
  )

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#2C2C2C] font-sans select-none w-full flex flex-col">
      <AdminHeader title="PAINEL DE" highlight="GERENCIAMENTO SST" />

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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="PESQUISAR POR COLABORADOR, DOCUMENTO OU EMPRESA..."
            className="w-full sm:w-96 px-4 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white uppercase placeholder-gray-400"
          />

          <div className="text-xs text-gray-500 font-medium text-right flex items-center justify-between sm:justify-end gap-2">
            <span>Total Cadastrado:</span>
            <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
              {documents.length} documentos
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              Carregando documentos...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-xs font-medium text-gray-500">
              Nenhum documento encontrado para a busca.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100/75 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-5">Documento</th>
                    <th className="py-3.5 px-5">Colaborador / CPF</th>
                    <th className="py-3.5 px-5">Empresa</th>
                    <th className="py-3.5 px-5">Validade</th>
                    <th className="py-3.5 px-5">Status SST</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-bold text-gray-900 block uppercase leading-snug">{doc.title}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{doc.category}</span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-bold text-gray-800 uppercase block">{doc.worker_name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">CPF: {doc.worker_cpf}</span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase">
                          {doc.company_name}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-medium text-gray-700">
                        {doc.expiry_date}
                      </td>

                      <td className="py-4 px-5">
                        <select
                          value={doc.worker_status}
                          onChange={(e) =>
                            handleUpdateStatus(doc.worker_id, e.target.value as any)
                          }
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase border focus:outline-none cursor-pointer ${
                            doc.worker_status === 'APTO'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="APTO">APTO</option>
                          <option value="PENDENTE">PENDENTE</option>
                          <option value="INAPTO">INAPTO</option>
                        </select>
                      </td>

                      <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenPdf(doc.file_path)}
                          className="px-3 py-1.5 bg-[#4A4D50] hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                        >
                          Ver PDF
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-[10px] font-bold uppercase border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === doc.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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