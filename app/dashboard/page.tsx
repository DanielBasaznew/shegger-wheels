'use client';

import React, { useSyncExternalStore } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RenterDashboardView } from '@/components/dashboard/RenterDashboardView';
import { getCurrentSession, getUserById } from '@/lib/storage';
import { DemoSession, User } from '@/lib/types';
import { switchActiveRole } from '@/lib/auth';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('shegger-session-change', callback);
  window.addEventListener('shegger-storage-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('shegger-session-change', callback);
    window.removeEventListener('shegger-storage-change', callback);
  };
}

function getSessionSnapshot(): DemoSession | null {
  return getCurrentSession();
}

function getServerSnapshot(): DemoSession | null {
  return null;
}

function DashboardContent() {
  const session = useSyncExternalStore(subscribe, getSessionSnapshot, getServerSnapshot);
  const currentUser: User | null = session ? getUserById(session.userId) || null : null;

  if (!session || !currentUser) return null;

  // If in renter role, render the complete Stitch-matched Renter Dashboard
  if (session.activeRole === 'renter') {
    return <RenterDashboardView />;
  }

  // If currently in owner mode or admin mode, render an overview switcher banner
  return (
    <div className="w-full min-h-[70vh] bg-[#F5F2EB] py-12">
      <Container className="max-w-2xl flex flex-col items-center text-center gap-6">
        <div className="p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm flex flex-col items-center gap-4 w-full">
          <div className="w-16 h-16 rounded-2xl bg-[#111820] text-[#D5F36A] flex items-center justify-center text-2xl font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <span className="text-[10px] font-label-caps uppercase text-[#536600] font-bold">
              Active Mode: {session.activeRole.toUpperCase()}
            </span>
            <h1 className="text-2xl font-bold text-[#111820] mt-1">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-[#66717D] mt-1">
              You are currently viewing Shegger Wheels in{' '}
              <strong className="text-[#111820]">{session.activeRole}</strong> mode.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-4 border-t border-[#66717D]/12">
            {currentUser.roles.includes('renter') && (
              <Button
                variant="primary"
                className="w-full sm:flex-1"
                onClick={() => switchActiveRole('renter')}
              >
                Switch to Renter Dashboard →
              </Button>
            )}
            {currentUser.roles.includes('owner') && (
              <Button
                variant="outline"
                className="w-full sm:flex-1"
                href="/dashboard/host"
              >
                Go to Host Fleet Portal →
              </Button>
            )}
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
