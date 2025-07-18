import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('access_level')
      .eq('id', user.id)
      .single()

    if (profileError || userProfile?.access_level !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: usage, error: usageError } = await supabaseAdmin
      .from('usage_logs')
      .select(`
        *,
        user_profiles (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (usageError) {
      console.error('Admin usage query error:', usageError)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    return NextResponse.json({
      usage: usage || [],
      limit,
      offset
    })

  } catch (error: any) {
    console.error('Admin usage API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}