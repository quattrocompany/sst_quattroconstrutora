// seed.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function seedData() {
  console.log('Iniciando seed...');

  // 1. Criar Cliente
  const { data: cliente, error: errCliente } = await supabase
    .from('clientes')
    .insert([{ nome: 'Cliente Teste Alpha', cnpj: '12.345.678/0001-90' }])
    .select()
    .single();

  if (errCliente) return console.error('Erro Cliente:', errCliente);

  // 2. Criar Obra
  const { data: obra, error: errObra } = await supabase
    .from('obras')
    .insert([{ cliente_id: cliente.id, nome_obra: 'Residencial Alpha' }])
    .select()
    .single();

  if (errObra) return console.error('Erro Obra:', errObra);

  // 3. Criar Colaborador
  const { data: colaborador, error: errColab } = await supabase
    .from('colaboradores')
    .insert([{ obra_id: obra.id, nome: 'João Silva', cpf: '111.222.333-44', funcao: 'Pedreiro' }])
    .select()
    .single();

  if (errColab) return console.error('Erro Colaborador:', errColab);

  // 4. Criar Documento (com data válida e vencida)
  const hoje = new Date();
  const mesQueVem = new Date(hoje.setMonth(hoje.getMonth() + 1));
  const mesPassado = new Date(hoje.setMonth(hoje.getMonth() - 2)); // ajustando de volta e tirando 1

  await supabase.from('documentos').insert([
    {
      cliente_id: cliente.id,
      obra_id: obra.id,
      colaborador_id: colaborador.id,
      tipo_doc: 'ASO',
      file_url: 'https://exemplo.com/aso.pdf',
      data_vencimento: mesQueVem.toISOString().split('T')[0]
    },
    {
      cliente_id: cliente.id,
      obra_id: obra.id,
      colaborador_id: colaborador.id,
      tipo_doc: 'NR-35',
      file_url: 'https://exemplo.com/nr35.pdf',
      data_vencimento: mesPassado.toISOString().split('T')[0]
    }
  ]);

  console.log('Dados de teste criados com sucesso!');
}

seedData();