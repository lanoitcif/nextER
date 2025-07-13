'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2, ArrowLeft, Key, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface UserApiKey {
  id: string
  provider: string
  nickname: string
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
    nickname: ''
  })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchApiKeys()
    }
  }, [user])

  const fetchApiKeys = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return

      const response = await fetch('/api/user-api-keys', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setApiKeys(result.apiKeys || [])
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleAddApiKey = async () => {
    if (!newKey.apiKey.trim() || !newKey.provider) {
      setError('Please enter an API key and select a provider')
      return
    }

    setAdding(true)
    setError('')

    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('Please sign in again')
        return
      }

      const response = await fetch('/api/user-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({
          provider: newKey.provider,
          apiKey: newKey.apiKey,
          nickname: newKey.nickname || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to add API key')
        return
      }

      // Reset form and refresh list
      setNewKey({ provider: 'openai', apiKey: '', nickname: '' })
      setShowAddForm(false)
      await fetchApiKeys()
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return

      const response = await fetch(`/api/user-api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      })

      if (response.ok) {
        await fetchApiKeys()
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
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
                <h1 className="text-2xl font-bold text-gray-900">
                  API Key Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your LLM provider API keys
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add API Key</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Owner Key Status */}
          {profile.can_use_owner_key && (
            <div className="card mb-6">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Owner API Key Access Enabled
                    </p>
                    <p className="text-xs text-gray-600">
                      You can use the system's API keys for free analysis. Personal API keys are optional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add API Key Form */}
          {showAddForm && (
            <div className="card mb-6">
              <div className="card-header">
                <h3 className="card-title">Add New API Key</h3>
                <p className="card-description">
                  Add your personal LLM provider API key
                </p>
              </div>
              <div className="card-content space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <select
                    value={newKey.provider}
                    onChange={(e) => setNewKey(prev => ({ ...prev, provider: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={adding}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                    <option value="cohere">Cohere</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={newKey.apiKey}
                      onChange={(e) => setNewKey(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter your API key"
                      className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={adding}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={newKey.nickname}
                    onChange={(e) => setNewKey(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="Give this key a memorable name"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={adding}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAddApiKey}
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
                    onClick={() => {
                      setShowAddForm(false)
                      setError('')
                      setNewKey({ provider: 'openai', apiKey: '', nickname: '' })
                    }}
                    className="btn-ghost"
                    disabled={adding}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your API Keys</h3>
              <p className="card-description">
                Manage your saved LLM provider API keys
              </p>
            </div>
            <div className="card-content">
              {loadingKeys ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading API keys...</p>
                </div>
              ) : apiKeys.length > 0 ? (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Key className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {key.nickname || `${key.provider} API Key`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {key.provider} • Added {new Date(key.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteApiKey(key.id)}
                        className="btn-ghost text-red-600 hover:text-red-700 flex items-center space-x-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600">No API keys added yet</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
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