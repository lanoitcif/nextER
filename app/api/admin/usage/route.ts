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
    const range = searchParams.get('range') || '7d'

    const getStartDate = (range: string): Date => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      switch (range) {
        case '1d':
          date.setDate(date.getDate() - 1)
          break
        case '7d':
          date.setDate(date.getDate() - 7)
          break
        case '30d':
          date.setDate(date.getDate() - 30)
          break
        case '90d':
          date.setDate(date.getDate() - 90)
          break
        default:
          date.setDate(date.getDate() - 7)
      }
      return date
    }

    const startDate = getStartDate(range)

    const { data: usageLogs, error: usageError } = await supabaseAdmin
      .from('usage_logs')
      .select(`
        created_at,
        user_id,
        provider,
        cost_estimate,
        duration,
        user_profiles (
          email
        )
      `)
      .gte('created_at', startDate.toISOString())

    if (usageError) {
      console.error('Admin usage query error:', usageError)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    if (!usageLogs || usageLogs.length === 0) {
      return NextResponse.json(null)
    }

    const totalRequests = usageLogs.length
    const totalCost = usageLogs.reduce((sum, log) => sum + (log.cost_estimate || 0), 0)
    const totalDuration = usageLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
    const avgResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0

    const uniqueUserIds = new Set(usageLogs.map(log => log.user_id))
    const totalUsers = uniqueUserIds.size

    const topProviders = usageLogs.reduce((acc, log) => {
      const provider = log.provider || 'Unknown'
      if (!acc[provider]) {
        acc[provider] = { provider, count: 0, cost: 0 }
      }
      acc[provider].count++
      acc[provider].cost += log.cost_estimate || 0
      return acc
    }, {} as Record<string, { provider: string; count: number; cost: number }>)

    const dailyUsage = usageLogs.reduce((acc, log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, requests: 0, cost: 0 }
      }
      acc[date].requests++
      acc[date].cost += log.cost_estimate || 0
      return acc
    }, {} as Record<string, { date: string; requests: number; cost: number }>)

    const userActivity = usageLogs.reduce((acc, log) => {
      if (!log.user_id) return acc
      if (!acc[log.user_id]) {
        acc[log.user_id] = {
          user_email: (log.user_profiles as any)?.email || 'Unknown',
          requests: 0,
          cost: 0,
          last_used: new Date(0).toISOString(),
        }
      }
      acc[log.user_id].requests++
      acc[log.user_id].cost += log.cost_estimate || 0
      if (new Date(log.created_at) > new Date(acc[log.user_id].last_used)) {
        acc[log.user_id].last_used = log.created_at
      }
      return acc
    }, {} as Record<string, { user_email: string; requests: number; cost: number; last_used: string }>)

    const stats = {
      totalRequests,
      totalUsers,
      totalCost,
      avgResponseTime,
      topProviders: Object.values(topProviders).sort((a, b) => b.cost - a.cost),
      dailyUsage: Object.values(dailyUsage).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      userActivity: Object.values(userActivity).sort((a, b) => b.cost - a.cost),
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Admin usage API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}