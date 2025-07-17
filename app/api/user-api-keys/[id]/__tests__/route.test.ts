import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock the supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/user-api-keys/[id]', () => {
  describe('PUT', () => {
    it('should return 401 if no token is provided', async () => {
      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'PUT',
        headers: new Headers(),
      });

      const response = await PUT(request, { params: { id: '123' } });
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

      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'PUT',
        headers: new Headers({
          Authorization: 'Bearer invalid-token',
        }),
      });

      const response = await PUT(request, { params: { id: '123' } });
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

      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'PUT',
        headers: new Headers({
          Authorization: 'Bearer valid-token',
        }),
        body: JSON.stringify({}),
      });

      const response = await PUT(request, { params: { id: '123' } });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('should return 401 if no token is provided', async () => {
      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'DELETE',
        headers: new Headers(),
      });

      const response = await DELETE(request, { params: { id: '123' } });
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

      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'DELETE',
        headers: new Headers({
          Authorization: 'Bearer invalid-token',
        }),
      });

      const response = await DELETE(request, { params: { id: '123' } });
      expect(response.status).toBe(401);
    });
  });
});
