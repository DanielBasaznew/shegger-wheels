import { Booking, Car } from '@/lib/types';

export interface LeafletTripMapProps {
  booking: Booking;
  car?: Car;
  activeWaypointIndex: number;
  isSimulating: boolean;
  onSelectWaypoint?: (index: number) => void;
}

// Pure data constants for Addis Ababa Geographic Coordinates Reference Matrix [Latitude, Longitude]
// Zero Leaflet imports here ensures 100% SSR safety across Next.js prerendering.

export const ADDIS_COORDINATES: Record<string, [number, number]> = {
  Bole: [8.995, 38.7896],
  Kazanchis: [9.018, 38.77],
  Sarbet: [8.992, 38.732],
  Piassa: [9.035, 38.752],
  'Arat Kilo': [9.034, 38.762],
  Mexico: [9.01, 38.745],
  CMC: [9.02, 38.83],
  Gerji: [8.985, 38.81],
  'Meskel Square': [9.0105, 38.7615],
  Default: [9.0105, 38.7615],
};

// 6 Corridor Telematics Waypoints along Addis Ababa arterial roads
export const TRIP_WAYPOINTS: Array<{
  id: string;
  name: string;
  subcity: string;
  coords: [number, number];
  speedKmH: number;
  statusText: string;
}> = [
  {
    id: 'wp_bole',
    name: 'Bole Medhanialem Corridor',
    subcity: 'Bole Subcity',
    coords: [8.995, 38.7896],
    speedKmH: 45,
    statusText: 'Cruising along Bole Road towards Meskel Square',
  },
  {
    id: 'wp_meskel',
    name: 'Meskel Square Interchange',
    subcity: 'Kirkos Subcity',
    coords: [9.0105, 38.7615],
    speedKmH: 32,
    statusText: 'Navigating central roundabout, normal traffic flow',
  },
  {
    id: 'wp_kazanchis',
    name: 'Kazanchis Business District',
    subcity: 'Kirkos Subcity',
    coords: [9.018, 38.77],
    speedKmH: 28,
    statusText: 'Proceeding along ECA road towards Aware',
  },
  {
    id: 'wp_piassa',
    name: 'Piassa & Churchill Avenue',
    subcity: 'Arada Subcity',
    coords: [9.035, 38.752],
    speedKmH: 38,
    statusText: 'Ascending Churchill Avenue corridor',
  },
  {
    id: 'wp_sarbet',
    name: 'Sarbet & Mexico Square',
    subcity: 'Kirkos Subcity',
    coords: [8.992, 38.732],
    speedKmH: 42,
    statusText: 'Passing South Africa Embassy road towards Gotera',
  },
  {
    id: 'wp_cmc',
    name: 'CMC & Megenagna Arterial',
    subcity: 'Yeka Subcity',
    coords: [9.02, 38.83],
    speedKmH: 52,
    statusText: 'Express transit corridor active',
  },
];
