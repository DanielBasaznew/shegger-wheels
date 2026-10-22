/**
 * Shegger Wheels — Owner Fleet & Vehicle Listing Engine
 * 
 * Implements vehicle listing creation, field-level validations,
 * owner authorization boundaries, blackout date management, and
 * fleet metrics calculation.
 */

import { Car, CarStatus, UserRole } from './types';
import { getCars, getCarById, saveCar, getUserById, getCurrentSession } from './storage';
import { formatDateString } from './bookings';

// ==========================================
// Types & Interfaces
// ==========================================

export interface CreateCarListingInput {
  make: string;
  model: string;
  year: number;
  transmission: 'Automatic' | 'Manual';
  seats: number;
  fuelType?: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  city?: 'Addis Ababa';
  neighbourhood: string;
  pricePerDay: number;
  description: string;
  features: string[];
  photos: string[];
  featuredImage?: string;
}

export interface UpdateCarListingInput {
  make?: string;
  model?: string;
  year?: number;
  transmission?: 'Automatic' | 'Manual';
  seats?: number;
  fuelType?: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  neighbourhood?: string;
  pricePerDay?: number;
  description?: string;
  features?: string[];
  photos?: string[];
  featuredImage?: string;
  status?: CarStatus;
  rejectionReason?: string;
  unavailableDates?: string[];
}

export interface ModerateCarInput {
  action: 'approve' | 'reject';
  reason?: string; // Required when action is 'reject'
  notes?: string;
}

export interface AdminModerationMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inactive: number;
  pendingCars: Car[];
}

export interface FleetMetrics {
  total: number;
  approved: number;
  pending: number;
  inactive: number;
  rejected: number;
}

export interface FleetOperationResult {
  success: boolean;
  car?: Car;
  error?: string;
}

// Preset Neighbourhood Coordinates in Addis Ababa
const NEIGHBOURHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  Bole: { lat: 8.9981, lng: 38.7845 },
  Kazanchis: { lat: 9.0185, lng: 38.7667 },
  CMC: { lat: 9.0234, lng: 38.8312 },
  Sarbet: { lat: 8.9892, lng: 38.7429 },
  'Old Airport': { lat: 8.9781, lng: 38.7354 },
  Piassa: { lat: 9.0345, lng: 38.7512 },
  Lideta: { lat: 9.0112, lng: 38.7391 },
  Mexico: { lat: 9.0105, lng: 38.7456 },
  Gerji: { lat: 8.9821, lng: 38.8123 },
  Megenagna: { lat: 9.0215, lng: 38.8021 },
  'Bisrate Gabriel': { lat: 8.9845, lng: 38.7321 },
};

export const ADDIS_NEIGHBOURHOODS = [
  'Bole',
  'Kazanchis',
  'CMC',
  'Sarbet',
  'Old Airport',
  'Piassa',
  'Lideta',
  'Mexico',
  'Gerji',
  'Megenagna',
  'Bisrate Gabriel',
];

export const VEHICLE_FEATURE_OPTIONS = [
  'Air Conditioning',
  'Bluetooth & USB',
  'Backup Camera',
  'Leather Seats',
  'Four-Wheel Drive',
  'Panoramic Sunroof',
  'Roof Rack',
  'Touchscreen Cockpit',
  'GPS Navigation',
  'Parking Sensors',
  '100% Electric',
  'Cruise Control',
];

// Curated Demo Photo Presets for Quick Selection
export const DEMO_PHOTO_PRESETS = [
  {
    label: 'Toyota Land Cruiser Prado TXL (Graphite Grey)',
    url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Toyota RAV4 Hybrid (Silver Metallic)',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Hyundai Tucson Limited (Silver)',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Suzuki Dzire GLX Sedan (White)',
    url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Volkswagen ID.4 Pro EV (Electric Blue)',
    url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Toyota Corolla Prestige (Charcoal)',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Mitsubishi Pajero Sport 4WD (Black)',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Hyundai Elantra GLS (Pearl Red)',
    url: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&w=1200&q=80',
  },
];

// ==========================================
// Fleet Query Operations
// ==========================================

export function getCarsByOwner(ownerId: string): Car[] {
  return getCars().filter((c) => c.ownerId === ownerId);
}

export function getOwnerFleetMetrics(ownerId: string): FleetMetrics {
  const cars = getCarsByOwner(ownerId);
  return {
    total: cars.length,
    approved: cars.filter((c) => c.status === 'approved').length,
    pending: cars.filter((c) => c.status === 'pending').length,
    inactive: cars.filter((c) => c.status === 'inactive').length,
    rejected: cars.filter((c) => c.status === 'rejected').length,
  };
}

// ==========================================
// Listing Mutations & Validation
// ==========================================

/**
 * Creates and persists a new car listing under the authenticated owner.
 * Newly created listings always start as 'pending' for moderation.
 */
export function createCarListing(
  actor: { userId: string; role: UserRole },
  input: CreateCarListingInput
): FleetOperationResult {
  // 1. Session & Role Verification
  const session = getCurrentSession();
  if (!session || session.userId !== actor.userId) {
    return {
      success: false,
      error: 'Authentication required. Please sign in to create a vehicle listing.',
    };
  }

  const user = getUserById(actor.userId);
  if (!user) {
    return { success: false, error: 'User record not found.' };
  }

  if (user.status === 'suspended') {
    return {
      success: false,
      error: 'Your account is suspended. Vehicle listing creation is prohibited.',
    };
  }

  if (!user.roles.includes('owner')) {
    return {
      success: false,
      error: 'Your account does not possess vehicle owner / host privileges.',
    };
  }

  // 2. Field Validations
  if (!input.make || input.make.trim().length < 2) {
    return { success: false, error: 'Vehicle make is required (min 2 characters).' };
  }
  if (!input.model || input.model.trim().length < 1) {
    return { success: false, error: 'Vehicle model name is required.' };
  }

  const currentYear = new Date().getFullYear();
  if (!input.year || input.year < 1995 || input.year > currentYear + 1) {
    return {
      success: false,
      error: `Vehicle year must be between 1995 and ${currentYear + 1}.`,
    };
  }

  if (input.transmission !== 'Automatic' && input.transmission !== 'Manual') {
    return { success: false, error: 'Transmission must be either Automatic or Manual.' };
  }

  if (!input.seats || input.seats < 2 || input.seats > 16) {
    return { success: false, error: 'Seating capacity must be between 2 and 16 passengers.' };
  }

  if (!input.pricePerDay || input.pricePerDay < 500) {
    return {
      success: false,
      error: 'Daily rental rate must be at least 500 ETB.',
    };
  }

  if (!input.neighbourhood || !input.neighbourhood.trim()) {
    return { success: false, error: 'Please select an Addis Ababa neighbourhood.' };
  }

  if (!input.description || input.description.trim().length < 10) {
    return {
      success: false,
      error: 'Vehicle description must be at least 10 characters.',
    };
  }

  if (!input.features || input.features.length === 0) {
    return { success: false, error: 'Please select at least one vehicle feature.' };
  }

  const photos = input.photos && input.photos.length > 0 ? input.photos : [];
  if (photos.length === 0) {
    return { success: false, error: 'Please provide at least one photo for the vehicle.' };
  }

  // 3. Coordinate Assignment
  const coords = NEIGHBOURHOOD_COORDS[input.neighbourhood] || { lat: 9.01, lng: 38.75 };

  // 4. Create Entity with Protected Ownership & Initial Pending Status
  const now = new Date().toISOString();
  const carId = `car_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  const newCar: Car = {
    id: carId,
    ownerId: user.id, // Strictly bound to authenticated session
    make: input.make.trim(),
    model: input.model.trim(),
    year: Number(input.year),
    transmission: input.transmission,
    seats: Number(input.seats),
    fuelType: input.fuelType || 'Petrol',
    city: 'Addis Ababa',
    neighbourhood: input.neighbourhood.trim(),
    latitude: coords.lat,
    longitude: coords.lng,
    pricePerDay: Math.round(Number(input.pricePerDay)),
    photos,
    featuredImage: input.featuredImage || photos[0],
    description: input.description.trim(),
    features: input.features,
    status: 'pending', // Initial state awaiting admin moderation
    unavailableDates: [],
    createdAt: now,
    updatedAt: now,
  };

  const saved = saveCar(newCar);
  if (!saved) {
    return { success: false, error: 'Failed to write vehicle record to storage.' };
  }

  return { success: true, car: newCar };
}

/**
 * Updates an existing car listing owned by the actor.
 * Prevents unauthorized cross-user modifications and prevents self-approval.
 */
export function updateCarListing(
  carId: string,
  actor: { userId: string; role: UserRole },
  updates: UpdateCarListingInput
): FleetOperationResult {
  const session = getCurrentSession();
  if (!session || session.userId !== actor.userId) {
    return { success: false, error: 'Authentication required to modify vehicle listing.' };
  }

  const user = getUserById(actor.userId);
  if (!user || user.status === 'suspended') {
    return { success: false, error: 'Your account is suspended. Edits are restricted.' };
  }

  const existingCar = getCarById(carId);
  if (!existingCar) {
    return { success: false, error: 'Vehicle listing not found.' };
  }

  // Ownership Check: Actor must own the car or be platform admin
  const isOwner = existingCar.ownerId === actor.userId;
  const isAdmin = actor.role === 'admin';

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: You do not own this vehicle listing.',
    };
  }

  // Self-approval Guard: Owners cannot self-approve pending or rejected cars
  if (updates.status && updates.status === 'approved') {
    if (!isAdmin) {
      if (existingCar.status === 'pending' || existingCar.status === 'rejected') {
        return {
          success: false,
          error: 'Owners cannot self-approve vehicle listings. Moderation must be performed by a platform administrator.',
        };
      }
    } else if (isOwner && (existingCar.status === 'pending' || existingCar.status === 'rejected')) {
      return {
        success: false,
        error: 'Conflict of interest: Administrators cannot approve or moderate their own vehicle listings.',
      };
    }
  }

  // Validate price if updated
  if (updates.pricePerDay !== undefined && updates.pricePerDay < 500) {
    return { success: false, error: 'Daily rental rate must be at least 500 ETB.' };
  }

  // Build updated car preserving immutable identifiers
  const updatedCar: Car = {
    ...existingCar,
    make: updates.make?.trim() ?? existingCar.make,
    model: updates.model?.trim() ?? existingCar.model,
    year: updates.year !== undefined ? Number(updates.year) : existingCar.year,
    transmission: updates.transmission ?? existingCar.transmission,
    seats: updates.seats !== undefined ? Number(updates.seats) : existingCar.seats,
    fuelType: updates.fuelType ?? existingCar.fuelType,
    neighbourhood: updates.neighbourhood?.trim() ?? existingCar.neighbourhood,
    pricePerDay:
      updates.pricePerDay !== undefined
        ? Math.round(Number(updates.pricePerDay))
        : existingCar.pricePerDay,
    description: updates.description?.trim() ?? existingCar.description,
    features: updates.features ?? existingCar.features,
    photos: updates.photos ?? existingCar.photos,
    featuredImage: updates.featuredImage ?? existingCar.featuredImage,
    status: updates.status ?? existingCar.status,
    rejectionReason:
      updates.rejectionReason !== undefined
        ? updates.rejectionReason
        : existingCar.rejectionReason,
    unavailableDates: updates.unavailableDates ?? existingCar.unavailableDates,
    updatedAt: new Date().toISOString(),
  };

  // If neighbourhood changed, update coordinates
  if (updates.neighbourhood && updates.neighbourhood !== existingCar.neighbourhood) {
    const coords = NEIGHBOURHOOD_COORDS[updates.neighbourhood] || { lat: 9.01, lng: 38.75 };
    updatedCar.latitude = coords.lat;
    updatedCar.longitude = coords.lng;
  }

  const saved = saveCar(updatedCar);
  if (!saved) {
    return { success: false, error: 'Storage failure: Failed to update vehicle listing.' };
  }

  return { success: true, car: updatedCar };
}

/**
 * Toggles an approved car between active (approved) and paused (inactive).
 * Rejects toggling pending or rejected cars.
 */
export function toggleCarListingActive(
  carId: string,
  actor: { userId: string; role: UserRole }
): FleetOperationResult {
  const car = getCarById(carId);
  if (!car) {
    return { success: false, error: 'Vehicle listing not found.' };
  }

  if (car.ownerId !== actor.userId && actor.role !== 'admin') {
    return { success: false, error: 'Unauthorized: You do not own this vehicle.' };
  }

  if (car.status === 'pending') {
    return {
      success: false,
      error: 'Pending listings cannot be activated until approved by an administrator.',
    };
  }

  if (car.status === 'rejected') {
    return {
      success: false,
      error: 'Rejected listings cannot be activated.',
    };
  }

  const newStatus: CarStatus = car.status === 'approved' ? 'inactive' : 'approved';
  return updateCarListing(carId, actor, { status: newStatus });
}

/**
 * Updates an owner's vehicle blackout / unavailable dates.
 * Validates date formats and prevents past or malformed entries.
 */
export function updateCarBlackoutDates(
  carId: string,
  actor: { userId: string; role: UserRole },
  dates: string[]
): FleetOperationResult {
  const car = getCarById(carId);
  if (!car) {
    return { success: false, error: 'Vehicle listing not found.' };
  }

  if (car.ownerId !== actor.userId && actor.role !== 'admin') {
    return { success: false, error: 'Unauthorized: You do not own this vehicle.' };
  }

  const todayStr = formatDateString(new Date());

  // Validate dates: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  for (const d of dates) {
    if (!dateRegex.test(d)) {
      return {
        success: false,
        error: `Invalid date format "${d}". Must be YYYY-MM-DD.`,
      };
    }
    const parsed = new Date(d + 'T00:00:00');
    if (isNaN(parsed.getTime())) {
      return { success: false, error: `Invalid date "${d}".` };
    }
    if (d < todayStr) {
      return {
        success: false,
        error: `Blackout date "${d}" cannot be in the past.`,
      };
    }
  }

  // Deduplicate and sort
  const cleanDates = Array.from(new Set(dates)).sort();
  return updateCarListing(carId, actor, { unavailableDates: cleanDates });
}

// ==========================================
// Admin Listing Moderation Engine
// ==========================================

/**
 * Moderates a vehicle listing (approval or rejection with mandatory reason).
 * 
 * Security and Integrity Rules:
 * 1. Actor must have an active session with role 'admin'.
 * 2. Actor account must not be suspended.
 * 3. Self-moderation conflict of interest: Admins cannot moderate listings for vehicles they own.
 * 4. Rejection requires a non-empty descriptive reason (minimum 5 characters).
 * 5. Approving a vehicle clears any existing rejection reason and sets status to 'approved'.
 * 6. Preserves vehicle ownership (ownerId), specifications, pricing snapshot integrity, and existing bookings.
 */
export function moderateCarListing(
  carId: string,
  adminActor: { userId: string; role: UserRole },
  input: ModerateCarInput
): FleetOperationResult {
  // 1. Session check
  const session = getCurrentSession();
  if (!session || session.userId !== adminActor.userId) {
    return { success: false, error: 'Authentication required to moderate vehicle listings.' };
  }

  // 2. Role validation: Must have admin role
  if (adminActor.role !== 'admin' || session.activeRole !== 'admin') {
    return {
      success: false,
      error: 'Unauthorized: Only platform administrators can moderate vehicle listings.',
    };
  }

  // 3. User status check
  const user = getUserById(adminActor.userId);
  if (!user || user.status === 'suspended') {
    return { success: false, error: 'Your account is suspended. Administrative operations are restricted.' };
  }

  // 4. Retrieve vehicle
  const car = getCarById(carId);
  if (!car) {
    return { success: false, error: 'Vehicle listing not found.' };
  }

  // 5. Conflict of interest guard: cannot moderate own vehicle
  if (car.ownerId === adminActor.userId) {
    return {
      success: false,
      error: 'Conflict of interest: Administrators cannot approve or moderate their own vehicle listings.',
    };
  }

  // 6. Action specific validation
  if (input.action === 'reject') {
    if (!input.reason || input.reason.trim().length < 5) {
      return {
        success: false,
        error: 'A detailed rejection reason (at least 5 characters) is required when rejecting a listing.',
      };
    }
  }

  const now = new Date().toISOString();
  const updatedCar: Car = {
    ...car,
    status: input.action === 'approve' ? 'approved' : 'rejected',
    rejectionReason: input.action === 'reject' ? input.reason!.trim() : undefined,
    moderatedAt: now,
    moderatedBy: adminActor.userId,
    updatedAt: now,
  };

  const saved = saveCar(updatedCar);
  if (!saved) {
    return { success: false, error: 'Storage failure: Failed to save moderation decision.' };
  }

  return { success: true, car: updatedCar };
}

/**
 * Calculates aggregate vehicle metrics across the entire platform for the admin moderation portal.
 */
export function getAdminModerationMetrics(allCarsInput?: Car[]): AdminModerationMetrics {
  const cars = allCarsInput || getCars();
  const pending = cars.filter((c) => c.status === 'pending');
  const approved = cars.filter((c) => c.status === 'approved');
  const rejected = cars.filter((c) => c.status === 'rejected');
  const inactive = cars.filter((c) => c.status === 'inactive');

  return {
    total: cars.length,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    inactive: inactive.length,
    pendingCars: pending,
  };
}
