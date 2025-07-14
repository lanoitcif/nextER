'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// Using standard HTML elements with Tailwind classes instead of shadcn/ui components
import { Users, Activity, TrendingUp, Settings, ArrowLeft, LogOut } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalAnalyses: number
  totalCost: number
}

interface UsageLog {
  id: string
  user_id: string
  provider: string
  model: string
  token_count: number
  cost_estimate: number
  used_owner_key: boolean
  created_at: string
  user_profiles: {
    email: string
    full_name: string
  }
}

export default function AdminDashboard() {
  const { user, profile, loading: authLoading, session, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsage, setRecentUsage] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && session) {
      loadAdminData()
    }
  }, [user, session])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!session) {
        setError('Not authenticated')
        return
      }

      const [statsResponse, usageResponse] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }),
        fetch('/api/admin/usage', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      ])

      if (!statsResponse.ok || !usageResponse.ok) {
        throw new Error('Failed to load admin data')
      }

      const [statsData, usageData] = await Promise.all([
        statsResponse.json(),
        usageResponse.json()
      ])

      setStats(statsData)
      setRecentUsage(usageData.usage || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out failed:', error)
      router.push('/auth/login')
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="card">
          <div className="card-content p-6">
            <div className="text-red-600">Error: {error}</div>
            <button onClick={loadAdminData} className="mt-4 btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="btn-ghost flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  NEaR Admin
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  System administration and monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadAdminData}
                className="btn-ghost flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleSignOut}
                className="btn-ghost flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Users</h3>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500">
                {stats.activeUsers} active this month
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Analyses</h3>
              <Activity className="h-4 w-4 text-gray-400" />
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
              <p className="text-xs text-gray-500">
                All time
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Cost</h3>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
              <p className="text-xs text-gray-500">
                Estimated API costs
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">System Status</h3>
              <Settings className="h-4 w-4 text-gray-400" />
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Online</span>
              </div>
              <p className="text-xs text-gray-500">
                All systems operational
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent API Usage</h3>
            <p className="card-description">
              Latest analysis requests and their details
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {recentUsage.length > 0 ? (
                recentUsage.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {log.user_profiles?.email || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.provider} • {log.model}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">
                        ${log.cost_estimate.toFixed(4)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.token_count?.toLocaleString()} tokens
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.used_owner_key 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.used_owner_key ? "Owner Key" : "User Key"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No usage data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </div>
      </main>
    </div>
  )
}