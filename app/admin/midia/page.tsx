'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'
import Footer from '@/components/Footer'

interface CompanyItem {
  id: string
  name: string
}

interface MediaItem {
  id: string
  title: string
  section: 'TREINAMENTOS' | 'EMERGENCIA'
  media_type: 'IMAGE' | 'VIDEO_FILE' | 'EMBED'
  url: string
  company_id?: string | null
  created_at: string
}

function formatEmbedUrl(urlStr: string): string {
  if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = urlStr.match(regExp)
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`
    }
  }
  if (urlStr.includes('vimeo.com')) {
    const regExp = /vimeo\.com\/(\d+)/
    const match = urlStr.match(regExp)
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`
    }
  }
  return urlStr
}

export default function AdminMidiaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    section: 'TREINAMENTOS' as 'TREINAMENTOS' | 'EMERGENCIA',
    typeMode: 'FILE' as 'FILE' | 'LINK',
    embedUrl: '',
    company_id: '',
  })

  const supabase = createClient()

  const loadMedia = async () => {
    setLoading(true)
    try {
      const { data: subs } = await supabase.from('subcontractors').select('id, name').order('name', { ascending: true })
      if (subs) setCompanies(subs)

      const { data, error } = await supabase
        .from('training_media')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          throw new Error('A tabela "training_media" ainda não existe no Supabase.')
        }
        throw error
      }
      setMediaList(data || [])
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Erro ao carregar mídias.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setSaving(true)
    setMessage(null)

    try {
      let finalUrl = ''
      let detectedType: 'IMAGE' | 'VIDEO_FILE' | 'EMBED' = 'EMBED'

      if (formData.typeMode === 'LINK') {
        if (!formData.embedUrl) throw new Error('Informe o link do YouTube ou Vimeo.')
        finalUrl = formatEmbedUrl(formData.embedUrl)
        detectedType = 'EMBED'
      } else {
        if (!file) throw new Error('Selecione um arquivo de foto ou vídeo.')

        const isVideo = file.type.startsWith('video/')
        detectedType = isVideo ? 'VIDEO_FILE' : 'IMAGE'

        const fileExt = file.name.split('.').pop()
        const storagePath = `media/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('sst-documents')
          .upload(storagePath, file, { upsert: true, contentType: file.type })

        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage.from('sst-documents').getPublicUrl(storagePath)
        finalUrl = publicData.publicUrl
      }

      const { error } = await supabase.from('training_media').insert({
        title: formData.title.trim().toUpperCase(),
        section: formData.section,
        media_type: detectedType,
        url: finalUrl,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Mídia cadastrada e publicada no Portal!' })
      setFormData({ title: '', section: 'TREINAMENTOS', typeMode: 'FILE', embedUrl: '', company_id: '' })
      setFile(null)
      loadMedia()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao cadastrar mídia.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deseja remover a mídia "${title}"?`)) return
    setDeletingId(id)

    try {
      const { error } = await supabase.from('training_media').delete().eq('id', id)
      if (error) throw error

      setMessage({ type: 'success', text: 'Mídia excluída com sucesso!' })
      setMediaList((prev) => prev.filter((m) => m.id !== id))
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao excluir: ${err.message}` })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#2C2C2C] font-sans select-none w-full flex flex-col">
      <AdminHeader title="GESTÃO DE" highlight="MÍDIAS & TREINAMENTOS" />

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
            Adicionar Novo Material (Foto, Vídeo ou Link)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Título do Treinamento / Campanha *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Treinamento de Uso do DEA"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Cliente / Obra Vinculada
              </label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:bg-white uppercase"
              >
                <option value="">TODAS AS OBRAS</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Seção de Exibição *
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
              >
                <option value="TREINAMENTOS">TREINAMENTOS E CAMPANHAS (Galeria)</option>
                <option value="EMERGENCIA">INSTRUÇÃO / ORIENTAÇÃO DE EMERGÊNCIA</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Origem da Mídia *
              </label>
              <select
                value={formData.typeMode}
                onChange={(e) => setFormData({ ...formData, typeMode: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
              >
                <option value="FILE">Upload de Arquivo (PNG, JPG, MP4, MPEG)</option>
                <option value="LINK">Link Externo (YouTube / Vimeo)</option>
              </select>
            </div>
          </div>

          {formData.typeMode === 'FILE' ? (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Arquivo de Mídia (Foto ou Vídeo) *
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, video/mp4, video/mpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Link do Vídeo no YouTube ou Vimeo *
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.embedUrl}
                onChange={(e) => setFormData({ ...formData, embedUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Publicando...' : '+ Cadastrar Mídia'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Mídias Publicadas ({mediaList.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              Carregando mídias...
            </div>
          ) : mediaList.length === 0 ? (
            <div className="p-12 text-center text-xs font-medium text-gray-500">
              Nenhuma mídia cadastrada ainda.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {mediaList.map((item) => (
                <div key={item.id} className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-900 uppercase">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-bold uppercase text-gray-700">
                        {item.section}
                      </span>
                      <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">
                        {item.media_type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold uppercase rounded-lg transition-colors"
                    >
                      Abrir
                    </a>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletingId === item.id}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-[10px] font-bold uppercase border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer compact />
    </div>
  )
}