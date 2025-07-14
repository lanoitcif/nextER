import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptForStorage } from '@/lib/crypto'
import { withAuth } from '@/lib/api/middleware'
import { addApiKeyRequestSchema } from '@/lib/api/validation'
import { handleError } from '@/lib/api/errors'

export const POST = withAuth(async (request, { user }) => {
  const supabaseAdmin = createClient()
  try {
    // Parse and validate the request body
    const body = await request.json()
    const validation = addApiKeyRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { provider, apiKey, nickname, preferredModel } = validation.data

    // Check if user already has a key with this provider/nickname combination
    const { data: existingKey, error: checkError } = await supabaseAdmin
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('nickname', nickname || null)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      return handleError(checkError)
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
        nickname: nickname || null
      })
      .select('id, provider, nickname, created_at')
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
})

export const GET = withAuth(async (request, { user }) => {
  const supabaseAdmin = createClient()
  try {
    // Get user's API keys (without the actual encrypted keys)
    // Note: preferred_model column might not exist in older database schemas
    const { data: apiKeys, error } = await supabaseAdmin
      .from('user_api_keys')
      .select('id, provider, nickname, created_at')
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
})
