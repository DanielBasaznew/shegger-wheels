import { NextResponse } from 'next/server';
import { getServerDisputes } from '@/lib/server-store';

export async function GET() {
  const disputes = getServerDisputes();
  return NextResponse.json(disputes, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
