'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Car,
  CarStatus,
  User,
  UserRole,
  Booking,
  BookingStatus,
  Review,
} from '@/lib/types';
import { getUserById, isOptimizableImage } from '@/lib/storage';
import {
  createCarListing,
  updateCarListing,
  toggleCarListingActive,
  updateCarBlackoutDates,
  ADDIS_NEIGHBOURHOODS,
  VEHICLE_FEATURE_OPTIONS,
  DEMO_PHOTO_PRESETS,
  CreateCarListingInput,
} from '@/lib/fleet';
import {
  formatDisplayDate,
  formatDateString,
  confirmBookingByOwner,
  declineBookingByOwner,
  startTripByOwner,
  completeTripByOwner,
  disputeBookingByOwner,
  getOwnerEarningsAnalytics,
} from '@/lib/bookings';
import { switchActiveRole } from '@/lib/auth';
import { SEED_USERS } from '@/lib/seeds';
import { OwnerResponseModal } from '@/components/reviews/OwnerResponseModal';
import { useCars, useBookings, useReviews, useSession, triggerSheggerRevalidation } from '@/lib/swr';

export type HostMainTab = 'fleet' | 'reservations' | 'earnings' | 'reviews';

export function HostFleetDashboardView() {
  // Live reactive data from SWR cache with 1-hour validation and multi-tab synchronization
  const { cars: allCars, mutate: mutateCars } = useCars();
  const { bookings: allBookings } = useBookings();
  const { reviews: allReviews } = useReviews();
  const { session } = useSession();


  // Authenticated owner persona
  const currentUser: User | null = useMemo(() => {
    if (!session) return null;
    return getUserById(session.userId) || SEED_USERS[1];
  }, [session]);

  // Cars owned strictly by current user
  const ownerCars = useMemo(() => {
    if (!currentUser) return [];
    return allCars
      .filter((c) => c.ownerId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allCars, currentUser]);

  // Bookings strictly for vehicles owned by current user
  const ownerBookings = useMemo(() => {
    if (!currentUser) return [];
    return allBookings
      .filter((b) => b.ownerId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allBookings, currentUser]);

  // Reviews strictly for vehicles owned by current user
  const ownerReviews = useMemo(() => {
    if (!currentUser) return [];
    const carIds = new Set(ownerCars.map((c) => c.id));
    return allReviews
      .filter((r) => carIds.has(r.carId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allReviews, ownerCars, currentUser]);

  // Fleet summary metrics
  const fleetMetrics = useMemo(() => {
    return {
      total: ownerCars.length,
      approved: ownerCars.filter((c) => c.status === 'approved').length,
      pending: ownerCars.filter((c) => c.status === 'pending').length,
      inactive: ownerCars.filter((c) => c.status === 'inactive').length,
      rejected: ownerCars.filter((c) => c.status === 'rejected').length,
    };
  }, [ownerCars]);

  // Earnings & utilization analytics
  const earningsSummary = useMemo(() => {
    if (!currentUser) {
      return {
        ownerId: '',
        totalCompletedEarnings: 0,
        heldEscrowAmount: 0,
        totalRefundedAmount: 0,
        bookingsCount: { total: 0, requested: 0, confirmed: 0, inProgress: 0, completed: 0, disputed: 0, cancelled: 0 },
        vehicleBreakdown: [],
      };
    }
    return getOwnerEarningsAnalytics(currentUser.id, allBookings, allCars);
  }, [currentUser, allBookings, allCars]);

  // UI Main Tab state
  const [activeTab, setActiveTab] = useState<HostMainTab>('fleet');

  // Fleet Filter & Search state
  const [carStatusFilter, setCarStatusFilter] = useState<'all' | CarStatus>('all');
  const [carSearchQuery, setCarSearchQuery] = useState('');

  // Reservations Filter & Search state
  const [resStatusFilter, setResStatusFilter] = useState<'all' | BookingStatus>('all');
  const [resSearchQuery, setResSearchQuery] = useState('');

  // Modals state for Fleet
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [blackoutCar, setBlackoutCar] = useState<Car | null>(null);

  // Modals state for Reservations
  const [bookingToConfirm, setBookingToConfirm] = useState<Booking | null>(null);
  const [bookingToDecline, setBookingToDecline] = useState<Booking | null>(null);
  const [declineReasonInput, setDeclineReasonInput] = useState('');
  const [bookingToStart, setBookingToStart] = useState<Booking | null>(null);
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null);
  const [bookingToDispute, setBookingToDispute] = useState<Booking | null>(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [reviewToRespond, setReviewToRespond] = useState<Review | null>(null);

  // Action feedback alert
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Escape key dismiss listener for open modals
  React.useEffect(() => {
    const hasOpenModal =
      isAddModalOpen ||
      editingCar !== null ||
      blackoutCar !== null ||
      bookingToConfirm !== null ||
      bookingToDecline !== null ||
      bookingToStart !== null ||
      bookingToComplete !== null ||
      bookingToDispute !== null ||
      selectedBookingDetails !== null ||
      reviewToRespond !== null;

    if (!hasOpenModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setEditingCar(null);
        setBlackoutCar(null);
        setBookingToConfirm(null);
        setBookingToDecline(null);
        setBookingToStart(null);
        setBookingToComplete(null);
        setBookingToDispute(null);
        setSelectedBookingDetails(null);
        setReviewToRespond(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddModalOpen,
    editingCar,
    blackoutCar,
    bookingToConfirm,
    bookingToDecline,
    bookingToStart,
    bookingToComplete,
    bookingToDispute,
    selectedBookingDetails,
    reviewToRespond,
  ]);

  // Filtered cars based on tab & search
  const filteredCars = useMemo(() => {
    return ownerCars.filter((car) => {
      if (carStatusFilter !== 'all' && car.status !== carStatusFilter) {
        return false;
      }
      if (carSearchQuery.trim()) {
        const query = carSearchQuery.toLowerCase().trim();
        const matchesName = `${car.year} ${car.make} ${car.model}`.toLowerCase().includes(query);
        const matchesNeighbourhood = car.neighbourhood.toLowerCase().includes(query);
        const matchesTransmission = car.transmission.toLowerCase().includes(query);
        return matchesName || matchesNeighbourhood || matchesTransmission;
      }
      return true;
    });
  }, [ownerCars, carStatusFilter, carSearchQuery]);

  // Filtered bookings based on tab & search
  const filteredBookings = useMemo(() => {
    return ownerBookings.filter((b) => {
      if (resStatusFilter !== 'all' && b.status !== resStatusFilter) {
        return false;
      }
      if (resSearchQuery.trim()) {
        const query = resSearchQuery.toLowerCase().trim();
        const renter = getUserById(b.renterId);
        const car = allCars.find((c) => c.id === b.carId);
        const matchesRenter = renter?.name.toLowerCase().includes(query);
        const matchesId = b.id.toLowerCase().includes(query);
        const matchesCar = car ? `${car.make} ${car.model}`.toLowerCase().includes(query) : false;
        return matchesRenter || matchesId || matchesCar;
      }
      return true;
    });
  }, [ownerBookings, resStatusFilter, resSearchQuery, allCars]);

  // Toggle active / paused listing
  const handleToggleActive = (car: Car) => {
    if (!session || !currentUser) return;

    const res = toggleCarListingActive(car.id, {
      userId: session.userId,
      role: session.activeRole,
    });

    if (res.success && res.car) {
      triggerSheggerRevalidation('cars');
      mutateCars();
      setFeedback({
        type: 'success',
        message: `Listing "${car.make} ${car.model}" is now ${
          res.car.status === 'approved' ? 'Active & Live' : 'Paused / Inactive'
        }.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to update listing status.',
      });
    }
  };

  // Execution: Owner confirms requested booking
  const handleExecuteConfirm = (booking: Booking) => {
    if (!session) return;
    const res = confirmBookingByOwner(booking.id, {
      userId: session.userId,
      role: session.activeRole,
    });

    if (res.success && res.booking) {
      setFeedback({
        type: 'success',
        message: `Reservation #${booking.id.toUpperCase()} confirmed! The vehicle is locked for the renter and mock escrow remains held in safety.`,
      });
      setBookingToConfirm(null);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to confirm reservation.',
      });
      setBookingToConfirm(null);
    }
  };

  // Execution: Owner declines requested booking
  const handleExecuteDecline = () => {
    if (!bookingToDecline || !session) return;
    const res = declineBookingByOwner(
      bookingToDecline.id,
      {
        userId: session.userId,
        role: session.activeRole,
      },
      declineReasonInput || 'Schedule conflict'
    );

    if (res.success) {
      setFeedback({
        type: 'info',
        message: `Reservation #${bookingToDecline.id.toUpperCase()} declined. The renter's held TeleBirr escrow has been automatically refunded.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to decline reservation.',
      });
    }

    setBookingToDecline(null);
    setDeclineReasonInput('');
  };

  // Execution: Owner starts trip (Handover)
  const handleExecuteStartTrip = (booking: Booking) => {
    if (!session) return;
    const res = startTripByOwner(booking.id, {
      userId: session.userId,
      role: session.activeRole,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Trip #${booking.id.toUpperCase()} is now ACTIVE! Vehicle handover complete.`,
      });
      setBookingToStart(null);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to start trip.',
      });
      setBookingToStart(null);
    }
  };

  // Execution: Owner completes trip (Return & Payout release)
  const handleExecuteCompleteTrip = (booking: Booking) => {
    if (!session) return;
    const res = completeTripByOwner(booking.id, {
      userId: session.userId,
      role: session.activeRole,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Rental #${booking.id.toUpperCase()} completed! Simulated TeleBirr escrow (${booking.subtotal.toLocaleString()} ETB) has been disbursed to your host balance.`,
      });
      setBookingToComplete(null);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to complete rental.',
      });
      setBookingToComplete(null);
    }
  };

  // Execution: Owner opens dispute
  const handleExecuteDispute = () => {
    if (!bookingToDispute || !session) return;
    if (!disputeReasonInput.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please provide a clear description of the dispute reason.',
      });
      return;
    }

    const res = disputeBookingByOwner(
      bookingToDispute.id,
      {
        userId: session.userId,
        role: session.activeRole,
      },
      disputeReasonInput
    );

    if (res.success) {
      setFeedback({
        type: 'info',
        message: `Dispute opened for #${bookingToDispute.id.toUpperCase()}. Platform administration has been notified and escrow is held.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to raise dispute.',
      });
    }

    setBookingToDispute(null);
    setDisputeReasonInput('');
  };

  const todayStr = formatDateString(new Date());
  const pendingRequestsCount = earningsSummary.bookingsCount.requested;

  return (
    <div className="w-full min-h-screen bg-[#F5F2EB] py-8 sm:py-12">
      <Container className="flex flex-col gap-8">
        {/* ========================================================= */}
        {/* TOP BAR / WELCOME BANNER                                 */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="material-symbols-outlined text-[24px] text-secondary">garage</span>
              <Badge variant="obsidian">Host Partner Portal</Badge>
              <Badge variant="citron">Addis Ababa P2P</Badge>
              {currentUser?.roles.includes('renter') && (
                <button
                  type="button"
                  onClick={() => switchActiveRole('renter')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] text-xs font-semibold transition-colors cursor-pointer"
                  title="Switch to Renter View"
                >
                  <span>⇄ Switch to Renter Trips</span>
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111820] tracking-tight">
              Host Fleet &amp; Reservation Hub
            </h1>
            <p className="text-sm text-[#66717D] leading-relaxed">
              Manage vehicle listings, review incoming rental requests, oversee active on-road trips,
              and track your verified TeleBirr escrow payouts across Addis Ababa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="text-lg font-bold">+</span>
              <span>Add Vehicle</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              href="/cars"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs"
            >
              <span>Public Fleet</span>
              <span>↗</span>
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ACTION REQUIRED BANNER: INCOMING BOOKING REQUESTS        */}
        {/* ========================================================= */}
        {pendingRequestsCount > 0 && activeTab !== 'reservations' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-amber-600 animate-bounce">notifications_active</span>
              <div>
                <span className="font-extrabold text-sm block">
                  {pendingRequestsCount === 1
                    ? '1 New Rental Request Awaiting Decision'
                    : `${pendingRequestsCount} New Rental Requests Awaiting Decision`}
                </span>
                <span className="text-xs text-amber-800">
                  Guests have submitted simulated TeleBirr escrow deposits. Review dates and approve or decline.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reservations');
                setResStatusFilter('requested');
              }}
              className="py-2 px-4 rounded-xl bg-[#111820] text-[#D5F36A] hover:bg-[#1C2630] font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              Review Requests ({pendingRequestsCount}) →
            </button>
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : feedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {feedback.type === 'success' ? 'check_circle' : feedback.type === 'error' ? 'warning' : 'info'}
              </span>
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss feedback message"
              className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer flex items-center"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* MAIN NAVIGATION TABS (Fleet | Reservations | Earnings)    */}
        {/* ========================================================= */}
        <div role="tablist" aria-label="Host management navigation" className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#66717D]/15 text-xs font-bold shadow-xs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'fleet'}
            onClick={() => setActiveTab('fleet')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'fleet'
                ? 'bg-[#111820] text-white shadow-xs'
                : 'text-[#66717D] hover:text-[#111820] hover:bg-[#F5F2EB]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">directions_car</span>
            <span>My Fleet</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'fleet' ? 'bg-white/20 text-white' : 'bg-[#F5F2EB] text-[#111820]'
              }`}
            >
              {ownerCars.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reservations'}
            onClick={() => setActiveTab('reservations')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
              activeTab === 'reservations'
                ? 'bg-[#111820] text-white shadow-xs'
                : 'text-[#66717D] hover:text-[#111820] hover:bg-[#F5F2EB]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">calendar_month</span>
            <span>Reservations</span>
            {pendingRequestsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-extrabold text-[10px] animate-pulse">
                {pendingRequestsCount} NEW
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'reservations' ? 'bg-white/20 text-white' : 'bg-[#F5F2EB] text-[#111820]'
                }`}
              >
                {ownerBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'earnings'}
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'earnings'
                ? 'bg-[#111820] text-white shadow-xs'
                : 'text-[#66717D] hover:text-[#111820] hover:bg-[#F5F2EB]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">payments</span>
            <span>Earnings</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-specs-tabular ${
                activeTab === 'earnings' ? 'bg-[#D5F36A] text-[#111820]' : 'bg-[#F5F2EB] text-[#111820]'
              }`}
            >
              {earningsSummary.totalCompletedEarnings.toLocaleString()} ETB
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reviews'}
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#111820] text-white shadow-xs'
                : 'text-[#66717D] hover:text-[#111820] hover:bg-[#F5F2EB]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span>Guest Reviews</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-[#F5F2EB] text-[#111820]'
              }`}
            >
              {ownerReviews.length}
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: FLEET MANAGEMENT                                  */}
        {/* ========================================================= */}
        {activeTab === 'fleet' && (
          <div className="flex flex-col gap-6">
            {/* FLEET KPI METRICS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
                  <span>Total Fleet</span>
                  <span className="p-1.5 rounded-xl bg-[#F5F2EB] text-[#111820]"><span className="material-symbols-outlined text-[18px]">directions_car</span></span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111820]">
                  {fleetMetrics.total}
                </div>
                <div className="text-xs text-[#66717D] mt-2">
                  {fleetMetrics.total === 1 ? '1 vehicle registered' : `${fleetMetrics.total} vehicles registered`}
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-[#D5F36A]" />
                <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
                  <span>Active / Live</span>
                  <span className="p-1.5 rounded-xl bg-[#D5F36A]/20 text-[#111820]"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse block"></span></span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111820]">
                  {fleetMetrics.approved}
                </div>
                <div className="text-xs text-emerald-800 font-semibold mt-2">
                  Accepting guest bookings
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-amber-400" />
                <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
                  <span>Pending Review</span>
                  <span className="p-1.5 rounded-xl bg-amber-100 text-amber-900"><span className="material-symbols-outlined text-[18px]">hourglass_top</span></span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111820]">
                  {fleetMetrics.pending}
                </div>
                <div className="text-xs text-amber-900 font-medium mt-2">
                  Awaiting admin moderation
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
                  <span>Paused / Inactive</span>
                  <span className="p-1.5 rounded-xl bg-[#F5F2EB] text-[#66717D]"><span className="material-symbols-outlined text-[18px]">pause_circle</span></span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111820]">
                  {fleetMetrics.inactive}
                </div>
                <div className="text-xs text-[#66717D] mt-2">
                  {fleetMetrics.rejected > 0 ? `${fleetMetrics.rejected} rejected by moderation` : 'Hidden from search'}
                </div>
              </div>
            </div>

            {/* CONTROLS: TABS & SEARCH */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-[#66717D]/15 overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCarStatusFilter('all')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    carStatusFilter === 'all'
                      ? 'bg-[#111820] text-white shadow-xs'
                      : 'text-[#66717D] hover:text-[#111820]'
                  }`}
                >
                  All Listings ({ownerCars.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCarStatusFilter('approved')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    carStatusFilter === 'approved'
                      ? 'bg-[#111820] text-white shadow-xs'
                      : 'text-[#66717D] hover:text-[#111820]'
                  }`}
                >
                  Active ({fleetMetrics.approved})
                </button>
                <button
                  type="button"
                  onClick={() => setCarStatusFilter('pending')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    carStatusFilter === 'pending'
                      ? 'bg-[#111820] text-white shadow-xs'
                      : 'text-[#66717D] hover:text-[#111820]'
                  }`}
                >
                  Pending ({fleetMetrics.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setCarStatusFilter('inactive')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    carStatusFilter === 'inactive'
                      ? 'bg-[#111820] text-white shadow-xs'
                      : 'text-[#66717D] hover:text-[#111820]'
                  }`}
                >
                  Paused ({fleetMetrics.inactive})
                </button>
                {fleetMetrics.rejected > 0 && (
                  <button
                    type="button"
                    onClick={() => setCarStatusFilter('rejected')}
                    className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                      carStatusFilter === 'rejected'
                        ? 'bg-[#B9674B] text-white shadow-xs'
                        : 'text-[#B9674B] hover:bg-red-50'
                    }`}
                  >
                    Rejected ({fleetMetrics.rejected})
                  </button>
                )}
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={carSearchQuery}
                  onChange={(e) => setCarSearchQuery(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-4 rounded-2xl bg-white border border-[#66717D]/18 text-xs text-[#111820] placeholder-[#66717D]/60 focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
                />
                <span className="absolute left-3 top-3 text-[#66717D] flex items-center">
                  <span className="material-symbols-outlined text-[16px]">search</span>
                </span>
                {carSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCarSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-[#66717D] hover:text-[#111820] cursor-pointer flex items-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* VEHICLES GRID */}
            {ownerCars.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-3xl bg-white border border-[#66717D]/15 text-center flex flex-col items-center max-w-xl mx-auto my-6 shadow-sm">
                <div className="w-20 h-20 rounded-3xl bg-[#F5F2EB] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-[#66717D]">directions_car</span>
                </div>
                <Badge variant="obsidian" className="mb-2">
                  Ready to Host
                </Badge>
                <h3 className="text-2xl font-extrabold text-[#111820] mb-2">
                  No Vehicles Listed Yet
                </h3>
                <p className="text-sm text-[#66717D] mb-6 leading-relaxed">
                  List your car on Shegger Wheels to earn daily income in Addis Ababa.
                  Our platform handles verified identity checks, booking agreements, and mock TeleBirr escrow payouts.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsAddModalOpen(true)}
                  className="shadow-sm"
                >
                  + List Your First Vehicle Now
                </Button>
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-[#66717D]/15 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-[#66717D]">search_off</span>
                <h3 className="text-lg font-bold text-[#111820]">No vehicles match your filter</h3>
                <p className="text-xs text-[#66717D]">
                  Try resetting your search query or switching to another status tab.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCarStatusFilter('all');
                    setCarSearchQuery('');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map((car) => {
                  const blackoutCount = car.unavailableDates ? car.unavailableDates.length : 0;

                  return (
                    <div
                      key={car.id}
                      className="rounded-3xl bg-white border border-[#66717D]/15 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {/* Photo & Status Banner */}
                      <div className="relative aspect-16/10 w-full bg-[#111820] overflow-hidden">
                        <Image
                          src={car.featuredImage || car.photos[0] || DEMO_PHOTO_PRESETS[0].url}
                          alt={`${car.make} ${car.model}`}
                          fill
                          unoptimized={!isOptimizableImage(car.featuredImage || car.photos[0] || DEMO_PHOTO_PRESETS[0].url)}
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          {car.status === 'approved' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold backdrop-blur-xs shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span>Active • Live</span>
                            </span>
                          )}
                          {car.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-bold backdrop-blur-xs shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span>Pending Moderation</span>
                            </span>
                          )}
                          {car.status === 'inactive' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820]/80 text-[#D5F36A] text-xs font-bold backdrop-blur-xs shadow-sm">
                              <span className="material-symbols-outlined text-[13px]">pause</span>
                              <span>Paused</span>
                            </span>
                          )}
                          {car.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B9674B]/90 text-white text-xs font-bold backdrop-blur-xs shadow-sm">
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              <span>Rejected</span>
                            </span>
                          )}

                          <span className="px-3 py-1 rounded-full bg-[#111820]/80 text-[#D5F36A] text-xs font-bold font-specs-tabular backdrop-blur-xs shadow-sm">
                            {car.pricePerDay.toLocaleString()} ETB/day
                          </span>
                        </div>

                        {/* Bottom Area Pill */}
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            <span>{car.neighbourhood}, Addis Ababa</span>
                          </span>
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className="p-5 flex flex-col gap-4 flex-1">
                        <div>
                          <div className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold">
                            {car.year} • {car.fuelType || 'Petrol'}
                          </div>
                          <h3 className="text-lg font-extrabold text-[#111820] tracking-tight">
                            {car.make} {car.model}
                          </h3>
                          <p className="text-xs text-[#66717D] line-clamp-2 mt-1 leading-relaxed">
                            {car.description}
                          </p>
                        </div>

                        {/* Specs Pills */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div className="p-2 rounded-xl bg-[#F5F2EB] text-[#111820] font-semibold">
                            <span className="block text-[10px] text-[#66717D] uppercase">Gearbox</span>
                            {car.transmission}
                          </div>
                          <div className="p-2 rounded-xl bg-[#F5F2EB] text-[#111820] font-semibold">
                            <span className="block text-[10px] text-[#66717D] uppercase">Capacity</span>
                            {car.seats} Seats
                          </div>
                          <div className="p-2 rounded-xl bg-[#F5F2EB] text-[#111820] font-semibold">
                            <span className="block text-[10px] text-[#66717D] uppercase">Blackout</span>
                            {blackoutCount > 0 ? `${blackoutCount} blocked` : 'None'}
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="pt-2 border-t border-[#66717D]/12 flex flex-col gap-2 mt-auto">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCar(car)}
                              className="flex-1 py-2 px-3 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                              <span>Edit Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setBlackoutCar(car)}
                              className="flex-1 py-2 px-3 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[15px]">event_busy</span>
                              <span>Blackout Dates</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {car.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(car)}
                                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[15px]">pause_circle</span>
                                <span>Pause Listing</span>
                              </button>
                            )}
                            {car.status === 'inactive' && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(car)}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-colors cursor-pointer"
                              >
                                ▶️ Activate Listing
                              </button>
                            )}

                            <Link
                              href={`/cars/${car.id}`}
                              className="py-2 px-3 rounded-xl border border-[#66717D]/25 hover:border-[#111820] text-[#111820] text-xs font-bold transition-colors text-center shrink-0"
                            >
                              View ↗
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RESERVATIONS & BOOKINGS MANAGEMENT                */}
        {/* ========================================================= */}
        {activeTab === 'reservations' && (
          <div className="flex flex-col gap-6">
            {/* RESERVATIONS STATUS TABS & SEARCH */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-[#66717D]/15 overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setResStatusFilter('all')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    resStatusFilter === 'all'
                      ? 'bg-[#111820] text-white shadow-xs'
                      : 'text-[#66717D] hover:text-[#111820]'
                  }`}
                >
                  All ({ownerBookings.length})
                </button>

                <button
                  type="button"
                  onClick={() => setResStatusFilter('requested')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    resStatusFilter === 'requested'
                      ? 'bg-amber-500 text-white shadow-xs font-bold'
                      : 'text-amber-900 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <span>Action Required</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 text-[10px] font-extrabold">
                    {earningsSummary.bookingsCount.requested}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setResStatusFilter('confirmed')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    resStatusFilter === 'confirmed'
                      ? 'bg-[#111820] text-white shadow-xs'
                      : 'text-[#66717D] hover:text-[#111820]'
                  }`}
                >
                  Confirmed ({earningsSummary.bookingsCount.confirmed})
                </button>

                <button
                  type="button"
                  onClick={() => setResStatusFilter('in_progress')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    resStatusFilter === 'in_progress'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  On Road ({earningsSummary.bookingsCount.inProgress})
                </button>

                <button
                  type="button"
                  onClick={() => setResStatusFilter('completed')}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    resStatusFilter === 'completed'
                      ? 'bg-[#111820] text-white shadow-xs'
                      : 'text-[#66717D] hover:text-[#111820]'
                  }`}
                >
                  Completed ({earningsSummary.bookingsCount.completed})
                </button>

                {earningsSummary.bookingsCount.disputed > 0 && (
                  <button
                    type="button"
                    onClick={() => setResStatusFilter('disputed')}
                    className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                      resStatusFilter === 'disputed'
                        ? 'bg-[#B9674B] text-white shadow-xs'
                        : 'text-[#B9674B] bg-red-50 hover:bg-red-100'
                    }`}
                  >
                    Disputes ({earningsSummary.bookingsCount.disputed})
                  </button>
                )}
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search by renter, vehicle, ID..."
                  value={resSearchQuery}
                  onChange={(e) => setResSearchQuery(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-4 rounded-2xl bg-white border border-[#66717D]/18 text-xs text-[#111820] placeholder-[#66717D]/60 focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
                />
                <span className="absolute left-3 top-3 text-[#66717D] flex items-center">
                  <span className="material-symbols-outlined text-[16px]">search</span>
                </span>
                {resSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setResSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-[#66717D] hover:text-[#111820] cursor-pointer flex items-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* RESERVATIONS LIST */}
            {ownerBookings.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-[#66717D]/15 text-center flex flex-col items-center max-w-lg mx-auto shadow-xs">
                <span className="material-symbols-outlined text-4xl text-[#66717D] mb-3">calendar_month</span>
                <h3 className="text-xl font-extrabold text-[#111820] mb-2">No Reservations Yet</h3>
                <p className="text-xs text-[#66717D] leading-relaxed mb-4">
                  Once your vehicles are approved, renters across Addis Ababa can discover and request bookings.
                  Incoming booking notifications and escrow milestones will appear here.
                </p>
                <Button variant="primary" size="sm" onClick={() => setActiveTab('fleet')}>
                  View Fleet Vehicles
                </Button>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-[#66717D]/15 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-[#66717D]">search_off</span>
                <h3 className="text-lg font-bold text-[#111820]">No reservations match your filter</h3>
                <p className="text-xs text-[#66717D]">
                  Try selecting another status tab or clearing your search query.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResStatusFilter('all');
                    setResSearchQuery('');
                  }}
                >
                  Reset Reservation Filter
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredBookings.map((b) => {
                  const car = allCars.find((c) => c.id === b.carId);
                  const renter = getUserById(b.renterId);

                  return (
                    <div
                      key={b.id}
                      className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all flex flex-col gap-4 shadow-xs ${
                        b.status === 'requested'
                          ? 'border-amber-300 ring-2 ring-amber-100'
                          : 'border-[#66717D]/15 hover:border-[#111820]/30'
                      }`}
                    >
                      {/* Top Meta Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#66717D]/12">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-[#111820]">
                            #{b.id.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-[#66717D]">
                            Requested on {formatDisplayDate(b.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Lifecycle Status Pill */}
                          {b.status === 'requested' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                              <span>Action Required • Requested</span>
                            </span>
                          )}
                          {b.status === 'confirmed' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D5F36A]/40 text-[#111820] text-xs font-bold border border-[#B6D24D]">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              <span>Confirmed • Ready for Handover</span>
                            </span>
                          )}
                          {b.status === 'in_progress' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>On Road • Active Rental</span>
                            </span>
                          )}
                          {(b.status === 'completed' || b.status === 'reviewed') && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px]">task_alt</span>
                              <span>Completed</span>
                            </span>
                          )}
                          {b.status === 'declined' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-900 text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              <span>Declined by Host</span>
                            </span>
                          )}
                          {b.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#66717D] text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px]">block</span>
                              <span>Cancelled</span>
                            </span>
                          )}
                          {b.status === 'disputed' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B9674B]/20 text-[#76331B] text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              <span>Dispute Under Review</span>
                            </span>
                          )}

                          {/* TeleBirr Escrow Pill */}
                          <span
                            className={`px-2.5 py-0.8 rounded-full text-[10px] font-bold uppercase font-specs-tabular ${
                              b.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                : b.paymentStatus === 'held_in_escrow'
                                ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {b.paymentStatus === 'paid'
                              ? 'TeleBirr: Paid to Host'
                              : b.paymentStatus === 'held_in_escrow'
                              ? 'TeleBirr: In Escrow'
                              : 'TeleBirr: Refunded'}
                          </span>
                        </div>
                      </div>

                      {/* Main Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* 1. Vehicle Details */}
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                            <Image
                              src={car?.featuredImage || car?.photos?.[0] || DEMO_PHOTO_PRESETS[0].url}
                              alt="Vehicle"
                              fill
                              unoptimized={!isOptimizableImage(car?.featuredImage || car?.photos?.[0] || DEMO_PHOTO_PRESETS[0].url)}
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[#111820] truncate">
                              {car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle'}
                            </span>
                            <span className="text-[11px] text-[#66717D] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">location_on</span>
                              <span>{car?.neighbourhood || 'Bole'} • {b.pricePerDay.toLocaleString()} ETB/day</span>
                            </span>
                          </div>
                        </div>

                        {/* 2. Renter Details */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#111820] text-[#D5F36A] flex items-center justify-center font-bold text-xs shrink-0">
                            {renter ? renter.name.substring(0, 2).toUpperCase() : 'RN'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[#111820] truncate">
                              {renter ? renter.name : 'Registered Renter'}
                            </span>
                            <span className="text-[11px] text-[#66717D]">
                              Verified Guest • {renter?.phone || 'Addis Ababa'}
                            </span>
                          </div>
                        </div>

                        {/* 3. Dates & Duration */}
                        <div className="flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#111820]">
                            <span className="material-symbols-outlined text-[15px] text-[#66717D]">calendar_today</span>
                            <span>{formatDisplayDate(b.startDate)}</span>
                            <span className="text-[#66717D]">→</span>
                            <span>{formatDisplayDate(b.endDate)}</span>
                          </div>
                          <span className="text-[11px] text-[#66717D] mt-0.5">
                            Duration: <strong>{b.days} Days</strong> rental
                          </span>
                        </div>
                      </div>

                      {/* Pricing Snapshot Breakdown Strip */}
                      <div className="p-3.5 rounded-2xl bg-[#F6F3EC] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div>
                            <span className="text-[10px] text-[#66717D] uppercase block">
                              Rental Subtotal
                            </span>
                            <span className="font-bold text-[#111820] font-specs-tabular">
                              {b.subtotal.toLocaleString()} ETB
                            </span>
                          </div>
                          <div className="hidden sm:block text-[#66717D]/40">•</div>
                          <div>
                            <span className="text-[10px] text-[#66717D] uppercase block">
                              Platform Escrow Fee
                            </span>
                            <span className="text-[#66717D] font-specs-tabular">
                              {b.fee.toLocaleString()} ETB
                            </span>
                          </div>
                          <div className="hidden sm:block text-[#66717D]/40">•</div>
                          <div>
                            <span className="text-[10px] text-[#66717D] uppercase block">
                              Net Host Payout
                            </span>
                            <span className="font-extrabold text-[#111820] font-specs-tabular">
                              {b.subtotal.toLocaleString()} ETB
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#66717D]">Ref:</span>
                          <span className="font-mono text-xs font-bold text-[#111820]">
                            {b.paymentReference || 'TB-MOCK-ESCROW'}
                          </span>
                        </div>
                      </div>

                      {/* Reason Notes Banner if Present */}
                      {b.declineReason && (
                        <div className="p-3 rounded-xl bg-red-50 text-red-900 text-xs">
                          <strong>Decline Reason:</strong> {b.declineReason}
                        </div>
                      )}
                      {b.cancellationReason && (
                        <div className="p-3 rounded-xl bg-slate-100 text-[#66717D] text-xs">
                          <strong>Cancellation Reason:</strong> {b.cancellationReason}
                        </div>
                      )}
                      {b.disputeReason && (
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-950 text-xs">
                          <strong>Dispute Note:</strong> {b.disputeReason}
                        </div>
                      )}

                      {/* Bottom Action Buttons Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. If Requested: Approve or Decline */}
                          {b.status === 'requested' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setBookingToConfirm(b)}
                                className="py-2 px-4 rounded-xl bg-[#D5F36A] hover:bg-[#CEEC64] text-[#111820] text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[15px]">check</span>
                                <span>Approve &amp; Confirm Request</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBookingToDecline(b);
                                  setDeclineReasonInput('');
                                }}
                                className="py-2 px-3.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[15px]">close</span>
                                <span>Decline Request</span>
                              </button>
                            </>
                          )}

                          {/* Live Trip Tracking link */}
                          {(b.status === 'confirmed' || b.status === 'in_progress') && (
                            <Link
                              href={`/bookings/${b.id}/track`}
                              className="py-2 px-3 rounded-xl bg-[#D5F36A] hover:bg-[#c4e357] text-[#111820] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[15px]">near_me</span>
                              <span>Live Tracking</span>
                            </Link>
                          )}

                          {/* 2. If Confirmed: Key Handover / Start Rental */}
                          {b.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => setBookingToStart(b)}
                              className="py-2 px-4 rounded-xl bg-[#111820] hover:bg-[#1C2630] text-[#D5F36A] text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[15px]">key</span>
                              <span>Key Handover (Start Trip)</span>
                            </button>
                          )}

                          {/* 3. If In Progress: Complete Rental / Disburse Payout */}
                          {b.status === 'in_progress' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setBookingToComplete(b)}
                                className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[15px]">flag</span>
                                <span>Complete Rental &amp; Disburse Payout</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBookingToDispute(b);
                                  setDisputeReasonInput('');
                                }}
                                className="py-2 px-3 rounded-xl border border-[#B9674B]/40 text-[#76331B] hover:bg-red-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[15px]">report_problem</span>
                                <span>Report Issue</span>
                              </button>
                            </>
                          )}

                          {/* 4. If Completed: Option to raise post-trip damage dispute */}
                          {(b.status === 'completed' || b.status === 'reviewed') && (
                            <button
                              type="button"
                              onClick={() => {
                                setBookingToDispute(b);
                                setDisputeReasonInput('');
                              }}
                              className="py-1.5 px-3 rounded-xl border border-[#66717D]/25 hover:border-[#111820] text-[#66717D] hover:text-[#111820] text-xs font-bold transition-all cursor-pointer"
                            >
                              Report Post-Trip Damage
                            </button>
                          )}
                        </div>

                        {/* View Full Receipt Modal Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedBookingDetails(b)}
                          className="py-1.5 px-3 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] text-xs font-bold transition-colors cursor-pointer ml-auto"
                        >
                          View Receipt ↗
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: EARNINGS & FINANCIAL ANALYTICS                     */}
        {/* ========================================================= */}
        {activeTab === 'earnings' && (
          <div className="flex flex-col gap-6">
            {/* SIMULATED FINANCIAL NOTICE */}
            <div className="p-4 rounded-2xl bg-[#111820] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-[#D5F36A]">account_balance_wallet</span>
                <div>
                  <span className="font-bold text-[#D5F36A] block">
                    Simulated TeleBirr Payout Rail
                  </span>
                  <span className="text-white/80">
                    Rental payments are locked in marketplace escrow at checkout and automatically disbursed to your host balance upon vehicle return inspection.
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 text-[#D5F36A] text-[10px] uppercase font-bold tracking-wider shrink-0">
                Frontend Demo Simulation
              </span>
            </div>

            {/* FINANCIAL KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Completed Payouts */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-[#D5F36A]" />
                <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
                  <span>Completed Payouts</span>
                  <span className="p-1.5 rounded-xl bg-[#D5F36A]/20 text-[#111820]"><span className="material-symbols-outlined text-[16px]">payments</span></span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111820] font-specs-tabular">
                  {earningsSummary.totalCompletedEarnings.toLocaleString()}{' '}
                  <span className="text-sm font-bold text-[#66717D]">ETB</span>
                </div>
                <div className="text-xs text-emerald-800 font-semibold mt-2">
                  Net disbursed to wallet
                </div>
              </div>

              {/* 2. Escrow in Transit */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-blue-500" />
                <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
                  <span>Escrow in Transit</span>
                  <span className="p-1.5 rounded-xl bg-blue-50 text-blue-900"><span className="material-symbols-outlined text-[16px]">lock</span></span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111820] font-specs-tabular">
                  {earningsSummary.heldEscrowAmount.toLocaleString()}{' '}
                  <span className="text-sm font-bold text-[#66717D]">ETB</span>
                </div>
                <div className="text-xs text-blue-800 font-medium mt-2">
                  Held for active/upcoming trips
                </div>
              </div>

              {/* 3. Total Days Rented */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
                  <span>Days Booked</span>
                  <span className="p-1.5 rounded-xl bg-[#F5F2EB] text-[#111820]"><span className="material-symbols-outlined text-[16px]">calendar_month</span></span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111820] font-specs-tabular">
                  {earningsSummary.vehicleBreakdown.reduce((sum, v) => sum + v.daysRented, 0)}{' '}
                  <span className="text-sm font-bold text-[#66717D]">Days</span>
                </div>
                <div className="text-xs text-[#66717D] mt-2">
                  Across all registered vehicles
                </div>
              </div>

              {/* 4. Total Completed Trips */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
                  <span>Completed Trips</span>
                  <span className="p-1.5 rounded-xl bg-[#F5F2EB] text-[#111820]"><span className="material-symbols-outlined text-[16px]">task_alt</span></span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111820] font-specs-tabular">
                  {earningsSummary.bookingsCount.completed}
                </div>
                <div className="text-xs text-[#66717D] mt-2">
                  Successful rental returns
                </div>
              </div>
            </div>

            {/* VISUAL EARNINGS DISTRIBUTION BY VEHICLE */}
            <div className="p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#111820]">
                    Revenue Distribution by Vehicle
                  </h3>
                  <p className="text-xs text-[#66717D]">
                    Breakdown of gross rental revenue generated by your fleet
                  </p>
                </div>
                <Badge variant="obsidian">Addis Fleet Yield</Badge>
              </div>

              {earningsSummary.vehicleBreakdown.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#66717D]">
                  No vehicles in fleet. Add your first car to begin tracking revenue.
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  {earningsSummary.vehicleBreakdown.map((v) => {
                    const maxEarnings = Math.max(
                      ...earningsSummary.vehicleBreakdown.map((x) => x.completedEarnings),
                      1
                    );
                    const percentage = Math.round((v.completedEarnings / maxEarnings) * 100);

                    return (
                      <div key={v.carId} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#111820]">
                            {v.make} {v.model} ({v.year}) • {v.neighbourhood}
                          </span>
                          <span className="font-bold text-[#111820] font-specs-tabular">
                            {v.completedEarnings.toLocaleString()} ETB
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-[#F5F2EB] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#111820] transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* VEHICLE UTILIZATION BREAKDOWN TABLE */}
            <div className="p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#111820]">
                    Vehicle Utilization Breakdown
                  </h3>
                  <p className="text-xs text-[#66717D]">
                    Rental duration and financial output per registered car
                  </p>
                </div>
                <span className="text-xs text-[#66717D] font-bold">
                  {earningsSummary.vehicleBreakdown.length} Vehicles
                </span>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-label="Vehicle Utilization Breakdown table"
                className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-[#111820]"
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#66717D]/15 text-[#66717D] uppercase font-bold text-[10px]">
                      <th className="pb-3">Vehicle</th>
                      <th className="pb-3 text-center">Daily Rate</th>
                      <th className="pb-3 text-center">Total Trips</th>
                      <th className="pb-3 text-center">Days Rented</th>
                      <th className="pb-3 text-right">Completed Earnings</th>
                      <th className="pb-3 text-right">In Escrow</th>
                      <th className="pb-3 text-right">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#66717D]/10 font-medium">
                    {earningsSummary.vehicleBreakdown.map((v) => (
                      <tr key={v.carId} className="hover:bg-[#F5F2EB]/50 transition-colors">
                        <td className="py-3 pr-4 flex items-center gap-3">
                          <div className="w-10 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
                            <Image
                              src={v.featuredImage || DEMO_PHOTO_PRESETS[0].url}
                              alt={v.model}
                              fill
                              unoptimized={!isOptimizableImage(v.featuredImage || DEMO_PHOTO_PRESETS[0].url)}
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-[#111820] block">
                              {v.make} {v.model}
                            </span>
                            <span className="text-[10px] text-[#66717D]">{v.neighbourhood}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center font-specs-tabular">
                          {v.pricePerDay.toLocaleString()} ETB
                        </td>
                        <td className="py-3 text-center font-specs-tabular">{v.totalBookings}</td>
                        <td className="py-3 text-center font-specs-tabular">{v.daysRented}d</td>
                        <td className="py-3 text-right font-bold text-[#111820] font-specs-tabular">
                          {v.completedEarnings.toLocaleString()} ETB
                        </td>
                        <td className="py-3 text-right font-specs-tabular text-blue-900 font-semibold">
                          {v.pendingEscrow > 0 ? `${v.pendingEscrow.toLocaleString()} ETB` : '—'}
                        </td>
                        <td className="py-3 text-right">
                          {v.activeBooking ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[#66717D] text-[10px]">
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIMULATED PAYOUT LEDGER / TRANSACTION HISTORY */}
            <div className="p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#111820]">
                    TeleBirr Disbursement History
                  </h3>
                  <p className="text-xs text-[#66717D]">
                    Historical ledger of completed payouts credited to your account
                  </p>
                </div>
                <Badge variant="obsidian">TeleBirr Ledger</Badge>
              </div>

              {ownerBookings.filter((b) => b.paymentStatus === 'paid').length === 0 ? (
                <div className="p-8 text-center text-xs text-[#66717D]">
                  No completed disbursements yet. Once active rentals are completed, payouts are recorded here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#66717D]/15 text-[#66717D] uppercase font-bold text-[10px]">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Booking ID</th>
                        <th className="pb-3">Renter</th>
                        <th className="pb-3">Vehicle</th>
                        <th className="pb-3">TeleBirr Reference</th>
                        <th className="pb-3 text-right">Disbursed Amount</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#66717D]/10 font-medium">
                      {ownerBookings
                        .filter((b) => b.paymentStatus === 'paid')
                        .map((b) => {
                          const car = allCars.find((c) => c.id === b.carId);
                          const renter = getUserById(b.renterId);

                          return (
                            <tr key={b.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                              <td className="py-3 text-[#66717D]">{formatDisplayDate(b.updatedAt)}</td>
                              <td className="py-3 font-mono font-bold text-[#111820]">
                                #{b.id.toUpperCase()}
                              </td>
                              <td className="py-3">{renter ? renter.name : 'Sara Hailu'}</td>
                              <td className="py-3">
                                {car ? `${car.make} ${car.model}` : 'Vehicle'}
                              </td>
                              <td className="py-3 font-mono text-[11px] text-[#66717D]">
                                {b.paymentReference || 'TB-MOCK-ESCROW'}
                              </td>
                              <td className="py-3 text-right font-extrabold text-emerald-800 font-specs-tabular">
                                +{b.subtotal.toLocaleString()} ETB
                              </td>
                              <td className="py-3 text-right">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 font-bold text-[10px]">
                                  PAID
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GUEST REVIEWS & OWNER RESPONSES                   */}
        {/* ========================================================= */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#111820] tracking-tight">
                  Fleet Reviews &amp; Host Responses
                </h2>
                <p className="text-xs text-[#66717D] mt-0.5">
                  Read verified guest experiences and post official public host responses to maintain top-rated status.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-[#66717D]/15 text-xs font-bold text-[#111820]">
                  ⭐ {ownerReviews.length > 0 ? (ownerReviews.reduce((sum, r) => sum + r.rating, 0) / ownerReviews.length).toFixed(1) : '—'} Average Rating
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-white border border-[#66717D]/15 text-xs text-[#66717D]">
                  {ownerReviews.length} Total {ownerReviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>
            </div>

            {ownerReviews.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-[#66717D]/15 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                <span className="text-4xl">⭐</span>
                <h3 className="text-base font-bold text-[#111820]">No Reviews Yet</h3>
                <p className="text-xs text-[#66717D] max-w-md">
                  Once verified renters complete trips on your vehicles, their 1–5 star ratings and feedback will appear here for you to respond.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {ownerReviews.map((rev) => {
                  const car = allCars.find((c) => c.id === rev.carId);
                  const reviewer = getUserById(rev.renterId);
                  const reviewerName = reviewer ? reviewer.name : 'Verified Renter';

                  return (
                    <div
                      key={rev.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#66717D]/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#111820] text-white flex items-center justify-center font-bold text-xs">
                            {reviewerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#111820]">
                              {reviewerName}
                            </span>
                            <span className="text-[11px] text-[#66717D]">
                              {formatDisplayDate(rev.createdAt.split('T')[0])} • Booking #{rev.bookingId.slice(0, 8)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {car && (
                            <Link
                              href={`/cars/${car.id}`}
                              className="text-xs font-bold text-[#111820] hover:underline flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[15px]">directions_car</span>
                              <span>{car.year} {car.make} {car.model}</span>
                            </Link>
                          )}
                          <div className="flex items-center text-amber-500 text-xs">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <span key={i} className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            ))}
                            <span className="text-[#66717D] text-xs ml-1 font-specs-tabular">
                              {rev.rating}.0
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#111820] leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>

                      {/* Host Response Section */}
                      {rev.ownerReply ? (
                        <div className="mt-2 p-4 rounded-2xl bg-[#F5F2EB] border border-[#66717D]/12 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#111820] flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">forum</span>
                              <span>Your Public Host Response:</span>
                            </span>
                            {rev.ownerReplyAt && (
                              <span className="text-[10px] text-[#66717D]">
                                {formatDisplayDate(rev.ownerReplyAt.split('T')[0])}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#44474B] leading-relaxed">
                            {rev.ownerReply}
                          </p>
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setReviewToRespond(rev)}
                              className="text-xs font-bold text-[#111820] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              <span>Edit Response</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setReviewToRespond(rev)}
                            className="flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">reply</span>
                            <span>Respond to Review</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Container>

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW VEHICLE                                  */}
      {/* ========================================================= */}
      {isAddModalOpen && currentUser && session && (
        <VehicleFormModal
          mode="create"
          actor={{ userId: session.userId, role: session.activeRole }}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(car) => {
            triggerSheggerRevalidation('cars');
            mutateCars();
            setIsAddModalOpen(false);
            setFeedback({
              type: 'success',
              message: `Vehicle "${car.make} ${car.model}" successfully created! Status is "Pending Moderation" pending administrator review.`,
            });
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT VEHICLE LISTING                             */}
      {/* ========================================================= */}
      {editingCar && session && (
        <VehicleFormModal
          mode="edit"
          car={editingCar}
          actor={{ userId: session.userId, role: session.activeRole }}
          onClose={() => setEditingCar(null)}
          onSuccess={(car) => {
            triggerSheggerRevalidation('cars');
            mutateCars();
            setEditingCar(null);
            setFeedback({
              type: 'success',
              message: `Listing for "${car.make} ${car.model}" has been successfully updated.`,
            });
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 3: MANAGE BLACKOUT / UNAVAILABLE DATES             */}
      {/* ========================================================= */}
      {blackoutCar && session && (
        <BlackoutDatesModal
          car={blackoutCar}
          actor={{ userId: session.userId, role: session.activeRole }}
          todayStr={todayStr}
          onClose={() => setBlackoutCar(null)}
          onSuccess={(updatedCar) => {
            triggerSheggerRevalidation('cars');
            mutateCars();
            setBlackoutCar(null);
            setFeedback({
              type: 'success',
              message: `Blackout dates updated for ${updatedCar.make} ${updatedCar.model}. Conflicting calendar queries are now blocked.`,
            });
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CONFIRM REQUEST MODAL                            */}
      {/* ========================================================= */}
      {bookingToConfirm && (
        <div className="fixed inset-0 z-50 bg-[#111820]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col gap-5 border border-[#66717D]/18">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-[#D5F36A] flex items-center justify-center text-[#111820]" aria-hidden="true">
                <span className="material-symbols-outlined text-[24px]">task_alt</span>
              </span>
              <div>
                <h3 id="confirm-modal-title" className="text-lg font-extrabold text-[#111820]">Confirm Reservation</h3>
                <span className="text-xs text-[#66717D]">
                  Booking #{bookingToConfirm.id.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#66717D] leading-relaxed">
              Are you sure you want to approve this reservation? By confirming, the vehicle is reserved for the renter from{' '}
              <strong className="text-[#111820]">
                {formatDisplayDate(bookingToConfirm.startDate)}
              </strong>{' '}
              to{' '}
              <strong className="text-[#111820]">
                {formatDisplayDate(bookingToConfirm.endDate)}
              </strong>
              . The renter&apos;s TeleBirr escrow hold ({bookingToConfirm.total.toLocaleString()} ETB) remains locked in marketplace safety.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#66717D]/15">
              <button
                type="button"
                onClick={() => setBookingToConfirm(null)}
                className="py-2.5 px-4 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] hover:bg-[#F5F2EB] cursor-pointer"
              >
                Cancel
              </button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleExecuteConfirm(bookingToConfirm)}
              >
                Confirm &amp; Lock Dates
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: DECLINE REQUEST MODAL                            */}
      {/* ========================================================= */}
      {bookingToDecline && (
        <div className="fixed inset-0 z-50 bg-[#111820]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="decline-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col gap-5 border border-[#66717D]/18">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-red-100 flex items-center justify-center text-red-700" aria-hidden="true">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
              </span>
              <div>
                <h3 id="decline-modal-title" className="text-lg font-extrabold text-[#111820]">Decline Reservation</h3>
                <span className="text-xs text-[#66717D]">
                  Booking #{bookingToDecline.id.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#66717D] leading-relaxed">
              Declining this request will immediately release the held TeleBirr escrow ({bookingToDecline.total.toLocaleString()} ETB) and refund the renter in full.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">
                Decline Reason (Optional)
              </label>
              <select
                value={declineReasonInput}
                onChange={(e) => setDeclineReasonInput(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-[#66717D]/25 bg-white text-xs text-[#111820] mb-2"
              >
                <option value="Host unavailable for requested dates">Host unavailable for requested dates</option>
                <option value="Vehicle scheduled for routine maintenance">Vehicle scheduled for routine maintenance</option>
                <option value="Personal schedule conflict">Personal schedule conflict</option>
                <option value="Renter requested booking adjustment">Renter requested booking adjustment</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#66717D]/15">
              <button
                type="button"
                onClick={() => setBookingToDecline(null)}
                className="py-2.5 px-4 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] hover:bg-[#F5F2EB] cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecuteDecline}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Decline &amp; Refund Escrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: KEY HANDOVER (START TRIP) MODAL                  */}
      {/* ========================================================= */}
      {bookingToStart && (
        <div className="fixed inset-0 z-50 bg-[#111820]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="handover-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col gap-5 border border-[#66717D]/18">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-[#111820] flex items-center justify-center text-[#D5F36A]" aria-hidden="true">
                <span className="material-symbols-outlined text-[24px]">key</span>
              </span>
              <div>
                <h3 id="handover-modal-title" className="text-lg font-extrabold text-[#111820]">Confirm Key Handover</h3>
                <span className="text-xs text-[#66717D]">
                  Booking #{bookingToStart.id.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F5F2EB] text-xs text-[#111820] flex flex-col gap-2">
              <span className="font-bold">Handover Checklist:</span>
              <label className="flex items-center gap-2 text-[#66717D]">
                <input type="checkbox" defaultChecked className="rounded text-[#111820]" />
                <span>Verified renter driver license &amp; ID</span>
              </label>
              <label className="flex items-center gap-2 text-[#66717D]">
                <input type="checkbox" defaultChecked className="rounded text-[#111820]" />
                <span>Checked initial odometer &amp; fuel gauge</span>
              </label>
              <label className="flex items-center gap-2 text-[#66717D]">
                <input type="checkbox" defaultChecked className="rounded text-[#111820]" />
                <span>Walked around vehicle for physical condition</span>
              </label>
            </div>

            <p className="text-xs text-[#66717D] leading-relaxed">
              Confirming key handover activates this reservation on-road. The status will transition to{' '}
              <strong className="text-[#111820]">in_progress</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#66717D]/15">
              <button
                type="button"
                onClick={() => setBookingToStart(null)}
                className="py-2.5 px-4 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] hover:bg-[#F5F2EB] cursor-pointer"
              >
                Cancel
              </button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleExecuteStartTrip(bookingToStart)}
              >
                Confirm Handover &amp; Start Rental
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: COMPLETE RENTAL & DISBURSE PAYOUT MODAL          */}
      {/* ========================================================= */}
      {bookingToComplete && (
        <div className="fixed inset-0 z-50 bg-[#111820]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="complete-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col gap-5 border border-[#66717D]/18">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800" aria-hidden="true">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </span>
              <div>
                <h3 id="complete-modal-title" className="text-lg font-extrabold text-[#111820]">Complete Rental Return</h3>
                <span className="text-xs text-[#66717D]">
                  Booking #{bookingToComplete.id.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col gap-1.5">
              <span className="font-bold text-sm">TeleBirr Escrow Disbursement:</span>
              <span className="text-base font-extrabold text-emerald-900 font-specs-tabular">
                +{bookingToComplete.subtotal.toLocaleString()} ETB
              </span>
              <span className="text-[11px] text-emerald-800">
                Completing this rental triggers simulated disbursement directly to your host TeleBirr account.
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F5F2EB] text-xs text-[#111820] flex flex-col gap-2">
              <span className="font-bold">Return Checklist:</span>
              <label className="flex items-center gap-2 text-[#66717D]">
                <input type="checkbox" defaultChecked className="rounded text-[#111820]" />
                <span>Vehicle returned to agreed drop-off zone</span>
              </label>
              <label className="flex items-center gap-2 text-[#66717D]">
                <input type="checkbox" defaultChecked className="rounded text-[#111820]" />
                <span>Fuel level matches agreed pickup level</span>
              </label>
              <label className="flex items-center gap-2 text-[#66717D]">
                <input type="checkbox" defaultChecked className="rounded text-[#111820]" />
                <span>No new physical or interior damage detected</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#66717D]/15">
              <button
                type="button"
                onClick={() => setBookingToComplete(null)}
                className="py-2.5 px-4 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] hover:bg-[#F5F2EB] cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleExecuteCompleteTrip(bookingToComplete)}
                className="py-2.5 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Confirm Return &amp; Disburse Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: REPORT INCIDENT / DISPUTE MODAL                 */}
      {/* ========================================================= */}
      {bookingToDispute && (
        <div className="fixed inset-0 z-50 bg-[#111820]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="dispute-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col gap-5 border border-[#66717D]/18">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900" aria-hidden="true">
                <span className="material-symbols-outlined text-[24px]">report_problem</span>
              </span>
              <div>
                <h3 id="dispute-modal-title" className="text-lg font-extrabold text-[#111820]">Report Issue / Dispute</h3>
                <span className="text-xs text-[#66717D]">
                  Booking #{bookingToDispute.id.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#66717D] leading-relaxed">
              If an incident, late return, or damage occurred, opening a dispute freezes the mock escrow hold in safety until reviewed by a platform administrator.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">
                Description of Dispute <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe vehicle damage, fuel shortage, or delay details..."
                value={disputeReasonInput}
                onChange={(e) => setDisputeReasonInput(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-[#66717D]/25 text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#66717D]/15">
              <button
                type="button"
                onClick={() => setBookingToDispute(null)}
                className="py-2.5 px-4 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] hover:bg-[#F5F2EB] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDispute}
                className="py-2.5 px-5 rounded-xl bg-[#B9674B] hover:bg-[#A3553C] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 9: RESERVATION RECEIPT & DETAILS MODAL              */}
      {/* ========================================================= */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-[#111820]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 flex flex-col gap-5 border border-[#66717D]/18 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#66717D]/15">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#66717D]">
                  Reservation Record
                </span>
                <h3 id="receipt-modal-title" className="text-lg font-bold text-[#111820]">
                  #{selectedBookingDetails.id.toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingDetails(null)}
                aria-label="Close reservation record"
                className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Vehicle & Renter Snapshot */}
            {(() => {
              const car = allCars.find((c) => c.id === selectedBookingDetails.carId);
              const renter = getUserById(selectedBookingDetails.renterId);

              return (
                <div className="flex flex-col gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#F5F2EB] flex items-center gap-3">
                    <div className="w-16 h-12 rounded-xl overflow-hidden bg-white shrink-0 relative">
                      <Image
                        src={car?.featuredImage || DEMO_PHOTO_PRESETS[0].url}
                        alt="Car"
                        fill
                        unoptimized={!isOptimizableImage(car?.featuredImage || DEMO_PHOTO_PRESETS[0].url)}
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#111820] block">
                        {car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle'}
                      </span>
                      <span className="text-[#66717D]">
                        Guest: {renter ? renter.name : 'Sara Hailu'} • {car?.neighbourhood || 'Bole'}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#F5F2EB]">
                      <span className="text-[#66717D] block mb-0.5 font-bold">Pick-Up Date</span>
                      <span className="font-bold text-[#111820]">
                        {formatDisplayDate(selectedBookingDetails.startDate)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F2EB]">
                      <span className="text-[#66717D] block mb-0.5 font-bold">Return Date</span>
                      <span className="font-bold text-[#111820]">
                        {formatDisplayDate(selectedBookingDetails.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Snapshot */}
                  <div className="p-4 rounded-2xl bg-[#F5F2EB] flex flex-col gap-2">
                    <span className="font-bold text-[#111820]">Financial Snapshot</span>
                    <div className="flex justify-between text-[#66717D]">
                      <span>
                        Daily Rate ({selectedBookingDetails.pricePerDay.toLocaleString()} ETB × {selectedBookingDetails.days} days)
                      </span>
                      <span className="font-bold text-[#111820]">
                        {selectedBookingDetails.subtotal.toLocaleString()} ETB
                      </span>
                    </div>
                    <div className="flex justify-between text-[#66717D]">
                      <span>Platform Service Fee</span>
                      <span className="font-bold text-[#111820]">
                        {selectedBookingDetails.fee.toLocaleString()} ETB
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-[#111820] pt-2 border-t border-[#66717D]/15">
                      <span>Host Net Payout</span>
                      <span className="text-emerald-800">
                        {selectedBookingDetails.subtotal.toLocaleString()} ETB
                      </span>
                    </div>
                  </div>

                  {/* TeleBirr Rail */}
                  <div className="p-3.5 rounded-xl bg-[#111820] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#D5F36A]">smartphone</span>
                      <span className="text-white/80">TeleBirr Ref:</span>
                      <span className="font-mono font-bold text-[#D5F36A]">
                        {selectedBookingDetails.paymentReference || 'TB-MOCK-ESCROW'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-bold text-[#D5F36A]">
                      {selectedBookingDetails.paymentStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingDetails(null)}
                      className="py-2.5 px-5 rounded-xl bg-[#111820] text-white font-bold text-xs hover:bg-[#1C2630] transition-colors cursor-pointer"
                    >
                      Close Receipt
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 10: OWNER RESPONSE MODAL */}
      {reviewToRespond && session && (
        <OwnerResponseModal
          isOpen={Boolean(reviewToRespond)}
          review={reviewToRespond}
          session={session}
          renterName={getUserById(reviewToRespond.renterId)?.name}
          carName={allCars.find((c) => c.id === reviewToRespond.carId) ? `${allCars.find((c) => c.id === reviewToRespond.carId)?.year} ${allCars.find((c) => c.id === reviewToRespond.carId)?.make} ${allCars.find((c) => c.id === reviewToRespond.carId)?.model}` : undefined}
          onClose={() => setReviewToRespond(null)}
          onSuccess={() => {
            setReviewToRespond(null);
            setFeedback({
              type: 'success',
              message: 'Your official host response has been successfully posted to the vehicle listing!',
            });
          }}
        />
      )}
    </div>
  );
}

// =========================================================
// SUBCOMPONENT: VEHICLE FORM MODAL (Add & Edit)
// =========================================================

interface VehicleFormModalProps {
  mode: 'create' | 'edit';
  car?: Car;
  actor: { userId: string; role: UserRole };
  onClose: () => void;
  onSuccess: (car: Car) => void;
}

function VehicleFormModal({ mode, car, actor, onClose, onSuccess }: VehicleFormModalProps) {
  // Form State
  const [make, setMake] = useState(car?.make || '');
  const [model, setModel] = useState(car?.model || '');
  const [year, setYear] = useState<number>(car?.year || 2022);
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>(
    car?.transmission || 'Automatic'
  );
  const [seats, setSeats] = useState<number>(car?.seats || 5);
  const [fuelType, setFuelType] = useState<'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'>(
    car?.fuelType || 'Petrol'
  );
  const [neighbourhood, setNeighbourhood] = useState<string>(
    car?.neighbourhood || 'Bole'
  );
  const [pricePerDay, setPricePerDay] = useState<number>(car?.pricePerDay || 4500);
  const [description, setDescription] = useState(car?.description || '');
  const [features, setFeatures] = useState<string[]>(
    car?.features || ['Air Conditioning', 'Bluetooth & USB', 'Backup Camera']
  );
  const [selectedPhotoPreset, setSelectedPhotoPreset] = useState<string>(
    car?.photos?.[0] || DEMO_PHOTO_PRESETS[0].url
  );
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');

  // Field Errors & Status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle Feature Chip
  const toggleFeature = (feat: string) => {
    if (features.includes(feat)) {
      setFeatures(features.filter((f) => f !== feat));
    } else {
      setFeatures([...features, feat]);
    }
  };

  const activePhoto = customPhotoUrl.trim() || selectedPhotoPreset;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // Client-side validations
    const errs: Record<string, string> = {};
    if (!make.trim() || make.trim().length < 2) {
      errs.make = 'Make is required (min 2 characters).';
    }
    if (!model.trim() || model.trim().length < 1) {
      errs.model = 'Model is required.';
    }
    const currentYear = new Date().getFullYear();
    if (!year || year < 1995 || year > currentYear + 1) {
      errs.year = `Year must be between 1995 and ${currentYear + 1}.`;
    }
    if (!seats || seats < 2 || seats > 16) {
      errs.seats = 'Seating capacity must be between 2 and 16.';
    }
    if (!pricePerDay || pricePerDay < 500) {
      errs.pricePerDay = 'Daily rate must be at least 500 ETB.';
    }
    if (!description.trim() || description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }
    if (features.length === 0) {
      errs.features = 'Please select at least one feature.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const input: CreateCarListingInput = {
          make,
          model,
          year,
          transmission,
          seats,
          fuelType,
          neighbourhood,
          pricePerDay,
          description,
          features,
          photos: [activePhoto],
          featuredImage: activePhoto,
        };

        const res = createCarListing(actor, input);
        if (res.success && res.car) {
          onSuccess(res.car);
        } else {
          setServerError(res.error || 'Failed to create listing.');
        }
      } else if (mode === 'edit' && car) {
        const res = updateCarListing(car.id, actor, {
          make,
          model,
          year,
          transmission,
          seats,
          fuelType,
          neighbourhood,
          pricePerDay,
          description,
          features,
          photos: [activePhoto],
          featuredImage: activePhoto,
        });

        if (res.success && res.car) {
          onSuccess(res.car);
        } else {
          setServerError(res.error || 'Failed to update listing.');
        }
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111820]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-labelledby="vehicle-form-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 p-6 sm:p-8 flex flex-col gap-6 border border-[#66717D]/18 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-[#66717D]/15">
          <div>
            <Badge variant="obsidian" className="mb-1">
              {mode === 'create' ? 'New Fleet Entry' : 'Update Listing'}
            </Badge>
            <h2 id="vehicle-form-modal-title" className="text-xl sm:text-2xl font-extrabold text-[#111820]">
              {mode === 'create' ? 'List a Vehicle on Shegger Wheels' : `Edit ${car?.make} ${car?.model}`}
            </h2>
            <p className="text-xs text-[#66717D] mt-0.5">
              {mode === 'create'
                ? 'Your listing will start as "Pending Moderation" until verified by an administrator.'
                : 'Updates are saved immediately. Existing booking rates remain unaffected.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close vehicle form"
            className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">
                Make <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Toyota, Hyundai"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820] ${
                  errors.make ? 'border-red-400 bg-red-50/50' : 'border-[#66717D]/25 bg-white'
                }`}
              />
              {errors.make && <span className="text-[10px] text-red-600 mt-1 block">{errors.make}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. RAV4, Prado TXL"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820] ${
                  errors.model ? 'border-red-400 bg-red-50/50' : 'border-[#66717D]/25 bg-white'
                }`}
              />
              {errors.model && <span className="text-[10px] text-red-600 mt-1 block">{errors.model}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">
                Model Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1995"
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820] ${
                  errors.year ? 'border-red-400 bg-red-50/50' : 'border-[#66717D]/25 bg-white'
                }`}
              />
              {errors.year && <span className="text-[10px] text-red-600 mt-1 block">{errors.year}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as 'Automatic' | 'Manual')}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#66717D]/25 bg-white text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">Seats (Capacity)</label>
              <input
                type="number"
                min="2"
                max="16"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#66717D]/25 bg-white text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric')}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#66717D]/25 bg-white text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">
                Addis Ababa Neighbourhood <span className="text-red-500">*</span>
              </label>
              <select
                value={neighbourhood}
                onChange={(e) => setNeighbourhood(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#66717D]/25 bg-white text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
              >
                {ADDIS_NEIGHBOURHOODS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111820] mb-1">
                Daily Rate (ETB) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(Number(e.target.value))}
                  className={`w-full py-2.5 pl-3.5 pr-14 rounded-xl border text-xs text-[#111820] font-specs-tabular focus:outline-hidden focus:ring-2 focus:ring-[#111820] ${
                    errors.pricePerDay
                      ? 'border-red-400 bg-red-50/50'
                      : 'border-[#66717D]/25 bg-white'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#66717D]">
                  ETB
                </span>
              </div>
              {errors.pricePerDay && (
                <span className="text-[10px] text-red-600 mt-1 block">{errors.pricePerDay}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111820] mb-1">
              Vehicle Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe vehicle condition, features, cleanliness, and handover details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full py-2.5 px-3.5 rounded-xl border text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820] ${
                errors.description ? 'border-red-400 bg-red-50/50' : 'border-[#66717D]/25 bg-white'
              }`}
            />
            {errors.description && (
              <span className="text-[10px] text-red-600 mt-1 block">{errors.description}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111820] mb-1.5">
              Features &amp; Amenities <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VEHICLE_FEATURE_OPTIONS.map((feat) => {
                const isSelected = features.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleFeature(feat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#111820] text-[#D5F36A] font-bold shadow-xs'
                        : 'bg-[#F5F2EB] text-[#66717D] hover:bg-[#EBE8E1]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs inline-block align-middle mr-1">
                      {isSelected ? 'check' : 'add'}
                    </span>
                    <span>{feat}</span>
                  </button>
                );
              })}
            </div>
            {errors.features && (
              <span className="text-[10px] text-red-600 mt-1 block">{errors.features}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-xs font-bold text-[#111820]">
              Listing Photo <span className="text-red-500">*</span>
            </label>

            <span className="text-[11px] text-[#66717D]">
              Select from curated Addis Ababa demo models:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_PHOTO_PRESETS.map((preset) => {
                const isChosen =
                  !customPhotoUrl.trim() && selectedPhotoPreset === preset.url;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSelectedPhotoPreset(preset.url);
                      setCustomPhotoUrl('');
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 text-left transition-all p-1 group cursor-pointer ${
                      isChosen
                        ? 'border-[#111820] ring-2 ring-[#D5F36A]'
                        : 'border-transparent hover:border-[#66717D]/30'
                    }`}
                  >
                    <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-slate-100">
                      <Image
                        src={preset.url}
                        alt={preset.label}
                        fill
                        unoptimized={!isOptimizableImage(preset.url)}
                        className="object-cover"
                        sizes="140px"
                      />
                    </div>
                    <span className="block text-[10px] font-bold text-[#111820] truncate mt-1">
                      {preset.label.split('(')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2">
              <label className="block text-[11px] font-bold text-[#66717D] mb-1">
                Or enter custom image URL:
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-[#66717D]/25 text-xs text-[#111820] focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#F6F3EC] border border-[#66717D]/15 text-[11px] text-[#66717D] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
            <span>
              <strong>Security Protocol:</strong> Listing ownership is strictly bound to your
              verified account ({actor.userId}). Unapproved self-elevations are rejected by the
              data layer.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#66717D]/15">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Processing...'
                : mode === 'create'
                ? 'Submit Listing for Review'
                : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================
// SUBCOMPONENT: BLACKOUT DATES MODAL
// =========================================================

interface BlackoutDatesModalProps {
  car: Car;
  actor: { userId: string; role: UserRole };
  todayStr: string;
  onClose: () => void;
  onSuccess: (updatedCar: Car) => void;
}

function BlackoutDatesModal({
  car,
  actor,
  todayStr,
  onClose,
  onSuccess,
}: BlackoutDatesModalProps) {
  const [blackoutDates, setBlackoutDates] = useState<string[]>(car.unavailableDates || []);
  const [newDateInput, setNewDateInput] = useState<string>(todayStr);
  const [rangeEndDate, setRangeEndDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSingleDate = () => {
    setErrorMsg(null);
    if (!newDateInput) {
      setErrorMsg('Please select a date to block.');
      return;
    }
    if (newDateInput < todayStr) {
      setErrorMsg('Cannot block dates in the past.');
      return;
    }
    if (blackoutDates.includes(newDateInput)) {
      setErrorMsg(`Date ${newDateInput} is already in the blackout list.`);
      return;
    }

    setBlackoutDates([...blackoutDates, newDateInput].sort());
  };

  const handleAddRange = () => {
    setErrorMsg(null);
    if (!newDateInput || !rangeEndDate) {
      setErrorMsg('Both start and end dates are required for range blackout.');
      return;
    }
    if (rangeEndDate < newDateInput) {
      setErrorMsg('Range end date must be on or after start date.');
      return;
    }
    if (newDateInput < todayStr) {
      setErrorMsg('Range cannot start in the past.');
      return;
    }

    const start = new Date(newDateInput + 'T00:00:00');
    const end = new Date(rangeEndDate + 'T00:00:00');
    const datesToAdd: string[] = [];

    const cur = new Date(start);
    while (cur <= end) {
      datesToAdd.push(formatDateString(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const merged = Array.from(new Set([...blackoutDates, ...datesToAdd])).sort();
    setBlackoutDates(merged);
    setRangeEndDate('');
  };

  const handleRemoveDate = (d: string) => {
    setBlackoutDates(blackoutDates.filter((date) => date !== d));
  };

  const handleClearAll = () => {
    setBlackoutDates([]);
  };

  const handleSave = () => {
    setIsSaving(true);
    setErrorMsg(null);

    const res = updateCarBlackoutDates(car.id, actor, blackoutDates);
    if (res.success && res.car) {
      onSuccess(res.car);
    } else {
      setErrorMsg(res.error || 'Failed to persist blackout dates.');
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111820]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="blackout-dates-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 flex flex-col gap-6 border border-[#66717D]/18 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-3 border-b border-[#66717D]/15">
          <div>
            <Badge variant="obsidian" className="mb-1">
              Availability Manager
            </Badge>
            <h2 id="blackout-dates-modal-title" className="text-xl font-extrabold text-[#111820]">
              Manage Blackout Dates
            </h2>
            <p className="text-xs text-[#66717D] mt-0.5">
              {car.make} {car.model} • {car.neighbourhood}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close blackout dates dialog"
            className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F5F2EB] text-xs text-[#66717D] leading-relaxed">
          Dates marked as unavailable are immediately blocked on the booking calendar.
          Renters will not be able to select or submit booking requests spanning these dates.
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">warning</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#F6F3EC] border border-[#66717D]/15">
          <span className="text-xs font-bold text-[#111820]">Add Unavailable Dates</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#66717D] mb-1">
                Start / Single Date
              </label>
              <input
                type="date"
                min={todayStr}
                value={newDateInput}
                onChange={(e) => setNewDateInput(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-[#66717D]/25 bg-white text-xs text-[#111820] font-specs-tabular"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#66717D] mb-1">
                End Date (Optional Range)
              </label>
              <input
                type="date"
                min={newDateInput || todayStr}
                value={rangeEndDate}
                onChange={(e) => setRangeEndDate(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-[#66717D]/25 bg-white text-xs text-[#111820] font-specs-tabular"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddSingleDate}
              className="flex-1 py-2 px-3 rounded-xl bg-[#111820] text-white text-xs font-bold hover:bg-[#1C2630] transition-colors cursor-pointer"
            >
              + Add Single Date
            </button>
            {rangeEndDate && (
              <button
                type="button"
                onClick={handleAddRange}
                className="flex-1 py-2 px-3 rounded-xl bg-[#D5F36A] text-[#111820] text-xs font-bold hover:bg-[#CEEC64] transition-colors cursor-pointer"
              >
                + Block Date Range
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111820]">
              Currently Blocked Dates ({blackoutDates.length})
            </span>
            {blackoutDates.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-red-600 hover:underline font-bold cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {blackoutDates.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-[#66717D]/30 text-center text-xs text-[#66717D]">
              No blackout dates set. This vehicle is available for all eligible dates.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {blackoutDates.map((d) => (
                <div
                  key={d}
                  className="p-2.5 rounded-xl bg-[#F5F2EB] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-[#66717D]">event</span>
                    <span className="font-bold text-[#111820] font-specs-tabular">{d}</span>
                    <span className="text-[#66717D] text-[11px]">
                      ({formatDisplayDate(d)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(d)}
                    className="p-1 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Remove</span>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#66717D]/15">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Availability Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
