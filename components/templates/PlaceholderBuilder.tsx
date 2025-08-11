'use client'

import { useState, useCallback } from 'react'
import {
  Plus, X, GripVertical, Trash2, ChevronDown, ChevronRight,
  Tag, Calendar, DollarSign, Percent, TrendingUp, Building2,
  AlertCircle, CheckCircle, Copy, Settings, FileJson, Code
} from 'lucide-react'

interface PlaceholderItem {
  id: string
  type: 'metric' | 'rule' | 'tag' | 'consideration'
  name: string
  description?: string
  dataType?: 'number' | 'percentage' | 'currency' | 'text' | 'boolean'
  required?: boolean
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
  children?: PlaceholderItem[]
}

interface PlaceholderBuilderProps {
  title: string
  placeholder: string
  value: any
  onChange: (value: any) => void
  templates?: PlaceholderItem[]
  allowNesting?: boolean
}

const METRIC_TEMPLATES: PlaceholderItem[] = [
  {
    id: 'revenue',
    type: 'metric',
    name: 'Revenue',
    dataType: 'currency',
    description: 'Total revenue for the period',
    required: true
  },
  {
    id: 'growth_rate',
    type: 'metric',
    name: 'Growth Rate',
    dataType: 'percentage',
    description: 'Year-over-year growth',
    validation: { min: -100, max: 1000 }
  },
  {
    id: 'occupancy_rate',
    type: 'metric',
    name: 'Occupancy Rate',
    dataType: 'percentage',
    description: 'Property occupancy percentage',
    validation: { min: 0, max: 100 }
  },
  {
    id: 'noi',
    type: 'metric',
    name: 'Net Operating Income',
    dataType: 'currency',
    description: 'NOI for REITs'
  },
  {
    id: 'ffo',
    type: 'metric',
    name: 'Funds From Operations',
    dataType: 'currency',
    description: 'FFO metric for REITs'
  }
]

const RULE_TEMPLATES: PlaceholderItem[] = [
  {
    id: 'temporal_context',
    type: 'rule',
    name: 'Temporal Context',
    description: 'Time period classification',
    children: [
      { id: 'quarter', type: 'tag', name: 'Quarter', dataType: 'text' },
      { id: 'year', type: 'tag', name: 'Year', dataType: 'number' }
    ]
  },
  {
    id: 'sentiment_analysis',
    type: 'rule',
    name: 'Sentiment Analysis',
    description: 'Analyze management tone',
    dataType: 'text',
    validation: {
      options: ['positive', 'neutral', 'negative', 'mixed']
    }
  }
]

export default function PlaceholderBuilder({
  title,
  placeholder,
  value,
  onChange,
  templates = METRIC_TEMPLATES,
  allowNesting = false
}: PlaceholderBuilderProps) {
  const [items, setItems] = useState<PlaceholderItem[]>(() => {
    // Initialize from value if it's an object
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.entries(value).map(([key, val]: [string, any]) => ({
        id: key,
        type: 'metric' as const,
        name: key,
        defaultValue: val
      }))
    }
    return []
  })
  
  const [showTemplates, setShowTemplates] = useState(false)
  const [showJsonView, setShowJsonView] = useState(false)
  const [draggedItem, setDraggedItem] = useState<PlaceholderItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Convert items to JSON structure
  const itemsToJson = useCallback(() => {
    const result: any = {}
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        result[item.name] = {}
        item.children.forEach(child => {
          result[item.name][child.name] = child.defaultValue || null
        })
      } else {
        result[item.name] = item.defaultValue || null
      }
    })
    return result
  }, [items])

  // Update parent whenever items change
  const updateParent = useCallback(() => {
    onChange(itemsToJson())
  }, [itemsToJson, onChange])

  const addItem = (template?: PlaceholderItem) => {
    const newItem: PlaceholderItem = template || {
      id: `item-${Date.now()}`,
      type: 'metric',
      name: 'New Item',
      dataType: 'text'
    }
    setItems([...items, { ...newItem, id: `${newItem.id}-${Date.now()}` }])
    updateParent()
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    updateParent()
  }

  const updateItem = (id: string, updates: Partial<PlaceholderItem>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
    updateParent()
  }

  const handleDragStart = (e: React.DragEvent, item: PlaceholderItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedItem) return

    const dragIndex = items.findIndex(item => item.id === draggedItem.id)
    if (dragIndex === dropIndex) return

    const newItems = [...items]
    newItems.splice(dragIndex, 1)
    newItems.splice(dropIndex, 0, draggedItem)
    
    setItems(newItems)
    setDraggedItem(null)
    setDragOverIndex(null)
    updateParent()
  }

  const getIcon = (type: PlaceholderItem['type']) => {
    switch (type) {
      case 'metric': return <TrendingUp className="w-4 h-4" />
      case 'rule': return <CheckCircle className="w-4 h-4" />
      case 'tag': return <Tag className="w-4 h-4" />
      case 'consideration': return <AlertCircle className="w-4 h-4" />
      default: return <FileJson className="w-4 h-4" />
    }
  }

  const getDataTypeIcon = (dataType?: PlaceholderItem['dataType']) => {
    switch (dataType) {
      case 'currency': return <DollarSign className="w-3 h-3" />
      case 'percentage': return <Percent className="w-3 h-3" />
      case 'number': return <Code className="w-3 h-3" />
      default: return null
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowJsonView(!showJsonView)}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted"
          >
            {showJsonView ? 'Visual' : 'JSON'}
          </button>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted"
          >
            Templates
          </button>
        </div>
      </div>

      {/* Templates Dropdown */}
      {showTemplates && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium mb-2">Quick Add Templates:</div>
          <div className="grid grid-cols-2 gap-2">
            {templates.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  addItem(template)
                  setShowTemplates(false)
                }}
                className="flex items-center gap-2 p-2 bg-background rounded border border-border
                         hover:bg-primary/10 hover:border-primary text-sm text-left"
              >
                {getIcon(template.type)}
                <div>
                  <div className="font-medium">{template.name}</div>
                  {template.description && (
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {showJsonView ? (
        // JSON View
        <div className="space-y-2">
          <textarea
            value={JSON.stringify(itemsToJson(), null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                onChange(parsed)
                // Update items from JSON
                const newItems = Object.entries(parsed).map(([key, val]) => ({
                  id: key,
                  type: 'metric' as const,
                  name: key,
                  defaultValue: val
                }))
                setItems(newItems)
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
            className="w-full h-64 p-3 font-mono text-sm bg-background border border-border rounded"
            placeholder={placeholder}
          />
        </div>
      ) : (
        // Visual Builder
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileJson className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items configured</p>
              <p className="text-xs mt-1">Click "Add Item" or use templates to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`border border-border rounded-lg p-3 transition-colors ${
                    dragOverIndex === index ? 'border-primary bg-primary/5' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-move mt-1" />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getIcon(item.type)}
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          className="flex-1 px-2 py-1 bg-background border border-border rounded"
                          placeholder="Item name"
                        />
                        {item.dataType && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                            {getDataTypeIcon(item.dataType)}
                            {item.dataType}
                          </span>
                        )}
                        {item.required && (
                          <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs">
                            Required
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                          placeholder="Description"
                        />
                      )}

                      {/* Default Value Input */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">Default:</label>
                        {item.dataType === 'boolean' ? (
                          <select
                            value={item.defaultValue || 'null'}
                            onChange={(e) => updateItem(item.id, { 
                              defaultValue: e.target.value === 'null' ? null : e.target.value === 'true' 
                            })}
                            className="px-2 py-1 bg-background border border-border rounded text-sm"
                          >
                            <option value="null">Not set</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : item.validation?.options ? (
                          <select
                            value={item.defaultValue || ''}
                            onChange={(e) => updateItem(item.id, { defaultValue: e.target.value })}
                            className="px-2 py-1 bg-background border border-border rounded text-sm"
                          >
                            <option value="">Select...</option>
                            {item.validation.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={item.dataType === 'number' ? 'number' : 'text'}
                            value={item.defaultValue || ''}
                            onChange={(e) => updateItem(item.id, { 
                              defaultValue: item.dataType === 'number' ? 
                                parseFloat(e.target.value) || 0 : e.target.value 
                            })}
                            className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm"
                            placeholder={`Enter ${item.dataType || 'value'}`}
                          />
                        )}
                      </div>

                      {/* Nested Items */}
                      {allowNesting && item.children && item.children.length > 0 && (
                        <div className="ml-6 pl-3 border-l-2 border-border space-y-1">
                          {item.children.map(child => (
                            <div key={child.id} className="flex items-center gap-2 text-sm">
                              {getIcon(child.type)}
                              <span>{child.name}</span>
                              {child.dataType && (
                                <span className="text-xs text-muted-foreground">
                                  ({child.dataType})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Item Button */}
          <button
            type="button"
            onClick={() => addItem()}
            className="w-full py-2 border-2 border-dashed border-border rounded-lg
                     hover:border-primary hover:bg-primary/5 transition-colors
                     flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        💡 Drag items to reorder. Use templates for quick setup. Switch to JSON view for direct editing.
      </div>
    </div>
  )
}