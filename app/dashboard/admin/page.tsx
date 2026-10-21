'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function AdminDashboardContent() {
  return (
    <div className="w-full py-10 bg-[#F5F2EB]">
      <Container className="flex flex-col gap-6">
        <div className="p-8 rounded-3xl bg-white border border-[#66717D]/18 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <Badge variant="obsidian">Administrator Operations</Badge>
          </div>
          <h1 className="text-3xl font-bold text-[#111820]">
            Admin Moderation &amp; Escrow Ledger
          </h1>
          <p className="text-sm text-[#66717D] max-w-2xl leading-relaxed">
            Welcome to the Shegger Wheels admin operations portal. Upcoming tasks will implement car approval workflows, user suspension controls, dispute mediation, and system announcements.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" href="/dashboard" size="sm">
              ← Back to Dashboard Hub
            </Button>
            <Button variant="outline" href="/cars" size="sm">
              Inspect Live Listings
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']} areaTitle="Admin Audit Ledger">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
