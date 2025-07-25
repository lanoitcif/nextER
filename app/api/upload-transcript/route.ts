import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import PDF2JSON from 'pdf2json'
import mammoth from 'mammoth'

interface ExtractedContent {
  text: string
  pageCount?: number
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDF2JSON()
    let extractedText = ''

    pdfParser.on('pdfParser_dataError', (errData: any) =>
      reject(new Error(errData.parserError))
    )

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        // Extract text from all pages
        if (pdfData.Pages) {
          pdfData.Pages.forEach((page: any) => {
            if (page.Texts) {
              page.Texts.forEach((text: any) => {
                if (text.R && text.R[0] && text.R[0].T) {
                  extractedText += decodeURIComponent(text.R[0].T) + ' '
                }
              })
            }
            extractedText += '\n\n' // Add page breaks
          })
        }
        resolve(extractedText.trim())
      } catch (error) {
        reject(error)
      }
    })

    pdfParser.parseBuffer(buffer)
  })
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error}`)
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  console.log(`[${requestId}] Transcript upload request received`)

  // Authentication using cookie-based session
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log(`[${requestId}] Authentication failed`)
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    )
  }

  try {
    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]
    
    if (!validTypes.includes(fileType) && 
        !fileName.endsWith('.pdf') && 
        !fileName.endsWith('.docx') && 
        !fileName.endsWith('.doc') && 
        !fileName.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported formats: PDF, DOCX, DOC, TXT' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let extractedText = ''
    
    // Extract text based on file type
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log(`[${requestId}] Extracting text from PDF`)
      extractedText = await extractTextFromPDF(buffer)
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileName.endsWith('.docx')) {
      console.log(`[${requestId}] Extracting text from DOCX`)
      extractedText = await extractTextFromDocx(buffer)
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      console.log(`[${requestId}] Reading text file`)
      extractedText = buffer.toString('utf-8')
    } else {
      // For .doc files, we'll need to handle them as binary
      return NextResponse.json(
        { error: 'DOC format is not yet supported. Please convert to DOCX or PDF.' },
        { status: 400 }
      )
    }

    // Validate extracted content
    if (!extractedText || extractedText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from the file. Please ensure the file contains transcript content.' },
        { status: 400 }
      )
    }

    // Basic earnings transcript validation
    const transcriptKeywords = ['earnings', 'quarter', 'revenue', 'management', 'operator', 'analyst', 'question', 'fiscal']
    const hasTranscriptCharacteristics = transcriptKeywords.some(keyword => 
      extractedText.toLowerCase().includes(keyword)
    )

    if (!hasTranscriptCharacteristics) {
      console.log(`[${requestId}] Warning: File may not be an earnings transcript`)
    }

    // Log successful extraction
    console.log(`[${requestId}] Successfully extracted ${extractedText.length} characters from ${fileName}`)

    // Optionally store file metadata in database
    const { error: logError } = await supabase
      .from('usage_logs')
      .insert({
        user_id: user.id,
        provider: 'file_upload',
        model: fileType,
        token_count: extractedText.length,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error(`[${requestId}] Failed to log upload:`, logError)
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      characterCount: extractedText.length
    })

  } catch (error: any) {
    console.error(`[${requestId}] Upload error:`, error)
    return NextResponse.json(
      { error: `Failed to process file: ${error.message}` },
      { status: 500 }
    )
  }
}