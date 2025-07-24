import { NextRequest } from 'next/server'
import { POST } from '../route'

describe('/api/live-transcription/start', () => {
  it('returns 400 when callUrl missing', async () => {
    const req = new NextRequest('http://localhost', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
