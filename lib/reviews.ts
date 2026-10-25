/**
 * Shegger Wheels — Reviews & Owner Responses Engine
 * 
 * Implements post-trip reviews, 1-5 star ratings, duplicate prevention,
 * authorization barriers, owner response workflows, and rating analytics
 * for Addis Ababa peer-to-peer car rentals.
 */

import { Review, UserRole, Booking } from './types';
import {
  getReviews,
  getReviewsForCar,
  saveReview,
  getBookingById,
  getCurrentSession,
  getUserById,
} from './storage';
import { transitionBookingStatus } from './bookings';
import { notifyReviewReceived, notifyReviewResponse } from './notifications';

// ==========================================
// Types & Interfaces
// ==========================================

export interface CreateReviewInput {
  bookingId: string;
  rating: number; // 1 to 5 integer
  comment: string;
}

export interface ReviewOperationResult {
  success: boolean;
  review?: Review;
  error?: string;
}

export interface CarRatingSummary {
  averageRating: number;
  totalReviews: number;
  starCounts: Record<1 | 2 | 3 | 4 | 5, number>;
}

// ==========================================
// Eligibility & Validation Helpers
// ==========================================

/**
 * Checks if a booking is currently eligible to be reviewed by a given renter.
 */
export function isBookingReviewable(
  booking: Booking,
  actorUserId: string
): { reviewable: boolean; canReview: boolean; reason?: string } {
  // 1. Renter ownership check
  if (booking.renterId !== actorUserId) {
    return {
      reviewable: false,
      canReview: false,
      reason: 'Only the renter who booked this trip can submit a review.',
    };
  }

  // 2. Lifecycle state check: must be completed (or already reviewed)
  if (booking.status === 'reviewed') {
    return {
      reviewable: false,
      canReview: false,
      reason: 'This booking has already been reviewed.',
    };
  }

  if (booking.status !== 'completed') {
    return {
      reviewable: false,
      canReview: false,
      reason: `Cannot review an uncompleted trip (current status: ${booking.status}). Reviews open after return completion.`,
    };
  }

  // 3. Duplicate check against stored reviews
  const existingReview = getReviews().find((r) => r.bookingId === booking.id);
  if (existingReview) {
    return {
      reviewable: false,
      canReview: false,
      reason: 'A review has already been submitted for this booking.',
    };
  }

  return { reviewable: true, canReview: true };
}

// ==========================================
// Core Review Mutations
// ==========================================

/**
 * Submits a new verified renter review for a completed booking.
 * 
 * Rules:
 * 1. Actor must be authenticated and own the booking as the renter.
 * 2. Booking must have reached status 'completed'.
 * 3. Rating must be a whole number between 1 and 5.
 * 4. Written comment must be at least 10 characters.
 * 5. Strictly prevents duplicate reviews for the same booking.
 * 6. Automatically transitions booking status from 'completed' to 'reviewed'.
 */
export function createReview(
  actor: { userId: string; role?: UserRole },
  input: CreateReviewInput
): ReviewOperationResult {
  // 1. Session verification
  const session = getCurrentSession();
  if (!session || session.userId !== actor.userId) {
    return {
      success: false,
      error: 'Authentication required. Please sign in to submit your review.',
    };
  }

  // 2. User account check
  const user = getUserById(actor.userId);
  if (!user || user.status === 'suspended') {
    return {
      success: false,
      error: 'Your account is suspended. Actions on reviews are restricted.',
    };
  }

  // 3. Validate star rating (1 to 5 integer)
  const ratingNum = Number(input.rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return {
      success: false,
      error: 'Rating must be a whole number between 1 and 5 stars.',
    };
  }

  // 4. Validate comment length
  const commentText = input.comment ? input.comment.trim() : '';
  if (commentText.length < 10) {
    return {
      success: false,
      error: 'Please provide at least 10 characters of detailed feedback for your review.',
    };
  }
  if (commentText.length > 2000) {
    return {
      success: false,
      error: 'Review comment must not exceed 2,000 characters.',
    };
  }

  // 5. Retrieve booking
  const booking = getBookingById(input.bookingId);
  if (!booking) {
    return {
      success: false,
      error: `Booking "${input.bookingId}" not found.`,
    };
  }

  // 6. Verify renter ownership
  if (booking.renterId !== actor.userId) {
    return {
      success: false,
      error: 'Unauthorized: You can only review rental trips that you personally booked.',
    };
  }

  // 7. Verify completion status
  if (booking.status !== 'completed' && booking.status !== 'reviewed') {
    return {
      success: false,
      error: `Cannot review an unfinished trip. Current booking status is "${booking.status}". Reviews are only accepted after return handover completion.`,
    };
  }

  // 8. Duplicate prevention check
  const existingReviews = getReviews();
  const alreadyReviewed = existingReviews.some((r) => r.bookingId === booking.id);
  if (alreadyReviewed) {
    return {
      success: false,
      error: 'Duplicate review: You have already submitted a review for this booking.',
    };
  }

  // 9. Build and persist review record
  const now = new Date().toISOString();
  const reviewId = `review_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newReview: Review = {
    id: reviewId,
    bookingId: booking.id,
    carId: booking.carId,
    renterId: booking.renterId,
    ownerId: booking.ownerId,
    rating: ratingNum,
    comment: commentText,
    createdAt: now,
  };

  const saved = saveReview(newReview);
  if (!saved) {
    return {
      success: false,
      error: 'Storage failure: Failed to write review record.',
    };
  }

  // 10. Transition booking status from 'completed' to 'reviewed'
  if (booking.status === 'completed') {
    transitionBookingStatus(booking.id, 'reviewed', {
      userId: actor.userId,
      role: 'renter',
    });
  }

  // 11. Dispatch in-app notification to host
  try {
    notifyReviewReceived(newReview, undefined, user.name);
  } catch (err) {
    console.warn('[Shegger Notifications] Non-fatal notification error on review:', err);
  }

  // Dispatch custom and storage event for live UI reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'reviews' } }));
  }

  return { success: true, review: newReview };
}

/**
 * Posts or updates a vehicle owner's public response to a renter review.
 * 
 * Rules:
 * 1. Actor must be authenticated and own the vehicle listing being reviewed.
 * 2. Written reply must be at least 5 characters.
 * 3. Preserves review rating, renter comment, and original creation date.
 */
export function respondToReview(
  reviewId: string,
  actor: { userId: string; role?: UserRole },
  replyText: string
): ReviewOperationResult {
  // 1. Session check
  const session = getCurrentSession();
  if (!session || session.userId !== actor.userId) {
    return {
      success: false,
      error: 'Authentication required. Please sign in to respond to reviews.',
    };
  }

  // 2. User account check
  const user = getUserById(actor.userId);
  if (!user || user.status === 'suspended') {
    return {
      success: false,
      error: 'Your account is suspended. Actions on reviews are restricted.',
    };
  }

  // 3. Find review
  const allReviews = getReviews();
  const review = allReviews.find((r) => r.id === reviewId);
  if (!review) {
    return {
      success: false,
      error: `Review "${reviewId}" not found.`,
    };
  }

  // 4. Authorization check: Actor must be the vehicle owner (or verified platform admin)
  const isAdmin = Boolean((actor.role === 'admin' || session.activeRole === 'admin') && user.roles.includes('admin'));
  const isOwner = review.ownerId === actor.userId && user.roles.includes('owner');

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Only the host who owns this vehicle listing can post a response.',
    };
  }

  // 5. Validate reply text
  const cleanedReply = replyText ? replyText.trim() : '';
  if (cleanedReply.length < 5) {
    return {
      success: false,
      error: 'Host response must be at least 5 characters long.',
    };
  }
  if (cleanedReply.length > 2000) {
    return {
      success: false,
      error: 'Host response must not exceed 2,000 characters.',
    };
  }

  // 6. Update review with host response
  const updatedReview: Review = {
    ...review,
    ownerReply: cleanedReply,
    ownerReplyAt: new Date().toISOString(),
  };

  const saved = saveReview(updatedReview);
  if (!saved) {
    return {
      success: false,
      error: 'Storage failure: Failed to save host response.',
    };
  }

  // 7. Dispatch in-app notification to reviewer
  try {
    notifyReviewResponse(updatedReview);
  } catch (err) {
    console.warn('[Shegger Notifications] Non-fatal notification error on host reply:', err);
  }

  // Dispatch storage update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'reviews' } }));
  }

  return { success: true, review: updatedReview };
}

// ==========================================
// Analytics & Query Methods
// ==========================================

/**
 * Calculates average rating, review count, and star distribution for a vehicle.
 */
export function getCarRatingSummary(
  carId: string,
  reviewsInput?: Review[]
): CarRatingSummary {
  const reviews = reviewsInput || getReviewsForCar(carId);
  const totalReviews = reviews.length;

  const starCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      starCounts,
    };
  }

  let totalScore = 0;
  for (const r of reviews) {
    totalScore += r.rating;
    if (r.rating >= 1 && r.rating <= 5) {
      starCounts[r.rating as 1 | 2 | 3 | 4 | 5] = (starCounts[r.rating as 1 | 2 | 3 | 4 | 5] || 0) + 1;
    }
  }

  const averageRating = Math.round((totalScore / totalReviews) * 10) / 10;

  return {
    averageRating,
    totalReviews,
    starCounts,
  };
}
