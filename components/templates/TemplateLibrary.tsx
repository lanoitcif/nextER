'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Search, Filter, Grid, List, Copy, Eye, Edit2, Trash2, 
  Plus, Star, StarOff, Building2, Tag, Clock, TrendingUp,
  ChevronDown, ChevronRight, FolderOpen, FileText, Settings,
  Download, Upload, Shield, Users, BarChart, Check
} from 'lucide-react'
import { Template } from '@/types/template'

interface TemplateLibraryProps {
  templates: Template[]
  onSelectTemplate: (template: Template) => void
  onEditTemplate: (template: Template) => void
  onDeleteTemplate: (id: string) => void
  onCreateTemplate: () => void
  isAdmin: boolean
}

interface TemplateCategory {
  id: string
  name: string
  icon: React.ReactNode
  count: number
  templates: Template[]
}

export default function TemplateLibrary({
  templates,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateTemplate,
  isAdmin
}: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'usage'>('name')
  const [showFilters, setShowFilters] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']))

  // Categorize templates based on their characteristics
  const categories = useMemo(() => {
    const cats: TemplateCategory[] = [
      {
        id: 'all',
        name: 'All Templates',
        icon: <FolderOpen className="w-4 h-4" />,
        count: templates.length,
        templates: templates
      },
      {
        id: 'reits',
        name: 'REITs',
        icon: <Building2 className="w-4 h-4" />,
        count: 0,
        templates: []
      },
      {
        id: 'tech',
        name: 'Technology',
        icon: <Settings className="w-4 h-4" />,
        count: 0,
        templates: []
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        icon: <Shield className="w-4 h-4" />,
        count: 0,
        templates: []
      },
      {
        id: 'finance',
        name: 'Finance',
        icon: <TrendingUp className="w-4 h-4" />,
        count: 0,
        templates: []
      },
      {
        id: 'retail',
        name: 'Retail',
        icon: <Users className="w-4 h-4" />,
        count: 0,
        templates: []
      }
    ]

    // Categorize templates based on name/description
    templates.forEach(template => {
      const nameDesc = `${template.name} ${template.description || ''}`.toLowerCase()
      
      if (nameDesc.includes('reit') || nameDesc.includes('real estate')) {
        cats[1].templates.push(template)
        cats[1].count++
      }
      if (nameDesc.includes('tech') || nameDesc.includes('software') || nameDesc.includes('saas')) {
        cats[2].templates.push(template)
        cats[2].count++
      }
      if (nameDesc.includes('health') || nameDesc.includes('medical') || nameDesc.includes('pharma')) {
        cats[3].templates.push(template)
        cats[3].count++
      }
      if (nameDesc.includes('financ') || nameDesc.includes('bank') || nameDesc.includes('insurance')) {
        cats[4].templates.push(template)
        cats[4].count++
      }
      if (nameDesc.includes('retail') || nameDesc.includes('consumer') || nameDesc.includes('store')) {
        cats[5].templates.push(template)
        cats[5].count++
      }
    })

    return cats.filter(cat => cat.count > 0 || cat.id === 'all')
  }, [templates])

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? templates 
      : categories.find(c => c.id === selectedCategory)?.templates || []

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort templates
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'usage':
          // TODO: Add usage tracking
          return 0
        default:
          return 0
      }
    })
  }, [templates, selectedCategory, searchQuery, sortBy, categories])

  const handleCopyTemplate = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(template, null, 2))
      setCopiedId(template.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy template:', err)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/20 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border 
                     focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Categories */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Categories
          </div>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                         transition-colors ${
                selectedCategory === category.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                {category.icon}
                <span className="text-sm">{category.name}</span>
              </div>
              <span className="text-xs bg-background/20 px-2 py-0.5 rounded">
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className="pt-4 border-t border-border">
            <button
              onClick={onCreateTemplate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 
                       bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Template Library</h2>
            <p className="text-muted-foreground">
              {filteredTemplates.length} templates available
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-background border border-border"
            >
              <option value="name">Sort by Name</option>
              <option value="updated">Sort by Updated</option>
              <option value="usage">Sort by Usage</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Templates Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate(template)}
                onEdit={() => onEditTemplate(template)}
                onDelete={() => onDeleteTemplate(template.id)}
                onCopy={() => handleCopyTemplate(template)}
                copied={copiedId === template.id}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <TemplateListItem
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate(template)}
                onEdit={() => onEditTemplate(template)}
                onDelete={() => onDeleteTemplate(template.id)}
                onCopy={() => handleCopyTemplate(template)}
                copied={copiedId === template.id}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No templates found</p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search criteria
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Template Card Component
function TemplateCard({ 
  template, 
  onSelect, 
  onEdit, 
  onDelete, 
  onCopy, 
  copied,
  isAdmin 
}: {
  template: Template
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
  copied: boolean
  isAdmin: boolean
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div 
      className="border border-border rounded-lg p-4 hover:shadow-lg transition-shadow
                 cursor-pointer group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onSelect}
    >
      {/* Actions */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCopy()
            }}
            className="p-1.5 bg-background border border-border rounded hover:bg-muted"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {isAdmin && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="p-1.5 bg-background border border-border rounded hover:bg-muted"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="p-1.5 bg-background border border-border rounded hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(template.updated_at).toLocaleDateString()}
          </div>
          {template.llm_settings && (
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              T: {template.llm_settings.temperature}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.key_metrics && Object.keys(template.key_metrics).length > 0 && (
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded">
              {Object.keys(template.key_metrics).length} metrics
            </span>
          )}
          {template.validation_rules && template.validation_rules.length > 0 && (
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded">
              {template.validation_rules.length} rules
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Template List Item Component
function TemplateListItem({ 
  template, 
  onSelect, 
  onEdit, 
  onDelete, 
  onCopy, 
  copied,
  isAdmin 
}: {
  template: Template
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
  copied: boolean
  isAdmin: boolean
}) {
  return (
    <div 
      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors
                 cursor-pointer flex items-center justify-between"
      onClick={onSelect}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {new Date(template.updated_at).toLocaleDateString()}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCopy()
          }}
          className="p-1.5 hover:bg-muted rounded"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
        {isAdmin && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="p-1.5 hover:bg-muted rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}