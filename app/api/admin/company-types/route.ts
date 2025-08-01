import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { id, name, description, system_prompt_template, is_active = true } = body

  if (!id || !name || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate ID format (lowercase letters, numbers, underscores)
  if (!/^[a-z0-9_]+$/.test(id)) {
    return NextResponse.json({ 
      error: 'Invalid ID format. Use only lowercase letters, numbers, and underscores.' 
    }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('company_types')
      .insert({
        id,
        name,
        description,
        system_prompt_template: system_prompt_template || 'Enter your prompt template here...',
        is_active,
        classification_rules: {},
        key_metrics: {},
        output_format: {},
        validation_rules: [],
        special_considerations: {}
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'A company type with this ID already exists' 
        }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ companyType: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('company_types')
      .select('*')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ companyTypes: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}