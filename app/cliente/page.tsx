'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import UserMenu from '@/components/UserMenu'

type Category = 'PASSAPORTE' | 'SUBCONTRATADAS' | 'TREINAMENTOS' | 'OBRAS'

type ObraSubCategory =
  | 'TODOS'
  | 'Boas Práticas'
  | 'Lista de Presença'
  | 'Documentos Escaneados'
  | 'Comunicação Visual'
  | 'Passaporte da Segurança'
  | 'Documentações'
  | 'Sinalização de Segurança'

interface DocumentItem {
  id: string
  title: string
  category: string
  file_path: string
  issue_date: string | null
  expiry_date: string | null
  raw_expiry_date: string | null
  worker_id: string | null
  worker_name: string
  worker_cpf: string
  worker_status: 'APTO' | 'PENDENTE' | 'INAPTO'
  company_name: string
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
  const [selectedObraSubCategory, setSelectedObraSubCategory] = useState<ObraSubCategory>('TODOS')
  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState<DocumentItem[]>([])
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

        const { data: workers } = await supabase.from('workers').select('id, full_name, cpf, status')

        const { data: docs, error: docError } = await supabase
          .from('documents')
          .select('id, title, category, file_path, issue_date, expiry_date, worker_id, subcontractor_id, created_at')
          .order('created_at', { ascending: false })

        if (docError) throw docError

        const workerMap = new Map((workers || []).map((w) => [w.id, w]))
        const subMap = new Map((subs || []).map((s) => [s.id, s]))

        const formattedDocs: DocumentItem[] = (docs || []).map((item: any) => {
          const worker = item.worker_id ? workerMap.get(item.worker_id) : null
          const subcontractor = item.subcontractor_id ? subMap.get(item.subcontractor_id) : null

          return {
            id: item.id,
            title: item.title,
            category: item.category || 'SUBCONTRATADAS',
            file_path: item.file_path,
            issue_date: item.issue_date,
            raw_expiry_date: item.expiry_date,
            expiry_date: item.expiry_date
              ? new Date(item.expiry_date + 'T12:00:00').toLocaleDateString('pt-BR')
              : 'Indeterminado',
            worker_id: item.worker_id,
            worker_name: worker?.full_name || 'Não informado',
            worker_cpf: worker?.cpf || 'Não cadastrado',
            worker_status: (worker?.status as any) || 'APTO',
            company_name: subcontractor?.name || 'Quattro Construtora',
          }
        })

        setDocuments(formattedDocs)

        // Busca Mídias de Forma Segura
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

  const handleOpenPassport = (workerId: string | null, workerName: string, company: string, status: any, cpf: string) => {
    const workerDocs = documents.filter((d) => 
      (workerId && d.worker_id === workerId) || (!workerId && d.worker_name === workerName)
    )

    setSelectedWorker({
      id: workerId || workerName,
      name: workerName,
      cpf: cpf,
      company: company,
      status: status,
      documents: workerDocs,
    })
  }

  const getExpiryStatus = (rawDate: string | null) => {
    if (!rawDate) return { label: 'Válido', color: 'text-gray-600 bg-gray-100' }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const exp = new Date(rawDate + 'T12:00:00')
    const diffTime = exp.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: 'Vencido', color: 'text-red-700 bg-red-100 border border-red-200' }
    }
    if (diffDays <= 30) {
      return { label: `Vence em ${diffDays}d`, color: 'text-amber-700 bg-amber-100 border border-amber-200' }
    }
    return { label: 'Em dia', color: 'text-emerald-700 bg-emerald-100 border border-emerald-200' }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      activeCategory === 'SUBCONTRATADAS' ||
      doc.category.toUpperCase().includes(activeCategory)

    const matchesSub =
      selectedSubcontractor === 'TODAS' ||
      doc.company_name.toUpperCase() === selectedSubcontractor.toUpperCase()

    const matchesSearch =
      doc.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSub && matchesSearch
  })

  return (
    <div className="min-h-screen bg-white text-[#2C2C2C] flex flex-col font-sans select-none w-full">
      
      {/* 1. TESTEIRA FIXA COM CO-BRANDING */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 w-full bg-gray-100 shadow-md transition-all duration-300 ease-out ${
          isScrolled ? 'h-20 sm:h-22' : 'h-48 sm:h-52'
        }`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src="/img/cliente/bg_testeira.png"
            alt="Testeira Quattro Construtora"
            fill
            className="object-cover object-right"
            priority
          />
        </div>

        <div className="relative w-full max-w-[1440px] mx-auto h-full px-4 sm:px-8 md:px-12 flex items-center justify-between">
          
          {/* LOGOTIPOS INTEGRADOS (QUATTRO | CLIENTE/AMAZON) */}
          <div
            className={`absolute z-50 flex items-center gap-3.5 transition-all duration-300 ease-out ${
              isScrolled
                ? '-top-3 sm:-top-4 left-4 sm:left-8 md:left-12'
                : '-top-6 sm:-top-7 md:-top-8 left-4 sm:left-8 md:left-12'
            }`}
          >
            <div
              className={
                isScrolled
                  ? 'relative w-20 h-24 sm:w-22 sm:h-28'
                  : 'relative w-28 h-36 sm:w-32 sm:h-40 md:w-36 md:h-44'
              }
            >
              <Image
                src="/img/cliente/logo_construtora.png"
                alt="Quattro Construtora"
                fill
                className="object-contain object-top drop-shadow-md"
                priority
              />
            </div>

            <div className="h-8 sm:h-10 w-[1.5px] bg-gray-400/50" />

            <div className="flex flex-col justify-center">
              {clientLogoUrl ? (
                <div className="relative w-20 sm:w-28 h-8 sm:h-10">
                  <Image src={clientLogoUrl} alt="Cliente" fill className="object-contain object-left" />
                </div>
              ) : (
                <>
                  <span className="text-[14px] sm:text-base font-black tracking-widest text-[#232F3E] uppercase font-sans">
                    amazon
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    BRASIL
                  </span>
                </>
              )}
            </div>
          </div>

          <div
            className={`absolute z-30 transition-all duration-300 ease-out ${
              isScrolled
                ? 'left-52 sm:left-60 md:left-64 top-1/2 -translate-y-1/2'
                : 'left-4 sm:left-8 md:left-12 bottom-3 sm:bottom-3.5 translate-y-0'
            }`}
          >
            <h1
              className={`text-white md:text-black font-normal tracking-wide uppercase leading-snug drop-shadow-sm md:drop-shadow-none transition-all duration-300 ${
                isScrolled ? 'text-[11px] sm:text-xs md:text-sm' : 'text-xs sm:text-sm md:text-base'
              }`}
            >
              PORTAL DE <span className="font-bold">SEGURANÇA</span><br />
              DO TRABALHO E MEIO AMBIENTE
            </h1>
          </div>

          <div className="absolute right-4 sm:right-8 md:right-12 z-[100]">
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="w-full h-48 sm:h-52 flex-shrink-0" />

      {/* 2. CONTEÚDO INSTITUCIONAL */}
      <section className="w-full bg-white pt-10 pb-8 border-b border-gray-100 relative z-10">
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
                O <strong className="font-bold text-gray-900">Portal de Segurança e Saúde do Trabalho (SST) da Quattro Company - Projeto Amazon</strong> foi criado para centralizar, padronizar e facilitar o acesso a informações e documentos cruciais para a prevenção de acidentes nas obras. A ferramenta atende às equipes de segurança, gestores e empresas subcontratadas, fortalecendo os controles de segurança de campo.
              </p>
              <p>
                Entre suas principais funcionalidades, a plataforma disponibiliza o Passaporte de Segurança para controle de treinamentos e habilitações dos colaboradores, a gestão de documentos de empresas parceiras e um acervo para materiais educativos, fotos de treinamentos e campanhas de conscientização.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-10 sm:pt-12 max-w-4xl mx-auto">
            {[
              { id: 'PASSAPORTE', label: 'PASSAPORTE DE SEGURANÇA' },
              { id: 'SUBCONTRATADAS', label: 'SUBCONTRATADAS' },
              { id: 'TREINAMENTOS', label: 'TREINAMENTOS E CAMPANHAS' },
              { id: 'OBRAS', label: 'OBRAS AMAZON' },
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

      {/* 3. CONTEÚDO DINÂMICO CONFORME A CATEGORIA */}
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

                <div className="w-full md:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="PESQUISAR COLABORADOR OU TÍTULO..."
                    className="w-full px-4 py-2 bg-[#F2F2F2] border border-gray-300 text-gray-800 text-xs rounded-lg focus:outline-none focus:bg-white uppercase font-medium placeholder-gray-500"
                  />
                </div>
              </div>

              {loading && (
                <div className="text-center py-12 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Carregando documentos da obra...
                </div>
              )}

              {!loading && filteredDocuments.length === 0 && (
                <div className="text-center py-12 text-xs font-medium text-gray-500 border border-dashed border-gray-200 rounded-2xl p-8">
                  Nenhum documento encontrado para os filtros selecionados.
                </div>
              )}

              {!loading && filteredDocuments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredDocuments.map((doc) => {
                    const expiryInfo = getExpiryStatus(doc.raw_expiry_date)

                    return (
                      <div
                        key={doc.id}
                        className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-[#EDEDED] text-gray-800 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
                              {doc.company_name}
                            </span>
                            
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase ${
                                doc.worker_status === 'APTO'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {doc.worker_status}
                            </span>
                          </div>

                          <h3 className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-1.5 leading-snug">
                            {doc.title}
                          </h3>
                          
                          <button
                            onClick={() => handleOpenPassport(doc.worker_id, doc.worker_name, doc.company_name, doc.worker_status, doc.worker_cpf)}
                            className="text-left group text-xs text-gray-600 font-medium mb-3 block cursor-pointer"
                          >
                            Colaborador:{' '}
                            <span className="text-gray-900 font-bold group-hover:underline">
                              {doc.worker_name}
                            </span>
                          </button>

                          <div className="bg-[#F8F8F8] p-3 rounded-xl border border-gray-100 flex items-center justify-between text-[11px]">
                            <div>
                              <p className="text-gray-500 text-[10px] uppercase font-bold">Validade</p>
                              <p className="text-gray-800 font-medium">{doc.expiry_date}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${expiryInfo.color}`}>
                              {expiryInfo.label}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => handleOpenPdf(doc.file_path)}
                            className="w-full py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
                          >
                            Visualizar Documento (PDF)
                          </button>

                          <button
                            onClick={() => handleOpenPassport(doc.worker_id, doc.worker_name, doc.company_name, doc.worker_status, doc.worker_cpf)}
                            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
                          >
                            Ver Passaporte de SST
                          </button>
                        </div>
                      </div>
                    )
                  })}
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

          {activeCategory === 'OBRAS' && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-gray-900">
                  OBRAS AMAZON
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Documentação técnica, comunicados e listas operacionais exclusivas da obra.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-5xl mx-auto">
                {[
                  'TODOS',
                  'Boas Práticas',
                  'Lista de Presença',
                  'Documentos Escaneados',
                  'Comunicação Visual',
                  'Passaporte da Segurança',
                  'Documentações',
                  'Sinalização de Segurança',
                ].map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setSelectedObraSubCategory(subCat as ObraSubCategory)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border cursor-pointer ${
                      selectedObraSubCategory === subCat
                        ? 'bg-[#4A4D50] text-white border-[#4A4D50] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase inline-block mb-3">
                        Amazon SP02
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
            </div>
          )}

        </div>
      </section>

      {/* 4. MODAIS */}
      {activeMediaModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-[#4A4D50] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider">{activeMediaModal.title}</h3>
              <button
                onClick={() => setActiveMediaModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 flex items-center justify-center bg-gray-950 min-h-[420px]">
              {activeMediaModal.type === 'IMAGE' && (
                <div className="relative w-full h-[65vh]">
                  <Image
                    src={activeMediaModal.url}
                    alt={activeMediaModal.title}
                    fill
                    className="object-contain rounded-xl"
                  />
                </div>
              )}

              {activeMediaModal.type === 'VIDEO_FILE' && (
                <video controls autoPlay src={activeMediaModal.url} className="max-h-[65vh] w-full rounded-xl" />
              )}

              {activeMediaModal.type === 'EMBED' && (
                <iframe
                  src={activeMediaModal.url}
                  title={activeMediaModal.title}
                  className="w-full h-[65vh] rounded-xl border-0"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}

      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
            <div className="bg-[#4A4D50] p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-300">
                  Passaporte de Segurança SST - Amazon
                </span>
                <h3 className="text-lg font-bold uppercase tracking-wide">{selectedWorker.name}</h3>
                <p className="text-xs text-gray-300">
                  Empresa: <strong className="text-white">{selectedWorker.company}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                    selectedWorker.status === 'APTO'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {selectedWorker.status}
                </span>

                <button
                  onClick={() => setSelectedWorker(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Documentos Cadastrados ({selectedWorker.documents.length})
              </h4>

              <div className="space-y-3">
                {selectedWorker.documents.map((d) => {
                  const exp = getExpiryStatus(d.raw_expiry_date)
                  return (
                    <div
                      key={d.id}
                      className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between hover:border-gray-300 transition-colors bg-gray-50/50"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-900 uppercase">{d.title}</p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span>Vencimento: <strong className="text-gray-700">{d.expiry_date}</strong></span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${exp.color}`}>
                            {exp.label}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenPdf(d.file_path)}
                        className="px-3.5 py-1.5 bg-[#4A4D50] hover:bg-black text-white text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        Abrir PDF
                      </button>
                    </div>
                  )
                })}
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

      {/* 5. RODAPÉ */}
      <footer className="relative w-full h-32 md:h-40 mt-auto overflow-hidden">
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