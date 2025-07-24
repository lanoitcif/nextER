import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

export async function POST(request: NextRequest) {
  const { callUrl } = await request.json()
  if (!callUrl) {
    return NextResponse.json({ error: 'Missing call URL' }, { status: 400 })
  }

  const sessionId = crypto.randomUUID()
  return NextResponse.json({ sessionId })
}
