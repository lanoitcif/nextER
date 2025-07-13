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
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.can_use_owner_key) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalUsersResult, activeUsersResult, totalAnalysesResult, totalCostResult] = await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact' }),
      
      supabaseAdmin
        .from('usage_logs')
        .select('user_id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      supabaseAdmin
        .from('usage_logs')
        .select('id', { count: 'exact' }),
      
      supabaseAdmin
        .from('usage_logs')
        .select('cost_estimate')
    ])

    if (totalUsersResult.error || activeUsersResult.error || totalAnalysesResult.error || totalCostResult.error) {
      console.error('Admin stats query error:', {
        totalUsers: totalUsersResult.error,
        activeUsers: activeUsersResult.error,
        totalAnalyses: totalAnalysesResult.error,
        totalCost: totalCostResult.error
      })
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const uniqueActiveUsers = new Set(
      activeUsersResult.data?.map(log => log.user_id) || []
    ).size

    const totalCost = totalCostResult.data?.reduce((sum, log) => {
      return sum + (log.cost_estimate || 0)
    }, 0) || 0

    return NextResponse.json({
      totalUsers: totalUsersResult.count || 0,
      activeUsers: uniqueActiveUsers,
      totalAnalyses: totalAnalysesResult.count || 0,
      totalCost: totalCost
    })

  } catch (error: any) {
    console.error('Admin stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}