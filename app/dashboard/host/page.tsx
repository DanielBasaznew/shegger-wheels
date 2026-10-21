'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function HostDashboardContent() {
  return (
    <div className="w-full py-10 bg-[#F5F2EB]">
      <Container className="flex flex-col gap-6">
        <div className="p-8 rounded-3xl bg-white border border-[#66717D]/18 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            <Badge variant="obsidian">Host Partner Area</Badge>
          </div>
          <h1 className="text-3xl font-bold text-[#111820]">
            Host Fleet &amp; Reservation Management
          </h1>
          <p className="text-sm text-[#66717D] max-w-2xl leading-relaxed">
            Welcome to the Shegger Wheels host portal. Upcoming tasks will implement live vehicle listing creation, calendar blackout management, and TeleBirr payout tracking.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" href="/dashboard" size="sm">
              ← Back to Dashboard Hub
            </Button>
            <Button variant="outline" href="/cars" size="sm">
              View Public Fleet
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function HostDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['owner']} areaTitle="Host Fleet Area">
      <HostDashboardContent />
    </ProtectedRoute>
  );
}
