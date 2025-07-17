'use client'

import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, Key, BarChart3, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  totalApiKeys: number
  totalUsage: number
  monthlyUsage: number
}

export default function AdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && (!user || !isAdmin(profile))) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && isAdmin(profile)) {
      fetchStats()
    }
  }, [user, profile])

  const fetchStats = async () => {
    try {
      setLoadingStats(true)
      
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch total API keys
      const { count: totalApiKeys } = await supabase
        .from('user_api_keys')
        .select('*', { count: 'exact', head: true })

      // Fetch total usage logs
      const { count: totalUsage } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })

      // Fetch monthly usage (current month)
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      
      const { count: monthlyUsage } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonth.toISOString())

      setStats({
        totalUsers: totalUsers || 0,
        totalApiKeys: totalApiKeys || 0,
        totalUsage: totalUsage || 0,
        monthlyUsage: monthlyUsage || 0
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !isAdmin(profile)) {
    return null
  }

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <header className="bg-charcoal shadow-lg border-b border-teal-mist/30">
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
                <h1 className="text-2xl font-bold text-cream-glow">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-cream-glow/80 mt-1">
                  System administration and user management
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="bg-teal-mist/20 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-teal-mist" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-charcoal">{stats.totalUsers}</h3>
                      <p className="text-sm text-charcoal/70">Total Users</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="bg-sunset-gold/20 p-3 rounded-lg">
                      <Key className="h-6 w-6 text-sunset-gold" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-charcoal">{stats.totalApiKeys}</h3>
                      <p className="text-sm text-charcoal/70">API Keys</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="bg-fuchsia-buzz/20 p-3 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-fuchsia-buzz" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-charcoal">{stats.totalUsage}</h3>
                      <p className="text-sm text-charcoal/70">Total Analyses</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-coral" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-charcoal">{stats.monthlyUsage}</h3>
                      <p className="text-sm text-charcoal/70">This Month</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/admin/api-keys" className="card hover:shadow-xl transition-all duration-200 hover:scale-105">
              <div className="card-content">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Key className="h-8 w-8 text-teal-mist" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal">API Key Management</h3>
                    <p className="text-sm text-charcoal/70 mt-1">
                      Assign and manage user API keys and default models
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/admin/users" className="card hover:shadow-xl transition-all duration-200 hover:scale-105">
              <div className="card-content">
                <div className="flex items-center space-x-4">
                  <div className="bg-sunset-gold/20 p-3 rounded-lg">
                    <Users className="h-8 w-8 text-sunset-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal">User Management</h3>
                    <p className="text-sm text-charcoal/70 mt-1">
                      View and manage user accounts and permissions
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/admin/usage" className="card hover:shadow-xl transition-all duration-200 hover:scale-105">
              <div className="card-content">
                <div className="flex items-center space-x-4">
                  <div className="bg-fuchsia-buzz/20 p-3 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-fuchsia-buzz" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal">Usage Analytics</h3>
                    <p className="text-sm text-charcoal/70 mt-1">
                      Monitor system usage and cost analytics
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
