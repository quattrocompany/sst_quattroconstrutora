'use client'

import React from 'react'
import Image from 'next/image'

interface PassaporteProps {
  worker: {
    name: string
    job_role: string
    cpf: string
    company: string
    work_site?: string
    integration_date?: string
    issue_date?: string
    status: 'APTO' | 'INAPTO' | 'PENDENTE'
    documents: Array<{
      document_type?: string
      title: string
      expiry_date: string
    }>
  }
  onClose?: () => void
}

export default function PassaporteModalPrint({ worker, onClose }: PassaporteProps) {
  const handlePrint = () => {
    window.print()
  }

  const currentDate = worker.issue_date || new Date().toLocaleDateString('pt-BR')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-6">
        
        {/* Barra de Ações (Oculta na Impressão) */}
        <div className="flex items-center justify-between border-b pb-4 print:hidden">
          <div>
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
              Passaporte da Segurança SST
            </h3>
            <p className="text-xs text-gray-500">
              Pronto para impressão em alta definição e dobra central.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[#4A4D50] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              🖨️ Imprimir Passaporte
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            )}
          </div>
        </div>

        {/* CARTÃO IMPRESSÍVEL (FRENTE E VERSO LADO A LADO) */}
        <div
          id="printable-passport"
          className="mx-auto bg-[#1E2022] text-white rounded-2xl p-6 border-2 border-gray-800 shadow-xl max-w-[950px] w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 relative">
            
            {/* LADO ESQUERDO: FRENTE */}
            <div className="p-5 md:pr-8 flex flex-col justify-between space-y-4">
              {/* Header Frente */}
              <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#F59E0B] text-black font-black rounded-lg flex items-center justify-center text-lg">
                    Q
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-white leading-none">
                      Quattro Construtora
                    </h2>
                    <span className="text-[9px] text-gray-400 font-semibold tracking-wider uppercase">
                      Segurança e Saúde
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#F59E0B] text-black px-2 py-1 rounded">
                    PASSAPORTE
                  </span>
                </div>
              </div>

              {/* Informações Pessoais + Foto */}
              <div className="flex items-start gap-4 pt-2">
                <div className="w-24 h-28 bg-gray-800 border-2 border-gray-700 rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-gray-500 text-2xl font-bold">
                  👤
                </div>

                <div className="space-y-2 flex-1 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider block">
                      Nome Completo
                    </span>
                    <p className="font-extrabold uppercase text-white truncate text-xs">
                      {worker.name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider block">
                      Função / Cargo
                    </span>
                    <p className="font-bold uppercase text-gray-200 truncate text-[11px]">
                      {worker.job_role || 'Operacional'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider block">
                      CPF / RG
                    </span>
                    <p className="font-medium text-gray-300 text-[11px]">
                      {worker.cpf}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dados da Empresa e Obra */}
              <div className="grid grid-cols-2 gap-3 pt-2 bg-gray-800/60 p-3 rounded-xl border border-gray-700/50">
                <div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                    Sub-Contratada
                  </span>
                  <p className="font-bold text-white text-[10px] uppercase truncate">
                    {worker.company}
                  </p>
                </div>

                <div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                    Obra / Local
                  </span>
                  <p className="font-bold text-white text-[10px] uppercase truncate">
                    {worker.work_site || 'Projeto Amazon'}
                  </p>
                </div>

                <div className="col-span-2 border-t border-gray-700/60 pt-2">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                    Data da Integração
                  </span>
                  <p className="font-bold text-[#F59E0B] text-[10px]">
                    {worker.integration_date || 'Recente'}
                  </p>
                </div>
              </div>

              {/* Slogan */}
              <div className="text-center pt-2">
                <p className="text-[9px] font-medium text-gray-400 italic">
                  &quot;Segurança não é apenas uma regra. É o nosso jeito de construir.&quot;
                </p>
              </div>
            </div>

            {/* LINHA DE DOBLA NO CENTRO */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-gray-600 opacity-60">
              <span className="absolute top-1/2 -translate-y-1/2 -left-2.5 bg-[#1E2022] text-gray-500 text-[10px] px-0.5">
                ✂️
              </span>
            </div>

            {/* LADO DIREITO: VERSO */}
            <div className="p-5 md:pl-8 flex flex-col justify-between space-y-4 border-t md:border-t-0 border-gray-800 pt-6 md:pt-5">
              <div>
                <div className="border-b border-gray-700 pb-2 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#F59E0B] text-center">
                    Treinamentos e Autorizações
                  </h3>
                </div>

                {/* Grade de NRs e ASO */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { title: 'ASO', code: 'ASO' },
                    { title: 'NR-01', code: 'NR01' },
                    { title: 'NR-06', code: 'NR06' },
                    { title: 'NR-10', code: 'NR10' },
                    { title: 'NR-11', code: 'NR11' },
                    { title: 'NR-12', code: 'NR12' },
                    { title: 'NR-18', code: 'NR18' },
                    { title: 'NR-33', code: 'NR33' },
                    { title: 'NR-35', code: 'NR35' },
                  ].map((item) => {
                    const doc = worker.documents?.find(
                      (d) =>
                        (d.document_type || d.title)
                          .toUpperCase()
                          .includes(item.code)
                    )

                    return (
                      <div
                        key={item.code}
                        className="bg-gray-800/80 border border-gray-700 p-2 rounded-lg text-center flex flex-col justify-between min-h-[50px]"
                      >
                        <span className="text-[10px] font-black text-white block">
                          {item.title}
                        </span>
                        <span
                          className={`text-[8px] font-bold uppercase tracking-wider ${
                            doc ? 'text-emerald-400' : 'text-gray-500'
                          }`}
                        >
                          {doc ? doc.expiry_date : 'N/A'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Informações e Emissão */}
              <div className="space-y-3 pt-2">
                <div className="bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50 text-[8px] text-gray-300 space-y-1">
                  <p className="font-bold text-[#F59E0B] uppercase">Avisos Importantes:</p>
                  <p>• Esta carteira é pessoal e intransferível.</p>
                  <p>• Deve ser apresentada sempre que solicitada pela fiscalização.</p>
                  <p>• Em caso de perda, comunique imediatamente ao setor de SST.</p>
                </div>

                <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg border border-gray-800">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                    Data da Emissão:
                  </span>
                  <span className="text-[10px] font-extrabold text-[#F59E0B]">
                    {currentDate}
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