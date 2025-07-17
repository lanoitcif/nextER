import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

const mockCreateClient = createClient as jest.Mock;

describe('/api/user-api-keys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 401 if the token is invalid', async () => {
      const mockGetUser = jest.fn().mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
      mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });

      const request = new NextRequest('http://localhost/api/user-api-keys', {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid-token' },
        body: JSON.stringify({ provider: 'openai', apiKey: 'test', nickname: 'test' })
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 if the request body is invalid', async () => {
      const mockGetUser = jest.fn().mockResolvedValueOnce({ data: { user: { id: 'user-123' } }, error: null });
      mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });

      const request = new NextRequest('http://localhost/api/user-api-keys', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({}), // Invalid body
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET', () => {
    it('should return 401 if the token is invalid', async () => {
      const mockGetUser = jest.fn().mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
      mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });

      const request = new NextRequest('http://localhost/api/user-api-keys', {
        method: 'GET',
        headers: { Authorization: 'Bearer invalid-token' },
      });
      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });
});