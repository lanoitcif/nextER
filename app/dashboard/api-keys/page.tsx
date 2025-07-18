'use client'

import { useAuth, isAdvanced } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2, ArrowLeft, Key, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

// Model mappings for each provider - Updated with latest 2025 models
const PROVIDER_MODELS = {
  openai: [
    'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3', 'o3-pro', 'o4-mini', 'o4-mini-high',
    'gpt-4o', 'gpt-4o-mini', 'gpt-4o-audio', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-image-1'
  ],
  anthropic: [
    'claude-4-opus', 'claude-4-sonnet', 'claude-3.7-sonnet', 'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'
  ],
  google: [
    'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite',
    'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemma-3', 'gemma-2'
  ],
  cohere: [
    'command-a-03-2025', 'command-r-plus-08-2024', 'command-r-08-2024', 'command-r7b',
    'command-r-plus', 'command-r', 'command'
  ]
}

const DEFAULT_MODELS = {
  openai: 'gpt-4.1-mini',
  anthropic: 'claude-4-sonnet',
  google: 'gemini-2.5-flash',
  cohere: 'command-a-03-2025'
}

interface UserApiKey {
  id: string
  provider: string
  nickname: string
  default_model?: string
  created_at: string
}

export default function ApiKeysPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKey, setNewKey] = useState({
    provider: 'openai' as 'openai' | 'anthropic' | 'google' | 'cohere',
    apiKey: '',
    nickname: '',
    defaultModel: 'gpt-4.1-mini'
  })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
    if (!loading && user && !isAdvanced(profile)) {
      router.push('/dashboard')
    }
  }, [user, loading, profile, router])

  useEffect(() => {
    if (user) {
      fetchApiKeys()
    }
  }, [user])

  // Update default model when provider changes
  useEffect(() => {
    setNewKey(prev => ({
      ...prev,
      defaultModel: DEFAULT_MODELS[prev.provider]
    }))
  }, [newKey.provider])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/user-api-keys', {
        credentials: 'include' // Send cookies for server-side session handling
      })

      if (response.ok) {
        const text = await response.text()
        try {
          const result = text ? JSON.parse(text) : {}
          setApiKeys(result.apiKeys || [])
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Response:', text)
        }
      } else if (response.status === 401) {
        // Session expired, redirect to login
        console.error('Session expired while fetching API keys')
        router.push('/auth/login')
      }
    } catch (error: any) {
      console.error('Error fetching API keys:', error)
      if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
        // Session expired, redirect to login
        router.push('/auth/login')
      }
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleAddApiKey = async () => {
    console.log('🔄 Starting API key addition...')
    
    if (!newKey.apiKey.trim() || !newKey.provider) {
      console.log('❌ Validation failed - missing API key or provider')
      setError('Please enter an API key and select a provider')
      return
    }

    console.log('✅ Input validation passed')
    setAdding(true)
    setError('')

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ API request timed out after 60 seconds')
      setError('Request timed out. Please try again.')
      setAdding(false)
    }, 60000)

    try {
      console.log('🔍 Using existing user context...')
      // Skip the problematic getSession() call and use existing user from context
      if (!user) {
        console.error('❌ No user in context')
        setError('Your session has expired. Please sign in again.')
        setSessionExpired(true)
        setAdding(false)
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
        return
      }

      console.log('✅ User context found, making API request...')

      const requestBody = {
        provider: newKey.provider,
        apiKey: newKey.apiKey,
        nickname: newKey.nickname || null,
        defaultModel: newKey.defaultModel
      }
      
      console.log('📤 Making API request with body:', requestBody)

      // Make the API call without explicitly getting session - let the server handle auth
      const response = await fetch('/api/user-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Send cookies for server-side session handling
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      console.log('📥 API response status:', response.status)

      const text = await response.text()
      console.log('📥 API response body:', text)
      
      let result = {}
      
      try {
        result = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError, 'Response:', text)
        setError('Invalid response from server')
        return
      }

      if (!response.ok) {
        console.error('❌ API request failed:', result)
        // Check if it's an auth error
        if (response.status === 401) {
          setError('Your session has expired. Please sign in again.')
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
          return
        }
        setError((result as any).error || 'Failed to add API key')
        return
      }

      console.log('✅ API request successful:', result)
      
      // Reset form and refresh list
      setNewKey({ provider: 'openai', apiKey: '', nickname: '', defaultModel: 'gpt-4.1-mini' })
      setShowAddForm(false)
      await fetchApiKeys()
    } catch (error: any) {
      console.error('❌ Exception in API key addition:', error)
      if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
        console.log('🔄 Detected refresh token error, redirecting to login')
        setError('Your session has expired. Please sign in again.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        setError(error.message || 'An error occurred')
      }
    } finally {
      console.log('🔄 Setting adding to false')
      clearTimeout(timeoutId)
      setAdding(false)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      const response = await fetch(`/api/user-api-keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include' // Send cookies for server-side session handling
      })

      if (response.ok) {
        await fetchApiKeys()
      } else if (response.status === 401) {
        alert('Your session has expired. Please sign in again.')
        router.push('/auth/login')
      }
    } catch (error: any) {
      console.error('Error deleting API key:', error)
      if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
        alert('Your session has expired. Please sign in again.')
        router.push('/auth/login')
      }
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
                  NEaR API Keys
                </h1>
                <p className="text-sm text-cream-glow/70 mt-1">
                  Manage your LLM provider API keys
                </p>
              </div>
            </div>
            {isAdvanced(profile) && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add API Key</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Session Expired Banner */}
          {sessionExpired && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-400">
                    Session Expired
                  </p>
                  <p className="text-xs text-red-400/70">
                    Your session has expired. Redirecting to login...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Owner Key Status */}
          {profile.can_use_owner_key && (
            <div className="border border-grape-static/20 rounded-lg p-4 bg-charcoal/60 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-electric-green rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-cream-glow">
                    Owner API Key Access Enabled
                  </p>
                  <p className="text-xs text-cream-glow/70">
                    You can use the system's API keys for free analysis. Personal API keys are optional.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add API Key Form */}
          {showAddForm && isAdvanced(profile) && (
            <div className="border border-grape-static/20 rounded-lg p-4 bg-charcoal/60 mb-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-cream-glow">Add New API Key</h3>
                <p className="text-sm text-cream-glow/70 mt-1">
                  Add your personal LLM provider API key
                </p>
              </div>
              <div>
                <form onSubmit={(e) => { e.preventDefault(); handleAddApiKey(); }} className="space-y-4">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-md p-4">
                      <div className="text-sm text-red-400">{error}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-cream-glow mb-2">
                      Provider
                    </label>
                    <select
                      value={newKey.provider}
                      onChange={(e) => setNewKey(prev => ({ ...prev, provider: e.target.value as any }))}
                      className="w-full p-2 bg-charcoal border border-grape-static text-cream-glow rounded-md focus:ring-electric-green focus:border-electric-green"
                      disabled={adding}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="cohere">Cohere</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cream-glow mb-2">
                      Default Model
                    </label>
                    <select
                      value={newKey.defaultModel}
                      onChange={(e) => setNewKey(prev => ({ ...prev, defaultModel: e.target.value }))}
                      className="w-full p-2 bg-charcoal border border-grape-static text-cream-glow rounded-md focus:ring-electric-green focus:border-electric-green"
                      disabled={adding}
                    >
                      {PROVIDER_MODELS[newKey.provider].map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-cream-glow/60 mt-1">
                      This will be used as the default model for this API key
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cream-glow mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={newKey.apiKey}
                        onChange={(e) => setNewKey(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Enter your API key"
                        className="w-full p-2 pr-10 bg-charcoal border border-grape-static text-cream-glow rounded-md focus:ring-electric-green focus:border-electric-green placeholder-cream-glow/40"
                        disabled={adding}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4 text-cream-glow/60" />
                        ) : (
                          <Eye className="h-4 w-4 text-cream-glow/60" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cream-glow mb-2">
                      Nickname (Optional)
                    </label>
                    <input
                      type="text"
                      value={newKey.nickname}
                      onChange={(e) => setNewKey(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder="Give this key a memorable name"
                      className="w-full p-2 bg-charcoal border border-grape-static text-cream-glow rounded-md focus:ring-electric-green focus:border-electric-green placeholder-cream-glow/40"
                      disabled={adding}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={adding || !newKey.apiKey.trim()}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {adding ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Add Key</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setError('')
                        setNewKey({ provider: 'openai', apiKey: '', nickname: '', defaultModel: 'gpt-4.1-mini' })
                      }}
                      className="btn-ghost"
                      disabled={adding}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="border border-grape-static/20 rounded-lg p-4 bg-charcoal/60">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-cream-glow">Your API Keys</h3>
              <p className="text-sm text-cream-glow/70 mt-1">
                Manage your saved LLM provider API keys
              </p>
            </div>
            <div>
              {loadingKeys ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-green mx-auto"></div>
                  <p className="text-sm text-cream-glow/70 mt-2">Loading API keys...</p>
                </div>
              ) : apiKeys.length > 0 ? (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border border-grape-static/20 rounded-lg bg-charcoal/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Key className="h-6 w-6 text-cream-glow/60" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-cream-glow">
                            {key.nickname || `${key.provider} API Key`}
                          </p>
                          <p className="text-xs text-cream-glow/60">
                            {key.provider} • {key.default_model || DEFAULT_MODELS[key.provider as keyof typeof DEFAULT_MODELS]} • Added {new Date(key.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteApiKey(key.id)}
                        className="btn-ghost text-red-400 hover:text-red-300 flex items-center space-x-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="mx-auto h-12 w-12 text-cream-glow/60 mb-4" />
                  <p className="text-sm text-cream-glow/70">No API keys added yet</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-2 text-electric-green hover:text-electric-green/80 text-sm"
                  >
                    Add your first API key
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}