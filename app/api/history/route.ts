import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { handleError } from '@/lib/api/errors'

const historyQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  provider: z.string().optional(),
  company_id: z.string().uuid().optional(),
  company_type_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional()
})

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
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
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validation = historyQuerySchema.safeParse(queryParams)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { cursor, limit, provider, company_id, company_type_id, date_from, date_to, search } = validation.data

    let query = supabase
      .from('analysis_transcripts')
      .select(`
        id,
        created_at,
        provider,
        model,
        review_provider,
        review_model,
        feedback,
        transcript,
        analysis_result,
        review_result,
        companies!inner(
          id,
          ticker,
          name
        ),
        company_types(
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (provider) {
      query = query.eq('provider', provider)
    }
    if (company_id) {
      query = query.eq('company_id', company_id)
    }
    if (company_type_id) {
      query = query.eq('company_type_id', company_type_id)
    }
    if (date_from) {
      query = query.gte('created_at', date_from)
    }
    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    // Handle cursor-based pagination
    if (cursor) {
      const cursorDate = new Date(cursor).toISOString()
      query = query.lt('created_at', cursorDate)
    }

    // Handle search
    if (search) {
      query = query.textSearch('transcript', search)
    }

    // Order and limit
    query = query
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: analyses, error } = await query

    if (error) {
      console.error('Failed to fetch history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analysis history' },
        { status: 500 }
      )
    }

    // Transform data for UI consumption
    const transformedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      created_at: analysis.created_at,
      provider: analysis.provider,
      model: analysis.model,
      review_provider: analysis.review_provider,
      review_model: analysis.review_model,
      feedback: analysis.feedback,
      company: analysis.companies,
      company_type: analysis.company_types,
      transcript_length: analysis.transcript?.length || 0,
      analysis_length: analysis.analysis_result?.length || 0,
      review_length: analysis.review_result?.length || 0,
      transcript_preview: analysis.transcript?.substring(0, 200) + (analysis.transcript?.length > 200 ? '...' : ''),
      has_review: !!analysis.review_result
    }))

    // Determine next cursor
    const nextCursor = transformedAnalyses.length === limit 
      ? transformedAnalyses[transformedAnalyses.length - 1].created_at 
      : null

    return NextResponse.json({
      analyses: transformedAnalyses,
      nextCursor,
      hasMore: transformedAnalyses.length === limit
    })

  } catch (error: any) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
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
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('analysis_transcripts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Failed to delete analysis:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return handleError(error)
  }
}