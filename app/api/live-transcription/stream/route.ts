import { NextRequest } from 'next/server'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ noServer: true })

export const dynamic = 'force-dynamic'

async function transcribeChunk(data: Buffer): Promise<string> {
  const form = new FormData()
  form.append('file', new Blob([data]), 'audio.webm')
  form.append('model', 'whisper-1')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OWNER_OPENAI_API_KEY}` },
    body: form
  })

  if (!res.ok) {
    console.error('OpenAI error', await res.text())
    return ''
  }

  const json = await res.json()
  return json.text as string
}

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    if (typeof data === 'string') return
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
    const text = await transcribeChunk(chunk)
    ws.send(JSON.stringify({ text, timestamp: Date.now() }))
  })
})

export async function GET(request: NextRequest) {
  const { socket } = request as any
  wss.handleUpgrade(request as any, socket, Buffer.alloc(0), (ws) => {
    wss.emit('connection', ws)
  })
  return new Response(null)
}
