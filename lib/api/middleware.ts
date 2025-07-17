import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server';

type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: any; params?: any }
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context: { params?: any } = {}) => {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return handler(request, { ...context, user });
  };
}
