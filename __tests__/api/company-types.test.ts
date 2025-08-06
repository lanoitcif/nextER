import { NextRequest } from 'next/server'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' }
        },
        error: null
      })
    },
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockData[table],
        error: null
      }),
      then: jest.fn().mockResolvedValue({
        data: mockData[table],
        error: null
      })
    }))
  }))
}))

const mockData: any = {
  company_types: [
    {
      id: 'hospitality_reit',
      name: 'Hospitality REIT',
      description: 'Analysis template for hospitality REITs',
      system_prompt_template: 'Role: {role}...',
      classification_rules: { temporal_tags: ['Q1', 'Q2'] },
      key_metrics: { financial_metrics: ['EBITDA'] },
      output_format: { quarterly_highlights: ['RevPAR'] },
      llm_settings: { temperature: 0.3, top_p: 0.9 },
      is_active: true
    }
  ],
  user_profiles: {
    id: 'test-user-id',
    is_admin: true,
    access_level: 'admin'
  }
}

describe('/api/company-types', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/company-types', () => {
    it('should return company types for authenticated user', async () => {
      const { GET } = await import('@/app/api/company-types/route')
      const req = new NextRequest('http://localhost/api/company-types')
      
      const res = await GET(req)
      const data = await res.json()
      
      expect(res.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('llm_settings')
    })

    it('should include LLM settings in response', async () => {
      const { GET } = await import('@/app/api/company-types/route')
      const req = new NextRequest('http://localhost/api/company-types')
      
      const res = await GET(req)
      const data = await res.json()
      
      const template = data[0]
      expect(template.llm_settings).toHaveProperty('temperature')
      expect(template.llm_settings).toHaveProperty('top_p')
      expect(typeof template.llm_settings.temperature).toBe('number')
    })
  })

  describe('POST /api/company-types', () => {
    it('should create new company type with valid data', async () => {
      const { POST } = await import('@/app/api/company-types/route')
      
      const newTemplate = {
        name: 'Test Template',
        description: 'Test description',
        system_prompt_template: 'Test prompt',
        classification_rules: { temporal_tags: ['Q1'] },
        key_metrics: { financial_metrics: ['Revenue'] },
        output_format: { quarterly_highlights: ['Revenue'] },
        llm_settings: {
          temperature: 0.5,
          top_p: 0.8,
          max_tokens: 3000,
          frequency_penalty: 0.2,
          presence_penalty: 0.1
        }
      }
      
      const req = new NextRequest('http://localhost/api/company-types', {
        method: 'POST',
        body: JSON.stringify(newTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const res = await POST(req)
      
      expect(res.status).toBe(200)
    })

    it('should validate LLM settings ranges', async () => {
      const { POST } = await import('@/app/api/company-types/route')
      
      const invalidTemplate = {
        name: 'Test Template',
        llm_settings: {
          temperature: 2.5, // Invalid: > 2
          top_p: -0.1 // Invalid: < 0
        }
      }
      
      const req = new NextRequest('http://localhost/api/company-types', {
        method: 'POST',
        body: JSON.stringify(invalidTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const res = await POST(req)
      
      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/company-types/[id]', () => {
    it('should update existing company type', async () => {
      const { PUT } = await import('@/app/api/company-types/[id]/route')
      
      const updates = {
        name: 'Updated Name',
        llm_settings: {
          temperature: 0.7,
          top_p: 0.95
        }
      }
      
      const req = new NextRequest('http://localhost/api/company-types/hospitality_reit', {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const res = await PUT(req, { params: { id: 'hospitality_reit' } })
      
      expect(res.status).toBe(200)
    })

    it('should preserve existing LLM settings when partially updating', async () => {
      const { PUT } = await import('@/app/api/company-types/[id]/route')
      
      const partialUpdate = {
        llm_settings: {
          temperature: 0.8
          // Other settings should be preserved
        }
      }
      
      const req = new NextRequest('http://localhost/api/company-types/hospitality_reit', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const res = await PUT(req, { params: { id: 'hospitality_reit' } })
      
      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /api/company-types/[id]', () => {
    it('should delete company type for admin user', async () => {
      const { DELETE } = await import('@/app/api/company-types/[id]/route')
      
      const req = new NextRequest('http://localhost/api/company-types/hospitality_reit', {
        method: 'DELETE'
      })
      
      const res = await DELETE(req, { params: { id: 'hospitality_reit' } })
      
      expect(res.status).toBe(200)
    })
  })

  describe('Template validation', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/company-types/route')
      
      const incompleteTemplate = {
        name: 'Test' // Missing required fields
      }
      
      const req = new NextRequest('http://localhost/api/company-types', {
        method: 'POST',
        body: JSON.stringify(incompleteTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const res = await POST(req)
      
      expect(res.status).toBe(400)
    })

    it('should validate JSON structure for rules and metrics', async () => {
      const { POST } = await import('@/app/api/company-types/route')
      
      const templateWithInvalidJSON = {
        name: 'Test',
        classification_rules: 'invalid-json-string',
        key_metrics: { valid: 'json' }
      }
      
      const req = new NextRequest('http://localhost/api/company-types', {
        method: 'POST',
        body: JSON.stringify(templateWithInvalidJSON),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const res = await POST(req)
      
      expect(res.status).toBe(400)
    })
  })
})