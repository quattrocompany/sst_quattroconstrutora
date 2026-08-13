'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface AprStep {
  servico: string
  comoFazer: string
  riscos: string
  medidas: string
}

interface TemplateItem {
  title: string
  steps: AprStep[]
  tipoServico?: 'Construção' | 'Manutenção' | 'Comercial' | 'Emergência'
  epis?: Record<string, boolean | string>
  epcs?: string[]
  anexos?: string[]
  isCustom?: boolean
}

interface EpcItem {
  id: string
  name: string
}

interface AnexoItem {
  id: string
  name: string
}

// Lista Padrão de EPCs
const DEFAULT_EPCS: string[] = [
  'Fechamento/proteção de aberturas no piso e lajes',
  'Linha de vida e pontos/sistemas de ancoragem (proteção coletiva)',
  'Cones, balizadores, cavaletes e barreiras de sinalização',
  'Fita zebrada, para sinalização e delimitação visual',
  'Placas de sinalização de segurança (obrigação, advertência, proibição, emergência)',
  'Sinalização e delimitação de caminho seguro para pedestres',
  'Anteparos e biombos de proteção para partículas, solda ou corte',
  'Sistema de exaustão/ventilação coletiva para poeiras, fumos ou gases',
  'Extintores de incêndio adequados às classes de risco',
  'Mantas antichama e telas de proteção para trabalho a quente',
  'Iluminação de emergência',
  'Quadros elétricos protegidos, fechados e sinalizados',
  'Bloqueio e sinalização de fontes de energia (LOTO)',
  'Sinalização de áreas de circulação sujeitas à queda de objetos',
  'Kit de contenção de derramamentos (combustíveis, óleos, químicos)',
  'Bacias de contenção para produtos químicos',
  'Lava-olhos de emergência portátil'
]

// Lista Padrão de Anexos
const DEFAULT_ANEXOS: string[] = [
  'ANEXO A - PT',
  'ANEXO B - LOTO',
  'ANEXO C - TRABALHO EM ALTURA',
  'ANEXO C1 - AVALIAÇÃO FÍSICA',
  'ANEXO C2 - INSPEÇÃO DE CINTOS',
  'ANEXO D - PTA',
  'ANEXO E - ACESSO AO TELHADO',
  'ANEXO F - TRABALHOS ELÉTRICOS',
  'ANEXO G - TRABALHO A QUENTE',
  'ANEXO H - ESPAÇO CONFINADO',
  'ANEXO I - IÇAMENTO',
  'ANEXO J - ESCAVAÇÃO'
]

// Modelos Padrões de fábrica com inteligência de seleção automática
const DEFAULT_TEMPLATES: Record<string, TemplateItem> = {
  GERAL: {
    title: 'Serviços Gerais / Carga e Descarga de Materiais',
    tipoServico: 'Construção',
    epis: { capacete: true, oculos: true, calcado: true, luvas: true, mascara: true, colete: true, protetorAuditivo: false, cintoParaquedista: false },
    epcs: [
      'Cones, balizadores, cavaletes e barreiras de sinalização',
      'Fita zebrada, para sinalização e delimitação visual',
      'Placas de sinalização de segurança (obrigação, advertência, proibição, emergência)'
    ],
    anexos: ['ANEXO A - PT'],
    steps: [
      {
        servico: '1. Leitura, validação da APR e planejamento da atividade',
        comoFazer: 'Leitura da APR com a equipe, inspeção da área de trabalho, organização das ferramentas e verificação dos acessos.',
        riscos: 'Falta de conhecimento dos riscos; execução inadequada; tropeços; acidentes por falta de planejamento.',
        medidas: 'Realizar DDS e validação da APR antes do início. Manter a área organizada, limpa e sinalizada.'
      },
      {
        servico: '2. Mobilização e movimentação manual de materiais',
        comoFazer: 'Transportar materiais manuais e ferramentas leves utilizando carrinhos de mão ou transporte em dupla.',
        riscos: 'Postura inadequada; esforço físico excessivo; prensamento de membros; queda de materiais.',
        medidas: 'Adotar postura ergonômica correta (dobrar joelhos); dividir cargas acima de 20kg; usar luvas de proteção.'
      },
      {
        servico: '3. Execução dos serviços gerais de apoio na obra',
        comoFazer: 'Realizar organização, apoio operacional e auxílio às equipes mantendo a área limpa e transitável.',
        riscos: 'Projeção de partículas; tropeços; poeira em suspensão; ruído ambiente.',
        medidas: 'Usar óculos de segurança, protetor auditivo e máscara PFF2. Manter acessos desobstruídos.'
      },
      {
        servico: '4. Limpeza final, retirada do isolamento e liberação da área',
        comoFazer: 'Recolher ferramentas, remover resíduos, desmontar isolamento e liberar a área após inspeção final.',
        riscos: 'Quedas no mesmo nível; cortes; contato com resíduos; esforço físico.',
        medidas: 'Utilizar EPIs completos. Verificar ausência de interferências elétricas/hidráulicas antes da liberação.'
      }
    ]
  },
  ELETRICA: {
    title: 'Instalações e Manutenção Elétrica em Baixa Tensão',
    tipoServico: 'Manutenção',
    epis: { capacete: true, oculos: true, calcado: true, luvas: true, mascara: false, colete: true, protetorAuditivo: true, cintoParaquedista: false },
    epcs: [
      'Quadros elétricos protegidos, fechados e sinalizados',
      'Bloqueio e sinalização de fontes de energia (LOTO)',
      'Cones, balizadores, cavaletes e barreiras de sinalização',
      'Fita zebrada, para sinalização e delimitação visual',
      'Placas de sinalização de segurança (obrigação, advertência, proibição, emergência)'
    ],
    anexos: ['ANEXO A - PT', 'ANEXO B - LOTO', 'ANEXO F - TRABALHOS ELÉTRICOS'],
    steps: [
      {
        servico: '1. Planejamento, bloqueio e sinalização (LOTO)',
        comoFazer: 'Desligar disjuntores da rede, aplicar cadeados e etiquetas de bloqueio (LOTO) e testar ausência de tensão com multímetro.',
        riscos: 'Choque elétrico; religamento acidental; arco elétrico; queimaduras graves.',
        medidas: 'Cumprir rigorosamente a NR-10. Utilizar luvas isolantes de borracha, óculos e vestimenta anti-arco elétrico.'
      },
      {
        servico: '2. Passagem de cabos, conexões e montagem de quadros',
        comoFazer: 'Executar passagem de condutores por eletrodutos e fixação em quadros utilizando ferramentas manuais isoladas (1000V).',
        riscos: 'Cortes nas mãos; postura inadequada; prensamento; esforço repetitivo.',
        medidas: 'Usar ferramentas com isolamento certificado de 1000V. Utilizar luvas de proteção mecânica/mista.'
      },
      {
        servico: '3. Testes, religamento e liberação do circuito',
        comoFazer: 'Remover bloqueios LOTO, comunicar a equipe, religar disjuntores e realizar medições finais.',
        riscos: 'Curto-circuito; choque elétrico por contato inadvertido; falha em isolamento.',
        medidas: 'Garantir que nenhum trabalhador esteja em contato com partes energizadas durante o teste de religamento.'
      }
    ]
  },
  PINTURA: {
    title: 'Pintura, Lixamento e Preparação de Superfícies',
    tipoServico: 'Manutenção',
    epis: { capacete: true, oculos: true, calcado: true, luvas: true, mascara: true, colete: true, protetorAuditivo: true, cintoParaquedista: false },
    epcs: [
      'Sistema de exaustão/ventilação coletiva para poeiras, fumos ou gases',
      'Anteparos e biombos de proteção para partículas, solda ou corte',
      'Fita zebrada, para sinalização e delimitação visual',
      'Placas de sinalização de segurança (obrigação, advertência, proibição, emergência)',
      'Bacias de contenção para produtos químicos'
    ],
    anexos: ['ANEXO A - PT'],
    steps: [
      {
        servico: '1. Preparação da área e lixamento de superfícies',
        comoFazer: 'Lixar superfícies de alvenaria ou estrutura metálica e isolar áreas adjacentes com lona e fita crepe.',
        riscos: 'Inalação de poeira; projeção de partículas nos olhos; irritação cutânea.',
        medidas: 'Uso obrigatório de respirador PFF2/máscara com filtro, óculos ampla visão e luvas de proteção.'
      },
      {
        servico: '2. Aplicação de tintas e solventes (Rolo, Pincel ou Airless)',
        comoFazer: 'Preparar a mistura de tintas em local ventilado e aplicar no perímetro autorizado.',
        riscos: 'Inalação de vapores orgânicos; contato com produtos químicos; respingos nos olhos; risco de incêndio.',
        medidas: 'Trabalhar em local bem ventilado. Usar máscara com filtro para vapores orgânicos, macacão de proteção e luvas nitrílicas.'
      },
      {
        servico: '3. Limpeza do maquinário e descarte de resíduos químicos',
        comoFazer: 'Lavar pinceis/equipamentos e descartar estopas e latas nos recipientes de resíduos perigosos.',
        riscos: 'Vazamento de resíduos químicos; contaminação do solo; dermatite de contato.',
        medidas: 'Utilizar luvas impermeáveis e óculos. Descartar resíduos nos tambores identificados de Coleta Seletiva.'
      }
    ]
  },
  ALTURA: {
    title: 'Trabalho em Altura / Montagem de Andaimes e Plataformas',
    tipoServico: 'Construção',
    epis: { capacete: true, oculos: true, calcado: true, luvas: true, mascara: false, colete: true, protetorAuditivo: false, cintoParaquedista: true },
    epcs: [
      'Linha de vida e pontos/sistemas de ancoragem (proteção coletiva)',
      'Cones, balizadores, cavaletes e barreiras de sinalização',
      'Fita zebrada, para sinalização e delimitação visual',
      'Placas de sinalização de segurança (obrigação, advertência, proibição, emergência)',
      'Sinalização de áreas de circulação sujeitas à queda de objetos'
    ],
    anexos: ['ANEXO A - PT', 'ANEXO C - TRABALHO EM ALTURA', 'ANEXO C1 - AVALIAÇÃO FÍSICA', 'ANEXO C2 - INSPEÇÃO DE CINTOS', 'ANEXO E - ACESSO AO TELHADO'],
    steps: [
      {
        servico: '1. Inspeção de EPIs de Altura e Sistema de Ancoragem',
        comoFazer: 'Inspecionar cinto paraquedista, talabarte duplo, linha de vida e pontos de ancoragem testados antes do acesso.',
        riscos: 'Queda de diferente nível; ruptura de componentes; ancoragem inadequada; queda de objetos.',
        medidas: 'Cumprir a NR-35. Ancorar o talabarte 100% do tempo em local seguro acima da cabeça. Isolar o perímetro inferior.'
      },
      {
        servico: '2. Execução da atividade posicionada sobre o andaime/plataforma',
        comoFazer: 'Executar os trabalhos posicionados sobre piso de andaime forrado e travado, com guarda-corpo e rodapé.',
        riscos: 'Queda de ferramentas sobre terceiros; perda de equilíbrio; tontura; mal súbito.',
        medidas: 'Amarrar todas as ferramentas manuais com fiel/corda de segurança. Não arremessar materiais. Usar capacete com jugular.'
      },
      {
        servico: '3. Desmobilização da altura e limpeza da área',
        comoFazer: 'Descer materiais com uso de corda/pórtico, desengatar ancoragem e recolher isolamento do solo.',
        riscos: 'Queda na descida; impacto de objetos em transeuntes.',
        medidas: 'Manter a linha de vida conectada até a chegada no solo. Manter isolamento inferior ativo até o término total.'
      }
    ]
  }
}

export default function GeradorAprPage() {
  const today = new Date().toISOString().split('T')[0]

  // Lista Dinâmica de Modelos
  const [templates, setTemplates] = useState<Record<string, TemplateItem>>(DEFAULT_TEMPLATES)

  // Estados da APR Ativa
  const [dataObra, setDataObra] = useState(today)
  const [empresa, setEmpresa] = useState('QUATTRO CONSTRUTORA E INCORPORADORA LTDA')
  const [cnpj, setCnpj] = useState('00.000.000/0001-00')
  const [obraNome, setObraNome] = useState('PROJETO AMAZON')
  const [localSetor, setLocalSetor] = useState('Galpão Principal / Área Operacional')
  const [responsavelTst, setResponsavelTst] = useState('')
  const [descricaoAtividade, setDescricaoAtividade] = useState('Serviços Gerais / Carga e Descarga de Materiais')
  const [tipoServico, setTipoServico] = useState<'Construção' | 'Manutenção' | 'Comercial' | 'Emergência'>('Construção')
  const [numAssinaturas, setNumAssinaturas] = useState<number>(8)
  const [observacoes, setObservacoes] = useState('Atividade restrita aos colaboradores treinados e com exames/ASO válidos no sistema SST.')

  // EPIs
  const [epis, setEpis] = useState({
    capacete: true,
    oculos: true,
    calcado: true,
    luvas: true,
    mascara: true,
    colete: true,
    protetorAuditivo: false,
    cintoParaquedista: false,
    outros: '',
  })

  // Lista Dinâmica de EPCs
  const [epcList, setEpcList] = useState<EpcItem[]>(
    DEFAULT_EPCS.map((name, i) => ({ id: `epc_${i}`, name }))
  )

  // EPCs Selecionados
  const [selectedEpcs, setSelectedEpcs] = useState<Record<string, boolean>>({
    'Cones, balizadores, cavaletes e barreiras de sinalização': true,
    'Fita zebrada, para sinalização e delimitação visual': true,
    'Placas de sinalização de segurança (obrigação, advertência, proibição, emergência)': true,
  })

  // Lista Dinâmica de Anexos
  const [anexoList, setAnexoList] = useState<AnexoItem[]>(
    DEFAULT_ANEXOS.map((name, i) => ({ id: `anexo_${i}`, name }))
  )

  // Anexos Selecionados
  const [selectedAnexos, setSelectedAnexos] = useState<Record<string, boolean>>({
    'ANEXO A - PT': true,
  })

  // Passos em edição
  const [passos, setPassos] = useState<AprStep[]>(DEFAULT_TEMPLATES.GERAL.steps)

  // Estados do Modal de Atividade Customizada
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newActivityTitle, setNewActivityTitle] = useState('')
  const [newActivitySteps, setNewActivityTitleSteps] = useState<AprStep[]>([
    {
      servico: '1. Leitura e validação da APR',
      comoFazer: 'Orientações iniciais e DDS com a equipe antes do início.',
      riscos: 'Falta de informação e planejamento inadequado.',
      medidas: 'Realizar DDS e leitura da APR com todos os colaboradores.'
    }
  ])

  // Estados do Modal de Novo EPC
  const [isEpcModalOpen, setIsEpcModalOpen] = useState(false)
  const [newEpcName, setNewEpcName] = useState('')

  // Estados do Modal de Novo Anexo
  const [isAnexoModalOpen, setIsAnexoModalOpen] = useState(false)
  const [newAnexoName, setNewAnexoName] = useState('')

  // Estado do Modal de Confirmação de Exclusão
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'TEMPLATE' | 'EPC' | 'ANEXO'
    keyOrObj: string | EpcItem | AnexoItem
    name: string
  } | null>(null)

  // CARREGAR DADOS SALVOS NO LOCALSTORAGE
  useEffect(() => {
    const savedTemplates = localStorage.getItem('apr_all_templates_v3')
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates))
      } catch (e) {
        console.error('Erro ao carregar modelos:', e)
      }
    }

    const savedCompanyData = localStorage.getItem('apr_last_used_company_data')
    if (savedCompanyData) {
      try {
        const parsedData = JSON.parse(savedCompanyData)
        if (parsedData.empresa) setEmpresa(parsedData.empresa)
        if (parsedData.cnpj) setCnpj(parsedData.cnpj)
        if (parsedData.obraNome) setObraNome(parsedData.obraNome)
        if (parsedData.localSetor) setLocalSetor(parsedData.localSetor)
        if (parsedData.responsavelTst) setResponsavelTst(parsedData.responsavelTst)
      } catch (e) {
        console.error('Erro ao carregar dados salvos da empresa:', e)
      }
    }

    const savedEpcs = localStorage.getItem('apr_all_epcs_v3')
    if (savedEpcs) {
      try {
        setEpcList(JSON.parse(savedEpcs))
      } catch (e) {
        console.error('Erro ao carregar EPCs:', e)
      }
    }

    const savedAnexos = localStorage.getItem('apr_all_anexos_v3')
    if (savedAnexos) {
      try {
        setAnexoList(JSON.parse(savedAnexos))
      } catch (e) {
        console.error('Erro ao carregar Anexos:', e)
      }
    }
  }, [])

  // SALVAR AUTOMATICAMENTE OS DADOS DA EMPRESA A CADA ALTERAÇÃO
  useEffect(() => {
    const dataToSave = {
      empresa,
      cnpj,
      obraNome,
      localSetor,
      responsavelTst,
    }
    localStorage.setItem('apr_last_used_company_data', JSON.stringify(dataToSave))
  }, [empresa, cnpj, obraNome, localSetor, responsavelTst])

  // Selecionar Modelo com Auto-preenchimento Inteligente de todas as seções
  const handleSelectPreset = (key: string) => {
    const item = templates[key]
    if (item) {
      setPassos(item.steps)
      setDescricaoAtividade(item.title)

      if (item.tipoServico) {
        setTipoServico(item.tipoServico)
      }

      if (item.epis) {
        setEpis((prev) => ({ ...prev, ...item.epis }))
      }

      if (item.epcs) {
        const newSelectedEpcs: Record<string, boolean> = {}
        item.epcs.forEach((epcName) => {
          newSelectedEpcs[epcName] = true
        })
        setSelectedEpcs(newSelectedEpcs)
      }

      if (item.anexos) {
        const newSelectedAnexos: Record<string, boolean> = {}
        item.anexos.forEach((anxName) => {
          newSelectedAnexos[anxName] = true
        })
        setSelectedAnexos(newSelectedAnexos)
      }
    }
  }

  // Solicitadores de Exclusão (Abrem Modal de Confirmação)
  const requestDeleteTemplate = (e: React.MouseEvent, key: string) => {
    e.stopPropagation()
    setDeleteTarget({
      type: 'TEMPLATE',
      keyOrObj: key,
      name: templates[key].title
    })
  }

  const requestDeleteEpc = (e: React.MouseEvent, epcObj: EpcItem) => {
    e.stopPropagation()
    setDeleteTarget({
      type: 'EPC',
      keyOrObj: epcObj,
      name: epcObj.name
    })
  }

  const requestDeleteAnexo = (e: React.MouseEvent, anexoObj: AnexoItem) => {
    e.stopPropagation()
    setDeleteTarget({
      type: 'ANEXO',
      keyOrObj: anexoObj,
      name: anexoObj.name
    })
  }

  // Confirmação Efetiva da Exclusão
  const handleConfirmDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'TEMPLATE') {
      const key = deleteTarget.keyOrObj as string
      const updated = { ...templates }
      delete updated[key]
      setTemplates(updated)
      localStorage.setItem('apr_all_templates_v3', JSON.stringify(updated))
    } else if (deleteTarget.type === 'EPC') {
      const epcObj = deleteTarget.keyOrObj as EpcItem
      const updatedList = epcList.filter((item) => item.id !== epcObj.id)
      setEpcList(updatedList)

      setSelectedEpcs((prev) => {
        const copy = { ...prev }
        delete copy[epcObj.name]
        return copy
      })

      localStorage.setItem('apr_all_epcs_v3', JSON.stringify(updatedList))
    } else if (deleteTarget.type === 'ANEXO') {
      const anexoObj = deleteTarget.keyOrObj as AnexoItem
      const updatedList = anexoList.filter((item) => item.id !== anexoObj.id)
      setAnexoList(updatedList)

      setSelectedAnexos((prev) => {
        const copy = { ...prev }
        delete copy[anexoObj.name]
        return copy
      })

      localStorage.setItem('apr_all_anexos_v3', JSON.stringify(updatedList))
    }

    setDeleteTarget(null)
  }

  // Salvar Nova Atividade
  const handleSaveNewActivity = () => {
    if (!newActivityTitle.trim()) {
      alert('Por favor, informe o título da nova atividade.')
      return
    }

    const currentEpcNames = Object.keys(selectedEpcs).filter((k) => selectedEpcs[k])
    const currentAnexoNames = Object.keys(selectedAnexos).filter((k) => selectedAnexos[k])

    const newKey = 'CUSTOM_' + Date.now()
    const newTemplateObj: TemplateItem = {
      title: newActivityTitle.trim(),
      tipoServico: tipoServico,
      epis: { ...epis },
      epcs: currentEpcNames,
      anexos: currentAnexoNames,
      steps: newActivitySteps
    }

    const updatedTemplates = { ...templates, [newKey]: newTemplateObj }
    setTemplates(updatedTemplates)
    localStorage.setItem('apr_all_templates_v3', JSON.stringify(updatedTemplates))

    setPassos(newActivitySteps)
    setDescricaoAtividade(newActivityTitle.trim())

    setNewActivityTitle('')
    setNewActivityTitleSteps([
      {
        servico: '1. Leitura e validação da APR',
        comoFazer: 'Orientações iniciais e DDS com a equipe antes do início.',
        riscos: 'Falta de informação e planejamento inadequado.',
        medidas: 'Realizar DDS e leitura da APR com todos os colaboradores.'
      }
    ])
    setIsModalOpen(false)
  }

  // Salvar Novo EPC
  const handleSaveNewEpc = () => {
    const trimmed = newEpcName.trim()
    if (!trimmed) {
      alert('Por favor, informe a descrição do novo EPC.')
      return
    }

    const newEpcObj: EpcItem = {
      id: `epc_${Date.now()}`,
      name: trimmed
    }

    const updatedList = [...epcList, newEpcObj]
    setEpcList(updatedList)

    setSelectedEpcs((prev) => ({ ...prev, [trimmed]: true }))
    localStorage.setItem('apr_all_epcs_v3', JSON.stringify(updatedList))

    setNewEpcName('')
    setIsEpcModalOpen(false)
  }

  // Salvar Novo Anexo
  const handleSaveNewAnexo = () => {
    const trimmed = newAnexoName.trim().toUpperCase()
    if (!trimmed) {
      alert('Por favor, informe o nome do novo Anexo.')
      return
    }

    const newAnexoObj: AnexoItem = {
      id: `anexo_${Date.now()}`,
      name: trimmed
    }

    const updatedList = [...anexoList, newAnexoObj]
    setAnexoList(updatedList)

    setSelectedAnexos((prev) => ({ ...prev, [trimmed]: true }))
    localStorage.setItem('apr_all_anexos_v3', JSON.stringify(updatedList))

    setNewAnexoName('')
    setIsAnexoModalOpen(false)
  }

  const handleAddStep = () => {
    setPassos([
      ...passos,
      {
        servico: `${passos.length + 1}. Nova Etapa de Trabalho`,
        comoFazer: 'Descrever a metodologia de execução...',
        riscos: 'Descrever os riscos da nova etapa...',
        medidas: 'Descrever as medidas preventivas...'
      }
    ])
  }

  const handleRemoveStep = (index: number) => {
    setPassos(passos.filter((_, i) => i !== index))
  }

  const handleStepChange = (index: number, field: keyof AprStep, value: string) => {
    const updated = [...passos]
    updated[index][field] = value
    setPassos(updated)
  }

  const handleModalAddStep = () => {
    setNewActivityTitleSteps([
      ...newActivitySteps,
      {
        servico: `${newActivitySteps.length + 1}. Nova Etapa`,
        comoFazer: '',
        riscos: '',
        medidas: ''
      }
    ])
  }

  const handleModalRemoveStep = (idx: number) => {
    setNewActivityTitleSteps(newActivitySteps.filter((_, i) => i !== idx))
  }

  const handleModalStepChange = (idx: number, field: keyof AprStep, val: string) => {
    const updated = [...newActivitySteps]
    updated[idx][field] = val
    setNewActivityTitleSteps(updated)
  }

  const toggleEpc = (epcName: string) => {
    setSelectedEpcs((prev) => ({ ...prev, [epcName]: !prev[epcName] }))
  }

  const toggleAnexo = (anexoName: string) => {
    setSelectedAnexos((prev) => ({ ...prev, [anexoName]: !prev[anexoName] }))
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 print:bg-white print:p-0">
      
      {/* PAINEL DE CONTROLE E EDIÇÃO (OCULTO NA IMPRESSÃO) */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 print:hidden space-y-6">
        
        {/* CABEÇALHO DA INTERFACE — ALINHAMENTO LADO A LADO SEM ESPAÇO FANTASMA */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 px-1">
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20 shrink-0">
              <Image
                src="/img/login/logo_construtora.png"
                alt="Quattro Construtora"
                fill
                unoptimized
                className="object-contain object-left"
                priority
              />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 inline-block whitespace-nowrap">
                Módulo Técnico de SST
              </span>
              <h1 className="text-2xl font-black uppercase text-gray-900 mt-0.5 whitespace-nowrap">
                Gerador de APR
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/cliente"
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold uppercase rounded-xl transition-colors whitespace-nowrap"
            >
              ← Painel do Cliente
            </Link>

            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              🖨️ Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Seleção de Templates Rápidos */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase text-gray-700 block">
              ⚡ Carregar Modelo de Atividade (Atualiza e Libera para Edição):
            </label>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              ➕ Cadastrar Nova Atividade
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {Object.keys(templates).map((key) => {
              const item = templates[key]
              return (
                <div key={key} className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 hover:border-gray-400 rounded-lg p-1 transition-all">
                  <button
                    onClick={() => handleSelectPreset(key)}
                    className="px-2.5 py-1 text-gray-800 text-xs font-bold uppercase hover:text-black cursor-pointer text-left"
                  >
                    + {item.title}
                  </button>

                  <button
                    onClick={(e) => requestDeleteTemplate(e, key)}
                    title="Excluir este modelo"
                    className="text-red-500 hover:text-red-700 font-black px-1.5 py-0.5 text-xs hover:bg-red-50 rounded cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* 1. Dados da Empresa e Obra */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold uppercase text-gray-900">
              1. Dados da Empresa, Obra e Atividade
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Dados salvos automaticamente
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Razão Social / Empresa:</label>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg font-medium uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">CNPJ:</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Nome da Obra:</label>
              <input
                type="text"
                value={obraNome}
                onChange={(e) => setObraNome(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg font-medium uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Local / Setor de Trabalho:</label>
              <input
                type="text"
                value={localSetor}
                onChange={(e) => setLocalSetor(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg font-medium uppercase"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">Descrição do Serviço / Atividade:</label>
              <input
                type="text"
                value={descricaoAtividade}
                onChange={(e) => setDescricaoAtividade(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg font-medium uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Responsável TST:</label>
              <input
                type="text"
                placeholder="Nome do TST"
                value={responsavelTst}
                onChange={(e) => setResponsavelTst(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg font-medium uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Data da APR:</label>
              <input
                type="date"
                value={dataObra}
                onChange={(e) => setDataObra(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Tipo de Serviço:</label>
              <select
                value={tipoServico}
                onChange={(e) => setTipoServico(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-lg font-bold"
              >
                <option value="Construção">Construção</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Comercial">Comercial</option>
                <option value="Emergência">Emergência</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Seleção de EPIs e EPCs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
          <h2 className="text-sm font-bold uppercase text-gray-900 border-b pb-2">
            2. Equipamentos de Proteção (EPIs / EPCs)
          </h2>

          <div>
            <label className="font-bold text-xs uppercase text-amber-800 block mb-2">
              EPI — Equipamentos de Proteção Individual:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={!!epis.capacete} onChange={(e) => setEpis({ ...epis, capacete: e.target.checked })} />
                Capacete com Jugular
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={!!epis.oculos} onChange={(e) => setEpis({ ...epis, oculos: e.target.checked })} />
                Óculos de Segurança
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={!!epis.calcado} onChange={(e) => setEpis({ ...epis, calcado: e.target.checked })} />
                Calçado de Segurança
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={!!epis.luvas} onChange={(e) => setEpis({ ...epis, luvas: e.target.checked })} />
                Luvas (Látex/Anti-corte)
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={!!epis.mascara} onChange={(e) => setEpis({ ...epis, mascara: e.target.checked })} />
                Máscara Filtro PFF2
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={!!epis.colete} onChange={(e) => setEpis({ ...epis, colete: e.target.checked })} />
                Colete Refletivo
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={!!epis.protetorAuditivo} onChange={(e) => setEpis({ ...epis, protetorAuditivo: e.target.checked })} />
                Protetor Auditivo
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={!!epis.cintoParaquedista} onChange={(e) => setEpis({ ...epis, cintoParaquedista: e.target.checked })} />
                Cinto Paraquedista (NR-35)
              </label>
            </div>

            <div className="pt-2">
              <input
                type="text"
                placeholder="Outros EPIs / Equipamentos específicos..."
                value={epis.outros as string}
                onChange={(e) => setEpis({ ...epis, outros: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-xs uppercase text-amber-800 block">
                EPC — Equipamentos de Proteção Coletiva Aplicáveis:
              </label>
              <button
                onClick={() => setIsEpcModalOpen(true)}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[11px] font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1"
              >
                ➕ Cadastrar Novo EPC
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {epcList.map((epcObj) => (
                <div key={epcObj.id} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200">
                  <label className="flex items-start gap-2 cursor-pointer font-medium flex-1">
                    <input
                      type="checkbox"
                      checked={!!selectedEpcs[epcObj.name]}
                      onChange={() => toggleEpc(epcObj.name)}
                      className="mt-0.5"
                    />
                    <span>{epcObj.name}</span>
                  </label>

                  <button
                    onClick={(e) => requestDeleteEpc(e, epcObj)}
                    title="Excluir este EPC"
                    className="text-red-500 hover:text-red-700 font-bold px-1.5 text-xs hover:bg-red-50 rounded cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Seleção de Anexos do Documento com Adicionar e Excluir */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold uppercase text-gray-900">
              3. Anexos Obrigatórios Vinculados à APR
            </h2>
            <button
              onClick={() => setIsAnexoModalOpen(true)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[11px] font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1"
            >
              ➕ Cadastrar Novo Anexo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 text-xs">
            {anexoList.map((anexoObj) => (
              <div key={anexoObj.id} className="flex items-center justify-between p-1.5 rounded hover:bg-amber-50/50 border border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer font-bold flex-1">
                  <input
                    type="checkbox"
                    checked={!!selectedAnexos[anexoObj.name]}
                    onChange={() => toggleAnexo(anexoObj.name)}
                  />
                  <span>{anexoObj.name}</span>
                </label>

                <button
                  onClick={(e) => requestDeleteAnexo(e, anexoObj)}
                  title="Excluir este Anexo"
                  className="text-red-500 hover:text-red-700 font-bold px-1.5 text-xs hover:bg-red-50 rounded cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Tabela de Passos Totalmente Editável */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-sm font-bold uppercase text-gray-900">
                4. Etapas de Execução, Riscos e Medidas Preventivas
              </h2>
              <p className="text-xs text-gray-500">
                Altere qualquer texto abaixo. Os dados serão atualizados no documento de impressão.
              </p>
            </div>
            <button
              onClick={handleAddStep}
              className="px-3.5 py-1.5 bg-[#333333] text-white text-xs font-bold uppercase rounded-xl hover:bg-black transition-colors"
            >
              + Adicionar Etapa
            </button>
          </div>

          <div className="space-y-4">
            {passos.map((step, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs relative">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-black uppercase text-amber-700 text-xs">
                    Etapa #{idx + 1}
                  </span>
                  {passos.length > 1 && (
                    <button
                      onClick={() => handleRemoveStep(idx)}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Qual serviço será executado?</label>
                    <input
                      type="text"
                      value={step.servico}
                      onChange={(e) => handleStepChange(idx, 'servico', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Como será feito?</label>
                    <input
                      type="text"
                      value={step.comoFazer}
                      onChange={(e) => handleStepChange(idx, 'comoFazer', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Riscos Envolvidos:</label>
                    <textarea
                      rows={2}
                      value={step.riscos}
                      onChange={(e) => handleStepChange(idx, 'riscos', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Medidas Preventivas / Controle:</label>
                    <textarea
                      rows={2}
                      value={step.medidas}
                      onChange={(e) => handleStepChange(idx, 'medidas', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Linhas de Assinatura */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between text-xs">
          <div>
            <label className="font-bold text-gray-900 block">Número de Colaboradores para Assinatura:</label>
            <p className="text-gray-500">Ajusta as linhas na folha impressa para coleta de assinaturas em campo.</p>
          </div>
          <select
            value={numAssinaturas}
            onChange={(e) => setNumAssinaturas(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-lg font-bold"
          >
            <option value={4}>4 Colaboradores</option>
            <option value={8}>8 Colaboradores</option>
            <option value={12}>12 Colaboradores</option>
            <option value={16}>16 Colaboradores</option>
          </select>
        </div>

      </div>

      {/* MODAL PARA CADASTRAR NOVA ATIVIDADE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-gray-900">
                  ➕ Cadastrar Novo Modelo de Atividade
                </h3>
                <p className="text-xs text-gray-500">
                  Esta atividade ficará salva na lista para uso em futuras APRs.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-black text-gray-900 uppercase block mb-1">
                  Título da Atividade / Serviço:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Montagem e Manutenção de Estruturas Metálicas"
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold uppercase text-gray-900"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 uppercase">Etapas do Modelo:</span>
                  <button
                    onClick={handleModalAddStep}
                    className="px-3 py-1 bg-gray-900 text-white font-bold rounded-lg text-[11px]"
                  >
                    + Etapa
                  </button>
                </div>

                {newActivitySteps.map((st, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 relative">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="font-bold text-amber-700 text-[11px]">Passo #{i + 1}</span>
                      {newActivitySteps.length > 1 && (
                        <button
                          onClick={() => handleModalRemoveStep(i)}
                          className="text-red-600 font-bold text-[10px]"
                        >
                          Excluir
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Qual serviço será executado?"
                        value={st.servico}
                        onChange={(e) => handleModalStepChange(i, 'servico', e.target.value)}
                        className="p-1.5 border rounded bg-white font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Como será feito?"
                        value={st.comoFazer}
                        onChange={(e) => handleModalStepChange(i, 'comoFazer', e.target.value)}
                        className="p-1.5 border rounded bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Riscos envolvidos"
                        value={st.riscos}
                        onChange={(e) => handleModalStepChange(i, 'riscos', e.target.value)}
                        className="p-1.5 border rounded bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Medidas preventivas"
                        value={st.medidas}
                        onChange={(e) => handleModalStepChange(i, 'medidas', e.target.value)}
                        className="p-1.5 border rounded bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-bold uppercase rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewActivity}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase rounded-xl shadow-md"
              >
                💾 Salvar e Usar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CADASTRAR NOVO EPC */}
      {isEpcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-gray-900">
                  ➕ Cadastrar Novo EPC
                </h3>
                <p className="text-xs text-gray-500">
                  Adicione um Equipamento de Proteção Coletiva à lista.
                </p>
              </div>
              <button
                onClick={() => setIsEpcModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-black text-gray-900 uppercase block mb-1">
                  Nome do EPC:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rede de proteção de periféricos, Linha Guia..."
                  value={newEpcName}
                  onChange={(e) => setNewEpcName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setIsEpcModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-bold uppercase rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewEpc}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase rounded-xl shadow-md"
              >
                💾 Salvar e Selecionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CADASTRAR NOVO ANEXO */}
      {isAnexoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-gray-900">
                  ➕ Cadastrar Novo Anexo
                </h3>
                <p className="text-xs text-gray-500">
                  Adicione um Anexo Obrigatório ou Documento Vinculado à lista.
                </p>
              </div>
              <button
                onClick={() => setIsAnexoModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-black text-gray-900 uppercase block mb-1">
                  Nome / Identificação do Anexo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: ANEXO K - PERMISSÃO PARA TRABALHO EM ESPAÇO RESTRITO"
                  value={newAnexoName}
                  onChange={(e) => setNewAnexoName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold uppercase text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setIsAnexoModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-bold uppercase rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewAnexo}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase rounded-xl shadow-md"
              >
                💾 Salvar e Selecionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE SEGURANÇA */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 border-b pb-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-base font-black uppercase text-gray-900">
                  ATENÇÃO: DESEJA REMOVER O ÍTEM DO SISTEMA?
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              <strong className="block text-gray-900 font-bold uppercase mt-1 bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                {deleteTarget.name}
              </strong>
            </p>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-extrabold uppercase rounded-xl transition-colors cursor-pointer"
              >
                NÃO
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl shadow-md transition-colors cursor-pointer"
              >
                SIM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTO OFICIAL A4 PARA IMPRESSÃO E PRANCHETA */}
      <div
        id="printable-apr"
        className="max-w-[210mm] mx-auto bg-white p-6 shadow-2xl print:shadow-none print:max-w-none print:w-full print:p-0"
      >
        {/* CABEÇALHO DA IMPRESSÃO */}
        <div className="border-2 border-black p-3 space-y-2">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            
            {/* GRUPO ESQUERDO: LOGO + CAIXA DE TÍTULO APR */}
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <Image
                  src="/img/login/logo_construtora.png"
                  alt="Quattro Construtora"
                  fill
                  unoptimized
                  className="object-contain object-left"
                  priority
                />
              </div>

              <h2 className="text-base font-black uppercase tracking-wider bg-gray-200 px-3 py-1 border border-black whitespace-nowrap">
                ANÁLISE PRELIMINAR DE RISCO — APR
              </h2>
            </div>

            {/* GRUPO DIREITO: DATA E OBRA */}
            <div className="text-right text-[9px] font-bold shrink-0">
              <p>Data: {new Date(dataObra + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              <p>Obra: {obraNome}</p>
            </div>
          </div>

          {/* DADOS DA EMPRESA E TIPO DE SERVIÇO */}
          <div className="text-[9.5px] space-y-1">
            <div className="grid grid-cols-2 gap-2 border-b pb-1">
              <p><strong>Empresa:</strong> {empresa}</p>
              <p><strong>CNPJ:</strong> {cnpj}</p>
              <p><strong>Atividade:</strong> {descricaoAtividade}</p>
              <p><strong>Local / Setor:</strong> {localSetor}</p>
            </div>

            <div className="flex items-center gap-6 pt-1 font-bold">
              <span>DADOS DOS SERVIÇOS:</span>
              <span className={tipoServico === 'Construção' ? 'text-black font-black' : 'text-gray-400'}>
                [{tipoServico === 'Construção' ? 'X' : '  '}] Construção
              </span>
              <span className={tipoServico === 'Manutenção' ? 'text-black font-black' : 'text-gray-400'}>
                [{tipoServico === 'Manutenção' ? 'X' : '  '}] Manutenção
              </span>
              <span className={tipoServico === 'Comercial' ? 'text-black font-black' : 'text-gray-400'}>
                [{tipoServico === 'Comercial' ? 'X' : '  '}] Comercial
              </span>
              <span className={tipoServico === 'Emergência' ? 'text-black font-black' : 'text-gray-400'}>
                [{tipoServico === 'Emergência' ? 'X' : '  '}] Emergência
              </span>
            </div>
          </div>
        </div>

        {/* EPIs, EPCs E ANEXOS */}
        <div className="border-x-2 border-b-2 border-black p-3 space-y-2 text-[9px]">
          <div>
            <strong className="block uppercase border-b border-gray-400 pb-0.5 mb-1">
              EPI — Equipamento de Proteção Individual Obrigatórios:
            </strong>
            <div className="grid grid-cols-3 gap-1 font-medium">
              <p>[{epis.capacete ? 'X' : ' '}] Capacete com jugular</p>
              <p>[{epis.oculos ? 'X' : ' '}] Óculos de segurança</p>
              <p>[{epis.calcado ? 'X' : ' '}] Calçado de segurança</p>
              <p>[{epis.luvas ? 'X' : ' '}] Luva látex / anti-corte</p>
              <p>[{epis.mascara ? 'X' : ' '}] Máscara Filtro PFF2</p>
              <p>[{epis.colete ? 'X' : ' '}] Colete/faixa refletiva</p>
              {epis.protetorAuditivo && <p>[X] Protetor Auditivo</p>}
              {epis.cintoParaquedista && <p>[X] Cinto Paraquedista (NR-35)</p>}
              {epis.outros && (
                <p className="col-span-3 font-bold text-black border-t pt-1 mt-1">
                  [X] OUTROS: {epis.outros}
                </p>
              )}
            </div>
          </div>

          {/* EPCs SELECIONADOS */}
          <div className="border-t border-gray-300 pt-1.5">
            <strong className="block uppercase border-b border-gray-400 pb-0.5 mb-1">
              EPC — Equipamentos de Proteção Coletiva Aplicáveis:
            </strong>
            <div className="grid grid-cols-2 gap-1 font-medium text-[8.5px]">
              {epcList.map((epcObj) => {
                const isChecked = !!selectedEpcs[epcObj.name]
                return (
                  <p key={epcObj.id} className={isChecked ? 'font-bold text-black' : 'text-gray-400'}>
                    [{isChecked ? 'X' : '  '}] {epcObj.name}
                  </p>
                )
              })}
            </div>
          </div>

          {/* ANEXOS VINCULADOS DADOS DINÂMICOS */}
          <div className="border-t border-gray-300 pt-1.5">
            <strong className="block uppercase border-b border-gray-400 pb-0.5 mb-1">
              DOCUMENTOS E ANEXOS COMPLEMENTARES VINCULADOS:
            </strong>
            <div className="grid grid-cols-3 gap-1 font-bold text-[8.5px]">
              {anexoList.map((anexoObj) => {
                const isChecked = !!selectedAnexos[anexoObj.name]
                return (
                  <p key={anexoObj.id} className={isChecked ? 'text-black font-black' : 'text-gray-400'}>
                    [{isChecked ? 'X' : '  '}] {anexoObj.name}
                  </p>
                )
              })}
            </div>
          </div>

          <div className="border-t border-gray-300 pt-1 leading-tight text-[8px] text-gray-800">
            <p><strong>RECOMENDAÇÕES GERAIS:</strong> Além dos EPIs e EPCs listados, é obrigatória a manutenção das áreas livres de resíduos e a delimitação de caminho seguro. O descumprimento das regras de SST sujeita o colaborador a penalidades regulamentares.</p>
          </div>
        </div>

        {/* TABELA DE PASSOS DA APR (LINHA A LINHA, SEM QUEBRAR LINHAS AO MEIO) */}
        <div className="border-x-2 border-b-2 border-black">
          <table className="w-full text-left border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-200 border-b-2 border-black font-black uppercase text-center">
                <th className="p-1.5 border-r border-black w-[22%]">Qual serviço será executado?</th>
                <th className="p-1.5 border-r border-black w-[28%]">Como será feito?</th>
                <th className="p-1.5 border-r border-black w-[25%]">Riscos envolvidos</th>
                <th className="p-1.5 w-[25%]">Medidas preventivas / Controle</th>
              </tr>
            </thead>
            <tbody>
              {passos.map((step, index) => (
                <tr key={index} className="border-b border-black/60 align-top">
                  <td className="p-1.5 border-r border-black/60 font-bold uppercase">{step.servico}</td>
                  <td className="p-1.5 border-r border-black/60">{step.comoFazer}</td>
                  <td className="p-1.5 border-r border-black/60">{step.riscos}</td>
                  <td className="p-1.5">{step.medidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABELA DE ASSINATURA DOS COLABORADORES */}
        <div className="border-x-2 border-b-2 border-black p-2 space-y-1">
          <p className="text-[9px] font-black uppercase text-center border-b border-black pb-1">
            DECLARAÇÃO E ASSINATURA DOS COLABORADORES (ORIENTADOS SOBRE OS RISCOS DA APR)
          </p>

          <table className="w-full text-left border-collapse text-[9px] mt-1">
            <thead>
              <tr className="bg-gray-100 border-b border-black font-bold uppercase text-center text-[8px]">
                <th className="p-1 border-r border-black w-[6%]">Nº</th>
                <th className="p-1 border-r border-black w-[54%]">Nome Completo (Legível)</th>
                <th className="p-1 w-[40%]">Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: numAssinaturas }).map((_, i) => (
                <tr key={i} className="border-b border-black/40 h-[8mm]">
                  <td className="p-1 border-r border-black/40 text-center font-bold text-[8.5px]">
                    {i + 1}
                  </td>
                  <td className="p-1 border-r border-black/40"></td>
                  <td className="p-1"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RODAPÉ COM LIBERAÇÃO E TST */}
        <div className="border-x-2 border-b-2 border-black p-2.5 text-[8.5px] flex items-center justify-between bg-gray-50 gap-4 print-avoid-break">
          <div className="flex-1 pr-2">
            <strong>Observações Gerais:</strong> {observacoes}
          </div>

          <div className="font-bold uppercase border-l-2 border-black pl-4 min-w-[340px] space-y-2 shrink-0">
            <div className="flex items-end justify-between gap-2">
              <span className="shrink-0 font-extrabold text-gray-900">TST RESPONSÁVEL:</span>
              <span className="flex-1 border-b border-black text-center font-bold text-[9px] min-h-[14px]">
                {responsavelTst}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 pt-1">
              <span className="shrink-0 font-extrabold text-gray-900">VISTO / LIBERAÇÃO:</span>
              <span className="flex-1 border-b border-black min-h-[14px]"></span>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}