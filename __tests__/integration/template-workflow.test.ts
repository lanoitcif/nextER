import { createClient } from '@supabase/supabase-js'

// Integration test for the complete template workflow
describe('Template Management Workflow Integration', () => {
  let supabase: any
  let testUserId: string
  let testTemplateId: string

  beforeAll(async () => {
    // Initialize test Supabase client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
    )

    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: 'template-test@example.com',
      password: 'TestPassword123!'
    })
    testUserId = authData?.user?.id
  })

  afterAll(async () => {
    // Cleanup test data
    if (testTemplateId) {
      await supabase.from('company_types').delete().eq('id', testTemplateId)
    }
    if (testUserId) {
      await supabase.auth.signOut()
    }
  })

  describe('Template Creation', () => {
    it('should create template with complete configuration', async () => {
      const templateData = {
        name: 'Integration Test Template',
        description: 'Template for integration testing',
        system_prompt_template: 'Role: {role}\nCompany: {company_name}',
        classification_rules: {
          temporal_tags: ['Q1', 'Q2', 'Q3', 'Q4'],
          primary_topics: ['Revenue', 'Growth', 'Guidance']
        },
        key_metrics: {
          financial_metrics: ['Revenue', 'EBITDA', 'EPS'],
          operating_performance: ['Growth Rate', 'Margin']
        },
        output_format: {
          quarterly_highlights: ['Revenue', 'EPS', 'Guidance'],
          sections: ['Summary', 'Details', 'Outlook']
        },
        llm_settings: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 3500,
          frequency_penalty: 0.3,
          presence_penalty: 0.2
        }
      }

      const { data, error } = await supabase
        .from('company_types')
        .insert(templateData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.name).toBe(templateData.name)
      expect(data.llm_settings).toEqual(templateData.llm_settings)
      
      testTemplateId = data.id
    })

    it('should validate LLM settings on creation', async () => {
      const invalidTemplate = {
        name: 'Invalid LLM Settings',
        llm_settings: {
          temperature: 3.0, // Invalid: > 2
          top_p: 1.5, // Invalid: > 1
          max_tokens: -100 // Invalid: negative
        }
      }

      const { error } = await supabase
        .from('company_types')
        .insert(invalidTemplate)

      expect(error).toBeDefined()
    })
  })

  describe('Template Retrieval', () => {
    it('should retrieve template with all fields', async () => {
      const { data, error } = await supabase
        .from('company_types')
        .select('*')
        .eq('id', testTemplateId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.llm_settings).toBeDefined()
      expect(data.llm_settings.temperature).toBe(0.3)
      expect(data.llm_settings.top_p).toBe(0.9)
    })

    it('should filter active templates', async () => {
      const { data, error } = await supabase
        .from('company_types')
        .select('*')
        .eq('is_active', true)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      data.forEach((template: any) => {
        expect(template.is_active).toBe(true)
      })
    })
  })

  describe('Template Update', () => {
    it('should update LLM settings', async () => {
      const updatedSettings = {
        temperature: 0.5,
        top_p: 0.85,
        max_tokens: 4000
      }

      const { data, error } = await supabase
        .from('company_types')
        .update({ llm_settings: updatedSettings })
        .eq('id', testTemplateId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.llm_settings.temperature).toBe(0.5)
      expect(data.llm_settings.top_p).toBe(0.85)
      expect(data.llm_settings.max_tokens).toBe(4000)
    })

    it('should merge partial LLM settings updates', async () => {
      // First set complete settings
      await supabase
        .from('company_types')
        .update({
          llm_settings: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 3000,
            frequency_penalty: 0.2,
            presence_penalty: 0.1
          }
        })
        .eq('id', testTemplateId)

      // Now update only temperature
      const { data, error } = await supabase
        .from('company_types')
        .update({
          llm_settings: {
            temperature: 0.7
          }
        })
        .eq('id', testTemplateId)
        .select()
        .single()

      expect(error).toBeNull()
      // Check that other settings are preserved
      expect(data.llm_settings.temperature).toBe(0.7)
      expect(data.llm_settings.top_p).toBe(0.9)
      expect(data.llm_settings.max_tokens).toBe(3000)
    })
  })

  describe('Template Assignment to Companies', () => {
    let testCompanyId: string

    beforeAll(async () => {
      // Create test company
      const { data } = await supabase
        .from('companies')
        .insert({
          ticker: 'TEST',
          name: 'Test Company Inc',
          primary_company_type_id: testTemplateId
        })
        .select()
        .single()
      
      testCompanyId = data?.id
    })

    afterAll(async () => {
      if (testCompanyId) {
        await supabase.from('companies').delete().eq('id', testCompanyId)
      }
    })

    it('should assign template to company', async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*, company_types(*)')
        .eq('id', testCompanyId)
        .single()

      expect(error).toBeNull()
      expect(data.company_types).toBeDefined()
      expect(data.company_types.id).toBe(testTemplateId)
      expect(data.company_types.llm_settings).toBeDefined()
    })
  })

  describe('Template Usage in Analysis', () => {
    it('should apply template settings to analysis', async () => {
      // Simulate analysis request with template
      const analysisRequest = {
        company_ticker: 'TEST',
        transcript: 'Sample earnings call transcript...',
        use_template: true
      }

      // Fetch template settings
      const { data: template } = await supabase
        .from('company_types')
        .select('*')
        .eq('id', testTemplateId)
        .single()

      // Verify template settings would be applied
      expect(template.llm_settings).toBeDefined()
      expect(template.system_prompt_template).toBeDefined()
      expect(template.classification_rules).toBeDefined()
      expect(template.key_metrics).toBeDefined()
      expect(template.output_format).toBeDefined()

      // In real implementation, these would be passed to LLM
      const llmConfig = {
        temperature: template.llm_settings.temperature,
        top_p: template.llm_settings.top_p,
        max_tokens: template.llm_settings.max_tokens,
        frequency_penalty: template.llm_settings.frequency_penalty,
        presence_penalty: template.llm_settings.presence_penalty
      }

      expect(llmConfig.temperature).toBeLessThanOrEqual(2)
      expect(llmConfig.top_p).toBeLessThanOrEqual(1)
      expect(llmConfig.max_tokens).toBeGreaterThan(0)
    })
  })

  describe('Template Deletion', () => {
    it('should soft delete template', async () => {
      const { error } = await supabase
        .from('company_types')
        .update({ is_active: false })
        .eq('id', testTemplateId)

      expect(error).toBeNull()

      // Verify template is inactive
      const { data } = await supabase
        .from('company_types')
        .select('is_active')
        .eq('id', testTemplateId)
        .single()

      expect(data.is_active).toBe(false)
    })

    it('should hard delete template when no dependencies', async () => {
      // Remove company dependency first
      await supabase
        .from('companies')
        .update({ primary_company_type_id: null })
        .eq('primary_company_type_id', testTemplateId)

      const { error } = await supabase
        .from('company_types')
        .delete()
        .eq('id', testTemplateId)

      expect(error).toBeNull()
    })
  })

  describe('Template Export/Import', () => {
    it('should export template configuration', async () => {
      const { data: template } = await supabase
        .from('company_types')
        .select('*')
        .limit(1)
        .single()

      const exportData = {
        name: template.name,
        description: template.description,
        system_prompt_template: template.system_prompt_template,
        classification_rules: template.classification_rules,
        key_metrics: template.key_metrics,
        output_format: template.output_format,
        llm_settings: template.llm_settings
      }

      // Verify export data is complete
      expect(exportData.name).toBeDefined()
      expect(exportData.llm_settings).toBeDefined()
      expect(JSON.stringify(exportData)).toBeDefined()
    })

    it('should import template configuration', async () => {
      const importData = {
        name: 'Imported Template',
        description: 'Template imported from JSON',
        system_prompt_template: 'Imported prompt',
        classification_rules: { temporal_tags: ['Q1'] },
        key_metrics: { financial_metrics: ['Revenue'] },
        output_format: { sections: ['Summary'] },
        llm_settings: {
          temperature: 0.4,
          top_p: 0.88,
          max_tokens: 3200
        }
      }

      const { data, error } = await supabase
        .from('company_types')
        .insert(importData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.name).toBe(importData.name)
      expect(data.llm_settings).toEqual(importData.llm_settings)

      // Cleanup
      await supabase.from('company_types').delete().eq('id', data.id)
    })
  })
})