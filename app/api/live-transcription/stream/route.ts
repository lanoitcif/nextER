import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY
  if (!deepgramApiKey) {
    return new Response('Missing DEEPGRAM_API_KEY', { status: 500 })
  }

  if (!request.body) {
    return new Response('Missing request body', { status: 400 })
  }

  // Use HTTP streaming approach that's compatible with Next.js
  const responseStream = new ReadableStream({
    async start(controller) {
      let streamClosed = false
      
      const safeEnqueue = (data: string) => {
        if (!streamClosed) {
          try {
            controller.enqueue(new TextEncoder().encode(data))
          } catch (error) {
            console.error('Failed to enqueue data:', error)
            streamClosed = true
          }
        }
      }

      try {
        safeEnqueue(`data: ${JSON.stringify({ 
          type: 'connection', 
          status: 'connected',
          message: 'Deepgram HTTP streaming ready' 
        })}\n\n`)

        const reader = request.body!.getReader()
        let audioBuffer = new Uint8Array()
        const bufferSizeThreshold = 32 * 1024 // 32KB - smaller chunks for faster response
        let lastTranscriptTime = Date.now()
        const minTimeBetweenTranscripts = 500 // 500ms minimum for Deepgram

        while (!streamClosed) {
          const { done, value } = await reader.read()
          if (done) {
            // Process any remaining audio
            if (audioBuffer.length > 0) {
              try {
                const transcript = await transcribeWithDeepgram(Buffer.from(audioBuffer), deepgramApiKey)
                if (transcript && transcript.trim().length > 0) {
                  const ssePayload = {
                    is_final: true,
                    channel: { alternatives: [{ transcript, confidence: 0.9 }] },
                    type: 'transcript'
                  }
                  safeEnqueue(`data: ${JSON.stringify(ssePayload)}\n\n`)
                }
              } catch (error) {
                console.error('Error transcribing final chunk:', error)
              }
            }
            break
          }

          // Add new chunk to buffer
          const newBuffer = new Uint8Array(audioBuffer.length + value.length)
          newBuffer.set(audioBuffer)
          newBuffer.set(value, audioBuffer.length)
          audioBuffer = newBuffer

          // Process buffer when threshold reached
          const now = Date.now()
          if (audioBuffer.length >= bufferSizeThreshold && (now - lastTranscriptTime) >= minTimeBetweenTranscripts) {
            try {
              const transcript = await transcribeWithDeepgram(Buffer.from(audioBuffer), deepgramApiKey)
              if (transcript && transcript.trim().length > 0) {
                const ssePayload = {
                  is_final: true,
                  channel: { alternatives: [{ transcript, confidence: 0.9 }] },
                  type: 'transcript'
                }
                safeEnqueue(`data: ${JSON.stringify(ssePayload)}\n\n`)
                lastTranscriptTime = now
              }
            } catch (error) {
              console.error('Error transcribing chunk:', error)
            }
            // Clear buffer after processing
            audioBuffer = new Uint8Array()
          }
        }
      } catch (error) {
        console.error('Error in Deepgram streaming:', error)
        safeEnqueue(`data: ${JSON.stringify({ 
          type: 'error', 
          message: 'Deepgram streaming error' 
        })}\n\n`)
      } finally {
        if (!streamClosed) {
          try {
            controller.close()
          } catch (error) {
            console.error('Error closing controller:', error)
          }
        }
      }
    },
    cancel() {
      console.log('Deepgram stream cancelled')
    },
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

async function transcribeWithDeepgram(audioBuffer: Buffer, apiKey: string): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('audio', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm')

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Deepgram API error:', response.status, errorData)
      return null
    }

    const result = await response.json()
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript
    return transcript || null
  } catch (error) {
    console.error('Deepgram transcription error:', error)
    return null
  }
}