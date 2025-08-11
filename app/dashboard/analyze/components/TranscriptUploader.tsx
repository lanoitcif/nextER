'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface TranscriptUploaderProps {
  onTranscriptChange: (transcript: string) => void
  transcript: string
  disabled?: boolean
}

export default function TranscriptUploader({ 
  onTranscriptChange, 
  transcript,
  disabled = false 
}: TranscriptUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await handleFile(files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, DOCX, or TXT file')
      return
    }

    setIsProcessing(true)
    setUploadedFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-transcript', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process file')
      }

      const data = await response.json()
      onTranscriptChange(data.text)
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Failed to process file. Please try again.')
      setUploadedFileName(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const clearTranscript = () => {
    onTranscriptChange('')
    setUploadedFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground mb-2">
        Earnings Call Transcript
      </label>

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isProcessing}
        />
        
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-foreground mb-1">
          {isProcessing ? 'Processing file...' : 'Click or drag file to upload'}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports PDF, DOC, DOCX, and TXT files
        </p>
      </div>

      {/* Uploaded File Display */}
      {uploadedFileName && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{uploadedFileName}</span>
          </div>
          <button
            onClick={clearTranscript}
            className="text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Transcript Text Area */}
      <div className="relative">
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Or paste your transcript here..."
          className="input min-h-[200px] font-mono text-sm"
          disabled={disabled || isProcessing}
        />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {transcript.length} characters
        </div>
      </div>
    </div>
  )
}