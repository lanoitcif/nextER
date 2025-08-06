# NextER API Documentation

## Overview
NextER provides a comprehensive REST API for earnings call transcript analysis, supporting multiple LLM providers, real-time transcription, and enterprise-grade security.

## Base URL
- Production: `https://lanoitcif.com/api`
- Local: `http://localhost:3000/api`

## Authentication
All API endpoints require authentication via Supabase Auth. Include the session token in the Authorization header:
```
Authorization: Bearer <session_token>
```

## API Endpoints

### Analysis

#### POST `/api/analyze`
Analyze an earnings call transcript using configured LLM providers.

**Request Body:**
```json
{
  "transcript": "string",
  "companyName": "string",
  "companyType": "string", 
  "analysisType": "Equity | Debt | M&A | Custom",
  "includeReview": boolean,
  "customPrompt": "string (optional)",
  "llmSettings": {
    "modelType": "openai | anthropic | google | cohere",
    "model": "string",
    "temperature": number,
    "maxTokens": number
  }
}
```

**Response:**
```json
{
  "analysis": "string (HTML formatted)",
  "review": "string (optional)",
  "wordExport": "base64 string",
  "htmlExport": "string",
  "metadata": {
    "model": "string",
    "processingTime": number,
    "tokenCount": number
  }
}
```

#### POST `/api/commentary`
Generate structured Q&A commentary from transcript analysis.

**Request Body:**
```json
{
  "transcript": "string",
  "companyName": "string"
}
```

**Response:**
```json
{
  "commentary": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}
```

### History & Feedback

#### GET `/api/history`
Retrieve analysis history for the authenticated user.

**Query Parameters:**
- `search`: Search term for company names or transcripts
- `analysisType`: Filter by analysis type
- `dateFrom`: Start date (ISO 8601)
- `dateTo`: End date (ISO 8601)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "analyses": [
    {
      "id": "uuid",
      "companyName": "string",
      "analysisType": "string",
      "createdAt": "ISO 8601",
      "feedback": "positive | negative | null"
    }
  ],
  "total": number
}
```

#### GET `/api/history/{id}`
Retrieve a specific analysis by ID.

**Response:**
```json
{
  "id": "uuid",
  "companyName": "string",
  "analysisType": "string",
  "transcript": "string",
  "analysis": "string",
  "review": "string (optional)",
  "createdAt": "ISO 8601",
  "feedback": "positive | negative | null"
}
```

#### POST `/api/feedback`
Submit feedback for an analysis.

**Request Body:**
```json
{
  "analysisId": "uuid",
  "feedback": "positive | negative"
}
```

### Live Transcription

#### POST `/api/live-transcription/start`
Initialize a live transcription session.

**Request Body:**
```json
{
  "provider": "deepgram | openai"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "streamUrl": "string"
}
```

#### POST `/api/live-transcription/stream`
Stream audio for transcription (WebSocket endpoint).

**Headers:**
```
Content-Type: application/octet-stream
X-Session-Id: <session_id>
```

#### POST `/api/live-transcription/deepgram-stream`
Deepgram-specific HTTP streaming endpoint.

**Request:** Audio stream (binary)
**Response:** Server-Sent Events with transcription updates

### File Processing

#### POST `/api/extract-text`
Extract text from Word documents.

**Request Body:**
```json
{
  "base64Content": "string"
}
```

**Response:**
```json
{
  "text": "string"
}
```

#### POST `/api/extract-pdf`
Extract text from PDF documents.

**Request Body:**
```json
{
  "base64Content": "string"
}
```

**Response:**
```json
{
  "text": "string"
}
```

#### POST `/api/upload-transcript`
Upload and process transcript files.

**Request:** 
- FormData with file field
- Supported formats: PDF, DOC, DOCX, TXT

**Response:**
```json
{
  "text": "string",
  "fileType": "string",
  "fileName": "string"
}
```

### Company Management

#### GET `/api/companies`
Search for companies with auto-complete.

**Query Parameters:**
- `search`: Search term
- `limit`: Number of results (default: 10)

**Response:**
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "string",
      "ticker": "string",
      "type": "string"
    }
  ]
}
```

#### GET `/api/company-types`
Retrieve available company types.

**Response:**
```json
{
  "types": ["Technology", "Finance", "Healthcare", ...]
}
```

### User API Keys

#### GET `/api/user-api-keys`
Retrieve user's API key assignments.

**Response:**
```json
{
  "apiKeys": [
    {
      "id": "uuid",
      "provider": "string",
      "createdAt": "ISO 8601",
      "isActive": boolean
    }
  ]
}
```

#### POST `/api/user-api-keys`
Store encrypted API key for user.

**Request Body:**
```json
{
  "provider": "openai | anthropic | google | cohere",
  "apiKey": "string"
}
```

#### DELETE `/api/user-api-keys/{id}`
Remove an API key assignment.

### Admin Endpoints
*Requires admin role*

#### GET `/api/admin/stats`
Retrieve platform statistics.

**Response:**
```json
{
  "totalUsers": number,
  "totalAnalyses": number,
  "activeUsers": number,
  "analysisTypes": {
    "Equity": number,
    "Debt": number,
    "M&A": number,
    "Custom": number
  }
}
```

#### GET `/api/admin/usage`
Retrieve usage metrics by user.

**Response:**
```json
{
  "usage": [
    {
      "userId": "uuid",
      "email": "string",
      "analysisCount": number,
      "lastActive": "ISO 8601"
    }
  ]
}
```

#### GET `/api/admin/users`
List all users with details.

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "string",
      "role": "string",
      "createdAt": "ISO 8601",
      "metadata": object
    }
  ]
}
```

#### POST `/api/admin/assign-api-key`
Assign API key to a user (admin only).

**Request Body:**
```json
{
  "userId": "uuid",
  "provider": "string",
  "apiKey": "string"
}
```

#### GET `/api/admin/companies`
Manage companies in the system.

**Response:**
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "string",
      "ticker": "string",
      "type": "string",
      "active": boolean
    }
  ]
}
```

#### POST `/api/admin/companies`
Add a new company.

**Request Body:**
```json
{
  "name": "string",
  "ticker": "string",
  "type": "string"
}
```

#### PUT `/api/admin/companies/{id}`
Update company details.

#### DELETE `/api/admin/companies/{id}`
Remove a company.

#### GET `/api/admin/settings`
Retrieve system settings.

**Response:**
```json
{
  "settings": {
    "defaultModel": "string",
    "maxTokens": number,
    "temperature": number,
    "systemPrompts": object
  }
}
```

#### POST `/api/admin/settings`
Update system settings.

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error

Error Response Format:
```json
{
  "error": "string",
  "message": "string",
  "code": "string (optional)"
}
```

## Rate Limiting

- Standard users: 100 requests per minute
- Admin users: 500 requests per minute
- Live transcription: 1 concurrent session per user

## Security

- All API keys are encrypted using AES-256-GCM
- Row Level Security (RLS) enforced at database level
- Session tokens expire after 7 days
- CORS configured for production domain only

## Webhooks

NextER supports webhooks for the following events:
- Analysis completed
- Transcription completed
- User signup
- API key expiration

Configure webhooks in the admin panel.

## SDKs

Official SDKs available:
- JavaScript/TypeScript: `npm install @nexter/sdk`
- Python: `pip install nexter-sdk`
- Go: `go get github.com/nexter/go-sdk`

## Support

For API support:
- Documentation: https://lanoitcif.com/docs
- Email: api@lanoitcif.com
- GitHub: https://github.com/nexter/api-issues