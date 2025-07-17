import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

const mockCreateClient = createClient as jest.Mock;

describe('/api/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if the token is invalid', async () => {
    const mockGetUser = jest.fn().mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
    mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });

    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-token' },
      body: JSON.stringify({ transcript: 'test', companyId: '123', companyTypeId: '456', keySource: 'owner', provider: 'openai', model: 'gpt-4' })
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 if the request body is invalid', async () => {
    const mockGetUser = jest.fn().mockResolvedValueOnce({ data: { user: { id: 'user-123' } }, error: null });
    mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });

    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: JSON.stringify({}), // Invalid body
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});