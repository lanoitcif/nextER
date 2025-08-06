/**
 * LLM Model Configuration
 * Centralized configuration for all supported LLM providers and models
 * Last Updated: August 2025
 */

export interface ModelConfig {
  id: string
  name: string
  description?: string
  maxTokens?: number
  costPer1kTokens?: number
  deprecated?: boolean
  releaseDate?: string
}

export interface ProviderConfig {
  id: string
  name: string
  models: ModelConfig[]
  defaultModel: string
}

// Model configurations for each provider
export const LLM_PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4.1-mini',
    models: [
      // GPT-4.1 Series (Latest 2025)
      { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Most capable model', maxTokens: 128000 },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Cost-effective, fast', maxTokens: 128000 },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: 'Ultra-fast, lightweight', maxTokens: 16000 },
      // Reasoning Models
      { id: 'o3', name: 'O3', description: 'Advanced reasoning', maxTokens: 200000 },
      { id: 'o3-pro', name: 'O3 Pro', description: 'Professional reasoning', maxTokens: 200000 },
      { id: 'o4-mini', name: 'O4 Mini', description: 'Efficient reasoning', maxTokens: 65536 },
      { id: 'o4-mini-high', name: 'O4 Mini High', description: 'Enhanced reasoning', maxTokens: 65536 },
      // GPT-4o Series
      { id: 'gpt-4o', name: 'GPT-4 Omni', description: 'Multimodal', maxTokens: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4 Omni Mini', description: 'Efficient multimodal', maxTokens: 128000 },
      { id: 'gpt-4o-audio', name: 'GPT-4 Omni Audio', description: 'Audio processing', maxTokens: 128000 },
      // Legacy Models
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation', maxTokens: 128000, deprecated: true },
      { id: 'gpt-4', name: 'GPT-4', description: 'Original GPT-4', maxTokens: 8192, deprecated: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast, affordable', maxTokens: 16385, deprecated: true },
      // Image Generation
      { id: 'gpt-image-1', name: 'GPT Image 1', description: 'Image generation', maxTokens: 0 }
    ]
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    defaultModel: 'claude-4-sonnet',
    models: [
      // Claude 4 Series (Latest 2025)
      { id: 'claude-4-opus', name: 'Claude 4 Opus', description: 'Most capable', maxTokens: 200000 },
      { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', description: 'Balanced performance', maxTokens: 200000 },
      // Claude 3.7 Series (February 2025)
      { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Enhanced capabilities', maxTokens: 200000 },
      // Claude 3.5 Series (2024)
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'October 2024', maxTokens: 200000 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast, lightweight', maxTokens: 200000 },
      // Claude 3 Series (March 2024)
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Previous flagship', maxTokens: 200000, deprecated: true },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced v3', maxTokens: 200000, deprecated: true },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast v3', maxTokens: 200000, deprecated: true }
    ]
  },
  google: {
    id: 'google',
    name: 'Google',
    defaultModel: 'gemini-2.5-flash',
    models: [
      // Gemini 2.5 Series (Latest - Generally Available)
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast, cost-effective', maxTokens: 1048576 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced capabilities', maxTokens: 2097152 },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Ultra-lightweight', maxTokens: 1048576 },
      // Gemini 2.0 Series
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Previous flash', maxTokens: 1048576 },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Previous lite', maxTokens: 1048576 },
      // Gemini 1.5 Series (Limited Availability)
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Extended context', maxTokens: 2097152, deprecated: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Legacy flash', maxTokens: 1048576, deprecated: true },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Efficient variant', maxTokens: 1048576, deprecated: true },
      // Gemma Open Models
      { id: 'gemma-3', name: 'Gemma 3', description: 'Open source', maxTokens: 8192 },
      { id: 'gemma-2', name: 'Gemma 2', description: 'Open source v2', maxTokens: 8192 }
    ]
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    defaultModel: 'command-a-03-2025',
    models: [
      // Latest Command Models (2025)
      { id: 'command-a-03-2025', name: 'Command A', description: 'Latest flagship', maxTokens: 128000, releaseDate: '2025-03' },
      // Command R Series (August 2024)
      { id: 'command-r-plus-08-2024', name: 'Command R+', description: 'Enhanced R+', maxTokens: 128000, releaseDate: '2024-08' },
      { id: 'command-r-08-2024', name: 'Command R', description: 'Enhanced R', maxTokens: 128000, releaseDate: '2024-08' },
      { id: 'command-r7b', name: 'Command R 7B', description: 'Efficient 7B model', maxTokens: 128000 },
      // Legacy Models
      { id: 'command-r-plus', name: 'Command R+ Legacy', description: 'Previous R+', maxTokens: 128000, deprecated: true },
      { id: 'command-r', name: 'Command R Legacy', description: 'Previous R', maxTokens: 128000, deprecated: true },
      { id: 'command', name: 'Command Legacy', description: 'Original Command', maxTokens: 4096, deprecated: true }
    ]
  }
}

// Helper functions
export function getProviderModels(providerId: string): ModelConfig[] {
  return LLM_PROVIDERS[providerId]?.models || []
}

export function getDefaultModel(providerId: string): string {
  return LLM_PROVIDERS[providerId]?.defaultModel || ''
}

export function getModelConfig(providerId: string, modelId: string): ModelConfig | undefined {
  return LLM_PROVIDERS[providerId]?.models.find(m => m.id === modelId)
}

export function getActiveModels(providerId: string): ModelConfig[] {
  return LLM_PROVIDERS[providerId]?.models.filter(m => !m.deprecated) || []
}

// Export for backward compatibility
export const PROVIDER_MODELS = Object.fromEntries(
  Object.entries(LLM_PROVIDERS).map(([key, provider]) => [
    key,
    provider.models.map(m => m.id)
  ])
)

export const DEFAULT_MODELS = Object.fromEntries(
  Object.entries(LLM_PROVIDERS).map(([key, provider]) => [
    key,
    provider.defaultModel
  ])
)