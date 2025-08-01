# System Prompt Management Technical Specification

## Overview

This document provides a comprehensive technical specification for implementing an advanced system prompt and placeholder management system for the NextER (Next Earnings Release) platform. The current system uses simple textarea-based editing for complex system prompts with no dedicated UI for managing JSON-based placeholder configurations.

## Current State Analysis

### Existing Architecture

**Tech Stack:**
- **Framework**: Next.js 15 App Router with TypeScript
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **UI Framework**: Tailwind CSS with custom theme (CRT-inspired dark theme)
- **Authentication**: Supabase Auth with JWT-based sessions
- **Deployment**: Vercel with production domain at lanoitcif.com

**Current Database Schema:**
```sql
-- Existing company_types table
CREATE TABLE company_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt_template TEXT NOT NULL,
  classification_rules JSONB,
  key_metrics JSONB,
  output_format JSONB,
  validation_rules TEXT[],
  special_considerations JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Template Processing (analyze/route.ts:184-198):**
```typescript
// Build the system prompt from the template
let systemPrompt = companyType.system_prompt_template || `You are a financial analyst...`

// Only apply template replacements if the template contains placeholders
if (systemPrompt.includes('{')) {
  systemPrompt = systemPrompt
    .replace('{role}', `You are a financial analyst specializing in ${companyType.name} companies.`)
    .replace('{classification_rules}', JSON.stringify(companyType.classification_rules || {}))
    .replace('{temporal_tags}', JSON.stringify(companyType.classification_rules?.temporal_tags || []))
    .replace('{operating_metrics}', JSON.stringify(companyType.key_metrics?.operating_performance || []))
    .replace('{segment_metrics}', JSON.stringify(companyType.key_metrics?.segment_performance || []))
    .replace('{financial_metrics}', JSON.stringify(companyType.key_metrics?.financial_metrics || []))
    .replace('{validation_rules}', (companyType.validation_rules || []).join(', '))
    .replace('{special_considerations}', JSON.stringify(companyType.special_considerations || {}))
}
```

**Current Issues:**
1. **Poor UX**: Large textarea for editing entire system prompt templates
2. **No Placeholder Management**: No UI for managing complex JSONB structures
3. **Company-Centric Workflow**: Must select company first, then see available analyst types
4. **No Template Reusability**: No inheritance or template sharing system
5. **Limited Scalability**: Hard to maintain as system grows

## Proposed Architecture

### Enhanced Database Schema

```sql
-- Enhanced template system with inheritance
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('global', 'industry', 'custom')),
  parent_template_id UUID REFERENCES prompt_templates(id),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Centralized placeholder definitions
CREATE TABLE placeholder_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placeholder_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  data_type TEXT CHECK (data_type IN ('text', 'jsonb', 'array')),
  schema_definition JSONB,
  default_value JSONB,
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flexible placeholder value assignments
CREATE TABLE template_placeholder_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES prompt_templates(id),
  placeholder_id UUID REFERENCES placeholder_definitions(id),
  value_data JSONB NOT NULL,
  override_level TEXT CHECK (override_level IN ('global', 'industry', 'company')),
  target_id TEXT, -- industry/company identifier
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template assignments to companies
CREATE TABLE template_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES prompt_templates(id),
  company_id UUID REFERENCES companies(id),
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industry categorization for better organization
CREATE TABLE industries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_industry_id TEXT REFERENCES industries(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link companies to industries
ALTER TABLE companies ADD COLUMN industry_id TEXT REFERENCES industries(id);

-- Template usage analytics
CREATE TABLE template_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES prompt_templates(id),
  company_id UUID REFERENCES companies(id),
  analysis_id UUID, -- Link to analysis_transcripts.id
  performance_score DECIMAL,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_template_placeholder_values_template_id ON template_placeholder_values(template_id);
CREATE INDEX idx_template_placeholder_values_placeholder_id ON template_placeholder_values(placeholder_id);
CREATE INDEX idx_template_assignments_company_id ON template_assignments(company_id);
CREATE INDEX idx_template_assignments_template_id ON template_assignments(template_id);
CREATE INDEX idx_template_usage_analytics_template_id ON template_usage_analytics(template_id);
```

### Enhanced TypeScript Interfaces

```typescript
// Enhanced interfaces for new system
export interface PromptTemplate {
  id: string
  name: string
  description: string
  template_content: string
  template_type: 'global' | 'industry' | 'custom'
  parent_template_id?: string
  version: number
  is_active: boolean
  placeholder_values: PlaceholderValue[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface PlaceholderDefinition {
  id: string
  placeholder_key: string
  name: string
  description: string
  data_type: 'text' | 'jsonb' | 'array'
  schema_definition: JSONSchema7
  default_value: any
  is_required: boolean
  created_at: string
}

export interface PlaceholderValue {
  id: string
  template_id: string
  placeholder_id: string
  value_data: any
  override_level: 'global' | 'industry' | 'company'
  target_id?: string
  created_at: string
}

export interface TemplateAssignment {
  id: string
  template_id: string
  company_id: string
  is_primary: boolean
  assigned_by: string
  created_at: string
}

export interface Industry {
  id: string
  name: string
  description: string
  parent_industry_id?: string
  created_at: string
}

// Classification rules schema
export interface ClassificationRules {
  primary_topics: string[]
  temporal_tags: string[]
  secondary_topics?: string[]
}

export interface KeyMetrics {
  operating_performance: string[]
  segment_performance: string[]
  financial_metrics: string[]
}

export interface SpecialConsiderations {
  mixed_topics?: string
  forward_looking?: string
  analyst_tracking?: string
  [key: string]: any
}

// Template rendering context
export interface TemplateRenderContext {
  role?: string
  industry?: string
  company_name?: string
  classification_rules?: ClassificationRules
  temporal_tags?: string[]
  operating_metrics?: string[]
  segment_metrics?: string[]
  financial_metrics?: string[]
  validation_rules?: string[]
  special_considerations?: SpecialConsiderations
}
```

## API Specifications

### Template Management API

```typescript
// /app/api/admin/templates/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const template_type = searchParams.get('template_type')
  const industry_id = searchParams.get('industry_id')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Implement RLS-compliant query with proper filters
  const { data, error } = await supabase
    .from('prompt_templates')
    .select(`
      *,
      placeholder_values:template_placeholder_values(
        *,
        placeholder:placeholder_definitions(*)
      ),
      parent_template:prompt_templates!parent_template_id(name),
      assignments:template_assignments(
        company:companies(name, ticker)
      )
    `)
    .eq('is_active', true)
    .eq(template_type ? 'template_type' : '', template_type)
    .range(offset, offset + limit - 1)
    .order('updated_at', { ascending: false })

  return NextResponse.json({ data, error })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = templateCreateSchema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 })
  }

  const { name, description, template_content, template_type, parent_template_id, placeholder_values } = validation.data

  try {
    // Begin transaction
    const { data: template, error: templateError } = await supabase
      .from('prompt_templates')
      .insert({
        name,
        description,
        template_content,
        template_type,
        parent_template_id,
        created_by: user.id
      })
      .select()
      .single()

    if (templateError) throw templateError

    // Insert placeholder values if provided
    if (placeholder_values?.length > 0) {
      const placeholderInserts = placeholder_values.map(pv => ({
        template_id: template.id,
        placeholder_id: pv.placeholder_id,
        value_data: pv.value_data,
        override_level: pv.override_level,
        target_id: pv.target_id
      }))

      const { error: placeholderError } = await supabase
        .from('template_placeholder_values')
        .insert(placeholderInserts)

      if (placeholderError) throw placeholderError
    }

    return NextResponse.json({ data: template })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Placeholder Management API

```typescript
// /app/api/admin/placeholders/route.ts
export async function GET(request: NextRequest) {
  const { data, error } = await supabase
    .from('placeholder_definitions')
    .select('*')
    .order('name')

  return NextResponse.json({ data, error })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = placeholderDefinitionSchema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('placeholder_definitions')
    .insert(validation.data)
    .select()
    .single()

  return NextResponse.json({ data, error })
}

// /app/api/admin/placeholders/[id]/values/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('template_placeholder_values')
    .select(`
      *,
      template:prompt_templates(name),
      placeholder:placeholder_definitions(*)
    `)
    .eq('placeholder_id', params.id)
    .order('override_level')

  return NextResponse.json({ data, error })
}
```

### Template Rendering Service

```typescript
// /lib/services/templateRenderer.ts
export class TemplateRenderer {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async renderTemplate(
    templateId: string,
    context: TemplateRenderContext
  ): Promise<{ rendered: string; error?: string }> {
    try {
      // Get template with all placeholder values
      const { data: template, error } = await this.supabase
        .from('prompt_templates')
        .select(`
          *,
          placeholder_values:template_placeholder_values(
            *,
            placeholder:placeholder_definitions(*)
          )
        `)
        .eq('id', templateId)
        .single()

      if (error) throw error

      // Resolve inheritance chain if parent template exists
      let finalTemplate = template.template_content
      if (template.parent_template_id) {
        const parentContent = await this.resolveParentTemplate(template.parent_template_id)
        finalTemplate = await this.mergeTemplates(parentContent, finalTemplate)
      }

      // Build placeholder values map with proper precedence
      const placeholderMap = await this.buildPlaceholderMap(
        template.placeholder_values,
        context
      )

      // Render template with placeholders
      const rendered = await this.processPlaceholders(finalTemplate, placeholderMap)

      return { rendered }
    } catch (error) {
      return { rendered: '', error: error.message }
    }
  }

  private async resolveParentTemplate(parentId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('prompt_templates')
      .select('template_content, parent_template_id')
      .eq('id', parentId)
      .single()

    if (error) throw error

    if (data.parent_template_id) {
      const parentContent = await this.resolveParentTemplate(data.parent_template_id)
      return await this.mergeTemplates(parentContent, data.template_content)
    }

    return data.template_content
  }

  private async buildPlaceholderMap(
    placeholderValues: any[],
    context: TemplateRenderContext
  ): Promise<Map<string, any>> {
    const map = new Map<string, any>()

    // Set default values from context
    Object.entries(context).forEach(([key, value]) => {
      map.set(key, value)
    })

    // Override with template-specific values (respecting precedence)
    const sortedValues = placeholderValues.sort((a, b) => {
      const precedence = { global: 0, industry: 1, company: 2 }
      return precedence[a.override_level] - precedence[b.override_level]
    })

    sortedValues.forEach(pv => {
      const key = pv.placeholder.placeholder_key
      let value = pv.value_data

      // Handle different data types
      switch (pv.placeholder.data_type) {
        case 'array':
          value = Array.isArray(value) ? value.join(', ') : value
          break
        case 'jsonb':
          value = JSON.stringify(value)
          break
        default:
          value = String(value)
      }

      map.set(key, value)
    })

    return map
  }

  private async processPlaceholders(
    template: string,
    placeholderMap: Map<string, any>
  ): Promise<string> {
    let processed = template

    // Replace all placeholders using regex
    const placeholderRegex = /\{([^}]+)\}/g
    processed = processed.replace(placeholderRegex, (match, key) => {
      return placeholderMap.get(key) || match
    })

    return processed
  }

  private async mergeTemplates(parent: string, child: string): Promise<string> {
    // Simple merge strategy - can be enhanced for more complex inheritance
    if (child.includes('{{EXTEND}}')) {
      return child.replace('{{EXTEND}}', parent)
    }
    
    // If no explicit extend marker, child overrides parent
    return child
  }
}
```

## UI Component Architecture

### Template Library Interface

```typescript
// /app/dashboard/admin/templates/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { TemplateCard } from './components/TemplateCard'
import { TemplateFilters } from './components/TemplateFilters'
import { TemplateBuilder } from './components/TemplateBuilder'

interface TemplateLibraryProps {}

export default function TemplateLibrary({}: TemplateLibraryProps) {
  const { user, profile } = useAuth()
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [filters, setFilters] = useState({
    template_type: '',
    industry_id: '',
    search: ''
  })
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)

  useEffect(() => {
    if (user && isAdmin(profile)) {
      fetchTemplates()
    }
  }, [user, profile, filters])

  const fetchTemplates = async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })

    const response = await fetch(`/api/admin/templates?${params}`)
    const { data } = await response.json()
    setTemplates(data || [])
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setShowBuilder(true)
  }

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template)
    setShowBuilder(true)
  }

  const handleCloseBuilder = () => {
    setShowBuilder(false)
    setEditingTemplate(null)
    fetchTemplates() // Refresh list
  }

  return (
    <div className="min-h-screen">
      <header className="shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold">Template Library</h1>
              <p className="mt-1 text-muted-foreground">
                Manage system prompt templates and configurations
              </p>
            </div>
            <button
              onClick={handleCreateTemplate}
              className="btn-primary"
            >
              Create Template
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TemplateFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEditTemplate}
                onDelete={() => {/* Implement delete */}}
                onDuplicate={() => {/* Implement duplicate */}}
              />
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No templates found. Create your first template to get started.
              </p>
            </div>
          )}
        </div>
      </main>

      {showBuilder && (
        <TemplateBuilder
          template={editingTemplate}
          onClose={handleCloseBuilder}
        />
      )}
    </div>
  )
}
```

### Placeholder Management Components

```typescript
// /app/dashboard/admin/templates/components/PlaceholderManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { PlaceholderDefinition, PlaceholderValue } from '@/types/templates'
import { RuleBuilder } from './RuleBuilder'
import { MetricDesigner } from './MetricDesigner'
import { TagManager } from './TagManager'

interface PlaceholderManagerProps {
  templateId: string
  placeholderValues: PlaceholderValue[]
  onPlaceholderValuesChange: (values: PlaceholderValue[]) => void
}

export function PlaceholderManager({ 
  templateId, 
  placeholderValues, 
  onPlaceholderValuesChange 
}: PlaceholderManagerProps) {
  const [placeholderDefinitions, setPlaceholderDefinitions] = useState<PlaceholderDefinition[]>([])
  const [activeTab, setActiveTab] = useState('classification_rules')

  useEffect(() => {
    fetchPlaceholderDefinitions()
  }, [])

  const fetchPlaceholderDefinitions = async () => {
    const response = await fetch('/api/admin/placeholders')
    const { data } = await response.json()
    setPlaceholderDefinitions(data || [])
  }

  const getPlaceholderValue = (placeholderKey: string) => {
    return placeholderValues.find(pv => 
      pv.placeholder.placeholder_key === placeholderKey
    )?.value_data
  }

  const updatePlaceholderValue = (placeholderKey: string, value: any) => {
    const placeholder = placeholderDefinitions.find(pd => pd.placeholder_key === placeholderKey)
    if (!placeholder) return

    const existingIndex = placeholderValues.findIndex(pv => 
      pv.placeholder.placeholder_key === placeholderKey
    )

    const newValue: PlaceholderValue = {
      id: existingIndex >= 0 ? placeholderValues[existingIndex].id : crypto.randomUUID(),
      template_id: templateId,
      placeholder_id: placeholder.id,
      value_data: value,
      override_level: 'company', // Default level
      created_at: new Date().toISOString(),
      placeholder: placeholder
    }

    const newValues = [...placeholderValues]
    if (existingIndex >= 0) {
      newValues[existingIndex] = newValue
    } else {
      newValues.push(newValue)
    }

    onPlaceholderValuesChange(newValues)
  }

  const tabs = [
    { key: 'classification_rules', label: 'Classification Rules', icon: '🏷️' },
    { key: 'key_metrics', label: 'Key Metrics', icon: '📊' },
    { key: 'validation_rules', label: 'Validation Rules', icon: '✅' },
    { key: 'special_considerations', label: 'Special Considerations', icon: '⚠️' }
  ]

  return (
    <div className="bg-card rounded-lg border">
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'classification_rules' && (
          <RuleBuilder
            value={getPlaceholderValue('classification_rules')}
            onChange={(value) => updatePlaceholderValue('classification_rules', value)}
          />
        )}

        {activeTab === 'key_metrics' && (
          <MetricDesigner
            value={getPlaceholderValue('key_metrics')}
            onChange={(value) => updatePlaceholderValue('key_metrics', value)}
          />
        )}

        {activeTab === 'validation_rules' && (
          <TagManager
            label="Validation Rules"
            description="Add validation rules that will be applied to analysis results"
            value={getPlaceholderValue('validation_rules') || []}
            onChange={(value) => updatePlaceholderValue('validation_rules', value)}
            placeholder="Enter a validation rule..."
          />
        )}

        {activeTab === 'special_considerations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Special Considerations</h3>
            <p className="text-muted-foreground">
              Configure special handling rules for edge cases and complex scenarios.
            </p>
            
            {/* Key-value editor for special considerations */}
            <div className="space-y-3">
              {Object.entries(getPlaceholderValue('special_considerations') || {}).map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <input
                    type="text"
                    value={key}
                    className="flex-1 input"
                    placeholder="Consideration type..."
                    onChange={(e) => {
                      const current = getPlaceholderValue('special_considerations') || {}
                      const updated = { ...current }
                      delete updated[key]
                      updated[e.target.value] = value
                      updatePlaceholderValue('special_considerations', updated)
                    }}
                  />
                  <input
                    type="text"
                    value={value as string}
                    className="flex-2 input"
                    placeholder="Description..."
                    onChange={(e) => {
                      const current = getPlaceholderValue('special_considerations') || {}
                      updatePlaceholderValue('special_considerations', {
                        ...current,
                        [key]: e.target.value
                      })
                    }}
                  />
                  <button
                    onClick={() => {
                      const current = getPlaceholderValue('special_considerations') || {}
                      const updated = { ...current }
                      delete updated[key]
                      updatePlaceholderValue('special_considerations', updated)
                    }}
                    className="btn-ghost text-destructive"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const current = getPlaceholderValue('special_considerations') || {}
                  updatePlaceholderValue('special_considerations', {
                    ...current,
                    '': ''
                  })
                }}
                className="btn-secondary"
              >
                Add Consideration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Visual Rule Builder Component

```typescript
// /app/dashboard/admin/templates/components/RuleBuilder.tsx
'use client'

import { useState } from 'react'
import { ClassificationRules } from '@/types/templates'
import { TagManager } from './TagManager'

interface RuleBuilderProps {
  value?: ClassificationRules
  onChange: (value: ClassificationRules) => void
}

export function RuleBuilder({ value = { primary_topics: [], temporal_tags: [] }, onChange }: RuleBuilderProps) {
  const [newTopicInput, setNewTopicInput] = useState('')
  const [newTagInput, setNewTagInput] = useState('')

  const updatePrimaryTopics = (topics: string[]) => {
    onChange({ ...value, primary_topics: topics })
  }

  const updateTemporalTags = (tags: string[]) => {
    onChange({ ...value, temporal_tags: tags })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Primary Topics</h3>
        <p className="text-muted-foreground mb-4">
          Define the main topics that will be used to classify earnings call content.
        </p>
        
        <TagManager
          label="Primary Topics"
          value={value.primary_topics}
          onChange={updatePrimaryTopics}
          placeholder="Add a primary topic..."
          suggestions={[
            'Revenue Performance', 'Cost Management', 'Strategic Initiatives',
            'Market Outlook', 'Product Development', 'Regulatory Updates',
            'Geographic Expansion', 'Competitive Landscape', 'Guidance Updates'
          ]}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Temporal Tags</h3>
        <p className="text-muted-foreground mb-4">
          Define time-based tags for classifying temporal references in transcripts.
        </p>
        
        <TagManager
          label="Temporal Tags"
          value={value.temporal_tags}
          onChange={updateTemporalTags}
          placeholder="Add a temporal tag..."
          suggestions={[
            'previous quarter', 'next quarter', 'full year', 'year-to-date',
            'same period last year', 'trailing twelve months', 'first half',
            'second half', 'current quarter', 'upcoming quarter'
          ]}
        />
      </div>

      {/* Preview Section */}
      <div className="bg-muted rounded-lg p-4">
        <h4 className="font-medium mb-2">Configuration Preview</h4>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </div>
  )
}
```

## Implementation Phases

### Phase 1: Foundation & Database (Weeks 1-3)

**Database Migration:**
```typescript
// /migrations/001_enhanced_template_system.sql
-- Run the complete schema creation from above
-- Add migration for existing data
INSERT INTO prompt_templates (id, name, description, template_content, template_type, is_active)
SELECT 
  id,
  name,
  description,
  system_prompt_template,
  'custom'::TEXT,
  is_active
FROM company_types
WHERE is_active = true;

-- Migrate existing placeholder values
-- (Custom logic needed based on current data structure)
```

**Core API Development:**
- Template CRUD operations with proper RLS
- Placeholder definition management
- Template rendering service
- Migration scripts for existing data

### Phase 2: Core UI Components (Weeks 4-7)

**Priority Components:**
1. Template Library interface with grid layout
2. Template Builder with rich text editor
3. Placeholder Manager with tabbed interface
4. Visual Rule Builder components
5. Template Preview system

### Phase 3: Advanced Features (Weeks 8-11)

**Enhanced Functionality:**
1. Template inheritance system
2. Bulk assignment tools
3. Template analytics dashboard
4. Import/export functionality
5. Template validation engine

### Phase 4: Integration & Testing (Weeks 12-14)

**Integration Work:**
1. Update analyze API to use new template system
2. Maintain backwards compatibility
3. Performance optimization
4. Comprehensive testing suite
5. Documentation updates

### Phase 5: Deployment & Migration (Weeks 15-16)

**Production Deployment:**
1. Feature flag rollout
2. Data migration verification
3. Performance monitoring
4. User training materials
5. Full production deployment

## Security Considerations

### Row Level Security Policies

```sql
-- Templates RLS policies
CREATE POLICY "Admins can manage all templates" ON prompt_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Placeholder definitions RLS
CREATE POLICY "Admins can manage placeholder definitions" ON placeholder_definitions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Template assignments RLS
CREATE POLICY "Users can view assigned templates" ON template_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM companies c
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE c.id = company_id
    )
  );
```

### Input Validation & Sanitization

```typescript
// Zod schemas for validation
export const templateCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  template_content: z.string().min(10),
  template_type: z.enum(['global', 'industry', 'custom']),
  parent_template_id: z.string().uuid().optional(),
  placeholder_values: z.array(z.object({
    placeholder_id: z.string().uuid(),
    value_data: z.any(),
    override_level: z.enum(['global', 'industry', 'company']),
    target_id: z.string().optional()
  })).optional()
})

export const placeholderDefinitionSchema = z.object({
  placeholder_key: z.string().regex(/^[a-z_]+$/),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  data_type: z.enum(['text', 'jsonb', 'array']),
  schema_definition: z.object({}).passthrough().optional(),
  default_value: z.any().optional(),
  is_required: z.boolean().default(false)
})
```

## Performance Optimization

### Database Optimization

```sql
-- Efficient indexes for common queries
CREATE INDEX CONCURRENTLY idx_prompt_templates_type_active 
  ON prompt_templates(template_type, is_active) 
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_template_placeholder_values_composite
  ON template_placeholder_values(template_id, override_level, target_id);

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_template_assignments_primary
  ON template_assignments(company_id, is_primary)
  WHERE is_primary = true;
```

### Caching Strategy

```typescript
// Template rendering cache
export class CachedTemplateRenderer extends TemplateRenderer {
  private cache = new Map<string, { rendered: string; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async renderTemplate(templateId: string, context: TemplateRenderContext) {
    const cacheKey = this.generateCacheKey(templateId, context)
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { rendered: cached.rendered }
    }

    const result = await super.renderTemplate(templateId, context)
    
    if (result.rendered && !result.error) {
      this.cache.set(cacheKey, {
        rendered: result.rendered,
        timestamp: Date.now()
      })
    }

    return result
  }

  private generateCacheKey(templateId: string, context: TemplateRenderContext): string {
    return `${templateId}-${JSON.stringify(context)}`
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// /tests/services/templateRenderer.test.ts
import { TemplateRenderer } from '@/lib/services/templateRenderer'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    renderer = new TemplateRenderer(mockSupabase)
  })

  it('should render template with simple placeholders', async () => {
    const template = {
      id: 'test-template',
      template_content: 'Hello {name}, you are a {role}.',
      placeholder_values: []
    }

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: template, error: null })
        })
      })
    })

    const context = { name: 'Alice', role: 'analyst' }
    const result = await renderer.renderTemplate('test-template', context)

    expect(result.rendered).toBe('Hello Alice, you are a analyst.')
    expect(result.error).toBeUndefined()
  })

  it('should handle template inheritance', async () => {
    // Test parent template resolution
    const parentTemplate = {
      id: 'parent-template',
      template_content: 'You are a {role}. {{EXTEND}}',
      parent_template_id: null
    }

    const childTemplate = {
      id: 'child-template',
      template_content: '{{EXTEND}} Focus on {industry} companies.',
      parent_template_id: 'parent-template',
      placeholder_values: []
    }

    // Mock the calls
    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: childTemplate, error: null })
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: parentTemplate, error: null })
          })
        })
      })

    const context = { role: 'financial analyst', industry: 'technology' }
    const result = await renderer.renderTemplate('child-template', context)

    expect(result.rendered).toBe('You are a financial analyst. Focus on technology companies.')
  })
})
```

### Integration Tests

```typescript
// /tests/api/templates.integration.test.ts
import { testApiHandler } from 'next-test-api-route-handler'
import handler from '@/app/api/admin/templates/route'
import { createMockAuth } from '@/tests/mocks/auth'

describe('/api/admin/templates', () => {
  it('GET should return templates for admin users', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer ' + createMockAuth({ isAdmin: true })
          }
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data.data)).toBe(true)
      }
    })
  })

  it('POST should create new template with validation', async () => {
    const newTemplate = {
      name: 'Test Template',
      description: 'Test description',
      template_content: 'Hello {name}',
      template_type: 'custom'
    }

    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: 'Bearer ' + createMockAuth({ isAdmin: true })
          },
          body: JSON.stringify(newTemplate)
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.data.name).toBe(newTemplate.name)
      }
    })
  })
})
```

## Monitoring & Analytics

### Performance Monitoring

```typescript
// /lib/monitoring/templateMetrics.ts
export class TemplateMetrics {
  static async trackTemplateUsage(templateId: string, companyId: string, performanceScore?: number) {
    try {
      await supabase
        .from('template_usage_analytics')
        .upsert({
          template_id: templateId,
          company_id: companyId,
          performance_score: performanceScore,
          usage_count: 1,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'template_id,company_id',
          ignoreDuplicates: false
        })
    } catch (error) {
      console.error('Failed to track template usage:', error)
    }
  }

  static async getTemplateAnalytics(templateId: string) {
    const { data, error } = await supabase
      .from('template_usage_analytics')
      .select(`
        *,
        company:companies(name, ticker)
      `)
      .eq('template_id', templateId)
      .order('usage_count', { ascending: false })

    return { data, error }
  }
}
```

## Documentation Requirements

### API Documentation

Generate comprehensive API documentation using OpenAPI/Swagger specifications for all new endpoints.

### User Documentation

Create user guides for:
1. Template creation and management
2. Placeholder configuration
3. Template inheritance workflows
4. Bulk operations
5. Analytics interpretation

### Developer Documentation

Maintain technical documentation for:
1. Database schema evolution
2. Template rendering engine
3. Caching strategies
4. Performance optimization
5. Testing procedures

## Success Metrics

### Performance Metrics
- **Template Rendering Time**: < 100ms for 95th percentile
- **Database Query Performance**: < 50ms for template fetches
- **UI Response Time**: < 200ms for all interactions

### User Experience Metrics
- **Admin Efficiency**: 50% reduction in time to create/modify analyst types
- **Error Reduction**: 75% fewer analysis failures due to prompt errors
- **User Adoption**: 90% of admins using new interface within 30 days

### System Metrics
- **Template Reusability**: Track inheritance usage and template sharing
- **Configuration Accuracy**: Monitor validation failures and corrections
- **System Scalability**: Support for 100+ templates with sub-second performance

This comprehensive technical specification provides the foundation for implementing a robust, scalable system prompt management system that addresses all current limitations while providing a solid foundation for future enhancements.