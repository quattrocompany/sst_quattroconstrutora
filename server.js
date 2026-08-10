require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

function calcularStatusDocumento(dataVencimento) {
  if (!dataVencimento) {
    return { status: 'sem_data', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300', texto: 'Sem Data' };
  }
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento);
  
  if (vencimento < hoje) {
    return { status: 'vencido', badgeClass: 'bg-red-100 text-red-800 border-red-300', texto: 'Vencido' };
  }
  return { status: 'valido', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300', texto: 'Válido' };
}

app.get('/dashboard/:obraId', async (req, res) => {
  try {
    const obraId = req.params.obraId ? req.params.obraId.trim() : '';

    // Utiliza .maybeSingle() para evitar erro PGRST116 quando o registro não é encontrado ou RLS bloqueia
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('*')
      .eq('id', obraId)
      .maybeSingle();

    if (obraError) {
      console.error('Erro Supabase ao consultar Obra:', obraError);
      return res.status(500).send(`Erro do Supabase: ${obraError.message}`);
    }

    if (!obra) {
      console.warn(`Obra com ID "${obraId}" não foi localizada ou RLS está ativado.`);
      return res.status(404).send(`Obra com ID "${obraId}" não encontrada. Verifique se executou os INSERTs no Supabase e se o RLS está desativado nas tabelas.`);
    }

    const { data: docsObraRaw, error: docsObraError } = await supabase
      .from('documentos')
      .select('*')
      .eq('obra_id', obraId)
      .eq('escopo', 'obra');

    if (docsObraError) {
      console.error('Erro ao buscar documentos da obra:', docsObraError);
      throw docsObraError;
    }

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
      const docEncontrado = (docsObraRaw || []).find(d => d.categoria === cat.chave || d.tipo_doc === cat.chave);
      return {
        categoriaChave: cat.chave,
        categoriaNome: cat.nome,
        documento: docEncontrado ? {
          ...docEncontrado,
          statusInfo: calcularStatusDocumento(docEncontrado.data_vencimento)
        } : null
      };
    });

    const { data: colaboradoresRaw, error: colabError } = await supabase
      .from('colaboradores')
      .select(`
        id,
        nome,
        cpf,
        funcao,
        documentos (*)
      `)
      .eq('obra_id', obraId);

    if (colabError) {
      console.error('Erro ao buscar colaboradores:', colabError);
      throw colabError;
    }

    const categoriasColaboradorDefinidas = ['ASO', 'FICHA_EPI', 'NR_10', 'NR_18', 'NR_35', 'REGISTRO_CTPS'];

    const colaboradores = (colaboradoresRaw || []).map(colab => {
      const docsColab = (colab.documentos || []).filter(d => d.escopo === 'colaborador');
      
      const documentosMapeados = categoriasColaboradorDefinidas.map(cat => {
        const doc = docsColab.find(d => d.categoria === cat || d.tipo_doc === cat);
        return {
          categoria: cat,
          documento: doc ? {
            ...doc,
            statusInfo: calcularStatusDocumento(doc.data_vencimento)
          } : null
        };
      });

      return {
        id: colab.id,
        nome: colab.nome,
        cpf: colab.cpf,
        funcao: colab.funcao,
        documentos: documentosMapeados
      };
    });

    res.render('dashboard', {
      obra,
      documentosObra,
      colaboradores
    });

  } catch (error) {
    console.error('Erro interno ao carregar Dashboard SST:', error);
    res.status(500).send('Erro interno ao carregar a Dashboard SST.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});