import { NextResponse } from 'next/server';

export function handleError(error: any) {
  console.error(error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
