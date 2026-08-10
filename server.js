const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Função auxiliar para determinar o status e estilo visual do documento
function calcularStatusDocumento(dataValidade) {
  if (!dataValidade) {
    return { status: 'sem_data', badgeClass: 'bg-gray-100 text-gray-700 border-gray-300', texto: 'Sem Data' };
  }
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(dataValidade);
  
  if (validade < hoje) {
    return { status: 'vencido', badgeClass: 'bg-red-100 text-red-800 border-red-300', texto: 'Vencido' };
  }
  return { status: 'valido', badgeClass: 'bg-green-100 text-green-800 border-green-300', texto: 'Válido' };
}

router.get('/dashboard/:obraId', async (req, res) => {
  try {
    const { obraId } = req.params;

    // 1. Obter dados da Obra
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('*')
      .eq('id', obraId)
      .single();

    if (obraError) throw obraError;

    // 2. Buscar Documentos da Obra (escopo = 'obra')
    const { data: docsObraRaw, error: docsObraError } = await supabase
      .from('documentos')
      .select('*')
      .eq('obra_id', obraId)
      .eq('escopo', 'obra');

    if (docsObraError) throw docsObraError;

    // Definição das categorias institucionais padronizadas
    const categoriasObraDefinidas = [
      { chave: 'PGR', nome: 'PGR - Prog. de Gerenciamento de Riscos' },
      { chave: 'PCMSO', nome: 'PCMSO - Prog. de Controle Médico de Saúde Ocupacional' },
      { chave: 'LTCAT', nome: 'LTCAT - Laudo Técnico das Condições Ambientais' },
      { chave: 'ART', nome: 'ART - Anotação de Responsabilidade Técnica' },
      { chave: 'CNO', nome: 'CNO - Cadastro Nacional de Obras' },
      { chave: 'APOLICE_SEGURO', nome: 'Apólice de Seguro' },
      { chave: 'LICENCAS', nome: 'Licenças e Alvarás' }
    ];

    const documentosObra = categoriasObraDefinidas.map(cat => {
      const docEncontrado = (docsObraRaw || []).find(d => d.categoria === cat.chave);
      return {
        categoriaChave: cat.chave,
        categoriaNome: cat.nome,
        documento: docEncontrado ? {
          ...docEncontrado,
          statusInfo: calcularStatusDocumento(docEncontrado.data_validade)
        } : null
      };
    });

    // 3. Buscar Colaboradores e seus Documentos (escopo = 'colaborador')
    const { data: colaboradoresRaw, error: colabError } = await supabase
      .from('colaboradores')
      .select(`
        id,
        nome,
        cpf,
        cargo,
        documentos (*)
      `)
      .eq('obra_id', obraId);

    if (colabError) throw colabError;

    const categoriasColaboradorDefinidas = ['ASO', 'FICHA_EPI', 'NR_10', 'NR_18', 'NR_35', 'REGISTRO_CTPS'];

    const colaboradores = (colaboradoresRaw || []).map(colab => {
      const docsColab = (colab.documentos || []).filter(d => d.escopo === 'colaborador');
      
      const documentosMapeados = categoriasColaboradorDefinidas.map(cat => {
        const doc = docsColab.find(d => d.categoria === cat);
        return {
          categoria: cat,
          documento: doc ? {
            ...doc,
            statusInfo: calcularStatusDocumento(doc.data_validade)
          } : null
        };
      });

      return {
        id: colab.id,
        nome: colab.nome,
        cpf: colab.cpf,
        cargo: colab.cargo,
        documentos: documentosMapeados
      };
    });

    res.render('dashboard', {
      obra,
      documentosObra,
      colaboradores
    });

  } catch (error) {
    console.error('Erro ao carregar Dashboard SST:', error);
    res.status(500).send('Erro ao carregar os dados da Dashboard SST.');
  }
});

module.exports = router;