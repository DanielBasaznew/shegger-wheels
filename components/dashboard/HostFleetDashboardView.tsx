'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Car, CarStatus, User, UserRole, DemoSession } from '@/lib/types';
import { getCars, getUserById, getCurrentSession } from '@/lib/storage';
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
import { formatDisplayDate, formatDateString } from '@/lib/bookings';
import { switchActiveRole } from '@/lib/auth';
import { SEED_CARS, SEED_USERS } from '@/lib/seeds';

// Storage subscription for reactive live updates across same-window actions
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

function getServerCarsSnapshot(): Car[] {
  return SEED_CARS;
}

function getServerSessionSnapshot(): DemoSession | null {
  return null;
}


export function HostFleetDashboardView() {
  // Live reactive data from browser storage
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

  // Fleet summary metrics
  const metrics = useMemo(() => {
    return {
      total: ownerCars.length,
      approved: ownerCars.filter((c) => c.status === 'approved').length,
      pending: ownerCars.filter((c) => c.status === 'pending').length,
      inactive: ownerCars.filter((c) => c.status === 'inactive').length,
      rejected: ownerCars.filter((c) => c.status === 'rejected').length,
    };
  }, [ownerCars]);


  // UI Filter & Search state
  const [statusFilter, setStatusFilter] = useState<'all' | CarStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [blackoutCar, setBlackoutCar] = useState<Car | null>(null);

  // Action feedback alert
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Filtered cars based on tab & search
  const filteredCars = useMemo(() => {
    return ownerCars.filter((car) => {
      if (statusFilter !== 'all' && car.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = `${car.year} ${car.make} ${car.model}`.toLowerCase().includes(query);
        const matchesNeighbourhood = car.neighbourhood.toLowerCase().includes(query);
        const matchesTransmission = car.transmission.toLowerCase().includes(query);
        return matchesName || matchesNeighbourhood || matchesTransmission;
      }
      return true;
    });
  }, [ownerCars, statusFilter, searchQuery]);

  // Toggle active / paused listing
  const handleToggleActive = (car: Car) => {
    if (!session || !currentUser) return;

    const res = toggleCarListingActive(car.id, {
      userId: session.userId,
      role: session.activeRole,
    });

    if (res.success && res.car) {
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

  const todayStr = formatDateString(new Date());

  return (
    <div className="w-full min-h-screen bg-[#F5F2EB] py-8 sm:py-12">
      <Container className="flex flex-col gap-8">
        {/* ========================================================= */}
        {/* TOP BAR / WELCOME BANNER                                 */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">🚘</span>
              <Badge variant="obsidian">Host Fleet Portal</Badge>
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
              Manage Your Vehicle Fleet
            </h1>
            <p className="text-sm text-[#66717D] leading-relaxed">
              Create and manage car listings in Addis Ababa, review admin moderation status,
              and maintain your vehicle blackout dates to keep your calendar accurate.
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
              <span>Add New Vehicle</span>
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

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : feedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>{feedback.type === 'success' ? '✅' : feedback.type === 'error' ? '⚠️' : 'ℹ️'}</span>
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* FLEET METRICS CARDS (Urban Motion KPI Bar)                */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Fleet */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
              <span>Total Fleet</span>
              <span className="p-1.5 rounded-xl bg-[#F5F2EB] text-sm">🚗</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#111820]">
              {metrics.total}
            </div>
            <div className="text-xs text-[#66717D] mt-2">
              {metrics.total === 1 ? '1 vehicle registered' : `${metrics.total} vehicles registered`}
            </div>
          </div>

          {/* 2. Active & Approved */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#D5F36A]" />
            <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
              <span>Active / Live</span>
              <span className="p-1.5 rounded-xl bg-[#D5F36A]/20 text-[#111820] text-sm">🟢</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#111820]">
              {metrics.approved}
            </div>
            <div className="text-xs text-emerald-800 font-semibold mt-2 flex items-center gap-1">
              <span>Accepting guest bookings</span>
            </div>
          </div>

          {/* 3. Pending Review */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-400" />
            <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
              <span>Pending Review</span>
              <span className="p-1.5 rounded-xl bg-amber-100 text-amber-900 text-sm">⏳</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#111820]">
              {metrics.pending}
            </div>
            <div className="text-xs text-amber-900 font-medium mt-2">
              Awaiting admin moderation
            </div>
          </div>

          {/* 4. Paused / Inactive */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#66717D] font-bold uppercase tracking-wider mb-2">
              <span>Paused / Inactive</span>
              <span className="p-1.5 rounded-xl bg-[#F5F2EB] text-[#66717D] text-sm">⏸️</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#111820]">
              {metrics.inactive}
            </div>
            <div className="text-xs text-[#66717D] mt-2">
              {metrics.rejected > 0 ? `${metrics.rejected} rejected by moderation` : 'Hidden from search'}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONTROLS: TABS & SEARCH                                   */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-[#66717D]/15 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#111820] text-white shadow-xs'
                  : 'text-[#66717D] hover:text-[#111820]'
              }`}
            >
              All Listings ({ownerCars.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-[#111820] text-white shadow-xs'
                  : 'text-[#66717D] hover:text-[#111820]'
              }`}
            >
              Active ({metrics.approved})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-[#111820] text-white shadow-xs'
                  : 'text-[#66717D] hover:text-[#111820]'
              }`}
            >
              Pending ({metrics.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-[#111820] text-white shadow-xs'
                  : 'text-[#66717D] hover:text-[#111820]'
              }`}
            >
              Paused ({metrics.inactive})
            </button>
            {metrics.rejected > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                  statusFilter === 'rejected'
                    ? 'bg-[#B9674B] text-white shadow-xs'
                    : 'text-[#B9674B] hover:bg-red-50'
                }`}
              >
                Rejected ({metrics.rejected})
              </button>
            )}
          </div>

          {/* Search Field */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search by make, model, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-9 pr-4 rounded-2xl bg-white border border-[#66717D]/18 text-xs text-[#111820] placeholder-[#66717D]/60 focus:outline-hidden focus:ring-2 focus:ring-[#111820]"
            />
            <span className="absolute left-3 top-3 text-xs text-[#66717D]">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[#66717D] hover:text-[#111820] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* VEHICLE FLEET LISTINGS GRID                               */}
        {/* ========================================================= */}
        {ownerCars.length === 0 ? (
          /* EMPTY STATE: ZERO CARS LISTED */
          <div className="p-12 sm:p-16 rounded-3xl bg-white border border-[#66717D]/15 text-center flex flex-col items-center max-w-xl mx-auto my-6 shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-[#F5F2EB] flex items-center justify-center text-4xl mb-4">
              🚗
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
          /* EMPTY STATE: NO MATCH FOR FILTER */
          <div className="p-10 rounded-3xl bg-white border border-[#66717D]/15 text-center flex flex-col items-center gap-3">
            <span className="text-3xl">🔍</span>
            <h3 className="text-lg font-bold text-[#111820]">No vehicles match your filter</h3>
            <p className="text-xs text-[#66717D]">
              Try resetting your search query or switching to another status tab.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          /* VEHICLES GRID */
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
                      unoptimized
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Top Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      {/* Status Pill */}
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
                          <span>⏸️ Paused</span>
                        </span>
                      )}
                      {car.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B9674B]/90 text-white text-xs font-bold backdrop-blur-xs shadow-sm">
                          <span>✕ Rejected</span>
                        </span>
                      )}

                      {/* Daily Rate Pill */}
                      <span className="px-3 py-1 rounded-full bg-[#111820]/80 text-[#D5F36A] text-xs font-bold font-specs-tabular backdrop-blur-xs shadow-sm">
                        {car.pricePerDay.toLocaleString()} ETB/day
                      </span>
                    </div>

                    {/* Bottom Area Pill */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs">
                        <span>📍</span>
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

                    {/* Status Notice / Advisory */}
                    {car.status === 'pending' && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-tight">
                        <strong>Review in Progress:</strong> Platform admins verify vehicle specs
                        before public listing.
                      </div>
                    )}
                    {car.status === 'rejected' && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-[11px] leading-tight">
                        <strong>Listing Rejected:</strong> Edit details to meet platform standards
                        or contact admin.
                      </div>
                    )}
                    {car.status === 'inactive' && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] leading-tight">
                        <strong>Listing Paused:</strong> Hidden from guest searches. Click Activate
                        to resume bookings.
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-[#66717D]/12 flex flex-col gap-2 mt-auto">
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingCar(car)}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          ✏️ Edit Details
                        </button>

                        {/* Blackout Dates Button */}
                        <button
                          type="button"
                          onClick={() => setBlackoutCar(car)}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] text-xs font-bold transition-colors cursor-pointer text-center"
                          title="Set Unavailable / Blackout Dates"
                        >
                          📅 Blackout Dates
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Pause / Resume Button */}
                        {car.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(car)}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            ⏸️ Pause Listing
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

                        {/* Public View Link */}
                        <Link
                          href={`/cars/${car.id}`}
                          className="py-2 px-3 rounded-xl border border-[#66717D]/25 hover:border-[#111820] text-[#111820] text-xs font-bold transition-colors text-center shrink-0"
                          title="Preview public car detail page"
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
            setBlackoutCar(null);
            setFeedback({
              type: 'success',
              message: `Blackout dates updated for ${updatedCar.make} ${updatedCar.model}. Conflicting calendar queries are now blocked.`,
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 p-6 sm:p-8 flex flex-col gap-6 border border-[#66717D]/18 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#66717D]/15">
          <div>
            <Badge variant="obsidian" className="mb-1">
              {mode === 'create' ? 'New Fleet Entry' : 'Update Listing'}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111820]">
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
            className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* SECTION 1: Make, Model, Year */}
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

          {/* SECTION 2: Transmission, Seats, Fuel */}
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

          {/* SECTION 3: Location & Daily Price */}
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

          {/* SECTION 4: Description */}
          <div>
            <label className="block text-xs font-bold text-[#111820] mb-1">
              Vehicle Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe condition, ideal trip types, handover instructions, and cleanliness guidelines..."
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

          {/* SECTION 5: Vehicle Features Multi-Select */}
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
                    {isSelected ? '✓ ' : '+ '}
                    {feat}
                  </button>
                );
              })}
            </div>
            {errors.features && (
              <span className="text-[10px] text-red-600 mt-1 block">{errors.features}</span>
            )}
          </div>

          {/* SECTION 6: Curated Photo Presets & Custom URL */}
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-bold text-[#111820]">
              Listing Photo <span className="text-red-500">*</span>
            </label>

            {/* Presets Grid */}
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
                        unoptimized
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

            {/* Or custom URL */}
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

          {/* Security & Moderation Notice */}
          <div className="p-3 rounded-2xl bg-[#F6F3EC] border border-[#66717D]/15 text-[11px] text-[#66717D] flex items-center gap-2">
            <span>🛡️</span>
            <span>
              <strong>Security Protocol:</strong> Listing ownership is strictly bound to your
              verified account ({actor.userId}). Unapproved self-elevations are rejected by the
              data layer.
            </span>
          </div>

          {/* Action Buttons */}
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

  // Add single date
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

  // Add date range (convenience for hosts)
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

  // Remove single date
  const handleRemoveDate = (d: string) => {
    setBlackoutDates(blackoutDates.filter((date) => date !== d));
  };

  // Clear all blackout dates
  const handleClearAll = () => {
    setBlackoutDates([]);
  };

  // Save changes
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 flex flex-col gap-6 border border-[#66717D]/18 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#66717D]/15">
          <div>
            <Badge variant="obsidian" className="mb-1">
              Availability Manager
            </Badge>
            <h2 className="text-xl font-extrabold text-[#111820]">
              Manage Blackout Dates
            </h2>
            <p className="text-xs text-[#66717D] mt-0.5">
              {car.make} {car.model} • {car.neighbourhood}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Advisory Box */}
        <div className="p-3.5 rounded-2xl bg-[#F5F2EB] text-xs text-[#66717D] leading-relaxed">
          Dates marked as unavailable are immediately blocked on the booking calendar.
          Renters will not be able to select or submit booking requests spanning these dates.
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Date Selector Section */}
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
                placeholder="Range end date"
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

        {/* Existing Blackout Dates List */}
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
                    <span className="text-sm">🗓️</span>
                    <span className="font-bold text-[#111820] font-specs-tabular">{d}</span>
                    <span className="text-[#66717D] text-[11px]">
                      ({formatDisplayDate(d)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(d)}
                    className="p-1 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                    title="Remove date from blackout list"
                  >
                    Remove ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
