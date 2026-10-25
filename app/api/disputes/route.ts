import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerDisputes, saveServerDisputes } from '@/lib/server-store';
import { Dispute } from '@/lib/types';

export async function GET() {
  const disputes = getServerDisputes();
  return NextResponse.json(disputes, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && body.id) {
      const disputes = getServerDisputes();
      const idx = disputes.findIndex((d) => d.id === body.id);
      if (idx >= 0) {
        disputes[idx] = body as Dispute;
      } else {
        disputes.unshift(body as Dispute);
      }
      saveServerDisputes(disputes);
      try {
        revalidatePath('/dashboard/admin');
        revalidatePath('/dashboard/host');
      } catch {}
      return NextResponse.json({ success: true, dispute: body });
    }
    return NextResponse.json({ success: false, error: 'Invalid dispute payload' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed request' }, { status: 400 });
  }
}

