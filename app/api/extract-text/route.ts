import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// For PDF parsing, we'll use pdf-parse library
// For Word documents, we'll use mammoth
// These need to be installed: npm install pdf-parse mammoth

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try cookie-based auth if no bearer token
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    } else {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        )
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    let extractedText = ''

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Extract text from PDF
      try {
        // Dynamic import to avoid build issues
        const pdfParse = (await import('pdf-parse')).default
        const data = await pdfParse(buffer)
        extractedText = data.text
      } catch (error) {
        console.error('PDF parsing error:', error)
        return NextResponse.json(
          { error: 'Failed to parse PDF file' },
          { status: 500 }
        )
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      // Extract text from DOCX
      try {
        const mammoth = (await import('mammoth')).default
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } catch (error) {
        console.error('DOCX parsing error:', error)
        return NextResponse.json(
          { error: 'Failed to parse DOCX file' },
          { status: 500 }
        )
      }
    } else if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
      // For old .doc files, we can try mammoth but it may not work
      try {
        const mammoth = (await import('mammoth')).default
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } catch (error) {
        // Fallback message for .doc files
        return NextResponse.json(
          { error: 'Old .doc format not fully supported. Please save as .docx or .txt' },
          { status: 400 }
        )
      }
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Plain text file
      extractedText = buffer.toString('utf-8')
    } else {
      // Try to read as text
      extractedText = buffer.toString('utf-8')
    }

    // Clean up the text
    extractedText = extractedText
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim()

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No text content found in file' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      text: extractedText,
      characterCount: extractedText.length,
      wordCount: extractedText.split(/\s+/).length
    })

  } catch (error: any) {
    console.error('File extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}