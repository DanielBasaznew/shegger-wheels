import { NextResponse } from 'next/server';
import { getServerCars } from '@/lib/server-store';

export async function GET() {
  const cars = getServerCars();
  return NextResponse.json(cars, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
