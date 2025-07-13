import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { encryptForStorage } from '@/lib/crypto'
import { SUPPORTED_PROVIDERS, type SupportedProvider } from '@/lib/llm/clients'

interface AddApiKeyRequest {
  provider: SupportedProvider
  apiKey: string
  nickname?: string
  preferredModel?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

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
    const body: AddApiKeyRequest = await request.json()
    const { provider, apiKey, nickname, preferredModel } = body

    // Validate required fields
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      )
    }

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      )
    }

    // Check if user already has a key with this provider/nickname combination
    const { data: existingKey, error: checkError } = await supabaseAdmin
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('nickname', nickname || null)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing key:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing keys' },
        { status: 500 }
      )
    }

    if (existingKey) {
      return NextResponse.json(
        { error: 'You already have an API key with this provider and nickname' },
        { status: 409 }
      )
    }

    // Encrypt the API key
    const { encrypted, iv } = encryptForStorage(apiKey)

    // Save the encrypted API key
    const { data, error } = await supabaseAdmin
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        provider,
        encrypted_api_key: encrypted,
        encryption_iv: iv,
        nickname: nickname || null,
        preferred_model: preferredModel || null
      })
      .select('id, provider, nickname, preferred_model, created_at')
      .single()

    if (error) {
      console.error('Error saving API key:', error)
      return NextResponse.json(
        { error: 'Failed to save API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      apiKey: data
    })

  } catch (error: any) {
    console.error('Add API key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

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

    // Get user's API keys (without the actual encrypted keys)
    const { data: apiKeys, error } = await supabaseAdmin
      .from('user_api_keys')
      .select('id, provider, nickname, preferred_model, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys || []
    })

  } catch (error: any) {
    console.error('Get API keys error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}