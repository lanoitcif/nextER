import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { updateApiKeyRequestSchema } from '@/lib/api/validation'
import { handleError } from '@/lib/api/errors'

export const PUT = withAuth(async (request, { user, params }) => {
  const supabaseAdmin = createClient()
  try {
    const apiKeyId = params.id

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
})

export const DELETE = withAuth(async (request, { user, params }) => {
  const supabaseAdmin = createClient()
  try {
    const apiKeyId = params.id

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
})
