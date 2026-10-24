'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Booking, BookingStatus, Car, User, DemoSession } from '@/lib/types';
import {
  getUserById,
  isOptimizableImage,
} from '@/lib/storage';
import {
  formatDisplayDate,
  cancelBookingByRenter,
} from '@/lib/bookings';
import { downloadRenterBookingsCSV } from '@/lib/csv';
import { switchActiveRole } from '@/lib/auth';
import { SEED_BOOKINGS, SEED_CARS, SEED_USERS } from '@/lib/seeds';
import { SubmitReviewModal } from '@/components/reviews/SubmitReviewModal';
import { isBookingReviewable } from '@/lib/reviews';

// Storage subscription for reactive live updates in same browser session
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

export function RenterDashboardView() {
  // Live reactive data from storage
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

  // Authenticated user
  const currentUser: User | null = useMemo(() => {
    if (!session) return null;
    return getUserById(session.userId) || SEED_USERS[0];
  }, [session]);

  // Current renter's bookings strictly filtered
  const renterBookings: Booking[] = useMemo(() => {
    if (!currentUser) return [];
    return allBookings
      .filter((b) => b.renterId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allBookings, currentUser]);

  // Filter state for table
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'active' | 'completed' | 'cancelled'>('all');

  // Modal states
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<Booking | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Escape key dismiss listener for open modals
  React.useEffect(() => {
    if (!selectedBookingForPass && !selectedBookingForDetails && !bookingToCancel) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBookingForPass(null);
        setSelectedBookingForDetails(null);
        setBookingToCancel(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBookingForPass, selectedBookingForDetails, bookingToCancel]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    switch (filterTab) {
      case 'upcoming':
        return renterBookings.filter((b) => b.status === 'requested' || b.status === 'confirmed');
      case 'active':
        return renterBookings.filter((b) => b.status === 'in_progress');
      case 'completed':
        return renterBookings.filter((b) => b.status === 'completed' || b.status === 'reviewed');
      case 'cancelled':
        return renterBookings.filter((b) => b.status === 'cancelled' || b.status === 'declined');
      case 'all':
      default:
        return renterBookings;
    }
  }, [renterBookings, filterTab]);

  // Active or Next Upcoming Trip (Spotlight Hero)
  const spotlightBooking: Booking | null = useMemo(() => {
    // Priority: in_progress > confirmed > requested
    const inProgress = renterBookings.find((b) => b.status === 'in_progress');
    if (inProgress) return inProgress;

    const confirmed = renterBookings.find((b) => b.status === 'confirmed');
    if (confirmed) return confirmed;

    const requested = renterBookings.find((b) => b.status === 'requested');
    if (requested) return requested;

    return null;
  }, [renterBookings]);

  // Spotlight car and host
  const spotlightCar: Car | null = useMemo(() => {
    if (!spotlightBooking) return null;
    return allCars.find((c) => c.id === spotlightBooking.carId) || null;
  }, [spotlightBooking, allCars]);

  const spotlightHost: User | null = useMemo(() => {
    if (!spotlightBooking) return null;
    return getUserById(spotlightBooking.ownerId) || SEED_USERS[2];
  }, [spotlightBooking]);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    // Total spend: sum of all completed or active trips
    const completedOrActive = renterBookings.filter(
      (b) => b.status === 'completed' || b.status === 'reviewed' || b.status === 'in_progress'
    );
    const totalSpend = completedOrActive.reduce((acc, b) => acc + b.total, 0);

    // Active escrow: sum of total for requested, confirmed, in_progress
    const inEscrow = renterBookings.filter(
      (b) => b.status === 'requested' || b.status === 'confirmed' || b.status === 'in_progress'
    );
    const activeEscrowAmount = inEscrow.reduce((acc, b) => acc + b.total, 0);

    // Next departure countdown
    let nextDepartureText = 'None Scheduled';
    let nextDepartureSub = 'Explore fleet to book your next trip';
    if (spotlightBooking) {
      const today = new Date();
      const start = new Date(spotlightBooking.startDate + 'T00:00:00');
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (spotlightBooking.status === 'in_progress') {
        nextDepartureText = 'Trip In Progress';
        nextDepartureSub = `Return on ${formatDisplayDate(spotlightBooking.endDate)}`;
      } else if (diffDays <= 0) {
        nextDepartureText = 'Departs Today!';
        nextDepartureSub = `${formatDisplayDate(spotlightBooking.startDate)} • 10:00 AM`;
      } else if (diffDays === 1) {
        nextDepartureText = 'Tomorrow';
        nextDepartureSub = `${formatDisplayDate(spotlightBooking.startDate)} • 10:00 AM`;
      } else {
        nextDepartureText = `In ${diffDays} Days`;
        nextDepartureSub = `${formatDisplayDate(spotlightBooking.startDate)} • 10:00 AM`;
      }
    }

    return {
      totalSpend,
      activeEscrowAmount,
      nextDepartureText,
      nextDepartureSub,
      lifetimeRentalsCount: renterBookings.length,
      averagePerBooking:
        renterBookings.length > 0
          ? Math.round(totalSpend / Math.max(completedOrActive.length, 1))
          : 0,
    };
  }, [renterBookings, spotlightBooking]);

  // Check if a booking is cancellable by renter
  const isCancellable = (booking: Booking): boolean => {
    return booking.status === 'requested' || booking.status === 'confirmed';
  };

  // Handle Cancellation Execution
  const handleConfirmCancellation = () => {
    if (!bookingToCancel || !session) return;

    // Verify ownership
    if (bookingToCancel.renterId !== session.userId) {
      setActionFeedback({
        type: 'error',
        message: 'Security error: You do not have permission to cancel this booking.',
      });
      setBookingToCancel(null);
      return;
    }

    const res = cancelBookingByRenter(
      bookingToCancel.id,
      { userId: session.userId, role: 'renter' },
      cancellationReason || 'Cancelled by renter from dashboard'
    );

    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: `Booking #${bookingToCancel.id.toUpperCase()} has been cancelled. Your mock TeleBirr escrow hold (${bookingToCancel.total.toLocaleString()} ETB) has been automatically refunded.`,
      });
    } else {
      setActionFeedback({
        type: 'error',
        message: res.error || 'Failed to cancel booking.',
      });
    }

    setBookingToCancel(null);
    setCancellationReason('');
    setSelectedBookingForDetails(null);
  };

  // Status Badge Component
  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>Requested • Awaiting Host</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D5F36A]/60 text-[#3E4C00] text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#536600]" />
            <span>Confirmed • Escrow Locked</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <span>Active Trip • On Corridor</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">check</span>
            <span>Completed</span>
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">star</span>
            <span>Completed &amp; Reviewed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-900 text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">undo</span>
            <span>Cancelled • 100% Refunded</span>
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200 text-stone-800 text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">close</span>
            <span>Declined by Host • Refunded</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>Under Dispute Investigation</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">gavel</span>
            <span>Dispute Resolved</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
            {status}
          </span>
        );
    }
  };

  if (!currentUser || !session) return null;

  return (
    <div className="w-full min-h-screen bg-[#F5F2EB] py-8 lg:py-10">
      <Container className="flex flex-col gap-10">
        {/* Feedback Alert Toast */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all shadow-sm ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
              <span className="material-symbols-outlined text-lg">
                {actionFeedback.type === 'success' ? 'check_circle' : 'warning'}
              </span>
              <span>{actionFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5 text-xs font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Section 1: Dashboard Header & Profile Strip */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-2 h-2 rounded-full bg-[#536600]" />
              <span className="text-[11px] font-label-caps uppercase tracking-wider text-[#66717D] font-bold">
                Active Telemetry • Addis Ababa Hub
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#111820] tracking-tight">
              Welcome back, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm lg:text-base text-[#66717D] leading-relaxed">
              Manage your reservations, active escrows, and trip history across Bole,
              Kazanchis, and Sarbet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Multi-role quick switch */}
            {currentUser.roles.length > 1 && (
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-white border border-[#66717D]/15 shadow-xs">
                {currentUser.roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => switchActiveRole(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      session.activeRole === r
                        ? 'bg-[#111820] text-white shadow-xs'
                        : 'text-[#44474B] hover:text-[#111820]'
                    }`}
                  >
                    {r} View
                  </button>
                ))}
              </div>
            )}

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={() => downloadRenterBookingsCSV(renterBookings, allCars, currentUser)}
              disabled={renterBookings.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                renterBookings.length > 0
                  ? 'bg-white hover:bg-[#EBE8E1] text-[#111820] border-[#66717D]/20 shadow-xs'
                  : 'bg-white/50 text-[#66717D]/50 border-dashed border-[#66717D]/20 cursor-not-allowed'
              }`}
              title="Download your personal trip history as a formatted CSV file"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export Trips (CSV)</span>
            </button>

            {/* Primary Action Button */}
            <Link
              href="/cars"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D5F36A] hover:bg-[#C5E852] text-[#111820] font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <span>Browse Available Vehicles</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </header>

        {/* Telemetry KPI Metrics: 4-Col Bento Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Next Departure */}
          <div className="bg-white p-5 rounded-2xl border border-[#66717D]/12 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-[#66717D]">
              <span className="text-[11px] font-label-caps uppercase tracking-wider font-bold">
                Next Trip Departure
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F5F2EB] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#66717D] text-lg">schedule</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#111820] tracking-tight">
                {metrics.nextDepartureText}
              </span>
              <span className="text-xs text-[#66717D] mt-0.5 font-medium">
                {metrics.nextDepartureSub}
              </span>
            </div>
            <div className="w-full bg-[#F5F2EB] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  spotlightBooking ? 'bg-[#536600] w-3/4' : 'bg-transparent w-0'
                }`}
              />
            </div>
          </div>

          {/* Card 2: Total Spend */}
          <div className="bg-white p-5 rounded-2xl border border-[#66717D]/12 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-[#66717D]">
              <span className="text-[11px] font-label-caps uppercase tracking-wider font-bold">
                Total Spend
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F5F2EB] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#66717D] text-lg">payments</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#111820] tracking-tight">
                  {metrics.totalSpend.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#66717D]">ETB</span>
              </div>
              <span className="text-xs text-[#66717D] mt-0.5 font-medium">
                Across {metrics.lifetimeRentalsCount} lifetime rentals
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#536600] font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Avg. {metrics.averagePerBooking.toLocaleString()} ETB / booking</span>
            </div>
          </div>

          {/* Card 3: Active Escrow */}
          <div className="bg-[#111820] text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-white/60">
              <span className="text-[11px] font-label-caps uppercase tracking-wider font-bold">
                Active Escrow Protection
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#D5F36A] text-lg">lock</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {metrics.activeEscrowAmount.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#D5F36A]">ETB</span>
              </div>
              <span className="text-xs text-white/60 mt-0.5">
                Secured via TeleBirr SuperApp Rail
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#D5F36A] text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">check</span>
              <span>Host payout holds until vehicle inspection</span>
            </div>
          </div>

          {/* Card 4: Trust Tier */}
          <div className="bg-white p-5 rounded-2xl border border-[#66717D]/12 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-[#66717D]">
              <span className="text-[11px] font-label-caps uppercase tracking-wider font-bold">
                Sheggar Trust Tier
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F5F2EB] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#66717D] text-lg">verified_user</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#111820] tracking-tight">
                Level 2 Renter
              </span>
              <span className="text-xs text-[#66717D] mt-0.5 font-medium">
                0 Incident History • Addis Cleared
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-amber-500 font-bold inline-flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
                5.0 Host Score
              </span>
              <span className="text-[#66717D] ml-auto">No Cash Deposit</span>
            </div>
          </div>
        </section>

        {/* Section 2: Active Itinerary Spotlight Card */}
        {spotlightBooking && spotlightCar ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#111820] tracking-tight">
                  Active Itinerary Spotlight
                </h2>
                {renderStatusBadge(spotlightBooking.status)}
              </div>
              <span className="font-mono text-xs text-[#66717D] hidden sm:inline">
                Reference: #{spotlightBooking.id.toUpperCase()}
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-[#66717D]/12 shadow-sm overflow-hidden flex flex-col lg:flex-row">
              {/* Vehicle Visual Stage */}
              <div className="lg:w-7/12 relative min-h-[300px] lg:min-h-full flex flex-col justify-between p-6 overflow-hidden bg-[#111820]">
                <Image
                  src={spotlightCar.featuredImage || spotlightCar.photos[0]}
                  alt={`${spotlightCar.make} ${spotlightCar.model}`}
                  fill
                  unoptimized={!isOptimizableImage(spotlightCar.featuredImage || spotlightCar.photos[0])}
                  className="object-cover opacity-75"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111820] via-[#111820]/40 to-transparent" />

                {/* Top overlay pills */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span className="px-3 py-1 rounded-full bg-[#111820]/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                    {spotlightCar.neighbourhood} Hub
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#111820] text-xs font-semibold">
                    <span className="material-symbols-outlined text-[14px]">local_gas_station</span>
                    <span>Full to Full Policy</span>
                  </div>
                </div>

                {/* Vehicle bottom specs */}
                <div className="relative z-10 flex flex-col gap-2 mt-28">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#D5F36A] text-[#111820] text-[10px] font-bold uppercase">
                      {spotlightCar.transmission}
                    </span>
                    <span className="text-white/80 text-xs font-semibold">
                      {spotlightCar.seats} Seats • {spotlightCar.fuelType || 'Petrol'}
                    </span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                    {spotlightCar.year} {spotlightCar.make} {spotlightCar.model}
                  </h3>
                  <p className="text-white/70 text-xs max-w-md line-clamp-2">
                    {spotlightCar.description}
                  </p>
                </div>
              </div>

              {/* Trip Details & Host Contact Column */}
              <div className="lg:w-5/12 p-6 lg:p-8 flex flex-col justify-between gap-6 bg-white">
                <div className="flex flex-col gap-5">
                  {/* Schedule & Handover Details */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold">
                      Pickup Logistics
                    </span>
                    <div className="p-4 rounded-2xl bg-[#F5F2EB] flex items-start gap-3">
                      <span className="material-symbols-outlined text-xl text-[#536600]">location_on</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#111820]">
                          {spotlightCar.neighbourhood} Partner Hub
                        </span>
                        <span className="text-xs text-[#66717D] mt-0.5">
                          Pick-Up: {formatDisplayDate(spotlightBooking.startDate)} • 10:00 AM
                        </span>
                        <span className="text-xs text-[#66717D]">
                          Return: {formatDisplayDate(spotlightBooking.endDate)} • 6:00 PM (
                          {spotlightBooking.days} {spotlightBooking.days === 1 ? 'Day' : 'Days'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Host Card Segment */}
                  {spotlightHost && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold">
                        Vehicle Host
                      </span>
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F2EB]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#111820] text-white flex items-center justify-center font-bold text-xs">
                            {spotlightHost.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#111820]">
                              {spotlightHost.name}
                            </span>
                            <span className="text-xs text-[#66717D]">
                              {spotlightHost.phone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${spotlightHost.phone}`}
                            className="w-8 h-8 rounded-full bg-white hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center shadow-xs transition-colors"
                            title="Call Host"
                          >
                            <span className="material-symbols-outlined text-[16px]">call</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Escrow Summary Mini-Block */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#F5F2EB] border border-[#66717D]/10">
                    <div className="flex items-center gap-2 text-xs text-[#111820]">
                      <span className="material-symbols-outlined text-[16px] text-[#536600]">shield</span>
                      <span className="font-semibold">Escrow In Custody:</span>
                    </div>
                    <span className="text-base font-bold text-[#111820]">
                      {spotlightBooking.total.toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-col gap-2.5 pt-2">
                  {(spotlightBooking.status === 'confirmed' || spotlightBooking.status === 'in_progress') && (
                    <Link
                      href={`/bookings/${spotlightBooking.id}/track`}
                      className="w-full py-3 px-4 rounded-2xl bg-[#D5F36A] hover:bg-[#c4e357] text-[#111820] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span>Track Trip &amp; Live Telematics</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedBookingForPass(spotlightBooking)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#111820] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#1C2630] active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                    <span>Show Digital QR Handover Pass</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingForDetails(spotlightBooking)}
                      className="py-2.5 px-3 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      <span>Reservation Details</span>
                    </button>

                    {isCancellable(spotlightBooking) ? (
                      <button
                        type="button"
                        onClick={() => setBookingToCancel(spotlightBooking)}
                        className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        <span>Cancel Booking</span>
                      </button>
                    ) : (
                      <Link
                        href={`/cars/${spotlightCar.id}`}
                        className="py-2.5 px-3 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                      >
                        <span className="material-symbols-outlined text-[16px]">directions_car</span>
                        <span>View Vehicle</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Empty Spotlight State */
          <div className="p-8 rounded-3xl bg-white border border-[#66717D]/12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-[#66717D]">directions_car</span>
            <h3 className="text-lg font-bold text-[#111820]">No Active Trips Scheduled</h3>
            <p className="text-xs text-[#66717D] max-w-md">
              You do not have any active or upcoming reservations right now. Browse our
              verified Addis Ababa car catalog to rent a vehicle.
            </p>
            <Link
              href="/cars"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111820] text-white font-bold text-xs hover:bg-[#1C2630] transition-colors"
            >
              <span>Explore Vehicles</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* Section 3: Interactive Trip History & Status Table */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#111820] tracking-tight">
                Booking Log &amp; Escrow Records
              </h2>
              <p className="text-xs text-[#66717D] mt-0.5">
                Archived trip verifications, tax invoices, and locked escrow statuses.
              </p>
            </div>

            {/* Filter Segmented Tabs */}
            <div role="tablist" aria-label="Filter bookings by status" className="inline-flex p-1 rounded-2xl bg-white border border-[#66717D]/15 self-start sm:self-auto shadow-xs">
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'all'}
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                All ({renterBookings.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'upcoming'}
                onClick={() => setFilterTab('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'upcoming'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                Upcoming (
                {
                  renterBookings.filter(
                    (b) => b.status === 'requested' || b.status === 'confirmed'
                  ).length
                }
                )
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'active'}
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'active'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                Active (
                {renterBookings.filter((b) => b.status === 'in_progress').length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'completed'}
                onClick={() => setFilterTab('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'completed'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                Completed (
                {
                  renterBookings.filter(
                    (b) => b.status === 'completed' || b.status === 'reviewed'
                  ).length
                }
                )
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'cancelled'}
                onClick={() => setFilterTab('cancelled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'cancelled'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                Cancelled (
                {
                  renterBookings.filter(
                    (b) => b.status === 'cancelled' || b.status === 'declined'
                  ).length
                }
                )
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-[#66717D]/12 shadow-xs overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-label="Renter Bookings and Escrow Records table"
              className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-[#111820]"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F2EB] text-[#66717D] text-[11px] font-label-caps uppercase tracking-wider border-b border-[#66717D]/10">
                    <th className="py-3.5 px-6 font-bold">Vehicle</th>
                    <th className="py-3.5 px-4 font-bold">Dates &amp; Duration</th>
                    <th className="py-3.5 px-4 font-bold">Pickup Hub</th>
                    <th className="py-3.5 px-4 font-bold">Host</th>
                    <th className="py-3.5 px-4 font-bold">Total Amount</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-6 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#66717D]/10 text-xs">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((b) => {
                      const car = allCars.find((c) => c.id === b.carId);
                      const host = getUserById(b.ownerId);

                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-[#F5F2EB]/50 transition-colors"
                        >
                          {/* Vehicle */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-9 rounded-lg overflow-hidden shrink-0 bg-[#F5F2EB] relative shadow-2xs">
                                <Image
                                  src={
                                    car?.featuredImage ||
                                    car?.photos[0] ||
                                    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80'
                                  }
                                  alt={car ? `${car.make} ${car.model}` : 'Vehicle'}
                                  fill
                                  unoptimized={!isOptimizableImage(car?.featuredImage || car?.photos[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80')}
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-[#111820] truncate">
                                  {car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle Listing'}
                                </span>
                                <span className="text-[11px] text-[#66717D] truncate">
                                  {car?.transmission} • {car?.seats} Seats
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Dates & Duration */}
                          <td className="py-4 px-4 font-medium text-[#111820]">
                            <div className="flex flex-col">
                              <span className="font-bold">
                                {formatDisplayDate(b.startDate)} – {formatDisplayDate(b.endDate)}
                              </span>
                              <span className="text-[11px] text-[#66717D]">
                                {b.days} {b.days === 1 ? 'Day' : 'Days'} Rental
                              </span>
                            </div>
                          </td>

                          {/* Pickup Hub */}
                          <td className="py-4 px-4 text-[#111820]">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-[#66717D]">location_on</span>
                              <span className="font-medium">
                                {car?.neighbourhood || 'Bole'}
                              </span>
                            </div>
                          </td>

                          {/* Host */}
                          <td className="py-4 px-4 text-[#111820]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#111820] text-white flex items-center justify-center text-[10px] font-bold">
                                {host ? host.name.slice(0, 2).toUpperCase() : 'AA'}
                              </div>
                              <span className="font-medium">
                                {host ? host.name.split(' ')[0] : 'Host'}
                              </span>
                            </div>
                          </td>

                          {/* Total Amount */}
                          <td className="py-4 px-4 font-bold text-[#111820]">
                            <span>{b.total.toLocaleString()}</span>{' '}
                            <span className="text-[10px] font-label-caps text-[#66717D]">
                              ETB
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {renderStatusBadge(b.status)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {(b.status === 'confirmed' || b.status === 'in_progress') && (
                                <Link
                                  href={`/bookings/${b.id}/track`}
                                  className="px-3 py-1.5 rounded-full bg-[#D5F36A] hover:bg-[#c4e357] text-[#111820] font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                                >
                                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                                  <span>Track</span>
                                </Link>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedBookingForDetails(b)}
                                className="px-3 py-1.5 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] font-bold text-xs transition-colors cursor-pointer"
                              >
                                View Details
                              </button>

                              {isCancellable(b) && (
                                <button
                                  type="button"
                                  onClick={() => setBookingToCancel(b)}
                                  className="px-2.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors cursor-pointer"
                                  title="Cancel booking and refund escrow"
                                >
                                  Cancel
                                </button>
                              )}

                              {car && (b.status === 'completed' || b.status === 'reviewed') && (
                                <Link
                                  href={`/cars/${car.id}`}
                                  className="px-3 py-1.5 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] font-bold text-xs transition-colors"
                                >
                                  Re-book
                                </Link>
                              )}

                              {b.status === 'completed' &&
                                isBookingReviewable(b, currentUser?.id || '').canReview && (
                                  <button
                                    type="button"
                                    onClick={() => setBookingToReview(b)}
                                    className="px-3 py-1.5 rounded-full bg-[#111820] hover:bg-[#1C2630] text-[#D5F36A] font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">star</span>
                                    <span>Leave Review</span>
                                  </button>
                                )}

                              {b.status === 'reviewed' && (
                                <span className="px-2.5 py-1 rounded-full bg-[#D5F36A]/30 text-[#2C3800] text-[11px] font-bold inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">check</span>
                                  <span>Reviewed</span>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#66717D]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-3xl text-[#66717D]">event_busy</span>
                          <span className="font-bold text-sm text-[#111820]">
                            No Bookings Found
                          </span>
                          <span className="text-xs max-w-sm">
                            {filterTab === 'all'
                              ? "You haven't made any car rental requests yet."
                              : `No bookings match the "${filterTab}" filter.`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 4: Verified Documents & Protection Strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
          {/* Doc 1: Driver's License */}
          <div className="p-5 rounded-2xl bg-white border border-[#66717D]/12 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#F5F2EB] flex items-center justify-center text-[#111820]">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#111820]">
                  Ethiopian Driver&apos;s License
                </span>
                <span className="material-symbols-outlined text-[#536600] text-xs font-bold">check</span>
              </div>
              <span className="text-xs text-[#66717D]">
                ID: ETH-AA-2022-77491 • Grade 3
              </span>
              <span className="text-[10px] font-label-caps uppercase text-[#536600] font-bold">
                Valid Thru: Nov 2027
              </span>
            </div>
          </div>

          {/* Doc 2: Nyala Comprehensive Coverage */}
          <div className="p-5 rounded-2xl bg-white border border-[#66717D]/12 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#F5F2EB] flex items-center justify-center text-[#111820]">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#111820]">
                  Nyala Comprehensive Shield
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#D5F36A]/50 text-[9px] font-bold uppercase text-[#3E4C00]">
                  Active
                </span>
              </div>
              <span className="text-xs text-[#66717D]">
                Policy: NYL-ET-AA-991 • Zero Deductible
              </span>
              <span className="text-[11px] text-[#66717D]">
                Third-party and total accidental protection
              </span>
            </div>
          </div>

          {/* Doc 3: Emergency Roadside Dispatch */}
          <div className="p-5 rounded-2xl bg-[#111820] text-white shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/10 text-[#D5F36A] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-white">
                24/7 Sheggar Dispatch
              </span>
              <span className="text-xs text-white/70">
                Dial 9988 or +251 11 661 0022
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[#D5F36A] text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D5F36A] animate-ping" />
                <span>Live Response Average: 4 mins</span>
              </div>
            </div>
          </div>
        </section>
      </Container>

      {/* MODAL 1: Digital QR Handover Pass */}
      {selectedBookingForPass && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-pass-modal-title"
          className="fixed inset-0 z-50 bg-[#111820]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-5 items-center text-center border border-[#66717D]/15">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#111820]" aria-hidden="true">qr_code_2</span>
                <span id="qr-pass-modal-title" className="text-sm font-bold text-[#111820]">
                  Digital Handover Pass
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForPass(null)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="p-4 bg-[#F5F2EB] rounded-2xl flex flex-col items-center shadow-inner">
              <svg className="w-44 h-44 text-[#111820]" fill="currentColor" viewBox="0 0 100 100">
                <rect fill="currentColor" height="25" rx="3" width="25" x="10" y="10" />
                <rect fill="#FFFFFF" height="15" width="15" x="15" y="15" />
                <rect fill="currentColor" height="9" width="9" x="18" y="18" />
                <rect fill="currentColor" height="25" rx="3" width="25" x="65" y="10" />
                <rect fill="#FFFFFF" height="15" width="15" x="70" y="15" />
                <rect fill="currentColor" height="9" width="9" x="73" y="18" />
                <rect fill="currentColor" height="25" rx="3" width="25" x="10" y="65" />
                <rect fill="#FFFFFF" height="15" width="15" x="15" y="70" />
                <rect fill="currentColor" height="9" width="9" x="18" y="73" />
                <rect fill="currentColor" height="6" width="6" x="40" y="12" />
                <rect fill="currentColor" height="6" width="6" x="50" y="12" />
                <rect fill="currentColor" height="6" width="8" x="42" y="24" />
                <rect fill="currentColor" height="8" width="6" x="52" y="24" />
                <rect fill="currentColor" height="6" width="20" x="40" y="38" />
                <rect fill="currentColor" height="6" width="8" x="12" y="44" />
                <rect fill="currentColor" height="12" width="6" x="24" y="42" />
                <rect fill="currentColor" height="8" width="8" x="68" y="42" />
                <rect fill="currentColor" height="6" width="8" x="80" y="44" />
                <rect fill="currentColor" height="10" width="6" x="40" y="52" />
                <rect fill="currentColor" height="6" width="8" x="52" y="52" />
                <rect fill="currentColor" height="18" width="6" x="44" y="66" />
                <rect fill="currentColor" height="6" width="12" x="54" y="66" />
                <rect fill="currentColor" height="8" width="8" x="72" y="66" />
                <rect fill="currentColor" height="8" width="16" x="70" y="78" />
              </svg>
            </div>

            <div className="flex flex-col gap-1 text-center">
              <span className="font-mono text-xs font-bold text-[#111820]">
                SHG-PASS-{selectedBookingForPass.id.slice(-8).toUpperCase()}
              </span>
              <p className="text-xs text-[#66717D]">
                Present this QR code to the host during vehicle inspection and key handover.
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#F5F2EB] text-[#536600] text-xs font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-[#536600]" aria-hidden="true" />
              <span>Escrow Verified • TeleBirr Locked</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Booking Details View */}
      {selectedBookingForDetails && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-receipt-modal-title"
          className="fixed inset-0 z-50 bg-[#111820]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 sm:p-8 flex flex-col gap-6 border border-[#66717D]/15 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#66717D]/12">
              <div className="flex flex-col">
                <span className="text-[10px] font-label-caps uppercase text-[#66717D] font-bold">
                  Reservation Receipt
                </span>
                <h3 id="booking-receipt-modal-title" className="text-lg font-bold text-[#111820]">
                  #{selectedBookingForDetails.id.toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Vehicle & Host */}
            {(() => {
              const car = allCars.find((c) => c.id === selectedBookingForDetails.carId);
              const host = getUserById(selectedBookingForDetails.ownerId);

              return (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-[#F5F2EB] flex items-center gap-3">
                    <div className="w-14 h-11 rounded-xl overflow-hidden shrink-0 bg-white relative">
                      <Image
                        src={
                          car?.featuredImage ||
                          car?.photos[0] ||
                          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80'
                        }
                        alt="Vehicle"
                        fill
                        unoptimized={!isOptimizableImage(car?.featuredImage || car?.photos[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80')}
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-[#111820]">
                        {car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle'}
                      </span>
                      <span className="text-xs text-[#66717D]">
                        Host: {host ? host.name : 'Abebe Kebede'} • {car?.neighbourhood || 'Bole'}
                      </span>
                    </div>
                  </div>

                  {/* Dates & Status */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#F5F2EB]">
                      <span className="text-[#66717D] block mb-0.5 font-bold">Pick-Up Date</span>
                      <span className="font-bold text-[#111820]">
                        {formatDisplayDate(selectedBookingForDetails.startDate)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F2EB]">
                      <span className="text-[#66717D] block mb-0.5 font-bold">Return Date</span>
                      <span className="font-bold text-[#111820]">
                        {formatDisplayDate(selectedBookingForDetails.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Breakdown Snapshot */}
                  <div className="p-4 rounded-2xl bg-[#F5F2EB] flex flex-col gap-2 text-xs">
                    <span className="font-bold text-[#111820] mb-1">
                      Trusted Price Snapshot
                    </span>
                    <div className="flex justify-between text-[#66717D]">
                      <span>
                        Daily Rate ({selectedBookingForDetails.pricePerDay.toLocaleString()} ETB ×{' '}
                        {selectedBookingForDetails.days} days)
                      </span>
                      <span className="font-bold text-[#111820]">
                        {selectedBookingForDetails.subtotal.toLocaleString()} ETB
                      </span>
                    </div>
                    <div className="flex justify-between text-[#66717D]">
                      <span>Platform Escrow Fee</span>
                      <span className="font-bold text-[#111820]">
                        {selectedBookingForDetails.fee.toLocaleString()} ETB
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-[#111820] pt-2 border-t border-[#66717D]/15">
                      <span>Total Paid / Held</span>
                      <span>{selectedBookingForDetails.total.toLocaleString()} ETB</span>
                    </div>
                  </div>

                  {/* TeleBirr Info */}
                  <div className="p-3.5 rounded-xl bg-[#111820] text-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#D5F36A]" aria-hidden="true">account_balance_wallet</span>
                      <span className="text-white/80">TeleBirr Ref:</span>
                      <span className="font-mono font-bold text-[#D5F36A]">
                        {selectedBookingForDetails.paymentReference || 'TB-MOCK-PENDING'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-bold text-[#D5F36A]">
                      {selectedBookingForDetails.paymentStatus}
                    </span>
                  </div>

                  {/* Actions in details */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {isCancellable(selectedBookingForDetails) && (
                      <button
                        type="button"
                        onClick={() => {
                          setBookingToCancel(selectedBookingForDetails);
                          setSelectedBookingForDetails(null);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancel This Booking
                      </button>
                    )}

                    {selectedBookingForDetails.status === 'completed' &&
                      isBookingReviewable(selectedBookingForDetails, currentUser?.id || '').canReview && (
                        <button
                          type="button"
                          onClick={() => {
                            const b = selectedBookingForDetails;
                            setSelectedBookingForDetails(null);
                            setBookingToReview(b);
                          }}
                          className="py-2.5 px-4 rounded-xl bg-[#111820] hover:bg-[#1C2630] text-[#D5F36A] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">star</span>
                          <span>Leave Review &amp; Rating</span>
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() => setSelectedBookingForDetails(null)}
                      className="ml-auto py-2.5 px-5 rounded-xl bg-[#111820] text-white font-bold text-xs hover:bg-[#1C2630] transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 3: Cancellation Confirmation Modal */}
      {bookingToCancel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-booking-modal-title"
          className="fixed inset-0 z-50 bg-[#111820]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 sm:p-8 flex flex-col gap-4 border border-[#66717D]/15">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-3xl" aria-hidden="true">warning</span>
              <div>
                <h3 id="cancel-booking-modal-title" className="text-lg font-bold text-[#111820]">
                  Confirm Cancellation
                </h3>
                <span className="text-xs text-[#66717D]">
                  Booking #{bookingToCancel.id.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#66717D] leading-relaxed">
              Are you sure you want to cancel this reservation? Because this booking has not
              yet started, your full mock TeleBirr escrow hold of{' '}
              <strong className="text-[#111820]">
                {bookingToCancel.total.toLocaleString()} ETB
              </strong>{' '}
              will be immediately refunded back to your account balance.
            </p>

            <div>
              <label
                htmlFor="cancel-reason"
                className="block text-[11px] font-semibold text-[#66717D] mb-1"
              >
                Cancellation Reason (Optional)
              </label>
              <textarea
                id="cancel-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Travel schedule changed, found another car, etc."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F2EB] border border-[#66717D]/20 text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBookingToCancel(null);
                  setCancellationReason('');
                }}
                className="py-2.5 px-4 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] font-bold text-xs transition-colors cursor-pointer"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Confirm &amp; Refund Escrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Review Submission Modal */}
      {bookingToReview && session && (
        <SubmitReviewModal
          isOpen={Boolean(bookingToReview)}
          booking={bookingToReview}
          car={allCars.find((c) => c.id === bookingToReview.carId)}
          session={session}
          onClose={() => setBookingToReview(null)}
          onSuccess={() => {
            setBookingToReview(null);
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
