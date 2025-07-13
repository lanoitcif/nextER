'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Settings, Save, User } from 'lucide-react'
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

interface UserPreferences {
  defaultProvider: 'openai' | 'anthropic' | 'google' | 'cohere'
  defaultModels: {
    openai: string
    anthropic: string
    google: string
    cohere: string
  }
}

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultProvider: 'openai',
    defaultModels: DEFAULT_MODELS
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadUserPreferences()
    }
  }, [user])

  const loadUserPreferences = async () => {
    try {
      // For now, we'll use localStorage to store preferences
      // In production, you might want to store these in the database
      const stored = localStorage.getItem(`user-preferences-${user?.id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences(parsed)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      // For now, save to localStorage
      // In production, you might want to save to the database
      localStorage.setItem(`user-preferences-${user?.id}`, JSON.stringify(preferences))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleProviderModelChange = (provider: keyof typeof PROVIDER_MODELS, model: string) => {
    setPreferences(prev => ({
      ...prev,
      defaultModels: {
        ...prev.defaultModels,
        [provider]: model
      }
    }))
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
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                  <Settings className="h-8 w-8" />
                  <span>Settings</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your preferences and default models
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            {/* User Profile Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </h3>
                <p className="card-description">
                  Your account details and permissions
                </p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1 text-sm text-gray-900">{profile.full_name || 'Not set'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner Key Access</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        profile.can_use_owner_key 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.can_use_owner_key ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Default Models Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Default Model Preferences</h3>
                <p className="card-description">
                  Set your preferred models for each LLM provider
                </p>
              </div>
              <div className="card-content space-y-6">
                {saved && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="text-sm text-green-700">Settings saved successfully!</div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                {/* Default Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Provider
                  </label>
                  <select
                    value={preferences.defaultProvider}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      defaultProvider: e.target.value as any 
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                    <option value="cohere">Cohere</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    This will be pre-selected when creating new analyses
                  </p>
                </div>

                {/* Provider-specific Models */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Default Models by Provider</h4>
                  
                  {Object.entries(PROVIDER_MODELS).map(([provider, models]) => (
                    <div key={provider}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {provider} Default Model
                      </label>
                      <select
                        value={preferences.defaultModels[provider as keyof typeof PROVIDER_MODELS]}
                        onChange={(e) => handleProviderModelChange(
                          provider as keyof typeof PROVIDER_MODELS, 
                          e.target.value
                        )}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}