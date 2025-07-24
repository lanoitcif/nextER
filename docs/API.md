# API Documentation

This document provides detailed information about the LLM Transcript Analyzer API endpoints.

## Authentication

All API endpoints require authentication via Bearer token (JWT) from Supabase Auth.

```bash
Authorization: Bearer <your_jwt_token>
```

## Base URL

```
Development: http://localhost:3000/api
Production: https://lanoitcif.com/api
```

## Supported Models

### OpenAI
- **Default**: `gpt-4.1-mini` (cost-effective)
- Available: `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3`, `o3-pro`, `o4-mini`, `o4-mini-high`, `gpt-4o`, `gpt-4o-mini`, `gpt-4o-audio`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`

### Anthropic
- **Default**: `claude-4-sonnet` (balanced performance)
- Available: `claude-4-opus`, `claude-4-sonnet`, `claude-3.7-sonnet`, `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`

### Google
- **Default**: `gemini-2.5-flash` (cost-effective)
- Available: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`

### Cohere
- **Default**: `command-a-03-2025` (most performant)
- Available: `command-a-03-2025`, `command-r-plus-08-2024`, `command-r-08-2024`, `command-r7b`, `command-r-plus`, `command-r`, `command`

## Endpoints

### POST /api/analyze

Analyzes a transcript using the specified LLM provider and prompt. Can automatically select analysis type based on company ticker.

#### Request

```typescript
interface AnalyzeRequest {
  transcript: string;           // The transcript text to analyze
  companyId: string;            // ID of the selected company
  companyTypeId: string;        // ID of the selected company analysis type
  provider: 'openai' | 'anthropic' | 'google' | 'cohere';
  model?: string;              // Optional specific model (uses default if not provided)
  keySource: 'owner' | 'user_saved' | 'user_temporary';
  userApiKeyId?: string;       // Required if keySource is 'user_saved'
  temporaryApiKey?: string;    // Required if keySource is 'user_temporary'
  quarter?: string;            // Optional quarter label (e.g., 'Q1')
  year?: number;               // Optional year of the call
}
```

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "transcript": "Meeting started at 9 AM. John discussed the Q3 budget...",
    "companyId": "123e4567-e89b-12d3-a456-426614174000",
    "companyTypeId": "general_analysis",
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "keySource": "owner"
  }'
```


#### Response

```typescript
interface AnalyzeResponse {
  success: boolean;           // Indicates if the analysis was successful
  analysis: string;           // The AI-generated analysis
  usage: {                    // Token usage information
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
  model: string;              // Model used for the analysis
  provider: string;           // Provider used for the analysis
}
```

#### Example Response

```json
{
  "success": true,
  "analysis": "## Meeting Summary\n\n### Key Points\n- Q3 budget discussion led by John...",
  "usage": {
    "totalTokens": 1234,
    "promptTokens": 1000,
    "completionTokens": 234
  },
  "model": "gpt-4o-mini",
  "provider": "openai"
}
```

#### Error Responses

```typescript
// Authentication Error
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}

// Validation Error
{
  "error": "Validation Error",
  "message": "Missing required field: transcript"
}

// API Key Error
{
  "error": "API Key Error",
  "message": "Invalid or missing API key for provider"
}

// Provider Error
{
  "error": "Provider Error",
  "message": "Rate limit exceeded",
  "provider": "openai"
}
```

---

### GET /api/companies

Retrieves available companies and their ticker symbols.

#### Response

```typescript
interface Company {
  id: string;
  ticker: string;
  name: string;
  primaryCompanyTypeId: string;
  additionalCompanyTypes: string[];
}

interface GetCompaniesResponse {
  companies: Company[];
}
```

#### Example Response

```json
{
  "companies": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "ticker": "DAL",
      "name": "Delta Air Lines",
      "primaryCompanyTypeId": "airline",
      "additionalCompanyTypes": ["earnings_analyst"]
    }
  ]
}
```

---

### GET /api/company-types

Retrieves available company analysis types for a specific company. This endpoint returns the analysis types that are applicable to the selected company based on its primary and additional company types.

#### Query Parameters

```typescript
interface CompanyTypesQuery {
  companyId: string;  // Required: UUID of the company to get analysis types for
}
```

#### Response

```typescript
interface CompanyType {
  id: string;
  name: string;
  description: string;
  system_prompt_template: string;
}

interface GetCompanyTypesResponse {
  companyTypes: CompanyType[];
  primaryTypeId: string;  // The primary company type ID for this company
}
```

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/company-types?companyId=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <your_jwt_token>"
```

#### Example Response

```json
{
  "companyTypes": [
    {
      "id": "hospitality_reit",
      "name": "Hospitality REIT",
      "description": "Analysis template for hospitality real estate investment trusts",
      "system_prompt_template": "You are analyzing a hospitality REIT..."
    },
    {
      "id": "earnings_analyst", 
      "name": "Earnings Analyst",
      "description": "Narrative analysis format for earnings calls",
      "system_prompt_template": "You are providing earnings analysis..."
    },
    {
      "id": "general_analysis",
      "name": "General Analysis", 
      "description": "Default general financial analysis template suitable for all company types",
      "system_prompt_template": "You are a financial analyst providing comprehensive earnings analysis."
    }
  ],
  "primaryTypeId": "hospitality_reit"
}
```

#### Error Responses

```typescript
// Missing Company ID
{
  "error": "Company ID is required"
}

// Company Not Found
{
  "error": "Company not found"
}

// Authentication Error
{
  "error": "Unauthorized"
}
```

---

### GET /api/user-api-keys

Retrieves user's saved API keys (metadata only, encrypted keys are not returned).

#### Response

```typescript
interface UserApiKey {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'cohere';
  nickname: string;
  created_at: string;
  last_used?: string;
  assigned_by_admin?: boolean;
  default_model?: string;
}

interface GetApiKeysResponse {
  success: boolean;
  keys: UserApiKey[];
}
```

#### Example Response

```json
{
  "keys": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "provider": "openai",
      "nickname": "My OpenAI Key",
      "created_at": "2025-01-15T10:30:00Z",
      "last_used": "2025-01-15T14:22:00Z"
    }
  ]
}
```

---

### POST /api/user-api-keys

Adds a new encrypted API key for the user.

#### Request

```typescript
interface AddApiKeyRequest {
  provider: 'openai' | 'anthropic' | 'google' | 'cohere';
  apiKey: string;              // Will be encrypted before storage
  nickname?: string;           // User-friendly name for the key
  defaultModel?: string;       // Default model to use with this key
}
```

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/user-api-keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-proj-abc123...",
    "nickname": "My OpenAI Key"
  }'
```

#### Response

```typescript
interface AddApiKeyResponse {
  success: boolean;
  apiKey: {
    id: string;
    provider: string;
    nickname: string;
    created_at: string;
    default_model?: string;
  };
}
```

#### Example Response

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "API key added successfully"
}
```



---

### PUT /api/user-api-keys/[id]

Updates the nickname for an existing API key.

#### Request

```typescript
interface UpdateApiKeyRequest {
  nickname?: string;
  defaultModel?: string;
}
```

#### Response

```json
{
  "success": true,
  "apiKey": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "provider": "openai",
    "nickname": "My Updated OpenAI Key",
    "created_at": "2025-01-15T10:30:00Z",
    "default_model": "gpt-4.1-mini"
  }
}
```

---

### DELETE /api/user-api-keys/[id]

Deletes an API key permanently.

#### Response

```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

## Available Prompts

Retrieve available analysis prompts from the database:

```sql
SELECT id, name, display_name, description, category 
FROM prompts 
WHERE active = true 
ORDER BY category, display_name;
```

### Default Prompts

| ID | Name | Display Name | Category |
|----|------|--------------|----------|
| `meeting_summary` | meeting_summary | Meeting Summary | meeting |
| `interview_analysis` | interview_analysis | Interview Analysis | interview |
| `sentiment_analysis` | sentiment_analysis | Sentiment Analysis | sentiment |
| `sales_call_analysis` | sales_call_analysis | Sales Call Analysis | sales |

### Industry-Specific Company Types

| ID | Name | Description |
|----|------|-------------|
| `hospitality_reit` | Hospitality REIT | Analysis template for hospitality real estate investment trusts |
| `airline` | Airline | Analysis template for airline companies |
| `credit_card` | Credit Card | Analysis template for credit card companies |
| `luxury_retail` | Luxury Retail | Analysis template for luxury retail companies |
| `hospitality_ccorp` | Hospitality C-Corporation | Analysis template for hospitality management companies |
| `earnings_analyst` | Earnings Analyst | Narrative analysis format for earnings calls |

### Supported Companies

| Ticker | Company Name | Primary Type | Additional Types |
|--------|--------------|--------------|------------------|
| DAL | Delta Air Lines | airline | earnings_analyst |
| HST | Host Hotels & Resorts | hospitality_reit | earnings_analyst |
| AXP | American Express | credit_card | earnings_analyst |
| PEB | Pebblebrook Hotel Trust | hospitality_reit | earnings_analyst |
| DRH | DiamondRock Hospitality | hospitality_reit | earnings_analyst |
| LVMH | LVMH Moët Hennessy Louis Vuitton | luxury_retail | earnings_analyst |
| HLT | Hilton Worldwide Holdings Inc | hospitality_ccorp | earnings_analyst |
| MAR | Marriott International Inc | hospitality_ccorp | earnings_analyst |
| ABNB | Airbnb, Inc. | hospitality_ccorp | - |
| PK | Park Hotels & Resorts | hospitality_reit | - |
| RHP | Ryman Hospitality Properties, Inc. | hospitality_reit | - |

## LLM Providers & Models

### OpenAI (Updated 2025)
- `gpt-4.1-mini` (default)
- `gpt-4.1`
- `gpt-4.1-nano`
- `o3`, `o3-pro`
- `o4-mini`, `o4-mini-high`
- `gpt-4o`, `gpt-4o-mini`, `gpt-4o-audio`
- `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`

### Anthropic (Updated 2025)
- `claude-4-sonnet` (default)
- `claude-4-opus`
- `claude-3.7-sonnet`
- `claude-3-5-sonnet-20241022`
- `claude-3-5-haiku-20241022`
- `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`

### Google (Updated 2025)
- `gemini-2.5-flash` (default)
- `gemini-2.5-pro`
- `gemini-2.5-flash-lite`
- `gemini-2.0-flash`, `gemini-2.0-flash-lite`
- `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`

### Cohere (Updated 2025)
- `command-a-03-2025` (default)
- `command-r-plus-08-2024`
- `command-r-08-2024`, `command-r7b`
- `command-r-plus`, `command-r`, `command`

## Rate Limits

Rate limits are enforced by individual LLM providers:

- **OpenAI**: Varies by tier (typically 3,500-10,000 requests/minute)
- **Anthropic**: 1,000 requests/minute for Claude models
- **Google**: 60 requests/minute for Gemini models
- **Cohere**: 1,000 requests/minute

## Error Handling

All API endpoints return standardized error responses:

```typescript
interface ErrorResponse {
  error: string;               // Error type/category
  message: string;            // Human-readable error message
  provider?: string;          // Provider name (for provider-specific errors)
  statusCode?: number;        // HTTP status code
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (provider outage)

## Usage Tracking

All API calls are logged in the `usage_logs` table with:

- User ID and timestamp
- Provider and model used
- Token consumption
- Estimated costs
- Processing time
- Request metadata

## Security Considerations

- **API Keys**: Never log or expose API keys in responses
- **Encryption**: All user API keys encrypted with AES-256-GCM
- **Authentication**: JWT tokens validated on every request
- **Rate Limiting**: Implement client-side rate limiting to respect provider limits
- **Input Validation**: All inputs sanitized and validated with Zod.

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    transcript: transcriptText,
    promptId: 'meeting_summary',
    provider: 'openai',
    keySource: 'owner'
  })
});

const result = await response.json();
console.log(result.analysis);
```

### Python

```python
import requests

response = requests.post('http://localhost:3000/api/analyze', 
  headers={
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {user_token}'
  },
  json={
    'transcript': transcript_text,
    'promptId': 'meeting_summary',
    'provider': 'openai',
    'keySource': 'owner'
  }
)

result = response.json()
print(result['analysis'])
```

### GET /api/earnings-qa

Retrieve stored Q&A entries extracted from "QA Only" analyses.

```typescript
interface EarningsQAQuery {
  companyId?: string
  quarter?: string
  year?: number
  analyst?: string
  representative?: string
}

interface EarningsQAEntry {
  company_id: string | null
  company_type_id: string | null
  quarter: string | null
  year: number | null
  earnings_analyst: string | null
  company_representative: string | null
  question_topic: string | null
  key_points: string | null
  quantitative_data: string | null
  management_response: string | null
  created_at: string
}

interface EarningsQAResponse {
  entries: EarningsQAEntry[]
}
```

## Webhook Support

Currently not implemented. Future versions may include:

- Analysis completion webhooks
- Usage limit notifications
- Error alert webhooks
