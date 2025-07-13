'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Upload, FileText, Send, ArrowLeft, Settings, Key } from 'lucide-react'
import Link from 'next/link'

interface Prompt {
  id: string
  name: string
  display_name: string
  description: string
  category: string
}

interface UserApiKey {
  id: string
  provider: string
  nickname: string
}

export default function AnalyzePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>([])
  const [keySource, setKeySource] = useState<'owner' | 'user_saved' | 'user_temporary'>('owner')
  const [selectedApiKey, setSelectedApiKey] = useState('')
  const [temporaryApiKey, setTemporaryApiKey] = useState('')
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google' | 'cohere'>('openai')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchPrompts()
      fetchUserApiKeys()
    }
  }, [user])

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .order('display_name')

      if (error) {
        console.error('Error fetching prompts:', error)
        return
      }

      setPrompts(data || [])
      if (data && data.length > 0) {
        setSelectedPrompt(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    }
  }

  const fetchUserApiKeys = async () => {
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
        setUserApiKeys(result.apiKeys || [])
      }
    } catch (error) {
      console.error('Error fetching user API keys:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!transcript.trim() || !selectedPrompt) {
      setError('Please enter a transcript and select a prompt')
      return
    }

    if (keySource === 'user_saved' && !selectedApiKey) {
      setError('Please select an API key')
      return
    }

    if (keySource === 'user_temporary' && !temporaryApiKey.trim()) {
      setError('Please enter a temporary API key')
      return
    }

    if (!profile?.can_use_owner_key && keySource === 'owner') {
      setError('You do not have permission to use owner API keys')
      return
    }

    setAnalyzing(true)
    setError('')
    setResult('')

    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('Please sign in again')
        return
      }

      const requestBody = {
        transcript,
        promptId: selectedPrompt,
        keySource,
        provider,
        ...(keySource === 'user_saved' && { userApiKeyId: selectedApiKey }),
        ...(keySource === 'user_temporary' && { temporaryApiKey })
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Analysis failed')
        return
      }

      setResult(result.analysis)
    } catch (error: any) {
      setError(error.message || 'An error occurred during analysis')
    } finally {
      setAnalyzing(false)
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
                  Analyze Transcript
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Upload or paste a transcript for AI analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Transcript Input</h3>
                  <p className="card-description">
                    Paste your transcript text below
                  </p>
                </div>
                <div className="card-content">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste your transcript here..."
                    className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={analyzing}
                  />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Analysis Settings</h3>
                </div>
                <div className="card-content space-y-4">
                  {/* Prompt Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Type
                    </label>
                    <select
                      value={selectedPrompt}
                      onChange={(e) => setSelectedPrompt(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={analyzing}
                    >
                      {prompts.map((prompt) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.display_name}
                        </option>
                      ))}
                    </select>
                    {selectedPrompt && (
                      <p className="text-xs text-gray-600 mt-1">
                        {prompts.find(p => p.id === selectedPrompt)?.description}
                      </p>
                    )}
                  </div>

                  {/* API Key Source */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key Source
                    </label>
                    <div className="space-y-2">
                      {profile.can_use_owner_key && (
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="keySource"
                            value="owner"
                            checked={keySource === 'owner'}
                            onChange={(e) => setKeySource(e.target.value as any)}
                            className="mr-2"
                            disabled={analyzing}
                          />
                          <span className="text-sm">Use system API keys (free)</span>
                        </label>
                      )}
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="keySource"
                          value="user_saved"
                          checked={keySource === 'user_saved'}
                          onChange={(e) => setKeySource(e.target.value as any)}
                          className="mr-2"
                          disabled={analyzing}
                        />
                        <span className="text-sm">Use saved API key</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="keySource"
                          value="user_temporary"
                          checked={keySource === 'user_temporary'}
                          onChange={(e) => setKeySource(e.target.value as any)}
                          className="mr-2"
                          disabled={analyzing}
                        />
                        <span className="text-sm">Use temporary API key</span>
                      </label>
                    </div>
                  </div>

                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LLM Provider
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={analyzing}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="cohere">Cohere</option>
                    </select>
                  </div>

                  {/* Saved API Key Selection */}
                  {keySource === 'user_saved' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Saved API Key
                      </label>
                      {userApiKeys.filter(key => key.provider === provider).length > 0 ? (
                        <select
                          value={selectedApiKey}
                          onChange={(e) => setSelectedApiKey(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          disabled={analyzing}
                        >
                          <option value="">Select an API key</option>
                          {userApiKeys
                            .filter(key => key.provider === provider)
                            .map((key) => (
                              <option key={key.id} value={key.id}>
                                {key.nickname || `${key.provider} key`}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-600">
                          No saved {provider} API keys found.{' '}
                          <Link href="/dashboard/api-keys" className="text-blue-600 hover:underline">
                            Add one here
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Temporary API Key Input */}
                  {keySource === 'user_temporary' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temporary API Key
                      </label>
                      <input
                        type="password"
                        value={temporaryApiKey}
                        onChange={(e) => setTemporaryApiKey(e.target.value)}
                        placeholder={`Enter your ${provider} API key`}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={analyzing}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        This key will not be saved
                      </p>
                    </div>
                  )}

                  {/* Analyze Button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || !transcript.trim() || !selectedPrompt}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Analyze Transcript</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Analysis Results</h3>
                <p className="card-description">
                  AI analysis results will appear here
                </p>
              </div>
              <div className="card-content">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}
                
                {result ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md border">
                      {result}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>Analysis results will appear here after processing</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}