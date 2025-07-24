import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const quarter = searchParams.get('quarter')
  const year = searchParams.get('year')
  const analyst = searchParams.get('analyst')
  const representative = searchParams.get('representative')

  let query = supabase.from('earnings_qa').select('*')
  if (companyId) query = query.eq('company_id', companyId)
  if (quarter) query = query.eq('quarter', quarter)
  if (year) query = query.eq('year', Number(year))
  if (analyst) query = query.ilike('earnings_analyst', `%${analyst}%`)
  if (representative) query = query.ilike('company_representative', `%${representative}%`)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }

  return NextResponse.json({ entries: data || [] })
}
