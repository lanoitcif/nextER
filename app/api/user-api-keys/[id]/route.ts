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
  try {
    const resolvedParams = await params
    const apiKeyId = resolvedParams.id

    // Parse and validate the request body
    const body = await request.json()
    const validation = updateApiKeyRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { nickname, preferredModel } = validation.data

    // Update the API key
    const { data, error } = await supabaseAdmin
      .from('user_api_keys')
      .update({
        nickname: nickname,
        // preferred_model: preferredModel // Add this column to your database if needed
      })
      .eq('id', apiKeyId)
      .eq('user_id', user.id)
      .select('id, provider, nickname, created_at')
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
