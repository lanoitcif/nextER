import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import jwt from 'jsonwebtoken'
import PDF2JSON from 'pdf2json'
import TurndownService from 'turndown'

interface PDFText {
  page: number
  text: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let userId: string
    
    try {
      const decoded = jwt.decode(token) as any
      userId = decoded.sub
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get the PDF file from the request
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(buffer)
    
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Could not extract text from PDF. The PDF might be image-based or corrupted.' 
      }, { status: 400 })
    }

    // Convert to markdown format
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced'
    })
    
    // Clean up the text and add basic markdown formatting
    const cleanedText = cleanPDFText(extractedText)
    const markdownText = turndownService.turndown(cleanedText)

    return NextResponse.json({
      text: markdownText,
      originalLength: extractedText.length,
      processedLength: markdownText.length,
      filename: file.name
    })

  } catch (error: any) {
    console.error('PDF extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract text from PDF: ' + error.message },
      { status: 500 }
    )
  }
}

function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDF2JSON(null, 1)
    
    pdfParser.on('pdfParser_dataError', (errData: any) => {
      reject(new Error(`PDF parsing error: ${errData.parserError}`))
    })

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        let extractedText = ''
        
        // Extract text from each page
        if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
          pdfData.Pages.forEach((page: any, pageIndex: number) => {
            if (page.Texts && Array.isArray(page.Texts)) {
              // Add page header
              if (pageIndex > 0) {
                extractedText += '\n\n---\n\n'
              }
              
              // Extract text blocks
              const pageTexts: string[] = []
              page.Texts.forEach((textItem: any) => {
                if (textItem.R && Array.isArray(textItem.R)) {
                  textItem.R.forEach((run: any) => {
                    if (run.T) {
                      // Decode the text
                      const decodedText = decodeURIComponent(run.T)
                      pageTexts.push(decodedText)
                    }
                  })
                }
              })
              
              // Join text with spaces and clean up
              const pageText = pageTexts.join(' ')
                .replace(/\s+/g, ' ')
                .trim()
              
              if (pageText) {
                extractedText += pageText + '\n'
              }
            }
          })
        }
        
        resolve(extractedText.trim())
      } catch (error) {
        reject(error)
      }
    })

    // Parse the PDF buffer
    pdfParser.parseBuffer(buffer)
  })
}

function cleanPDFText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Fix common PDF extraction issues
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2') // Paragraph breaks after sentences
    .replace(/(\d+\.)\s+/g, '\n$1 ') // Number lists
    // Clean up extra newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}