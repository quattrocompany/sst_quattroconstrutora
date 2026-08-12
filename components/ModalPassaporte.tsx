'use client'

import React from 'react'
import Image from 'next/image'

interface PassaporteProps {
  worker: {
    name: string
    job_role?: string
    cpf: string
    company: string
    work_site?: string
    integration_date?: string
    issue_date?: string
    status: 'APTO' | 'INAPTO' | 'PENDENTE'
    documents?: Array<{
      document_type?: string
      title?: string
      expiry_date?: string
    }>
  }
  onClose: () => void
}

export default function ModalPassaporte({ worker, onClose }: PassaporteProps) {
  const handlePrint = () => {
    window.print()
  }

  const currentDate = worker.issue_date || new Date().toLocaleDateString('pt-BR')
  
  const formattedIntegrationDate =
    worker.integration_date && worker.integration_date.toLowerCase() !== 'recente'
      ? worker.integration_date
      : currentDate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-6">
        
        {/* BARRA DE AÇÕES (OCULTA NA IMPRESSÃO) */}
        <div className="flex items-center justify-between border-b pb-4 print:hidden">
          <div>
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
              Passaporte de Segurança SST — Padrão Banco
            </h3>
            <p className="text-xs text-gray-500">
              Formato horizontal (171.2mm x 53.98mm) • Dobra central ao meio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[#222222] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              🖨️ Imprimir Passaporte
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* CONTAINER DO CARTÃO IMPRESSÍVEL */}
        <div className="flex justify-center items-center py-6 bg-gray-200 rounded-2xl print:bg-transparent print:p-0">
          <div
            id="printable-passport"
            className="rounded-xl shadow-2xl relative overflow-hidden print:shadow-none border border-gray-700"
            style={{
              width: '171.2mm',
              height: '53.98mm',
              backgroundColor: '#333333',
              color: '#ffffff',
              boxSizing: 'border-box',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            <div className="grid grid-cols-2 h-full w-full relative gap-0">
              
              {/* LADO ESQUERDO: FRENTE (85.6mm x 53.98mm) */}
              <div className="flex flex-col justify-between h-full border-r-2 border-dashed border-gray-500/60 overflow-hidden">
                
                {/* CABEÇALHO FRENTE — FAIXA CINZA 30% DE PONTA A PONTA */}
                <div
                  className="px-3 py-1.5 flex items-center justify-between shadow-sm w-full shrink-0"
                  style={{ backgroundColor: '#B3B3B3' }}
                >
                  <div className="relative h-7 flex items-center">
                    <Image
                      src="/img/login/logo_construtora.png"
                      alt="Quattro Construtora"
                      width={150}
                      height={30}
                      className="object-contain object-left max-h-7 w-auto"
                      priority
                    />
                  </div>

                  <span
                    className="text-[7.5px] font-black uppercase tracking-wider text-black px-2 py-0.5 rounded shadow-sm shrink-0"
                    style={{ backgroundColor: '#F59E0B' }}
                  >
                    PASSAPORTE DE SEGURANÇA
                  </span>
                </div>

                {/* CORPO DA FRENTE — DADOS DO COLABORADOR */}
                <div className="p-2.5 flex flex-col justify-between flex-1 overflow-hidden">
                  
                  <div className="space-y-1 my-auto">
                    <div>
                      <span
                        className="text-[6.5px] font-black uppercase tracking-wider block leading-none"
                        style={{ color: '#F59E0B' }}
                      >
                        NOME COMPLETO
                      </span>
                      <p className="font-black uppercase text-white text-xs tracking-wide leading-snug truncate">
                        {worker.name}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <span
                          className="text-[6px] font-black uppercase tracking-wider block leading-none"
                          style={{ color: '#F59E0B' }}
                        >
                          CARGO / FUNÇÃO
                        </span>
                        <p className="font-bold text-white text-[10px] leading-tight truncate">
                          {worker.job_role || 'OPERACIONAL'}
                        </p>
                      </div>

                      <div>
                        <span
                          className="text-[6px] font-black uppercase tracking-wider block leading-none"
                          style={{ color: '#F59E0B' }}
                        >
                          CPF / RG
                        </span>
                        <p className="font-bold text-white text-[10px] leading-tight truncate">
                          {worker.cpf}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RODAPÉ FRENTE — CAIXINHA CINZA 10% */}
                  <div
                    className="p-1.5 rounded-lg grid grid-cols-3 gap-1 text-center shadow-sm shrink-0"
                    style={{ backgroundColor: '#E5E5E5' }}
                  >
                    <div className="truncate border-r border-gray-300 pr-1">
                      <span className="text-[5px] text-gray-600 uppercase font-bold block leading-none">EMPRESA</span>
                      <p className="font-black text-gray-900 truncate text-[8px] mt-0.5">{worker.company}</p>
                    </div>

                    <div className="truncate border-r border-gray-300 px-1">
                      <span className="text-[5px] text-gray-600 uppercase font-bold block leading-none">OBRA</span>
                      <p className="font-black text-gray-900 truncate text-[8px] mt-0.5">{worker.work_site || 'AMAZON'}</p>
                    </div>

                    <div className="truncate pl-1">
                      <span className="text-[5px] text-gray-600 uppercase font-bold block leading-none">INTEGRAÇÃO</span>
                      <p className="font-black text-[#D97706] truncate text-[8px] mt-0.5">{formattedIntegrationDate}</p>
                    </div>
                  </div>

                </div>

              </div>

              {/* LADO DIREITO: VERSO (85.6mm x 53.98mm) */}
              <div className="p-2.5 flex flex-col justify-between h-full overflow-hidden">
                
                {/* CABEÇALHO VERSO */}
                <div className="flex items-center justify-center pt-0.5 shrink-0">
                  <span
                    className="text-[8.5px] font-black uppercase tracking-widest text-center"
                    style={{ color: '#F59E0B' }}
                  >
                    TREINAMENTOS E AUTORIZAÇÕES
                  </span>
                </div>

                {/* GRADE 3x3 DE NRs — CAIXINHAS CINZA 10% */}
                <div className="grid grid-cols-3 gap-1 my-auto">
                  {[
                    { code: 'ASO', label: 'ASO' },
                    { code: 'NR01', label: 'NR-01' },
                    { code: 'NR06', label: 'NR-06' },
                    { code: 'NR10', label: 'NR-10' },
                    { code: 'NR11', label: 'NR-11' },
                    { code: 'NR12', label: 'NR-12' },
                    { code: 'NR18', label: 'NR-18' },
                    { code: 'NR33', label: 'NR-33' },
                    { code: 'NR35', label: 'NR-35' },
                  ].map((item) => {
                    const doc = worker.documents?.find((d) =>
                      (d.document_type || d.title || '').toUpperCase().includes(item.code)
                    )
                    return (
                      <div
                        key={item.code}
                        className="rounded-md p-1 text-center flex flex-col justify-center h-[10.5mm] shadow-sm"
                        style={{ backgroundColor: '#E5E5E5' }}
                      >
                        <span className="block font-black text-[7.5px] text-gray-900 leading-none">
                          {item.label}
                        </span>
                        <span
                          className={`block text-[6.5px] font-black leading-none mt-1 ${
                            doc ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        >
                          {doc ? doc.expiry_date : 'N/A'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* RODAPÉ VERSO — CAIXINHA CINZA 10% */}
                <div
                  className="flex items-center justify-between px-2 py-1 rounded-lg text-[6.5px] shadow-sm shrink-0"
                  style={{ backgroundColor: '#E5E5E5' }}
                >
                  <span className="text-gray-700 font-extrabold uppercase tracking-wider">
                    USO PESSOAL E OBRIGATÓRIO
                  </span>
                  <span className="text-gray-900 font-bold">
                    EMISSÃO: <strong className="text-[#D97706] font-black">{currentDate}</strong>
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}