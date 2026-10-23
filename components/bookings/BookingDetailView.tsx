'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Booking, Car, User, DemoSession } from '@/lib/types';
import {
  getBookings,
  getCars,
  getUserById,
  getCurrentSession,
} from '@/lib/storage';
import {
  formatDisplayDate,
  cancelBookingByRenter,
} from '@/lib/bookings';
import { getSafeReturnUrl } from '@/lib/auth';
import { SEED_BOOKINGS, SEED_CARS } from '@/lib/seeds';
import { SubmitReviewModal } from '@/components/reviews/SubmitReviewModal';
import { isBookingReviewable } from '@/lib/reviews';

function subscribeToStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('shegger-storage-change', callback);
  window.addEventListener('shegger-session-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('shegger-storage-change', callback);
    window.removeEventListener('shegger-session-change', callback);
  };
}

let cachedBookingsRaw = '';
let cachedBookings: Booking[] = SEED_BOOKINGS;

function getBookingsSnapshot(): Booking[] {
  if (typeof window === 'undefined') return SEED_BOOKINGS;
  try {
    const raw = window.localStorage.getItem('sw_bookings_v1') || '';
    if (raw !== cachedBookingsRaw) {
      cachedBookingsRaw = raw;
      const loaded = raw ? JSON.parse(raw) : [];
      cachedBookings = Array.isArray(loaded) && loaded.length > 0 ? loaded : SEED_BOOKINGS;
    }
    return cachedBookings;
  } catch {
    return SEED_BOOKINGS;
  }
}

let cachedCarsRaw = '';
let cachedCars: Car[] = SEED_CARS;

function getCarsSnapshot(): Car[] {
  if (typeof window === 'undefined') return SEED_CARS;
  try {
    const raw = window.localStorage.getItem('sw_cars_v1') || '';
    if (raw !== cachedCarsRaw) {
      cachedCarsRaw = raw;
      const loaded = raw ? JSON.parse(raw) : [];
      cachedCars = Array.isArray(loaded) && loaded.length > 0 ? loaded : SEED_CARS;
    }
    return cachedCars;
  } catch {
    return SEED_CARS;
  }
}

let cachedSessionRaw = '';
let cachedSession: DemoSession | null = null;

function getSessionSnapshot(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem('sw_session_v1') || '';
    if (raw !== cachedSessionRaw) {
      cachedSessionRaw = raw;
      cachedSession = raw ? JSON.parse(raw) : null;
    }
    return cachedSession;
  } catch {
    return null;
  }
}

function getServerBookingsSnapshot(): Booking[] {
  return SEED_BOOKINGS;
}

function getServerCarsSnapshot(): Car[] {
  return SEED_CARS;
}

function getServerSessionSnapshot(): DemoSession | null {
  return null;
}

interface BookingDetailViewProps {
  bookingId: string;
}

export function BookingDetailView({ bookingId }: BookingDetailViewProps) {

  const allBookings = useSyncExternalStore(
    subscribeToStorage,
    getBookingsSnapshot,
    getServerBookingsSnapshot
  );
  const allCars = useSyncExternalStore(
    subscribeToStorage,
    getCarsSnapshot,
    getServerCarsSnapshot
  );
  const session = useSyncExternalStore(
    subscribeToStorage,
    getSessionSnapshot,
    getServerSessionSnapshot
  );

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Look up target booking
  const booking: Booking | undefined = useMemo(() => {
    return allBookings.find((b) => b.id.toLowerCase() === bookingId.toLowerCase());
  }, [allBookings, bookingId]);

  // Look up car and host
  const car: Car | undefined = useMemo(() => {
    if (!booking) return undefined;
    return allCars.find((c) => c.id === booking.carId);
  }, [booking, allCars]);

  const host: User | undefined = useMemo(() => {
    if (!booking) return undefined;
    return getUserById(booking.ownerId);
  }, [booking]);


  // Auth & Ownership verification
  const isAuthorized = useMemo(() => {
    if (!session || !booking) return false;
    const isRenter = booking.renterId === session.userId;
    const isOwner = booking.ownerId === session.userId;
    const isAdmin = session.activeRole === 'admin';
    return isRenter || isOwner || isAdmin;
  }, [session, booking]);

  const isCurrentRenter = useMemo(() => {
    return Boolean(session && booking && booking.renterId === session.userId);
  }, [session, booking]);

  // 1. Loading / Hydration state
  if (!session) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB] py-16">
        <Container>
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm text-center flex flex-col items-center">
            <span className="text-4xl mb-3">🔒</span>
            <Badge variant="terracotta" className="mb-2">
              Authentication Required
            </Badge>
            <h2 className="text-2xl font-bold text-[#111820] mb-2">Sign In to View Receipt</h2>
            <p className="text-xs text-[#66717D] mb-6">
              You must be signed in to access reservation receipts and confidential TeleBirr escrow records.
            </p>
            <Link
              href={`/signin?redirect=${encodeURIComponent(getSafeReturnUrl(`/bookings/${bookingId}`, '/dashboard'))}`}
              className="w-full py-3 px-6 rounded-2xl bg-[#111820] text-white font-bold text-xs hover:bg-[#1C2630] transition-colors"
            >
              Sign In to Demo Account
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // 2. Booking Not Found
  if (!booking) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB] py-16">
        <Container>
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm text-center flex flex-col items-center">
            <span className="text-4xl mb-3">📋</span>
            <Badge variant="neutral" className="mb-2">
              Record Missing
            </Badge>
            <h2 className="text-xl font-bold text-[#111820] mb-2">Booking Not Found</h2>
            <p className="text-xs text-[#66717D] mb-6">
              No reservation record matches the reference ID &quot;{bookingId}&quot;.
            </p>
            <Link
              href="/dashboard"
              className="py-2.5 px-6 rounded-2xl bg-[#111820] text-white font-bold text-xs"
            >
              Back to Dashboard
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // 3. Cross-User Privacy Guard
  if (!isAuthorized) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB] py-16">
        <Container>
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-red-200 shadow-sm text-center flex flex-col items-center">
            <span className="text-4xl mb-3">🚫</span>
            <Badge variant="terracotta" className="mb-2">
              Access Denied
            </Badge>
            <h2 className="text-xl font-bold text-red-950 mb-2">Private Reservation</h2>
            <p className="text-xs text-[#66717D] mb-6 leading-relaxed">
              Security guardrail: This booking belongs to another user. You cannot view reservation receipts or financial records for vehicles you do not rent or host.
            </p>
            <Link
              href="/dashboard"
              className="py-2.5 px-6 rounded-2xl bg-[#111820] text-white font-bold text-xs"
            >
              Return to Your Dashboard
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // Cancellation Execution
  const handleCancelBooking = () => {
    if (!isCurrentRenter) return;

    const res = cancelBookingByRenter(
      booking.id,
      { userId: session.userId, role: 'renter' },
      cancellationReason || 'Cancelled from receipt page'
    );

    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: 'Your reservation has been cancelled. TeleBirr escrow hold refunded.',
      });
      setIsCancelModalOpen(false);
    } else {
      setActionFeedback({
        type: 'error',
        message: res.error || 'Failed to cancel booking.',
      });
    }
  };

  const isCancellable = isCurrentRenter && (booking.status === 'requested' || booking.status === 'confirmed');

  return (
    <div className="w-full min-h-screen bg-[#F5F2EB] py-10">
      <Container className="max-w-3xl flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-[#66717D] hover:text-[#111820] flex items-center gap-1.5 transition-colors"
          >
            <span>←</span>
            <span>Back to Renter Dashboard</span>
          </Link>
          <span className="font-mono text-xs text-[#66717D]">
            Ref #{booking.id.toUpperCase()}
          </span>
        </div>

        {/* Feedback Alert Toast */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {actionFeedback.message}
          </div>
        )}

        {/* Main Receipt Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#66717D]/12 shadow-sm flex flex-col gap-6">
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#66717D]/12">
            <div>
              <span className="text-[10px] font-label-caps uppercase text-[#66717D] font-bold block mb-1">
                Official Booking Receipt
              </span>
              <h1 className="text-2xl font-black text-[#111820]">
                {car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle Reservation'}
              </h1>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="px-3 py-1 rounded-full bg-[#111820] text-white text-xs font-bold uppercase tracking-wider">
                {booking.status}
              </span>
              <span className="text-[11px] text-[#66717D] mt-1 font-mono">
                Created: {new Date(booking.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Live Trip Tracking CTA */}
          {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#111820] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#D5F36A] text-[#111820] flex items-center justify-center text-xl shrink-0">
                  📍
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white">
                      {booking.status === 'in_progress'
                        ? 'Trip Active — On-Road Telematics'
                        : 'Reservation Confirmed — Ready for Handover'}
                    </h3>
                    {booking.status === 'in_progress' && (
                      <span className="w-2 h-2 rounded-full bg-[#D5F36A] animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">
                    {booking.status === 'in_progress'
                      ? 'Live Addis Ababa corridor telemetry, speed readings, and route waypoints are active.'
                      : 'Coordinate key handover, check logistics, and start your rental trip.'}
                  </p>
                </div>
              </div>
              <Link
                href={`/bookings/${booking.id}/track`}
                id="view-trip-tracking-btn"
                className="py-2.5 px-5 rounded-full bg-[#D5F36A] hover:bg-[#c4e357] text-[#111820] font-bold text-xs transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <span>📍</span>
                <span>Open Live Trip Tracker →</span>
              </Link>
            </div>
          )}

          {/* Trip Completed Review CTA */}
          {booking.status === 'completed' && isBookingReviewable(booking, session?.userId || '').canReview && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#D5F36A]/25 border border-[#B8DC30] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⭐</span>
                <div>
                  <h3 className="font-extrabold text-sm text-[#111820]">
                    Your trip has ended! How was your journey?
                  </h3>
                  <p className="text-xs text-[#66717D]">
                    Share your verified experience and star rating to help the community and provide feedback to your host.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="py-2.5 px-5 rounded-full bg-[#111820] hover:bg-[#1C2630] text-[#D5F36A] font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <span>★</span>
                <span>Leave a Review</span>
              </button>
            </div>
          )}

          {booking.status === 'reviewed' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">✓</span>
                <span className="font-bold">
                  Trip Completed &amp; Reviewed — Your verified feedback is published on the vehicle page.
                </span>
              </div>
              {car && (
                <Link
                  href={`/cars/${car.id}#reviews-section`}
                  className="font-bold text-emerald-900 underline hover:text-emerald-950 shrink-0"
                >
                  View Review →
                </Link>
              )}
            </div>
          )}

          {/* Vehicle & Host Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {car && (
              <div className="p-4 rounded-2xl bg-[#F5F2EB] flex items-center gap-3">
                <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-white relative">
                  <Image
                    src={car.featuredImage || car.photos[0]}
                    alt={`${car.make} ${car.model}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-[#111820] truncate">
                    {car.make} {car.model}
                  </span>
                  <span className="text-xs text-[#66717D]">
                    {car.neighbourhood}, Addis Ababa
                  </span>
                  <span className="text-[11px] text-[#536600] font-semibold">
                    {car.transmission} • {car.seats} Seats
                  </span>
                </div>
              </div>
            )}

            {host && (
              <div className="p-4 rounded-2xl bg-[#F5F2EB] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#111820] text-white flex items-center justify-center font-bold text-xs">
                    {host.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#66717D] font-bold">Vehicle Host</span>
                    <span className="text-sm font-bold text-[#111820]">{host.name}</span>
                    <span className="text-xs text-[#66717D]">{host.phone}</span>
                  </div>
                </div>
                <a
                  href={`tel:${host.phone}`}
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-sm shadow-xs transition-colors"
                  title="Call Host"
                >
                  📞
                </a>
              </div>
            )}
          </div>

          {/* Rental Logistics Schedule */}
          <div className="p-4 rounded-2xl bg-[#F5F2EB] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#66717D] font-bold block mb-1">Pick-Up Date</span>
              <span className="text-sm font-bold text-[#111820]">
                {formatDisplayDate(booking.startDate)}
              </span>
              <span className="text-[#66717D]">10:00 AM (EAT)</span>
            </div>
            <div>
              <span className="text-[#66717D] font-bold block mb-1">Return Date</span>
              <span className="text-sm font-bold text-[#111820]">
                {formatDisplayDate(booking.endDate)}
              </span>
              <span className="text-[#66717D]">6:00 PM (EAT)</span>
            </div>
            <div>
              <span className="text-[#66717D] font-bold block mb-1">Duration</span>
              <span className="text-sm font-bold text-[#111820]">
                {booking.days} {booking.days === 1 ? 'Day' : 'Days'}
              </span>
              <span className="text-[#536600] font-semibold">Verified Rate</span>
            </div>
          </div>

          {/* Itemized Price Snapshot */}
          <div className="p-5 rounded-2xl bg-[#F5F2EB] flex flex-col gap-2.5 text-xs">
            <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold mb-1">
              Trusted Pricing Snapshot
            </span>
            <div className="flex justify-between text-[#66717D]">
              <span>
                Standard Daily Rate ({booking.pricePerDay.toLocaleString()} ETB × {booking.days} days)
              </span>
              <span className="font-bold text-[#111820]">
                {booking.subtotal.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex justify-between text-[#66717D]">
              <span>Marketplace Platform Escrow Fee (5%)</span>
              <span className="font-bold text-[#111820]">
                {booking.fee.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex justify-between text-[#66717D]">
              <span>Comprehensive Nyala Insurance</span>
              <span className="text-[#536600] font-bold uppercase text-[11px]">
                Included (0 ETB)
              </span>
            </div>
            <div className="flex justify-between text-base font-black text-[#111820] pt-3 border-t border-[#66717D]/15">
              <span>Total Booking Amount</span>
              <span>{booking.total.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* TeleBirr Escrow Ledger */}
          <div className="p-4 rounded-2xl bg-[#111820] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <div>
                <span className="text-white/60 text-[10px] uppercase font-bold block">
                  TeleBirr Mock Escrow Ledger
                </span>
                <span className="font-mono text-sm font-bold text-[#D5F36A]">
                  {booking.paymentReference || 'TB-MOCK-PENDING'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60">Payment Status:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#D5F36A] font-bold text-[11px] uppercase">
                {booking.paymentStatus}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {isCancellable && (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="py-2.5 px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel Booking
                </button>
              )}

              {car && (
                <Link
                  href={`/cars/${car.id}`}
                  className="py-2.5 px-4 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] font-bold text-xs transition-colors"
                >
                  View Vehicle Listing
                </Link>
              )}

              {booking.status === 'completed' && isBookingReviewable(booking, session?.userId || '').canReview && (
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="py-2.5 px-4 rounded-full bg-[#111820] hover:bg-[#1C2630] text-[#D5F36A] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>★</span>
                  <span>Leave Review</span>
                </button>
              )}
            </div>

            <Link
              href="/dashboard"
              className="py-2.5 px-5 rounded-full bg-[#111820] text-white font-bold text-xs hover:bg-[#1C2630] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Container>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#111820]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 sm:p-8 flex flex-col gap-4 border border-[#66717D]/15">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-[#111820]">Cancel Reservation</h3>
                <span className="text-xs text-[#66717D]">Ref #{booking.id.toUpperCase()}</span>
              </div>
            </div>

            <p className="text-xs text-[#66717D] leading-relaxed">
              Confirming cancellation will release the full TeleBirr escrow deposit of{' '}
              <strong className="text-[#111820]">{booking.total.toLocaleString()} ETB</strong>{' '}
              back to your mock balance.
            </p>

            <div>
              <label
                htmlFor="receipt-cancel-reason"
                className="block text-[11px] font-semibold text-[#66717D] mb-1"
              >
                Reason for Cancellation (Optional)
              </label>
              <textarea
                id="receipt-cancel-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Schedule conflict, vehicle change..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F2EB] border border-[#66717D]/20 text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-[#F5F2EB] text-[#111820] font-bold text-xs hover:bg-[#EBE8E1] transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                className="py-2 px-5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {isReviewModalOpen && booking && session && (
        <SubmitReviewModal
          isOpen={isReviewModalOpen}
          booking={booking}
          car={car}
          session={session}
          onClose={() => setIsReviewModalOpen(false)}
          onSuccess={() => {
            setIsReviewModalOpen(false);
            setActionFeedback({
              type: 'success',
              message: 'Thank you! Your verified rating and feedback have been published to the vehicle page.',
            });
          }}
        />
      )}
    </div>
  );
}
