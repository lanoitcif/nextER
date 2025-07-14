'use client'

import { useState, useEffect } from 'react'
import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const router = useRouter()

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const profile = await signIn(email, password)
      if (isAdmin(profile)) {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#161616] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-[#a4a4a4]">
            <Link
              href="/auth/signup"
              className="font-medium text-[#c2995f] hover:text-[#c2995f]/80"
            >
              New account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-900/20 border border-red-500/30 p-4">
              <div className="text-sm text-red-400">{error}</div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#a4a4a4]/30 placeholder-[#a4a4a4] text-white bg-[#1f1f1f] rounded-t-md focus:outline-none focus:ring-[#c2995f] focus:border-[#c2995f] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#a4a4a4]/30 placeholder-[#a4a4a4] text-white bg-[#1f1f1f] rounded-b-md focus:outline-none focus:ring-[#c2995f] focus:border-[#c2995f] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-[#c2995f] hover:bg-[#c2995f]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c2995f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}