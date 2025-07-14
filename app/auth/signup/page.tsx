'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { signUp, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await signUp(email, password, fullName)
      setSuccess(true)
      // Note: User will need to verify email before they can sign in
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#161616] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              Check Email
            </h2>
            <p className="mt-2 text-sm text-[#a4a4a4]">
              Confirmation sent. Click the link to verify.
            </p>
            <Link
              href="/auth/login"
              className="mt-4 inline-block font-medium text-[#c2995f] hover:text-[#c2995f]/80"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#161616] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-[#a4a4a4]">
            <Link
              href="/auth/login"
              className="font-medium text-[#c2995f] hover:text-[#c2995f]/80"
            >
              Sign in
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-900/20 border border-red-500/30 p-4">
              <div className="text-sm text-red-400">{error}</div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-[#a4a4a4]">
                Full Name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[#a4a4a4]/30 placeholder-[#a4a4a4] text-white bg-[#1f1f1f] rounded-md focus:outline-none focus:ring-[#c2995f] focus:border-[#c2995f] sm:text-sm"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-[#a4a4a4]">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[#a4a4a4]/30 placeholder-[#a4a4a4] text-white bg-[#1f1f1f] rounded-md focus:outline-none focus:ring-[#c2995f] focus:border-[#c2995f] sm:text-sm"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#a4a4a4]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[#a4a4a4]/30 placeholder-[#a4a4a4] text-white bg-[#1f1f1f] rounded-md focus:outline-none focus:ring-[#c2995f] focus:border-[#c2995f] sm:text-sm"
                placeholder="Choose a strong password"
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}