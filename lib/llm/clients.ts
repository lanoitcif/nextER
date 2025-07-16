export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: string
}

export interface LLMRequest {
  systemPrompt: string
  userMessage: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export abstract class LLMClient {
  protected apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  abstract generateResponse(request: LLMRequest): Promise<LLMResponse>
  abstract getAvailableModels(): string[]
  abstract getDefaultModel(): string
}

export class OpenAIClient extends LLMClient {
  private baseURL = 'https://api.openai.com/v1'
  
  getAvailableModels(): string[] {
    return [
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
    ]
  }
  
  getDefaultModel(): string {
    return 'gpt-4.1-mini' // Updated to latest cost-effective model
  }
  
  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.getDefaultModel(),
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userMessage }
        ],
        max_tokens: request.maxTokens || 16384,
        temperature: request.temperature || 0.7,
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }
    
    const data = await response.json()
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
      provider: 'openai'
    }
  }
}

export class AnthropicClient extends LLMClient {
  private baseURL = 'https://api.anthropic.com/v1'
  
  getAvailableModels(): string[] {
    return [
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
    ]
  }
  
  getDefaultModel(): string {
    return 'claude-4-sonnet' // Updated to latest balanced model
  }
  
  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model || this.getDefaultModel(),
        max_tokens: request.maxTokens || 16384,
        temperature: request.temperature || 0.7,
        system: request.systemPrompt,
        messages: [
          { role: 'user', content: request.userMessage }
        ],
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }
    
    const data = await response.json()
    
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      model: data.model,
      provider: 'anthropic'
    }
  }
}

export class GoogleClient extends LLMClient {
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta'
  
  getAvailableModels(): string[] {
    return [
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
    ]
  }
  
  getDefaultModel(): string {
    return 'gemini-2.5-flash' // Updated to latest cost-effective model
  }
  
  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || this.getDefaultModel()
    const response = await fetch(`${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${request.systemPrompt}\n\nUser: ${request.userMessage}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 16384,
          temperature: request.temperature || 0.7,
        },
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google API error: ${response.status} - ${error}`)
    }
    
    const data = await response.json()
    
    return {
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      model: model,
      provider: 'google'
    }
  }
}

export class CohereClient extends LLMClient {
  private baseURL = 'https://api.cohere.ai/v1'
  
  getAvailableModels(): string[] {
    return [
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
  
  getDefaultModel(): string {
    return 'command-a-03-2025' // Updated to latest most performant model
  }
  
  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.getDefaultModel(),
        message: request.userMessage,
        preamble: request.systemPrompt,
        max_tokens: request.maxTokens || 16384,
        temperature: request.temperature || 0.7,
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Cohere API error: ${response.status} - ${error}`)
    }
    
    const data = await response.json()
    
    return {
      content: data.text,
      usage: {
        promptTokens: data.meta?.tokens?.input_tokens || 0,
        completionTokens: data.meta?.tokens?.output_tokens || 0,
        totalTokens: (data.meta?.tokens?.input_tokens || 0) + (data.meta?.tokens?.output_tokens || 0),
      },
      model: request.model || this.getDefaultModel(),
      provider: 'cohere'
    }
  }
}

export function createLLMClient(provider: string, apiKey: string): LLMClient {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIClient(apiKey)
    case 'anthropic':
      return new AnthropicClient(apiKey)
    case 'google':
      return new GoogleClient(apiKey)
    case 'cohere':
      return new CohereClient(apiKey)
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`)
  }
}

export const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'google', 'cohere'] as const
export type SupportedProvider = typeof SUPPORTED_PROVIDERS[number]