import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptForStorage } from '@/lib/crypto'
import { addApiKeyRequestSchema } from '@/lib/api/validation'
import { handleError } from '@/lib/api/errors'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    )
  }

  try {
    // Parse and validate the request body early
    const body = await request.json()
    const validation = addApiKeyRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { provider, apiKey, nickname, defaultModel } = validation.data

    // Combine user profile and existing key check into a single query for efficiency
    const [profileResult, existingKeyResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('access_level')
        .eq('id', user.id)
        .single(),
      supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('nickname', nickname || null)
        .maybeSingle()
    ])

    // Check access level
    const accessLevel = profileResult.data?.access_level || 'basic'
    if (accessLevel !== 'advanced' && accessLevel !== 'admin') {
      return NextResponse.json({ error: 'Insufficient access level' }, { status: 403 })
    }

    // Check for existing key
    if (existingKeyResult.error && existingKeyResult.error.code !== 'PGRST116') {
      return handleError(existingKeyResult.error)
    }

    if (existingKeyResult.data) {
      return NextResponse.json(
        { error: 'You already have an API key with this provider and nickname' },
        { status: 409 }
      )
    }

    // Encrypt the API key
    const { encrypted, iv } = encryptForStorage(apiKey)

    // Save the encrypted API key
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        provider,
        encrypted_api_key: encrypted,
        encryption_iv: iv,
        nickname: nickname || null,
        default_model: defaultModel || null
      })
      .select('id, provider, nickname, created_at, default_model')
      .single()

    if (error) {
      return handleError(error)
    }

    return NextResponse.json({
      success: true,
      apiKey: data
    })

  } catch (error: any) {
    return handleError(error)
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    )
  }

  try {
    // Get user's API keys (without the actual encrypted keys)
    const { data: apiKeys, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, nickname, created_at, assigned_by_admin, default_model')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return handleError(error)
    }

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys || []
    })

  } catch (error: any) {
    return handleError(error)
  }
}
