'use client'

import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Plus, Edit2, Trash2, Save, X, FileText, Settings, 
  ChevronDown, ChevronRight, Info, Copy, Check,
  Building2, Hash, Type, FileJson, List, BarChart,
  Grid3x3, Table
} from 'lucide-react'
import Link from 'next/link'
import TemplateLibrary from '@/components/templates/TemplateLibrary'
import { Template } from '@/types/template'

interface JsonFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  placeholder?: string
  helpText?: string
  icon?: React.ReactNode
  examples?: string[]
}

function JsonField({ label, value, onChange, placeholder, helpText, icon, examples }: JsonFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [jsonError, setJsonError] = useState('')
  const [showExamples, setShowExamples] = useState(false)

  const handleJsonChange = (text: string) => {
    try {
      if (!text.trim()) {
        onChange({})
        setJsonError('')
        return
      }
      const parsed = JSON.parse(text)
      onChange(parsed)
      setJsonError('')
    } catch (e) {
      setJsonError('Invalid JSON format')
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <label className="font-medium">{label}</label>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        {examples && (
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            Examples
          </button>
        )}
      </div>
      
      {helpText && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {showExamples && examples && (
        <div className="bg-muted/50 p-3 rounded text-xs space-y-1">
          <div className="font-medium mb-1">Examples:</div>
          {examples.map((ex, i) => (
            <div key={i} className="font-mono">{ex}</div>
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-2">
          <textarea
            className="w-full h-32 p-2 font-mono text-sm bg-background border border-input rounded"
            value={JSON.stringify(value || {}, null, 2)}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={placeholder}
          />
          {jsonError && (
            <p className="text-xs text-destructive">{jsonError}</p>
          )}
        </div>
      )}

      {!isExpanded && value && Object.keys(value).length > 0 && (
        <div className="bg-muted/50 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
          {JSON.stringify(value, null, 2).substring(0, 200)}...
        </div>
      )}
    </div>
  )
}

function PromptVariableHelper() {
  const variables = [
    { name: '{role}', desc: 'Analyst role/expertise level' },
    { name: '{company_name}', desc: 'Name of the company being analyzed' },
    { name: '{company_ticker}', desc: 'Stock ticker symbol' },
    { name: '{company_type}', desc: 'Industry/sector classification' },
    { name: '{analysis_date}', desc: 'Current date of analysis' },
    { name: '{quarter}', desc: 'Fiscal quarter being analyzed' },
    { name: '{year}', desc: 'Fiscal year' }
  ]

  const [copied, setCopied] = useState<string | null>(null)

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(varName)
    setCopied(varName)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-muted/50 p-3 rounded space-y-2">
      <div className="text-sm font-medium flex items-center gap-2">
        <Info className="w-4 h-4" />
        Available Template Variables
      </div>
      <div className="grid grid-cols-2 gap-2">
        {variables.map((v) => (
          <div key={v.name} className="flex items-center justify-between text-xs">
            <div>
              <code className="bg-background px-1 rounded">{v.name}</code>
              <span className="text-muted-foreground ml-2">{v.desc}</span>
            </div>
            <button
              type="button"
              onClick={() => copyVariable(v.name)}
              className="p-1 hover:bg-background rounded"
            >
              {copied === v.name ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EnhancedTemplatesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTemplate, setNewTemplate] = useState<Partial<Template> | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'prompt' | 'classification' | 'metrics' | 'output' | 'llm'>('prompt')
  const [viewMode, setViewMode] = useState<'library' | 'table'>('library')

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (!isAdmin(profile)) {
      router.push('/dashboard')
      return
    }
    loadTemplates()
  }, [user, profile, loading, router])

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const { data, error } = await supabase
        .from('company_types')
        .select('*')
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (err: any) {
      console.error('Error loading templates:', err)
      setError('Failed to load templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSave = async (template: Partial<Template>) => {
    try {
      setError('')
      setSuccess('')

      if (!template.name || !template.system_prompt_template) {
        setError('Name and system prompt are required')
        return
      }

      const dataToSave = {
        name: template.name,
        description: template.description,
        system_prompt_template: template.system_prompt_template,
        classification_rules: template.classification_rules || {},
        key_metrics: template.key_metrics || {},
        output_format: template.output_format || {},
        validation_rules: template.validation_rules || [],
        special_considerations: template.special_considerations || {},
        llm_settings: template.llm_settings || {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 3000,
          frequency_penalty: 0.3,
          presence_penalty: 0.2
        },
        is_active: template.is_active !== false,
        updated_at: new Date().toISOString()
      }

      if (template.id) {
        // Update existing
        const { error } = await supabase
          .from('company_types')
          .update(dataToSave)
          .eq('id', template.id)

        if (error) throw error
        setSuccess('Template updated successfully')
      } else {
        // Create new
        const { error } = await supabase
          .from('company_types')
          .insert({
            id: template.name?.toLowerCase().replace(/\s+/g, '_'),
            ...dataToSave
          })

        if (error) throw error
        setSuccess('Template created successfully')
      }

      setEditingId(null)
      setNewTemplate(null)
      await loadTemplates()
    } catch (err: any) {
      console.error('Error saving template:', err)
      setError(err.message || 'Failed to save template')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return

    try {
      setError('')
      const { error } = await supabase
        .from('company_types')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSuccess('Template deleted successfully')
      await loadTemplates()
    } catch (err: any) {
      console.error('Error deleting template:', err)
      setError(err.message || 'Failed to delete template')
    }
  }

  const handleNewTemplate = () => {
    setNewTemplate({
      name: '',
      description: '',
      system_prompt_template: `Role: {role}

CRITICAL INSTRUCTION: You MUST structure your response EXACTLY as shown below, using markdown tables.
Each section and table is REQUIRED - if data is not available, write "No data available" but maintain the structure.

MANDATORY FORMAT:

# Quarterly Results Highlights
- [Metric 1]: [Value] ([YoY change])
- [Metric 2]: [Value] ([YoY change])

## Key Performance Metrics
| Metric | Q[X] [Year] | Q[X-1] [Year] | YoY Change |
|--------|-------------|---------------|------------|
| [Add rows] | | | |

## Management Commentary Summary
[Structured summary of key management points]

## Outlook & Guidance
[Forward-looking statements and guidance]`,
      classification_rules: {
        primary_topics: [],
        temporal_tags: ['previous quarter', 'next quarter', 'full year', 'year-to-date']
      },
      key_metrics: {
        financial_metrics: [],
        operating_performance: [],
        segment_performance: []
      },
      output_format: {
        quarterly_highlights: [],
        qa_analysis_topics: []
      },
      validation_rules: [],
      special_considerations: {},
      is_active: true
    })
    setEditingId(null)
    setActiveTab('prompt')
  }

  const renderTemplateEditor = (template: Partial<Template>) => {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {template.id ? `Edit: ${template.name}` : 'New Template'}
          </h2>
        </div>
        <div className="card-content space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                <Type className="inline w-4 h-4 mr-1" />
                Template Name *
              </label>
              <input
                type="text"
                className="input w-full"
                value={template.name || ''}
                onChange={(e) => {
                  if (newTemplate) {
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  } else {
                    const updated = templates.map(t =>
                      t.id === template.id ? { ...t, name: e.target.value } : t
                    )
                    setTemplates(updated)
                  }
                }}
                placeholder="e.g., Technology Company Analysis"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                <Hash className="inline w-4 h-4 mr-1" />
                Template ID
              </label>
              <input
                type="text"
                className="input w-full opacity-50"
                value={template.id || 'auto-generated'}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated from template name
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <FileText className="inline w-4 h-4 mr-1" />
              Description
            </label>
            <input
              type="text"
              className="input w-full"
              value={template.description || ''}
              onChange={(e) => {
                if (newTemplate) {
                  setNewTemplate({ ...newTemplate, description: e.target.value })
                } else {
                  const updated = templates.map(t =>
                    t.id === template.id ? { ...t, description: e.target.value } : t
                  )
                  setTemplates(updated)
                }
              }}
              placeholder="Brief description of this template's purpose"
            />
          </div>

          {/* Tabs for different sections */}
          <div className="border-b border-border">
            <div className="flex gap-4">
              {[
                { id: 'prompt', label: 'System Prompt', icon: <FileText className="w-4 h-4" /> },
                { id: 'classification', label: 'Classification', icon: <List className="w-4 h-4" /> },
                { id: 'metrics', label: 'Key Metrics', icon: <BarChart className="w-4 h-4" /> },
                { id: 'output', label: 'Output Format', icon: <FileJson className="w-4 h-4" /> },
                { id: 'llm', label: 'LLM Settings', icon: <Settings className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2 px-1 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-primary text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'prompt' && (
              <div className="space-y-4">
                <PromptVariableHelper />
                <div>
                  <label className="block text-sm font-medium mb-1">
                    System Prompt Template *
                  </label>
                  <textarea
                    className="textarea w-full h-96 font-mono text-sm"
                    value={template.system_prompt_template || ''}
                    onChange={(e) => {
                      if (newTemplate) {
                        setNewTemplate({ ...newTemplate, system_prompt_template: e.target.value })
                      } else {
                        const updated = templates.map(t =>
                          t.id === template.id ? { ...t, system_prompt_template: e.target.value } : t
                        )
                        setTemplates(updated)
                      }
                    }}
                    placeholder="Enter the system prompt template with variables..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This prompt will be sent to the LLM with variables replaced by actual values
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'classification' && (
              <div className="space-y-4">
                <JsonField
                  label="Classification Rules"
                  value={template.classification_rules}
                  onChange={(value) => {
                    if (newTemplate) {
                      setNewTemplate({ ...newTemplate, classification_rules: value })
                    } else {
                      const updated = templates.map(t =>
                        t.id === template.id ? { ...t, classification_rules: value } : t
                      )
                      setTemplates(updated)
                    }
                  }}
                  helpText="Define topics and tags for categorizing analysis sections"
                  icon={<List className="w-4 h-4" />}
                  examples={[
                    '{"primary_topics": ["Revenue", "Margins", "Guidance"]}',
                    '{"temporal_tags": ["Q1", "Q2", "Full Year"]}'
                  ]}
                  placeholder={JSON.stringify({
                    primary_topics: ['Topic 1', 'Topic 2'],
                    temporal_tags: ['Q1', 'Q2', 'Full Year']
                  }, null, 2)}
                />

                <JsonField
                  label="Special Considerations"
                  value={template.special_considerations}
                  onChange={(value) => {
                    if (newTemplate) {
                      setNewTemplate({ ...newTemplate, special_considerations: value })
                    } else {
                      const updated = templates.map(t =>
                        t.id === template.id ? { ...t, special_considerations: value } : t
                      )
                      setTemplates(updated)
                    }
                  }}
                  helpText="Industry-specific rules or special handling instructions"
                  icon={<Info className="w-4 h-4" />}
                  examples={[
                    '{"focus_areas": ["ESG metrics", "Digital transformation"]}',
                    '{"exclude": ["Non-GAAP adjustments"]}'
                  ]}
                />
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <JsonField
                  label="Key Metrics Configuration"
                  value={template.key_metrics}
                  onChange={(value) => {
                    if (newTemplate) {
                      setNewTemplate({ ...newTemplate, key_metrics: value })
                    } else {
                      const updated = templates.map(t =>
                        t.id === template.id ? { ...t, key_metrics: value } : t
                      )
                      setTemplates(updated)
                    }
                  }}
                  helpText="Define the key metrics to extract and analyze from transcripts"
                  icon={<BarChart className="w-4 h-4" />}
                  examples={[
                    '{"financial_metrics": ["Revenue", "EBITDA", "EPS"]}',
                    '{"operating_performance": ["Units Sold", "Market Share", "Customer Count"]}'
                  ]}
                  placeholder={JSON.stringify({
                    financial_metrics: ['Revenue', 'EBITDA', 'EPS'],
                    operating_performance: ['Metric 1', 'Metric 2'],
                    segment_performance: ['Segment A', 'Segment B']
                  }, null, 2)}
                />

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Validation Rules
                  </label>
                  <textarea
                    className="textarea w-full h-24 font-mono text-sm"
                    value={(template.validation_rules || []).join('\n')}
                    onChange={(e) => {
                      const rules = e.target.value.split('\n').filter(r => r.trim())
                      if (newTemplate) {
                        setNewTemplate({ ...newTemplate, validation_rules: rules })
                      } else {
                        const updated = templates.map(t =>
                          t.id === template.id ? { ...t, validation_rules: rules } : t
                        )
                        setTemplates(updated)
                      }
                    }}
                    placeholder="One validation rule per line..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter validation rules to ensure data quality (one per line)
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'llm' && (
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    LLM Configuration Settings
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These settings control how the AI model generates responses. Hover over each setting for more information.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Temperature
                      <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Controls randomness: 0 = deterministic, 1 = creative. For financial analysis, 0.3-0.5 is recommended for balance between accuracy and insight.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={template.llm_settings?.temperature || 0.3}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        const settings = { ...(template.llm_settings || {}), temperature: value }
                        if (newTemplate) {
                          setNewTemplate({ ...newTemplate, llm_settings: settings })
                        } else {
                          const updated = templates.map(t =>
                            t.id === template.id ? { ...t, llm_settings: settings } : t
                          )
                          setTemplates(updated)
                        }
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Precise (0)</span>
                      <span className="font-mono">{template.llm_settings?.temperature || 0.3}</span>
                      <span>Creative (1)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Top P (Nucleus Sampling)
                      <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Limits token selection to top probability mass. 0.9 means consider tokens that make up 90% probability. Lower values = more focused, higher = more diverse.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={template.llm_settings?.top_p || 0.9}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        const settings = { ...(template.llm_settings || {}), top_p: value }
                        if (newTemplate) {
                          setNewTemplate({ ...newTemplate, llm_settings: settings })
                        } else {
                          const updated = templates.map(t =>
                            t.id === template.id ? { ...t, llm_settings: settings } : t
                          )
                          setTemplates(updated)
                        }
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Focused (0.1)</span>
                      <span className="font-mono">{template.llm_settings?.top_p || 0.9}</span>
                      <span>Diverse (1)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Tokens
                      <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Maximum length of the response. For detailed analysis, 2000-4000 is typical. Higher values allow more comprehensive responses.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      type="number"
                      min="500"
                      max="8000"
                      step="500"
                      value={template.llm_settings?.max_tokens || 3000}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        const settings = { ...(template.llm_settings || {}), max_tokens: value }
                        if (newTemplate) {
                          setNewTemplate({ ...newTemplate, llm_settings: settings })
                        } else {
                          const updated = templates.map(t =>
                            t.id === template.id ? { ...t, llm_settings: settings } : t
                          )
                          setTemplates(updated)
                        }
                      }}
                      className="input w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Approximate word count: {Math.round((template.llm_settings?.max_tokens || 3000) * 0.75)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Frequency Penalty
                      <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Reduces repetition of words. 0 = no penalty, 2 = strong penalty. For analysis, 0.3-0.5 helps avoid redundancy.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={template.llm_settings?.frequency_penalty || 0.3}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        const settings = { ...(template.llm_settings || {}), frequency_penalty: value }
                        if (newTemplate) {
                          setNewTemplate({ ...newTemplate, llm_settings: settings })
                        } else {
                          const updated = templates.map(t =>
                            t.id === template.id ? { ...t, llm_settings: settings } : t
                          )
                          setTemplates(updated)
                        }
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>No penalty (0)</span>
                      <span className="font-mono">{template.llm_settings?.frequency_penalty || 0.3}</span>
                      <span>Strong (2)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Presence Penalty
                      <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Encourages new topics. 0 = no penalty, 2 = strong encouragement. For comprehensive analysis, 0.2-0.4 helps cover all topics.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={template.llm_settings?.presence_penalty || 0.2}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        const settings = { ...(template.llm_settings || {}), presence_penalty: value }
                        if (newTemplate) {
                          setNewTemplate({ ...newTemplate, llm_settings: settings })
                        } else {
                          const updated = templates.map(t =>
                            t.id === template.id ? { ...t, llm_settings: settings } : t
                          )
                          setTemplates(updated)
                        }
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>No penalty (0)</span>
                      <span className="font-mono">{template.llm_settings?.presence_penalty || 0.2}</span>
                      <span>Strong (2)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded">
                  <div className="text-sm font-medium mb-2">Recommended Settings for Financial Analysis:</div>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Temperature:</strong> 0.3-0.5 for factual accuracy with some insight</li>
                    <li>• <strong>Top P:</strong> 0.8-0.9 for balanced token selection</li>
                    <li>• <strong>Max Tokens:</strong> 3000-4000 for comprehensive analysis</li>
                    <li>• <strong>Frequency Penalty:</strong> 0.3-0.5 to avoid repetition</li>
                    <li>• <strong>Presence Penalty:</strong> 0.2-0.4 to ensure topic coverage</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'output' && (
              <div className="space-y-4">
                <JsonField
                  label="Output Format Configuration"
                  value={template.output_format}
                  onChange={(value) => {
                    if (newTemplate) {
                      setNewTemplate({ ...newTemplate, output_format: value })
                    } else {
                      const updated = templates.map(t =>
                        t.id === template.id ? { ...t, output_format: value } : t
                      )
                      setTemplates(updated)
                    }
                  }}
                  helpText="Define how the analysis results should be structured and formatted"
                  icon={<FileJson className="w-4 h-4" />}
                  examples={[
                    '{"quarterly_highlights": ["Revenue", "EPS", "Guidance"]}',
                    '{"sections": ["Executive Summary", "Financial Analysis", "Outlook"]}'
                  ]}
                  placeholder={JSON.stringify({
                    quarterly_highlights: ['Metric 1', 'Metric 2'],
                    qa_analysis_topics: ['Topic 1', 'Topic 2'],
                    tables: ['Performance Metrics', 'Segment Analysis']
                  }, null, 2)}
                />

                <div className="bg-muted/50 p-4 rounded space-y-2">
                  <div className="text-sm font-medium">Output Preview</div>
                  <div className="text-xs text-muted-foreground">
                    This template will generate analysis with:
                  </div>
                  <ul className="text-xs space-y-1 ml-4">
                    {template.output_format?.quarterly_highlights && (
                      <li>• Quarterly highlights: {template.output_format.quarterly_highlights.length} metrics</li>
                    )}
                    {template.output_format?.qa_analysis_topics && (
                      <li>• Q&A topics: {template.output_format.qa_analysis_topics.length} topics</li>
                    )}
                    {template.key_metrics?.financial_metrics && (
                      <li>• Financial metrics: {template.key_metrics.financial_metrics.length} metrics</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`active-${template.id || 'new'}`}
                checked={template.is_active !== false}
                onChange={(e) => {
                  if (newTemplate) {
                    setNewTemplate({ ...newTemplate, is_active: e.target.checked })
                  } else {
                    const updated = templates.map(t =>
                      t.id === template.id ? { ...t, is_active: e.target.checked } : t
                    )
                    setTemplates(updated)
                  }
                }}
              />
              <label htmlFor={`active-${template.id || 'new'}`} className="text-sm">
                Template is active
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(template)}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {template.id ? 'Save Changes' : 'Create Template'}
              </button>
              <button
                onClick={() => {
                  setEditingId(null)
                  setNewTemplate(null)
                  setError('')
                }}
                className="btn-outline flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading || loadingTemplates) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Analysis Templates
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            {!newTemplate && !editingId && (
              <div className="flex rounded-lg border border-border">
                <button
                  onClick={() => setViewMode('library')}
                  className={`px-3 py-1.5 flex items-center gap-1.5 text-sm ${
                    viewMode === 'library' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  Library
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 flex items-center gap-1.5 text-sm ${
                    viewMode === 'table' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Table
                </button>
              </div>
            )}
            {!newTemplate && !editingId && viewMode === 'table' && (
              <button
                onClick={handleNewTemplate}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Template
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded mb-4">
            {success}
          </div>
        )}

        {/* Editor */}
        {(newTemplate || editingId) && (
          renderTemplateEditor(newTemplate || templates.find(t => t.id === editingId)!)
        )}

        {/* Templates List */}
        {!newTemplate && !editingId && viewMode === 'library' && (
          <TemplateLibrary
            templates={templates}
            onSelectTemplate={(template) => setEditingId(template.id)}
            onEditTemplate={(template) => setEditingId(template.id)}
            onDeleteTemplate={handleDelete}
            onCreateTemplate={handleNewTemplate}
            isAdmin={true}
          />
        )}
        
        {/* Table View */}
        {!newTemplate && !editingId && viewMode === 'table' && (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div key={template.id} className="card hover:shadow-lg transition-shadow">
                <div className="card-content">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {template.name}
                        {!template.is_active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </h3>
                      {template.description && (
                        <p className="text-muted-foreground mt-1">{template.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Topics</div>
                          <div className="text-sm font-medium">
                            {template.classification_rules?.primary_topics?.length || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Metrics</div>
                          <div className="text-sm font-medium">
                            {(template.key_metrics?.financial_metrics?.length || 0) + 
                             (template.key_metrics?.operating_performance?.length || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Output Sections</div>
                          <div className="text-sm font-medium">
                            {Object.keys(template.output_format || {}).length}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Updated</div>
                          <div className="text-sm font-medium">
                            {new Date(template.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-muted-foreground mb-1">Prompt Preview:</div>
                        <div className="bg-muted/50 p-3 rounded text-xs font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                          {template.system_prompt_template.substring(0, 200)}...
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditingId(template.id)}
                        className="btn-ghost p-2"
                        title="Edit template"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="btn-ghost p-2 text-destructive"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="card">
                <div className="card-content text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No templates found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first template to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}