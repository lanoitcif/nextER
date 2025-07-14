'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Upload, FileText, Send, ArrowLeft, Settings, Key, Download, Copy, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { safeLocalStorage } from '@/lib/utils/localStorage'

// Model mappings for each provider - Updated with latest 2025 models
const PROVIDER_MODELS = {
  openai: [
    // GPT-4.1 Series (Latest 2025)
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    // Reasoning Models
    'o3',
    'o3-pro',
    'o4-mini',
    'o4-mini-high',
    // GPT-4o Series
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4o-audio',
    // Legacy Models
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
    // Image Generation
    'gpt-image-1'
  ],
  anthropic: [
    // Claude 4 Series (Latest 2025)
    'claude-4-opus',
    'claude-4-sonnet',
    // Claude 3.7 Series (February 2025)
    'claude-3.7-sonnet',
    // Claude 3.5 Series (2024)
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    // Claude 3 Series (March 2024)
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ],
  google: [
    // Gemini 2.5 Series (Latest - Generally Available)
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    // Gemini 2.0 Series
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    // Gemini 1.5 Series (Limited Availability)
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    // Gemma Open Models
    'gemma-3',
    'gemma-2'
  ],
  cohere: [
    // Latest Command Models (2025)
    'command-a-03-2025',
    // Command R Series (August 2024)
    'command-r-plus-08-2024',
    'command-r-08-2024',
    'command-r7b',
    // Legacy Models
    'command-r-plus',
    'command-r',
    'command'
  ]
}

const DEFAULT_MODELS = {
  openai: 'gpt-4.1-mini', // Updated to latest cost-effective model
  anthropic: 'claude-4-sonnet', // Updated to latest balanced model
  google: 'gemini-2.5-flash', // Updated to latest cost-effective model
  cohere: 'command-a-03-2025' // Updated to latest most performant model
}

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
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>([])
  const [keySource, setKeySource] = useState<'owner' | 'user_saved' | 'user_temporary'>('owner')
  const [selectedApiKey, setSelectedApiKey] = useState('')
  const [temporaryApiKey, setTemporaryApiKey] = useState('')
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google' | 'cohere'>('openai')
  const [selectedModel, setSelectedModel] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'rendered' | 'markdown'>('rendered')
  const [analysisMetadata, setAnalysisMetadata] = useState<{
    model?: string
    provider?: string
    usage?: any
  } | null>(null)

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

  // Set default model when provider changes
  useEffect(() => {
    setSelectedModel(DEFAULT_MODELS[provider])
  }, [provider])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.company-dropdown-container')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load user preferences on mount
  useEffect(() => {
    if (user) {
      loadUserPreferences()
    }
  }, [user])


  const loadUserPreferences = () => {
    const preferences = safeLocalStorage.getItem<{
      defaultProvider?: 'openai' | 'anthropic' | 'google' | 'cohere';
      defaultModels?: Record<string, string>;
    }>(`user-preferences-${user?.id}`, null)
    if (preferences) {
      setProvider(preferences.defaultProvider || 'openai')
      const defaultProvider = preferences.defaultProvider || 'openai'
      setSelectedModel(preferences.defaultModels?.[defaultProvider] || DEFAULT_MODELS[defaultProvider as keyof typeof DEFAULT_MODELS])
    }
  }

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
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
      setFilteredCompanies([])
      setShowDropdown(false)
      return
    }

    // Filter companies that match the ticker or name
    const filtered = companies.filter(c => 
      c.ticker.toLowerCase().includes(ticker.toLowerCase()) ||
      c.name.toLowerCase().includes(ticker.toLowerCase())
    )

    setFilteredCompanies(filtered)
    setShowDropdown(filtered.length > 0)
    setError('')

    // If exact match found, auto-select it but still show dropdown
    const exactMatch = filtered.find(c => c.ticker.toLowerCase() === ticker.toLowerCase())
    if (exactMatch) {
      setSelectedCompany(exactMatch)
      setTicker(exactMatch.ticker)
      fetchCompanyTypes(exactMatch)
      setError('')
      // Keep dropdown open to show the match
    } else if (filtered.length === 0) {
      setError(`No companies found matching "${ticker}"`)
      setSelectedCompany(null)
      setAvailableCompanyTypes([])
      setSelectedCompanyType(null)
    }
  }

  const handleCompanySelect = (company: Company) => {
    console.log('Selected company:', company)
    setSelectedCompany(company)
    setTicker(company.ticker)
    setShowDropdown(false)
    setFilteredCompanies([])
    fetchCompanyTypes(company)
    setError('')
  }

  const fetchCompanyTypes = async (company: Company) => {
    try {
      // Get all possible company types for this company
      const additionalTypes = Array.isArray(company.additional_company_types) 
        ? company.additional_company_types 
        : []
      const allCompanyTypeIds = [company.primary_company_type_id, ...additionalTypes]
      
      console.log('Fetching company types for company:', company)
      console.log('Company type IDs to fetch:', allCompanyTypeIds)
      
      const { data, error } = await supabase
        .from('company_types')
        .select('*')
        .in('id', allCompanyTypeIds)

      console.log('Company types query result:', { data, error })

      if (error) {
        console.error('Error fetching company types:', error)
        setAvailableCompanyTypes([])
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
      setAvailableCompanyTypes([])
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
        model: selectedModel || DEFAULT_MODELS[provider],
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
      setAnalysisMetadata({
        model: result.model,
        provider: result.provider,
        usage: result.usage
      })
    } catch (error: any) {
      setError(error.message || 'An error occurred during analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const downloadAsWord = async () => {
    if (!result) return

    try {
      // Convert markdown to HTML first
      const markdownHtml = convertMarkdownToHtml(result)
      
      // Create a blob with Word document format
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Transcript Analysis - ${selectedCompany?.ticker}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              line-height: 1.6; 
              margin: 1in; 
              color: #333;
            }
            h1, h2, h3, h4, h5, h6 { 
              color: #2c3e50; 
              margin-top: 1.5em; 
              margin-bottom: 0.5em;
            }
            h1 { font-size: 24px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h2 { font-size: 20px; color: #34495e; }
            h3 { font-size: 18px; color: #34495e; }
            p { margin-bottom: 1em; text-align: justify; }
            ul, ol { margin-bottom: 1em; padding-left: 30px; }
            li { margin-bottom: 0.5em; }
            strong { color: #2c3e50; }
            em { color: #7f8c8d; }
            blockquote { 
              border-left: 4px solid #3498db; 
              padding-left: 20px; 
              margin: 1em 0; 
              background-color: #f8f9fa;
              padding: 15px 20px;
            }
            code { 
              background-color: #f1f2f6; 
              padding: 2px 6px; 
              border-radius: 3px; 
              font-family: 'Courier New', monospace;
            }
            .header { 
              text-align: center; 
              margin-bottom: 2em; 
              border-bottom: 1px solid #bdc3c7; 
              padding-bottom: 1em;
            }
            .metadata { 
              background-color: #ecf0f1; 
              padding: 15px; 
              border-radius: 5px; 
              margin-bottom: 2em;
              font-size: 14px;
            }
            .footer {
              margin-top: 3em;
              padding-top: 1em;
              border-top: 1px solid #bdc3c7;
              font-size: 12px;
              color: #7f8c8d;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transcript Analysis Report</h1>
            <p><strong>Company:</strong> ${selectedCompany?.ticker} - ${selectedCompany?.name}</p>
            <p><strong>Analysis Type:</strong> ${selectedCompanyType?.name}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          ${analysisMetadata && `
            <div class="metadata">
              <strong>Analysis Details:</strong><br>
              Provider: ${analysisMetadata.provider}<br>
              Model: ${analysisMetadata.model}<br>
              ${analysisMetadata.usage ? `Tokens Used: ${analysisMetadata.usage.totalTokens?.toLocaleString() || 'N/A'}` : ''}
            </div>
          `}
          
          <div class="content">
            ${markdownHtml}
          </div>
          
          <div class="footer">
            Generated by LLM Transcript Analyzer
          </div>
        </body>
        </html>
      `

      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analysis-${selectedCompany?.ticker}-${new Date().toISOString().split('T')[0]}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download Word document:', error)
    }
  }

  // Simple markdown to HTML converter
  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists (simple implementation)
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Wrap consecutive list items in ul tags
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      // Wrap in paragraphs
      .replace(/^(?!<h|<ul|<li)(.+)$/gm, '<p>$1</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '')
  }

  // Render markdown for display
  const renderMarkdown = (markdown: string): string => {
    return convertMarkdownToHtml(markdown)
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
    <div className="min-h-screen bg-neutral-100">
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
                  NEaR Analyze
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  AI-powered earnings analysis
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
                  <h3 className="card-title">Transcript</h3>
                  <p className="card-description">
                    Paste transcript text
                  </p>
                </div>
                <div className="card-content">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste your transcript here..."
                    className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                    disabled={analyzing}
                  />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Company</h3>
                  <p className="card-description">
                    Enter ticker symbol
                  </p>
                </div>
                <div className="card-content space-y-4">
                  {/* Ticker Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticker Symbol
                    </label>
                    <div className="relative company-dropdown-container">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={ticker}
                          onChange={(e) => {
                            setTicker(e.target.value.toUpperCase())
                            setShowDropdown(false)
                            setSelectedCompany(null)
                            setAvailableCompanyTypes([])
                            setSelectedCompanyType(null)
                          }}
                          placeholder="e.g., AAPL, TSLA, MSFT"
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
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
                      
                      {/* Company Dropdown */}
                      {showDropdown && filteredCompanies.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredCompanies.map((company) => (
                            <button
                              key={company.id}
                              onClick={() => handleCompanySelect(company)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                            >
                              <div className="font-medium text-gray-900">{company.ticker}</div>
                              <div className="text-sm text-gray-600">{company.name}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Company Display */}
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-900 mb-1">
                      Selected Company
                    </h4>
                    <p className="text-sm text-green-700">
                      {selectedCompany ? (
                        <><strong>{selectedCompany.ticker}</strong> - {selectedCompany.name}</>
                      ) : (
                        <span className="text-gray-500">No company selected</span>
                      )}
                    </p>
                  </div>

                  {/* Analysis Type Selection */}
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      disabled={analyzing || availableCompanyTypes.length === 0}
                    >
                      <option value="">
                        {availableCompanyTypes.length === 0 
                          ? 'Select a company first...' 
                          : 'Select analysis type...'
                        }
                      </option>
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
                    {availableCompanyTypes.length === 0 && selectedCompany && (
                      <p className="text-xs text-red-600 mt-1">
                        No analysis types available for this company. Check database configuration.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Configuration</h3>
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      disabled={analyzing}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="cohere">Cohere</option>
                    </select>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      disabled={analyzing}
                    >
                      {PROVIDER_MODELS[provider].map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Default: {DEFAULT_MODELS[provider]}
                    </p>
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
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="card-title">Analysis Results</h3>
                    <p className="card-description">
                      AI analysis results will appear here
                    </p>
                  </div>
                  {result && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => setViewMode('rendered')}
                          className={`px-3 py-1 text-sm rounded-l-lg ${
                            viewMode === 'rendered' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Eye className="h-4 w-4 mr-1 inline" />
                          Formatted
                        </button>
                        <button
                          onClick={() => setViewMode('markdown')}
                          className={`px-3 py-1 text-sm rounded-r-lg ${
                            viewMode === 'markdown' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <EyeOff className="h-4 w-4 mr-1 inline" />
                          Markdown
                        </button>
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="btn-secondary text-sm px-3 py-1"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </button>
                      <button
                        onClick={downloadAsWord}
                        className="btn-primary text-sm px-3 py-1"
                        title="Download as Word document"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Word
                      </button>
                    </div>
                  )}
                </div>
                {analysisMetadata && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                    <strong>Analysis Details:</strong> {analysisMetadata.provider} • {analysisMetadata.model}
                    {analysisMetadata.usage?.totalTokens && (
                      <> • {analysisMetadata.usage.totalTokens.toLocaleString()} tokens</>
                    )}
                  </div>
                )}
              </div>
              <div className="card-content">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}
                
                {result ? (
                  <div className="max-w-none">
                    {viewMode === 'rendered' ? (
                      <div 
                        className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md border font-mono">
                        {result}
                      </pre>
                    )}
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