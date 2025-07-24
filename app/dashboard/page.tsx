'use client'

import { useAuth, isAdmin, isAdvanced } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { LogOut, FileText, Key, Settings, BarChart3, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
      console.log('Dashboard: Starting sign out...')
      await signOut()
      console.log('Dashboard: Sign out successful, redirecting...')
      router.push('/auth/login')
    } catch (error) {
      console.error('Dashboard: Sign out failed:', error)
      // Still try to redirect even if signout fails
      console.log('Dashboard: Forcing redirect to login...')
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Image 
                src="/near-logo.png" 
                alt="NEaR" 
                width={32} 
                height={32} 
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-2xl font-bold">
                  NEaR Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Welcome back, {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin(profile) && (
                <Link
                  href="/dashboard/admin"
                  className="btn-ghost flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="btn-ghost flex items-center space-x-2"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Action Cards */}
            <Link href="/dashboard/analyze" className="card hover:shadow-xl transition-all duration-200 hover:scale-105">
              <div className="card-content">
                <div className="flex items-center space-x-4">
                  <div className="bg-secondary/20 p-3 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Analyze Transcript</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analyze earnings call transcripts with AI
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/history" className="card hover:shadow-xl transition-all duration-200 hover:scale-105">
              <div className="card-content">
                <div className="flex items-center space-x-4">
                  <div className="bg-accent/20 p-3 rounded-lg">
                    <FileText className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Analysis History</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      View and manage past transcript analyses
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/live" className="card hover:shadow-xl transition-all duration-200 hover:scale-105">
              <div className="card-content">
                <div className="flex items-center space-x-4">
                  <div className="bg-secondary/20 p-3 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Live Transcription</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Open webcasts and view transcripts in real time
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {isAdvanced(profile) && (
              <Link href="/dashboard/api-keys" className="card hover:shadow-xl transition-all duration-200 hover:scale-105">
                <div className="card-content">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/20 p-3 rounded-lg">
                      <Key className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Manage API Keys</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add and manage your personal API keys
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Recent Activity */}
            <div className="md:col-span-2 lg:col-span-3 card">
              <div className="card-header">
                <h3 className="card-title">Recent Activity</h3>
                <p className="card-description">
                  Your most recent transcript analyses
                </p>
              </div>
              <div className="card-content">
                {loadingStats && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading recent activity...</p>
                  </div>
                )}
                {!loadingStats && (!stats?.recentAnalyses || stats.recentAnalyses.length === 0) && (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No recent activity found</p>
                  </div>
                )}
                {!loadingStats && stats?.recentAnalyses && stats.recentAnalyses.length > 0 && (
                  <div className="space-y-4">
                    {stats.recentAnalyses.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg bg-background/30">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.provider} - {activity.model}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {activity.used_owner_key && (
                          <span className="text-xs font-semibold bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                            Owner Key
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}