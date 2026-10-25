import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerCars, updateServerCar } from '@/lib/server-store';
import { Car } from '@/lib/types';

export async function GET() {
  const cars = getServerCars();
  return NextResponse.json(cars, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && body.id) {
      updateServerCar(body as Car);
      try {
        revalidatePath('/cars');
        revalidatePath('/dashboard/admin');
        revalidatePath('/dashboard/host');
      } catch {}
      return NextResponse.json({ success: true, car: body });
    }
    return NextResponse.json({ success: false, error: 'Invalid car payload' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed request' }, { status: 400 });
  }
}

