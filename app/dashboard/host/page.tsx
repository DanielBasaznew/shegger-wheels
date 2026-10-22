'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HostFleetDashboardView } from '@/components/dashboard/HostFleetDashboardView';

export default function HostDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['owner']} areaTitle="Host Fleet Area">
      <HostFleetDashboardView />
    </ProtectedRoute>
  );
}

