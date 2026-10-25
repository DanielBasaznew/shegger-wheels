import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SEED_BOOKINGS } from '@/lib/seeds';
import { BookingDetailView } from '@/components/bookings/BookingDetailView';

interface BookingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  return SEED_BOOKINGS.map((b) => ({
    id: b.id,
  }));
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Booking Receipt #${id.toUpperCase()} | Shegger Wheels`,
    description: 'Itemized rental booking receipt and TeleBirr escrow ledger for Shegger Wheels.',
  };
}

async function BookingReceiptContent({ params }: BookingPageProps) {
  const { id } = await params;
  return <BookingDetailView bookingId={id} />;
}

export default function BookingReceiptPage({ params }: BookingPageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#111820]/15 border-t-[#111820] rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[#66717D]">
               Loading Shegger Reservation Receipt...
            </p>
          </div>
        </div>
      }
    >
      <BookingReceiptContent params={params} />
    </Suspense>
  );
}
