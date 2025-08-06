'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useReducer } from 'react'
import { marked } from 'marked'
import { supabase } from '@/lib/supabase/client'
import { Upload, FileText, Send, ArrowLeft, Settings, Key, Download, Copy, Eye, EyeOff, ThumbsUp, ThumbsDown } from 'lucide-react'
import Link from 'next/link'
import { safeLocalStorage } from '@/lib/utils/localStorage'
import { PROVIDER_MODELS, DEFAULT_MODELS, getActiveModels, getModelConfig } from '@/lib/config/llm-models'

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

  // Review state
  reviewAnalysis: boolean
  reviewProvider: 'openai' | 'anthropic' | 'google' | 'cohere'
  reviewModel: string
  reviewResult: string
  reviewAnalysisMetadata: {
    model?: string
    provider?: string
    usage?: any
  } | null

  // Feedback state
  transcriptId: string | null
  feedbackSubmitted: boolean
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
  | { type: 'SET_REVIEW_ANALYSIS'; payload: boolean }
  | { type: 'SET_REVIEW_PROVIDER'; payload: 'openai' | 'anthropic' | 'google' | 'cohere' }
  | { type: 'SET_REVIEW_MODEL'; payload: string }
  | { type: 'SET_REVIEW_RESULT'; payload: string }
  | { type: 'SET_REVIEW_ANALYSIS_METADATA'; payload: any }
  | { type: 'SET_TRANSCRIPT_ID'; payload: string | null }
  | { type: 'SET_FEEDBACK_SUBMITTED'; payload: boolean }

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
  viewMode: 'rendered',
  reviewAnalysis: false,
  reviewProvider: 'openai',
  reviewModel: '',
  reviewResult: '',
  reviewAnalysisMetadata: null,
  transcriptId: null,
  feedbackSubmitted: false
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
        analyzing: false,
        reviewResult: '',
        reviewAnalysisMetadata: null
      }
    case 'SET_REVIEW_ANALYSIS':
      return { ...state, reviewAnalysis: action.payload }
    case 'SET_REVIEW_PROVIDER':
      return { ...state, reviewProvider: action.payload }
    case 'SET_REVIEW_MODEL':
      return { ...state, reviewModel: action.payload }
    case 'SET_REVIEW_RESULT':
      return { ...state, reviewResult: action.payload }
    case 'SET_REVIEW_ANALYSIS_METADATA':
      return { ...state, reviewAnalysisMetadata: action.payload }
    case 'SET_TRANSCRIPT_ID':
      return { ...state, transcriptId: action.payload }
    case 'SET_FEEDBACK_SUBMITTED':
      return { ...state, feedbackSubmitted: action.payload }
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

  // Auto-select primary company type when available types change
  useEffect(() => {
    if (state.selectedCompany && state.availableCompanyTypes.length > 0 && !state.selectedCompanyType) {
      const primaryType = state.availableCompanyTypes.find(ct => ct.id === state.selectedCompany?.primary_company_type_id)
      if (primaryType) {
        console.log('useEffect: Auto-selecting primary type:', primaryType.name)
        dispatch({ type: 'SET_SELECTED_COMPANY_TYPE', payload: primaryType })
      }
    }
  }, [state.availableCompanyTypes, state.selectedCompany, state.selectedCompanyType])

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      dispatch({ type: 'SET_ERROR', payload: 'File size must be less than 10MB' })
      return
    }

    dispatch({ type: 'SET_ANALYZING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: '' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-transcript', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      const result = await response.json()
      setTranscript(result.text)
      
      // Show success message
      console.log(`Successfully extracted ${result.characterCount} characters from ${result.fileName}`)
    } catch (error: any) {
      console.error('File upload error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to process file' })
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false })
      // Reset file input
      e.target.value = ''
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
        ...(state.keySource === 'user_temporary' && { temporaryApiKey: state.temporaryApiKey }),
        reviewAnalysis: state.reviewAnalysis,
        ...(state.reviewAnalysis && {
          reviewProvider: state.reviewProvider,
          reviewModel: state.reviewModel || DEFAULT_MODELS[state.reviewProvider]
        })
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
      dispatch({ type: 'SET_TRANSCRIPT_ID', payload: result.transcriptId })
      dispatch({ type: 'SET_FEEDBACK_SUBMITTED', payload: false })

      if (result.review) {
        dispatch({ type: 'SET_REVIEW_RESULT', payload: result.review })
        dispatch({ type: 'SET_REVIEW_ANALYSIS_METADATA', payload: {
          model: result.reviewModel,
          provider: result.reviewProvider,
          usage: result.reviewUsage
        }})
      }

    } catch (error: any) {
      console.error('Analysis error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message || 'An error occurred during analysis' })
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false })
    }
  }

  const handleFeedback = async (feedback: 1 | -1) => {
    if (!state.transcriptId) return

    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return

      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({
          transcriptId: state.transcriptId,
          feedback
        })
      })
      dispatch({ type: 'SET_FEEDBACK_SUBMITTED', payload: true })
    } catch (error) {
      console.error('Error submitting feedback:', error)
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

  // HTML Export with inline CSS for proper formatting
  const downloadAsHtml = () => {
    if (!state.result) return

    try {
      const markdownHtml = convertMarkdownToHtml(state.result)
      
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript Analysis - ${state.selectedCompany?.ticker || 'Report'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #fff;
      padding: 40px 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e40af;
      font-size: 2em;
      margin-bottom: 10px;
    }
    h2 {
      color: #2563eb;
      font-size: 1.5em;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    h3 {
      color: #3730a3;
      font-size: 1.2em;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h4 {
      color: #4f46e5;
      font-size: 1.1em;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    p {
      margin-bottom: 15px;
      text-align: justify;
    }
    ul, ol {
      margin-bottom: 15px;
      margin-left: 30px;
    }
    li {
      margin-bottom: 8px;
    }
    strong {
      font-weight: 600;
      color: #1f2937;
    }
    em {
      font-style: italic;
      color: #4b5563;
    }
    blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 20px;
      margin: 20px 0;
      color: #4b5563;
      background-color: #f3f4f6;
      padding: 15px 20px;
    }
    code {
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #1f2937;
    }
    pre {
      background-color: #1f2937;
      color: #f9fafb;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 15px;
    }
    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    table, th, td {
      border: 1px solid #e5e7eb;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
      text-align: left;
      padding: 12px;
    }
    td {
      padding: 12px;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .metadata {
      background-color: #f0f4f8;
      border: 1px solid #d0d7de;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    .metadata p {
      margin-bottom: 8px;
      font-size: 0.9em;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
    }
    @media print {
      body {
        padding: 20px;
      }
      .header {
        page-break-after: avoid;
      }
      h1, h2, h3, h4 {
        page-break-after: avoid;
      }
      table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Transcript Analysis Report</h1>
    <p><strong>Company:</strong> ${state.selectedCompany?.ticker || 'N/A'} - ${state.selectedCompany?.name || 'N/A'}</p>
    <p><strong>Analysis Type:</strong> ${state.selectedCompanyType?.name || 'N/A'}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>
  
  ${state.analysisMetadata ? `
  <div class="metadata">
    <p><strong>Analysis Details:</strong></p>
    <p>Provider: ${state.analysisMetadata.provider}</p>
    <p>Model: ${state.analysisMetadata.model}</p>
    ${state.analysisMetadata.usage ? `<p>Tokens Used: ${state.analysisMetadata.usage.totalTokens?.toLocaleString() || 'N/A'}</p>` : ''}
  </div>
  ` : ''}
  
  <div class="content">
    ${markdownHtml}
  </div>
  
  <div class="footer">
    <p>Generated by NEaR - Next Earnings Release Analysis Platform</p>
    <p>${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>`

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analysis-${state.selectedCompany?.ticker || 'report'}-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download HTML:', error)
    }
  }

  // Mobile-compatible Word export using simplified HTML
  const downloadAsWord = () => {
    if (!state.result) return

    try {
      // Convert markdown to HTML first
      const markdownHtml = convertMarkdownToHtml(state.result)
      
      // Create simplified HTML content for better mobile compatibility
      // Using .doc extension with HTML content for maximum compatibility
      const htmlContent = `
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<meta name=Originator content="Microsoft Word 15">
<style>
            @page {
              size: 8.5in 11.0in;
              margin: 1.0in 1.0in 1.0in 1.0in;
              mso-header-margin: .5in;
              mso-footer-margin: .5in;
              mso-paper-source: 0;
            }
            body { 
              font-family: 'Calibri', 'Arial', sans-serif; 
              font-size: 11pt;
              line-height: 1.6; 
              color: #333;
              mso-element: main-text;
            }
            h1 { 
              font-size: 20pt; 
              font-weight: bold;
              color: #1a5490;
              margin-top: 24pt;
              margin-bottom: 12pt;
              page-break-after: avoid;
              mso-outline-level: 1;
            }
            h2 { 
              font-size: 16pt; 
              font-weight: bold;
              color: #2e74b5;
              margin-top: 18pt;
              margin-bottom: 12pt;
              page-break-after: avoid;
              mso-outline-level: 2;
            }
            h3 { 
              font-size: 14pt; 
              font-weight: bold;
              color: #2e74b5;
              margin-top: 14pt;
              margin-bottom: 10pt;
              page-break-after: avoid;
              mso-outline-level: 3;
            }
            h4 { 
              font-size: 12pt; 
              font-weight: bold;
              color: #2e74b5;
              margin-top: 12pt;
              margin-bottom: 8pt;
              mso-outline-level: 4;
            }
            p { 
              margin-top: 0pt;
              margin-bottom: 10pt; 
              text-align: justify;
              text-justify: inter-word;
            }
            ul, ol { 
              margin-bottom: 10pt; 
              margin-left: 0.5in;
            }
            li { 
              margin-bottom: 6pt; 
              mso-special-format: bullet;
            }
            strong { 
              font-weight: bold;
              color: #2c3e50; 
            }
            em { 
              font-style: italic;
              color: #555; 
            }
            blockquote { 
              border-left: 3pt solid #3498db; 
              padding-left: 12pt; 
              margin-left: 0.25in;
              margin-right: 0.25in;
              margin-top: 12pt;
              margin-bottom: 12pt;
              font-style: italic;
              color: #555;
            }
            code { 
              font-family: 'Courier New', monospace;
              font-size: 10pt;
              background-color: #f5f5f5; 
              padding: 2pt 4pt; 
              border: 1pt solid #ddd;
            }
            pre {
              font-family: 'Courier New', monospace;
              font-size: 10pt;
              background-color: #f5f5f5;
              border: 1pt solid #ddd;
              padding: 12pt;
              margin: 12pt 0;
              white-space: pre-wrap;
              page-break-inside: avoid;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 12pt 0;
              page-break-inside: auto;
            }
            table, th, td {
              border: 1pt solid #ddd;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              padding: 8pt;
              text-align: left;
            }
            td {
              padding: 8pt;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .header { 
              text-align: center; 
              margin-bottom: 24pt; 
              border-bottom: 2pt solid #1a5490; 
              padding-bottom: 12pt;
            }
            .header h1 {
              font-size: 24pt;
              margin-bottom: 12pt;
            }
            .header p {
              text-align: center;
              margin-bottom: 6pt;
            }
            .metadata { 
              background-color: #f0f4f8; 
              border: 1pt solid #d0d7de;
              padding: 12pt; 
              margin-bottom: 24pt;
              page-break-inside: avoid;
            }
            .metadata p {
              margin-bottom: 6pt;
            }
            .content {
              margin-top: 24pt;
            }
            .footer {
              margin-top: 36pt;
              padding-top: 12pt;
              border-top: 1pt solid #ddd;
              text-align: center;
              font-size: 10pt;
              color: #666;
              page-break-before: avoid;
}
</style>
</head>
<body>
<div class="Section1">
  <h1 style="font-size:20pt;color:#1a5490;font-weight:bold">Transcript Analysis Report</h1>
  <p style="margin-bottom:12pt"><b>Company:</b> ${state.selectedCompany?.ticker || 'N/A'} - ${state.selectedCompany?.name || 'N/A'}</p>
  <p style="margin-bottom:12pt"><b>Analysis Type:</b> ${state.selectedCompanyType?.name || 'N/A'}</p>
  <p style="margin-bottom:24pt"><b>Generated:</b> ${new Date().toLocaleString()}</p>
  
  ${state.analysisMetadata ? `
  <div style="background-color:#f0f4f8;border:1pt solid #d0d7de;padding:12pt;margin-bottom:24pt">
    <p style="margin-bottom:6pt"><b>Analysis Details:</b></p>
    <p style="margin-bottom:6pt">Provider: ${state.analysisMetadata.provider}</p>
    <p style="margin-bottom:6pt">Model: ${state.analysisMetadata.model}</p>
    ${state.analysisMetadata.usage ? `<p>Tokens Used: ${state.analysisMetadata.usage.totalTokens?.toLocaleString() || 'N/A'}</p>` : ''}
  </div>
  ` : ''}
  
  <div style="margin-top:24pt">
    ${markdownHtml}
  </div>
  
  <div style="margin-top:36pt;padding-top:12pt;border-top:1pt solid #ddd;text-align:center">
    <p style="font-size:10pt;color:#666">Generated by NEaR - Next Earnings Release Analysis Platform</p>
    <p style="font-size:10pt;color:#666">${new Date().toLocaleDateString()}</p>
  </div>
</div>
</body>
</html>`

      // Create a Blob with the HTML content and save as .doc (not .docx) for better compatibility
      const blob = new Blob([htmlContent], { 
        type: 'application/msword' 
      })
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Use .doc extension for better mobile compatibility
      link.download = `analysis-${state.selectedCompany?.ticker || 'report'}-${new Date().toISOString().split('T')[0]}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download Word document:', error)
      // Fallback to HTML download if Word export fails
      downloadAsHtml()
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
                    Paste transcript text or upload a file
                  </p>
                </div>
                <div className="card-content space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                    <input
                      type="file"
                      id="transcript-upload"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={state.analyzing}
                    />
                    <label
                      htmlFor="transcript-upload"
                      className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors p-4"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload PDF, DOCX, or TXT file
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Max file size: 10MB
                      </span>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                        Or paste directly
                      </span>
                    </div>
                  </div>
                  
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
                      {state.selectedCompanyType && state.selectedCompany && state.selectedCompanyType.id === state.selectedCompany.primary_company_type_id && (
                        <span className="text-xs text-green-600 ml-2">(Auto-selected)</span>
                      )}
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
                          {state.selectedCompany && type.id === state.selectedCompany.primary_company_type_id ? ' (Primary)' : ''}
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

                  {/* Review Analysis Switch */}
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">
                      Review Analysis
                    </label>
                    <input
                      type="checkbox"
                      checked={state.reviewAnalysis}
                      onChange={(e) => dispatch({ type: 'SET_REVIEW_ANALYSIS', payload: e.target.checked })}
                      className="toggle"
                      disabled={state.analyzing}
                    />
                  </div>

                  {state.reviewAnalysis && (
                    <div className="space-y-4 border-t pt-4">
                      {/* Review Provider Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Review LLM Provider
                        </label>
                        <select
                          value={state.reviewProvider}
                          onChange={(e) => dispatch({ type: 'SET_REVIEW_PROVIDER', payload: e.target.value as any })}
                          className="select w-full"
                          disabled={state.analyzing}
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="google">Google</option>
                          <option value="cohere">Cohere</option>
                        </select>
                      </div>

                      {/* Review Model Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Review Model
                        </label>
                        <select
                          value={state.reviewModel}
                          onChange={(e) => dispatch({ type: 'SET_REVIEW_MODEL', payload: e.target.value })}
                          className="select w-full"
                          disabled={state.analyzing}
                        >
                          {PROVIDER_MODELS[state.reviewProvider].map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Default: {DEFAULT_MODELS[state.reviewProvider]}
                        </p>
                      </div>
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
            <div className="space-y-6">
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
                          className="btn-primary text-sm px-3 py-1 hidden lg:flex"
                          title="Download as Word document"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Word
                        </button>
                        <button
                          onClick={downloadAsHtml}
                          className="btn-secondary text-sm px-3 py-1"
                          title="Download as HTML document"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          HTML
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
                      {state.result && !state.feedbackSubmitted && (
                        <div className="flex items-center justify-end space-x-2 mt-4">
                          <p className="text-sm text-muted-foreground">Was this analysis helpful?</p>
                          <button
                            onClick={() => handleFeedback(1)}
                            className="btn-icon"
                            title="Good analysis"
                          >
                            <ThumbsUp className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(-1)}
                            className="btn-icon"
                            title="Bad analysis"
                          >
                            <ThumbsDown className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      {state.feedbackSubmitted && (
                        <p className="text-sm text-muted-foreground text-right mt-4">Thank you for your feedback!</p>
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

              {state.reviewAnalysis && state.reviewResult && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Review Analysis</h3>
                    {state.reviewAnalysisMetadata && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border">
                        <strong>Review Details:</strong> {state.reviewAnalysisMetadata.provider} • {state.reviewAnalysisMetadata.model}
                        {state.reviewAnalysisMetadata.usage?.totalTokens && (
                          <> • {state.reviewAnalysisMetadata.usage.totalTokens.toLocaleString()} tokens</>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="card-content">
                    <div className="max-w-none">
                      {state.viewMode === 'rendered' ? (
                        <div
                          className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:text-muted-foreground prose-code:text-primary prose-code:bg-muted"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(state.reviewResult) }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm bg-muted text-muted-foreground p-4 rounded-md border font-mono">
                          {state.reviewResult}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
