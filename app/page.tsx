'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-[#161616]">
      {/* Header */}
      <header className="bg-[#1f1f1f] border-b border-[#c2995f]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-[#c2995f]" />
              <span className="ml-2 text-xl font-bold text-[#c2995f]">
                NEaR
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-[#a4a4a4] hover:text-white font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[#c2995f] text-black px-4 py-2 rounded font-medium hover:bg-[#c2995f]/90"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Next Earnings
            <span className="text-[#c2995f] block">Release</span>
          </h1>
          
          <p className="text-xl text-[#a4a4a4] mb-8 max-w-2xl mx-auto">
            Professional earnings analysis platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/signup"
              className="bg-[#c2995f] text-black text-lg px-8 py-3 rounded font-medium flex items-center justify-center space-x-2 hover:bg-[#c2995f]/90"
            >
              <span>Begin</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="border border-[#a4a4a4] text-[#a4a4a4] text-lg px-8 py-3 rounded font-medium hover:border-white hover:text-white"
            >
              Sign In
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-[#1f1f1f] border-t border-[#c2995f]/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-[#c2995f]" />
              <span className="ml-2 text-lg font-bold text-[#c2995f]">
                NEaR
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}