import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { CheckoutView } from '@/components/checkout/CheckoutView';

export const metadata: Metadata = {
  title: 'Confirm Booking & Mock TeleBirr Escrow | Shegger Wheels',
  description:
    'Secure peer-to-peer car rental reservation in Addis Ababa with simulated TeleBirr escrow vaulting and comprehensive vehicle insurance.',
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#F5F2EB]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#111820]/15 border-t-[#111820] rounded-full animate-spin" />
            <p className="text-sm font-semibold text-[#66717D]">
              Loading Shegger Escrow Rails...
            </p>
          </div>
        </div>
      }
    >
      <CheckoutView />
    </Suspense>
  );
}
