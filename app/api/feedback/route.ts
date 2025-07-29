import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { handleError } from '@/lib/api/errors'

const feedbackSchema = z.object({
  transcriptId: z.string().uuid(),
  feedback: z.union([z.literal(1), z.literal(-1)])
})

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const validation = feedbackSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { transcriptId, feedback } = validation.data

    const { error } = await supabase
      .from('analysis_transcripts')
      .update({ feedback })
      .eq('id', transcriptId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return handleError(error)
  }
}
