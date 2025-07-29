import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock the supabase client
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' },
        }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        transcriptId: '123e4567-e89b-12d3-a456-426614174000',
        feedback: 1
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 401 if the token is invalid', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' },
        }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
      body: JSON.stringify({
        transcriptId: '123e4567-e89b-12d3-a456-426614174000',
        feedback: 1
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 if the request body is invalid', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        // Missing required fields
        feedback: 1
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 if feedback value is invalid', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        transcriptId: '123e4567-e89b-12d3-a456-426614174000',
        feedback: 0 // Invalid value (should be 1 or -1)
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 404 if transcript does not exist', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        transcriptId: '123e4567-e89b-12d3-a456-426614174000',
        feedback: 1
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Transcript not found or access denied');
  });

  it('should update feedback successfully for valid transcript', async () => {
    const transcriptId = '123e4567-e89b-12d3-a456-426614174000';
    const userId = 'user-123';
    
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'analysis_transcripts') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: transcriptId },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
      }),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        transcriptId,
        feedback: 1
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle thumbs down feedback', async () => {
    const transcriptId = '123e4567-e89b-12d3-a456-426614174000';
    const userId = 'user-123';
    
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'analysis_transcripts') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: transcriptId },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
      }),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        transcriptId,
        feedback: -1
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should return 500 if database update fails', async () => {
    const transcriptId = '123e4567-e89b-12d3-a456-426614174000';
    const userId = 'user-123';
    
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'analysis_transcripts') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: transcriptId },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: { message: 'Database error' },
                }),
              }),
            }),
          };
        }
      }),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        transcriptId,
        feedback: 1
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to update feedback');
  });
});