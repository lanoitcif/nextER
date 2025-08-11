import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'

export const handlers = [
  // Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
    })
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    })
  }),

  // User profiles
  http.get(`${SUPABASE_URL}/rest/v1/user_profiles`, () => {
    return HttpResponse.json([
      {
        id: 'mock-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        access_level: 'basic',
        created_at: new Date().toISOString(),
      },
    ])
  }),

  // Companies
  http.get(`${SUPABASE_URL}/rest/v1/companies`, () => {
    return HttpResponse.json([
      {
        id: 'company-1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        primary_company_type_id: 'tech',
        is_active: true,
      },
      {
        id: 'company-2',
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        primary_company_type_id: 'tech',
        is_active: true,
      },
    ])
  }),

  // Company types
  http.get(`${SUPABASE_URL}/rest/v1/company_types`, () => {
    return HttpResponse.json([
      {
        id: 'tech',
        name: 'Technology',
        description: 'Technology companies',
        system_prompt_template: 'Analyze as a tech company...',
        is_active: true,
      },
      {
        id: 'reit',
        name: 'REIT',
        description: 'Real Estate Investment Trusts',
        system_prompt_template: 'Analyze as a REIT...',
        is_active: true,
      },
    ])
  }),

  // Analysis endpoint
  http.post('/api/analyze', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      result: `Mock analysis result for ${body.companyTicker}`,
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      },
    })
  }),

  // Templates
  http.get('/api/templates', () => {
    return HttpResponse.json({
      templates: [
        {
          id: 'template-1',
          name: 'Basic Analysis',
          display_name: 'Basic Analysis Template',
          description: 'Standard earnings analysis',
          system_prompt: 'Analyze the earnings...',
          category: 'general',
          is_active: true,
        },
      ],
    })
  }),

  // Admin users
  http.get('/api/admin/users', () => {
    return HttpResponse.json({
      users: [
        {
          id: 'user-1',
          email: 'admin@example.com',
          full_name: 'Admin User',
          access_level: 'admin',
        },
        {
          id: 'user-2',
          email: 'user@example.com',
          full_name: 'Regular User',
          access_level: 'basic',
        },
      ],
    })
  }),

  // File upload
  http.post('/api/upload', () => {
    return HttpResponse.json({
      success: true,
      content: 'Mock transcript content from uploaded file',
    })
  }),

  // Catch-all for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`)
    return HttpResponse.json({ error: 'Not mocked' }, { status: 404 })
  }),
]