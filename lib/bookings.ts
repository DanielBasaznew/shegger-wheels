/**
 * Shegger Wheels — Booking Lifecycle & Validation Engine
 * 
 * Implements the capstone booking lifecycle, conflict checking,
 * price snapshotting, simulated TeleBirr escrow, and the finite
 * state machine (FSM) transitions for Addis Ababa car rentals.
 */

import {
  Booking,
  BookingStatus,
  Car,
  Dispute,
  PaymentStatus,
  UserRole,
} from './types';
import {
  getBookings,
  getBookingById,
  saveBooking,
  getCars,
  getCarById,
  getCurrentSession,
  getUserById,
  getDisputeById,
  saveDispute,
  clearCheckoutDraft,
} from './storage';
import {
  notifyBookingRequested,
  notifyBookingConfirmed,
  notifyBookingDeclined,
  notifyBookingCancelled,
  notifyTripStarted,
  notifyTripCompleted,
  notifyDisputeOpened,
  notifyDisputeResolved,
} from './notifications';

// ==========================================
// Date & Duration Utilities
// ==========================================

export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Checks whether two date ranges [startA, endA) and [startB, endB) overlap.
 * Uses half-open intervals [start, end) where end date is pickup/dropoff boundary.
 */
export function areDatesOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

// ==========================================
// Conflict & Availability Checking
// ==========================================

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictReason?: string;
  conflictingBookingId?: string;
  conflictingDate?: string;
}

/**
 * Active statuses that reserve the vehicle and block other renters.
 */
export const ACTIVE_RESERVATION_STATUSES: BookingStatus[] = [
  'requested',
  'confirmed',
  'in_progress',
];

/**
 * Verifies if a car is available for a given date range.
 * Checks against both the car's unavailable dates and existing active bookings.
 */
export function checkBookingConflicts(
  carId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string,
  statusesToCheck: BookingStatus[] = ACTIVE_RESERVATION_STATUSES
): ConflictCheckResult {
  const car = getCarById(carId);
  if (!car) {
    return {
      hasConflict: true,
      conflictReason: 'The requested vehicle could not be found.',
    };
  }

  // 1. Check car listing status
  if (car.status !== 'approved') {
    return {
      hasConflict: true,
      conflictReason: `Vehicle is currently not available for bookings (status: ${car.status}).`,
    };
  }

  // 2. Check car's owner blackout / unavailable dates
  if (car.unavailableDates && car.unavailableDates.length > 0) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    for (const dStr of car.unavailableDates) {
      const cur = new Date(dStr + 'T00:00:00');
      if (cur >= start && cur < end) {
        return {
          hasConflict: true,
          conflictReason: `The vehicle has been marked unavailable by the host on ${formatDisplayDate(dStr)}.`,
          conflictingDate: dStr,
        };
      }
    }
  }

  // 3. Check existing active bookings in storage
  const allBookings = getBookings();
  const conflictingBooking = allBookings.find((b) => {
    if (b.carId !== carId) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (!statusesToCheck.includes(b.status)) return false;

    return areDatesOverlapping(startDate, endDate, b.startDate, b.endDate);
  });

  if (conflictingBooking) {
    return {
      hasConflict: true,
      conflictReason: `This vehicle is already reserved from ${formatDisplayDate(
        conflictingBooking.startDate
      )} to ${formatDisplayDate(conflictingBooking.endDate)}.`,
      conflictingBookingId: conflictingBooking.id,
    };
  }

  return { hasConflict: false };
}

// ==========================================
// Pricing Engine
// ==========================================

export interface BookingPricing {
  days: number;
  pricePerDay: number; // Snapshot of stored listing price
  subtotal: number; // days * pricePerDay
  platformFee: number; // 5% of subtotal
  handoverFee: number; // 0 for pickup, 400 for delivery
  securityDeposit: number; // 0 for verified demo tier
  total: number; // subtotal + fee + handoverFee
}

/**
 * Computes trusted pricing from stored car rates.
 * Never relies on client-submitted totals.
 */
export function calculateTrustedPrice(
  pricePerDay: number,
  startDate: string,
  endDate: string,
  handoverOption: 'pickup' | 'delivery' = 'pickup'
): BookingPricing {
  const days = calculateDaysBetween(startDate, endDate);
  const subtotal = days * pricePerDay;
  const platformFee = Math.round(subtotal * 0.05); // 5% marketplace escrow fee
  const handoverFee = handoverOption === 'delivery' ? 400 : 0;
  const securityDeposit = 0; // Waived for verified tier
  const total = subtotal + platformFee + handoverFee + securityDeposit;

  return {
    days,
    pricePerDay,
    subtotal,
    platformFee,
    handoverFee,
    securityDeposit,
    total,
  };
}

// ==========================================
// Booking Creation
// ==========================================

export interface CreateBookingInput {
  carId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  handoverOption?: 'pickup' | 'delivery';
  pickupNotes?: string;
  paymentMethod?: 'TeleBirr' | 'CBE Birr' | 'Chapa' | 'Cash on Delivery (Simulated)';
}

export interface CreateBookingResult {
  success: boolean;
  booking?: Booking;
  error?: string;
}

/**
 * Creates and persists a new booking in the requested state.
 * 
 * Enforces:
 * 1. Active session exists.
 * 2. User account is active and has renter role.
 * 3. User is not renting their own car.
 * 4. Car exists, is approved, and has no date conflicts.
 * 5. Dates are valid (future dates, end > start).
 * 6. Generates immutable price snapshot.
 * 7. Sets payment status to held_in_escrow via mock TeleBirr.
 */
export function createBooking(input: CreateBookingInput): CreateBookingResult {
  // 1. Session & role validation
  const session = getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: 'Authentication required. Please sign in to submit a rental booking.',
    };
  }

  const user = getUserById(session.userId);
  if (!user) {
    return {
      success: false,
      error: 'Signed-in user record could not be found.',
    };
  }

  if (user.status === 'suspended') {
    return {
      success: false,
      error: 'Your account is suspended. Booking creation is restricted.',
    };
  }

  if (!user.roles.includes('renter')) {
    return {
      success: false,
      error: 'Your active account does not have renter privileges.',
    };
  }

  // 2. Validate dates & input format
  if (!input.carId || typeof input.carId !== 'string' || !input.carId.trim()) {
    return {
      success: false,
      error: 'A valid vehicle listing ID is required.',
    };
  }

  if (!input.startDate || !input.endDate) {
    return {
      success: false,
      error: 'Please provide both pick-up and return dates.',
    };
  }

  if (!isValidDateString(input.startDate) || !isValidDateString(input.endDate)) {
    return {
      success: false,
      error: 'Dates must be in valid YYYY-MM-DD format with real calendar days.',
    };
  }

  const todayStr = formatDateString(new Date());
  if (input.startDate < todayStr) {
    return {
      success: false,
      error: 'Pick-up date cannot be in the past.',
    };
  }

  if (input.endDate <= input.startDate) {
    return {
      success: false,
      error: 'Return date must be strictly after the pick-up date.',
    };
  }

  const rentalDays = calculateDaysBetween(input.startDate, input.endDate);
  if (rentalDays > 90) {
    return {
      success: false,
      error: 'Rental duration exceeds the maximum permitted window (90 days).',
    };
  }

  if (input.pickupNotes && input.pickupNotes.length > 500) {
    return {
      success: false,
      error: 'Pick-up logistics notes must not exceed 500 characters.',
    };
  }

  // 3. Re-read car from storage
  const car = getCarById(input.carId);
  if (!car) {
    return {
      success: false,
      error: 'Vehicle not found in the fleet catalogue.',
    };
  }

  if (car.status !== 'approved') {
    return {
      success: false,
      error: `Vehicle is not currently approved for rental (status: ${car.status}).`,
    };
  }

  // Prevent renting own vehicle
  if (car.ownerId === user.id) {
    return {
      success: false,
      error: 'You cannot book a vehicle that you own.',
    };
  }

  // 4. Conflict check (unavailable dates and active bookings)
  const conflict = checkBookingConflicts(car.id, input.startDate, input.endDate);
  if (conflict.hasConflict) {
    return {
      success: false,
      error: conflict.conflictReason || 'The requested rental dates are unavailable.',
    };
  }

  // 5. Calculate trusted price snapshot
  const handoverOption = input.handoverOption || 'pickup';
  const pricing = calculateTrustedPrice(
    car.pricePerDay,
    input.startDate,
    input.endDate,
    handoverOption
  );

  // 6. Generate unique booking record
  const now = new Date();
  const uniqueId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const paymentRef = `TB-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;

  const newBooking: Booking = {
    id: uniqueId,
    carId: car.id,
    renterId: user.id,
    ownerId: car.ownerId,
    startDate: input.startDate,
    endDate: input.endDate,
    days: pricing.days,
    pricePerDay: pricing.pricePerDay, // Snapshot
    subtotal: pricing.subtotal,
    fee: pricing.platformFee,
    securityDeposit: pricing.securityDeposit,
    total: pricing.total,
    paymentStatus: 'held_in_escrow',
    paymentMethod: input.paymentMethod || 'TeleBirr',
    paymentReference: paymentRef,
    status: 'requested', // Initial state
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // 7. Persist to storage
  const saveSuccess = saveBooking(newBooking);
  if (!saveSuccess) {
    return {
      success: false,
      error: 'Storage failure: Failed to save booking record to browser storage.',
    };
  }

  // 8. Clean up temporary checkout draft
  clearCheckoutDraft();

  // 9. Dispatch notification to owner
  try {
    notifyBookingRequested(newBooking, car, user.name);
  } catch (err) {
    console.warn('[Shegger Notifications] Non-fatal notification error:', err);
  }

  return {
    success: true,
    booking: newBooking,
  };
}

// ==========================================
// Booking Finite State Machine (FSM)
// ==========================================

export interface TransitionActor {
  userId: string;
  role: UserRole;
}

export interface TransitionOptions {
  reason?: string;
  resolutionNotes?: string;
}

export interface TransitionResult {
  success: boolean;
  booking?: Booking;
  error?: string;
}

/**
 * Valid state transitions matrix.
 * Defines allowed transitions, authorized actor roles, and side effects.
 */
interface TransitionRule {
  allowedActors: Array<'renter' | 'owner' | 'admin'>;
  paymentEffect?: PaymentStatus;
  description: string;
}

const VALID_TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatus, TransitionRule>>> = {
  requested: {
    confirmed: {
      allowedActors: ['owner', 'admin'],
      description: 'Owner approves rental request. Escrow remains held.',
    },
    declined: {
      allowedActors: ['owner', 'admin'],
      paymentEffect: 'refunded',
      description: 'Owner declines rental request. Mock escrow is released/refunded.',
    },
    cancelled: {
      allowedActors: ['renter', 'admin'],
      paymentEffect: 'refunded',
      description: 'Renter cancels pending request. Mock escrow is refunded.',
    },
  },
  confirmed: {
    in_progress: {
      allowedActors: ['renter', 'owner', 'admin'],
      description: 'Key handover completed. Rental trip starts.',
    },
    cancelled: {
      allowedActors: ['renter', 'owner', 'admin'],
      paymentEffect: 'refunded',
      description: 'Trip cancelled prior to handover. Mock escrow refunded.',
    },
  },
  in_progress: {
    completed: {
      allowedActors: ['owner', 'renter', 'admin'],
      paymentEffect: 'paid',
      description: 'Vehicle returned & inspected. Mock escrow disbursed to owner.',
    },
    disputed: {
      allowedActors: ['renter', 'owner', 'admin'],
      description: 'Incident or condition dispute opened.',
    },
  },
  completed: {
    reviewed: {
      allowedActors: ['renter'],
      description: 'Renter submits rating and review for completed rental.',
    },
    disputed: {
      allowedActors: ['renter', 'owner', 'admin'],
      description: 'Post-trip deposit or damage dispute raised.',
    },
  },
  disputed: {
    resolved: {
      allowedActors: ['admin'],
      description: 'Platform administrator reviews evidence and resolves dispute.',
    },
  },
  // Terminal states have no valid forward transitions
  declined: {},
  cancelled: {},
  reviewed: {},
  resolved: {},
};

/**
 * Transitions a booking to a new lifecycle state according to the FSM.
 * 
 * Enforces:
 * 1. Booking exists.
 * 2. Transition from current state to target state is legally defined in FSM.
 * 3. Actor is authorized for this entity (ownership or admin role).
 * 4. Applies state-dependent payment status side effects (e.g. escrow release/refund).
 */
export function transitionBookingStatus(
  bookingId: string,
  targetStatus: BookingStatus,
  actor: TransitionActor,
  options?: TransitionOptions
): TransitionResult {
  // 1. Session verification (Signed-out mutations barrier)
  const session = getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: 'Authentication required. Please sign in to perform actions on bookings.',
    };
  }

  // 2. User existence and suspension check
  const user = getUserById(actor.userId);
  if (!user) {
    return {
      success: false,
      error: `User record "${actor.userId}" could not be found.`,
    };
  }

  if (user.status === 'suspended') {
    return {
      success: false,
      error: 'Your account is suspended. Actions on bookings are restricted.',
    };
  }

  // Session user mismatch verification
  const sessionUser = getUserById(session.userId);
  const sessionIsAdmin = Boolean(sessionUser?.roles.includes('admin') && session.activeRole === 'admin');

  if (session.userId !== actor.userId && !sessionIsAdmin) {
    return {
      success: false,
      error: `Session mismatch: Signed in as "${session.userId}", not "${actor.userId}".`,
    };
  }

  // 3. Booking lookup
  const booking = getBookingById(bookingId);
  if (!booking) {
    return {
      success: false,
      error: `Booking "${bookingId}" not found.`,
    };
  }

  const currentStatus = booking.status;

  // 4. Check if transition exists in FSM
  const allowedTransitionsFromCurrent = VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitionsFromCurrent) {
    return {
      success: false,
      error: `Booking is in invalid state "${currentStatus}".`,
    };
  }

  const rule = allowedTransitionsFromCurrent[targetStatus];
  if (!rule) {
    return {
      success: false,
      error: `Cannot transition booking from "${currentStatus}" to "${targetStatus}". Unsupported transition.`,
    };
  }

  // Strict role verification: actor can only exercise admin privileges if their account holds the admin role
  const isAdmin = Boolean((actor.role === 'admin' || session.activeRole === 'admin') && user.roles.includes('admin'));
  const isRenter = booking.renterId === actor.userId && user.roles.includes('renter');
  const isOwner = booking.ownerId === actor.userId && user.roles.includes('owner');

  let isAuthorized = false;
  if (isAdmin) {
    isAuthorized = true;
  } else if (rule.allowedActors.includes('renter') && isRenter) {
    isAuthorized = true;
  } else if (rule.allowedActors.includes('owner') && isOwner) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return {
      success: false,
      error: `Unauthorized: User "${actor.userId}" is not authorized to transition this booking to "${targetStatus}".`,
    };
  }

  // 3. Stale & Availability Conflict Check: Prevent confirming if car is unavailable or conflicting
  if (targetStatus === 'confirmed') {
    const conflict = checkBookingConflicts(
      booking.carId,
      booking.startDate,
      booking.endDate,
      booking.id, // exclude self
      ['confirmed', 'in_progress'] // Only confirmed or active in-progress rentals block confirmation
    );
    if (conflict.hasConflict) {
      return {
        success: false,
        error:
          conflict.conflictReason ||
          'Cannot confirm reservation: The vehicle is no longer available for these dates due to a blackout date or overlapping booking.',
      };
    }
  }

  // 4. Build updated booking
  const updatedBooking: Booking = {
    ...booking,
    status: targetStatus,
    updatedAt: new Date().toISOString(),
  };

  // 5. Apply payment side effects
  if (rule.paymentEffect) {
    updatedBooking.paymentStatus = rule.paymentEffect;
  }

  // 6. Apply reason options
  if (targetStatus === 'declined' && options?.reason) {
    updatedBooking.declineReason = options.reason;
  } else if (targetStatus === 'cancelled' && options?.reason) {
    updatedBooking.cancellationReason = options.reason;
  } else if (targetStatus === 'disputed' && options?.reason) {
    updatedBooking.disputeReason = options.reason;
  }

  // 7. Save update
  const saved = saveBooking(updatedBooking);
  if (!saved) {
    return {
      success: false,
      error: 'Storage failure: Could not persist updated booking status.',
    };
  }

  // 8. Trigger domain notifications based on new status
  try {
    const car = getCarById(updatedBooking.carId);
    if (targetStatus === 'confirmed') {
      notifyBookingConfirmed(updatedBooking, car);
    } else if (targetStatus === 'declined') {
      notifyBookingDeclined(updatedBooking, car, options?.reason);
    } else if (targetStatus === 'cancelled') {
      notifyBookingCancelled(updatedBooking, car, actor.role, options?.reason);
    } else if (targetStatus === 'in_progress') {
      notifyTripStarted(updatedBooking, car);
    } else if (targetStatus === 'completed') {
      notifyTripCompleted(updatedBooking, car);
    } else if (targetStatus === 'disputed') {
      notifyDisputeOpened(updatedBooking, car, actor.userId, options?.reason);
    } else if (targetStatus === 'resolved') {
      notifyDisputeResolved(updatedBooking, car, options?.reason);
    }
  } catch (err) {
    console.warn('[Shegger Notifications] Non-fatal notification error on transition:', err);
  }

  return {
    success: true,
    booking: updatedBooking,
  };
}

// ==========================================
// Owner-Specific Booking Operations
// ==========================================

export interface OwnerOperationResult {
  success: boolean;
  booking?: Booking;
  error?: string;
}

/**
 * Validates that an active owner session exists, account is not suspended,
 * and caller is the legitimate owner of the vehicle in the booking.
 */
function validateOwnerAction(
  bookingId: string,
  actor: { userId: string; role: UserRole }
): { valid: boolean; booking?: Booking; error?: string } {
  const session = getCurrentSession();
  if (!session) {
    return {
      valid: false,
      error: 'Authentication required. Please sign in as the vehicle owner.',
    };
  }

  const user = getUserById(actor.userId);
  if (!user) {
    return { valid: false, error: 'User record not found.' };
  }

  if (user.status === 'suspended') {
    return {
      valid: false,
      error: 'Your account is suspended. Host operations are restricted.',
    };
  }

  const sessionUser = getUserById(session.userId);
  const sessionIsAdmin = Boolean(sessionUser?.roles.includes('admin') && session.activeRole === 'admin');

  if (session.userId !== actor.userId && !sessionIsAdmin) {
    return {
      valid: false,
      error: `Session mismatch: Signed in as "${session.userId}", not "${actor.userId}".`,
    };
  }

  const isAdmin = Boolean((actor.role === 'admin' || session.activeRole === 'admin') && user.roles.includes('admin'));

  if (!user.roles.includes('owner') && !isAdmin) {
    return {
      valid: false,
      error: 'Your account does not possess vehicle owner permissions.',
    };
  }

  const booking = getBookingById(bookingId);
  if (!booking) {
    return { valid: false, error: 'Reservation record not found.' };
  }

  if (booking.ownerId !== actor.userId && !isAdmin) {
    return {
      valid: false,
      error: 'Unauthorized: You do not own the vehicle for this reservation.',
    };
  }

  return { valid: true, booking };
}

/**
 * Vehicle owner confirms an incoming booking request.
 * Verifies no stale calendar conflicts exist.
 */
export function confirmBookingByOwner(
  bookingId: string,
  actor: { userId: string; role: UserRole }
): OwnerOperationResult {
  const check = validateOwnerAction(bookingId, actor);
  if (!check.valid || !check.booking) {
    return { success: false, error: check.error };
  }

  if (check.booking.status !== 'requested') {
    return {
      success: false,
      error: `Only "requested" bookings can be confirmed. Current status: "${check.booking.status}".`,
    };
  }

  return transitionBookingStatus(bookingId, 'confirmed', {
    userId: actor.userId,
    role: actor.role === 'admin' ? 'admin' : 'owner',
  });
}

/**
 * Vehicle owner declines an incoming booking request.
 * Triggers simulated TeleBirr escrow refund to renter.
 */
export function declineBookingByOwner(
  bookingId: string,
  actor: { userId: string; role: UserRole },
  reason?: string
): OwnerOperationResult {
  const check = validateOwnerAction(bookingId, actor);
  if (!check.valid || !check.booking) {
    return { success: false, error: check.error };
  }

  if (check.booking.status !== 'requested') {
    return {
      success: false,
      error: `Only "requested" bookings can be declined. Current status: "${check.booking.status}".`,
    };
  }

  return transitionBookingStatus(
    bookingId,
    'declined',
    {
      userId: actor.userId,
      role: actor.role === 'admin' ? 'admin' : 'owner',
    },
    { reason: reason || 'Host unavailable for requested dates' }
  );
}

/**
 * Vehicle owner marks a confirmed trip as in-progress upon key handover.
 */
export function startTripByOwner(
  bookingId: string,
  actor: { userId: string; role: UserRole }
): OwnerOperationResult {
  const check = validateOwnerAction(bookingId, actor);
  if (!check.valid || !check.booking) {
    return { success: false, error: check.error };
  }

  if (check.booking.status !== 'confirmed') {
    return {
      success: false,
      error: `Only "confirmed" bookings can be started. Current status: "${check.booking.status}".`,
    };
  }

  return transitionBookingStatus(bookingId, 'in_progress', {
    userId: actor.userId,
    role: actor.role === 'admin' ? 'admin' : 'owner',
  });
}

/**
 * Vehicle owner marks an active trip as completed upon return & inspection.
 * Disburses mock escrow funds to host's wallet.
 */
export function completeTripByOwner(
  bookingId: string,
  actor: { userId: string; role: UserRole }
): OwnerOperationResult {
  const check = validateOwnerAction(bookingId, actor);
  if (!check.valid || !check.booking) {
    return { success: false, error: check.error };
  }

  if (check.booking.status !== 'in_progress') {
    return {
      success: false,
      error: `Only "in_progress" rentals can be completed. Current status: "${check.booking.status}".`,
    };
  }

  return transitionBookingStatus(bookingId, 'completed', {
    userId: actor.userId,
    role: actor.role === 'admin' ? 'admin' : 'owner',
  });
}

/**
 * Vehicle owner reports a damage, delay, or condition dispute.
 * Freezes escrow in-transit pending platform review.
 */
export function disputeBookingByOwner(
  bookingId: string,
  actor: { userId: string; role: UserRole },
  reason: string
): OwnerOperationResult {
  const check = validateOwnerAction(bookingId, actor);
  if (!check.valid || !check.booking) {
    return { success: false, error: check.error };
  }

  if (check.booking.status !== 'in_progress' && check.booking.status !== 'completed') {
    return {
      success: false,
      error: `Disputes can only be raised for "in_progress" or "completed" bookings. Current status: "${check.booking.status}".`,
    };
  }

  if (!reason || reason.trim().length < 5) {
    return {
      success: false,
      error: 'Please provide a clear description of the dispute reason (min 5 characters).',
    };
  }

  return transitionBookingStatus(
    bookingId,
    'disputed',
    {
      userId: actor.userId,
      role: actor.role === 'admin' ? 'admin' : 'owner',
    },
    { reason: reason.trim() }
  );
}

// ==========================================
// Owner Earnings & Utilization Analytics
// ==========================================

export interface VehicleUtilizationMetric {
  carId: string;
  make: string;
  model: string;
  year: number;
  neighbourhood: string;
  featuredImage: string;
  pricePerDay: number;
  totalBookings: number;
  completedBookings: number;
  daysRented: number;
  completedEarnings: number;
  pendingEscrow: number;
  activeBooking?: Booking;
}

export interface OwnerEarningsSummary {
  ownerId: string;
  totalCompletedEarnings: number; // Disbursed payouts
  heldEscrowAmount: number; // Pending / held escrow in transit
  totalRefundedAmount: number; // Cancelled / refunded
  bookingsCount: {
    total: number;
    requested: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    disputed: number;
    cancelled: number;
  };
  vehicleBreakdown: VehicleUtilizationMetric[];
}

/**
 * Computes transparent host earnings and per-vehicle utilization statistics.
 * Strictly separates completed payouts from held-in-escrow funds.
 */
export function getOwnerEarningsAnalytics(
  ownerId: string,
  allBookingsInput?: Booking[],
  allCarsInput?: Car[]
): OwnerEarningsSummary {
  const bookings = (allBookingsInput || getBookings()).filter((b) => b.ownerId === ownerId);
  const cars = (allCarsInput || getCars()).filter((c) => c.ownerId === ownerId);

  // 1. Completed Earnings: strictly completed or reviewed bookings with paid status
  const completedBookings = bookings.filter(
    (b) => (b.status === 'completed' || b.status === 'reviewed') && b.paymentStatus === 'paid'
  );
  const totalCompletedEarnings = completedBookings.reduce((sum, b) => sum + b.subtotal, 0);

  // 2. Held Escrow: in transit for ongoing, upcoming, or requested rentals
  const heldEscrowBookings = bookings.filter(
    (b) =>
      b.paymentStatus === 'held_in_escrow' &&
      b.status !== 'cancelled' &&
      b.status !== 'declined'
  );
  const heldEscrowAmount = heldEscrowBookings.reduce((sum, b) => sum + b.subtotal, 0);

  // 3. Refunded: cancelled or declined
  const refundedBookings = bookings.filter(
    (b) => b.paymentStatus === 'refunded' || b.status === 'cancelled' || b.status === 'declined'
  );
  const totalRefundedAmount = refundedBookings.reduce((sum, b) => sum + b.subtotal, 0);

  // 4. Counts by Status
  const counts = {
    total: bookings.length,
    requested: bookings.filter((b) => b.status === 'requested').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    inProgress: bookings.filter((b) => b.status === 'in_progress').length,
    completed: completedBookings.length,
    disputed: bookings.filter((b) => b.status === 'disputed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled' || b.status === 'declined').length,
  };

  // 5. Per-Vehicle Breakdown
  const vehicleBreakdown: VehicleUtilizationMetric[] = cars.map((car) => {
    const carBookings = bookings.filter((b) => b.carId === car.id);
    const carCompleted = carBookings.filter(
      (b) => (b.status === 'completed' || b.status === 'reviewed') && b.paymentStatus === 'paid'
    );
    const carHeld = carBookings.filter(
      (b) =>
        b.paymentStatus === 'held_in_escrow' &&
        b.status !== 'cancelled' &&
        b.status !== 'declined'
    );

    const activeBooking = carBookings.find(
      (b) => b.status === 'in_progress' || b.status === 'confirmed' || b.status === 'requested'
    );

    return {
      carId: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      neighbourhood: car.neighbourhood,
      featuredImage: car.featuredImage || car.photos?.[0] || '',
      pricePerDay: car.pricePerDay,
      totalBookings: carBookings.length,
      completedBookings: carCompleted.length,
      daysRented: carCompleted.reduce((sum, b) => sum + b.days, 0),
      completedEarnings: carCompleted.reduce((sum, b) => sum + b.subtotal, 0),
      pendingEscrow: carHeld.reduce((sum, b) => sum + b.subtotal, 0),
      activeBooking,
    };
  });

  return {
    ownerId,
    totalCompletedEarnings,
    heldEscrowAmount,
    totalRefundedAmount,
    bookingsCount: counts,
    vehicleBreakdown,
  };
}

// ==========================================
// Renter-Specific & Dispute Domain Operations
// ==========================================

/**
 * Validated domain cancellation by renter.
 * Enforces renter ownership, non-suspended account, and eligible booking status.
 */
export function cancelBookingByRenter(
  bookingId: string,
  actor: { userId: string; role: UserRole },
  reason?: string
): TransitionResult {
  const session = getCurrentSession();
  if (!session || session.userId !== actor.userId) {
    return {
      success: false,
      error: 'Authentication required. Please sign in as the renter.',
    };
  }

  const user = getUserById(actor.userId);
  if (!user || user.status === 'suspended') {
    return {
      success: false,
      error: 'Your account is suspended. Cancellations are restricted.',
    };
  }

  const booking = getBookingById(bookingId);
  if (!booking) {
    return { success: false, error: `Booking "${bookingId}" not found.` };
  }

  const isAdmin = Boolean(user.roles.includes('admin') && (actor.role === 'admin' || session.activeRole === 'admin'));
  if (booking.renterId !== actor.userId && !isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: You can only cancel reservations that you personally booked.',
    };
  }

  if (booking.status !== 'requested' && booking.status !== 'confirmed') {
    return {
      success: false,
      error: `Only "requested" or "confirmed" bookings can be cancelled. Current status: "${booking.status}".`,
    };
  }

  const cleanReason = reason ? reason.trim().slice(0, 500) : 'Cancelled by renter';
  return transitionBookingStatus(
    bookingId,
    'cancelled',
    {
      userId: actor.userId,
      role: isAdmin ? 'admin' : 'renter',
    },
    { reason: cleanReason }
  );
}

export interface OpenDisputeInput {
  reason: string;
  description?: string;
}

export interface DisputeOperationResult {
  success: boolean;
  dispute?: Dispute;
  booking?: Booking;
  error?: string;
}

/**
 * Opens a formal dispute on an in-progress or completed rental.
 * Strictly verifies participant ownership (renter, owner, or admin) and non-suspended status.
 */
export function openDispute(
  bookingId: string,
  actor: { userId: string; role: UserRole },
  input: OpenDisputeInput
): DisputeOperationResult {
  const session = getCurrentSession();
  if (!session || session.userId !== actor.userId) {
    return {
      success: false,
      error: 'Authentication required. Please sign in to submit a dispute ticket.',
    };
  }

  const user = getUserById(actor.userId);
  if (!user || user.status === 'suspended') {
    return {
      success: false,
      error: 'Your account is suspended. Dispute operations are restricted.',
    };
  }

  const booking = getBookingById(bookingId);
  if (!booking) {
    return { success: false, error: `Booking "${bookingId}" not found.` };
  }

  const isAdmin = Boolean(user.roles.includes('admin') && (actor.role === 'admin' || session.activeRole === 'admin'));
  const isRenter = booking.renterId === actor.userId;
  const isOwner = booking.ownerId === actor.userId;

  if (!isRenter && !isOwner && !isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Only the renter or owner involved in this reservation can raise a dispute.',
    };
  }

  if (booking.status !== 'in_progress' && booking.status !== 'completed') {
    return {
      success: false,
      error: `Disputes can only be raised for active "in_progress" trips or "completed" rentals. Current status: "${booking.status}".`,
    };
  }

  if (!input.reason || input.reason.trim().length < 5) {
    return {
      success: false,
      error: 'A clear dispute reason of at least 5 characters is required.',
    };
  }

  const cleanReason = input.reason.trim().slice(0, 200);
  const cleanDescription = input.description ? input.description.trim().slice(0, 2000) : cleanReason;

  // 1. Transition booking to 'disputed'
  const transitionRes = transitionBookingStatus(
    bookingId,
    'disputed',
    {
      userId: actor.userId,
      role: isAdmin ? 'admin' : isOwner ? 'owner' : 'renter',
    },
    { reason: cleanReason }
  );

  if (!transitionRes.success) {
    return { success: false, error: transitionRes.error };
  }

  // 2. Create persistent dispute entity
  const now = new Date().toISOString();
  const disputeId = `dispute_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const newDispute: Dispute = {
    id: disputeId,
    bookingId: booking.id,
    openedBy: actor.userId,
    openedByRole: isOwner ? 'owner' : 'renter',
    reason: cleanReason,
    description: cleanDescription,
    status: 'open',
    createdAt: now,
  };

  saveDispute(newDispute);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'disputes' } }));
    } catch {}
  }

  return {
    success: true,
    dispute: newDispute,
    booking: transitionRes.booking,
  };
}

/**
 * Resolves a dispute with administrator notes.
 * Enforces admin-only permissions, non-suspended account, mandatory settlement notes,
 * and a strict conflict-of-interest barrier (admin cannot resolve own dispute).
 */
export function resolveDisputeByAdmin(
  disputeId: string,
  adminActor: { userId: string; role: UserRole },
  resolutionNotes: string
): DisputeOperationResult {
  const session = getCurrentSession();
  if (!session || session.userId !== adminActor.userId) {
    return { success: false, error: 'Authentication required. Please sign in as an administrator.' };
  }

  const user = getUserById(adminActor.userId);
  if (!user || user.status === 'suspended') {
    return { success: false, error: 'Your account is suspended. Administrative operations are restricted.' };
  }

  if (!user.roles.includes('admin') || adminActor.role !== 'admin' || session.activeRole !== 'admin') {
    return { success: false, error: 'Unauthorized: Only platform administrators can resolve disputes.' };
  }

  const dispute = getDisputeById(disputeId);
  if (!dispute) {
    return { success: false, error: `Dispute record "${disputeId}" not found.` };
  }

  const booking = getBookingById(dispute.bookingId);
  if (!booking) {
    return { success: false, error: `Associated booking "${dispute.bookingId}" not found.` };
  }

  // Conflict of interest check: admin cannot be the renter or owner of the booking under dispute
  if (booking.renterId === adminActor.userId || booking.ownerId === adminActor.userId) {
    return {
      success: false,
      error: 'Conflict of interest: Administrators cannot resolve disputes for bookings they are personally involved in.',
    };
  }

  if (!resolutionNotes || resolutionNotes.trim().length < 5) {
    return {
      success: false,
      error: 'Detailed resolution notes (at least 5 characters) are required to close a dispute.',
    };
  }

  const cleanNotes = resolutionNotes.trim().slice(0, 2000);

  // 1. Transition booking to resolved status
  const transitionRes = transitionBookingStatus(
    booking.id,
    'resolved',
    { userId: adminActor.userId, role: 'admin' },
    { reason: cleanNotes }
  );

  // 2. Persist resolved dispute state
  const now = new Date().toISOString();
  const updatedDispute: Dispute = {
    ...dispute,
    status: 'resolved',
    resolutionNotes: cleanNotes,
    resolvedBy: adminActor.userId,
    resolvedAt: now,
  };

  saveDispute(updatedDispute);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'disputes' } }));
    } catch {}
  }

  return {
    success: true,
    dispute: updatedDispute,
    booking: transitionRes.booking || booking,
  };
}

/**
 * Updates a dispute status to 'investigating' with investigation notes.
 */
export function updateDisputeStatusByAdmin(
  disputeId: string,
  adminActor: { userId: string; role: UserRole },
  status: 'investigating',
  notes?: string
): DisputeOperationResult {
  const session = getCurrentSession();
  if (!session || session.userId !== adminActor.userId) {
    return { success: false, error: 'Authentication required. Please sign in as an administrator.' };
  }

  const user = getUserById(adminActor.userId);
  if (!user || user.status === 'suspended') {
    return { success: false, error: 'Your account is suspended. Administrative operations are restricted.' };
  }

  if (!user.roles.includes('admin') || adminActor.role !== 'admin' || session.activeRole !== 'admin') {
    return { success: false, error: 'Unauthorized: Only platform administrators can update dispute statuses.' };
  }

  const dispute = getDisputeById(disputeId);
  if (!dispute) {
    return { success: false, error: `Dispute record "${disputeId}" not found.` };
  }

  const updatedDispute: Dispute = {
    ...dispute,
    status,
    resolutionNotes: notes?.trim()
      ? `[Investigation Note]: ${notes.trim().slice(0, 2000)}`
      : dispute.resolutionNotes,
  };

  saveDispute(updatedDispute);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'disputes' } }));
    } catch {}
  }

  return {
    success: true,
    dispute: updatedDispute,
  };
}

