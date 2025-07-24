import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock the supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/analyze', () => {
  it('should return 401 if user is not authenticated', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('No session'),
        }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ transcript: 'test', companyId: '123', companyTypeId: '456', keySource: 'owner', provider: 'openai', model: 'gpt-4' })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 401 if the token is invalid', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Invalid token'),
        }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ transcript: 'test', companyId: '123', companyTypeId: '456', keySource: 'owner', provider: 'openai', model: 'gpt-4' })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 if the request body is invalid', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '123' } },
          error: null,
        }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      body: JSON.stringify({}), // Invalid body
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
