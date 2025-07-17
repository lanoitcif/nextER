import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

const mockCreateClient = createClient as jest.Mock;

describe('/api/user-api-keys/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT', () => {
    it('should return 401 if the token is invalid', async () => {
      const mockGetUser = jest.fn().mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
      mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });

      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'PUT',
        headers: { Authorization: 'Bearer invalid-token' },
        body: JSON.stringify({ nickname: 'test' }),
      });
      const response = await PUT(request, { params: { id: '123' } });
      expect(response.status).toBe(401);
    });

    it('should return 400 if the request body is invalid', async () => {
      const mockGetUser = jest.fn().mockResolvedValueOnce({ data: { user: { id: 'user-123' } }, error: null });
      const mockFrom = jest.fn().mockReturnThis();
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: '22P02' } }); // Simulate a validation error

      mockCreateClient.mockReturnValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'PUT',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({}), // Invalid body
      });
      const response = await PUT(request, { params: { id: '123' } });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('should return 401 if the token is invalid', async () => {
      const mockGetUser = jest.fn().mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
      mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });

      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer invalid-token' },
      });
      const response = await DELETE(request, { params: { id: '123' } });
      expect(response.status).toBe(401);
    });
  });
});