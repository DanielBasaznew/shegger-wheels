'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Car,
  CarStatus,
  User,
  DemoSession,
} from '@/lib/types';
import { SEED_CARS, SEED_USERS } from '@/lib/seeds';
import { getUserById } from '@/lib/storage';
import {
  moderateCarListing,
  getAdminModerationMetrics,
  ADDIS_NEIGHBOURHOODS,
} from '@/lib/fleet';

// ==========================================
// SSR-Safe Storage Synchronizers
// ==========================================

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

let cachedUsersRaw = '';
let cachedUsers: User[] = SEED_USERS;

function getUsersSnapshot(): User[] {
  if (typeof window === 'undefined') return SEED_USERS;
  try {
    const raw = window.localStorage.getItem('sw_users_v1') || '';
    if (raw !== cachedUsersRaw) {
      cachedUsersRaw = raw;
      const loaded = raw ? JSON.parse(raw) : [];
      cachedUsers = Array.isArray(loaded) && loaded.length > 0 ? loaded : SEED_USERS;
    }
    return cachedUsers;
  } catch {
    return SEED_USERS;
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
function getServerUsersSnapshot(): User[] {
  return SEED_USERS;
}
function getServerSessionSnapshot(): DemoSession | null {
  return null;
}

// Preset administrative rejection reasons
const PRESET_REJECTION_REASONS = [
  'Photos are low resolution, blurry, or do not clearly show vehicle condition.',
  'Daily rental rate is outside realistic market standards for this vehicle category.',
  'Vehicle specifications or description are incomplete or inconsistent.',
  'Vehicle age or safety features do not meet municipal charter compliance.',
  'Owner contact information or proof of vehicle ownership documentation is missing.',
];

export function AdminModerationDashboardView() {
  const cars = useSyncExternalStore(subscribeToStorage, getCarsSnapshot, getServerCarsSnapshot);
  const users = useSyncExternalStore(subscribeToStorage, getUsersSnapshot, getServerUsersSnapshot);
  const session = useSyncExternalStore(subscribeToStorage, getSessionSnapshot, getServerSessionSnapshot);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CarStatus>('pending');
  const [neighbourhoodFilter, setNeighbourhoodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');

  // Modals state
  const [inspectingCar, setInspectingCar] = useState<Car | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [carToApprove, setCarToApprove] = useState<Car | null>(null);
  const [carToReject, setCarToReject] = useState<Car | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  // Operational feedback banner
  const [alertNotice, setAlertNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Compute metrics
  const metrics = useMemo(() => getAdminModerationMetrics(cars), [cars]);

  // Current admin user info
  const currentAdminUser = useMemo(() => {
    if (!session) return null;
    return users.find((u) => u.id === session.userId) || getUserById(session.userId) || null;
  }, [session, users]);

  // Filtered & sorted cars
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && car.status !== statusFilter) {
        return false;
      }

      // 2. Neighbourhood Filter
      if (neighbourhoodFilter !== 'all' && car.neighbourhood !== neighbourhoodFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const owner = users.find((u) => u.id === car.ownerId);
        const ownerName = owner?.name.toLowerCase() || '';
        const ownerEmail = owner?.email.toLowerCase() || '';
        const carName = `${car.make} ${car.model}`.toLowerCase();
        const year = String(car.year);
        const hood = car.neighbourhood.toLowerCase();

        const match =
          carName.includes(q) ||
          year.includes(q) ||
          hood.includes(q) ||
          ownerName.includes(q) ||
          ownerEmail.includes(q);

        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'price_asc') {
        return a.pricePerDay - b.pricePerDay;
      }
      if (sortBy === 'price_desc') {
        return b.pricePerDay - a.pricePerDay;
      }
      return 0;
    });
  }, [cars, users, statusFilter, neighbourhoodFilter, searchQuery, sortBy]);

  // Execute approval
  const handleApprove = (car: Car) => {
    if (!session) {
      setAlertNotice({ type: 'error', message: 'You must be signed in as an administrator.' });
      return;
    }

    const res = moderateCarListing(
      car.id,
      { userId: session.userId, role: 'admin' },
      { action: 'approve' }
    );

    if (res.success && res.car) {
      setAlertNotice({
        type: 'success',
        message: `Listing for ${res.car.make} ${res.car.model} (${res.car.year}) approved and published to the public catalogue!`,
      });
      setCarToApprove(null);
      if (inspectingCar?.id === car.id) {
        setInspectingCar(res.car);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } else {
      setAlertNotice({
        type: 'error',
        message: res.error || 'Failed to approve vehicle listing.',
      });
    }
  };

  // Execute rejection
  const handleReject = () => {
    if (!carToReject) return;
    if (!session) {
      setRejectionError('Administrator session required.');
      return;
    }

    if (!rejectionReasonText.trim() || rejectionReasonText.trim().length < 5) {
      setRejectionError('A rejection reason of at least 5 characters is mandatory.');
      return;
    }

    const res = moderateCarListing(
      carToReject.id,
      { userId: session.userId, role: 'admin' },
      { action: 'reject', reason: rejectionReasonText.trim() }
    );

    if (res.success && res.car) {
      setAlertNotice({
        type: 'success',
        message: `Listing for ${res.car.make} ${res.car.model} rejected. The owner will see your feedback, and the vehicle is hidden from the catalogue.`,
      });
      setCarToReject(null);
      setRejectionReasonText('');
      setRejectionError('');
      if (inspectingCar?.id === carToReject.id) {
        setInspectingCar(res.car);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } else {
      setRejectionError(res.error || 'Failed to reject vehicle listing.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F2EB] py-8 text-[#111820]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        
        {/* ========================================================= */}
        {/* Admin Header & Governance Badge */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 bg-white rounded-3xl border border-[#66717D]/18 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#111820] flex items-center justify-center text-2xl shadow-inner text-white">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111820]">
                  Admin Moderation Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F36A] text-[#111820] border border-[#111820]/15">
                  Governance &amp; Audit
                </span>
              </div>
              <p className="text-sm text-[#66717D] mt-1">
                Signed in as <strong className="text-[#111820]">{currentAdminUser?.name || 'Administrator'}</strong> ({currentAdminUser?.email || 'admin@sheggerwheels.et'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cars"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#111820] border border-[#66717D]/25 hover:border-[#111820] hover:bg-[#F5F2EB]/50 transition shadow-xs"
            >
              <span>Inspect Public Catalogue</span>
              <span className="text-xs">↗</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#111820] text-white hover:bg-[#111820]/90 transition shadow-xs"
            >
              <span>← Dashboard Hub</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Feedback Alert Notice */}
        {/* ========================================================= */}
        {alertNotice && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top duration-200 ${
              alertNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg">
                {alertNotice.type === 'success' ? '✓' : '⚠️'}
              </span>
              <p className="text-sm font-medium">{alertNotice.message}</p>
            </div>
            <button
              onClick={() => setAlertNotice(null)}
              className="text-xs font-bold hover:underline opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* Summary KPI Cards */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Pending Review (Action Required) */}
          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
              statusFilter === 'pending'
                ? 'bg-[#111820] text-white border-[#111820] shadow-md ring-2 ring-[#D5F36A]'
                : 'bg-white text-[#111820] border-[#66717D]/18 hover:border-[#111820]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#66717D]">
                Pending Review
              </span>
              {metrics.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D5F36A] text-[#111820] animate-pulse">
                  Action Req.
                </span>
              )}
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black">{metrics.pending}</span>
              <span className="text-xs opacity-70">Awaiting audit</span>
            </div>
          </button>

          {/* Approved & Live */}
          <button
            onClick={() => setStatusFilter('approved')}
            className={`p-5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
              statusFilter === 'approved'
                ? 'bg-[#111820] text-white border-[#111820] shadow-md ring-2 ring-emerald-400'
                : 'bg-white text-[#111820] border-[#66717D]/18 hover:border-[#111820]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#66717D]">
                Approved &amp; Live
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600">{metrics.approved}</span>
              <span className="text-xs opacity-70">In catalogue</span>
            </div>
          </button>

          {/* Rejected Listings */}
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`p-5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
              statusFilter === 'rejected'
                ? 'bg-[#111820] text-white border-[#111820] shadow-md ring-2 ring-rose-400'
                : 'bg-white text-[#111820] border-[#66717D]/18 hover:border-[#111820]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#66717D]">
                Rejected
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-rose-600">{metrics.rejected}</span>
              <span className="text-xs opacity-70">Restricted</span>
            </div>
          </button>

          {/* Inactive / Maintenance */}
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`p-5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
              statusFilter === 'inactive'
                ? 'bg-[#111820] text-white border-[#111820] shadow-md ring-2 ring-slate-400'
                : 'bg-white text-[#111820] border-[#66717D]/18 hover:border-[#111820]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#66717D]">
                Paused / Inactive
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-700">{metrics.inactive}</span>
              <span className="text-xs opacity-70">Host paused</span>
            </div>
          </button>

          {/* Total Fleet */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`col-span-2 lg:col-span-1 p-5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
              statusFilter === 'all'
                ? 'bg-[#111820] text-white border-[#111820] shadow-md ring-2 ring-[#D5F36A]'
                : 'bg-white text-[#111820] border-[#66717D]/18 hover:border-[#111820]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#66717D]">
                Total Fleet
              </span>
              <span className="text-sm">🚗</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black">{metrics.total}</span>
              <span className="text-xs opacity-70">All vehicles</span>
            </div>
          </button>
        </div>

        {/* ========================================================= */}
        {/* Search, Filter Tabs & Sort Controls */}
        {/* ========================================================= */}
        <div className="p-6 bg-white rounded-3xl border border-[#66717D]/18 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F5F2EB] rounded-2xl overflow-x-auto">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                <span>⚡ Pending Review</span>
                {metrics.pending > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#D5F36A] text-[#111820]">
                    {metrics.pending}
                  </span>
                )}
              </button>

              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'approved'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                <span>✓ Approved &amp; Live</span>
                <span className="text-[10px] opacity-75">({metrics.approved})</span>
              </button>

              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'rejected'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                <span>✕ Rejected</span>
                <span className="text-[10px] opacity-75">({metrics.rejected})</span>
              </button>

              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'inactive'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                <span>⏸ Inactive</span>
                <span className="text-[10px] opacity-75">({metrics.inactive})</span>
              </button>

              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'all'
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#66717D] hover:text-[#111820]'
                }`}
              >
                <span>All Listings ({metrics.total})</span>
              </button>
            </div>

            {/* Neighbourhood & Sort Selectors */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <select
                value={neighbourhoodFilter}
                onChange={(e) => setNeighbourhoodFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-[#F5F2EB] text-[#111820] border border-transparent focus:border-[#111820] focus:outline-none transition cursor-pointer"
              >
                <option value="all">All Neighbourhoods</option>
                {ADDIS_NEIGHBOURHOODS.map((hood) => (
                  <option key={hood} value={hood}>
                    {hood}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'newest' | 'oldest' | 'price_asc' | 'price_desc'
                  )
                }
                className="px-3 py-2 rounded-xl text-xs font-medium bg-[#F5F2EB] text-[#111820] border border-transparent focus:border-[#111820] focus:outline-none transition cursor-pointer"
              >
                <option value="newest">Sort: Newest Submission</option>
                <option value="oldest">Sort: Oldest Submission</option>
                <option value="price_asc">Sort: Price (Low → High)</option>
                <option value="price_desc">Sort: Price (High → Low)</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#66717D]">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by make, model, year, neighbourhood, or host name/email..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F5F2EB]/60 border border-[#66717D]/20 text-sm text-[#111820] placeholder-[#66717D] focus:outline-none focus:ring-2 focus:ring-[#111820] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#66717D] hover:text-[#111820]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* Moderation Queue / Listings Grid & Table */}
        {/* ========================================================= */}
        {filteredCars.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-[#66717D]/18 text-center flex flex-col items-center gap-3">
            <span className="text-4xl">📋</span>
            <h3 className="text-lg font-bold text-[#111820]">
              No vehicle listings found
            </h3>
            <p className="text-sm text-[#66717D] max-w-md">
              {statusFilter === 'pending'
                ? 'All vehicle submissions have been moderated. There are no pending requests currently waiting in the queue.'
                : 'No vehicles match the selected status, neighbourhood, or search filters.'}
            </p>
            {(searchQuery || neighbourhoodFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setNeighbourhoodFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-2 text-xs font-bold text-[#111820] underline underline-offset-4 hover:opacity-80"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-3xl border border-[#66717D]/18 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#66717D]/12 bg-[#F5F2EB]/50 text-[11px] font-bold uppercase tracking-wider text-[#66717D]">
                    <th className="py-4 px-6">Vehicle &amp; Specs</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-4">Rate / Day</th>
                    <th className="py-4 px-4">Owner Profile</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#66717D]/10 text-sm">
                  {filteredCars.map((car) => {
                    const owner = users.find((u) => u.id === car.ownerId);
                    return (
                      <tr
                        key={car.id}
                        className="hover:bg-[#F5F2EB]/30 transition group"
                      >
                        {/* Vehicle Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-[#66717D]/15">
                              {car.photos && car.photos[0] ? (
                                <Image
                                  src={car.photos[0]}
                                  alt={`${car.make} ${car.model}`}
                                  fill
                                  sizes="64px"
                                  className="object-cover group-hover:scale-105 transition duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                  🚗
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[#111820] flex items-center gap-1.5">
                                <span>{car.make} {car.model}</span>
                                <span className="text-xs font-normal text-[#66717D]">({car.year})</span>
                              </div>
                              <div className="text-xs text-[#66717D] mt-0.5 flex items-center gap-2">
                                <span>{car.transmission}</span>
                                <span>•</span>
                                <span>{car.seats} Seats</span>
                                <span>•</span>
                                <span>{car.fuelType || 'Petrol'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F5F2EB] text-[#111820] border border-[#66717D]/15">
                            📍 {car.neighbourhood}
                          </span>
                        </td>

                        {/* Rate */}
                        <td className="py-4 px-4">
                          <div className="font-black text-[#111820]">
                            {car.pricePerDay.toLocaleString()} ETB
                          </div>
                          <span className="text-[11px] text-[#66717D]">per 24h</span>
                        </td>

                        {/* Owner Profile */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#111820] text-white flex items-center justify-center text-xs font-bold">
                              {owner?.name.charAt(0) || 'H'}
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-[#111820]">
                                {owner?.name || 'Verified Host'}
                              </div>
                              <div className="text-[11px] text-[#66717D]">
                                {owner?.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          {car.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F36A] text-[#111820] border border-[#111820]/15">
                              ⚡ Pending Review
                            </span>
                          )}
                          {car.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              ✓ Approved &amp; Live
                            </span>
                          )}
                          {car.status === 'rejected' && (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 w-fit">
                                ✕ Rejected
                              </span>
                              {car.rejectionReason && (
                                <span className="text-[10px] text-rose-700 italic max-w-xs truncate" title={car.rejectionReason}>
                                  Reason: {car.rejectionReason}
                                </span>
                              )}
                            </div>
                          )}
                          {car.status === 'inactive' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                              ⏸ Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setInspectingCar(car);
                                setActivePhotoIndex(0);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5F2EB] text-[#111820] hover:bg-[#111820] hover:text-white transition cursor-pointer"
                            >
                              Inspect Details
                            </button>

                            {/* Approve CTA */}
                            {car.status !== 'approved' && (
                              <button
                                onClick={() => setCarToApprove(car)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                              >
                                Approve
                              </button>
                            )}

                            {/* Reject CTA */}
                            {car.status !== 'rejected' && (
                              <button
                                onClick={() => {
                                  setCarToReject(car);
                                  setRejectionReasonText('');
                                  setRejectionError('');
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#B9674B] text-white hover:bg-[#B9674B]/90 transition cursor-pointer shadow-xs"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
              {filteredCars.map((car) => {
                const owner = users.find((u) => u.id === car.ownerId);
                return (
                  <div
                    key={car.id}
                    className="p-5 bg-white rounded-3xl border border-[#66717D]/18 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Image & Status Badge */}
                      <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-[#66717D]/15 mb-3">
                        {car.photos && car.photos[0] ? (
                          <Image
                            src={car.photos[0]}
                            alt={`${car.make} ${car.model}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            🚗
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          {car.status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F36A] text-[#111820] shadow-sm">
                              ⚡ Pending
                            </span>
                          )}
                          {car.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm">
                              ✓ Approved
                            </span>
                          )}
                          {car.status === 'rejected' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 shadow-sm">
                              ✕ Rejected
                            </span>
                          )}
                          {car.status === 'inactive' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-sm">
                              ⏸ Inactive
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-[#111820]/80 backdrop-blur-xs text-white text-xs font-black">
                          {car.pricePerDay.toLocaleString()} ETB/day
                        </div>
                      </div>

                      {/* Title & Info */}
                      <h3 className="font-bold text-base text-[#111820]">
                        {car.make} {car.model} ({car.year})
                      </h3>
                      <div className="text-xs text-[#66717D] mt-1 flex items-center gap-2 flex-wrap">
                        <span>📍 {car.neighbourhood}</span>
                        <span>•</span>
                        <span>{car.transmission}</span>
                        <span>•</span>
                        <span>{car.seats} Seats</span>
                      </div>

                      {/* Owner details */}
                      <div className="mt-3 p-2.5 rounded-xl bg-[#F5F2EB]/50 border border-[#66717D]/10 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#111820] text-white flex items-center justify-center text-[10px] font-bold">
                          {owner?.name.charAt(0) || 'H'}
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-[#111820]">{owner?.name || 'Verified Host'}</span>
                          <span className="text-[#66717D] ml-1.5">({owner?.phone || 'No phone'})</span>
                        </div>
                      </div>

                      {car.status === 'rejected' && car.rejectionReason && (
                        <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                          <strong>Rejection reason:</strong> {car.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#66717D]/12">
                      <button
                        onClick={() => {
                          setInspectingCar(car);
                          setActivePhotoIndex(0);
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#F5F2EB] text-[#111820] hover:bg-[#111820] hover:text-white transition text-center"
                      >
                        Inspect
                      </button>

                      {car.status !== 'approved' && (
                        <button
                          onClick={() => setCarToApprove(car)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition text-center"
                        >
                          Approve
                        </button>
                      )}

                      {car.status !== 'rejected' && (
                        <button
                          onClick={() => {
                            setCarToReject(car);
                            setRejectionReasonText('');
                            setRejectionError('');
                          }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#B9674B] text-white hover:bg-[#B9674B]/90 transition text-center"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. Vehicle Detail Inspection Modal */}
      {/* ========================================================= */}
      {inspectingCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#66717D]/20 max-w-3xl w-full p-6 sm:p-8 my-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#66717D]/15 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-[#111820]">
                    {inspectingCar.make} {inspectingCar.model}
                  </h2>
                  <span className="text-sm text-[#66717D]">({inspectingCar.year})</span>
                  {inspectingCar.status === 'pending' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F36A] text-[#111820]">
                      Pending Review
                    </span>
                  )}
                  {inspectingCar.status === 'approved' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Approved &amp; Live
                    </span>
                  )}
                  {inspectingCar.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                      Rejected
                    </span>
                  )}
                  {inspectingCar.status === 'inactive' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#66717D] mt-1">
                  Listing ID: <code className="bg-[#F5F2EB] px-1.5 py-0.5 rounded font-mono">{inspectingCar.id}</code> • Submitted: {new Date(inspectingCar.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setInspectingCar(null)}
                className="w-9 h-9 rounded-full bg-[#F5F2EB] text-[#111820] flex items-center justify-center font-bold hover:bg-[#111820] hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Photo Gallery & Thumbnail strip */}
            <div className="flex flex-col gap-2.5">
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 border border-[#66717D]/15">
                {inspectingCar.photos && inspectingCar.photos[activePhotoIndex] ? (
                  <Image
                    src={inspectingCar.photos[activePhotoIndex]}
                    alt={`${inspectingCar.make} ${inspectingCar.model}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No photo available
                  </div>
                )}
              </div>

              {inspectingCar.photos && inspectingCar.photos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {inspectingCar.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition cursor-pointer ${
                        activePhotoIndex === idx
                          ? 'border-[#111820] shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={photo}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rejection Notice if currently rejected */}
            {inspectingCar.status === 'rejected' && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col gap-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>✕</span>
                  <span>Listing Currently Rejected</span>
                </div>
                <p className="text-xs">
                  <strong>Recorded reason:</strong> {inspectingCar.rejectionReason || 'No detailed reason provided.'}
                </p>
                {inspectingCar.moderatedAt && (
                  <p className="text-[11px] text-rose-700 mt-1">
                    Moderated on {new Date(inspectingCar.moderatedAt).toLocaleString()} by {inspectingCar.moderatedBy || 'Admin'}
                  </p>
                )}
              </div>
            )}

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F5F2EB]/50 rounded-2xl border border-[#66717D]/12 text-xs">
              <div>
                <span className="text-[#66717D] block">Transmission</span>
                <span className="font-bold text-[#111820]">{inspectingCar.transmission}</span>
              </div>
              <div>
                <span className="text-[#66717D] block">Seating Capacity</span>
                <span className="font-bold text-[#111820]">{inspectingCar.seats} Passengers</span>
              </div>
              <div>
                <span className="text-[#66717D] block">Fuel Type</span>
                <span className="font-bold text-[#111820]">{inspectingCar.fuelType || 'Petrol'}</span>
              </div>
              <div>
                <span className="text-[#66717D] block">Daily Rental Rate</span>
                <span className="font-black text-[#111820]">{inspectingCar.pricePerDay.toLocaleString()} ETB</span>
              </div>
              <div>
                <span className="text-[#66717D] block">City &amp; Neighbourhood</span>
                <span className="font-bold text-[#111820]">{inspectingCar.neighbourhood}, Addis Ababa</span>
              </div>
              <div>
                <span className="text-[#66717D] block">GPS Coordinates</span>
                <span className="font-mono text-[#111820]">{inspectingCar.latitude.toFixed(4)}, {inspectingCar.longitude.toFixed(4)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#66717D] block">Estimated 3-Day Rental Total</span>
                <span className="font-bold text-[#111820]">
                  {(inspectingCar.pricePerDay * 3 + Math.round(inspectingCar.pricePerDay * 3 * 0.1)).toLocaleString()} ETB (incl. simulated fee)
                </span>
              </div>
            </div>

            {/* Vehicle Features */}
            {inspectingCar.features && inspectingCar.features.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#66717D]">
                  Installed Equipment &amp; Features
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingCar.features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2.5 py-1 rounded-xl text-xs font-medium bg-white text-[#111820] border border-[#66717D]/18"
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#66717D]">
                Host Listing Description
              </span>
              <p className="text-sm text-[#111820] leading-relaxed bg-white p-4 rounded-2xl border border-[#66717D]/15">
                {inspectingCar.description || 'No description provided by the host.'}
              </p>
            </div>

            {/* Owner Information Card */}
            {(() => {
              const owner = users.find((u) => u.id === inspectingCar.ownerId);
              return (
                <div className="p-4 rounded-2xl bg-[#F5F2EB]/60 border border-[#66717D]/15 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#111820] text-white flex items-center justify-center font-bold text-sm">
                      {owner?.name.charAt(0) || 'H'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111820] flex items-center gap-2">
                        <span>{owner?.name || 'Verified Owner'}</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] bg-white border border-[#66717D]/20">
                          {owner?.roles.join(', ') || 'owner'}
                        </span>
                      </div>
                      <div className="text-xs text-[#66717D] mt-0.5">
                        {owner?.email || 'No email'} • {owner?.phone || 'No phone'} • Base: {owner?.neighbourhood || 'Addis Ababa'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#66717D] uppercase block">Account</span>
                    <span className={`text-xs font-bold ${owner?.status === 'suspended' ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {owner?.status === 'suspended' ? '⚠️ Suspended' : '✓ Active'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Data Integrity Notice */}
            <p className="text-[11px] text-[#66717D] bg-white p-3 rounded-xl border border-[#66717D]/10">
              ℹ️ <strong>Platform Integrity Guarantee:</strong> Moderating this listing updates its public discovery status without altering vehicle ownership, existing renter reservations, or locked price snapshots in escrow.
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#66717D]/15">
              <button
                onClick={() => setInspectingCar(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F5F2EB] text-[#111820] hover:bg-[#66717D]/20 transition cursor-pointer"
              >
                Close Inspection
              </button>

              {inspectingCar.status !== 'approved' && (
                <button
                  onClick={() => {
                    setCarToApprove(inspectingCar);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  ✓ Approve &amp; Publish Listing
                </button>
              )}

              {inspectingCar.status !== 'rejected' && (
                <button
                  onClick={() => {
                    setCarToReject(inspectingCar);
                    setRejectionReasonText('');
                    setRejectionError('');
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B9674B] text-white hover:bg-[#B9674B]/90 transition cursor-pointer shadow-xs"
                >
                  ✕ Reject Listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. Approve Confirmation Modal */}
      {/* ========================================================= */}
      {carToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#66717D]/20 max-w-md w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-black text-[#111820]">
                Approve Vehicle Listing?
              </h3>
              <p className="text-sm text-[#66717D] mt-1.5 leading-relaxed">
                You are about to approve <strong>{carToApprove.make} {carToApprove.model} ({carToApprove.year})</strong>.
                This will immediately publish the vehicle to the public catalogue on <code className="bg-[#F5F2EB] px-1 rounded">/cars</code> and allow renters across Addis Ababa to book trips.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F5F2EB]/60 border border-[#66717D]/15 text-xs text-[#111820]">
              <div><strong>Daily Rate:</strong> {carToApprove.pricePerDay.toLocaleString()} ETB / day</div>
              <div className="mt-1"><strong>Neighbourhood:</strong> {carToApprove.neighbourhood}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCarToApprove(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F5F2EB] text-[#111820] hover:bg-[#66717D]/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(carToApprove)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. Reject Modal with Mandatory Reason */}
      {/* ========================================================= */}
      {carToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#66717D]/20 max-w-lg w-full p-6 sm:p-8 my-8 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-2xl">
              ✕
            </div>
            <div>
              <h3 className="text-xl font-black text-[#111820]">
                Reject Vehicle Listing
              </h3>
              <p className="text-sm text-[#66717D] mt-1.5 leading-relaxed">
                Rejecting <strong>{carToReject.make} {carToReject.model} ({carToReject.year})</strong> will hide it from the public catalogue and prevent bookings.
                You must provide an administrative reason to help the host resolve compliance issues.
              </p>
            </div>

            {/* Quick preset selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#66717D] uppercase tracking-wider">
                Common Rejection Reasons (Click to populate)
              </span>
              <div className="flex flex-col gap-1">
                {PRESET_REJECTION_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRejectionReasonText(preset);
                      setRejectionError('');
                    }}
                    className="p-2 text-left text-xs rounded-xl bg-[#F5F2EB] hover:bg-[#111820] hover:text-white transition cursor-pointer text-[#111820]"
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Reason Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#111820]">
                Detailed Rejection Explanation <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectionReasonText}
                onChange={(e) => {
                  setRejectionReasonText(e.target.value);
                  if (rejectionError) setRejectionError('');
                }}
                placeholder="Explain clearly what requirements must be met before this vehicle can be published..."
                className="w-full p-3.5 rounded-2xl bg-[#F5F2EB]/50 border border-[#66717D]/25 text-sm text-[#111820] placeholder-[#66717D] focus:outline-none focus:ring-2 focus:ring-[#111820] focus:bg-white transition"
              />
              <span className="text-[11px] text-[#66717D] flex justify-between">
                <span>Minimum 5 characters required</span>
                <span>{rejectionReasonText.length} chars</span>
              </span>
              {rejectionError && (
                <span className="text-xs text-rose-600 font-bold mt-1">
                  ⚠️ {rejectionError}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#66717D]/12">
              <button
                onClick={() => setCarToReject(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F5F2EB] text-[#111820] hover:bg-[#66717D]/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B9674B] text-white hover:bg-[#B9674B]/90 transition shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
