'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const NeighbourhoodMap = dynamic(() => import('./NeighbourhoodMap'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[280px] sm:h-[340px] w-full animate-pulse rounded-2xl bg-[#EBE8E1] border border-[#66717D]/15 flex items-center justify-center"
      aria-label="Loading neighborhood hub map"
      role="status"
    >
      <div className="text-center text-[#66717D] flex flex-col items-center gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-[#111820] border-t-[#D5F36A] animate-spin" />
        <p className="text-xs font-bold text-[#111820]">Loading Addis Ababa Hub Map...</p>
      </div>
    </div>
  ),
});

export default function NeighbourhoodMapPanel({
  neighbourhood,
  carName,
}: {
  neighbourhood: string;
  carName: string;
}) {
  return <NeighbourhoodMap neighbourhood={neighbourhood} carName={carName} />;
}
