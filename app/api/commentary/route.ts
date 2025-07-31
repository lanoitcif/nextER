import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { handleError } from '@/lib/api/errors'

const commentaryQuerySchema = z.object({
  commenterName: z.string().optional(),
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
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
    const validation = commentaryQuerySchema.safeParse(queryParams)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { commenterName, search, companyId } = validation.data

    let query = supabase.from('qa_commentary').select(`
      *,
      commenters!inner(
        name,
        title,
        companies(
          ticker,
          name
        )
      ),
      analysis_transcripts!inner(
        created_at
      )
    `)
    .eq('analysis_transcripts.user_id', user.id)


    if (commenterName) {
      query = query.ilike('commenters.name', `%${commenterName}%`)
    }
    
    if (companyId) {
        query = query.eq('commenters.company_id', companyId)
    }

    if (search) {
      query = query.or(`question_topic.ilike.%${search}%,key_points.ilike.%${search}%,management_response.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch commentary:', error)
      return NextResponse.json(
        { error: 'Failed to fetch commentary' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return handleError(error)
  }
}
