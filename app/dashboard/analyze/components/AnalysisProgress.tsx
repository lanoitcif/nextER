'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface AnalysisProgressProps {
  isAnalyzing: boolean
  hasReview?: boolean
}

export default function AnalysisProgress({ isAnalyzing, hasReview = false }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Initializing analysis...')

  useEffect(() => {
    if (!isAnalyzing) {
      setProgress(0)
      setMessage('Initializing analysis...')
      return
    }

    // Simulate progress with messages
    const steps = hasReview ? [
      { progress: 10, message: 'Connecting to AI provider...', delay: 500 },
      { progress: 25, message: 'Processing transcript...', delay: 2000 },
      { progress: 40, message: 'Analyzing financial metrics...', delay: 3000 },
      { progress: 55, message: 'Identifying key insights...', delay: 3000 },
      { progress: 70, message: 'Generating initial analysis...', delay: 2000 },
      { progress: 80, message: 'Preparing second opinion...', delay: 1000 },
      { progress: 90, message: 'Finalizing results...', delay: 1000 },
      { progress: 95, message: 'Almost done...', delay: 500 }
    ] : [
      { progress: 15, message: 'Connecting to AI provider...', delay: 500 },
      { progress: 35, message: 'Processing transcript...', delay: 2000 },
      { progress: 55, message: 'Analyzing financial metrics...', delay: 3000 },
      { progress: 75, message: 'Identifying key insights...', delay: 3000 },
      { progress: 90, message: 'Generating analysis...', delay: 2000 },
      { progress: 95, message: 'Almost done...', delay: 500 }
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress)
        setMessage(steps[currentStep].message)
        currentStep++
      }
    }, steps[currentStep]?.delay || 1000)

    return () => clearInterval(interval)
  }, [isAnalyzing, hasReview])

  if (!isAnalyzing) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background border border-border rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-center mb-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold text-center mb-4">
          Analyzing Transcript
        </h3>
        
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="relative">
            <div className="bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">{progress}%</span>
              <span className="text-xs text-muted-foreground">
                {Math.round((100 - progress) / 10)} seconds remaining
              </span>
            </div>
          </div>
          
          {/* Status Message */}
          <p className="text-sm text-center text-muted-foreground animate-pulse">
            {message}
          </p>
        </div>

        <div className="mt-6 text-xs text-center text-muted-foreground">
          This typically takes 15-30 seconds
        </div>
      </div>
    </div>
  )
}