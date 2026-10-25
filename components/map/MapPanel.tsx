'use client';

import React, { Component, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { LeafletTripMapProps } from './map-constants';

interface ErrorBoundaryProps {
  children: ReactNode;
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
    console.error('Leaflet Map render error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="status"
          className="flex h-[360px] sm:h-[420px] w-full items-center justify-center rounded-2xl border border-dashed border-[#66717D]/30 bg-white p-6 text-center text-xs text-[#66717D]"
        >
          <div className="flex flex-col items-center max-w-sm">
            <span className="material-symbols-outlined text-3xl mb-2 text-[#66717D]">
              map_off
            </span>
            <p className="font-bold text-sm text-[#111820] mb-1">
              Interactive OpenStreetMap view currently unavailable.
            </p>
            <p className="text-xs text-[#66717D] leading-relaxed">
              Live vehicle coordinates are safely recorded in the telematics ledger. Please refer to the telemetry waypoints panel.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dynamic import with ssr: false ensures Leaflet never executes on the server
const LeafletTripMap = dynamic(() => import('./LeafletTripMap'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[380px] sm:h-[460px] w-full animate-pulse rounded-2xl bg-[#EBE8E1] border border-[#66717D]/15 flex items-center justify-center"
      aria-label="Initializing Addis Ababa OpenStreetMap telemetry view"
      role="status"
    >
      <div className="text-center text-[#66717D] flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-3 border-[#111820] border-t-[#D5F36A] animate-spin" />
        <p className="text-xs font-bold text-[#111820]">Loading Addis Ababa Leaflet Map...</p>
        <span className="text-[11px] text-[#66717D]">Calibrating telematics corridor</span>
      </div>
    </div>
  ),
});

export default function MapPanel(props: LeafletTripMapProps) {
  return (
    <MapErrorBoundary>
      <LeafletTripMap {...props} />
    </MapErrorBoundary>
  );
}
