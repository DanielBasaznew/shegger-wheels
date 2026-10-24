'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Car, User, Booking, DemoSession } from '@/lib/types';
import {
  getUserById,
  getCheckoutDraft,
  setCheckoutDraft,
  isOptimizableImage,
} from '@/lib/storage';
import {
  formatDateString,
  formatDisplayDate,
  calculateDaysBetween,
  checkBookingConflicts,
  calculateTrustedPrice,
  createBooking,
} from '@/lib/bookings';
import { getSafeReturnUrl } from '@/lib/auth';
import { SEED_CARS, SEED_USERS } from '@/lib/seeds';

// Storage subscription for cars
function subscribeToStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
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

function getServerCarsSnapshot(): Car[] {
  return SEED_CARS;
}

// Session subscription
function subscribeToSession(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('shegger-session-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('shegger-session-change', callback);
    window.removeEventListener('storage', callback);
  };
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

function getServerSessionSnapshot(): DemoSession | null {
  return null;
}

// Client hydration subscription
function subscribeClient() {
  return () => {};
}

export function CheckoutView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Storage subscriptions
  const allCars = useSyncExternalStore(subscribeToStorage, getCarsSnapshot, getServerCarsSnapshot);
  const session = useSyncExternalStore(subscribeToSession, getSessionSnapshot, getServerSessionSnapshot);
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);

  // 2. Draft / Query State
  const queryCarId = searchParams.get('carId');
  const queryStart = searchParams.get('startDate');
  const queryEnd = searchParams.get('endDate');
  const queryHandover = (searchParams.get('handover') as 'pickup' | 'delivery') || 'pickup';

  const [carId] = useState<string>(() => {
    if (queryCarId) return queryCarId;
    const draft = getCheckoutDraft();
    return draft?.carId || '';
  });
  const [startDate, setStartDate] = useState<string>(() => {
    if (queryStart) return queryStart;
    const draft = getCheckoutDraft();
    return draft?.startDate || '';
  });
  const [endDate, setEndDate] = useState<string>(() => {
    if (queryEnd) return queryEnd;
    const draft = getCheckoutDraft();
    return draft?.endDate || '';
  });
  const [handoverOption, setHandoverOption] = useState<'pickup' | 'delivery'>(queryHandover);

  // 3. Current User from session
  const currentUser: User | null = useMemo(() => {
    if (!session) return null;
    return getUserById(session.userId) || null;
  }, [session]);

  // 4. Payment Simulation Lifecycle
  const [simState, setSimState] = useState<'ready' | 'processing' | 'receipt'>('ready');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect signed-out user safely
  useEffect(() => {
    if (isClient && !session) {
      const currentPath =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/checkout';
      const safeReturn = getSafeReturnUrl(currentPath, '/checkout');
      router.push(`/signin?redirect=${encodeURIComponent(safeReturn)}`);
    }
  }, [isClient, session, router]);

  // Selected car record
  const selectedCar = useMemo(() => {
    return allCars.find((c) => c.id === carId) || null;
  }, [allCars, carId]);

  // Host record
  const host = useMemo(() => {
    if (!selectedCar) return SEED_USERS[2];
    return getUserById(selectedCar.ownerId) || SEED_USERS[2];
  }, [selectedCar]);

  // Today string for validation
  const todayStr = useMemo(() => formatDateString(new Date()), []);

  // Validation calculations
  const isPastDate = Boolean(startDate && startDate < todayStr);
  const isInvalidRange = Boolean(startDate && endDate && endDate <= startDate);
  const rentalDays = useMemo(() => {
    if (!startDate || !endDate || isInvalidRange) return 1;
    return calculateDaysBetween(startDate, endDate);
  }, [startDate, endDate, isInvalidRange]);

  // Check conflicts
  const conflictResult = useMemo(() => {
    if (!selectedCar || !startDate || !endDate || isInvalidRange || isPastDate) {
      return null;
    }
    return checkBookingConflicts(selectedCar.id, startDate, endDate);
  }, [selectedCar, startDate, endDate, isInvalidRange, isPastDate]);

  // Trusted pricing breakdown
  const pricing = useMemo(() => {
    if (!selectedCar) {
      return {
        days: rentalDays,
        pricePerDay: 0,
        subtotal: 0,
        platformFee: 0,
        handoverFee: handoverOption === 'delivery' ? 400 : 0,
        securityDeposit: 0,
        total: 0,
      };
    }
    return calculateTrustedPrice(
      selectedCar.pricePerDay,
      startDate || todayStr,
      endDate || todayStr,
      handoverOption
    );
  }, [selectedCar, rentalDays, startDate, endDate, todayStr, handoverOption]);

  // Update session draft whenever selections change
  useEffect(() => {
    if (selectedCar && startDate && endDate && !isInvalidRange && !isPastDate) {
      setCheckoutDraft({
        carId: selectedCar.id,
        startDate,
        endDate,
        days: pricing.days,
        pricePerDay: pricing.pricePerDay,
        subtotal: pricing.subtotal,
        fee: pricing.platformFee,
        securityDeposit: 0,
        total: pricing.total,
        pickupLocation:
          handoverOption === 'delivery'
            ? `Airport Delivery (${selectedCar.neighbourhood})`
            : `${selectedCar.neighbourhood} Hub Pickup`,
        savedAt: new Date().toISOString(),
      });
    }
  }, [selectedCar, startDate, endDate, isInvalidRange, isPastDate, pricing, handoverOption]);

  // Payment trigger handler
  const handleTriggerSimulatedPayment = async () => {
    if (!selectedCar || isSubmitting) return;

    setSubmissionError(null);
    setIsSubmitting(true);
    setSimState('processing');

    // Simulate multi-sig TeleBirr escrow processing latency (1.2 seconds)
    setTimeout(() => {
      const result = createBooking({
        carId: selectedCar.id,
        startDate,
        endDate,
        handoverOption,
        paymentMethod: 'TeleBirr',
      });

      setIsSubmitting(false);

      if (result.success && result.booking) {
        setCreatedBooking(result.booking);
        setSimState('receipt');
      } else {
        setSimState('ready');
        setSubmissionError(result.error || 'Failed to complete booking submission.');
      }
    }, 1200);
  };

  // SSR / Loading view
  if (!isClient) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#111820]/15 border-t-[#111820] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#66717D]">
            Initializing Sheggar Escrow Rails...
          </p>
        </div>
      </div>
    );
  }

  // Signed out fallback
  if (!currentUser) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB] py-16">
        <Container>
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm text-center flex flex-col items-center">
            <span className="text-4xl mb-3">🔒</span>
            <Badge variant="terracotta" className="mb-2">
              Authentication Required
            </Badge>
            <h2 className="text-2xl font-bold text-[#111820] mb-2">Sign In to Continue</h2>
            <p className="text-sm text-[#66717D] mb-6">
              You must be signed in with a demo renter account to initiate TeleBirr escrow and complete your booking.
            </p>
            <Link
              href={`/signin?redirect=${encodeURIComponent('/checkout')}`}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#111820] text-white font-bold text-sm hover:bg-[#1C2630] transition-colors"
            >
              Go to Demo Sign-In
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // Missing or invalid car ID
  if (!selectedCar) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB] py-16">
        <Container>
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm text-center flex flex-col items-center">
            <span className="text-4xl mb-3">🚗</span>
            <Badge variant="terracotta" className="mb-2">
              Vehicle Missing
            </Badge>
            <h2 className="text-2xl font-bold text-[#111820] mb-2">No Vehicle Selected</h2>
            <p className="text-sm text-[#66717D] mb-6">
              Please choose an available vehicle from our Addis Ababa fleet before proceeding to checkout.
            </p>
            <Link
              href="/cars"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#111820] text-white font-bold text-sm hover:bg-[#1C2630] transition-colors"
            >
              Explore Vehicles Catalogue
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F5F2EB] pt-8 pb-20">
      <Container>
        {/* Top Stepper Header Card */}
        <div className="w-full bg-white rounded-3xl p-6 lg:p-8 mb-8 border border-[#66717D]/12 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-label-caps uppercase tracking-wider text-[#66717D] font-bold block mb-1">
                Checkout Step {simState === 'receipt' ? '4 of 4' : '2 of 4'}
              </span>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#111820] tracking-tight">
                {simState === 'receipt'
                  ? 'Booking & Escrow Confirmed'
                  : 'Confirm Booking & Escrow'}
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F2EB] text-[#111820] text-xs font-semibold self-start md:self-auto border border-[#66717D]/15">
              <span className="w-2 h-2 rounded-full bg-[#536600] animate-pulse" />
              <span>Encrypted Escrow Rail • Simulated Environment</span>
            </div>
          </div>

          {/* Stepper Trail */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#66717D]/12">
            {/* Step 1 */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F2EB]">
              <div className="w-7 h-7 rounded-full bg-[#111820] text-[#D5F36A] flex items-center justify-center shrink-0 text-xs font-bold">
                ✓
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-label-caps uppercase text-[#66717D]">
                  Step 1
                </span>
                <span className="text-xs font-bold text-[#111820] truncate">
                  Vehicle Selected
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                simState === 'ready'
                  ? 'bg-white border-[#111820] shadow-xs'
                  : 'bg-[#F5F2EB] border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  simState === 'ready'
                    ? 'bg-[#111820] text-white'
                    : 'bg-[#111820] text-[#D5F36A]'
                }`}
              >
                {simState === 'ready' ? '2' : '✓'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-label-caps uppercase text-[#536600] font-bold">
                  {simState === 'ready' ? 'Active Now' : 'Verified'}
                </span>
                <span className="text-xs font-bold text-[#111820] truncate">
                  Review &amp; Driver
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                simState === 'processing'
                  ? 'bg-white border-[#111820] shadow-xs'
                  : 'bg-[#F5F2EB] border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  simState === 'receipt'
                    ? 'bg-[#111820] text-[#D5F36A]'
                    : simState === 'processing'
                    ? 'bg-[#111820] text-white animate-spin'
                    : 'bg-[#E5E2DB] text-[#66717D]'
                }`}
              >
                {simState === 'receipt' ? '✓' : '3'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-label-caps uppercase text-[#66717D]">
                  {simState === 'processing'
                    ? 'Processing'
                    : simState === 'receipt'
                    ? 'Held in Vault'
                    : 'Step 3'}
                </span>
                <span className="text-xs font-bold text-[#111820] truncate">
                  TeleBirr Escrow
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                simState === 'receipt'
                  ? 'bg-white border-[#111820] shadow-xs'
                  : 'bg-[#F5F2EB] border-transparent opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  simState === 'receipt'
                    ? 'bg-[#111820] text-[#D5F36A]'
                    : 'bg-[#E5E2DB] text-[#66717D]'
                }`}
              >
                4
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-label-caps uppercase text-[#66717D]">
                  {simState === 'receipt' ? 'Complete' : 'Final'}
                </span>
                <span className="text-xs font-bold text-[#111820] truncate">
                  Trip Requested
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Asymmetric 7:5 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Primary Checkout Workflow (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Submission Error Banner */}
            {submissionError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3"
              >
                <span className="text-lg" aria-hidden="true">⚠️</span>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold mb-0.5">Booking Submission Error</p>
                  <p>{submissionError}</p>
                </div>
              </div>
            )}

            {/* Date Conflict or Validation Banner */}
            {conflictResult?.hasConflict && (
              <div
                id="checkout-date-conflict-msg"
                role="alert"
                aria-live="assertive"
                className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3"
              >
                <span className="text-lg" aria-hidden="true">📅</span>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold mb-0.5">Rental Dates Unavailable</p>
                  <p>{conflictResult.conflictReason}</p>
                </div>
              </div>
            )}

            {/* SECTION 1: Driver Verification */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-[#66717D]/12 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#111820] text-white flex items-center justify-center font-specs-tabular text-xs font-bold">
                    1
                  </span>
                  <h2 className="text-xl font-bold text-[#111820]">
                    Primary Driver &amp; Verification
                  </h2>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D5F36A]/40 text-[#3E4C00] text-[11px] font-bold uppercase">
                  <span>✓</span>
                  <span>Identity Synced</span>
                </div>
              </div>

              {/* Driver Profile Card */}
              <div className="bg-[#F5F2EB] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#111820] text-white flex items-center justify-center font-bold text-base shadow-xs">
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#111820]">
                        {currentUser.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#111820] text-[10px] font-bold border border-[#66717D]/15">
                        Tier 1 Driver
                      </span>
                    </div>
                    <span className="text-xs text-[#66717D]">
                      {currentUser.phone} • {currentUser.email}
                    </span>
                  </div>
                </div>
                <Link
                  href="/signin"
                  className="px-3.5 py-1.5 rounded-full bg-white text-[#111820] text-xs font-semibold hover:bg-[#E5E2DB] transition-colors border border-[#66717D]/15"
                >
                  Switch Persona
                </Link>
              </div>

              {/* Official Registry Telemetry Badge */}
              <div className="bg-[#F5F2EB]/60 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 border border-[#66717D]/10">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#536600] shrink-0 shadow-xs border border-[#66717D]/10 text-xl">
                  🪪
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#111820]">
                      Ethiopian Driver&apos;s License Status
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#536600] text-[11px] font-bold">
                      <span>✓</span> Validated Active
                    </span>
                  </div>
                  <p className="text-xs text-[#66717D] mt-0.5">
                    Directly authenticated via Addis Ababa Transport Bureau API • Record{' '}
                    <code className="font-mono font-bold text-[#111820]">
                      ET-AA-882194
                    </code>
                  </p>
                </div>
              </div>

              {/* Rental Dates Adjuster */}
              <div className="mb-6 p-4 rounded-2xl bg-[#F5F2EB]/40 border border-[#66717D]/12">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold">
                    Rental Dates Schedule
                  </span>
                  <span className="text-xs font-bold text-[#111820]">
                    {pricing.days} {pricing.days === 1 ? 'Day' : 'Days'} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="checkout-start-date"
                      className="block text-[11px] font-semibold text-[#66717D] mb-1"
                    >
                      Pick-up Date
                    </label>
                    <input
                      id="checkout-start-date"
                      type="date"
                      min={todayStr}
                      value={startDate}
                      aria-invalid={Boolean(conflictResult?.hasConflict)}
                      aria-describedby={conflictResult?.hasConflict ? 'checkout-date-conflict-msg' : undefined}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#66717D]/25 text-xs font-semibold text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="checkout-end-date"
                      className="block text-[11px] font-semibold text-[#66717D] mb-1"
                    >
                      Return Date
                    </label>
                    <input
                      id="checkout-end-date"
                      type="date"
                      min={startDate || todayStr}
                      value={endDate}
                      aria-invalid={Boolean(conflictResult?.hasConflict)}
                      aria-describedby={conflictResult?.hasConflict ? 'checkout-date-conflict-msg' : undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#66717D]/25 text-xs font-semibold text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
                    />
                  </div>
                </div>
              </div>

              {/* Handover Preferences Radios */}
              <fieldset>
                <legend className="text-[11px] font-label-caps uppercase tracking-wider text-[#66717D] font-bold mb-3 block">
                  Select Vehicle Handover Preference
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Pickup */}
                  <label
                    className={`cursor-pointer relative p-4 rounded-2xl border transition-all flex flex-col justify-between focus-within:ring-2 focus-within:ring-[#111820] focus-within:ring-offset-2 ${
                      handoverOption === 'pickup'
                        ? 'bg-white border-[#111820] shadow-sm ring-2 ring-[#111820]/15'
                        : 'bg-[#F5F2EB] border-transparent hover:bg-[#EBE8E1]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="handover"
                      value="pickup"
                      checked={handoverOption === 'pickup'}
                      onChange={() => setHandoverOption('pickup')}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">📍</span>
                        <span className="text-sm font-bold text-[#111820]">
                          Host Self-Pickup
                        </span>
                      </div>
                      <div
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          handoverOption === 'pickup'
                            ? 'bg-[#111820] text-[#D5F36A]'
                            : 'bg-transparent text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                    <p className="text-xs text-[#66717D] mb-3 leading-relaxed">
                      {selectedCar.neighbourhood} Hub. Direct garage key handover with host{' '}
                      {host.name.split(' ')[0]}.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-[#66717D]/10">
                      <span className="text-[11px] text-[#536600] font-bold uppercase">
                        Included Free
                      </span>
                      <span className="font-specs-tabular text-xs font-bold text-[#111820]">
                        0 ETB
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Airport Concierge */}
                  <label
                    className={`cursor-pointer relative p-4 rounded-2xl border transition-all flex flex-col justify-between focus-within:ring-2 focus-within:ring-[#111820] focus-within:ring-offset-2 ${
                      handoverOption === 'delivery'
                        ? 'bg-white border-[#111820] shadow-sm ring-2 ring-[#111820]/15'
                        : 'bg-[#F5F2EB] border-transparent hover:bg-[#EBE8E1]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="handover"
                      value="delivery"
                      checked={handoverOption === 'delivery'}
                      onChange={() => setHandoverOption('delivery')}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">✈️</span>
                        <span className="text-sm font-bold text-[#111820]">
                          Airport Concierge
                        </span>
                      </div>
                      <div
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          handoverOption === 'delivery'
                            ? 'bg-[#111820] text-[#D5F36A]'
                            : 'bg-transparent text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                    <p className="text-xs text-[#66717D] mb-3 leading-relaxed">
                      Curbside delivery at Addis Ababa Bole International Airport
                      (Terminal 2 Arrivals).
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-[#66717D]/10">
                      <span className="text-[11px] text-[#66717D] font-bold uppercase">
                        Optional Add-on
                      </span>
                      <span className="font-specs-tabular text-xs font-bold text-[#111820]">
                        +400 ETB
                      </span>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>

            {/* SECTION 2: Simulated TeleBirr Escrow */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-[#66717D]/12 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#111820] text-white flex items-center justify-center font-specs-tabular text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-xl font-bold text-[#111820]">
                    Simulated TeleBirr Escrow
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#D5F36A]/50 text-[#3E4C00] text-[11px] font-bold">
                  Test Harness v2.4
                </span>
              </div>

              {/* Demo Disclaimer Ribbon */}
              <div className="bg-[#F5F2EB] rounded-2xl p-4 mb-6 flex items-start gap-3 border border-[#66717D]/10">
                <span className="text-lg shrink-0">ℹ️</span>
                <p className="text-xs text-[#66717D] leading-relaxed">
                  <strong className="text-[#111820] font-semibold">
                    Interactive Sandbox Simulation:
                  </strong>{' '}
                  No physical TeleBirr accounts or real capital balances will be debited.
                  This executes the complete state machine lifecycle and registers a mock
                  escrow hold.
                </p>
              </div>

              {/* TeleBirr Branded Box */}
              <div className="bg-[#111820] text-white rounded-3xl p-6 shadow-md mb-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs">
                      <div className="w-7 h-7 rounded-lg bg-[#005CA9] flex items-center justify-center">
                        <span className="text-[#FED100] text-sm font-black italic">
                          tb
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block leading-tight">
                        TeleBirr SuperApp Rail
                      </span>
                      <span className="text-[10px] text-white/60 font-label-caps uppercase tracking-wider">
                        Ethio Telecom Certified Channel
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/50 font-label-caps uppercase block">
                      Status
                    </span>
                    <span className="text-xs text-[#D5F36A] flex items-center gap-1.5 justify-end font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#D5F36A] animate-pulse" />
                      Connected
                    </span>
                  </div>
                </div>

                {/* Linked Account Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 rounded-2xl p-3.5 mb-4">
                  <div>
                    <span className="text-[10px] font-label-caps uppercase text-white/60 block mb-1">
                      Linked TeleBirr Account
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📱</span>
                      <span className="font-mono text-sm font-bold tracking-wider text-white">
                        +251 91 •••• {currentUser.phone.slice(-4) || '4567'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-label-caps uppercase text-white/60 block mb-1">
                      Simulated Available Balance
                    </span>
                    <span className="font-specs-tabular text-sm font-bold text-[#D5F36A]">
                      84,500.00 ETB
                    </span>
                  </div>
                </div>

                {/* Escrow Protocol Explanation */}
                <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <span className="text-[#D5F36A] text-lg shrink-0 mt-0.5">🛡️</span>
                  <p className="text-xs leading-relaxed text-white/80">
                    <strong className="text-white">Escrow Protection Protocol:</strong>{' '}
                    Rental funds of{' '}
                    <span className="font-specs-tabular font-bold text-[#D5F36A]">
                      {pricing.total.toLocaleString()} ETB
                    </span>{' '}
                    are impounded into Sheggar Municipal Vault. Escrow release to Host{' '}
                    {host.name} is strictly withheld until in-person QR handoff
                    confirmation at vehicle pickup.
                  </p>
                </div>
              </div>

              {/* Payment Lifecycle Panes */}
              <div className="mb-6">
                {/* STATE 1: READY */}
                {simState === 'ready' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#F5F2EB] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔢</span>
                        <span className="text-xs font-semibold text-[#111820]">
                          Simulated USSD PIN Protocol
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#111820]">
                        •••• (Auto-authorized)
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting || Boolean(conflictResult?.hasConflict)}
                      onClick={handleTriggerSimulatedPayment}
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-base shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                        conflictResult?.hasConflict
                          ? 'bg-[#E5E2DB] text-[#66717D] cursor-not-allowed'
                          : 'bg-[#D5F36A] hover:bg-[#C5E852] text-[#111820] active:scale-[0.99]'
                      }`}
                    >
                      <span>
                        Complete Simulated Payment ({pricing.total.toLocaleString()} ETB)
                      </span>
                      <span className="text-lg">→</span>
                    </button>
                  </div>
                )}

                {/* STATE 2: PROCESSING */}
                {simState === 'processing' && (
                  <div className="p-8 rounded-3xl bg-[#F5F2EB] text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full border-4 border-[#66717D]/20 border-t-[#111820] animate-spin" />
                    <h3 className="text-lg font-bold text-[#111820]">
                      Pinging TeleBirr Core Engine...
                    </h3>
                    <p className="text-xs text-[#66717D] max-w-sm mx-auto">
                      Negotiating multi-sig smart escrow lock between Ethio Telecom API
                      and Sheggar Transit vault.
                    </p>
                    <div className="w-full max-w-xs h-1.5 bg-[#E5E2DB] rounded-full overflow-hidden mx-auto mt-2">
                      <div className="h-full bg-[#111820] rounded-full w-3/4 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* STATE 3: RECEIPT */}
                {simState === 'receipt' && createdBooking && (
                  <div className="p-6 rounded-3xl bg-[#F5F2EB] space-y-4 border border-[#536600]/20">
                    <div className="flex items-center justify-between pb-2 border-b border-[#66717D]/15">
                      <div className="flex items-center gap-2 text-[#536600]">
                        <span className="text-xl">✅</span>
                        <span className="text-base font-bold">
                          Escrow Successfully Vaulted!
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#66717D]">
                        {createdBooking.paymentReference}
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl text-xs space-y-2 border border-[#66717D]/12">
                      <div className="flex justify-between">
                        <span className="text-[#66717D]">Sender Wallet:</span>
                        <span className="text-[#111820] font-semibold">
                          {currentUser.phone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#66717D]">Escrow Beneficiary:</span>
                        <span className="text-[#111820] font-semibold">
                          {host.name} (Pending QR scan)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#66717D]">Booking ID:</span>
                        <span className="font-mono text-[#111820] font-semibold">
                          {createdBooking.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#66717D]">Initial Status:</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                          {createdBooking.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#536600] font-bold pt-2 border-t border-[#66717D]/10">
                        <span>Locked Escrow:</span>
                        <span className="font-specs-tabular">
                          {createdBooking.total.toLocaleString()} ETB
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <Link
                        href="/dashboard"
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#111820] text-white font-bold text-center text-xs hover:bg-[#1C2630] transition-colors"
                      >
                        Go to Trips Dashboard →
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSimState('ready');
                          setCreatedBooking(null);
                        }}
                        className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white text-[#111820] font-semibold text-xs hover:bg-[#E5E2DB] transition-colors border border-[#66717D]/15"
                      >
                        Reset Demo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust & Security Micro-Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#66717D]/12">
                <div className="flex items-center gap-2 text-[#66717D]">
                  <span className="text-xs">🔒</span>
                  <span className="text-xs font-semibold">256-bit Simulated SSL</span>
                </div>
                <div className="flex items-center gap-2 text-[#66717D]">
                  <span className="text-xs">💬</span>
                  <span className="text-xs font-semibold">Instant SMS Dispatch</span>
                </div>
                <div className="flex items-center gap-2 text-[#66717D]">
                  <span className="text-xs">🔄</span>
                  <span className="text-xs font-semibold">100% Handover Refund</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Card (5 cols sticky) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-[#66717D]/12 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#66717D]/12">
                <span className="text-[11px] font-label-caps uppercase tracking-wider text-[#66717D] font-bold">
                  Reservation Summary
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F5F2EB] font-mono text-[11px] text-[#111820] font-bold border border-[#66717D]/12">
                  ID #{selectedCar.id.toUpperCase()}
                </span>
              </div>

              {/* Mini Vehicle Header */}
              <div className="flex gap-4 items-start pb-4 mb-4 border-b border-[#66717D]/12">
                <div className="w-24 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EB] shadow-xs relative">
                  <Image
                    src={selectedCar.featuredImage || selectedCar.photos[0]}
                    alt={`${selectedCar.make} ${selectedCar.model}`}
                    fill
                    unoptimized={!isOptimizableImage(selectedCar.featuredImage || selectedCar.photos[0])}
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#536600] font-bold uppercase tracking-wider block">
                    {selectedCar.transmission} • {selectedCar.seats} Seats
                  </span>
                  <h3 className="text-base font-bold text-[#111820] leading-tight truncate">
                    {selectedCar.year} {selectedCar.make} {selectedCar.model}
                  </h3>
                  <div className="flex items-center gap-1 text-[#66717D] text-xs mt-1">
                    <span>📍</span>
                    <span className="truncate">
                      {selectedCar.neighbourhood}, Addis Ababa
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <span className="text-amber-500 font-bold">★ 4.96</span>
                    <span className="text-[#66717D]">• Host: {host.name}</span>
                  </div>
                </div>
              </div>

              {/* Rental Period Schedule Box */}
              <div className="bg-[#F5F2EB] rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-label-caps uppercase text-[#66717D] block mb-0.5 font-bold">
                      Pick-Up Date
                    </span>
                    <span className="text-xs font-bold text-[#111820] block">
                      {formatDisplayDate(startDate)}
                    </span>
                    <span className="text-[11px] text-[#66717D]">10:00 AM (EAT)</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-label-caps uppercase text-[#66717D] block mb-0.5 font-bold">
                      Return Date
                    </span>
                    <span className="text-xs font-bold text-[#111820] block">
                      {formatDisplayDate(endDate)}
                    </span>
                    <span className="text-[11px] text-[#66717D]">6:00 PM (EAT)</span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#66717D]/12 flex items-center justify-between text-xs">
                  <span className="text-[#66717D] font-semibold">Total Billable Time</span>
                  <span className="font-bold text-[#111820]">
                    {pricing.days} {pricing.days === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              </div>

              {/* Transparent Cost Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs text-[#66717D]">
                  <span>
                    {pricing.pricePerDay.toLocaleString()} ETB × {pricing.days} days
                  </span>
                  <span className="font-specs-tabular font-bold text-[#111820]">
                    {pricing.subtotal.toLocaleString()} ETB
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#66717D]">
                  <span className="flex items-center gap-1">
                    <span>Marketplace Platform Fee (5%)</span>
                  </span>
                  <span className="font-specs-tabular font-bold text-[#111820]">
                    {pricing.platformFee.toLocaleString()} ETB
                  </span>
                </div>

                {handoverOption === 'delivery' && (
                  <div className="flex items-center justify-between text-xs text-[#66717D]">
                    <span>Airport Concierge Curbside</span>
                    <span className="font-specs-tabular font-bold text-[#111820]">
                      +400 ETB
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#66717D]">
                  <span>Comprehensive Nyala Insurance</span>
                  <span className="text-[#536600] font-bold uppercase text-[11px]">
                    Included (0 ETB)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#66717D]">
                  <span>24/7 Roadside Assistance</span>
                  <span className="text-[#536600] font-bold uppercase text-[11px]">
                    Included (0 ETB)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#66717D]">
                  <span>Refundable Security Bond</span>
                  <span className="text-[#536600] font-bold uppercase text-[11px]">
                    Verified Waived (0 ETB)
                  </span>
                </div>

                {/* Total */}
                <div className="pt-3 mt-3 border-t border-[#66717D]/12 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-label-caps uppercase text-[#66717D] block font-bold">
                      Total Payable Now
                    </span>
                    <span className="text-sm font-bold text-[#111820]">
                      All-Inclusive Escrow
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#111820] block leading-none">
                      {pricing.total.toLocaleString()}{' '}
                      <span className="text-xs font-bold text-[#66717D]">ETB</span>
                    </span>
                    <span className="text-[10px] text-[#66717D]">
                      Inclusive of all local Ethiopian VAT
                    </span>
                  </div>
                </div>
              </div>

              {/* Renter Guarantee Banner (Terracotta / Clay) */}
              <div className="rounded-2xl bg-[#B9674B]/10 p-4 flex items-start gap-3 border border-[#B9674B]/20">
                <span className="text-lg text-[#B9674B] shrink-0">🛡️</span>
                <div>
                  <span className="text-xs font-bold text-[#111820] block mb-0.5">
                    Sheggar Handover Guarantee
                  </span>
                  <p className="text-[11px] leading-relaxed text-[#66717D]">
                    If the vehicle condition does not match listing upon in-person
                    handover, receive{' '}
                    <strong className="text-[#111820]">100% immediate escrow refund</strong>{' '}
                    plus a{' '}
                    <strong className="text-[#111820]">1,500 ETB mobility voucher</strong>{' '}
                    credited to your account.
                  </p>
                </div>
              </div>

              {/* Host Communication Preview */}
              <div className="mt-4 pt-3 border-t border-[#66717D]/12 flex items-center justify-between text-xs text-[#66717D]">
                <span>💬 Host responds in ~4 mins</span>
                <span className="font-semibold text-[#111820]">
                  {selectedCar.neighbourhood}, Addis Ababa
                </span>
              </div>
            </div>

            {/* TeleBirr Watermark */}
            <div className="px-5 py-3 rounded-2xl bg-white border border-[#66717D]/12 flex items-center justify-between text-xs text-[#66717D]">
              <span className="flex items-center gap-1.5 font-semibold">
                <span>🛡️</span> Secure Escrow Protocol AA-2025
              </span>
              <span className="font-bold text-[#111820]">No Surcharge</span>
            </div>
          </div>
        </div>

        {/* Supplementary Information Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#66717D]/12 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">📱</span>
              <h4 className="text-sm font-bold text-[#111820]">Dual QR Scan Handoff</h4>
            </div>
            <p className="text-xs text-[#66717D] leading-relaxed">
              At pickup, you and host {host.name.split(' ')[0]} scan each other&apos;s
              Sheggar app to execute the vehicle inspection and unlock the TeleBirr escrow
              vault.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#66717D]/12 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚗</span>
              <h4 className="text-sm font-bold text-[#111820]">
                Zero-Deductible Nyala Cover
              </h4>
            </div>
            <p className="text-xs text-[#66717D] leading-relaxed">
              Every trip includes third-party liability and comprehensive damage coverage
              underwritten by Nyala Insurance for Addis Ababa and regional corridors.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#66717D]/12 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <h4 className="text-sm font-bold text-[#111820]">
                Guaranteed Cancellation Refund
              </h4>
            </div>
            <p className="text-xs text-[#66717D] leading-relaxed">
              Free cancellation up to 24 hours prior to scheduled pick-up with instant
              re-credit to your TeleBirr wallet.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
