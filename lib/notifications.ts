/**
 * Shegger Wheels — Notifications Engine
 * 
 * Handles typed in-app notification creation, recipient dispatch,
 * safe internal navigation URL generation, and lifecycle event triggers
 * for Addis Ababa peer-to-peer car rental operations.
 */

import { Notification, NotificationType, Booking, Car, Review, UserRole } from './types';
import { saveNotification, getUserById, getCarById, getCarSlug } from './storage';
import { getSafeReturnUrl } from './auth';

// ==========================================
// Safe Navigation URL Generator
// ==========================================

export function getSafeNotificationLink(type: NotificationType, bookingId?: string, carId?: string): string {
  const safeIdRegex = /^[a-zA-Z0-9_-]+$/;
  const cleanBookingId = bookingId && safeIdRegex.test(bookingId) ? bookingId : undefined;
  const cleanCarId = carId && safeIdRegex.test(carId) ? carId : undefined;

  switch (type) {
    case 'trip_started':
    case 'booking_confirmed':
      return cleanBookingId ? `/bookings/${cleanBookingId}/track` : '/dashboard';
    case 'booking_requested':
      return '/dashboard/host';
    case 'booking_declined':
    case 'booking_cancelled':
    case 'trip_completed':
    case 'dispute_opened':
    case 'dispute_resolved':
      return cleanBookingId ? `/bookings/${cleanBookingId}` : '/dashboard';
    case 'review_received':
    case 'review_response':
      return cleanCarId ? `/cars/${cleanCarId}#reviews-section` : '/dashboard';
    default:
      return cleanBookingId ? `/bookings/${cleanBookingId}` : '/dashboard';
  }
}

// ==========================================
// Core Notification Creation
// ==========================================

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  bookingId?: string;
  carId?: string;
}

/**
 * Persists and dispatches a typed in-app notification.
 * Guaranteed safe internal link routing.
 */
export function sendNotification(input: CreateNotificationInput): Notification {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const safeLink = getSafeReturnUrl(input.link, '/dashboard');

  const notification: Notification = {
    id: notificationId,
    recipientId: input.recipientId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: safeLink,
    read: false,
    bookingId: input.bookingId,
    carId: input.carId,
    createdAt: new Date().toISOString(),
  };

  saveNotification(notification);
  return notification;
}

// ==========================================
// Domain Event Notification Triggers
// ==========================================

/**
 * Triggered when a renter submits a new rental request.
 * Notifies the vehicle owner.
 */
export function notifyBookingRequested(booking: Booking, car?: Car, renterName?: string): Notification {
  const resolvedCar = car || getCarById(booking.carId);
  const carTitle = resolvedCar ? `${resolvedCar.year} ${resolvedCar.make} ${resolvedCar.model}` : 'your vehicle';
  const renterDisplay = renterName || getUserById(booking.renterId)?.name || 'A renter';

  return sendNotification({
    recipientId: booking.ownerId,
    type: 'booking_requested',
    title: 'New Booking Request',
    message: `${renterDisplay} submitted a rental request for ${carTitle} (${booking.startDate} to ${booking.endDate}).`,
    link: `/dashboard/host`,
    bookingId: booking.id,
    carId: booking.carId,
  });
}

/**
 * Triggered when an owner accepts a rental request.
 * Notifies the renter with access to the tracking hub.
 */
export function notifyBookingConfirmed(booking: Booking, car?: Car): Notification {
  const resolvedCar = car || getCarById(booking.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'vehicle';

  return sendNotification({
    recipientId: booking.renterId,
    type: 'booking_confirmed',
    title: 'Booking Confirmed!',
    message: `Your booking for ${carTitle} has been confirmed. Tap to view your trip countdown and logistics.`,
    link: `/bookings/${booking.id}/track`,
    bookingId: booking.id,
    carId: booking.carId,
  });
}

/**
 * Triggered when an owner declines a rental request.
 * Notifies the renter with the optional reason.
 */
export function notifyBookingDeclined(booking: Booking, car?: Car, reason?: string): Notification {
  const resolvedCar = car || getCarById(booking.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'vehicle';
  const reasonText = reason ? `: "${reason}"` : '.';

  return sendNotification({
    recipientId: booking.renterId,
    type: 'booking_declined',
    title: 'Booking Request Declined',
    message: `Your request for ${carTitle} was declined by the host${reasonText} Escrow authorization has been released.`,
    link: `/bookings/${booking.id}`,
    bookingId: booking.id,
    carId: booking.carId,
  });
}

/**
 * Triggered when a booking is cancelled by either party or admin.
 * Notifies the counterpart.
 */
export function notifyBookingCancelled(
  booking: Booking,
  car?: Car,
  actorRole: UserRole = 'renter',
  reason?: string
): Notification {
  const resolvedCar = car || getCarById(booking.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'vehicle';
  const reasonText = reason ? ` Reason: ${reason}` : '';

  // If renter cancelled, notify owner. If owner or admin cancelled, notify renter.
  const isRenterActor = actorRole === 'renter';
  const recipientId = isRenterActor ? booking.ownerId : booking.renterId;
  const link = isRenterActor ? '/dashboard/host' : `/bookings/${booking.id}`;
  const actorLabel = isRenterActor ? 'The renter' : actorRole === 'owner' ? 'The host' : 'Platform administrator';

  return sendNotification({
    recipientId,
    type: 'booking_cancelled',
    title: `Booking Cancelled by ${actorLabel}`,
    message: `${actorLabel} cancelled the reservation for ${carTitle}.${reasonText}`,
    link,
    bookingId: booking.id,
    carId: booking.carId,
  });
}

/**
 * Triggered when key handover is verified and the trip starts.
 * Notifies both the renter and owner.
 */
export function notifyTripStarted(booking: Booking, car?: Car): Notification[] {
  const resolvedCar = car || getCarById(booking.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'vehicle';

  // 1. Notify Renter
  const renterNotif = sendNotification({
    recipientId: booking.renterId,
    type: 'trip_started',
    title: 'Trip Started — Telematics Active',
    message: `Handover complete! Live trip status and Addis corridor telematics are now active for ${carTitle}.`,
    link: `/bookings/${booking.id}/track`,
    bookingId: booking.id,
    carId: booking.carId,
  });

  // 2. Notify Owner
  const ownerNotif = sendNotification({
    recipientId: booking.ownerId,
    type: 'trip_started',
    title: 'Vehicle Handed Over',
    message: `Your ${carTitle} is now on-road with the renter. View simulated trip tracking anytime.`,
    link: `/bookings/${booking.id}/track`,
    bookingId: booking.id,
    carId: booking.carId,
  });

  return [renterNotif, ownerNotif];
}

/**
 * Triggered when vehicle return inspection is completed.
 * Notifies both parties.
 */
export function notifyTripCompleted(booking: Booking, car?: Car): Notification[] {
  const resolvedCar = car || getCarById(booking.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'vehicle';

  // 1. Notify Renter
  const renterNotif = sendNotification({
    recipientId: booking.renterId,
    type: 'trip_completed',
    title: 'Trip Completed — Leave a Review',
    message: `Return inspection complete for ${carTitle}. Security deposit released. Please share your rating!`,
    link: `/bookings/${booking.id}`,
    bookingId: booking.id,
    carId: booking.carId,
  });

  // 2. Notify Owner
  const ownerNotif = sendNotification({
    recipientId: booking.ownerId,
    type: 'trip_completed',
    title: 'Trip Returned & Finalized',
    message: `${carTitle} return inspection finalized. TeleBirr earnings credited to your host balance.`,
    link: `/dashboard/host`,
    bookingId: booking.id,
    carId: booking.carId,
  });

  return [renterNotif, ownerNotif];
}

/**
 * Triggered when a dispute is lodged against a booking.
 */
export function notifyDisputeOpened(
  booking: Booking,
  car?: Car,
  openedByUserId?: string,
  reason?: string
): Notification[] {
  const resolvedCar = car || getCarById(booking.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'vehicle';
  const reasonText = reason ? `: "${reason}"` : '';

  const isRenterOpener = openedByUserId === booking.renterId;
  const targetRecipientId = isRenterOpener ? booking.ownerId : booking.renterId;
  const openerLabel = isRenterOpener ? 'Renter' : 'Host';

  const userNotif = sendNotification({
    recipientId: targetRecipientId,
    type: 'dispute_opened',
    title: `Dispute Raised by ${openerLabel}`,
    message: `A dispute was filed on ${carTitle}${reasonText}. Platform admin will mediate.`,
    link: `/bookings/${booking.id}`,
    bookingId: booking.id,
    carId: booking.carId,
  });

  // Also notify admin if admin exists
  const adminNotif = sendNotification({
    recipientId: 'user_admin_01',
    type: 'dispute_opened',
    title: 'New Dispute Requires Mediation',
    message: `Dispute opened on booking ${booking.id} (${carTitle}) by ${openerLabel}.`,
    link: `/bookings/${booking.id}`,
    bookingId: booking.id,
    carId: booking.carId,
  });

  return [userNotif, adminNotif];
}

/**
 * Triggered when an admin resolves a dispute.
 */
export function notifyDisputeResolved(
  booking: Booking,
  car?: Car,
  notes?: string
): Notification[] {
  const resolvedCar = car || getCarById(booking.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'vehicle';
  const notesText = notes ? ` Resolution: ${notes}` : '';

  const notif1 = sendNotification({
    recipientId: booking.renterId,
    type: 'dispute_resolved',
    title: 'Dispute Resolved by Admin',
    message: `The dispute on ${carTitle} has been formally closed by support.${notesText}`,
    link: `/bookings/${booking.id}`,
    bookingId: booking.id,
    carId: booking.carId,
  });

  const notif2 = sendNotification({
    recipientId: booking.ownerId,
    type: 'dispute_resolved',
    title: 'Dispute Resolved by Admin',
    message: `The dispute on ${carTitle} has been formally closed by support.${notesText}`,
    link: `/bookings/${booking.id}`,
    bookingId: booking.id,
    carId: booking.carId,
  });

  return [notif1, notif2];
}

/**
 * Triggered when a renter posts a new review.
 * Notifies the vehicle owner.
 */
export function notifyReviewReceived(review: Review, car?: Car, renterName?: string): Notification {
  const resolvedCar = car || getCarById(review.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'your vehicle';
  const renterDisplay = renterName || getUserById(review.renterId)?.name || 'A verified renter';

  return sendNotification({
    recipientId: review.ownerId,
    type: 'review_received',
    title: 'New Rating & Review Received',
    message: `${renterDisplay} gave ${review.rating} ★ for ${carTitle}: "${review.comment.slice(0, 70)}..."`,
    link: `/cars/${review.carId}#reviews-section`,
    bookingId: review.bookingId,
    carId: review.carId,
  });
}

/**
 * Triggered when an owner responds to a review.
 * Notifies the renter.
 */
export function notifyReviewResponse(review: Review, car?: Car): Notification {
  const resolvedCar = car || getCarById(review.carId);
  const carTitle = resolvedCar ? `${resolvedCar.make} ${resolvedCar.model}` : 'your vehicle';

  return sendNotification({
    recipientId: review.renterId,
    type: 'review_response',
    title: 'Host Replied to Your Review',
    message: `The host of ${carTitle} responded to your review feedback.`,
    link: `/cars/${review.carId}#reviews-section`,
    bookingId: review.bookingId,
    carId: review.carId,
  });
}

/**
 * Triggered when an administrator moderates a vehicle listing.
 * Notifies the vehicle owner of approval or rejection with reason.
 */
export function notifyListingModerated(car: Car, action: 'approve' | 'reject', reason?: string): Notification {
  const carTitle = `${car.year} ${car.make} ${car.model}`;
  const isApproved = action === 'approve';

  return sendNotification({
    recipientId: car.ownerId,
    type: 'system',
    title: isApproved ? 'Vehicle Listing Approved' : 'Vehicle Listing Rejected',
    message: isApproved
      ? `Congratulations! Your listing for ${carTitle} has been verified and is now live for bookings.`
      : `Your listing for ${carTitle} was not approved. Reason: ${reason || 'Does not meet marketplace standards.'}`,
    link: isApproved ? `/cars/${getCarSlug(car)}` : `/dashboard/host`,
    carId: car.id,
  });
}
