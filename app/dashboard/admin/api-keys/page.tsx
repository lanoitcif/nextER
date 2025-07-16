'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Key, User, Settings, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'

// Model mappings for each provider
const PROVIDER_MODELS = {
  openai: [
    'gpt-4.1-mini', 'gpt-4.1', 'gpt-4.1-nano', 'o3', 'o3-pro', 'o4-mini', 'o4-mini-high',
    'gpt-4o', 'gpt-4o-mini', 'gpt-4o-audio', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'
  ],
  anthropic: [
    'claude-4-sonnet', 'claude-4-opus', 'claude-3.7-sonnet', 'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'
  ],
  google: [
    'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-2.0-flash',
    'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'
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

interface UserProfile {
  id: string
  email: string
  full_name: string
  can_use_owner_key: boolean
  is_admin: boolean
}

interface UserApiKey {
  id: string
  user_id: string
  provider: string
  nickname: string
  assigned_by_admin: boolean
  admin_assigned_at: string | null
  admin_assigned_by: string | null
  default_model: string | null
  created_at: string
}

interface AssignKeyForm {
  userId: string
  provider: 'openai' | 'anthropic' | 'google' | 'cohere'
  apiKey: string
  nickname: string
  defaultModel: string
}

export default function AdminApiKeysPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignForm, setAssignForm] = useState<AssignKeyForm>({
    userId: '',
    provider: 'openai',
    apiKey: '',
    nickname: '',
    defaultModel: DEFAULT_MODELS.openai
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!loading && (!user || !profile?.is_admin)) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchUsers()
      fetchUserApiKeys()
    }
  }, [user, profile])

  useEffect(() => {
    // Update default model when provider changes
    setAssignForm(prev => ({
      ...prev,
      defaultModel: DEFAULT_MODELS[prev.provider]
    }))
  }, [assignForm.provider])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('email')

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchUserApiKeys = async () => {
    try {
      setLoadingKeys(true)
      const { data, error } = await supabase
        .from('user_api_keys')
        .select(`
          *,
          user_profiles!user_api_keys_user_id_fkey(email, full_name),
          admin_profiles:user_profiles!user_api_keys_admin_assigned_by_fkey(email, full_name)
        `)
        .eq('assigned_by_admin', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserApiKeys(data || [])
    } catch (error: any) {
      console.error('Error fetching user API keys:', error)
      setError('Failed to load API keys')
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleAssignKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignForm.userId || !assignForm.provider || !assignForm.apiKey.trim()) {
      setError('All fields are required')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch('/api/admin/assign-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId: assignForm.userId,
          provider: assignForm.provider,
          apiKey: assignForm.apiKey,
          nickname: assignForm.nickname || `${assignForm.provider} (Admin Assigned)`,
          defaultModel: assignForm.defaultModel
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign API key')
      }

      setSuccess('API key assigned successfully')
      setShowAssignForm(false)
      setAssignForm({
        userId: '',
        provider: 'openai',
        apiKey: '',
        nickname: '',
        defaultModel: DEFAULT_MODELS.openai
      })
      fetchUserApiKeys()
    } catch (error: any) {
      console.error('Error assigning API key:', error)
      setError(error.message || 'Failed to assign API key')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const response = await fetch(`/api/admin/assign-api-key?keyId=${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete API key')
      }

      setSuccess('API key deleted successfully')
      fetchUserApiKeys()
    } catch (error: any) {
      console.error('Error deleting API key:', error)
      setError(error.message || 'Failed to delete API key')
    }
  }

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !profile?.is_admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white shadow">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  API Key Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Assign and manage user API keys
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAssignForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Assign API Key</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          {/* Assign Key Form */}
          {showAssignForm && (
            <div className="card mb-6">
              <div className="card-header">
                <h3 className="card-title">Assign API Key to User</h3>
              </div>
              <div className="card-content">
                <form onSubmit={handleAssignKey} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User
                    </label>
                    <select
                      value={assignForm.userId}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, userId: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    >
                      <option value="">Select a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email} ({user.full_name || 'No name'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider
                    </label>
                    <select
                      value={assignForm.provider}
                      onChange={(e) => setAssignForm(prev => ({ 
                        ...prev, 
                        provider: e.target.value as AssignKeyForm['provider']
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="cohere">Cohere</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Model
                    </label>
                    <select
                      value={assignForm.defaultModel}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, defaultModel: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    >
                      {PROVIDER_MODELS[assignForm.provider].map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={assignForm.apiKey}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={`Enter ${assignForm.provider} API key`}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nickname (Optional)
                    </label>
                    <input
                      type="text"
                      value={assignForm.nickname}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder={`${assignForm.provider} (Admin Assigned)`}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary"
                    >
                      {submitting ? 'Assigning...' : 'Assign API Key'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssignForm(false)
                        setError('')
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Admin-Assigned API Keys</h3>
              <p className="card-description">
                API keys assigned by administrators to users
              </p>
            </div>
            <div className="card-content">
              {loadingKeys ? (
                <div className="text-center py-8">Loading API keys...</div>
              ) : userApiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No admin-assigned API keys found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userApiKeys.map((key: any) => (
                    <div
                      key={key.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Key className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {key.nickname || `${key.provider} API Key`}
                            </h4>
                            <div className="text-sm text-gray-600">
                              <div>User: {key.user_profiles?.email}</div>
                              <div>Provider: {key.provider}</div>
                              <div>Default Model: {key.default_model}</div>
                              <div>Assigned: {new Date(key.admin_assigned_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete API key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}