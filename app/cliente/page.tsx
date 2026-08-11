'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ClientHeader from '@/components/ClientHeader'
import Footer from '@/components/Footer'

const STANDARD_DOCS = [
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

type Category = 'PASSAPORTE' | 'SUBCONTRATADAS' | 'TREINAMENTOS' | 'OBRAS'

type ObraSubCategory =
  | 'Boas Práticas'
  | 'Comunicação Visual'
  | 'Docs. Digitalizados'
  | 'Docs. Gerais'
  | 'Lista de Presença'
  | 'Sinalização de Segurança'

type AptitudeFilter = 'ALL' | 'APTO' | 'A_VENCER' | 'INAPTO'

interface DocumentItem {
  id: string
  title: string
  category: string
  document_type?: string | null
  sub_category?: string | null
  file_path: string
  issue_date: string | null
  expiry_date: string | null
  raw_expiry_date: string | null
  worker_id: string | null
  worker_name: string
  worker_cpf: string
  worker_status: 'APTO' | 'PENDENTE' | 'INAPTO'
  company_name: string
  created_at?: string
}

interface WorkerCardItem {
  id: string
  name: string
  cpf: string
  company_name: string
  status: 'APTO' | 'INAPTO'
  hasExpiringSoon: boolean
}

interface TrainingMediaItem {
  id: string
  title: string
  section: 'TREINAMENTOS' | 'EMERGENCIA'
  media_type: 'IMAGE' | 'VIDEO_FILE' | 'EMBED'
  url: string
}

interface WorkerPassport {
  id: string
  name: string
  cpf: string
  company: string
  status: 'APTO' | 'PENDENTE' | 'INAPTO'
  job_role: string
  exempt_docs: string[]
  documents: DocumentItem[]
}

function isQuattroAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const domain = email.toLowerCase().split('@')[1]
  return domain === 'quattroinc.com.br' || domain === 'quattroconstrutora.com.br'
}

export default function ClienteDashboard() {
  const [activeCategory, setActiveCategory] = useState<Category>('SUBCONTRATADAS')
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('TODAS')
  const [selectedObraSubCategory, setSelectedObraSubCategory] = useState<ObraSubCategory>('Boas Práticas')
  const [selectedAptitudeFilter, setSelectedAptitudeFilter] = useState<AptitudeFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [workersList, setWorkersList] = useState<any[]>([])
  const [trainingMedia, setTrainingMedia] = useState<TrainingMediaItem[]>([])
  const [subcontractorsList, setSubcontractorsList] = useState<string[]>(['TODAS'])
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<WorkerPassport | null>(null)

  const [activeMediaModal, setActiveMediaModal] = useState<{
    title: string
    type: 'IMAGE' | 'VIDEO_FILE' | 'EMBED'
    url: string
  } | null>(null)

  const [currentUser, setCurrentUser] = useState({
    name: 'Equipe Quattro SST',
    email: 'admin.sst@quattroinc.com.br',
    company: 'Quattro Construtora',
  })

  const supabase = createClient()
  const isQuattroUser = isQuattroAdminEmail(currentUser.email)

  const obraSubCategories: ObraSubCategory[] = [
    'Boas Práticas',
    'Comunicação Visual',
    'Docs. Digitalizados',
    'Docs. Gerais',
    'Lista de Presença',
    'Sinalização de Segurança',
  ]

  const calculateRealAptitude = (workerId: string | null, workerName: string, allDocs: DocumentItem[], allWorkers: any[]) => {
    const workerObj = allWorkers.find(
      (w) => (workerId && w.id === workerId) ||
             w.full_name.trim().toUpperCase() === workerName.trim().toUpperCase()
    )

    const exemptList: string[] = workerObj?.exempt_docs || []
    const workerDocs = allDocs.filter(
      (d) => (workerId && d.worker_id === workerId) ||
             d.worker_name.trim().toUpperCase() === workerName.trim().toUpperCase()
    )

    for (const stdDoc of STANDARD_DOCS) {
      if (exemptList.includes(stdDoc.id)) continue

      const hasDoc = workerDocs.some((d) => {
        const docTypeUpper = (d.document_type || '').toUpperCase()
        const titleUpper = d.title.toUpperCase()
        return (
          docTypeUpper === stdDoc.id ||
          docTypeUpper.includes(stdDoc.id.replace('_', '')) ||
          titleUpper.includes(stdDoc.id.replace('_', ' ')) ||
          (stdDoc.id === 'RG_CPF' && (titleUpper.includes('RG') || titleUpper.includes('CPF'))) ||
          (stdDoc.id === 'ASO' && titleUpper.includes('ASO')) ||
          (stdDoc.id === 'CTPS' && titleUpper.includes('CTPS'))
        )
      })

      if (!hasDoc) return 'INAPTO'
    }

    return (workerObj?.status as 'APTO' | 'INAPTO') || 'INAPTO'
  }

  const checkWorkerExpiringSoon = (workerId: string | null, workerName: string, allDocs: DocumentItem[]) => {
    const workerDocs = allDocs.filter(
      (d) => (workerId && d.worker_id === workerId) ||
             d.worker_name.trim().toUpperCase() === workerName.trim().toUpperCase()
    )
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return workerDocs.some((d) => {
      if (!d.raw_expiry_date) return false
      const exp = new Date(d.raw_expiry_date + 'T12:00:00')
      const diffTime = exp.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 30
    })
  }

  useEffect(() => {
    async function loadAuthUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        setCurrentUser({
          name: user.user_metadata?.full_name || user.email.split('@')[0].toUpperCase(),
          email: user.email,
          company: isQuattroAdminEmail(user.email) ? 'Quattro Construtora' : 'Amazon Brasil',
        })
      }
    }
    loadAuthUser()
  }, [])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY
          if (scrollY > 35) {
            setIsScrolled((prev) => (prev ? prev : true))
          } else if (scrollY < 10) {
            setIsScrolled((prev) => (!prev ? prev : false))
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      try {
        const { data: subs } = await supabase.from('subcontractors').select('id, name, logo_url')
        if (subs) {
          const names = Array.from(new Set(subs.map((s) => s.name.toUpperCase())))
          setSubcontractorsList(['TODAS', ...names])

          const amazonSub = subs.find((s) => s.name.toUpperCase().includes('AMAZON') && s.logo_url)
          if (amazonSub && amazonSub.logo_url) {
            setClientLogoUrl(amazonSub.logo_url)
          }
        }

        const { data: workers } = await supabase.from('workers').select('*')
        const currentWorkers = workers || []
        setWorkersList(currentWorkers)

        const { data: docs, error: docError } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false })

        if (docError) throw docError

        const workerMap = new Map((currentWorkers).map((w) => [w.id, w]))
        const subMap = new Map((subs || []).map((s) => [s.id, s]))

        const baseDocs: DocumentItem[] = (docs || []).map((item: any) => {
          const worker = item.worker_id ? workerMap.get(item.worker_id) : null
          const subcontractor = item.subcontractor_id ? subMap.get(item.subcontractor_id) : null

          return {
            id: item.id,
            title: item.title,
            category: item.category || 'SUBCONTRATADAS',
            document_type: item.document_type || null,
            sub_category: item.document_type || null,
            file_path: item.file_path,
            issue_date: item.issue_date,
            raw_expiry_date: item.expiry_date,
            expiry_date: item.expiry_date
              ? new Date(item.expiry_date + 'T12:00:00').toLocaleDateString('pt-BR')
              : 'Indeterminado',
            worker_id: item.worker_id,
            worker_name: worker?.full_name || 'Não informado',
            worker_cpf: worker?.cpf || 'Não cadastrado',
            worker_status: 'INAPTO',
            company_name: subcontractor?.name || 'Quattro Construtora',
            created_at: item.created_at,
          }
        })

        const formattedDocs = baseDocs.map((d) => ({
          ...d,
          worker_status: calculateRealAptitude(d.worker_id, d.worker_name, baseDocs, currentWorkers),
        }))

        setDocuments(formattedDocs)

        const { data: mediaData } = await supabase
          .from('training_media')
          .select('*')
          .order('created_at', { ascending: false })

        if (mediaData) {
          setTrainingMedia(mediaData)
        }
      } catch (err) {
        console.error('Erro na consulta:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleOpenPdf = (filePath: string) => {
    const { data } = supabase.storage.from('sst-documents').getPublicUrl(filePath)
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank')
    }
  }

  const handleOpenPassport = (workerId: string | null, workerName: string, company: string) => {
    const workerObj = workersList.find(
      (w) => (workerId && w.id === workerId) ||
             w.full_name.trim().toUpperCase() === workerName.trim().toUpperCase()
    )

    const workerDocs = documents.filter(
      (d) => (workerId && d.worker_id === workerId) ||
             d.worker_name.trim().toUpperCase() === workerName.trim().toUpperCase()
    )

    const docMap = new Map<string, DocumentItem>()
    workerDocs.forEach((d) => {
      const key = (d.document_type || d.title).trim().toUpperCase()
      if (!docMap.has(key)) {
        docMap.set(key, d)
      } else {
        const existing = docMap.get(key)!
        const dateNew = d.issue_date || d.raw_expiry_date || d.created_at || ''
        const dateOld = existing.issue_date || existing.raw_expiry_date || existing.created_at || ''
        if (dateNew > dateOld) {
          docMap.set(key, d)
        }
      }
    })

    const realStatus = calculateRealAptitude(workerId, workerName, documents, workersList)

    setSelectedWorker({
      id: workerId || workerName,
      name: workerObj?.full_name || workerName,
      cpf: workerObj?.cpf || 'Não informado',
      company: company,
      status: realStatus,
      job_role: workerObj?.job_role || 'Operacional',
      exempt_docs: workerObj?.exempt_docs || [],
      documents: Array.from(docMap.values()),
    })
  }

  const workerCardMap = new Map<string, WorkerCardItem>()

  documents.forEach((doc) => {
    const key = doc.worker_id || doc.worker_name.trim().toUpperCase()
    if (!workerCardMap.has(key)) {
      const realStatus = calculateRealAptitude(doc.worker_id, doc.worker_name, documents, workersList)
      const workerObj = workersList.find(
        (w) => (doc.worker_id && w.id === doc.worker_id) ||
               w.full_name.trim().toUpperCase() === doc.worker_name.trim().toUpperCase()
      )
      const expiringSoon = checkWorkerExpiringSoon(doc.worker_id, doc.worker_name, documents)

      workerCardMap.set(key, {
        id: doc.worker_id || key,
        name: doc.worker_name,
        cpf: doc.worker_cpf || workerObj?.cpf || 'Não informado',
        company_name: doc.company_name,
        status: realStatus,
        hasExpiringSoon: expiringSoon,
      })
    }
  })

  let displayWorkerCards = Array.from(workerCardMap.values())

  if (selectedSubcontractor !== 'TODAS') {
    displayWorkerCards = displayWorkerCards.filter(
      (w) => w.company_name.toUpperCase() === selectedSubcontractor.toUpperCase()
    )
  }

  if (selectedAptitudeFilter === 'APTO') {
    displayWorkerCards = displayWorkerCards.filter((w) => w.status === 'APTO')
  } else if (selectedAptitudeFilter === 'INAPTO') {
    displayWorkerCards = displayWorkerCards.filter((w) => w.status === 'INAPTO')
  } else if (selectedAptitudeFilter === 'A_VENCER') {
    displayWorkerCards = displayWorkerCards.filter((w) => w.hasExpiringSoon)
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    displayWorkerCards = displayWorkerCards.filter(
      (w) => w.name.toLowerCase().includes(query) || w.cpf.toLowerCase().includes(query)
    )
  }

  const obraFilteredDocuments = documents.filter((doc) => {
    const isObra = doc.category.toUpperCase().includes('OBRA')
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.company_name.toLowerCase().includes(searchQuery.toLowerCase())

    const currentSubUpper = selectedObraSubCategory.toUpperCase()
    const docSubUpper = (doc.sub_category || '').toUpperCase()
    const docTitleUpper = doc.title.toUpperCase()

    const matchesObraSub =
      docSubUpper === currentSubUpper ||
      docTitleUpper.includes(currentSubUpper) ||
      (selectedObraSubCategory === 'Docs. Digitalizados' &&
        (docSubUpper.includes('DIGITALIZADO') ||
          docSubUpper.includes('ESCANEADO') ||
          docTitleUpper.includes('DIGITALIZADO') ||
          docTitleUpper.includes('ESCANEADO'))) ||
      (selectedObraSubCategory === 'Docs. Gerais' &&
        (docSubUpper.includes('GERAIS') ||
          docSubUpper.includes('DOCUMENTAÇ') ||
          docTitleUpper.includes('GERAIS') ||
          docTitleUpper.includes('DOCUMENTAÇ')))

    return isObra && matchesSearch && matchesObraSub
  })

  return (
    <div className="min-h-screen bg-white text-[#2C2C2C] flex flex-col font-sans select-none w-full">
      <ClientHeader isScrolled={isScrolled} clientLogoUrl={clientLogoUrl} />

      <div className="w-full h-48 sm:h-52 flex-shrink-0" />

      <section className="w-full bg-[#FFFFFF] pt-10 pb-8 border-b border-gray-100 relative z-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-4 border-l-2 border-black pl-5 space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-black tracking-tight leading-snug">
                Segurança não é apenas uma regra.<br />
                <span className="text-gray-400">É o nosso jeito de construir.</span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Selecione os filtros abaixo para visualizar a documentação técnica e de campo da obra.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed text-justify">
              <p>
                O <strong className="font-bold text-gray-900">Portal de Segurança e Saúde do Trabalho (SST) da Quattro Company - Projeto Amazon</strong> foi criado para centralizar, padronizar e facilitar o acesso a informações e documentos cruciais para a prevenção de acidentes nas obras.
              </p>
              <p>
                Entre suas principais funcionalidades, a plataforma disponibiliza o Passaporte de Segurança para controle de treinamentos e habilitações dos colaboradores, a gestão de documentos de empresas parceiras e um acervo para materiais educativos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-10 sm:pt-12 max-w-4xl mx-auto">
            {[
              { id: 'PASSAPORTE', label: 'PASSAPORTE DE SEGURANÇA' },
              { id: 'SUBCONTRATADAS', label: 'SUBCONTRATADAS' },
              { id: 'TREINAMENTOS', label: 'TREINAMENTOS E CAMPANHAS' },
              { id: 'OBRAS', label: 'OBRAS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as Category)}
                className={`py-3 px-3 rounded-lg text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase transition-all text-center border cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-[#4A4D50] text-white border-[#4A4D50] shadow-sm'
                    : 'bg-[#EDEDED] text-gray-700 border-gray-200 hover:bg-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-white flex-1 relative z-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 py-8 space-y-10">
          
          {(activeCategory === 'SUBCONTRATADAS' || activeCategory === 'PASSAPORTE') && (
            <>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {subcontractorsList.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcontractor(sub)}
                      className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                        selectedSubcontractor === sub
                          ? 'bg-[#4A4D50] text-white'
                          : 'bg-[#EDEDED] text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
                  <select
                    value={selectedAptitudeFilter}
                    onChange={(e) => setSelectedAptitudeFilter(e.target.value as AptitudeFilter)}
                    className="w-full sm:w-auto px-3.5 py-2 bg-[#F2F2F2] border border-gray-300 text-gray-800 text-xs font-bold rounded-lg focus:outline-none focus:bg-white uppercase cursor-pointer"
                  >
                    <option value="ALL">🔍 TODOS OS STATUS</option>
                    <option value="APTO">🟢 APTOS</option>
                    <option value="A_VENCER">🟡 A VENCER (30 DIAS)</option>
                    <option value="INAPTO">🔴 INAPTOS</option>
                  </select>

                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="PESQUISAR COLABORADOR OU CPF..."
                      className="w-full px-4 py-2 bg-[#F2F2F2] border border-gray-300 text-gray-800 text-xs rounded-lg focus:outline-none focus:bg-white uppercase font-medium placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {loading && (
                <div className="text-center py-12 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Carregando colaboradores...
                </div>
              )}

              {!loading && displayWorkerCards.length === 0 && (
                <div className="text-center py-12 text-xs font-medium text-gray-500 border border-dashed border-gray-200 rounded-2xl p-8">
                  Nenhum colaborador encontrado para os filtros selecionados.
                </div>
              )}

              {!loading && displayWorkerCards.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {displayWorkerCards.map((worker) => (
                    <div
                      key={worker.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-[#EDEDED] text-gray-800 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
                            {worker.company_name}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {worker.hasExpiringSoon && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border border-amber-200">
                                A Vencer
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase ${
                                worker.status === 'APTO'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {worker.status}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-black text-sm uppercase tracking-wide text-gray-900 leading-snug">
                          {worker.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-1">
                          CPF: {worker.cpf}
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenPassport(worker.id, worker.name, worker.company_name)}
                        className="w-full py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
                      >
                        Ver Passaporte de SST
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeCategory === 'TREINAMENTOS' && (
            <div className="space-y-12">
              <div>
                <h3 className="text-center text-lg sm:text-xl font-bold uppercase tracking-widest text-gray-800 mb-8">
                  TREINAMENTOS E CAMPANHAS
                </h3>

                {trainingMedia.filter((m) => m.section === 'TREINAMENTOS').length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-2 max-w-xl mx-auto">
                    <p className="text-xs font-bold text-gray-600 uppercase">Nenhum treinamento cadastrado ainda.</p>
                    <p className="text-[11px] text-gray-400">
                      Adicione fotos, vídeos MP4 ou links de YouTube através do painel administrativo.
                    </p>
                    {isQuattroUser && (
                      <Link
                        href="/admin/midia"
                        className="inline-block mt-2 px-4 py-2 bg-[#4A4D50] hover:bg-black text-white text-[10px] font-bold uppercase rounded-xl transition-colors"
                      >
                        + Cadastrar Mídias Agora
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trainingMedia
                      .filter((m) => m.section === 'TREINAMENTOS')
                      .map((item) => (
                        <div
                          key={item.id}
                          className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:border-gray-400 flex flex-col justify-between"
                        >
                          <div className="relative h-48 bg-black overflow-hidden flex items-center justify-center">
                            {item.media_type === 'IMAGE' && (
                              <Image
                                src={item.url}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                onClick={() => setActiveMediaModal({ title: item.title, type: 'IMAGE', url: item.url })}
                              />
                            )}

                            {item.media_type === 'VIDEO_FILE' && (
                              <video controls src={item.url} className="w-full h-full object-cover" />
                            )}

                            {item.media_type === 'EMBED' && (
                              <iframe
                                src={item.url}
                                title={item.title}
                                className="w-full h-full border-0"
                                allowFullScreen
                              />
                            )}
                          </div>

                          <div className="p-4 text-center bg-white">
                            <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wide">
                              {item.title}
                            </h4>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-center text-lg sm:text-xl font-bold uppercase tracking-widest text-gray-800 mb-8">
                  INSTRUÇÃO / ORIENTAÇÃO DE EMERGÊNCIA
                </h3>

                {trainingMedia.filter((m) => m.section === 'EMERGENCIA').length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-2 max-w-xl mx-auto">
                    <p className="text-xs font-bold text-gray-600 uppercase">Nenhum material de emergência cadastrado.</p>
                    <p className="text-[11px] text-gray-400">
                      Cadastre vídeos (DEA, Primeiros Socorros) e infográficos em <strong>/admin/midia</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {trainingMedia
                      .filter((m) => m.section === 'EMERGENCIA')
                      .map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                          <h4 className="text-xs font-bold uppercase text-gray-800 text-center">
                            {item.title}
                          </h4>

                          <div className="relative h-56 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                            {item.media_type === 'IMAGE' && (
                              <Image
                                src={item.url}
                                alt={item.title}
                                fill
                                className="object-cover cursor-pointer"
                                onClick={() => setActiveMediaModal({ title: item.title, type: 'IMAGE', url: item.url })}
                              />
                            )}

                            {item.media_type === 'VIDEO_FILE' && (
                              <video controls src={item.url} className="w-full h-full object-cover rounded-xl" />
                            )}

                            {item.media_type === 'EMBED' && (
                              <iframe
                                src={item.url}
                                title={item.title}
                                className="w-full h-full rounded-xl border-0"
                                allowFullScreen
                              />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 4: OBRAS (SUBFILTROS EM UMA ÚNICA LINHA REPETINDO A LARGURA MÁXIMA DA PÁGINA) */}
          {activeCategory === 'OBRAS' && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-gray-900">
                  OBRAS
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Documentação técnica, comunicados e listas operacionais exclusivas da obra.
                </p>
              </div>

              {/* CONTAINER EXPANDIDO PARA MAX-W-7XL COM WHITESPACE-NOWRAP PARA TODOS OS 6 BOTÕES FICAREM EM UMA LINHA */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-7xl mx-auto px-2">
                {obraSubCategories.map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setSelectedObraSubCategory(subCat)}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap cursor-pointer ${
                      selectedObraSubCategory === subCat
                        ? 'bg-[#4A4D50] text-white border-[#4A4D50] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </div>

              {obraFilteredDocuments.length === 0 ? (
                <div className="text-center py-12 text-xs font-medium text-gray-500 border border-dashed border-gray-200 rounded-2xl p-8">
                  Nenhum documento encontrado para a subcategoria &quot;{selectedObraSubCategory}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
                  {obraFilteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase inline-block mb-3">
                          {doc.company_name}
                        </span>
                        <h4 className="font-bold text-xs uppercase text-gray-900 mb-1 leading-snug">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">
                          Emissão: {doc.issue_date || 'Recente'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenPdf(doc.file_path)}
                        className="w-full py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
                      >
                        Visualizar PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* MODAL DE PASSAPORTE SST */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
            <div className="bg-[#4A4D50] p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-300">
                  Passaporte de Segurança SST - Quattro Company
                </span>
                <h3 className="text-lg font-bold uppercase tracking-wide">{selectedWorker.name}</h3>
                <p className="text-xs text-gray-300">
                  Empresa: <strong className="text-white">{selectedWorker.company}</strong> | Função: <strong className="text-white">{selectedWorker.job_role}</strong> | CPF: {selectedWorker.cpf}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                    selectedWorker.status === 'APTO'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {selectedWorker.status}
                </span>

                <button
                  onClick={() => setSelectedWorker(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                  Status dos 12 Documentos Regulatórios
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STANDARD_DOCS.map((stdDoc) => {
                    const isExempt = (selectedWorker.exempt_docs || []).includes(stdDoc.id)
                    const uploadedDoc = selectedWorker.documents.find((d) => {
                      const docTypeUpper = (d.document_type || '').toUpperCase()
                      const titleUpper = d.title.toUpperCase()
                      return (
                        docTypeUpper === stdDoc.id ||
                        docTypeUpper.includes(stdDoc.id.replace('_', '')) ||
                        titleUpper.includes(stdDoc.id.replace('_', ' ')) ||
                        (stdDoc.id === 'RG_CPF' && (titleUpper.includes('RG') || titleUpper.includes('CPF'))) ||
                        (stdDoc.id === 'ASO' && titleUpper.includes('ASO')) ||
                        (stdDoc.id === 'CTPS' && titleUpper.includes('CTPS'))
                      )
                    })

                    let statusLabel = 'Pendente'
                    let badgeClass = 'bg-red-100 text-red-800'

                    if (isExempt) {
                      statusLabel = 'Dispensado pelo TST (N/A)'
                      badgeClass = 'bg-gray-100 text-gray-600'
                    } else if (uploadedDoc) {
                      statusLabel = `Entregue (Venc: ${uploadedDoc.expiry_date})`
                      badgeClass = 'bg-emerald-100 text-emerald-800 font-bold'
                    }

                    return (
                      <div key={stdDoc.id} className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{stdDoc.label}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase inline-block mt-1 ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {uploadedDoc && (
                          <button
                            onClick={() => handleOpenPdf(uploadedDoc.file_path)}
                            className="px-3 py-1 bg-[#4A4D50] hover:bg-black text-white text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                          >
                            Abrir
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedWorker(null)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}