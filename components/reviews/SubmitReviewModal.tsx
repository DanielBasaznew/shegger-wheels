'use client';

import React, { useState } from 'react';
import { Booking, Car, DemoSession } from '@/lib/types';
import { createReview } from '@/lib/reviews';

interface SubmitReviewModalProps {
  booking: Booking;
  car?: Car;
  session: DemoSession;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Disappointing — Did not meet expectations',
  2: 'Fair — Several issues during rental',
  3: 'Good — Standard satisfactory experience',
  4: 'Very Good — Comfortable and well maintained',
  5: 'Exceptional — Flawless vehicle & courteous host',
};

export function SubmitReviewModal({
  booking,
  car,
  session,
  isOpen,
  onClose,
  onSuccess,
}: SubmitReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Escape key dismiss listener
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeRating = hoverRating || rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (comment.trim().length < 10) {
      setError('Please provide at least 10 characters of descriptive feedback.');
      return;
    }

    setIsSubmitting(true);

    const result = createReview(
      { userId: session.userId, role: 'renter' },
      {
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
      }
    );

    setIsSubmitting(false);

    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.error || 'Failed to submit review. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl border border-[#66717D]/20 max-w-lg w-full p-6 sm:p-8 my-8 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#66717D]/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">star</span>
              <h3 id="submit-review-modal-title" className="text-xl font-black text-[#111820]">
                Review Your Trip
              </h3>
            </div>
            <p className="text-xs text-[#66717D] mt-1">
              {car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle Rental'} • Booking #{booking.id.toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-[#F5F2EB] text-[#111820] flex items-center justify-center font-bold hover:bg-[#111820] hover:text-white transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Star Rating Selector */}
          <div className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-[#F5F2EB]/60 border border-[#66717D]/12 text-center">
            <span id="star-rating-label" className="text-xs font-bold uppercase tracking-wider text-[#66717D]">
              Select Your Overall Rating
            </span>

            <div
              role="radiogroup"
              aria-labelledby="star-rating-label"
              className="flex items-center gap-2 text-3xl sm:text-4xl my-1"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} Star${star > 1 ? 's' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition transform hover:scale-115 focus:outline-hidden cursor-pointer"
                >
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-3xl sm:text-4xl transition-colors ${
                      star <= activeRating
                        ? 'text-amber-400 drop-shadow-xs'
                        : 'text-slate-300'
                    }`}
                    style={{ fontVariationSettings: star <= activeRating ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-[#111820] h-5" aria-live="polite">
              {RATING_DESCRIPTIONS[activeRating]}
            </span>
          </div>

          {/* Written Feedback Textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-comment-textarea" className="text-xs font-bold text-[#111820] flex justify-between">
              <span>Your Review &amp; Experience <span className="text-rose-600">*</span></span>
              <span className="text-[#66717D] font-normal text-[11px]">
                {comment.length} / 10 min chars
              </span>
            </label>
            <textarea
              id="review-comment-textarea"
              rows={4}
              value={comment}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'review-error-banner' : undefined}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder="How was the vehicle condition, fuel efficiency, cleanliness, and the host's punctuality during key handover in Addis Ababa?"
              className="w-full p-3.5 rounded-2xl bg-[#F5F2EB]/50 border border-[#66717D]/25 text-sm text-[#111820] placeholder-[#66717D] focus:outline-none focus:ring-2 focus:ring-[#111820] focus:bg-white transition"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div
              id="review-error-banner"
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">warning</span>
              <span>{error}</span>
            </div>
          )}

          {/* Notice */}
          <div className="text-[11px] text-[#66717D] bg-[#F5F2EB]/50 p-3 rounded-xl flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-secondary shrink-0 mt-0.5">verified_user</span>
            <p>
              <strong>Community Trust Policy:</strong> Your review will be published publicly on the vehicle listing page to assist fellow Addis Ababa travelers. The vehicle host will be invited to reply.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#66717D]/12">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F5F2EB] text-[#111820] hover:bg-[#66717D]/20 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#111820] text-white hover:bg-[#111820]/90 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
