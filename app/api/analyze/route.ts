import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLLMClient, SUPPORTED_PROVIDERS, type SupportedProvider } from '@/lib/llm/clients'
import { decryptFromStorage } from '@/lib/crypto'
import { analyzeRequestSchema } from '@/lib/api/validation'
import { handleError } from '@/lib/api/errors'

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  console.log(`[${requestId}] Analysis request received at ${new Date().toISOString()}`)
  
  // Authentication
  const supabase = await createClient()
  const authHeader = request.headers.get('authorization')
  console.log(`[${requestId}] Auth header present:`, !!authHeader)
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[${requestId}] Missing or invalid authorization header`)
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  console.log(`[${requestId}] Token length:`, token.length)
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    console.log(`[${requestId}] Auth failed:`, { authError, hasUser: !!user })
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    )
  }
  
  const supabaseAdmin = await createClient()
  
  console.log(`[${requestId}] Authentication successful for user: ${user.email}`)
  
  try {
    const userId = user.id
    console.log(`[${requestId}] User authenticated: ${user.email} (${user.id})`)

    // Parse and validate the request body
    const body = await request.json()
    const validation = analyzeRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { transcript, companyId, companyTypeId, keySource, userApiKeyId, temporaryApiKey, provider, model } = validation.data

    console.log(`[${requestId}] Request details:`, {
      transcriptLength: transcript?.length || 0,
      companyId,
      companyTypeId,
      keySource,
      provider,
      model,
      hasUserApiKeyId: !!userApiKeyId,
      hasTemporaryApiKey: !!temporaryApiKey
    })

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

    // Get the company type with its system prompt template
    const { data: companyType, error: companyTypeError } = await supabaseAdmin
      .from('company_types')
      .select('*')
      .eq('id', companyTypeId)
      .eq('is_active', true)
      .single()

    if (companyTypeError || !companyType) {
      return NextResponse.json(
        { error: 'Company type not found or inactive' },
        { status: 404 }
      )
    }

    // Get the company details
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('is_active', true)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found or inactive' },
        { status: 404 }
      )
    }

    // Build the system prompt from the template
    let systemPrompt = companyType.system_prompt_template || `You are a financial analyst specializing in ${companyType.name} companies. Please provide a detailed analysis of this earnings transcript.`
    
    // Only apply template replacements if the template contains placeholders
    if (systemPrompt.includes('{')) {
      systemPrompt = systemPrompt
        .replace('{role}', `You are a financial analyst specializing in ${companyType.name} companies.`)
        .replace('{classification_rules}', JSON.stringify(companyType.classification_rules || {}))
        .replace('{temporal_tags}', JSON.stringify(companyType.classification_rules?.temporal_tags || []))
        .replace('{operating_metrics}', JSON.stringify(companyType.key_metrics?.operating_performance || []))
        .replace('{segment_metrics}', JSON.stringify(companyType.key_metrics?.segment_performance || []))
        .replace('{financial_metrics}', JSON.stringify(companyType.key_metrics?.financial_metrics || []))
        .replace('{validation_rules}', (companyType.validation_rules || []).join(', '))
        .replace('{special_considerations}', JSON.stringify(companyType.special_considerations || {}))
    }
    
    console.log(`[${requestId}] System prompt prepared (length: ${systemPrompt.length})`)

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
        const ownerApiKey = process.env[ownerKeyEnvVar]
        
        console.log(`[${requestId}] Looking for env var: ${ownerKeyEnvVar}, found: ${!!ownerApiKey}`)
        
        if (!ownerApiKey) {
          console.log(`[${requestId}] Owner ${provider} API key not configured`)
          return NextResponse.json(
            { error: `Owner ${provider} API key not configured` },
            { status: 500 }
          )
        }
        
        apiKey = ownerApiKey
        
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
      console.log(`[${requestId}] Creating LLM client for provider: ${provider}`)
      const llmClient = createLLMClient(provider, apiKey)
      
      const llmStartTime = Date.now()
      console.log(`[${requestId}] Starting LLM API call with model: ${model || llmClient.getDefaultModel()}`)
      
      const response = await llmClient.generateResponse({
        systemPrompt: systemPrompt,
        userMessage: transcript,
        model: model || llmClient.getDefaultModel()
      })
      
      const llmEndTime = Date.now()
      console.log(`[${requestId}] LLM API call completed in ${llmEndTime - llmStartTime}ms`, {
        model: response.model,
        totalTokens: response.usage?.totalTokens,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens
      })

      // Log the usage
      await supabaseAdmin
        .from('usage_logs')
        .insert({
          user_id: user.id,
          provider: provider,
          model: response.model,
          prompt_id: null, // No longer using specific prompt IDs, using company types instead
          token_count: response.usage?.totalTokens || null,
          cost_estimate: calculateCostEstimate(provider, response.model, response.usage?.totalTokens || 0),
          used_owner_key: usedOwnerKey
        })

      const totalTime = Date.now() - startTime
      console.log(`[${requestId}] Analysis completed successfully in ${totalTime}ms`, {
        analysisLength: response.content.length,
        costEstimate: calculateCostEstimate(provider, response.model, response.usage?.totalTokens || 0),
        usedOwnerKey
      })

      return NextResponse.json({
        success: true,
        analysis: response.content,
        usage: response.usage,
        model: response.model,
        provider: response.provider
      })

    } catch (llmError: any) {
      const totalTime = Date.now() - startTime
      console.error(`[${requestId}] LLM API error after ${totalTime}ms:`, {
        error: llmError.message,
        provider,
        model,
        userId,
        keySource
      })
      return NextResponse.json(
        { error: `LLM API error: ${llmError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    return handleError(error)
  }
}

// Updated cost estimation with 2025 pricing
function calculateCostEstimate(provider: string, model: string, tokens: number): number {
  const costPerKToken: Record<string, Record<string, number>> = {
    openai: {
      // GPT-4.1 Series (2025) - Estimated pricing
      'gpt-4.1': 0.006,
      'gpt-4.1-mini': 0.0001,
      'gpt-4.1-nano': 0.00005,
      // Reasoning Models - Higher cost for complex reasoning
      'o3': 0.020,
      'o3-pro': 0.030,
      'o4-mini': 0.010,
      'o4-mini-high': 0.015,
      // GPT-4o Series
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.00015,
      'gpt-4o-audio': 0.007,
      // Legacy Models
      'gpt-4-turbo': 0.01,
      'gpt-4': 0.015,
      'gpt-3.5-turbo': 0.0015,
      // Image Generation
      'gpt-image-1': 0.008
    },
    anthropic: {
      // Claude 4 Series (2025)
      'claude-4-opus': 0.020,
      'claude-4-sonnet': 0.004,
      // Claude 3.7 Series
      'claude-3.7-sonnet': 0.0035,
      // Claude 3.5 Series
      'claude-3-5-sonnet-20241022': 0.003,
      'claude-3-5-haiku-20241022': 0.0003,
      // Claude 3 Series
      'claude-3-opus-20240229': 0.015,
      'claude-3-sonnet-20240229': 0.003,
      'claude-3-haiku-20240307': 0.00025
    },
    google: {
      // Gemini 2.5 Series
      'gemini-2.5-flash': 0.0002,
      'gemini-2.5-pro': 0.004,
      'gemini-2.5-flash-lite': 0.0001,
      // Gemini 2.0 Series
      'gemini-2.0-flash': 0.0003,
      'gemini-2.0-flash-lite': 0.00015,
      // Gemini 1.5 Series
      'gemini-1.5-pro': 0.0035,
      'gemini-1.5-flash': 0.00035,
      'gemini-1.5-flash-8b': 0.0002,
      // Gemma Models
      'gemma-3': 0.0001,
      'gemma-2': 0.00008
    },
    cohere: {
      // Latest Command Models (2025)
      'command-a-03-2025': 0.0025,
      // Command R Series (2024)
      'command-r-plus-08-2024': 0.003,
      'command-r-08-2024': 0.0005,
      'command-r7b': 0.0003,
      // Legacy Models
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
