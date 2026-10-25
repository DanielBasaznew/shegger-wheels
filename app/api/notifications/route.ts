import { NextResponse } from 'next/server';
import { getServerNotifications, saveServerNotifications } from '@/lib/server-store';
import { Notification } from '@/lib/types';

export async function GET() {
  const notifications = getServerNotifications();
  return NextResponse.json(notifications, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && body.id) {
      const notifs = getServerNotifications();
      notifs.unshift(body as Notification);
      saveServerNotifications(notifs);
      return NextResponse.json({ success: true, notification: body });
    }
    return NextResponse.json({ success: false, error: 'Invalid notification payload' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed request' }, { status: 400 });
  }
}

