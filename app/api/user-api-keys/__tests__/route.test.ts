import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

let mockGetUser: jest.Mock;
let mockFrom: jest.Mock;

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
    (mock as any).select = jest.fn(() => mock);
    (mock as any).eq = jest.fn(() => mock);
    (mock as any).maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    (mock as any).insert = jest.fn(() => mock);
    (mock as any).single = jest.fn().mockResolvedValue({ data: { id: '123' }, error: null });
    (mock as any).order = jest.fn(() => mock);

    return mock;
  }),
}));

describe('/api/user-api-keys', () => {
  beforeEach(() => {
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockFrom = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 401 if the token is invalid', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
      const request = new NextRequest('http://localhost/api/user-api-keys', {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid-token' },
        body: JSON.stringify({ provider: 'openai', apiKey: 'test', nickname: 'test' })
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 if the request body is invalid', async () => {
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
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
      const request = new NextRequest('http://localhost/api/user-api-keys', {
        method: 'GET',
        headers: { Authorization: 'Bearer invalid-token' },
      });
      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });
});
