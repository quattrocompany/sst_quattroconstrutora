import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, password, full_name, company_id, role, work_site } = body

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Nome, E-mail e Senha são obrigatórios.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configurações de chave do Supabase ausentes no servidor.' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const metadata = {
      full_name,
      role: role || (email.includes('@quattro') ? 'ADMIN_QUATTRO' : 'CLIENTE'),
      work_site: work_site || 'Amazon Fulfillment Center - SP02',
      company_id: company_id || null,
    }

    // admin.createUser com email_confirm: true NÃO dispara e-mails e NÃO sofre rate limit
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: authData.user?.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao processar criação de usuário.' },
      { status: 500 }
    )
  }
}