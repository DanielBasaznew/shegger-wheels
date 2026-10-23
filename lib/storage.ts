/**
 * Shegger Wheels — Browser Storage Layer
 * 
 * Safe, resilient localStorage and sessionStorage abstraction matching
 * the capstone specification for the Shegger Wheels frontend marketplace.
 * 
 * Rules:
 * 1. Safe on server: Never touches window or storage APIs during SSR.
 * 2. Versioned keys: Uses sw_*_v1 keys for forward compatibility.
 * 3. Graceful recovery: Recovers from malformed JSON or empty values with fallbacks.
 * 4. Idempotent seeding: Seeds demo data on first client visit without overwriting user state on reload.
 */

import {
  User,
  Car,
  Booking,
  Review,
  Dispute,
  Announcement,
  Notification,
  DemoSession,
  CheckoutDraft,
} from './types';
import {
  SEED_USERS,
  SEED_CARS,
  SEED_BOOKINGS,
  SEED_REVIEWS,
  SEED_DISPUTES,
  SEED_ANNOUNCEMENTS,
  SEED_NOTIFICATIONS,
} from './seeds';

// ==========================================
// Storage Keys
// ==========================================

export const STORAGE_KEYS = {
  USERS: 'sw_users_v1',
  CARS: 'sw_cars_v1',
  BOOKINGS: 'sw_bookings_v1',
  REVIEWS: 'sw_reviews_v1',
  DISPUTES: 'sw_disputes_v1',
  ANNOUNCEMENTS: 'sw_announcements_v1',
  NOTIFICATIONS: 'sw_notifications_v1',
} as const;

export const SESSION_KEYS = {
  SESSION: 'sw_session_v1',
  CHECKOUT_DRAFT: 'sw_checkout_draft_v1',
} as const;

// ==========================================
// SSR & Environment Utilities
// ==========================================

/**
 * Returns true if running in a client environment where window and localStorage exist.
 */
export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  );
}

// ==========================================
// Low-Level Safe Storage Operations
// ==========================================

/**
 * Safely reads and parses a JSON value from localStorage.
 * Returns the fallback value if in SSR, if key is missing, or if value is malformed.
 */
export function readStorage<T>(
  key: string,
  fallback: T,
  validator?: (value: unknown) => value is T
): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw.trim() === '') return fallback;

    const parsed = JSON.parse(raw) as unknown;

    if (validator && !validator(parsed)) {
      console.warn(`[Shegger Storage] Data at key "${key}" failed validation. Reverting to fallback.`);
      return fallback;
    }

    return parsed as T;
  } catch (error) {
    console.warn(`[Shegger Storage] Failed to read key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely serializes and saves a value to localStorage.
 * Handles storage quota exceptions and non-browser environments.
 */
export function writeStorage<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    try {
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { key } }));
    } catch {
      window.dispatchEvent(new Event('shegger-storage-change'));
    }
    return true;
  } catch (error) {
    console.error(`[Shegger Storage] Failed to write key "${key}":`, error);
    return false;
  }
}

/**
 * Safely removes a key from localStorage.
 */
export function removeStorage(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
    try {
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { key } }));
    } catch {
      window.dispatchEvent(new Event('shegger-storage-change'));
    }
  } catch (error) {
    console.warn(`[Shegger Storage] Failed to remove key "${key}":`, error);
  }
}

/**
 * Safely reads and parses a JSON value from sessionStorage.
 */
export function readSession<T>(
  key: string,
  fallback: T,
  validator?: (value: unknown) => value is T
): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null || raw.trim() === '') return fallback;

    const parsed = JSON.parse(raw) as unknown;

    if (validator && !validator(parsed)) {
      console.warn(`[Shegger Storage] Session data at key "${key}" failed validation.`);
      return fallback;
    }

    return parsed as T;
  } catch (error) {
    console.warn(`[Shegger Storage] Failed to read session key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely serializes and saves a value to sessionStorage.
 */
export function writeSession<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;

  try {
    const serialized = JSON.stringify(value);
    window.sessionStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[Shegger Storage] Failed to write session key "${key}":`, error);
    return false;
  }
}

/**
 * Safely removes a key from sessionStorage.
 */
export function removeSession(key: string): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Shegger Storage] Failed to remove session key "${key}":`, error);
  }
}

// ==========================================
// Validation Helpers
// ==========================================

function isArrayWithItems<T>(value: unknown, itemCheck: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(itemCheck);
}

function isUser(item: unknown): item is User {
  if (!item || typeof item !== 'object') return false;
  const u = item as Partial<User>;
  return (
    typeof u.id === 'string' &&
    typeof u.name === 'string' &&
    typeof u.email === 'string' &&
    Array.isArray(u.roles) &&
    (u.status === 'active' || u.status === 'suspended')
  );
}

function isCar(item: unknown): item is Car {
  if (!item || typeof item !== 'object') return false;
  const c = item as Partial<Car>;
  return (
    typeof c.id === 'string' &&
    typeof c.ownerId === 'string' &&
    typeof c.make === 'string' &&
    typeof c.model === 'string' &&
    typeof c.pricePerDay === 'number' &&
    typeof c.status === 'string'
  );
}

function isBooking(item: unknown): item is Booking {
  if (!item || typeof item !== 'object') return false;
  const b = item as Partial<Booking>;
  return (
    typeof b.id === 'string' &&
    typeof b.carId === 'string' &&
    typeof b.renterId === 'string' &&
    typeof b.ownerId === 'string' &&
    typeof b.startDate === 'string' &&
    typeof b.endDate === 'string' &&
    typeof b.pricePerDay === 'number' &&
    typeof b.total === 'number' &&
    typeof b.status === 'string'
  );
}

function isReview(item: unknown): item is Review {
  if (!item || typeof item !== 'object') return false;
  const r = item as Partial<Review>;
  return (
    typeof r.id === 'string' &&
    typeof r.bookingId === 'string' &&
    typeof r.carId === 'string' &&
    typeof r.renterId === 'string' &&
    typeof r.rating === 'number' &&
    typeof r.comment === 'string'
  );
}

function isDispute(item: unknown): item is Dispute {
  if (!item || typeof item !== 'object') return false;
  const d = item as Partial<Dispute>;
  return (
    typeof d.id === 'string' &&
    typeof d.bookingId === 'string' &&
    typeof d.openedBy === 'string' &&
    typeof d.status === 'string'
  );
}

function isAnnouncement(item: unknown): item is Announcement {
  if (!item || typeof item !== 'object') return false;
  const a = item as Partial<Announcement>;
  return (
    typeof a.id === 'string' &&
    typeof a.title === 'string' &&
    typeof a.message === 'string' &&
    typeof a.active === 'boolean'
  );
}

function isNotification(item: unknown): item is Notification {
  if (!item || typeof item !== 'object') return false;
  const n = item as Partial<Notification>;
  return (
    typeof n.id === 'string' &&
    typeof n.recipientId === 'string' &&
    typeof n.type === 'string' &&
    typeof n.title === 'string' &&
    typeof n.message === 'string' &&
    typeof n.link === 'string' &&
    typeof n.read === 'boolean' &&
    typeof n.createdAt === 'string'
  );
}

function isDemoSession(item: unknown): item is DemoSession {
  if (!item || typeof item !== 'object') return false;
  const s = item as Partial<DemoSession>;
  return (
    typeof s.userId === 'string' &&
    s.userId.trim().length > 0 &&
    (s.activeRole === 'renter' || s.activeRole === 'owner' || s.activeRole === 'admin') &&
    typeof s.signedInAt === 'string'
  );
}

// ==========================================
// Seed Data Initialization
// ==========================================

/**
 * Initializes persistent demo data in localStorage if keys are missing or empty.
 * Never overwrites existing valid user records unless forceReset is explicitly set to true.
 */
export function initializeDemoData(forceReset = false): void {
  if (!isBrowser()) return;

  const usersMissing = !window.localStorage.getItem(STORAGE_KEYS.USERS);
  const carsMissing = !window.localStorage.getItem(STORAGE_KEYS.CARS);

  if (forceReset || usersMissing || carsMissing) {
    if (forceReset || usersMissing) {
      writeStorage(STORAGE_KEYS.USERS, SEED_USERS);
    }
    if (forceReset || carsMissing) {
      writeStorage(STORAGE_KEYS.CARS, SEED_CARS);
    }
    if (forceReset || !window.localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      writeStorage(STORAGE_KEYS.BOOKINGS, SEED_BOOKINGS);
    }
    if (forceReset || !window.localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      writeStorage(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
    }
    if (forceReset || !window.localStorage.getItem(STORAGE_KEYS.DISPUTES)) {
      writeStorage(STORAGE_KEYS.DISPUTES, SEED_DISPUTES);
    }
    if (forceReset || !window.localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
    }
    if (forceReset || !window.localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      writeStorage(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    }
  }
}

/**
 * Clears demo records and restores clean baseline seed data.
 */
export function resetDemoData(): void {
  if (!isBrowser()) return;
  initializeDemoData(true);
  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('shegger-notification-change'));
    window.dispatchEvent(new Event('shegger-storage-change'));
    window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'all' } }));
  } catch (error) {
    console.warn('[Shegger Storage] Failed to dispatch reset events:', error);
  }
}

// ==========================================
// High-Level Entity Data Access Methods
// ==========================================

// Users
export function getUsers(): User[] {
  return readStorage<User[]>(
    STORAGE_KEYS.USERS,
    SEED_USERS,
    (v): v is User[] => isArrayWithItems(v, isUser)
  );
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function saveUser(user: User): boolean {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    users[index] = { ...user, updatedAt: new Date().toISOString() };
  } else {
    users.push(user);
  }
  return writeStorage(STORAGE_KEYS.USERS, users);
}

// Cars
export function getCars(): Car[] {
  return readStorage<Car[]>(
    STORAGE_KEYS.CARS,
    SEED_CARS,
    (v): v is Car[] => isArrayWithItems(v, isCar)
  );
}

export function getCarById(id: string): Car | undefined {
  return getCars().find((c) => c.id === id);
}

export function saveCar(car: Car): boolean {
  const cars = getCars();
  const index = cars.findIndex((c) => c.id === car.id);
  if (index >= 0) {
    cars[index] = { ...car, updatedAt: new Date().toISOString() };
  } else {
    cars.push(car);
  }
  return writeStorage(STORAGE_KEYS.CARS, cars);
}

// Bookings
export function getBookings(): Booking[] {
  return readStorage<Booking[]>(
    STORAGE_KEYS.BOOKINGS,
    SEED_BOOKINGS,
    (v): v is Booking[] => isArrayWithItems(v, isBooking)
  );
}

export function getBookingById(id: string): Booking | undefined {
  return getBookings().find((b) => b.id === id);
}

export function saveBooking(booking: Booking): boolean {
  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === booking.id);
  if (index >= 0) {
    bookings[index] = { ...booking, updatedAt: new Date().toISOString() };
  } else {
    bookings.push(booking);
  }
  return writeStorage(STORAGE_KEYS.BOOKINGS, bookings);
}

// Reviews
export function getReviews(): Review[] {
  return readStorage<Review[]>(
    STORAGE_KEYS.REVIEWS,
    SEED_REVIEWS,
    (v): v is Review[] => isArrayWithItems(v, isReview)
  );
}

export function getReviewsForCar(carId: string): Review[] {
  return getReviews().filter((r) => r.carId === carId);
}

export function saveReview(review: Review): boolean {
  const reviews = getReviews();
  const index = reviews.findIndex((r) => r.id === review.id);
  if (index >= 0) {
    reviews[index] = review;
  } else {
    reviews.push(review);
  }
  return writeStorage(STORAGE_KEYS.REVIEWS, reviews);
}

// Disputes
export function getDisputes(): Dispute[] {
  return readStorage<Dispute[]>(
    STORAGE_KEYS.DISPUTES,
    SEED_DISPUTES,
    (v): v is Dispute[] => isArrayWithItems(v, isDispute)
  );
}

export function getDisputeById(id: string): Dispute | undefined {
  return getDisputes().find((d) => d.id === id);
}

export function saveDispute(dispute: Dispute): boolean {
  const disputes = getDisputes();
  const index = disputes.findIndex((d) => d.id === dispute.id);
  if (index >= 0) {
    disputes[index] = dispute;
  } else {
    disputes.push(dispute);
  }
  return writeStorage(STORAGE_KEYS.DISPUTES, disputes);
}

// Announcements
export function getAnnouncements(): Announcement[] {
  return readStorage<Announcement[]>(
    STORAGE_KEYS.ANNOUNCEMENTS,
    SEED_ANNOUNCEMENTS,
    (v): v is Announcement[] => isArrayWithItems(v, isAnnouncement)
  );
}

export function saveAnnouncement(announcement: Announcement): boolean {
  const announcements = getAnnouncements();
  const index = announcements.findIndex((a) => a.id === announcement.id);
  if (index >= 0) {
    announcements[index] = announcement;
  } else {
    announcements.push(announcement);
  }
  return writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
}

// Notifications
export function getNotifications(): Notification[] {
  return readStorage<Notification[]>(
    STORAGE_KEYS.NOTIFICATIONS,
    SEED_NOTIFICATIONS,
    (v): v is Notification[] => isArrayWithItems(v, isNotification)
  );
}

export function getNotificationsForUser(userId: string): Notification[] {
  if (!userId || typeof userId !== 'string') return [];

  // Tenant Isolation Security Barrier: If an active session is in browser,
  // callers may only access their own notifications unless they possess the platform admin role.
  const session = getCurrentSession();
  if (session && session.userId !== userId) {
    const user = getUserById(session.userId);
    if (!user || (!user.roles.includes('admin') && session.activeRole !== 'admin')) {
      return [];
    }
  }

  return getNotifications()
    .filter((n) => n.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveNotification(notification: Notification): boolean {
  const list = getNotifications();
  const index = list.findIndex((n) => n.id === notification.id);
  if (index >= 0) {
    list[index] = notification;
  } else {
    list.unshift(notification); // Add new notifications to front
  }
  const saved = writeStorage(STORAGE_KEYS.NOTIFICATIONS, list);
  if (saved && isBrowser()) {
    try {
      window.dispatchEvent(new Event('shegger-notification-change'));
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'notifications' } }));
    } catch {
      // Ignore in non-standard environments
    }
  }
  return saved;
}

export function markNotificationAsRead(id: string, userId: string): boolean {
  if (!id || !userId) return false;

  // Authorization barrier: must have active, non-suspended session matching recipient or admin
  const session = getCurrentSession();
  if (!session) return false;
  const user = getUserById(session.userId);
  if (!user || user.status === 'suspended') return false;
  if (session.userId !== userId && !user.roles.includes('admin') && session.activeRole !== 'admin') {
    return false;
  }

  const list = getNotifications();
  const index = list.findIndex((n) => n.id === id && n.recipientId === userId);
  if (index < 0) return false;
  list[index] = { ...list[index], read: true };
  const saved = writeStorage(STORAGE_KEYS.NOTIFICATIONS, list);
  if (saved && isBrowser()) {
    try {
      window.dispatchEvent(new Event('shegger-notification-change'));
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'notifications' } }));
    } catch {
      // Ignore
    }
  }
  return saved;
}

export function markAllNotificationsAsRead(userId: string): boolean {
  if (!userId) return false;

  // Authorization barrier: must have active, non-suspended session matching recipient or admin
  const session = getCurrentSession();
  if (!session) return false;
  const user = getUserById(session.userId);
  if (!user || user.status === 'suspended') return false;
  if (session.userId !== userId && !user.roles.includes('admin') && session.activeRole !== 'admin') {
    return false;
  }

  const list = getNotifications();
  let modified = false;
  const updated = list.map((n) => {
    if (n.recipientId === userId && !n.read) {
      modified = true;
      return { ...n, read: true };
    }
    return n;
  });
  if (!modified) return true;
  const saved = writeStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  if (saved && isBrowser()) {
    try {
      window.dispatchEvent(new Event('shegger-notification-change'));
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'notifications' } }));
    } catch {
      // Ignore
    }
  }
  return saved;
}

export function deleteNotification(id: string, userId: string): boolean {
  if (!id || !userId) return false;

  // Authorization barrier: must have active, non-suspended session matching recipient or admin
  const session = getCurrentSession();
  if (!session) return false;
  const user = getUserById(session.userId);
  if (!user || user.status === 'suspended') return false;
  if (session.userId !== userId && !user.roles.includes('admin') && session.activeRole !== 'admin') {
    return false;
  }

  const list = getNotifications();
  const filtered = list.filter((n) => !(n.id === id && n.recipientId === userId));
  if (filtered.length === list.length) return false;
  const saved = writeStorage(STORAGE_KEYS.NOTIFICATIONS, filtered);
  if (saved && isBrowser()) {
    try {
      window.dispatchEvent(new Event('shegger-notification-change'));
      window.dispatchEvent(new CustomEvent('shegger-storage-change', { detail: { entity: 'notifications' } }));
    } catch {
      // Ignore
    }
  }
  return saved;
}

// ==========================================
// Session State Access Methods (sessionStorage)
// ==========================================

export function getCurrentSession(): DemoSession | null {
  return readSession<DemoSession | null>(SESSION_KEYS.SESSION, null, isDemoSession);
}

export function setCurrentSession(session: DemoSession): boolean {
  const result = writeSession(SESSION_KEYS.SESSION, session);
  if (result && isBrowser()) {
    try {
      window.dispatchEvent(new Event('shegger-session-change'));
    } catch {
      // Ignore if event constructor fails in non-standard environments
    }
  }
  return result;
}

export function clearCurrentSession(): void {
  removeSession(SESSION_KEYS.SESSION);
  if (isBrowser()) {
    try {
      window.dispatchEvent(new Event('shegger-session-change'));
    } catch {
      // Ignore if event constructor fails in non-standard environments
    }
  }
}

// ==========================================
// Checkout Draft Access Methods (sessionStorage)
// ==========================================

export function getCheckoutDraft(): CheckoutDraft | null {
  return readSession<CheckoutDraft | null>(SESSION_KEYS.CHECKOUT_DRAFT, null);
}

export function setCheckoutDraft(draft: CheckoutDraft): boolean {
  return writeSession(SESSION_KEYS.CHECKOUT_DRAFT, draft);
}

export function clearCheckoutDraft(): void {
  removeSession(SESSION_KEYS.CHECKOUT_DRAFT);
}
