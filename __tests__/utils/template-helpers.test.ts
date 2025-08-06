/**
 * Tests for template management utility functions
 */

describe('Template Helpers', () => {
  describe('Template Variable Substitution', () => {
    it('should replace role variable', () => {
      const template = 'Role: {role}';
      const variables = { role: 'Senior Analyst' };
      const result = template.replace(/{(\w+)}/g, (match, key) => variables[key] || match);
      expect(result).toBe('Role: Senior Analyst');
    });

    it('should replace multiple variables', () => {
      const template = 'Role: {role}, Company: {company_name}, Type: {company_type}';
      const variables = {
        role: 'Analyst',
        company_name: 'Test Corp',
        company_type: 'Technology'
      };
      const result = template.replace(/{(\w+)}/g, (match, key) => variables[key] || match);
      expect(result).toBe('Role: Analyst, Company: Test Corp, Type: Technology');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Role: {role}, Unknown: {unknown_var}';
      const variables = { role: 'Analyst' };
      const result = template.replace(/{(\w+)}/g, (match, key) => variables[key] || match);
      expect(result).toBe('Role: Analyst, Unknown: {unknown_var}');
    });
  });

  describe('LLM Settings Validation', () => {
    function validateLLMSettings(settings: any) {
      const errors = [];
      
      if (settings.temperature !== undefined) {
        if (settings.temperature < 0 || settings.temperature > 2) {
          errors.push('Temperature must be between 0 and 2');
        }
      }
      
      if (settings.top_p !== undefined) {
        if (settings.top_p < 0 || settings.top_p > 1) {
          errors.push('Top P must be between 0 and 1');
        }
      }
      
      if (settings.max_tokens !== undefined) {
        if (settings.max_tokens < 1) {
          errors.push('Max tokens must be positive');
        }
      }
      
      if (settings.frequency_penalty !== undefined) {
        if (settings.frequency_penalty < -2 || settings.frequency_penalty > 2) {
          errors.push('Frequency penalty must be between -2 and 2');
        }
      }
      
      if (settings.presence_penalty !== undefined) {
        if (settings.presence_penalty < -2 || settings.presence_penalty > 2) {
          errors.push('Presence penalty must be between -2 and 2');
        }
      }
      
      return errors;
    }

    it('should accept valid LLM settings', () => {
      const settings = {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 3000,
        frequency_penalty: 0.3,
        presence_penalty: 0.2
      };
      const errors = validateLLMSettings(settings);
      expect(errors).toEqual([]);
    });

    it('should reject invalid temperature', () => {
      const settings = { temperature: 2.5 };
      const errors = validateLLMSettings(settings);
      expect(errors).toContain('Temperature must be between 0 and 2');
    });

    it('should reject negative temperature', () => {
      const settings = { temperature: -0.5 };
      const errors = validateLLMSettings(settings);
      expect(errors).toContain('Temperature must be between 0 and 2');
    });

    it('should reject invalid top_p', () => {
      const settings = { top_p: 1.5 };
      const errors = validateLLMSettings(settings);
      expect(errors).toContain('Top P must be between 0 and 1');
    });

    it('should reject negative max_tokens', () => {
      const settings = { max_tokens: -100 };
      const errors = validateLLMSettings(settings);
      expect(errors).toContain('Max tokens must be positive');
    });

    it('should validate multiple settings at once', () => {
      const settings = {
        temperature: 3.0,
        top_p: -0.1,
        max_tokens: 0
      };
      const errors = validateLLMSettings(settings);
      expect(errors.length).toBe(3);
    });

    it('should accept boundary values', () => {
      const settings = {
        temperature: 0,
        top_p: 1,
        frequency_penalty: -2,
        presence_penalty: 2
      };
      const errors = validateLLMSettings(settings);
      expect(errors).toEqual([]);
    });
  });

  describe('Template JSON Merging', () => {
    function mergeTemplateSettings(base: any, updates: any) {
      return {
        ...base,
        ...updates,
        llm_settings: {
          ...base?.llm_settings,
          ...updates?.llm_settings
        }
      };
    }

    it('should merge LLM settings correctly', () => {
      const base = {
        name: 'Base Template',
        llm_settings: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 3000
        }
      };
      
      const updates = {
        llm_settings: {
          temperature: 0.7,
          max_tokens: 4000
        }
      };
      
      const result = mergeTemplateSettings(base, updates);
      
      expect(result.name).toBe('Base Template');
      expect(result.llm_settings.temperature).toBe(0.7);
      expect(result.llm_settings.top_p).toBe(0.9); // Preserved
      expect(result.llm_settings.max_tokens).toBe(4000);
    });

    it('should handle missing base settings', () => {
      const base = { name: 'Template' };
      const updates = {
        llm_settings: {
          temperature: 0.5
        }
      };
      
      const result = mergeTemplateSettings(base, updates);
      
      expect(result.llm_settings.temperature).toBe(0.5);
    });

    it('should handle complete replacement', () => {
      const base = {
        name: 'Old',
        description: 'Old description',
        llm_settings: { temperature: 0.3 }
      };
      
      const updates = {
        name: 'New',
        description: 'New description',
        llm_settings: { temperature: 0.7, top_p: 0.8 }
      };
      
      const result = mergeTemplateSettings(base, updates);
      
      expect(result.name).toBe('New');
      expect(result.description).toBe('New description');
      expect(result.llm_settings.temperature).toBe(0.7);
      expect(result.llm_settings.top_p).toBe(0.8);
    });
  });

  describe('Template Export/Import', () => {
    function exportTemplate(template: any) {
      const exportData = {
        version: '1.0.0',
        name: template.name,
        description: template.description,
        system_prompt_template: template.system_prompt_template,
        classification_rules: template.classification_rules,
        key_metrics: template.key_metrics,
        output_format: template.output_format,
        llm_settings: template.llm_settings
      };
      return JSON.stringify(exportData, null, 2);
    }

    function importTemplate(jsonString: string) {
      try {
        const data = JSON.parse(jsonString);
        if (data.version !== '1.0.0') {
          throw new Error('Unsupported version');
        }
        delete data.version;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    it('should export template to JSON', () => {
      const template = {
        name: 'Export Test',
        description: 'Test template',
        llm_settings: { temperature: 0.5 }
      };
      
      const exported = exportTemplate(template);
      const parsed = JSON.parse(exported);
      
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.name).toBe('Export Test');
      expect(parsed.llm_settings.temperature).toBe(0.5);
    });

    it('should import valid template JSON', () => {
      const jsonString = JSON.stringify({
        version: '1.0.0',
        name: 'Import Test',
        llm_settings: { temperature: 0.6 }
      });
      
      const result = importTemplate(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Import Test');
      expect(result.data.llm_settings.temperature).toBe(0.6);
    });

    it('should reject invalid JSON', () => {
      const result = importTemplate('invalid json');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });

    it('should reject unsupported version', () => {
      const jsonString = JSON.stringify({
        version: '2.0.0',
        name: 'Test'
      });
      
      const result = importTemplate(jsonString);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported version');
    });

    it('should round-trip export and import', () => {
      const original = {
        name: 'Round Trip',
        description: 'Test round trip',
        system_prompt_template: 'Test prompt',
        classification_rules: { tags: ['Q1', 'Q2'] },
        key_metrics: { metrics: ['Revenue'] },
        output_format: { sections: ['Summary'] },
        llm_settings: {
          temperature: 0.4,
          top_p: 0.85,
          max_tokens: 3500,
          frequency_penalty: 0.2,
          presence_penalty: 0.15
        }
      };
      
      const exported = exportTemplate(original);
      const imported = importTemplate(exported);
      
      expect(imported.success).toBe(true);
      expect(imported.data.name).toBe(original.name);
      expect(imported.data.llm_settings).toEqual(original.llm_settings);
    });
  });

  describe('Template Defaults', () => {
    function getDefaultLLMSettings() {
      return {
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 3000,
        frequency_penalty: 0.3,
        presence_penalty: 0.2
      };
    }

    it('should provide default LLM settings', () => {
      const defaults = getDefaultLLMSettings();
      
      expect(defaults.temperature).toBe(0.3);
      expect(defaults.top_p).toBe(0.9);
      expect(defaults.max_tokens).toBe(3000);
      expect(defaults.frequency_penalty).toBe(0.3);
      expect(defaults.presence_penalty).toBe(0.2);
    });

    it('should merge with partial settings', () => {
      const defaults = getDefaultLLMSettings();
      const custom = { temperature: 0.7 };
      const merged = { ...defaults, ...custom };
      
      expect(merged.temperature).toBe(0.7);
      expect(merged.top_p).toBe(0.9); // From defaults
    });
  });
});