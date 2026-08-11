import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { userId, email, password, full_name, company_id, role, work_site } = body

    if (!userId || !email || !full_name) {
      return NextResponse.json(
        { error: 'ID do usuário, Nome e E-mail são obrigatórios.' },
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

    const updateAuthData: any = {
      email,
      user_metadata: {
        full_name,
        role,
        work_site,
        company_id: company_id || null,
      },
    }

    if (password && password.trim().length >= 6) {
      updateAuthData.password = password.trim()
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateAuthData
    )

    if (authError) {
      console.warn('Aviso de atualização no Auth:', authError.message)
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        email,
        company_id: company_id || null,
        role,
        work_site,
      })
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar dados do usuário.' },
      { status: 500 }
    )
  }
}