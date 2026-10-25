import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Car, Booking, Review, Dispute, Notification, User } from './types';
import {
  SEED_CARS,
  SEED_BOOKINGS,
  SEED_REVIEWS,
  SEED_DISPUTES,
  SEED_NOTIFICATIONS,
  SEED_USERS,
} from './seeds';

const DATA_DIR = path.join(os.tmpdir(), 'shegger_wheels_data');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore error in read-only environments
  }
}

function readJsonFile<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (parsed !== null && parsed !== undefined) {
          return parsed as T;
        }
      }
    }
  } catch {
    // Safe fallback on file read error
  }
  return fallback;
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Safe no-op on write failure
  }
}

// ==========================================
// Cars / Fleet Server Store
// ==========================================

export function getServerCars(): Car[] {
  return readJsonFile<Car[]>('cars.json', SEED_CARS);
}

export function saveServerCars(cars: Car[]): void {
  writeJsonFile('cars.json', cars);
}

export function getServerCarById(id: string): Car | undefined {
  return getServerCars().find((c) => c.id === id);
}

export function updateServerCar(car: Car): void {
  const cars = getServerCars();
  const idx = cars.findIndex((c) => c.id === car.id);
  if (idx >= 0) {
    cars[idx] = { ...car, updatedAt: new Date().toISOString() };
  } else {
    cars.push(car);
  }
  saveServerCars(cars);
}

// ==========================================
// Bookings Server Store
// ==========================================

export function getServerBookings(): Booking[] {
  return readJsonFile<Booking[]>('bookings.json', SEED_BOOKINGS);
}

export function saveServerBookings(bookings: Booking[]): void {
  writeJsonFile('bookings.json', bookings);
}

export function getServerBookingById(id: string): Booking | undefined {
  return getServerBookings().find((b) => b.id === id);
}

export function updateServerBooking(booking: Booking): void {
  const bookings = getServerBookings();
  const idx = bookings.findIndex((b) => b.id === booking.id);
  if (idx >= 0) {
    bookings[idx] = { ...booking, updatedAt: new Date().toISOString() };
  } else {
    bookings.push(booking);
  }
  saveServerBookings(bookings);
}

// ==========================================
// Reviews Server Store
// ==========================================

export function getServerReviews(): Review[] {
  return readJsonFile<Review[]>('reviews.json', SEED_REVIEWS);
}

export function saveServerReviews(reviews: Review[]): void {
  writeJsonFile('reviews.json', reviews);
}

// ==========================================
// Disputes Server Store
// ==========================================

export function getServerDisputes(): Dispute[] {
  return readJsonFile<Dispute[]>('disputes.json', SEED_DISPUTES);
}

export function saveServerDisputes(disputes: Dispute[]): void {
  writeJsonFile('disputes.json', disputes);
}

// ==========================================
// Notifications Server Store
// ==========================================

export function getServerNotifications(): Notification[] {
  return readJsonFile<Notification[]>('notifications.json', SEED_NOTIFICATIONS);
}

export function saveServerNotifications(notifications: Notification[]): void {
  writeJsonFile('notifications.json', notifications);
}

// ==========================================
// Users Server Store
// ==========================================

export function getServerUsers(): User[] {
  return readJsonFile<User[]>('users.json', SEED_USERS);
}

export function saveServerUsers(users: User[]): void {
  writeJsonFile('users.json', users);
}

export function resetServerStore(): void {
  saveServerCars(SEED_CARS);
  saveServerBookings(SEED_BOOKINGS);
  saveServerReviews(SEED_REVIEWS);
  saveServerDisputes(SEED_DISPUTES);
  saveServerNotifications(SEED_NOTIFICATIONS);
  saveServerUsers(SEED_USERS);
}
