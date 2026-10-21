'use client';

import React, { useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserById } from '@/lib/storage';
import { DemoSession, User } from '@/lib/types';
import { switchActiveRole, signOutDemoUser } from '@/lib/auth';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('shegger-session-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('shegger-session-change', callback);
  };
}

function getSessionSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem('sw_session_v1') || '';
  } catch {
    return '';
  }
}

function getServerSnapshot(): string {
  return '';
}

function DashboardContent() {
  const sessionRaw = useSyncExternalStore(subscribe, getSessionSnapshot, getServerSnapshot);
  let session: DemoSession | null = null;
  let currentUser: User | null = null;

  if (sessionRaw) {
    try {
      session = JSON.parse(sessionRaw);
      if (session) {
        currentUser = getUserById(session.userId) || null;
      }
    } catch {
      session = null;
      currentUser = null;
    }
  }

  if (!session || !currentUser) return null;

  return (
    <div className="w-full py-10 bg-[#F5F2EB]">
      <Container className="flex flex-col gap-8">
        {/* Profile Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#66717D]/18 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {currentUser.avatarUrl ? (
              <Image
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                width={72}
                height={72}
                unoptimized
                className="w-18 h-18 rounded-2xl object-cover border border-[#111820]/10"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl bg-[#111820] text-[#D5F36A] flex items-center justify-center text-2xl font-bold">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[#111820]">{currentUser.name}</h1>
                <Badge variant="obsidian" className="uppercase">
                  Active: {session.activeRole}
                </Badge>
                {currentUser.roles.length > 1 && (
                  <Badge variant="citron">Multi-Role Account</Badge>
                )}
              </div>
              <p className="text-xs text-[#66717D] mt-0.5">
                {currentUser.email} • {currentUser.phone} • {currentUser.neighbourhood || 'Addis Ababa'}
              </p>
              <span className="text-[11px] font-specs-tabular text-[#536600] font-semibold mt-1">
                Demo Session Active since {new Date(session.signedInAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser.roles.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F6F3EC] border border-[#66717D]/15">
                {currentUser.roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => switchActiveRole(r)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer ${
                      session?.activeRole === r
                        ? 'bg-[#111820] text-white shadow-xs'
                        : 'text-[#44474B] hover:text-[#111820]'
                    }`}
                  >
                    {r} Mode
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => signOutDemoUser()}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Role Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Renter Portal Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#66717D]/18 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🚗</span>
                <Badge variant={session.activeRole === 'renter' ? 'citron' : 'neutral'}>
                  {session.activeRole === 'renter' ? 'Current Active' : 'Available'}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-[#111820]">Renter Hub</h2>
              <p className="text-xs text-[#66717D] leading-relaxed">
                Browse verified Addis vehicles, manage rental bookings, inspect simulated TeleBirr escrow deposits, and download agreements.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="secondary" href="/cars" size="sm">
                Explore Vehicle Fleet →
              </Button>
            </div>
          </div>

          {/* Host Portal Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#66717D]/18 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🔑</span>
                <Badge
                  variant={
                    session.activeRole === 'owner'
                      ? 'citron'
                      : currentUser.roles.includes('owner')
                      ? 'neutral'
                      : 'terracotta'
                  }
                >
                  {session.activeRole === 'owner'
                    ? 'Current Active'
                    : currentUser.roles.includes('owner')
                    ? 'Assigned Role'
                    : 'Owner Only'}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-[#111820]">Host Fleet Portal</h2>
              <p className="text-xs text-[#66717D] leading-relaxed">
                Review booking requests, track monthly earnings (ETB), set calendar blackout dates, and manage approved car listings.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant={session.activeRole === 'owner' ? 'primary' : 'outline'}
                href="/dashboard/host"
                size="sm"
              >
                Go to Host Area →
              </Button>
            </div>
          </div>

          {/* Admin Audit Ledger Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#66717D]/18 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🛡️</span>
                <Badge
                  variant={
                    session.activeRole === 'admin'
                      ? 'citron'
                      : currentUser.roles.includes('admin')
                      ? 'neutral'
                      : 'terracotta'
                  }
                >
                  {session.activeRole === 'admin' ? 'Current Active' : 'Admin Role Required'}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-[#111820]">Admin Audit Ledger</h2>
              <p className="text-xs text-[#66717D] leading-relaxed">
                Moderation queue for new car listings, user account suspensions, dispute resolution, and TeleBirr transaction auditing.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant={session.activeRole === 'admin' ? 'primary' : 'outline'}
                href="/dashboard/admin"
                size="sm"
              >
                Go to Admin Area →
              </Button>
            </div>
          </div>
        </div>

        {/* Prototype Security Guidance Box */}
        <div className="p-4 rounded-2xl bg-[#EBE8E1]/80 border border-[#66717D]/15 text-xs text-[#44474B] flex items-start gap-3">
          <span className="text-base mt-0.5">ℹ️</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-[#111820]">Demo Authentication Architecture:</span>
            <p className="leading-relaxed">
              This dashboard is guarded by client-side demo role verification. Sessions are stored in <code>sessionStorage</code> under versioned key <code>sw_session_v1</code>. No passwords or backend tokens are stored.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute areaTitle="Shegger Wheels Dashboard">
      <DashboardContent />
    </ProtectedRoute>
  );
}
