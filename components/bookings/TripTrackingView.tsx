'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Booking, Car, User, DemoSession } from '@/lib/types';
import {
  getBookings,
  getCars,
  getUserById,
  getCurrentSession,
} from '@/lib/storage';
import {
  formatDisplayDate,
  transitionBookingStatus,
} from '@/lib/bookings';
import { SEED_BOOKINGS, SEED_CARS } from '@/lib/seeds';

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

// Addis Ababa Simulated Telematics Waypoints along major corridor
interface Waypoint {
  id: string;
  name: string;
  subcity: string;
  x: number; // SVG % 0-100
  y: number; // SVG % 0-100
  speedKmH: number;
  statusText: string;
}

const ADDIS_WAYPOINTS: Waypoint[] = [
  {
    id: 'wp_bole',
    name: 'Bole Medhanialem Corridor',
    subcity: 'Bole Subcity',
    x: 75,
    y: 72,
    speedKmH: 45,
    statusText: 'Cruising along Bole Road towards Meskel Square',
  },
  {
    id: 'wp_meskel',
    name: 'Meskel Square Interchange',
    subcity: 'Kirkos Subcity',
    x: 52,
    y: 50,
    speedKmH: 32,
    statusText: 'Navigating central roundabout, normal traffic flow',
  },
  {
    id: 'wp_kazanchis',
    name: 'Kazanchis Business District',
    subcity: 'Kirkos Subcity',
    x: 62,
    y: 40,
    speedKmH: 28,
    statusText: 'Proceeding along ECA road towards Aware',
  },
  {
    id: 'wp_piassa',
    name: 'Piassa & Churchill Avenue',
    subcity: 'Arada Subcity',
    x: 44,
    y: 32,
    speedKmH: 38,
    statusText: 'Ascending Churchill Avenue corridor',
  },
  {
    id: 'wp_sarbet',
    name: 'Sarbet & Mexico Square',
    subcity: 'Kirkos Subcity',
    x: 35,
    y: 60,
    speedKmH: 42,
    statusText: 'Passing South Africa Embassy road towards Gotera',
  },
  {
    id: 'wp_cmc',
    name: 'CMC & Megenagna Arterial',
    subcity: 'Yeka Subcity',
    x: 82,
    y: 35,
    speedKmH: 52,
    statusText: 'Express transit corridor active',
  },
];

interface TripTrackingViewProps {
  bookingId: string;
}

export function TripTrackingView({ bookingId }: TripTrackingViewProps) {
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

  // Active waypoint simulation state
  const [activeWaypointIndex, setActiveWaypointIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(true);
  const [telemetryLogs, setTelemetryLogs] = useState<Array<{ time: string; text: string }>>(() => [
    { time: '10:00 AM', text: `Booking #${bookingId.toUpperCase()} verified on Shegger Telematics Rail.` },
    { time: '10:01 AM', text: 'Telemetry corridor initialized for Addis Ababa.' },
  ]);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const renter: User | undefined = useMemo(() => {
    if (!booking) return undefined;
    return getUserById(booking.renterId);
  }, [booking]);

  // Auth & Ownership verification
  const isAuthorized = useMemo(() => {
    if (!session || !booking) return false;
    const isRenter = booking.renterId === session.userId;
    const isOwner = booking.ownerId === session.userId;
    const isAdmin = session.activeRole === 'admin';
    return isRenter || isOwner || isAdmin;
  }, [session, booking]);

  const isCurrentOwner = session?.userId === booking?.ownerId;
  const isPlatformAdmin = session?.activeRole === 'admin';

  // Listen to prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsSimulating(false);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Waypoint simulation loop when booking is in_progress
  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!booking || booking.status !== 'in_progress' || !isSimulating || prefersReduced) {
      return;
    }

    const interval = setInterval(() => {
      setActiveWaypointIndex((prev) => {
        const next = (prev + 1) % ADDIS_WAYPOINTS.length;
        const currentWp = ADDIS_WAYPOINTS[next];
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setTelemetryLogs((logs) => [
          { time: timeStr, text: `Waypoint: ${currentWp.name} (${currentWp.speedKmH} km/h) — ${currentWp.statusText}` },
          ...logs.slice(0, 15), // keep last 15
        ]);

        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [booking, isSimulating]);

  // Stepper Stage Calculation
  const currentStep = useMemo(() => {
    if (!booking) return 1;
    switch (booking.status) {
      case 'requested':
        return 1;
      case 'confirmed':
        return 2;
      case 'in_progress':
        return 3;
      case 'completed':
      case 'reviewed':
        return 5;
      case 'cancelled':
      case 'declined':
        return 0;
      default:
        return 2;
    }
  }, [booking]);

  // FSM Action: Start Trip (Handover verification)
  const handleStartTrip = () => {
    if (!booking || !session) return;
    setIsProcessing(true);
    setActionFeedback(null);

    const actorRole = isPlatformAdmin ? 'admin' : isCurrentOwner ? 'owner' : 'renter';
    const result = transitionBookingStatus(booking.id, 'in_progress', {
      userId: session.userId,
      role: actorRole,
    });

    setIsProcessing(false);
    if (result.success) {
      setActionFeedback({
        type: 'success',
        message: 'Vehicle handover confirmed! Trip started and live telematics activated.',
      });
    } else {
      setActionFeedback({
        type: 'error',
        message: result.error || 'Failed to start trip.',
      });
    }
  };

  // FSM Action: Complete Trip (Return inspection)
  const handleCompleteTrip = () => {
    if (!booking || !session) return;
    setIsProcessing(true);
    setActionFeedback(null);

    const actorRole = isPlatformAdmin ? 'admin' : isCurrentOwner ? 'owner' : 'renter';
    const result = transitionBookingStatus(booking.id, 'completed', {
      userId: session.userId,
      role: actorRole,
    });

    setIsProcessing(false);
    if (result.success) {
      setActionFeedback({
        type: 'success',
        message: 'Return inspection finalized! Trip marked completed and security deposit release initiated.',
      });
    } else {
      setActionFeedback({
        type: 'error',
        message: result.error || 'Failed to complete trip.',
      });
    }
  };

  // 1. Not Found State
  if (!booking) {
    return (
      <div className="w-full min-h-[70vh] bg-[#F5F2EB] py-16 flex items-center justify-center">
        <Container className="max-w-md text-center">
          <div className="p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm flex flex-col items-center">
            <span className="text-4xl mb-3">📍</span>
            <h1 className="text-xl font-bold text-[#111820] mb-2">Trip Not Found</h1>
            <p className="text-xs text-[#66717D] mb-6">
              Could not locate a booking record with ID #{bookingId.toUpperCase()}.
            </p>
            <Link
              href="/dashboard"
              className="py-2.5 px-6 rounded-2xl bg-[#111820] text-white font-bold text-xs"
            >
              Return to Dashboard
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // 2. Auth Access Barrier
  if (!session || !isAuthorized) {
    return (
      <div className="w-full min-h-[70vh] bg-[#F5F2EB] py-16 flex items-center justify-center">
        <Container className="max-w-md text-center">
          <div className="p-8 rounded-3xl bg-white border border-red-200 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xl mb-4 font-bold">
              🔒
            </div>
            <h1 className="text-xl font-bold text-red-950 mb-2">Restricted Tracking Hub</h1>
            <p className="text-xs text-[#66717D] mb-6 leading-relaxed">
              Security guardrail: Live trip telematics and handover coordinates are strictly confidential. Only the verified renter, host, or administrator can access tracking for this reservation.
            </p>
            <Link
              href={session ? '/dashboard' : `/signin?returnUrl=${encodeURIComponent(`/bookings/${booking.id}/track`)}`}
              className="py-2.5 px-6 rounded-2xl bg-[#111820] text-white font-bold text-xs hover:bg-[#1C2630] transition-colors"
            >
              {session ? 'Return to Your Dashboard' : 'Sign In to Access Tracking'}
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const currentWp = ADDIS_WAYPOINTS[activeWaypointIndex];
  const isOnRoad = booking.status === 'in_progress';
  const isTripFinished = booking.status === 'completed' || booking.status === 'reviewed';

  return (
    <div className="w-full min-h-screen bg-[#F5F2EB] py-8 sm:py-10">
      <Container className="max-w-5xl flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/bookings/${booking.id}`}
              className="text-xs font-bold text-[#66717D] hover:text-[#111820] flex items-center gap-1.5 transition-colors"
            >
              <span>←</span>
              <span>Back to Booking Receipt</span>
            </Link>
            <span className="text-xs text-[#66717D]">/</span>
            <span className="text-xs font-bold text-[#111820]">Live Telematics</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#66717D]">
              Ref #{booking.id.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {actionFeedback && (
          <div
            role={actionFeedback.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span>{actionFeedback.message}</span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              aria-label="Dismiss feedback message"
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#66717D]/12 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#66717D]/12">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#111820] text-[#D5F36A] text-[10px] font-bold uppercase tracking-wider">
                  Shegger Telematics
                </span>
                {isOnRoad && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    Live On-Road
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#111820]">
                {car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle Trip Hub'}
              </h1>
              <p className="text-xs text-[#66717D] mt-1">
                {car?.neighbourhood || 'Addis Ababa'} Hub • Scheduled: {formatDisplayDate(booking.startDate)} → {formatDisplayDate(booking.endDate)} ({booking.days} days)
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1">
              <span className="text-[10px] font-label-caps uppercase text-[#66717D] font-bold">
                Booking Status
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isOnRoad
                  ? 'bg-blue-600 text-white'
                  : isTripFinished
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#111820] text-white'
              }`}>
                {booking.status}
              </span>
            </div>
          </div>

          {/* Prototype Simulation Notice */}
          <div className="p-3.5 rounded-2xl bg-[#F5F2EB] border border-[#66717D]/15 flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <div className="flex-1 text-xs text-[#44474B] leading-relaxed">
              <strong className="text-[#111820] font-semibold">Simulated Prototype Environment:</strong> Vehicle positioning, telemetry readouts, and corridor waypoints are simulated in-memory using deterministic browser storage. No real GPS, external tracking APIs, or paid map subscriptions are connected.
            </div>
          </div>

          {/* Trip Lifecycle Stepper */}
          <div className="py-2">
            <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold block mb-4">
              Trip Journey Progression
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { step: 1, label: 'Confirmed', desc: 'Escrow Held' },
                { step: 2, label: 'Handover', desc: 'Key Inspection' },
                { step: 3, label: 'On-Road', desc: 'Active Trip' },
                { step: 4, label: 'Return Check', desc: 'Odometer/Fuel' },
                { step: 5, label: 'Finalized', desc: 'Escrow Settled' },
              ].map((s) => {
                const isPast = currentStep > s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <div
                    key={s.step}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-[#111820] border-[#111820] text-white shadow-xs'
                        : isPast
                        ? 'bg-[#E5F5D5] border-[#B8DC30] text-[#2D5A1E]'
                        : 'bg-[#F9F7F2] border-[#66717D]/15 text-[#66717D]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold font-specs-tabular">
                        Stage 0{s.step}
                      </span>
                      {isPast ? (
                        <span className="text-xs font-bold">✓</span>
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-[#D5F36A] animate-pulse" />
                      ) : null}
                    </div>
                    <div className="font-bold text-xs truncate">{s.label}</div>
                    <div className="text-[10px] opacity-80 truncate">{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive FSM Controls Panel */}
          <div className="p-5 rounded-2xl bg-[#F5F2EB] border border-[#66717D]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-label-caps uppercase text-[#66717D] font-bold">
                Lifecycle Action Controller
              </span>
              <div className="text-xs text-[#111820] font-semibold">
                {booking.status === 'confirmed' && (
                  <span>Vehicle is reserved. Host and renter must inspect vehicle condition and confirm key handover.</span>
                )}
                {booking.status === 'in_progress' && (
                  <span>Rental trip is actively in progress. Perform vehicle return inspection when the journey concludes.</span>
                )}
                {isTripFinished && (
                  <span>Trip has concluded. TeleBirr payment escrow settled and security deposit refunded.</span>
                )}
                {booking.status === 'requested' && (
                  <span>Reservation is currently pending vehicle host acceptance.</span>
                )}
                {(booking.status === 'cancelled' || booking.status === 'declined') && (
                  <span>This reservation was cancelled or declined. Telematics is permanently inactive.</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {booking.status === 'confirmed' && (
                <button
                  type="button"
                  id="start-trip-btn"
                  onClick={handleStartTrip}
                  disabled={isProcessing}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-full bg-[#111820] hover:bg-[#1C2630] text-[#D5F36A] font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? 'Verifying...' : '🔑 Confirm Handover & Start Trip'}
                </button>
              )}

              {booking.status === 'in_progress' && (
                <button
                  type="button"
                  id="complete-trip-btn"
                  onClick={handleCompleteTrip}
                  disabled={isProcessing}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-full bg-[#111820] hover:bg-[#1C2630] text-[#D5F36A] font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : '🏁 Finalize Return & Complete Trip'}
                </button>
              )}

              {isTripFinished && (
                <Link
                  href={`/bookings/${booking.id}`}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-full bg-[#111820] text-white font-bold text-xs text-center"
                >
                  View Receipt &amp; Reviews
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Map & Telemetry Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Simulated Vector Map (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#66717D]/12 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden="true">🗺️</span>
                <h2 className="text-base font-bold text-[#111820]">
                  Addis Ababa Simulated Corridor Map
                </h2>
              </div>

              {isOnRoad && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSimulating(!isSimulating)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] transition-colors cursor-pointer"
                  >
                    {isSimulating ? '⏸ Pause Path' : '▶ Resume Path'}
                  </button>
                </div>
              )}
            </div>

            {/* Custom SVG Vector Map Canvas */}
            <div
              role="region"
              aria-label={`Simulated trip corridor map of Addis Ababa. Vehicle current position: ${currentWp.name}, speed ${currentWp.speedKmH} km/h.`}
              className="relative w-full aspect-[16/10] bg-[#111820] rounded-2xl overflow-hidden border border-[#66717D]/20 shadow-inner"
            >
              {/* Grid Background Pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#66717D" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Vector Road Arterials & Corridors */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Ring Road and Major Arterials */}
                <path
                  d="M 15 20 Q 50 10 85 25 Q 90 60 75 85 Q 40 90 20 75 Z"
                  fill="none"
                  stroke="#2C353F"
                  strokeWidth="2.5"
                  strokeDasharray="2 1"
                />
                {/* Churchill / Bole Diagonal Corridor */}
                <path
                  d="M 44 32 L 52 50 L 75 72"
                  fill="none"
                  stroke={isOnRoad ? '#D5F36A' : '#44474B'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Kazanchis to CMC branch */}
                <path
                  d="M 52 50 L 62 40 L 82 35"
                  fill="none"
                  stroke="#44474B"
                  strokeWidth="1.5"
                />
                {/* Mexico to Sarbet branch */}
                <path
                  d="M 52 50 L 35 60 L 25 75"
                  fill="none"
                  stroke="#44474B"
                  strokeWidth="1.5"
                />

                {/* Fixed Waypoint Nodes */}
                {ADDIS_WAYPOINTS.map((wp, idx) => (
                  <g key={wp.id} className="cursor-pointer">
                    <circle
                      cx={wp.x}
                      cy={wp.y}
                      r={idx === activeWaypointIndex && isOnRoad ? '3.5' : '2'}
                      fill={idx === activeWaypointIndex && isOnRoad ? '#D5F36A' : '#66717D'}
                      className="transition-all duration-300"
                    />
                    <text
                      x={wp.x}
                      y={wp.y - 3}
                      fill="#FFFFFF"
                      fontSize="2.5"
                      textAnchor="middle"
                      className="font-bold select-none opacity-80"
                    >
                      {wp.name.split(' ')[0]}
                    </text>
                  </g>
                ))}

                {/* Animated Vehicle Beacon when on-road */}
                {isOnRoad && (
                  <g className="transition-all duration-700 ease-in-out">
                    <circle
                      cx={currentWp.x}
                      cy={currentWp.y}
                      r="6"
                      fill="#D5F36A"
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={currentWp.x}
                      cy={currentWp.y}
                      r="3.5"
                      fill="#D5F36A"
                      stroke="#111820"
                      strokeWidth="1"
                    />
                  </g>
                )}
              </svg>

              {/* Map Floating HUD Overlay */}
              <div className="absolute top-3 left-3 bg-[#111820]/90 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-white flex flex-col gap-0.5 max-w-[200px]">
                <span className="text-[9px] font-label-caps uppercase text-[#D5F36A] font-bold">
                  Active Corridor Waypoint
                </span>
                <span className="text-xs font-bold truncate">
                  {isOnRoad ? currentWp.name : isTripFinished ? 'Trip Concluded' : 'Vehicle Parked at Hub'}
                </span>
                <span className="text-[10px] text-white/70">
                  {isOnRoad ? currentWp.subcity : car?.neighbourhood || 'Addis Ababa'}
                </span>
              </div>

              {/* Speed & Altitude HUD */}
              <div className="absolute bottom-3 right-3 bg-[#111820]/90 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10 text-white flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-white/60 font-mono">Sim. Speed</span>
                  <span className="text-sm font-bold font-specs-tabular text-[#D5F36A]">
                    {isOnRoad ? `${currentWp.speedKmH} km/h` : '0 km/h'}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-white/20" />
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-white/60 font-mono">Elevation</span>
                  <span className="text-sm font-bold font-specs-tabular text-white">
                    2,355 m
                  </span>
                </div>
              </div>
            </div>

            {/* Waypoint Corridor Progression Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
              {ADDIS_WAYPOINTS.map((wp, idx) => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setActiveWaypointIndex(idx)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    idx === activeWaypointIndex
                      ? 'bg-[#111820] text-white'
                      : 'bg-[#F5F2EB] text-[#44474B] hover:bg-[#EBE8E1]'
                  }`}
                >
                  {wp.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Telematics Metrics & Telemetry Feed (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Live Metrics Capsule */}
            <div className="bg-white rounded-3xl p-6 border border-[#66717D]/12 shadow-sm flex flex-col gap-4">
              <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold">
                Vehicle Telemetry Gauges
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* Speedometer */}
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] flex flex-col justify-between gap-1">
                  <span className="text-[10px] text-[#66717D] font-bold uppercase">Speed</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#111820] font-specs-tabular">
                      {isOnRoad ? currentWp.speedKmH : 0}
                    </span>
                    <span className="text-[10px] font-bold text-[#66717D]">km/h</span>
                  </div>
                  <span className="text-[10px] text-[#536600] font-semibold truncate">
                    {isOnRoad ? 'In Transit' : 'Parked'}
                  </span>
                </div>

                {/* Fuel / Battery */}
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] flex flex-col justify-between gap-1">
                  <span className="text-[10px] text-[#66717D] font-bold uppercase">Fuel Level</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#111820] font-specs-tabular">
                      84%
                    </span>
                    <span className="text-[10px] font-bold text-[#66717D]">Tank</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold truncate">
                    Full-to-Full
                  </span>
                </div>

                {/* Distance Traveled */}
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] flex flex-col justify-between gap-1">
                  <span className="text-[10px] text-[#66717D] font-bold uppercase">Odometer</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-[#111820] font-specs-tabular">
                      {isOnRoad ? '38.4' : isTripFinished ? '52.0' : '0.0'}
                    </span>
                    <span className="text-[10px] font-bold text-[#66717D]">km</span>
                  </div>
                  <span className="text-[10px] text-[#66717D] truncate">Trip Distance</span>
                </div>

                {/* OBD Security */}
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] flex flex-col justify-between gap-1">
                  <span className="text-[10px] text-[#66717D] font-bold uppercase">OBD-II Rail</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-[#111820]">
                      OK
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold truncate">
                    Security Active
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Live Event Stream */}
            <div
              role="log"
              aria-label="Simulated Telematics Event Stream"
              className="bg-white rounded-3xl p-6 border border-[#66717D]/12 shadow-sm flex flex-col gap-3 flex-1"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#66717D]/10">
                <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold">
                  Telemetry Event Stream
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              </div>

              <div className="max-h-[260px] overflow-y-auto space-y-2.5 pr-1">
                {telemetryLogs.map((log, i) => (
                  <div key={i} className="text-xs flex flex-col gap-0.5 border-l-2 border-[#111820]/30 pl-2 py-0.5">
                    <span className="text-[10px] font-mono text-[#66717D]">{log.time}</span>
                    <span className="text-[#111820] leading-snug">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Handover & Emergency Logistics Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#66717D]/12 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1: Renter Info */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-label-caps uppercase text-[#66717D] font-bold">
              Verified Renter
            </span>
            <div className="p-4 rounded-2xl bg-[#F5F2EB] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#111820] text-[#D5F36A] font-bold flex items-center justify-center text-sm">
                {renter?.name?.charAt(0) || 'R'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#111820]">{renter?.name || 'Renter'}</span>
                <span className="text-xs text-[#66717D] truncate">{renter?.phone || '+251 911 000 000'}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Vehicle Host Info */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-label-caps uppercase text-[#66717D] font-bold">
              Vehicle Host
            </span>
            <div className="p-4 rounded-2xl bg-[#F5F2EB] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#111820] text-white font-bold flex items-center justify-center text-sm">
                {host?.name?.charAt(0) || 'H'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#111820]">{host?.name || 'Host'}</span>
                <span className="text-xs text-[#66717D] truncate">{host?.phone || '+251 922 000 000'}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Addis Roadside Assistance */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-label-caps uppercase text-[#66717D] font-bold">
              Emergency Assistance
            </span>
            <div className="p-4 rounded-2xl bg-[#F5F2EB] flex flex-col gap-1">
              <span className="text-xs font-bold text-[#111820]">
                Shegger Wheels Addis Patrol:
              </span>
              <span className="text-xs text-[#536600] font-mono font-bold">
                +251 911 234 567 (Toll-Free)
              </span>
              <span className="text-[10px] text-[#66717D] mt-0.5">
                Police: 991 • Ambulance: 907 • Fire: 939
              </span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
