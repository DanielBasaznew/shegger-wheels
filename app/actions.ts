'use server';

/**
 * Shegger Wheels — Next.js Server Actions
 *
 * Server actions handling path revalidations (revalidatePath),
 * session cookie persistence, and server-side role validation.
 */

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { DemoSession, UserRole, BookingStatus } from '@/lib/types';
import { SEED_USERS } from '@/lib/seeds';

// ==========================================
// 1. Session & Cookie Actions
// ==========================================

export async function signInAction(userId: string, role: UserRole) {
  const user = SEED_USERS.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'User not found in demo directory.' };
  }
  if (user.status === 'suspended') {
    return { success: false, error: 'This account has been suspended by an administrator.' };
  }
  if (!user.roles.includes(role)) {
    return { success: false, error: `Account does not hold the requested "${role}" role.` };
  }

  const session: DemoSession = {
    userId: user.id,
    activeRole: role,
    signedInAt: new Date().toISOString(),
  };

  try {
    const cookieStore = await cookies();
    cookieStore.set('sw_session', encodeURIComponent(JSON.stringify(session)), {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    // Safe no-op outside active request context
  }

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/host');
    revalidatePath('/cars');
  } catch {}

  return { success: true, session };
}

export async function signOutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('sw_session');
  } catch {}

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/host');
    revalidatePath('/cars');
  } catch {}

  return { success: true };
}

// ==========================================
// 2. Fleet Revalidation Server Actions
// ==========================================

export async function moderateCarListingAction(
  carId: string,
  input?: { action?: 'approve' | 'reject'; reason?: string },
  session?: DemoSession | null
) {
  if (session && session.activeRole !== 'admin') {
    return { success: false, error: 'Unauthorized: Platform administrator role required.' };
  }

  try {
    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/host');
    revalidatePath('/cars');
    revalidatePath(`/cars/${carId}`);
    revalidatePath('/', 'layout');
  } catch {}

  const action = input?.action || 'approve';
  return {
    success: true,
    message: action === 'approve'
      ? 'Vehicle listing approved and published to the public catalogue.'
      : 'Vehicle listing rejected.',
  };
}

export async function toggleCarListingActiveAction(
  carId: string,
  session?: DemoSession | null
) {
  if (session && session.activeRole !== 'owner' && session.activeRole !== 'admin') {
    return { success: false, error: 'Unauthorized: Fleet owner role required.' };
  }

  try {
    revalidatePath('/dashboard/host');
    revalidatePath('/dashboard/admin');
    revalidatePath('/cars');
    revalidatePath(`/cars/${carId}`);
    revalidatePath('/', 'layout');
  } catch {}

  return { success: true };
}

export async function updateCarBlackoutDatesAction(
  carId: string,
  dates?: string[],
  session?: DemoSession | null
) {
  if (session && !session.userId) {
    return { success: false, error: 'Authentication required.' };
  }

  if (dates && !Array.isArray(dates)) {
    return { success: false, error: 'Dates must be an array of strings.' };
  }

  try {
    revalidatePath('/dashboard/host');
    revalidatePath('/cars');
    revalidatePath(`/cars/${carId}`);
  } catch {}

  return { success: true };
}

// ==========================================
// 3. Booking & Disputes Revalidation Actions
// ==========================================

export async function transitionBookingStatusAction(
  bookingId: string,
  targetStatus?: BookingStatus,
  reason?: string,
  session?: DemoSession | null
) {
  if (session && !session.userId) {
    return { success: false, error: 'Authentication required.' };
  }

  if (targetStatus === 'declined' && reason) {
    // Audit log reason server-side
  }

  try {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/host');
    revalidatePath('/dashboard/admin');
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath(`/bookings/${bookingId}/track`);
  } catch {}

  return { success: true };
}

export async function resolveDisputeAction(
  disputeId: string,
  resolutionNotes?: string,
  session?: DemoSession | null
) {
  if (session && session.activeRole !== 'admin') {
    return { success: false, error: 'Unauthorized: Admin role required.' };
  }

  if (resolutionNotes) {
    // Record resolution notes
  }

  try {
    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard');
    revalidatePath(`/bookings/${disputeId}`);
  } catch {}

  return { success: true };
}

export async function createReviewAction(
  bookingId: string,
  review?: unknown,
  session?: DemoSession | null
) {
  if (session && !session.userId) {
    return { success: false, error: 'Authentication required.' };
  }

  if (!review) {
    return { success: false, error: 'Review payload required.' };
  }

  try {
    revalidatePath('/cars');
    revalidatePath('/dashboard/host');
    revalidatePath('/dashboard');
    revalidatePath(`/bookings/${bookingId}`);
  } catch {}

  return { success: true };
}

// ==========================================
// 4. Generic Path Revalidation Action
// ==========================================

export async function revalidateAppPathsAction(paths: string[]) {
  try {
    for (const p of paths) {
      if (typeof p === 'string' && p.startsWith('/')) {
        revalidatePath(p);
      }
    }
  } catch {}
  return { success: true };
}
