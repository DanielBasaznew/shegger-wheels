import { NextResponse } from 'next/server';
import { getServerBookings } from '@/lib/server-store';

export async function GET() {
  const bookings = getServerBookings();
  return NextResponse.json(bookings, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
