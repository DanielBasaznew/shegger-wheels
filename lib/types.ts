/**
 * Shegger Wheels — Core TypeScript Definitions
 * 
 * Reusable type definitions matching the capstone specification for the
 * Shegger Wheels peer-to-peer car rental platform in Addis Ababa.
 */

// ==========================================
// User & Authentication Types
// ==========================================

export type UserRole = 'renter' | 'owner' | 'admin';

export type UserAccountStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  /**
   * Roles assigned to the user. Renter and owner roles may coexist
   * on a single account (e.g. ['renter', 'owner']).
   */
  roles: UserRole[];
  status: UserAccountStatus;
  avatarUrl?: string;
  neighbourhood?: string;
  createdAt: string; // ISO date-time string
  updatedAt?: string;
}

export interface DemoSession {
  userId: string;
  activeRole: UserRole;
  signedInAt: string; // ISO date-time string
}

// ==========================================
// Car & Listing Types
// ==========================================

export type CarTransmission = 'Automatic' | 'Manual';

export type CarStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'inactive';

export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';

export interface Car {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  transmission: CarTransmission;
  seats: number;
  fuelType?: FuelType;
  city: 'Addis Ababa';
  neighbourhood: string; // e.g. 'Bole', 'Kazanchis', 'CMC', 'Sarbet', 'Old Airport'
  latitude: number;
  longitude: number;
  pricePerDay: number; // in ETB (Ethiopian Birr)
  photos: string[];
  featuredImage?: string;
  description: string;
  features: string[]; // e.g. ['Air Conditioning', 'Bluetooth', 'Backup Camera']
  status: CarStatus;
  rejectionReason?: string; // Administrative rejection rationale
  moderatedAt?: string; // ISO date-time string of moderation decision
  moderatedBy?: string; // Admin user ID who reviewed the listing
  unavailableDates: string[]; // ISO date strings (YYYY-MM-DD)
  createdAt: string; // ISO date-time string
  updatedAt?: string;
}

// ==========================================
// Booking & Lifecycle Types
// ==========================================

export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'reviewed'
  | 'declined'
  | 'cancelled'
  | 'disputed'
  | 'resolved';

export type PaymentStatus =
  | 'unpaid'
  | 'held_in_escrow'
  | 'paid'
  | 'refunded';

export interface Booking {
  id: string;
  carId: string;
  renterId: string;
  ownerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
  pricePerDay: number; // Snapshot of daily rate agreed at booking time
  subtotal: number; // days * pricePerDay
  fee: number; // Simulated platform service fee
  securityDeposit?: number; // Simulated refundable deposit
  total: number; // subtotal + fee + deposit
  paymentStatus: PaymentStatus;
  paymentMethod?: 'TeleBirr' | 'CBE Birr' | 'Chapa' | 'Cash on Delivery (Simulated)';
  paymentReference?: string; // e.g. 'TB-MOCK-819273'
  status: BookingStatus;
  declineReason?: string;
  cancellationReason?: string;
  disputeReason?: string;
  createdAt: string; // ISO date-time string
  updatedAt: string; // ISO date-time string
}


// ==========================================
// Checkout Draft (sessionStorage)
// ==========================================

export interface CheckoutDraft {
  carId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
  pricePerDay: number;
  subtotal: number;
  fee: number;
  securityDeposit: number;
  total: number;
  pickupLocation: string;
  savedAt: string; // ISO date-time string
}

// ==========================================
// Review Types
// ==========================================

export interface Review {
  id: string;
  bookingId: string;
  carId: string;
  renterId: string;
  ownerId: string;
  rating: number; // Integer between 1 and 5
  comment: string;
  ownerReply?: string;
  ownerReplyAt?: string; // ISO date-time string of host response
  createdAt: string; // ISO date-time string
}

// ==========================================
// Dispute Types
// ==========================================

export type DisputeStatus = 'open' | 'investigating' | 'resolved';

export interface Dispute {
  id: string;
  bookingId: string;
  openedBy: string; // User ID
  openedByRole: 'renter' | 'owner';
  reason: string;
  description: string;
  status: DisputeStatus;
  resolutionNotes?: string;
  resolvedBy?: string; // Admin user ID
  createdAt: string; // ISO date-time string
  resolvedAt?: string; // ISO date-time string
}

// ==========================================
// Announcement Types
// ==========================================

export interface Announcement {
  id: string;
  title: string;
  message: string;
  active: boolean;
  category?: 'info' | 'maintenance' | 'feature';
  createdAt: string; // ISO date-time string
  createdBy: string; // Admin user ID
}

// ==========================================
// Storage Schema Container
// ==========================================

export interface SheggerStorageData {
  users: User[];
  cars: Car[];
  bookings: Booking[];
  reviews: Review[];
  disputes: Dispute[];
  announcements: Announcement[];
}
