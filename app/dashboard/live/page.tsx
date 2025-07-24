'use client'

import { useState, useRef } from 'react'

export default function LiveTranscriptionPage() {
  const [callUrl, setCallUrl] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [transcript, setTranscript] = useState<string[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const startCall = async () => {
    const res = await fetch('/api/live-transcription/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callUrl })
    })
    if (res.ok) {
      const data = await res.json()
      setSessionId(data.sessionId)
      connectWebSocket(data.sessionId)
      if (audioRef.current) {
        audioRef.current.src = callUrl
        await audioRef.current.play()
        const stream = (audioRef.current as any).captureStream()
        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (e) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(e.data)
          }
        }
        recorder.start(1000)
      } else {
        window.open(callUrl, '_blank')
      }
    }
  }

  const connectWebSocket = (id: string) => {
    const ws = new WebSocket(`/api/live-transcription/stream?sessionId=${id}`)
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      setTranscript((t) => [...t, msg.text])
    }
    wsRef.current = ws
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Live Transcription</h1>
      <input
        className="border p-2 w-full text-black"
        placeholder="Webcast URL"
        value={callUrl}
        onChange={(e) => setCallUrl(e.target.value)}
      />
      <button className="bg-blue-600 text-white px-4 py-2" onClick={startCall}>
        Start
      </button>
      <audio ref={audioRef} className="hidden" />
      {sessionId && (
        <div className="mt-4">
          <h2 className="font-semibold">Transcript</h2>
          <div className="border p-2 h-64 overflow-y-auto whitespace-pre-wrap">
            {transcript.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
