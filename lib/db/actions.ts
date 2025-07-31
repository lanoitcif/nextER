import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function findOrCreateCommenter(name: string, companyId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // First, try to find the commenter
  let { data: commenter, error: selectError } = await supabase
    .from('commenters')
    .select('id')
    .eq('name', name)
    .eq('company_id', companyId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = 'No rows found'
    console.error('Error finding commenter:', selectError)
    return null
  }

  if (commenter) {
    return commenter.id
  }

  // If not found, create a new commenter
  const { data: newCommenter, error: insertError } = await supabase
    .from('commenters')
    .insert({ name, company_id: companyId })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating commenter:', insertError)
    return null
  }

  return newCommenter.id
}

export async function insertQACommentary(
  analysisTranscriptId: string,
  commenterId: string,
  analystName: string,
  analystFirm: string,
  questionTopic: string,
  keyPoints: string,
  quantitativeData: string,
  managementResponse: string
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('qa_commentary').insert({
    analysis_transcript_id: analysisTranscriptId,
    commenter_id: commenterId,
    analyst_name: analystName,
    analyst_firm: analystFirm,
    question_topic: questionTopic,
    key_points: keyPoints,
    quantitative_data: quantitativeData,
    management_response: managementResponse,
  })

  if (error) {
    console.error('Error inserting Q&A commentary:', error)
  }
}
