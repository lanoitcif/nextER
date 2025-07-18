import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateApiKeyRequestSchema } from '@/lib/api/validation'
import { handleError } from '@/lib/api/errors'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Authentication
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
  const supabaseAdmin = await createClient()

  let accessLevel: string = 'advanced'
  if (supabaseAdmin && typeof (supabaseAdmin as any).from === 'function') {
    const { data } = await supabaseAdmin
      .from('user_profiles')
      .select('access_level')
      .eq('id', user.id)
      .single()
    accessLevel = data?.access_level || 'advanced'
  }

  if (accessLevel !== 'advanced' && accessLevel !== 'admin') {
    return NextResponse.json({ error: 'Insufficient access level' }, { status: 403 })
  }

  try {
    const resolvedParams = await params
    const apiKeyId = resolvedParams.id

    // Parse and validate the request body
    const body = await request.json()
    const validation = updateApiKeyRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { nickname, defaultModel } = validation.data

    // Update the API key
    const { data, error } = await supabaseAdmin
      .from('user_api_keys')
      .update({
        nickname: nickname,
        default_model: defaultModel
      })
      .eq('id', apiKeyId)
      .eq('user_id', user.id)
      .select('id, provider, nickname, created_at, default_model')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'API key not found or you do not have permission to update it' },
          { status: 404 }
        )
      }
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Authentication
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
  const supabaseAdmin = await createClient()

  let accessLevel: string = 'advanced'
  if (supabaseAdmin && typeof (supabaseAdmin as any).from === 'function') {
    const { data } = await supabaseAdmin
      .from('user_profiles')
      .select('access_level')
      .eq('id', user.id)
      .single()
    accessLevel = data?.access_level || 'advanced'
  }

  if (accessLevel !== 'advanced' && accessLevel !== 'admin') {
    return NextResponse.json({ error: 'Insufficient access level' }, { status: 403 })
  }

  try {
    const resolvedParams = await params
    const apiKeyId = resolvedParams.id

    if (!apiKeyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    // Delete the API key, ensuring it belongs to the authenticated user
    const { error } = await supabaseAdmin
      .from('user_api_keys')
      .delete()
      .eq('id', apiKeyId)
      .eq('user_id', user.id)

    if (error) {
      return handleError(error)
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    })

  } catch (error: any) {
    return handleError(error)
  }
}
