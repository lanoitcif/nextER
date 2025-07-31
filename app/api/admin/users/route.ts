import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }
  const supabaseAdmin = createClient(cookieStore)
  const { data: adminProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('access_level')
    .eq('id', user.id)
    .single()
  if (!adminProfile || adminProfile.access_level !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, full_name, access_level')
    .order('email')
  if (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
  return NextResponse.json({ users: data || [] })
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }
  const supabaseAdmin = createClient(cookieStore)
  const { data: adminProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('access_level')
    .eq('id', user.id)
    .single()
  if (!adminProfile || adminProfile.access_level !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, accessLevel, default_provider, default_model } = body as { 
    userId?: string; 
    accessLevel?: string;
    default_provider?: string;
    default_model?: string;
  }
  if (!userId) {
    return NextResponse.json({ error: 'Invalid request data: userId is required' }, { status: 400 })
  }

  const updateData: any = {};
  if (accessLevel) {
    if (!['basic','advanced','admin'].includes(accessLevel)) {
      return NextResponse.json({ error: 'Invalid access level' }, { status: 400 });
    }
    updateData.access_level = accessLevel;
  }

  if (default_provider) {
    updateData.default_provider = default_provider;
  }

  if (default_model) {
    updateData.default_model = default_model;
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId)
  if (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }
  const supabaseAdmin = createClient(cookieStore)
  const { data: adminProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('access_level')
    .eq('id', user.id)
    .single()
  if (!adminProfile || adminProfile.access_level !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { userId } = body as { userId?: string }
  if (!userId) {
    return NextResponse.json({ error: 'Invalid request data: userId is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ default_provider: null, default_model: null })
    .eq('id', userId)
  if (error) {
    console.error('Error resetting user LLM settings:', error)
    return NextResponse.json({ error: 'Failed to reset user LLM settings' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
