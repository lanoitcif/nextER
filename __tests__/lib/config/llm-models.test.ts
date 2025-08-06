import { 
  LLM_PROVIDERS, 
  getProviderModels, 
  getModelInfo,
  getAllModels 
} from '@/lib/config/llm-models'

describe('LLM Models Configuration', () => {
  describe('LLM_PROVIDERS', () => {
    it('should have all required providers', () => {
      expect(LLM_PROVIDERS).toHaveProperty('openai')
      expect(LLM_PROVIDERS).toHaveProperty('anthropic')
      expect(LLM_PROVIDERS).toHaveProperty('google')
      expect(LLM_PROVIDERS).toHaveProperty('cohere')
    })

    it('each provider should have correct structure', () => {
      Object.values(LLM_PROVIDERS).forEach(provider => {
        expect(provider).toHaveProperty('id')
        expect(provider).toHaveProperty('name')
        expect(provider).toHaveProperty('models')
        expect(Array.isArray(provider.models)).toBe(true)
      })
    })

    it('each model should have required fields', () => {
      Object.values(LLM_PROVIDERS).forEach(provider => {
        provider.models.forEach(model => {
          expect(model).toHaveProperty('id')
          expect(model).toHaveProperty('name')
          expect(typeof model.id).toBe('string')
          expect(typeof model.name).toBe('string')
        })
      })
    })
  })

  describe('getProviderModels', () => {
    it('should return models for valid provider', () => {
      const openaiModels = getProviderModels('openai')
      expect(Array.isArray(openaiModels)).toBe(true)
      expect(openaiModels.length).toBeGreaterThan(0)
      expect(openaiModels[0]).toHaveProperty('id')
    })

    it('should return empty array for invalid provider', () => {
      const models = getProviderModels('invalid-provider')
      expect(models).toEqual([])
    })

    it('should return correct models for each provider', () => {
      const openaiModels = getProviderModels('openai')
      expect(openaiModels.some(m => m.id.includes('gpt'))).toBe(true)

      const anthropicModels = getProviderModels('anthropic')
      expect(anthropicModels.some(m => m.id.includes('claude'))).toBe(true)

      const googleModels = getProviderModels('google')
      expect(googleModels.some(m => m.id.includes('gemini'))).toBe(true)

      const cohereModels = getProviderModels('cohere')
      expect(cohereModels.some(m => m.id.includes('command'))).toBe(true)
    })
  })

  describe('getModelInfo', () => {
    it('should return model info for valid provider and model', () => {
      const modelInfo = getModelInfo('openai', 'gpt-4.1-mini')
      expect(modelInfo).toBeDefined()
      expect(modelInfo?.id).toBe('gpt-4.1-mini')
      expect(modelInfo?.name).toBe('GPT-4.1 Mini')
    })

    it('should return undefined for invalid provider', () => {
      const modelInfo = getModelInfo('invalid', 'gpt-4')
      expect(modelInfo).toBeUndefined()
    })

    it('should return undefined for invalid model', () => {
      const modelInfo = getModelInfo('openai', 'invalid-model')
      expect(modelInfo).toBeUndefined()
    })
  })

  describe('getAllModels', () => {
    it('should return all models from all providers', () => {
      const allModels = getAllModels()
      expect(Array.isArray(allModels)).toBe(true)
      expect(allModels.length).toBeGreaterThan(10)
    })

    it('each model should have provider info', () => {
      const allModels = getAllModels()
      allModels.forEach(model => {
        expect(model).toHaveProperty('provider')
        expect(model).toHaveProperty('id')
        expect(model).toHaveProperty('name')
      })
    })

    it('should include models from all providers', () => {
      const allModels = getAllModels()
      const providers = new Set(allModels.map(m => m.provider))
      expect(providers.has('openai')).toBe(true)
      expect(providers.has('anthropic')).toBe(true)
      expect(providers.has('google')).toBe(true)
      expect(providers.has('cohere')).toBe(true)
    })
  })

  describe('Model metadata', () => {
    it('should have reasonable max tokens for models', () => {
      Object.values(LLM_PROVIDERS).forEach(provider => {
        provider.models.forEach(model => {
          if (model.maxTokens) {
            expect(model.maxTokens).toBeGreaterThan(0)
            expect(model.maxTokens).toBeLessThanOrEqual(500000) // Updated for o3-mini
          }
        })
      })
    })

    it('should have cost information for paid models', () => {
      const openaiModels = getProviderModels('openai')
      const paidModels = openaiModels.filter(m => !m.id.includes('mini'))
      paidModels.forEach(model => {
        if (model.costPer1kTokens) {
          expect(model.costPer1kTokens).toBeGreaterThan(0)
        }
      })
    })

    it('should mark deprecated models appropriately', () => {
      Object.values(LLM_PROVIDERS).forEach(provider => {
        provider.models.forEach(model => {
          if (model.deprecated) {
            expect(typeof model.deprecated).toBe('boolean')
          }
        })
      })
    })
  })
})