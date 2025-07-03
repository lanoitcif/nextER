import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { createLLMClient, SUPPORTED_PROVIDERS, type SupportedProvider } from '@/lib/llm/clients'
import { decryptFromStorage } from '@/lib/crypto'

interface AnalyzeRequest {
  transcript: string
  promptId: string
  keySource: 'owner' | 'user_saved' | 'user_temporary'
  userApiKeyId?: string
  temporaryApiKey?: string
  provider: SupportedProvider
  model?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Parse the request body
    const body: AnalyzeRequest = await request.json()
    const { transcript, promptId, keySource, userApiKeyId, temporaryApiKey, provider, model } = body

    // Validate required fields
    if (!transcript || !promptId || !keySource || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      )
    }

    // Get the user's profile to check permissions
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Get the prompt
    const { data: prompt, error: promptError } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .eq('is_active', true)
      .single()

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt not found or inactive' },
        { status: 404 }
      )
    }

    // Determine which API key to use
    let apiKey: string
    let usedOwnerKey = false

    switch (keySource) {
      case 'owner':
        // Check if user is authorized to use owner key
        if (!userProfile.can_use_owner_key) {
          return NextResponse.json(
            { error: 'Not authorized to use owner API key' },
            { status: 403 }
          )
        }
        
        // Get owner key from environment variables
        const ownerKeyEnvVar = `OWNER_${provider.toUpperCase()}_API_KEY`
        apiKey = process.env[ownerKeyEnvVar]
        
        if (!apiKey) {
          return NextResponse.json(
            { error: `Owner ${provider} API key not configured` },
            { status: 500 }
          )
        }
        
        usedOwnerKey = true
        break

      case 'user_saved':
        if (!userApiKeyId) {
          return NextResponse.json(
            { error: 'User API key ID required for saved key' },
            { status: 400 }
          )
        }

        // Get and decrypt user's saved API key
        const { data: userApiKey, error: keyError } = await supabaseAdmin
          .from('user_api_keys')
          .select('*')
          .eq('id', userApiKeyId)
          .eq('user_id', user.id)
          .eq('provider', provider)
          .single()

        if (keyError || !userApiKey) {
          return NextResponse.json(
            { error: 'User API key not found' },
            { status: 404 }
          )
        }

        try {
          apiKey = decryptFromStorage(userApiKey.encrypted_api_key, userApiKey.encryption_iv)
        } catch (decryptError) {
          return NextResponse.json(
            { error: 'Failed to decrypt API key' },
            { status: 500 }
          )
        }
        break

      case 'user_temporary':
        if (!temporaryApiKey) {
          return NextResponse.json(
            { error: 'Temporary API key required' },
            { status: 400 }
          )
        }
        apiKey = temporaryApiKey
        break

      default:
        return NextResponse.json(
          { error: 'Invalid key source' },
          { status: 400 }
        )
    }

    // Create LLM client and make the request
    try {
      const llmClient = createLLMClient(provider, apiKey)
      
      const response = await llmClient.generateResponse({
        systemPrompt: prompt.system_prompt,
        userMessage: transcript,
        model: model || llmClient.getDefaultModel()
      })

      // Log the usage
      await supabaseAdmin
        .from('usage_logs')
        .insert({
          user_id: user.id,
          provider: provider,
          model: response.model,
          prompt_id: promptId,
          token_count: response.usage?.totalTokens || null,
          cost_estimate: calculateCostEstimate(provider, response.model, response.usage?.totalTokens || 0),
          used_owner_key: usedOwnerKey
        })

      return NextResponse.json({
        success: true,
        result: response.content,
        usage: response.usage,
        model: response.model,
        provider: response.provider
      })

    } catch (llmError: any) {
      console.error('LLM API error:', llmError)
      return NextResponse.json(
        { error: `LLM API error: ${llmError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Simple cost estimation (you'd want to update these with current pricing)
function calculateCostEstimate(provider: string, model: string, tokens: number): number {
  const costPerKToken: Record<string, Record<string, number>> = {
    openai: {
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.00015,
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.0015
    },
    anthropic: {
      'claude-3-5-sonnet-20241022': 0.003,
      'claude-3-haiku-20240307': 0.00025,
      'claude-3-opus-20240229': 0.015
    },
    google: {
      'gemini-1.5-pro': 0.0035,
      'gemini-1.5-flash': 0.00035,
      'gemini-pro': 0.0005
    },
    cohere: {
      'command-r-plus': 0.003,
      'command-r': 0.0005,
      'command': 0.0015
    }
  }

  const providerCosts = costPerKToken[provider]
  if (!providerCosts) return 0

  const modelCost = providerCosts[model]
  if (!modelCost) return 0

  return (tokens / 1000) * modelCost
}