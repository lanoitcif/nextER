export interface Template {
  id: string
  name: string
  description: string | null
  system_prompt_template: string
  classification_rules: any
  key_metrics: any
  output_format: any
  validation_rules: string[] | null
  special_considerations: any
  llm_settings?: {
    temperature?: number
    top_p?: number
    max_tokens?: number
    frequency_penalty?: number
    presence_penalty?: number
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateHierarchy {
  global: Template[]
  industry: Record<string, Template[]>
  company: Record<string, Template[]>
}

export interface TemplateMetadata {
  usage_count?: number
  last_used?: string
  created_by?: string
  tags?: string[]
  version?: number
  parent_template_id?: string
}