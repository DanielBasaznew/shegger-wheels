import { NextResponse } from 'next/server';
import { getServerReviews } from '@/lib/server-store';

export async function GET() {
  const reviews = getServerReviews();
  return NextResponse.json(reviews, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
