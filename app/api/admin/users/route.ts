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
  const { userId, accessLevel } = body as { userId?: string; accessLevel?: string }
  if (!userId || !accessLevel || !['basic','advanced','admin'].includes(accessLevel)) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ access_level: accessLevel })
    .eq('id', userId)
  if (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
