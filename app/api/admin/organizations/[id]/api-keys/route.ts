import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { encryptForStorage } from '@/lib/crypto'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: organization_id } = params

  try {
    const { data, error } = await supabase
      .from('organization_api_keys')
      .select('id, provider, nickname, created_at')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ apiKeys: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: organization_id } = params
  const body = await request.json()
  const { provider, apiKey, nickname } = body

  if (!provider || !apiKey) {
    return NextResponse.json({ error: 'Missing provider or apiKey' }, { status: 400 })
  }

  try {
    const { encrypted, iv } = encryptForStorage(apiKey)

    const { data, error } = await supabase
      .from('organization_api_keys')
      .insert({
        organization_id,
        provider,
        encrypted_api_key: encrypted,
        encryption_iv: iv,
        nickname
      })
      .select('id, provider, nickname, created_at')
      .single()

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'An API key for this provider already exists' }, { status: 409 })
        }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ apiKey: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
