'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Upload, FileText, Send, ArrowLeft, Settings, Key } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  ticker: string
  name: string
  primary_company_type_id: string
  additional_company_types: string[]
}

interface CompanyType {
  id: string
  name: string
  description: string
  system_prompt_template: string
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
  const [ticker, setTicker] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [availableCompanyTypes, setAvailableCompanyTypes] = useState<CompanyType[]>([])
  const [selectedCompanyType, setSelectedCompanyType] = useState<CompanyType | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
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
      fetchCompanies()
      fetchUserApiKeys()
    }
  }, [user])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('ticker')

      if (error) {
        console.error('Error fetching companies:', error)
        return
      }

      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleTickerSearch = () => {
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol')
      return
    }

    const company = companies.find(c => c.ticker.toLowerCase() === ticker.toLowerCase())
    if (!company) {
      setError(`Company with ticker "${ticker}" not found. Available tickers: ${companies.map(c => c.ticker).join(', ')}`)
      setSelectedCompany(null)
      setAvailableCompanyTypes([])
      setSelectedCompanyType(null)
      return
    }

    setSelectedCompany(company)
    fetchCompanyTypes(company)
    setError('')
  }

  const fetchCompanyTypes = async (company: Company) => {
    try {
      // Get all possible company types for this company
      const allCompanyTypeIds = [company.primary_company_type_id, ...company.additional_company_types]
      
      const { data, error } = await supabase
        .from('company_types')
        .select('*')
        .in('id', allCompanyTypeIds)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching company types:', error)
        return
      }

      setAvailableCompanyTypes(data || [])
      
      // Auto-select primary company type
      const primaryType = data?.find(ct => ct.id === company.primary_company_type_id)
      if (primaryType) {
        setSelectedCompanyType(primaryType)
      }
    } catch (error) {
      console.error('Error fetching company types:', error)
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
    if (!transcript.trim()) {
      setError('Please enter a transcript')
      return
    }

    if (!selectedCompany) {
      setError('Please search for and select a company')
      return
    }

    if (!selectedCompanyType) {
      setError('Please select an analysis type')
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
        companyId: selectedCompany.id,
        companyTypeId: selectedCompanyType.id,
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
                  <h3 className="card-title">Company Selection</h3>
                  <p className="card-description">
                    Enter the ticker symbol to identify the company
                  </p>
                </div>
                <div className="card-content space-y-4">
                  {/* Ticker Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticker Symbol
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder="e.g., AAPL, TSLA, MSFT"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={analyzing}
                        onKeyPress={(e) => e.key === 'Enter' && handleTickerSearch()}
                      />
                      <button
                        onClick={handleTickerSearch}
                        disabled={!ticker.trim() || analyzing}
                        className="btn-primary px-4"
                      >
                        Search
                      </button>
                    </div>
                    {companies.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Available companies: {companies.map(c => c.ticker).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Selected Company Display */}
                  {selectedCompany && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-1">
                        Selected Company
                      </h4>
                      <p className="text-sm text-green-700">
                        <strong>{selectedCompany.ticker}</strong> - {selectedCompany.name}
                      </p>
                    </div>
                  )}

                  {/* Analysis Type Selection */}
                  {availableCompanyTypes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Analysis Type
                      </label>
                      <select
                        value={selectedCompanyType?.id || ''}
                        onChange={(e) => {
                          const type = availableCompanyTypes.find(ct => ct.id === e.target.value)
                          setSelectedCompanyType(type || null)
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={analyzing}
                      >
                        {availableCompanyTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      {selectedCompanyType && (
                        <p className="text-xs text-gray-600 mt-1">
                          {selectedCompanyType.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">API Configuration</h3>
                </div>
                <div className="card-content space-y-4">

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
                    disabled={analyzing || !transcript.trim() || !selectedCompany || !selectedCompanyType}
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