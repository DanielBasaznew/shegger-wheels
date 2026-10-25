'use client';

import React, { useState } from 'react';
import { Review, DemoSession } from '@/lib/types';
import { respondToReview } from '@/lib/reviews';
import { respondToReviewAction } from '@/app/actions';

interface OwnerResponseModalProps {
  review: Review;
  renterName?: string;
  carName?: string;
  session: DemoSession;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_HOST_RESPONSES = [
  'Thank you for taking such great care of the vehicle! You are welcome back anytime.',
  'Appreciate your kind feedback! It was a pleasure hosting you in Addis Ababa.',
  'Thank you for renting with us. Glad you enjoyed the comfort and fuel efficiency!',
  'Thank you for your valuable feedback. We look forward to hosting you on your next trip!',
];

export function OwnerResponseModal({
  review,
  renterName = 'Renter',
  carName = 'Vehicle',
  session,
  isOpen,
  onClose,
  onSuccess,
}: OwnerResponseModalProps) {
  const [prevReviewId, setPrevReviewId] = useState(review.id);
  const [replyText, setReplyText] = useState(review.ownerReply || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (prevReviewId !== review.id) {
    setPrevReviewId(review.id);
    setReplyText(review.ownerReply || '');
    setError('');
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (replyText.trim().length < 5) {
      setError('Please provide at least 5 characters for your response.');
      return;
    }

    setIsSubmitting(true);

    const result = respondToReview(
      review.id,
      { userId: session.userId, role: 'owner' },
      replyText.trim()
    );

    if (result.success) {
      await respondToReviewAction(review.id, replyText.trim(), session);
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setIsSubmitting(false);
      setError(result.error || 'Failed to submit response. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-response-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl border border-[#66717D]/20 max-w-lg w-full p-6 sm:p-8 my-8 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#66717D]/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-secondary" aria-hidden="true">chat_bubble</span>
              <h3 id="owner-response-modal-title" className="text-xl font-black text-[#111820]">
                {review.ownerReply ? 'Edit Host Response' : 'Respond to Review'}
              </h3>
            </div>
            <p className="text-xs text-[#66717D] mt-1">
              {carName} • Review from {renterName}
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

        {/* Original Review Card Quote */}
        <div className="p-4 rounded-2xl bg-[#F5F2EB]/70 border border-[#66717D]/15 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#111820]">{renterName}</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <div className="flex items-center">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <span>({review.rating}.0)</span>
            </div>
          </div>
          <p className="text-xs text-[#111820] italic">
            &ldquo;{review.comment}&rdquo;
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Quick presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#66717D] uppercase tracking-wider">
              Quick Reply Templates (Click to insert)
            </span>
            <div className="flex flex-col gap-1">
              {PRESET_HOST_RESPONSES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReplyText(preset);
                    setError('');
                  }}
                  className="p-2 text-left text-xs rounded-xl bg-[#F5F2EB] hover:bg-[#111820] hover:text-white transition text-[#111820] cursor-pointer"
                >
                  • {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Response Textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="owner-response-textarea" className="text-xs font-bold text-[#111820] flex justify-between">
              <span>Your Public Host Reply <span className="text-rose-600">*</span></span>
              <span className="text-[#66717D] font-normal text-[11px]">
                {replyText.length} chars
              </span>
            </label>
            <textarea
              id="owner-response-textarea"
              rows={3}
              value={replyText}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'owner-response-error' : undefined}
              onChange={(e) => {
                setReplyText(e.target.value);
                if (error) setError('');
              }}
              placeholder="Acknowledge the traveler's feedback courteously..."
              className="w-full p-3.5 rounded-2xl bg-[#F5F2EB]/50 border border-[#66717D]/25 text-sm text-[#111820] placeholder-[#66717D] focus:outline-none focus:ring-2 focus:ring-[#111820] focus:bg-white transition"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div
              id="owner-response-error"
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">warning</span>
              <span>{error}</span>
            </div>
          )}

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
              {isSubmitting ? 'Saving...' : review.ownerReply ? 'Update Response' : 'Publish Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
