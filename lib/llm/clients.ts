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
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  }
  
  getDefaultModel(): string {
    return 'gpt-4o-mini'
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
        max_tokens: request.maxTokens || 2000,
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
    return ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229']
  }
  
  getDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022'
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
        max_tokens: request.maxTokens || 2000,
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
    return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
  }
  
  getDefaultModel(): string {
    return 'gemini-1.5-flash'
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
          maxOutputTokens: request.maxTokens || 2000,
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
    return ['command-r-plus', 'command-r', 'command']
  }
  
  getDefaultModel(): string {
    return 'command-r'
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
        max_tokens: request.maxTokens || 2000,
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