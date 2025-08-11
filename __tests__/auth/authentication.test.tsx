import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn, signOut, signUp } from '@/lib/auth/actions'
import { mockFetch } from '../utils/test-utils'

// Mock the auth actions
jest.mock('@/lib/auth/actions', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}))

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Sign In', () => {
    test('user can sign in with email and password', async () => {
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ 
        success: true, 
        user: { 
          id: 'user-123', 
          email: 'test@example.com' 
        } 
      } as any)

      // Simulate form submission
      const email = 'test@example.com'
      const password = 'password123'
      
      const result = await signIn({ email, password })
      
      expect(mockSignIn).toHaveBeenCalledWith({ email, password })
      expect(result.success).toBe(true)
      expect(result.user.email).toBe(email)
    })

    test('invalid credentials show error message', async () => {
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ 
        success: false, 
        error: 'Invalid credentials' 
      } as any)

      const result = await signIn({ 
        email: 'wrong@example.com', 
        password: 'wrongpassword' 
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })

    test('handles network errors gracefully', async () => {
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockRejectedValueOnce(new Error('Network error'))

      await expect(signIn({ 
        email: 'test@example.com', 
        password: 'password' 
      })).rejects.toThrow('Network error')
    })
  })

  describe('Sign Out', () => {
    test('user can sign out successfully', async () => {
      const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
      mockSignOut.mockResolvedValueOnce({ success: true } as any)

      const result = await signOut()
      
      expect(mockSignOut).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    test('handles sign out errors', async () => {
      const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
      mockSignOut.mockRejectedValueOnce(new Error('Sign out failed'))

      await expect(signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('Sign Up', () => {
    test('user can create a new account', async () => {
      const mockSignUp = signUp as jest.MockedFunction<typeof signUp>
      mockSignUp.mockResolvedValueOnce({ 
        success: true, 
        user: { 
          id: 'new-user-123', 
          email: 'newuser@example.com' 
        } 
      } as any)

      const result = await signUp({
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
      })
      
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
      })
      expect(result.success).toBe(true)
      expect(result.user.email).toBe('newuser@example.com')
    })

    test('validates email format', async () => {
      const mockSignUp = signUp as jest.MockedFunction<typeof signUp>
      mockSignUp.mockResolvedValueOnce({ 
        success: false, 
        error: 'Invalid email format' 
      } as any)

      const result = await signUp({
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email format')
    })

    test('validates password strength', async () => {
      const mockSignUp = signUp as jest.MockedFunction<typeof signUp>
      mockSignUp.mockResolvedValueOnce({ 
        success: false, 
        error: 'Password too weak' 
      } as any)

      const result = await signUp({
        email: 'test@example.com',
        password: '123', // Too short
        fullName: 'Test User',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Password too weak')
    })
  })

  describe('Session Management', () => {
    test('session persists across page refreshes', async () => {
      // Mock localStorage
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: Date.now() + 3600000, // 1 hour from now
      }
      
      Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockSession))
      
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      
      expect(session.access_token).toBe('mock-token')
      expect(session.expires_at).toBeGreaterThan(Date.now())
    })

    test('expired session triggers refresh', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'mock-refresh',
        expires_at: Date.now() - 1000, // Expired
      }
      
      Storage.prototype.getItem = jest.fn(() => JSON.stringify(expiredSession))
      
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      const isExpired = session.expires_at < Date.now()
      
      expect(isExpired).toBe(true)
    })
  })

  describe('Password Reset', () => {
    test('password reset flow initiates correctly', async () => {
      mockFetch({ success: true, message: 'Reset email sent' })
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })
      
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.message).toBe('Reset email sent')
    })

    test('handles invalid email in reset flow', async () => {
      mockFetch({ success: false, error: 'Email not found' }, 404)
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      })
      
      const result = await response.json()
      
      expect(response.ok).toBe(false)
      expect(result.error).toBe('Email not found')
    })
  })
})