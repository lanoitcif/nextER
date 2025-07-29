'use client'

import { useState, useRef, useEffect } from 'react'
import { LiveTranscriptionEvent } from '@deepgram/sdk'

type TranscriptSource = {
  type: 'final' | 'interim'
  text: string
}

import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'

type TranscriptSource = {
  type: 'final' | 'interim'
  text: string
}

export default function LiveTranscriptionPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return
      if (!user) {
        router.push('/auth/login')
        return
      }
      if (isAdmin(profile)) {
        setIsAllowed(true)
        setIsChecking(false)
        return
      }
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.live_transcription_enabled?.enabled) {
            setIsAllowed(true)
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to check feature flag, redirecting.', error)
        router.push('/dashboard')
      } finally {
        setIsChecking(false)
      }
    }
    checkAccess()
  }, [user, profile, loading, router])

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      stopRecording()
    }
  }, [])

  if (isChecking || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const startRecording = async () => {
    if (isRecording) {
      stopRecording()
      return
    }

    try {
      setStatus('Requesting media access...')
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          // Recommended settings for Deepgram
          sampleRate: 16000,
          channelCount: 1,
        },
        video: false,
      })
      mediaStreamRef.current = mediaStream
      setFinalTranscript('')
      setInterimTranscript('')

      mediaStream.getTracks()[0].onended = () => {
        setStatus('Screen share stopped.')
        stopRecording()
      }

      setIsRecording(true)
      setStatus('Connecting...')

      abortControllerRef.current = new AbortController()

      const audioStream = new ReadableStream({
        start(controller) {
          const recorder = new MediaRecorder(mediaStream)
          mediaRecorderRef.current = recorder

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              controller.enqueue(event.data)
            }
          }
          
          recorder.onstop = () => {
            controller.close()
          }

          recorder.start(250) // Send chunks every 250ms
        },
        cancel() {
          mediaRecorderRef.current?.stop()
        }
      })

      const response = await fetch('/api/live-transcription/stream', {
        method: 'POST',
        body: audioStream,
        signal: abortControllerRef.current.signal,
        headers: { 'Content-Type': 'application/octet-stream' },
      })

      if (!response.ok || !response.body) {
        throw new Error(`Connection failed: ${response.statusText}`)
      }
      
      setStatus('Recording... Speak now.')
      await processStream(response.body)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Expected on stop, do nothing.
      } else {
        console.error('Error starting recording:', error)
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      stopRecording()
    }
  }

  const processStream = async (body: ReadableStream<Uint8Array>) => {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullTranscript = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        setStatus('Transcription finished.')
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.substring(6)) as LiveTranscriptionEvent
            const text = json.channel.alternatives[0].transcript
            if (text) {
              if (json.is_final) {
                fullTranscript += text + ' '
                setFinalTranscript(fullTranscript)
                setInterimTranscript('')
              } else {
                setInterimTranscript(text)
              }
            }
          } catch (e) {
            console.error('Failed to parse stream data:', e)
          }
        }
      }
    }
  }

  const stopRecording = () => {
    abortControllerRef.current?.abort()
    mediaRecorderRef.current?.stop()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    setIsRecording(false)
    setStatus('')
  }

  return (
    <div className="p-4 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Live Transcription</h1>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Click "Start Recording", select the browser tab with your webcast audio, and see the live transcription below.
      </p>
      <div className="mb-4 flex items-center gap-4">
        <button
          className={`px-6 py-3 text-white font-bold rounded-lg transition-colors ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={startRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <span className="text-lg font-medium">{status}</span>
      </div>
      <div className="border p-6 h-[50vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner">
        <p className="whitespace-pre-wrap text-lg">
          {finalTranscript}
          <span className="text-gray-500">{interimTranscript}</span>
        </p>
      </div>
    </div>
  )
}