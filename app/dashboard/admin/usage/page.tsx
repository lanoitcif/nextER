'use client'

import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, BarChart3, Users, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface UsageStats {
  totalRequests: number
  totalUsers: number
  totalCost: number
  avgResponseTime: number
  topProviders: Array<{
    provider: string
    count: number
    cost: number
  }>
  dailyUsage: Array<{
    date: string
    requests: number
    cost: number
  }>
  userActivity: Array<{
    user_email: string
    requests: number
    cost: number
    last_used: string
  }>
}

export default function UsageAnalyticsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && !isAdmin(profile)) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && isAdmin(profile)) {
      fetchUsageStats()
    }
  }, [user, profile, timeRange])

  const fetchUsageStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/usage?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch usage stats')
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <div className="text-lg text-cream-glow">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/admin"
                className="btn-ghost flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin</span>
              </Link>
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
                    Usage Analytics
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Monitor system usage and cost analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Time Range Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-48"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {stats ? (
            <>
              {/* Overview Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card">
                  <div className="card-content p-6">
                    <div className="flex items-center">
                      <div className="bg-primary/20 p-3 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold">{stats.totalRequests.toLocaleString()}</h3>
                        <p className="text-sm text-muted-foreground">Total Requests</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content p-6">
                    <div className="flex items-center">
                      <div className="bg-secondary/20 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-secondary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold">{stats.totalUsers}</h3>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content p-6">
                    <div className="flex items-center">
                      <div className="bg-accent/20 p-3 rounded-lg">
                        <DollarSign className="h-6 w-6 text-accent" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold">${stats.totalCost.toFixed(2)}</h3>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content p-6">
                    <div className="flex items-center">
                      <div className="bg-destructive/20 p-3 rounded-lg">
                        <Clock className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold">{stats.avgResponseTime.toFixed(1)}s</h3>
                        <p className="text-sm text-muted-foreground">Avg Response Time</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Usage */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="card">
                  <div className="card-content p-6">
                    <h2 className="text-xl font-semibold mb-4">Provider Usage</h2>
                    <div className="space-y-4">
                      {stats.topProviders.map((provider) => (
                        <div key={provider.provider} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium capitalize">{provider.provider}</div>
                            <div className="text-sm text-muted-foreground">{provider.count} requests</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${provider.cost.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* User Activity */}
                <div className="card">
                  <div className="card-content p-6">
                    <h2 className="text-xl font-semibold mb-4">Top Users</h2>
                    <div className="space-y-4">
                      {stats.userActivity.slice(0, 5).map((user) => (
                        <div key={user.user_email} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{user.user_email}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.requests} requests • Last: {new Date(user.last_used).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${user.cost.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Usage Chart */}
              <div className="card">
                <div className="card-content p-6">
                  <h2 className="text-xl font-semibold mb-4">Daily Usage Trend</h2>
                  <div className="space-y-2">
                    {stats.dailyUsage.map((day) => (
                      <div key={day.date} className="flex justify-between items-center py-2 border-b border-border">
                        <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                        <div className="flex space-x-6">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Requests: </span>
                            <span className="font-medium">{day.requests}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Cost: </span>
                            <span className="font-medium">${day.cost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="card-content p-6 text-center">
                <p className="text-muted-foreground">No usage data available for the selected time range.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}