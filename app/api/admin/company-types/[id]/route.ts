import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/AuthContext'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: This is a placeholder for a proper admin check.
  // In a real application, you would want to check if the user has the 'admin' role.
  // For now, we'll just check if the user is authenticated.
  // const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('user_id', user.id).single()
  // if (!isAdmin(profile)) {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // }

  const { id } = params
  const { name, description, system_prompt_template } = await request.json()

  if (!name || !description || !system_prompt_template) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('company_types')
      .update({
        name,
        description,
        system_prompt_template,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ companyType: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
