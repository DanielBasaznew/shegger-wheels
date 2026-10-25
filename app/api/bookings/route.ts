import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerBookings, updateServerBooking } from '@/lib/server-store';
import { Booking } from '@/lib/types';

export async function GET() {
  const bookings = getServerBookings();
  return NextResponse.json(bookings, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && body.id) {
      updateServerBooking(body as Booking);
      try {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/host');
        revalidatePath('/dashboard/admin');
      } catch {}
      return NextResponse.json({ success: true, booking: body });
    }
    return NextResponse.json({ success: false, error: 'Invalid booking payload' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed request' }, { status: 400 });
  }
}

