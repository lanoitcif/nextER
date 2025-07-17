import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';

let mockGetUser: jest.Mock;
let mockFrom: jest.Mock;
let mockUpdate: jest.Mock;

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => {
    const mock = {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    };
    // Chainable mocks
    mockFrom.mockReturnValue(mock);
    (mock as any).update = mockUpdate;
    (mock as any).eq = jest.fn(() => mock);
    (mock as any).select = jest.fn(() => mock);
    (mock as any).single = jest.fn().mockResolvedValue({ data: { id: '123' }, error: null });
    (mock as any).delete = jest.fn(() => mock);

    return mock;
  }),
}));

describe('/api/user-api-keys/[id]', () => {
  beforeEach(() => {
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockFrom = jest.fn();
    mockUpdate = jest.fn().mockResolvedValue({ data: { id: '123' }, error: null });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT', () => {
    it('should return 401 if the token is invalid', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'PUT',
        headers: { Authorization: 'Bearer invalid-token' },
        body: JSON.stringify({ nickname: 'test' }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(401);
    });

    it('should return 400 if the request body is invalid', async () => {
      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'PUT',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({}), // Invalid body
      });
      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('should return 401 if the token is invalid', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
      const request = new NextRequest('http://localhost/api/user-api-keys/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer invalid-token' },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(401);
    });
  });
});