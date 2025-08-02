import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY
  if (!deepgramApiKey) {
    return new Response('Missing DEEPGRAM_API_KEY', { status: 500 })
  }

  if (!request.body) {
    return new Response('Missing request body', { status: 400 })
  }

  // Forward to the HTTP-based Deepgram implementation
  return fetch(new URL('/api/live-transcription/deepgram-stream', request.url).toString(), {
    method: 'POST',
    headers: request.headers,
    body: request.body,
    // @ts-ignore - duplex is needed for streaming
    duplex: 'half'
  })
}