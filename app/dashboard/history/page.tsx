'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  FileText, 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Trash2,
  Search,
  Filter,
  Calendar,
  Building,
  Bot
} from 'lucide-react'
import Link from 'next/link'

interface Analysis {
  id: string
  created_at: string
  provider: string
  model: string
  review_provider?: string
  review_model?: string
  feedback: number | null
  company: {
    id: string
    ticker: string
    name: string
  }
  company_type: {
    id: string
    name: string
  } | null
  transcript_length: number
  analysis_length: number
  review_length: number
  transcript_preview: string
  has_review: boolean
}

interface HistoryResponse {
  analyses: Analysis[]
  nextCursor: string | null
  hasMore: boolean
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    fetchAnalyses()
  }, [user, loading, router])

  const fetchAnalyses = async (cursor?: string, reset = true) => {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return

      const params = new URLSearchParams({
        limit: '20'
      })
      
      if (cursor) params.set('cursor', cursor)
      if (searchTerm) params.set('search', searchTerm)
      if (providerFilter) params.set('provider', providerFilter)
      if (companyFilter) params.set('company_id', companyFilter)
      if (dateFilter) params.set('date_from', dateFilter)

      const response = await fetch(`/api/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch analyses')

      const result: HistoryResponse = await response.json()
      
      if (reset) {
        setAnalyses(result.analyses)
      } else {
        setAnalyses(prev => [...prev, ...result.analyses])
      }
      
      setNextCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error fetching analyses:', error)
    } finally {
      setLoadingAnalyses(false)
    }
  }

  const handleSearch = () => {
    setLoadingAnalyses(true)
    fetchAnalyses(undefined, true)
  }

  const handleViewAnalysis = async (analysisId: string) => {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return

      const response = await fetch(`/api/history/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch analysis details')

      const result = await response.json()
      setSelectedAnalysis(result.analysis)
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching analysis details:', error)
    }
  }

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return

    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return

      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: analysisId })
      })

      if (!response.ok) throw new Error('Failed to delete analysis')

      // Remove from local state
      setAnalyses(prev => prev.filter(a => a.id !== analysisId))
    } catch (error) {
      console.error('Error deleting analysis:', error)
    }
  }

  const loadMore = () => {
    if (nextCursor && hasMore) {
      fetchAnalyses(nextCursor, false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const FeedbackIndicator = ({ feedback }: { feedback: number | null }) => {
    if (feedback === 1) return <ThumbsUp className="h-4 w-4 text-green-500" />
    if (feedback === -1) return <ThumbsDown className="h-4 w-4 text-red-500" />
    return <span className="text-muted-foreground text-xs">No feedback</span>
  }

  if (loading || loadingAnalyses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className="btn-icon"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Analysis History</h1>
            <p className="text-muted-foreground">View and manage your past transcript analyses</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transcripts..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="select"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="cohere">Cohere</option>
            </select>
            <input
              type="date"
              className="input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <button 
              onClick={handleSearch}
              className="btn-primary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Analysis List */}
      <div className="space-y-4">
        {analyses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" />
            <p>No analyses found. Start by analyzing a transcript!</p>
            <Link href="/dashboard/analyze" className="btn-primary mt-4">
              Analyze Transcript
            </Link>
          </div>
        ) : (
          analyses.map((analysis) => (
            <div key={analysis.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-content">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{analysis.company.ticker}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-sm text-muted-foreground">{analysis.company.name}</span>
                      </div>
                      {analysis.company_type && (
                        <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                          {analysis.company_type.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(analysis.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bot className="h-3 w-3" />
                        <span>{analysis.provider} ({analysis.model})</span>
                      </div>
                      <div>
                        <FeedbackIndicator feedback={analysis.feedback} />
                      </div>
                      {analysis.has_review && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          Reviewed
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {analysis.transcript_preview}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Transcript: {(analysis.transcript_length / 1000).toFixed(1)}k chars</span>
                      <span>Analysis: {(analysis.analysis_length / 1000).toFixed(1)}k chars</span>
                      {analysis.review_length > 0 && (
                        <span>Review: {(analysis.review_length / 1000).toFixed(1)}k chars</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewAnalysis(analysis.id)}
                      className="btn-ghost"
                      title="View Analysis"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAnalysis(analysis.id)}
                      className="btn-ghost text-red-600 hover:text-red-700"
                      title="Delete Analysis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-6">
          <button 
            onClick={loadMore}
            className="btn-primary"
          >
            Load More
          </button>
        </div>
      )}

      {/* Analysis Details Modal */}
      {showModal && selectedAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Analysis Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-ghost"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Company Information</h3>
                  <p>{selectedAnalysis.company.ticker} - {selectedAnalysis.company.name}</p>
                  {selectedAnalysis.company_type && (
                    <p className="text-sm text-muted-foreground">{selectedAnalysis.company_type.name}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Original Transcript</h3>
                  <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{selectedAnalysis.transcript}</pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Analysis Result</h3>
                  <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{selectedAnalysis.analysis_result}</pre>
                  </div>
                </div>
                
                {selectedAnalysis.review_result && (
                  <div>
                    <h3 className="font-semibold mb-2">Review Result</h3>
                    <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">{selectedAnalysis.review_result}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}