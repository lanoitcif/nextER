'use client'

import React, { useCallback, useState } from 'react'
import { Upload, X, FileText, FileCheck, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onFileContent: (content: string) => void
  disabled?: boolean
  maxSizeMB?: number
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileContent, 
  disabled = false,
  maxSizeMB = 10 
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptedFormats = {
    'text/plain': ['.txt'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/rtf': ['.rtf'],
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    setLoading(true)
    setError(null)
    setFile(file)

    try {
      // Check file size
      const maxSize = maxSizeMB * 1024 * 1024 // Convert MB to bytes
      if (file.size > maxSize) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
      }

      let content = ''

      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Handle text files
        content = await file.text()
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDF files, we'll use the browser's FileReader API
        // In production, you might want to use a library like pdf.js
        const formData = new FormData()
        formData.append('file', file)
        
        // Call our API endpoint to extract PDF text
        const response = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to extract PDF text')
        }

        const data = await response.json()
        content = data.text
      } else if (
        file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.doc') || 
        file.name.endsWith('.docx')
      ) {
        // For Word documents, we'll need server-side processing
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to extract document text')
        }

        const data = await response.json()
        content = data.text
      } else {
        // Try to read as text for other formats
        content = await file.text()
      }

      if (!content || content.trim().length === 0) {
        throw new Error('No text content found in file')
      }

      onFileContent(content)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to process file')
      setLoading(false)
      setFile(null)
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled || loading) return

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      await processFile(droppedFile)
    }
  }, [disabled, loading, onFileContent])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || loading) return

    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      await processFile(selectedFile)
    }
  }, [disabled, loading, onFileContent])

  const removeFile = useCallback(() => {
    setFile(null)
    setError(null)
    onFileContent('')
  }, [onFileContent])

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all
          ${isDragging ? 'border-green-400 bg-green-400/10' : 'border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-400'}
          ${error ? 'border-red-400' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="sr-only"
          accept=".txt,.pdf,.doc,.docx,.rtf"
          onChange={handleFileSelect}
          disabled={disabled || loading}
        />

        {!file && !loading && (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-300 mb-2">
              Drop your transcript file here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports TXT, PDF, DOC, DOCX (max {maxSizeMB}MB)
            </p>
          </label>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
            <p className="text-sm text-gray-300">Processing file...</p>
          </div>
        )}

        {file && !loading && !error && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileCheck className="w-8 h-8 text-green-400 mr-3" />
              <div>
                <p className="text-sm text-gray-300">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              type="button"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        <p>Or paste text directly in the field below</p>
      </div>
    </div>
  )
}

export default FileUpload