import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { encryptForStorage } from '@/lib/crypto'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  console.log(`[${requestId}] Admin API key assignment request received`)

  // Authentication
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
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

  const supabaseAdmin = await createClient(cookieStore)

  try {
    // Check if user is admin
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, provider, apiKey, nickname, defaultModel } = body

    if (!userId || !provider || !apiKey || !defaultModel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'google', 'cohere']
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      )
    }

    // Verify target user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Encrypt the API key
    const { encrypted, iv } = encryptForStorage(apiKey)

    // Insert the API key
    const { data, error } = await supabaseAdmin
      .from('user_api_keys')
      .insert({
        user_id: userId,
        provider: provider,
        encrypted_api_key: encrypted,
        encryption_iv: iv,
        nickname: nickname || `${provider} (Admin Assigned)`,
        assigned_by_admin: true,
        admin_assigned_at: new Date().toISOString(),
        admin_assigned_by: user.id,
        default_model: defaultModel
      })
      .select()
      .single()

    if (error) {
      console.error(`[${requestId}] Database error:`, error)
      return NextResponse.json(
        { error: 'Failed to assign API key' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] API key assigned successfully to user ${targetUser.email}`)

    return NextResponse.json({
      success: true,
      message: `API key assigned to ${targetUser.email}`,
      keyId: data.id
    })

  } catch (error: any) {
    console.error(`[${requestId}] Error assigning API key:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID()
  console.log(`[${requestId}] Admin API key deletion request received`)

  // Authentication
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
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

  const supabaseAdmin = await createClient(cookieStore)

  try {
    // Check if user is admin
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get keyId from query params
    const url = new URL(request.url)
    const keyId = url.searchParams.get('keyId')

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      )
    }

    // Delete the API key (only admin-assigned ones)
    const { error } = await supabaseAdmin
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('assigned_by_admin', true)

    if (error) {
      console.error(`[${requestId}] Database error:`, error)
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] API key deleted successfully`)

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    })

  } catch (error: any) {
    console.error(`[${requestId}] Error deleting API key:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}