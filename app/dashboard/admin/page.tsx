'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminModerationDashboardView } from '@/components/dashboard/AdminModerationDashboardView';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']} areaTitle="Admin Moderation Portal">
      <AdminModerationDashboardView />
    </ProtectedRoute>
  );
}
