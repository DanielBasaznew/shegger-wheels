'use client';

import React, { Component, ReactNode } from 'react';
import dynamic from 'next/dynamic';

interface ErrorBoundaryProps {
  children: ReactNode;
  neighbourhood?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Neighbourhood Map render error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="status"
          className="flex h-[280px] sm:h-[340px] w-full items-center justify-center rounded-2xl border border-dashed border-[#66717D]/30 bg-white p-6 text-center text-xs text-[#66717D]"
        >
          <div className="flex flex-col items-center max-w-sm">
            <span className="material-symbols-outlined text-3xl mb-2 text-[#66717D]">
              map_off
            </span>
            <p className="font-bold text-sm text-[#111820] mb-1">
              {this.props.neighbourhood || 'Addis Ababa'} Hub Map Offline
            </p>
            <p className="text-xs text-[#66717D] leading-relaxed">
              Standard vehicle handover is available at the verified host station. Coordinates and check-in instructions are delivered upon reservation.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  return (
    <MapErrorBoundary neighbourhood={neighbourhood}>
      <NeighbourhoodMap neighbourhood={neighbourhood} carName={carName} />
    </MapErrorBoundary>
  );
}

