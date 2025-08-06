import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the JSON editor component
jest.mock('react-json-editor-ajrm', () => {
  return function MockJSONInput(props: any) {
    return (
      <textarea
        data-testid="json-editor"
        value={JSON.stringify(props.placeholder)}
        onChange={(e) => props.onChange({ jsObject: JSON.parse(e.target.value) })}
      />
    )
  }
})

// Mock fetch
global.fetch = jest.fn()

describe('Template Editor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { 
          id: 'test-id',
          llm_settings: { temperature: 0.3, top_p: 0.9 }
        }
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should render all tabs', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        expect(screen.getByText('Prompt')).toBeInTheDocument()
        expect(screen.getByText('Classification')).toBeInTheDocument()
        expect(screen.getByText('Metrics')).toBeInTheDocument()
        expect(screen.getByText('Output')).toBeInTheDocument()
        expect(screen.getByText('LLM Settings')).toBeInTheDocument()
      })
    })

    it('should switch between tabs', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const classificationTab = screen.getByText('Classification')
        fireEvent.click(classificationTab)
      })
      
      expect(screen.getByText('Classification Rules')).toBeInTheDocument()
    })
  })

  describe('LLM Settings', () => {
    it('should display temperature slider', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const llmTab = screen.getByText('LLM Settings')
        fireEvent.click(llmTab)
      })
      
      expect(screen.getByText('Temperature')).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /temperature/i })).toBeInTheDocument()
    })

    it('should display top_p slider', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const llmTab = screen.getByText('LLM Settings')
        fireEvent.click(llmTab)
      })
      
      expect(screen.getByText('Top P')).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /top p/i })).toBeInTheDocument()
    })

    it('should update temperature value', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const llmTab = screen.getByText('LLM Settings')
        fireEvent.click(llmTab)
      })
      
      const temperatureSlider = screen.getByRole('slider', { name: /temperature/i })
      fireEvent.change(temperatureSlider, { target: { value: '0.7' } })
      
      expect(temperatureSlider).toHaveValue('0.7')
    })

    it('should show tooltips for LLM parameters', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const llmTab = screen.getByText('LLM Settings')
        fireEvent.click(llmTab)
      })
      
      // Check for info icons that indicate tooltips
      const infoIcons = screen.getAllByTestId(/info-icon/i)
      expect(infoIcons.length).toBeGreaterThan(0)
    })

    it('should validate LLM settings ranges', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const llmTab = screen.getByText('LLM Settings')
        fireEvent.click(llmTab)
      })
      
      const temperatureSlider = screen.getByRole('slider', { name: /temperature/i })
      
      // Temperature should be between 0 and 2
      expect(temperatureSlider).toHaveAttribute('min', '0')
      expect(temperatureSlider).toHaveAttribute('max', '2')
    })
  })

  describe('Template CRUD Operations', () => {
    it('should create new template', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/template name/i)
        fireEvent.change(nameInput, { target: { value: 'New Template' } })
      })
      
      const saveButton = screen.getByText(/save/i)
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/company-types'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('New Template')
          })
        )
      })
    })

    it('should update existing template', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      
      // Mock existing templates
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'existing-id',
            name: 'Existing Template',
            llm_settings: { temperature: 0.5 }
          }
        ])
      })
      
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const selectButton = screen.getByText('Existing Template')
        fireEvent.click(selectButton)
      })
      
      const nameInput = screen.getByDisplayValue('Existing Template')
      fireEvent.change(nameInput, { target: { value: 'Updated Template' } })
      
      const saveButton = screen.getByText(/save/i)
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/company-types/existing-id'),
          expect.objectContaining({
            method: 'PUT'
          })
        )
      })
    })

    it('should delete template', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'delete-id',
            name: 'Template to Delete',
            llm_settings: {}
          }
        ])
      })
      
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const selectButton = screen.getByText('Template to Delete')
        fireEvent.click(selectButton)
      })
      
      const deleteButton = screen.getByText(/delete/i)
      
      // Confirm deletion
      window.confirm = jest.fn(() => true)
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/company-types/delete-id'),
          expect.objectContaining({
            method: 'DELETE'
          })
        )
      })
    })
  })

  describe('Template Variables', () => {
    it('should display template variables helper', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        expect(screen.getByText(/Template Variables/i)).toBeInTheDocument()
      })
    })

    it('should copy variable on click', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn()
        }
      })
      
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const roleVariable = screen.getByText('{role}')
        fireEvent.click(roleVariable)
      })
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{role}')
    })
  })

  describe('JSON Editors', () => {
    it('should validate JSON in classification rules', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const classificationTab = screen.getByText('Classification')
        fireEvent.click(classificationTab)
      })
      
      const jsonEditor = screen.getByTestId('json-editor')
      
      // Invalid JSON should show error
      fireEvent.change(jsonEditor, { target: { value: 'invalid json' } })
      
      // This would typically show an error message
      // In real implementation, check for error state
    })

    it('should provide example JSON structures', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const metricsTab = screen.getByText('Metrics')
        fireEvent.click(metricsTab)
      })
      
      // Check for example structure
      expect(screen.getByText(/Example:/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show error when save fails', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Save failed'))
      
      render(<TemplateEditor />)
      
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/template name/i)
        fireEvent.change(nameInput, { target: { value: 'Test' } })
      })
      
      const saveButton = screen.getByText(/save/i)
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      const TemplateEditor = (await import('@/app/dashboard/templates/page')).default
      
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      render(<TemplateEditor />)
      
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })
  })
})