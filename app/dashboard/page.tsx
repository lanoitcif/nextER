'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { LogOut, FileText, Key, Settings, BarChart3, Shield } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalAnalyses: number
  totalTokensUsed: number
  totalCostEstimate: number
  recentAnalyses: Array<{
    id: string
    provider: string
    model: string
    created_at: string
    used_owner_key: boolean
  }>
}

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user])

  const fetchDashboardStats = async () => {
    try {
      // Get usage statistics
      const { data: usageLogs, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching usage logs:', error)
        return
      }

      const totalAnalyses = usageLogs.length
      const totalTokensUsed = usageLogs.reduce((sum, log) => sum + (log.token_count || 0), 0)
      const totalCostEstimate = usageLogs.reduce((sum, log) => sum + (log.cost_estimate || 0), 0)
      const recentAnalyses = usageLogs.slice(0, 5)

      setStats({
        totalAnalyses,
        totalTokensUsed,
        totalCostEstimate,
        recentAnalyses
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out failed:', error)
      // Still try to redirect even if signout fails
      router.push('/auth/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                LLM Transcript Analyzer
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {profile.full_name || profile.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {profile.can_use_owner_key && (
                <Link
                  href="/dashboard/admin"
                  className="btn-ghost flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                className="btn-ghost flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
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
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          {!loadingStats && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Analyses
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalAnalyses}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Tokens Used
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalTokensUsed.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Key className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Estimated Cost
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${stats.totalCostEstimate.toFixed(4)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/dashboard/analyze" className="card hover:shadow-lg transition-shadow">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-12 w-12 text-blue-600" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">
                      Analyze Transcript
                    </h3>
                    <p className="text-sm text-gray-600">
                      Upload or paste a transcript and analyze it using AI
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/api-keys" className="card hover:shadow-lg transition-shadow">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Key className="h-12 w-12 text-green-600" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">
                      Manage API Keys
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add and manage your LLM provider API keys
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          {!loadingStats && stats && stats.recentAnalyses.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Analyses</h3>
                <p className="card-description">
                  Your most recent transcript analyses
                </p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {stats.recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {analysis.provider} - {analysis.model}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(analysis.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {analysis.used_owner_key && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Owner Key
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Owner Key Status */}
          {profile.can_use_owner_key && (
            <div className="card mt-6">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Owner API Key Access Enabled
                    </p>
                    <p className="text-xs text-gray-600">
                      You can use the system's API keys for your analyses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}