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
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <header className="bg-charcoal border-b border-teal-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-teal-mist" />
              <span className="ml-2 text-xl font-bold text-teal-mist">
                NEaR
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-cream-glow hover:text-sunset-gold font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-coral text-white px-4 py-2 rounded font-medium hover:bg-fuchsia-buzz"
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
          <h1 className="text-4xl md:text-6xl font-bold text-cream-glow mb-6">
            Next Earnings
            <span className="text-sunset-gold block">Release</span>
          </h1>
          
          <p className="text-xl text-cream-glow/80 mb-8 max-w-2xl mx-auto">
            Professional earnings analysis platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/signup"
              className="bg-coral text-white text-lg px-8 py-3 rounded font-medium flex items-center justify-center space-x-2 hover:bg-fuchsia-buzz transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <span>Begin</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="border border-grape-static text-grape-static text-lg px-8 py-3 rounded font-medium hover:bg-grape-static hover:text-cream-glow transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-charcoal border-t border-teal-mist/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-teal-mist" />
              <span className="ml-2 text-lg font-bold text-teal-mist">
                NEaR
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}