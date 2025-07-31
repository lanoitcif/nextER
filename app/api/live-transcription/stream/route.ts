
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

export async function POST(request: NextRequest) {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY
  if (!deepgramApiKey) {
    return new Response('Missing DEEPGRAM_API_KEY', { status: 500 })
  }

  if (!request.body) {
    return new Response('Missing request body', { status: 400 })
  }

  try {
    const client = createClient(deepgramApiKey)
    const connection = client.listen.live({
      model: 'nova-2',
      interim_results: true,
      smart_format: true,
      punctuate: true,
    })

    const responseStream = new ReadableStream({
      start(controller) {
        connection.on(LiveTranscriptionEvents.Open, () => {
          console.log('Deepgram connection opened.')
        })

        connection.on(LiveTranscriptionEvents.Close, () => {
          console.log('Deepgram connection closed.')
          try {
            controller.close()
          } catch (e) {
            // Ignore error if controller is already closed
          }
        })

        connection.on(LiveTranscriptionEvents.Error, (error) => {
          console.error('Deepgram error:', error)
          controller.error(error)
        })

        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
        })
      },
      cancel() {
        console.log('Client cancelled the stream.')
        connection.finish()
      },
    })

    // Pipe the audio from the client to Deepgram
    request.body.pipeTo(new WritableStream({
      start() {
        console.log('Receiving audio stream from client.')
      },
      async write(chunk) {
        // Convert Uint8Array to ArrayBuffer for Deepgram
        const arrayBuffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength)
        connection.send(arrayBuffer)
      },
      async close() {
        console.log('Client audio stream closed.')
        await connection.finish()
      },
      async abort(reason) {
        console.error('Client audio stream aborted:', reason)
        await connection.finish()
      },
    })).catch(error => {
      console.error('Error piping audio stream:', error)
      connection.finish()
    })

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // For Nginx buffering disabling
      },
    })

  } catch (error) {
    console.error('Error in live transcription route:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
