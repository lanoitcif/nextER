import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { ThemeProvider } from '@/components/ThemeProvider'

// Mock user for testing
export const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

export const mockProfile = {
  id: 'mock-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  access_level: 'basic' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockAdminProfile = {
  ...mockProfile,
  access_level: 'admin' as const,
}

// Mock AuthContext provider
export const MockAuthProvider: React.FC<{ 
  children: React.ReactNode
  user?: any
  profile?: any
  loading?: boolean
}> = ({ 
  children, 
  user = mockUser, 
  profile = mockProfile,
  loading = false 
}) => {
  const mockAuthValue = {
    user,
    profile,
    loading,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    updateProfile: jest.fn(),
  }

  return (
    <AuthProvider value={mockAuthValue as any}>
      {children}
    </AuthProvider>
  )
}

// All providers wrapper
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MockAuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </MockAuthProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockCompany = (overrides = {}) => ({
  id: 'company-1',
  ticker: 'AAPL',
  name: 'Apple Inc.',
  primary_company_type_id: 'tech',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockTemplate = (overrides = {}) => ({
  id: 'template-1',
  name: 'basic_analysis',
  display_name: 'Basic Analysis',
  description: 'Standard earnings analysis template',
  system_prompt: 'Analyze the earnings call transcript...',
  category: 'general',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockAnalysis = (overrides = {}) => ({
  id: 'analysis-1',
  user_id: 'mock-user-id',
  company_id: 'company-1',
  company_type_id: 'tech',
  transcript: 'Sample transcript content...',
  analysis_result: 'Analysis results...',
  provider: 'openai',
  model: 'gpt-4',
  created_at: new Date().toISOString(),
  ...overrides,
})

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to mock fetch responses
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      headers: new Headers({
        'content-type': 'application/json',
      }),
    } as Response)
  )
}