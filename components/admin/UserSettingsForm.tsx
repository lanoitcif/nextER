'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SUPPORTED_PROVIDERS, LLMClient, createLLMClient } from '@/lib/llm/clients'

interface UserSettingsFormProps {
  user: { id: string; default_provider: string | null; default_model: string | null }
  onSave: () => void
  onCancel: () => void
}

export default function UserSettingsForm({ user, onSave, onCancel }: UserSettingsFormProps) {
  const [provider, setProvider] = useState(user.default_provider || '')
  const [model, setModel] = useState(user.default_model || '')
  const [models, setModels] = useState<string[]>([])
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (provider) {
      const client = createLLMClient(provider, 'dummy-key') // API key not needed to get models
      setModels(client.getAvailableModels())
    }
  }, [provider])

  const handleSave = async () => {
    setUpdating(true)
    setError('')
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user.id, default_provider: provider, default_model: model })
    })
    if (res.ok) {
      onSave()
    } else {
      const r = await res.json()
      setError(r.error || 'Failed to update')
    }
    setUpdating(false)
  }

  const handleReset = async () => {
    setUpdating(true)
    setError('')
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user.id })
    })
    if (res.ok) {
      onSave()
    } else {
      const r = await res.json()
      setError(r.error || 'Failed to reset')
    }
    setUpdating(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-charcoal p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-cream-glow mb-4">Edit User LLM Settings</h2>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cream-glow/70">LLM Provider</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="bg-charcoal border border-grape-static text-cream-glow p-2 rounded-md w-full"
            >
              <option value="">System Default</option>
              {SUPPORTED_PROVIDERS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-cream-glow/70">LLM Model</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={!provider}
              className="bg-charcoal border border-grape-static text-cream-glow p-2 rounded-md w-full"
            >
              <option value="">Provider Default</option>
              {models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleReset}
            disabled={updating}
            className="btn-secondary"
          >
            Reset to Default
          </button>
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              disabled={updating}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updating}
              className="btn-primary"
            >
              {updating ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
