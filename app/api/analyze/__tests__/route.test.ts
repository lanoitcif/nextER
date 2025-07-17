import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock the supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/analyze', () => {
  it('should return 401 if no token is provided', async () => {
    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: new Headers(),
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
      headers: new Headers({
        Authorization: 'Bearer invalid-token',
      }),
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
      headers: new Headers({
        Authorization: 'Bearer valid-token',
      }),
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
