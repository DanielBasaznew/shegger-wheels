'use client';

import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ADDIS_COORDINATES, TRIP_WAYPOINTS, LeafletTripMapProps } from './map-constants';

// Helper to construct custom Leaflet DivIcons matching Addis Eats design
function createHubIcon(label: string, bg: string, text: string) {
  return L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: ${bg};
        color: ${text};
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(17,24,32,0.45);
        font-size: 18px;
        font-weight: 800;
      ">
        ${label}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

function createVehicleIcon(isOnRoad: boolean) {
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        ${
          isOnRoad
            ? '<span style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(213, 243, 106, 0.45); animation: pulse 2s infinite;"></span>'
            : ''
        }
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #111820;
          color: #D5F36A;
          border: 3px solid #D5F36A;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0,0,0,0.45);
          font-size: 20px;
        ">
          🚗
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

/**
 * Automatically adjusts map camera view to encompass all active waypoints and route markers.
 */
function FitBoundsHelper({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length < 2) return;
    try {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
      });
    } catch {
      // ignore
    }
  }, [map, positions]);

  return null;
}

export default function LeafletTripMap({
  booking,
  car,
  activeWaypointIndex,
  onSelectWaypoint,
}: LeafletTripMapProps) {
  const originNeighbourhood = car?.neighbourhood || 'Bole';
  const originCoords: [number, number] =
    ADDIS_COORDINATES[originNeighbourhood] || ADDIS_COORDINATES.Bole;

  const currentWp = TRIP_WAYPOINTS[activeWaypointIndex] || TRIP_WAYPOINTS[0];
  const isOnRoad = booking.status === 'in_progress';
  const isTripFinished = booking.status === 'completed' || booking.status === 'reviewed';

  // Live vehicle coordinates based on current waypoint or finished location
  const vehicleCoords: [number, number] = useMemo(() => {
    if (!isOnRoad && !isTripFinished) {
      // Parked at origin hub
      return originCoords;
    }
    return currentWp.coords;
  }, [isOnRoad, isTripFinished, currentWp.coords, originCoords]);

  // Handover Destination
  const destinationCoords: [number, number] = TRIP_WAYPOINTS[TRIP_WAYPOINTS.length - 1].coords;

  const completedPolyline = useMemo(() => {
    if (!isOnRoad && !isTripFinished) return [originCoords];
    return TRIP_WAYPOINTS.slice(0, activeWaypointIndex + 1).map((wp) => wp.coords);
  }, [isOnRoad, isTripFinished, activeWaypointIndex, originCoords]);

  const remainingPolyline = useMemo(() => {
    if (isTripFinished) return [];
    return TRIP_WAYPOINTS.slice(activeWaypointIndex).map((wp) => wp.coords);
  }, [isTripFinished, activeWaypointIndex]);

  // Marker bounds for auto-zoom
  const allPositions = useMemo<[number, number][]>(() => {
    return [originCoords, vehicleCoords, destinationCoords];
  }, [originCoords, vehicleCoords, destinationCoords]);

  // Custom icons
  const originIcon = useMemo(() => createHubIcon('📍', '#111820', '#D5F36A'), []);
  const vehicleIcon = useMemo(() => createVehicleIcon(isOnRoad), [isOnRoad]);
  const destIcon = useMemo(() => createHubIcon('🏁', '#3F4948', '#ffffff'), []);
  const waypointIcon = useMemo(() => createHubIcon('•', '#66717D', '#ffffff'), []);

  return (
    <div className="space-y-3">
      {/* Route Header Strip matching Addis Eats */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-[#F5F2EB] border border-[#66717D]/15 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#111820] text-[#D5F36A] flex items-center justify-center text-[11px] font-bold">
            📍
          </span>
          <span className="font-bold text-[#111820]">
            Origin Hub: {originNeighbourhood}, Addis Ababa
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[#66717D]">
          <span>&rarr;</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#111820] bg-white px-2.5 py-0.5 rounded-full border border-[#66717D]/15">
            🚗 {isOnRoad ? `En Route (${currentWp.speedKmH} km/h)` : isTripFinished ? 'Trip Concluded' : 'Parked at Hub'}
          </span>
          <span>&rarr;</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#3F4948] text-white flex items-center justify-center text-[11px] font-bold">
            🏁
          </span>
          <span className="font-bold text-[#111820]">
            Return Hub: CMC / Megenagna
          </span>
        </div>
      </div>

      {/* Leaflet Interactive Map View */}
      <div className="relative w-full h-[380px] sm:h-[460px] overflow-hidden rounded-2xl border border-[#66717D]/20 shadow-sm">
        <MapContainer
          center={originCoords}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
          aria-label={`Live telematics trip map for ${car?.make || 'Vehicle'} ${car?.model || ''} in Addis Ababa`}
        >
          {/* OpenStreetMap Standard Tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          />

          {/* 1. Origin Pickup Hub Marker */}
          <Marker position={originCoords} icon={originIcon}>
            <Popup>
              <div className="text-xs p-1 text-[#111820]">
                <strong className="block font-bold text-sm">Shegger Wheels {originNeighbourhood} Hub</strong>
                <span className="text-[#66717D] block mt-0.5">Key Handover & Departure Location</span>
                <span className="text-[#536600] font-bold block mt-1">Escrow Verified Hub</span>
              </div>
            </Popup>
          </Marker>

          {/* 2. Destination Return Hub Marker */}
          <Marker position={destinationCoords} icon={destIcon}>
            <Popup>
              <div className="text-xs p-1 text-[#111820]">
                <strong className="block font-bold text-sm">Return & Inspection Point</strong>
                <span className="text-[#66717D] block mt-0.5">CMC / Megenagna Arterial</span>
                <span className="text-[#111820] font-semibold block mt-1">Reservation #{booking.id.toUpperCase()}</span>
              </div>
            </Popup>
          </Marker>

          {/* 3. Waypoint Markers along Addis Ababa corridor */}
          {TRIP_WAYPOINTS.map((wp, idx) => {
            const isCurrent = idx === activeWaypointIndex;
            return (
              <Marker
                key={wp.id}
                position={wp.coords}
                icon={waypointIcon}
                eventHandlers={{
                  click: () => onSelectWaypoint?.(idx),
                }}
              >
                <Popup>
                  <div className="text-xs p-1 text-[#111820]">
                    <strong className="block font-bold">{wp.name}</strong>
                    <span className="text-[#66717D] block">{wp.subcity}</span>
                    <span className="text-xs font-semibold block mt-1 text-[#111820]">
                      Speed: {wp.speedKmH} km/h • {wp.statusText}
                    </span>
                    {isCurrent && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[#111820] text-[#D5F36A] text-[10px] font-bold">
                        Current Telemetry Position
                      </span>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 4. Live Vehicle Marker */}
          <Marker position={vehicleCoords} icon={vehicleIcon}>
            <Popup>
              <div className="text-xs p-1 text-[#111820]">
                <strong className="block font-bold text-sm">
                  {car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle'}
                </strong>
                <span className="text-[#111820] font-semibold block mt-0.5">
                  {isOnRoad
                    ? `Live Telematics: ${currentWp.name}`
                    : isTripFinished
                    ? 'Rental trip concluded'
                    : 'Awaiting departure handover'}
                </span>
                <span className="text-[#536600] font-bold block mt-1">
                  Speed: {isOnRoad ? `${currentWp.speedKmH} km/h` : '0 km/h (Parked)'}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Traveled Route Segment (Solid Lime Line) */}
          <Polyline
            positions={completedPolyline}
            pathOptions={{
              color: '#536600',
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
            }}
          />

          {/* Remaining Route Segment (Dashed Charcoal Line) */}
          {remainingPolyline.length > 1 && (
            <Polyline
              positions={remainingPolyline}
              pathOptions={{
                color: '#66717D',
                weight: 3,
                dashArray: '6, 8',
                opacity: 0.8,
              }}
            />
          )}

          <FitBoundsHelper positions={allPositions} />
        </MapContainer>

        {/* Live Telemetry Overlay Badge */}
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#66717D]/20 shadow-md flex items-center gap-2.5 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="flex flex-col">
            <span className="font-bold text-[#111820]">
              {isOnRoad ? currentWp.name : 'GPS Hub Lock'}
            </span>
            <span className="text-[10px] text-[#66717D] font-mono">
              Lat {vehicleCoords[0].toFixed(4)}°, Lng {vehicleCoords[1].toFixed(4)}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
