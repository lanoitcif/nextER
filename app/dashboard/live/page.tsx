'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'

type TranscriptSource = {
  type: 'final' | 'interim'
  text: string
}

// LiveTranscriptionEvent type for OpenAI implementation
type LiveTranscriptionEvent = {
  type: string
  channel?: {
    alternatives?: Array<{
      transcript?: string
    }>
  }
  is_final?: boolean
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
      // Check browser compatibility first
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('Your browser does not support audio recording. Please use Chrome, Firefox, or Edge.')
      }

      setStatus('Requesting media access...')
      
      let mediaStream: MediaStream
      
      // Try microphone first (more widely supported)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        })
        setStatus('Microphone connected')
      } catch (micError: any) {
        console.log('Microphone access failed:', micError.message)
        
        // Fallback to display media (tab/screen audio)
        try {
          mediaStream = await navigator.mediaDevices.getDisplayMedia({
            audio: {
              sampleRate: 16000,
              channelCount: 1,
            },
            video: false,
          })
          setStatus('Tab/screen audio connected')
        } catch (displayError: any) {
          console.error('Display media failed:', displayError.message)
          
          // Provide specific error messages
          if (micError.name === 'NotAllowedError' || displayError.name === 'NotAllowedError') {
            throw new Error('Microphone access denied. Please grant permission in your browser settings and reload the page.')
          } else if (micError.name === 'NotFoundError') {
            throw new Error('No microphone found. Please connect a microphone and try again.')
          } else if (micError.name === 'NotSupportedError' || displayError.name === 'NotSupportedError') {
            throw new Error('Audio recording is not supported in this browser or context. Please try Chrome or Firefox on desktop.')
          } else {
            throw new Error('Could not access microphone or tab audio. Please check your browser settings.')
          }
        }
      }
      
      mediaStreamRef.current = mediaStream
      setFinalTranscript('')
      setInterimTranscript('')

      mediaStream.getTracks()[0].onended = () => {
        setStatus('Audio stopped.')
        stopRecording()
      }

      setIsRecording(true)
      setStatus('Connecting...')

      abortControllerRef.current = new AbortController()

      // Determine supported MIME type
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        }
      }

      const audioStream = new ReadableStream({
        start(controller) {
          const recorder = new MediaRecorder(mediaStream, { mimeType })
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
        // @ts-ignore - duplex is needed for streaming bodies
        duplex: 'half'
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
      setIsRecording(false)
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
            const text = json.channel?.alternatives?.[0]?.transcript
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
        Click "Start Recording" to transcribe audio from your microphone or browser tab. Live transcription will appear below.
      </p>
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> This feature works best in Chrome or Firefox on desktop. 
          Grant microphone permission when prompted, or select a browser tab with audio.
        </p>
      </div>
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