import { NextResponse } from 'next/server';
import { getServerNotifications } from '@/lib/server-store';

export async function GET() {
  const notifications = getServerNotifications();
  return NextResponse.json(notifications, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
