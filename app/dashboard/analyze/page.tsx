'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useReducer } from 'react'
import { marked } from 'marked'
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
  system_prompt_template?: string
}

interface UserApiKey {
  id: string
  provider: string
  nickname: string
}

// Centralized state management with useReducer
interface AppState {
  // Company selection
  ticker: string
  selectedCompany: Company | null
  companies: Company[]
  filteredCompanies: Company[]
  showDropdown: boolean
  loadingCompanies: boolean
  
  // Company types
  availableCompanyTypes: CompanyType[]
  selectedCompanyType: CompanyType | null
  
  // API configuration
  keySource: 'owner' | 'user_saved' | 'user_temporary'
  selectedApiKey: string
  temporaryApiKey: string
  provider: 'openai' | 'anthropic' | 'google' | 'cohere'
  selectedModel: string
  userApiKeys: UserApiKey[]
  
  // Analysis state
  analyzing: boolean
  result: string
  error: string
  analysisMetadata: {
    model?: string
    provider?: string
    usage?: any
  } | null
  
  // UI state
  viewMode: 'rendered' | 'markdown'
}

type AppAction = 
  | { type: 'SET_TICKER'; payload: string }
  | { type: 'SET_SELECTED_COMPANY'; payload: Company | null }
  | { type: 'SET_COMPANIES'; payload: Company[] }
  | { type: 'SET_FILTERED_COMPANIES'; payload: Company[] }
  | { type: 'SET_SHOW_DROPDOWN'; payload: boolean }
  | { type: 'SET_LOADING_COMPANIES'; payload: boolean }
  | { type: 'SET_AVAILABLE_COMPANY_TYPES'; payload: CompanyType[] }
  | { type: 'SET_SELECTED_COMPANY_TYPE'; payload: CompanyType | null }
  | { type: 'SET_KEY_SOURCE'; payload: 'owner' | 'user_saved' | 'user_temporary' }
  | { type: 'SET_SELECTED_API_KEY'; payload: string }
  | { type: 'SET_TEMPORARY_API_KEY'; payload: string }
  | { type: 'SET_PROVIDER'; payload: 'openai' | 'anthropic' | 'google' | 'cohere' }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'SET_USER_API_KEYS'; payload: UserApiKey[] }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_RESULT'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_ANALYSIS_METADATA'; payload: any }
  | { type: 'SET_VIEW_MODE'; payload: 'rendered' | 'markdown' }
  | { type: 'RESET_COMPANY_SELECTION' }
  | { type: 'RESET_ANALYSIS' }

const initialState: AppState = {
  ticker: '',
  selectedCompany: null,
  companies: [],
  filteredCompanies: [],
  showDropdown: false,
  loadingCompanies: true,
  availableCompanyTypes: [],
  selectedCompanyType: null,
  keySource: 'owner',
  selectedApiKey: '',
  temporaryApiKey: '',
  provider: 'openai',
  selectedModel: '',
  userApiKeys: [],
  analyzing: false,
  result: '',
  error: '',
  analysisMetadata: null,
  viewMode: 'rendered'
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TICKER':
      return { ...state, ticker: action.payload }
    case 'SET_SELECTED_COMPANY':
      return { ...state, selectedCompany: action.payload }
    case 'SET_COMPANIES':
      return { ...state, companies: action.payload }
    case 'SET_FILTERED_COMPANIES':
      return { ...state, filteredCompanies: action.payload }
    case 'SET_SHOW_DROPDOWN':
      return { ...state, showDropdown: action.payload }
    case 'SET_LOADING_COMPANIES':
      return { ...state, loadingCompanies: action.payload }
    case 'SET_AVAILABLE_COMPANY_TYPES':
      console.log('🔄 SET_AVAILABLE_COMPANY_TYPES action:', {
        previous: state.availableCompanyTypes.length,
        new: action.payload?.length || 0,
        payload: action.payload
      })
      return { ...state, availableCompanyTypes: action.payload }
    case 'SET_SELECTED_COMPANY_TYPE':
      return { ...state, selectedCompanyType: action.payload }
    case 'SET_KEY_SOURCE':
      return { ...state, keySource: action.payload }
    case 'SET_SELECTED_API_KEY':
      return { ...state, selectedApiKey: action.payload }
    case 'SET_TEMPORARY_API_KEY':
      return { ...state, temporaryApiKey: action.payload }
    case 'SET_PROVIDER':
      return { ...state, provider: action.payload }
    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload }
    case 'SET_USER_API_KEYS':
      return { ...state, userApiKeys: action.payload }
    case 'SET_ANALYZING':
      return { ...state, analyzing: action.payload }
    case 'SET_RESULT':
      return { ...state, result: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_ANALYSIS_METADATA':
      return { ...state, analysisMetadata: action.payload }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'RESET_COMPANY_SELECTION':
      return {
        ...state,
        selectedCompany: null,
        availableCompanyTypes: [],
        selectedCompanyType: null,
        filteredCompanies: [],
        showDropdown: false,
        error: ''
      }
    case 'RESET_ANALYSIS':
      return {
        ...state,
        result: '',
        error: '',
        analysisMetadata: null,
        analyzing: false
      }
    default:
      return state
  }
}

export default function AnalyzePage() {
  const { user, profile, session, loading } = useAuth()
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Track user ID to prevent unnecessary refetches on object reference changes
  const [lastUserId, setLastUserId] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.id !== lastUserId) {
      console.log('User ID changed, re-fetching data...', user.id);
      setLastUserId(user.id)
      // Load preferences first, then fetch data to avoid provider conflicts
      loadUserPreferences()
      fetchCompanies()
      fetchUserApiKeys()
    } else if (user && user.id === lastUserId) {
      console.log('User object reference changed but same user ID, skipping refetch');
    }
    // Only refetch when user ID actually changes, not on every object reference change
  }, [user, lastUserId])

  // Set default model when provider changes
  useEffect(() => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: DEFAULT_MODELS[state.provider] })
  }, [state.provider])
  
  // Debug: Monitor availableCompanyTypes changes
  useEffect(() => {
    console.log('📊 availableCompanyTypes updated:', {
      length: state.availableCompanyTypes.length,
      types: state.availableCompanyTypes.map(t => ({ id: t.id, name: t.name })),
      selectedCompany: state.selectedCompany?.ticker
    })
  }, [state.availableCompanyTypes])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.company-dropdown-container')) {
        dispatch({ type: 'SET_SHOW_DROPDOWN', payload: false })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const loadUserPreferences = () => {
    const preferences = safeLocalStorage.getItem<{
      defaultProvider?: 'openai' | 'anthropic' | 'google' | 'cohere';
      defaultModels?: Record<string, string>;
    }>(`user-preferences-${user?.id}`, null)
    if (preferences) {
      const defaultProvider = preferences.defaultProvider || 'openai'
      dispatch({ type: 'SET_PROVIDER', payload: defaultProvider })
      dispatch({ 
        type: 'SET_SELECTED_MODEL', 
        payload: preferences.defaultModels?.[defaultProvider] || DEFAULT_MODELS[defaultProvider as keyof typeof DEFAULT_MODELS]
      })
    }
  }

  const fetchCompanies = async () => {
    try {
      console.log('Fetching companies...')
      dispatch({ type: 'SET_LOADING_COMPANIES', payload: true })

      const response = await fetch('/api/companies', { headers: { Accept: 'application/json' } })
      if (!response.ok) {
        const err = await response.json()
        console.error('Error fetching companies:', err)
        dispatch({ type: 'SET_LOADING_COMPANIES', payload: false })
        return
      }

      const result = await response.json()
      console.log('Companies fetch result:', { count: result.companies?.length })
      dispatch({ type: 'SET_COMPANIES', payload: result.companies || [] })
      dispatch({ type: 'SET_LOADING_COMPANIES', payload: false })
    } catch (error) {
      console.error('Error fetching companies:', error)
      dispatch({ type: 'SET_LOADING_COMPANIES', payload: false })
    }
  }

  const handleTickerSearch = () => {
    console.log('handleTickerSearch called with ticker:', state.ticker)
    console.log('Available companies:', state.companies.length, state.companies)
    
    if (!state.ticker.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a ticker symbol' })
      dispatch({ type: 'SET_FILTERED_COMPANIES', payload: [] })
      dispatch({ type: 'SET_SHOW_DROPDOWN', payload: false })
      return
    }

    // Filter companies that match the ticker or name
    const filtered = state.companies.filter(c => 
      c.ticker.toLowerCase().includes(state.ticker.toLowerCase()) ||
      c.name.toLowerCase().includes(state.ticker.toLowerCase())
    )

    console.log('Filtered companies:', filtered.length, filtered)
    dispatch({ type: 'SET_FILTERED_COMPANIES', payload: filtered })
    dispatch({ type: 'SET_SHOW_DROPDOWN', payload: filtered.length > 0 })
    dispatch({ type: 'SET_ERROR', payload: '' })

    // If exact match found, auto-select it and show dropdown so user can see the match
    const exactMatch = filtered.find(c => c.ticker.toLowerCase() === state.ticker.toLowerCase())
    if (exactMatch) {
      console.log('🔍 PROGRAMMATIC SELECTION - Exact match found for', state.ticker, '- keeping dropdown visible')
      dispatch({ type: 'SET_SELECTED_COMPANY', payload: exactMatch })
      dispatch({ type: 'SET_TICKER', payload: exactMatch.ticker })
      fetchCompanyTypes(exactMatch)
      dispatch({ type: 'SET_ERROR', payload: '' })
      // Explicitly keep dropdown open to show the match was found
      dispatch({ type: 'SET_SHOW_DROPDOWN', payload: true })
      console.log('Dropdown state should be visible with', filtered.length, 'companies')
    } else if (filtered.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: `No companies found matching "${state.ticker}"` })
      dispatch({ type: 'RESET_COMPANY_SELECTION' })
    }
  }

  const handleCompanySelect = (company: Company) => {
    console.log('🎯 Company selected:', company)
    dispatch({ type: 'SET_SELECTED_COMPANY', payload: company })
    dispatch({ type: 'SET_TICKER', payload: company.ticker }) // Update the input field to the selected ticker
    dispatch({ type: 'SET_SHOW_DROPDOWN', payload: false })
    
    // Now, fetch the company types
    fetchCompanyTypes(company)
    dispatch({ type: 'SET_ERROR', payload: '' })
  }

  const fetchCompanyTypes = async (company: Company) => {
    try {
      console.log('🔄 Fetching company types for company:', company.ticker, 'ID:', company.id)
      
      if (!company.id) {
        console.error('❌ No company ID provided')
        dispatch({ type: 'SET_ERROR', payload: 'Invalid company data' })
        return
      }
      
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        console.error('❌ No session found')
        dispatch({ type: 'SET_ERROR', payload: 'Authentication required' })
        return
      }

      console.log('📡 Making API request to /api/company-types')
      const response = await fetch(`/api/company-types?companyId=${company.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorResult = await response.json()
        console.error('❌ Error fetching company types:', response.status, response.statusText, errorResult)
        
        // Fallback to default type only
        const fallbackType = {
          id: 'general_analysis',
          name: 'General Analysis',
          description: 'Default general financial analysis template',
          system_prompt_template: 'You are a financial analyst providing comprehensive earnings analysis.'
        }
        dispatch({ type: 'SET_AVAILABLE_COMPANY_TYPES', payload: [fallbackType] })
        dispatch({ type: 'SET_SELECTED_COMPANY_TYPE', payload: fallbackType })
        dispatch({ type: 'SET_ERROR', payload: 'Using default analysis type due to connection issue.' })
        
        // Clear error after 3 seconds
        setTimeout(() => dispatch({ type: 'SET_ERROR', payload: '' }), 3000)
        return
      }

      const result = await response.json()
      const { companyTypes, primaryTypeId } = result

      console.log('✅ Successfully fetched company types:', companyTypes?.length)
      console.log('📋 Company types data:', companyTypes)
      console.log('🏢 Primary type ID:', primaryTypeId)
      
      // Ensure we have valid data before dispatching
      if (!companyTypes || companyTypes.length === 0) {
        console.warn('No company types returned from API, using fallback')
        const fallbackType = {
          id: 'general_analysis',
          name: 'General Analysis',
          description: 'Default general financial analysis template',
          system_prompt_template: 'You are a financial analyst providing comprehensive earnings analysis.'
        }
        dispatch({ type: 'SET_AVAILABLE_COMPANY_TYPES', payload: [fallbackType] })
        dispatch({ type: 'SET_SELECTED_COMPANY_TYPE', payload: fallbackType })
        return
      }
      
      dispatch({ type: 'SET_AVAILABLE_COMPANY_TYPES', payload: companyTypes })
      
      // Auto-select primary company type, or default to general analysis
      const primaryType = companyTypes?.find((ct: CompanyType) => ct.id === primaryTypeId)
      const defaultType = companyTypes?.find((ct: CompanyType) => ct.id === 'general_analysis')
      const selectedType = primaryType || defaultType || companyTypes?.[0]
      
      if (selectedType) {
        dispatch({ type: 'SET_SELECTED_COMPANY_TYPE', payload: selectedType })
        console.log('Auto-selected company type:', selectedType.name)
      }
    } catch (error: any) {
      console.error('Exception in fetchCompanyTypes:', error)
      
      // Provide user-friendly error message
      let errorMessage = 'Unable to load analysis types. Using default option.'
      if (error.message?.includes('timeout')) {
        errorMessage = 'Analysis types loading slowly. Using default option.'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network issue loading analysis types. Using default option.'
      }
      
      // Show user-friendly message (non-blocking)
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      
      // Always fallback to default type so user can continue
      const fallbackType = {
        id: 'general_analysis',
        name: 'General Analysis',
        description: 'Default general financial analysis template',
        system_prompt_template: 'You are a financial analyst providing comprehensive earnings analysis.'
      }
      dispatch({ type: 'SET_AVAILABLE_COMPANY_TYPES', payload: [fallbackType] })
      dispatch({ type: 'SET_SELECTED_COMPANY_TYPE', payload: fallbackType })
      
      // Clear error message after 5 seconds
      setTimeout(() => dispatch({ type: 'SET_ERROR', payload: '' }), 5000)
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
        const apiKeys = result.apiKeys || []
        dispatch({ type: 'SET_USER_API_KEYS', payload: apiKeys })
        
        // Auto-set provider and model from admin-assigned keys (overrides user preferences)
        const adminAssignedKey = apiKeys.find((key: any) => key.assigned_by_admin)
        if (adminAssignedKey) {
          console.log('Found admin-assigned key, setting provider:', adminAssignedKey.provider)
          dispatch({ type: 'SET_PROVIDER', payload: adminAssignedKey.provider })
          if (adminAssignedKey.default_model) {
            dispatch({ type: 'SET_SELECTED_MODEL', payload: adminAssignedKey.default_model })
          }
          dispatch({ type: 'SET_SELECTED_API_KEY', payload: adminAssignedKey.id })
          dispatch({ type: 'SET_KEY_SOURCE', payload: 'user_saved' })
        }
      }
    } catch (error) {
      console.error('Error fetching user API keys:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a transcript' })
      return
    }

    if (!state.selectedCompany) {
      dispatch({ type: 'SET_ERROR', payload: 'Please search for and select a company' })
      return
    }

    if (!state.selectedCompanyType) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select an analysis type' })
      return
    }

    if (state.keySource === 'user_saved' && !state.selectedApiKey) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select an API key' })
      return
    }

    if (state.keySource === 'user_temporary' && !state.temporaryApiKey.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a temporary API key' })
      return
    }

    if (!profile?.can_use_owner_key && state.keySource === 'owner') {
      dispatch({ type: 'SET_ERROR', payload: 'You do not have permission to use owner API keys' })
      return
    }

    console.log('Starting analysis...')
    dispatch({ type: 'SET_ANALYZING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: '' })
    dispatch({ type: 'SET_RESULT', payload: '' })

    if (!session) {
      dispatch({ type: 'SET_ERROR', payload: 'Authentication expired. Please sign in again.' })
      router.push('/auth/login')
      return
    }

    try {
      const requestBody = {
        transcript,
        companyId: state.selectedCompany.id,
        companyTypeId: state.selectedCompanyType.id,
        keySource: state.keySource,
        provider: state.provider,
        model: state.selectedModel || DEFAULT_MODELS[state.provider],
        ...(state.keySource === 'user_saved' && { userApiKeyId: state.selectedApiKey }),
        ...(state.keySource === 'user_temporary' && { temporaryApiKey: state.temporaryApiKey })
      }

      console.log('Request body prepared:', {
        transcriptLength: transcript.length,
        company: state.selectedCompany.ticker,
        companyType: state.selectedCompanyType.name,
        provider: state.provider,
        model: state.selectedModel,
        keySource: state.keySource,
        hasCompanyId: !!state.selectedCompany.id,
        hasCompanyTypeId: !!state.selectedCompanyType.id
      })

      console.log('About to send fetch request to /api/analyze...')
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Fetch completed! Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log('Response result:', result)

      if (!response.ok) {
        console.error('Analysis failed:', result)
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Analysis failed' })
        return
      }

      console.log('Analysis successful, setting result')
      dispatch({ type: 'SET_RESULT', payload: result.analysis })
      dispatch({ type: 'SET_ANALYSIS_METADATA', payload: {
        model: result.model,
        provider: result.provider,
        usage: result.usage
      }})
    } catch (error: any) {
      console.error('Analysis error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message || 'An error occurred during analysis' })
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(state.result)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const downloadAsWord = async () => {
    if (!state.result) return

    try {
      // Convert markdown to HTML first
      const markdownHtml = convertMarkdownToHtml(state.result)
      
      // Create a blob with Word document format
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Transcript Analysis - ${state.selectedCompany?.ticker}</title>
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
            <p><strong>Company:</strong> ${state.selectedCompany?.ticker} - ${state.selectedCompany?.name}</p>
            <p><strong>Analysis Type:</strong> ${state.selectedCompanyType?.name}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          ${state.analysisMetadata && `
            <div class="metadata">
              <strong>Analysis Details:</strong><br>
              Provider: ${state.analysisMetadata.provider}<br>
              Model: ${state.analysisMetadata.model}<br>
              ${state.analysisMetadata.usage ? `Tokens Used: ${state.analysisMetadata.usage.totalTokens?.toLocaleString() || 'N/A'}` : ''}
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
        type: 'text/html' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analysis-${state.selectedCompany?.ticker}-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download Word document:', error)
    }
  }

  // Simple markdown to HTML converter with table support
  const convertMarkdownToHtml = (markdown: string): string => {
    marked.setOptions({
      gfm: true,
      breaks: true
    })
    return marked.parse(markdown) as string
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="shadow-lg border-b">
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
                <h1 className="text-2xl font-bold">
                  NEaR Analyze
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
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
                    className="textarea w-full h-64"
                    disabled={state.analyzing}
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
                    <label className="block text-sm font-medium mb-2">
                      Ticker Symbol
                    </label>
                    <div className="relative company-dropdown-container">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={state.ticker}
                          onChange={(e) => {
                            const newTicker = e.target.value.toUpperCase()
                            dispatch({ type: 'SET_TICKER', payload: newTicker })
                            
                            if (newTicker.trim() === '') {
                              dispatch({ type: 'SET_FILTERED_COMPANIES', payload: [] })
                              dispatch({ type: 'SET_SHOW_DROPDOWN', payload: false })
                            } else {
                              const filtered = state.companies.filter(company => 
                                company.ticker.startsWith(newTicker)
                              )
                              dispatch({ type: 'SET_FILTERED_COMPANIES', payload: filtered })
                              dispatch({ type: 'SET_SHOW_DROPDOWN', payload: true })
                            }
                            // DO NOT reset selectedCompany or availableCompanyTypes here
                          }}
                          placeholder="e.g., AAPL, TSLA, MSFT"
                          className="input flex-1"
                          disabled={state.analyzing}
                          onKeyPress={(e) => e.key === 'Enter' && handleTickerSearch()}
                        />
                        <button
                          onClick={handleTickerSearch}
                          disabled={!state.ticker.trim() || state.analyzing}
                          className="btn-primary px-4"
                        >
                          Search
                        </button>
                      </div>
                      
                      {/* Company Dropdown */}
                      {state.showDropdown && state.filteredCompanies.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-auto">
                          {state.filteredCompanies.map((company) => (
                            <button
                              key={company.id}
                              onClick={() => handleCompanySelect(company)}
                              className="w-full text-left px-4 py-2 hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
                            >
                              <div className="font-medium">{company.ticker}</div>
                              <div className="text-sm text-muted-foreground">{company.name}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Company Display */}
                  <div className="bg-secondary/10 border border-secondary/20 rounded-md p-4">
                    <h4 className="text-sm font-medium text-secondary mb-1">
                      Selected Company
                    </h4>
                    <p className="text-sm">
                      {state.selectedCompany ? (
                        <><strong>{state.selectedCompany.ticker}</strong> - {state.selectedCompany.name}</>
                      ) : (
                        <span className="text-muted-foreground">No company selected</span>
                      )}
                    </p>
                  </div>

                  {/* Analysis Type Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Analysis Type
                    </label>
                    <select
                      value={state.selectedCompanyType?.id || ''}
                      onChange={(e) => {
                        const type = state.availableCompanyTypes.find(ct => ct.id === e.target.value)
                        dispatch({ type: 'SET_SELECTED_COMPANY_TYPE', payload: type || null })
                      }}
                      className="select w-full"
                      disabled={state.analyzing || state.availableCompanyTypes.length === 0}
                    >
                      <option value="">
                        {state.availableCompanyTypes.length === 0 
                          ? 'Select a company first...' 
                          : 'Select analysis type...'
                        }
                      </option>
                      {state.availableCompanyTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {state.selectedCompanyType && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {state.selectedCompanyType.description}
                      </p>
                    )}
                    {state.availableCompanyTypes.length === 0 && state.selectedCompany && (
                      <p className="text-xs text-destructive mt-1">
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
                    <label className="block text-sm font-medium mb-2">
                      API Key Source
                    </label>
                    <div className="space-y-2">
                      {profile.can_use_owner_key && (
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="keySource"
                            value="owner"
                            checked={state.keySource === 'owner'}
                            onChange={(e) => dispatch({ type: 'SET_KEY_SOURCE', payload: e.target.value as any })}
                            className="mr-2"
                            disabled={state.analyzing}
                          />
                          <span className="text-sm">Use system API keys (free)</span>
                        </label>
                      )}
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="keySource"
                          value="user_saved"
                          checked={state.keySource === 'user_saved'}
                          onChange={(e) => dispatch({ type: 'SET_KEY_SOURCE', payload: e.target.value as any })}
                          className="mr-2"
                          disabled={state.analyzing}
                        />
                        <span className="text-sm">Use saved API key</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="keySource"
                          value="user_temporary"
                          checked={state.keySource === 'user_temporary'}
                          onChange={(e) => dispatch({ type: 'SET_KEY_SOURCE', payload: e.target.value as any })}
                          className="mr-2"
                          disabled={state.analyzing}
                        />
                        <span className="text-sm">Use temporary API key</span>
                      </label>
                    </div>
                  </div>

                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      LLM Provider
                    </label>
                    <select
                      value={state.provider}
                      onChange={(e) => dispatch({ type: 'SET_PROVIDER', payload: e.target.value as any })}
                      className="select w-full"
                      disabled={state.analyzing}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="cohere">Cohere</option>
                    </select>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Model
                    </label>
                    <select
                      value={state.selectedModel}
                      onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                      className="select w-full"
                      disabled={state.analyzing}
                    >
                      {PROVIDER_MODELS[state.provider].map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: {DEFAULT_MODELS[state.provider]}
                    </p>
                  </div>

                  {/* Saved API Key Selection */}
                  {state.keySource === 'user_saved' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Saved API Key
                      </label>
                      {state.userApiKeys.filter(key => key.provider === state.provider).length > 0 ? (
                        <select
                          value={state.selectedApiKey}
                          onChange={(e) => dispatch({ type: 'SET_SELECTED_API_KEY', payload: e.target.value })}
                          className="select w-full"
                          disabled={state.analyzing}
                        >
                          <option value="">Select an API key</option>
                          {state.userApiKeys
                            .filter(key => key.provider === state.provider)
                            .map((key) => (
                              <option key={key.id} value={key.id}>
                                {key.nickname || `${key.provider} key`}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No saved {state.provider} API keys found.{' '}
                          <Link href="/dashboard/api-keys" className="text-primary hover:underline">
                            Add one here
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Temporary API Key Input */}
                  {state.keySource === 'user_temporary' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Temporary API Key
                      </label>
                      <input
                        type="password"
                        value={state.temporaryApiKey}
                        onChange={(e) => dispatch({ type: 'SET_TEMPORARY_API_KEY', payload: e.target.value })}
                        placeholder={`Enter your ${state.provider} API key`}
                        className="input w-full"
                        disabled={state.analyzing}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This key will not be saved
                      </p>
                    </div>
                  )}

                  {/* Analyze Button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={state.analyzing || !transcript.trim() || !state.selectedCompany || !state.selectedCompanyType}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    {state.analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
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
                  {state.result && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'rendered' })}
                          className={`px-3 py-1 text-sm rounded-l-lg ${
                            state.viewMode === 'rendered' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          <Eye className="h-4 w-4 mr-1 inline" />
                          Formatted
                        </button>
                        <button
                          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'markdown' })}
                          className={`px-3 py-1 text-sm rounded-r-lg ${
                            state.viewMode === 'markdown' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                {state.analysisMetadata && (
                  <div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border">
                    <strong>Analysis Details:</strong> {state.analysisMetadata.provider} • {state.analysisMetadata.model}
                    {state.analysisMetadata.usage?.totalTokens && (
                      <> • {state.analysisMetadata.usage.totalTokens.toLocaleString()} tokens</>
                    )}
                  </div>
                )}
              </div>
              <div className="card-content">
                {state.error && (
                  <div className="bg-destructive/20 border border-destructive/30 rounded-md p-4 mb-4">
                    <div className="text-sm text-destructive">{state.error}</div>
                  </div>
                )}
                
                {state.result ? (
                  <div className="max-w-none">
                    {state.viewMode === 'rendered' ? (
                      <div 
                        className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:text-muted-foreground prose-code:text-primary prose-code:bg-muted"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(state.result) }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm bg-muted text-muted-foreground p-4 rounded-md border font-mono">
                        {state.result}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" />
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