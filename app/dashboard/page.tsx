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
    <div className="min-h-screen bg-[#161616]">
      {/* Header */}
      <header className="bg-[#1f1f1f] border-b border-[#c2995f]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-[#c2995f]">
                NEaR
              </h1>
              <p className="text-sm text-[#a4a4a4] mt-1">
                {profile.full_name || profile.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {profile.can_use_owner_key && (
                <Link
                  href="/dashboard/admin"
                  className="text-[#a4a4a4] hover:text-white flex items-center space-x-2 px-3 py-2 rounded"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                className="text-[#a4a4a4] hover:text-white flex items-center space-x-2 px-3 py-2 rounded"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-red-400 hover:text-red-300 flex items-center space-x-2 px-3 py-2 rounded"
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
                        <dt className="text-sm font-medium text-[#a4a4a4] truncate">
                          Analyses
                        </dt>
                        <dd className="text-lg font-medium text-white">
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
                        <dt className="text-sm font-medium text-[#a4a4a4] truncate">
                          Tokens Used
                        </dt>
                        <dd className="text-lg font-medium text-white">
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
                        <dt className="text-sm font-medium text-[#a4a4a4] truncate">
                          Cost
                        </dt>
                        <dd className="text-lg font-medium text-white">
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
                    <h3 className="text-lg font-medium text-white">
                      Analyze
                    </h3>
                    <p className="text-sm text-[#a4a4a4]">
                      Earnings analysis
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
                    <h3 className="text-lg font-medium text-white">
                      API Keys
                    </h3>
                    <p className="text-sm text-[#a4a4a4]">
                      Provider keys
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
                <h3 className="card-title">Recent Activity</h3>
                <p className="card-description">
                  Recent
                </p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {stats.recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between py-3 border-b border-[#a4a4a4]/30 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-[#a4a4a4]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {analysis.provider} - {analysis.model}
                          </p>
                          <p className="text-xs text-[#a4a4a4]">
                            {new Date(analysis.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {analysis.used_owner_key && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c2995f]/20 text-[#c2995f]">
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
                    <div className="w-3 h-3 bg-[#c2995f] rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      System Access Enabled
                    </p>
                    <p className="text-xs text-[#a4a4a4]">
                      Free analysis using system keys
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