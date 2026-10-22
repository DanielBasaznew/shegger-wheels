import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SEED_BOOKINGS } from '@/lib/seeds';
import { TripTrackingView } from '@/components/bookings/TripTrackingView';

interface TripTrackingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  return SEED_BOOKINGS.map((b) => ({
    id: b.id,
  }));
}

export async function generateMetadata({ params }: TripTrackingPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Live Trip Tracking #${id.toUpperCase()} | Shegger Wheels`,
    description: 'Simulated real-time trip tracking, Addis Ababa corridor telematics, and lifecycle handover controls.',
  };
}

export default async function TripTrackingPage({ params }: TripTrackingPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#111820]/15 border-t-[#111820] rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[#66717D]">
              Loading Shegger Telematics Rail...
            </p>
          </div>
        </div>
      }
    >
      <TripTrackingView bookingId={id} />
    </Suspense>
  );
}
