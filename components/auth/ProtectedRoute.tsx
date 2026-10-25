'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserRole, User } from '@/lib/types';
import { getUserById } from '@/lib/storage';
import { switchActiveRole } from '@/lib/auth';
import { useSession } from '@/lib/swr';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
  areaTitle?: string;
}

export function ProtectedRoute({
  allowedRoles,
  children,
  areaTitle = 'Protected Dashboard Area',
}: ProtectedRouteProps) {
  const pathname = usePathname();
  const { session } = useSession();

  let currentUser: User | null = null;
  if (session?.userId) {
    currentUser = getUserById(session.userId) || null;
  }

  // 1. Signed Out Barrier
  if (!session || !currentUser) {
    const signInHref = `/signin?redirect=${encodeURIComponent(pathname)}`;

    return (
      <div className="w-full py-20 bg-[#F5F2EB]">
        <Container>
          <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white border border-[#66717D]/18 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111820] text-[#D5F36A] flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </div>
            <Badge variant="obsidian" className="mb-2 uppercase">
              Authentication Required
            </Badge>
            <h1 className="text-2xl font-bold text-[#111820] mb-2">{areaTitle}</h1>
            <p className="text-sm text-[#66717D] mb-6 leading-relaxed">
              This section requires an active Shegger Wheels demo session. Select a pre-configured persona to test this role-aware portal.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="primary" href={signInHref} size="md">
                Sign In with Demo Persona →
              </Button>
              <Button variant="outline" href="/cars" size="md">
                Browse Fleet
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-[#66717D]/15 text-[11px] text-[#66717D]">
              Note: Client-side role validation for demo simulation purposes.
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // 2. Suspended Account Barrier
  if (currentUser.status === 'suspended') {
    return (
      <div className="w-full py-20 bg-[#F5F2EB]">
        <Container>
          <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white border border-red-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-900 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">block</span>
            </div>
            <Badge variant="terracotta" className="mb-2 uppercase">
              Account Suspended
            </Badge>
            <h1 className="text-2xl font-bold text-red-950 mb-2">Access Restricted</h1>
            <p className="text-sm text-[#44474B] mb-6 leading-relaxed">
              Your demo account (<strong className="text-[#111820]">{currentUser.name}</strong>) has been suspended due to simulated policy or administrative review flags. Access to protected areas and operations is restricted.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="primary" href="/signin" size="md">
                Switch to an Active Persona →
              </Button>
              <Button variant="outline" href="/cars" size="md">
                Browse Public Fleet
              </Button>
            </div>
            <div className="mt-6 pt-4 border-t border-[#66717D]/15 text-[11px] text-[#66717D]">
              Administrative security guardrail active.
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // 3. Role Check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.activeRole)) {
    // Check if account holds the required role in its roles array (coexisting roles)
    const canSwitchToRequired = allowedRoles.find((role) => currentUser?.roles.includes(role));

    return (
      <div className="w-full py-20 bg-[#F5F2EB]">
        <Container>
          <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white border border-[#B9674B]/25 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">shield_person</span>
            </div>
            <Badge variant="terracotta" className="mb-2 uppercase">
              Role Access Restricted
            </Badge>
            <h1 className="text-2xl font-bold text-[#111820] mb-2">{areaTitle}</h1>

            <p className="text-sm text-[#44474B] mb-4 leading-relaxed">
              You are currently signed in as{' '}
              <strong className="text-[#111820] uppercase font-bold">{session.activeRole}</strong>{' '}
              ({currentUser.name}). This area requires{' '}
              <span className="font-bold text-[#76331B]">
                {allowedRoles.map((r) => r.toUpperCase()).join(' or ')}
              </span>{' '}
              permissions.
            </p>

            {canSwitchToRequired ? (
              <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#66717D]/15 mb-6 text-xs text-left w-full flex flex-col gap-2">
                <span className="font-bold text-[#111820]">Coexisting Role Detected:</span>
                <p className="text-[#66717D]">
                  Your account ({currentUser.name}) already possesses the{' '}
                  <strong className="text-[#111820]">{canSwitchToRequired.toUpperCase()}</strong>{' '}
                  role. You can switch your active view with one click:
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => switchActiveRole(canSwitchToRequired)}
                  className="mt-1"
                >
                  Switch to {canSwitchToRequired.toUpperCase()} Role &amp; Continue
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-6">
                <Button
                  variant="primary"
                  href={`/signin?role=${allowedRoles[0]}&redirect=${encodeURIComponent(pathname)}`}
                  size="md"
                >
                  Switch to {allowedRoles[0].toUpperCase()} Persona →
                </Button>
                <Button variant="outline" href="/dashboard" size="md">
                  Return to My Dashboard
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-[#66717D]/15 text-[11px] text-[#66717D]">
              Note: Client-side role validation for demo simulation purposes.
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // 3. Authorized — Render Children
  return (
    <>
      {/* Subtle Dev Simulation Bar */}
      <div className="w-full bg-[#111820] text-white py-1.5 px-4 text-center text-[11px] font-specs-tabular flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#D5F36A] animate-pulse" />
        <span>
          Active Persona: <strong>{currentUser.name}</strong> ({session.activeRole.toUpperCase()})
        </span>
        <span className="text-white/40">•</span>
        <span className="text-[#D5F36A]">Protected Role View</span>
      </div>
      {children}
    </>
  );
}
