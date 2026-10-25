import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerReviews, saveServerReviews } from '@/lib/server-store';
import { Review } from '@/lib/types';

export async function GET() {
  const reviews = getServerReviews();
  return NextResponse.json(reviews, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && body.id) {
      const reviews = getServerReviews();
      reviews.push(body as Review);
      saveServerReviews(reviews);
      try {
        revalidatePath('/cars');
        revalidatePath('/dashboard/host');
      } catch {}
      return NextResponse.json({ success: true, review: body });
    }
    return NextResponse.json({ success: false, error: 'Invalid review payload' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed request' }, { status: 400 });
  }
}

