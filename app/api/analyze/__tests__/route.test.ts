import { NextRequest } from 'next/server';
import { POST } from '../route';

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
    (mock as any).single = jest.fn().mockResolvedValue({ data: { can_use_owner_key: true }, error: null });
    (mock as any).insert = jest.fn(() => mock);

    return mock;
  }),
}));

describe('/api/analyze', () => {
  beforeEach(() => {
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockFrom = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if the token is invalid', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });
    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-token' },
      body: JSON.stringify({ transcript: 'test', companyId: '123', companyTypeId: '456', keySource: 'owner', provider: 'openai', model: 'gpt-4' })
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 if the request body is invalid', async () => {
    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: JSON.stringify({}), // Invalid body
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
