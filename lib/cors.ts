import { NextRequest, NextResponse } from 'next/server'

// List of allowed origins
const allowedOrigins = [
  'https://nextearningsrelease.com',
  'https://www.nextearningsrelease.com',
  'https://lanoitcif.com',
  'https://www.lanoitcif.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

export function corsHeaders(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin') || ''
  
  // Check if the origin is allowed
  const isAllowed = process.env.NODE_ENV === 'development' 
    ? true // Allow all origins in development
    : allowedOrigins.includes(origin)
  
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    )
  }
  
  return response
}

export function handleCorsOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}