import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: any; params?: any }
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context: { params?: any } = {}) => {
    // Use cookie-based authentication as recommended by Supabase for Next.js
    const supabase = await createClient();
    
    // getUser() will use the session from cookies automatically
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return handler(request, { ...context, user });
  };
}
