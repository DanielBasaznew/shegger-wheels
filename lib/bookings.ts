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
  PaymentStatus,
  UserRole,
} from './types';
import {
  getBookings,
  getBookingById,
  saveBooking,
  getCarById,
  getCurrentSession,
  getUserById,
  clearCheckoutDraft,
} from './storage';

// ==========================================
// Date & Duration Utilities
// ==========================================

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
  excludeBookingId?: string
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
    if (!ACTIVE_RESERVATION_STATUSES.includes(b.status)) return false;

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

  // 2. Validate dates
  const todayStr = formatDateString(new Date());
  if (!input.startDate || !input.endDate) {
    return {
      success: false,
      error: 'Please provide both pick-up and return dates.',
    };
  }

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
  const booking = getBookingById(bookingId);
  if (!booking) {
    return {
      success: false,
      error: `Booking "${bookingId}" not found.`,
    };
  }

  const currentStatus = booking.status;

  // 1. Check if transition exists in FSM
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

  // 2. Actor permission & ownership validation
  const isAdmin = actor.role === 'admin';
  const isRenter = booking.renterId === actor.userId;
  const isOwner = booking.ownerId === actor.userId;

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

  // 3. Build updated booking
  const updatedBooking: Booking = {
    ...booking,
    status: targetStatus,
    updatedAt: new Date().toISOString(),
  };

  // 4. Apply payment side effects
  if (rule.paymentEffect) {
    updatedBooking.paymentStatus = rule.paymentEffect;
  }

  // 5. Apply reason options
  if (targetStatus === 'declined' && options?.reason) {
    updatedBooking.declineReason = options.reason;
  } else if (targetStatus === 'cancelled' && options?.reason) {
    updatedBooking.cancellationReason = options.reason;
  }

  // 6. Save update
  const saved = saveBooking(updatedBooking);
  if (!saved) {
    return {
      success: false,
      error: 'Storage failure: Could not persist updated booking status.',
    };
  }

  return {
    success: true,
    booking: updatedBooking,
  };
}

// ==========================================
// Booking Query Helpers
// ==========================================

export function getBookingsForRenter(renterId: string): Booking[] {
  return getBookings().filter((b) => b.renterId === renterId);
}

export function getBookingsForOwner(ownerId: string): Booking[] {
  return getBookings().filter((b) => b.ownerId === ownerId);
}
