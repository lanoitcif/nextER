'use client'

import { useState, useEffect } from 'react'
import { Key, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { PROVIDER_MODELS, DEFAULT_MODELS } from '@/lib/config/llm-models'

interface UserApiKey {
  id: string
  provider: string
  nickname: string
  default_model?: string
}

interface ApiConfigurationProps {
  keySource: 'owner' | 'user_saved' | 'user_temporary'
  onKeySourceChange: (source: 'owner' | 'user_saved' | 'user_temporary') => void
  selectedApiKey: string
  onApiKeyChange: (key: string) => void
  temporaryApiKey: string
  onTemporaryKeyChange: (key: string) => void
  provider: 'openai' | 'anthropic' | 'google' | 'cohere'
  onProviderChange: (provider: 'openai' | 'anthropic' | 'google' | 'cohere') => void
  selectedModel: string
  onModelChange: (model: string) => void
  canUseOwnerKey: boolean
  disabled?: boolean
}

export default function ApiConfiguration({
  keySource,
  onKeySourceChange,
  selectedApiKey,
  onApiKeyChange,
  temporaryApiKey,
  onTemporaryKeyChange,
  provider,
  onProviderChange,
  selectedModel,
  onModelChange,
  canUseOwnerKey,
  disabled = false
}: ApiConfigurationProps) {
  const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>([])
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    fetchUserApiKeys()
  }, [])

  const fetchUserApiKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, provider, nickname, default_model')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setUserApiKeys(data)
        
        // Auto-select first key if available
        if (data.length > 0 && keySource === 'user_saved' && !selectedApiKey) {
          onApiKeyChange(data[0].id)
          onProviderChange(data[0].provider as any)
          if (data[0].default_model) {
            onModelChange(data[0].default_model)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const availableModels = PROVIDER_MODELS[provider] || []

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          API Key Source
        </label>
        <div className="grid grid-cols-3 gap-2">
          {canUseOwnerKey && (
            <button
              onClick={() => onKeySourceChange('owner')}
              className={`btn-secondary py-2 px-3 text-sm ${
                keySource === 'owner' ? 'ring-2 ring-primary' : ''
              }`}
              disabled={disabled}
            >
              System Key
            </button>
          )}
          <button
            onClick={() => onKeySourceChange('user_saved')}
            className={`btn-secondary py-2 px-3 text-sm ${
              keySource === 'user_saved' ? 'ring-2 ring-primary' : ''
            }`}
            disabled={disabled || userApiKeys.length === 0}
          >
            Saved Keys ({userApiKeys.length})
          </button>
          <button
            onClick={() => onKeySourceChange('user_temporary')}
            className={`btn-secondary py-2 px-3 text-sm ${
              keySource === 'user_temporary' ? 'ring-2 ring-primary' : ''
            }`}
            disabled={disabled}
          >
            Enter Key
          </button>
        </div>
      </div>

      {/* Saved Keys Selection */}
      {keySource === 'user_saved' && userApiKeys.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Select API Key
          </label>
          <select
            value={selectedApiKey}
            onChange={(e) => {
              onApiKeyChange(e.target.value)
              const key = userApiKeys.find(k => k.id === e.target.value)
              if (key) {
                onProviderChange(key.provider as any)
                if (key.default_model) {
                  onModelChange(key.default_model)
                }
              }
            }}
            className="input"
            disabled={disabled}
          >
            <option value="">Select a key...</option>
            {userApiKeys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.nickname || `${key.provider} API Key`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Temporary Key Input */}
      {keySource === 'user_temporary' && (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => {
                onProviderChange(e.target.value as any)
                onModelChange(DEFAULT_MODELS[e.target.value as any] || '')
              }}
              className="input"
              disabled={disabled}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="cohere">Cohere</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={temporaryApiKey}
                onChange={(e) => onTemporaryKeyChange(e.target.value)}
                placeholder="Enter your API key"
                className="input pr-10"
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Key className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="input"
          disabled={disabled || availableModels.length === 0}
        >
          <option value="">Select a model...</option>
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Info Messages */}
      {keySource === 'owner' && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          Using system API key (no charges to you)
        </div>
      )}
      {keySource === 'user_saved' && userApiKeys.length === 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          No saved API keys. Add keys in Settings → API Keys
        </div>
      )}
    </div>
  )
}