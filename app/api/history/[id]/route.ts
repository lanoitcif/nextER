import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/api/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { id } = await params
  
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
    const { data: analysis, error } = await supabase
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
        companies(
          id,
          ticker,
          name,
          primary_company_type_id
        ),
        company_types(
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        created_at: analysis.created_at,
        provider: analysis.provider,
        model: analysis.model,
        review_provider: analysis.review_provider,
        review_model: analysis.review_model,
        feedback: analysis.feedback,
        transcript: analysis.transcript,
        analysis_result: analysis.analysis_result,
        review_result: analysis.review_result,
        company: analysis.companies,
        company_type: analysis.company_types
      }
    })

  } catch (error: any) {
    return handleError(error)
  }
}