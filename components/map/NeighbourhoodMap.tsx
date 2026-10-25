'use client';

import React, { useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ADDIS_COORDINATES } from './map-constants';

interface NeighbourhoodMapProps {
  neighbourhood: string;
  carName: string;
}

function createHubPin() {
  return L.divIcon({
    className: 'custom-hub-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        background: #111820;
        color: #D5F36A;
        border: 3px solid #D5F36A;
        border-radius: 50%;
        box-shadow: 0 6px 16px rgba(0,0,0,0.35);
        font-size: 20px;
      ">
        📍
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
  });
}

export default function NeighbourhoodMap({
  neighbourhood,
  carName,
}: NeighbourhoodMapProps) {
  const coords: [number, number] =
    ADDIS_COORDINATES[neighbourhood] || ADDIS_COORDINATES.Bole;

  const pinIcon = useMemo(() => createHubPin(), []);

  return (
    <div className="relative w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border border-[#66717D]/20 shadow-sm">
      <MapContainer
        center={coords}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        aria-label={`Interactive map of ${neighbourhood} pickup hub in Addis Ababa`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        />

        {/* 1.5km Concierge Delivery / Pickup Radius Circle */}
        <Circle
          center={coords}
          radius={1200}
          pathOptions={{
            color: '#536600',
            fillColor: '#D5F36A',
            fillOpacity: 0.18,
            weight: 2,
            dashArray: '4, 6',
          }}
        />

        {/* Hub Center Marker */}
        <Marker position={coords} icon={pinIcon}>
          <Popup>
            <div className="text-xs p-1 text-[#111820]">
              <strong className="block font-bold text-sm">
                {neighbourhood} Hub — Shegger Wheels
              </strong>
              <span className="text-[#66717D] block mt-0.5">
                Pickup zone for {carName}
              </span>
              <span className="text-[#536600] font-bold block mt-1">
                ✓ Free Airport &amp; Hotel Handover within 1.2km
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Info Pill */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#66717D]/20 shadow-sm flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full bg-[#536600]" />
        <span className="font-bold text-[#111820]">{neighbourhood} Hub</span>
        <span className="text-[#66717D]">• 1.2km Delivery Zone</span>
      </div>
    </div>
  );
}
