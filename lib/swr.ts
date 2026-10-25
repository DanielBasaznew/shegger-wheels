'use client';

/**
 * Shegger Wheels — Reactive SWR Data Layer & Cache Manager
 * 
 * Provides reactive data fetching, automatic cross-tab synchronization,
 * and 1-hour cache validation (Stale-While-Revalidate) matching the capstone
 * offline-first/localStorage architecture.
 */

import useSWR, { mutate, SWRConfiguration } from 'swr';
import { useEffect, useState } from 'react';
import {
  Car,
  Booking,
  Review,
  Dispute,
  Notification,
  DemoSession,
  User,
} from './types';
import {
  getUsers,
  getCars,
  getCarById,
  getBookings,
  getBookingById,
  getReviews,
  getReviewsForCar,
  getDisputes,
  getDisputeById,
  getNotifications,
  getNotificationsForUser,
  getCurrentSession,
  getUserById,
  isBrowser,
  STORAGE_KEYS,
  SESSION_KEYS,
  readStorage,
  writeSession,
  removeSession,
  isDemoSession,
} from './storage';
import {
  SEED_USERS,
  SEED_CARS,
  SEED_BOOKINGS,
  SEED_REVIEWS,
  SEED_DISPUTES,
  SEED_NOTIFICATIONS,
} from './seeds';

// ==========================================
// 1-Hour Validation Cache Configuration
// ==========================================

export const ONE_HOUR_MS = 60 * 60 * 1000; // 3,600,000 ms = 1 hour cache validation

export const DEFAULT_SWR_OPTIONS: SWRConfiguration = {
  dedupingInterval: ONE_HOUR_MS, // 1 hour validation deduping
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  keepPreviousData: true,
};

// ==========================================
// Cross-Tab & Same-Tab Reactive Synchronizer
// ==========================================

if (typeof window !== 'undefined') {
  // Listen to same-window storage mutation events dispatched by storage.ts
  window.addEventListener('shegger-storage-change', ((e: CustomEvent<{ key?: string; entity?: string }>) => {
    const entity = e.detail?.entity;
    if (entity) {
      mutate(`shegger:${entity}`);
      if (entity === 'cars') mutate((k) => typeof k === 'string' && k.startsWith('shegger:car'));
      if (entity === 'bookings') mutate((k) => typeof k === 'string' && k.startsWith('shegger:booking'));
      if (entity === 'reviews') mutate((k) => typeof k === 'string' && k.startsWith('shegger:reviews'));
      if (entity === 'disputes') mutate((k) => typeof k === 'string' && k.startsWith('shegger:dispute'));
      if (entity === 'notifications') mutate((k) => typeof k === 'string' && k.startsWith('shegger:notification'));
      if (entity === 'session') mutate('shegger:session');
    } else {
      mutate(() => true);
    }
  }) as EventListener);

  // Listen to cross-tab storage mutation events from other windows
  window.addEventListener('storage', (e: StorageEvent) => {
    if (!e.key) {
      mutate(() => true);
      return;
    }
    if (e.key === STORAGE_KEYS.CARS) {
      mutate('shegger:cars');
      mutate((k) => typeof k === 'string' && k.startsWith('shegger:car'));
    } else if (e.key === STORAGE_KEYS.BOOKINGS) {
      mutate('shegger:bookings');
      mutate((k) => typeof k === 'string' && k.startsWith('shegger:booking'));
    } else if (e.key === STORAGE_KEYS.REVIEWS) {
      mutate('shegger:reviews');
      mutate((k) => typeof k === 'string' && k.startsWith('shegger:reviews'));
    } else if (e.key === STORAGE_KEYS.DISPUTES) {
      mutate('shegger:disputes');
      mutate((k) => typeof k === 'string' && k.startsWith('shegger:dispute'));
    } else if (e.key === STORAGE_KEYS.NOTIFICATIONS) {
      mutate('shegger:notifications');
      mutate((k) => typeof k === 'string' && k.startsWith('shegger:notification'));
    } else if (e.key === STORAGE_KEYS.SESSION) {
      const fromLocal = readStorage<DemoSession | null>(STORAGE_KEYS.SESSION, null, isDemoSession);
      if (fromLocal) {
        writeSession(SESSION_KEYS.SESSION, fromLocal);
      } else {
        removeSession(SESSION_KEYS.SESSION);
      }
      mutate('shegger:session');
    }
  });

  // Listen to zero-latency BroadcastChannel messages
  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('shegger_wheels_sync');
      channel.onmessage = (event) => {
        const entity = event.data?.entity;
        if (entity) {
          if (entity === 'session') {
            const fromLocal = readStorage<DemoSession | null>(STORAGE_KEYS.SESSION, null, isDemoSession);
            if (fromLocal) {
              writeSession(SESSION_KEYS.SESSION, fromLocal);
            } else {
              removeSession(SESSION_KEYS.SESSION);
            }
          }
          mutate(`shegger:${entity}`);
          if (entity === 'cars') mutate((k) => typeof k === 'string' && k.startsWith('shegger:car'));
          if (entity === 'bookings') mutate((k) => typeof k === 'string' && k.startsWith('shegger:booking'));
          if (entity === 'reviews') mutate((k) => typeof k === 'string' && k.startsWith('shegger:reviews'));
          if (entity === 'disputes') mutate((k) => typeof k === 'string' && k.startsWith('shegger:dispute'));
          if (entity === 'notifications') mutate((k) => typeof k === 'string' && k.startsWith('shegger:notification'));
          if (entity === 'session') mutate('shegger:session');
        } else {
          mutate(() => true);
        }
      };
    } catch {
      // Ignore
    }
  }
}

/**
 * Manually trigger revalidation for a specific entity or all cached keys
 */
export function triggerSheggerRevalidation(entity?: string) {
  if (entity) {
    mutate(`shegger:${entity}`);
    if (entity === 'cars') mutate((k) => typeof k === 'string' && k.startsWith('shegger:car'));
    if (entity === 'bookings') mutate((k) => typeof k === 'string' && k.startsWith('shegger:booking'));
    if (entity === 'reviews') mutate((k) => typeof k === 'string' && k.startsWith('shegger:reviews'));
    if (entity === 'disputes') mutate((k) => typeof k === 'string' && k.startsWith('shegger:dispute'));
    if (entity === 'notifications') mutate((k) => typeof k === 'string' && k.startsWith('shegger:notification'));
  } else {
    mutate(() => true);
  }
}

// ==========================================
// Hook: Cars & Fleet
// ==========================================

export function useCars(config?: Partial<SWRConfiguration>) {
  const { data, error, isLoading, mutate: mutateCars } = useSWR<Car[]>(
    'shegger:cars',
    () => getCars(),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: isBrowser() ? getCars() : SEED_CARS,
      ...config,
    }
  );

  const cars = data || [];
  const approvedCars = cars.filter((c) => c.status === 'approved');

  return {
    cars,
    approvedCars,
    isLoading: isLoading && cars.length === 0,
    isError: !!error,
    mutate: mutateCars,
  };
}

export function useCar(carId: string | null | undefined, config?: Partial<SWRConfiguration>) {
  const { data, error, isLoading, mutate: mutateCar } = useSWR<Car | undefined>(
    carId ? `shegger:car:${carId}` : null,
    () => (carId ? getCarById(carId) : undefined),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: carId
        ? isBrowser()
          ? getCarById(carId) || SEED_CARS.find((c) => c.id === carId)
          : SEED_CARS.find((c) => c.id === carId)
        : undefined,
      ...config,
    }
  );

  return {
    car: data,
    isLoading: isLoading && !data,
    isError: !!error,
    mutate: mutateCar,
  };
}

// ==========================================
// Hook: Bookings & Trips
// ==========================================

export function useBookings(config?: Partial<SWRConfiguration>) {
  const { data, error, isLoading, mutate: mutateBookings } = useSWR<Booking[]>(
    'shegger:bookings',
    () => getBookings(),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: isBrowser() ? getBookings() : SEED_BOOKINGS,
      ...config,
    }
  );

  const bookings = data || [];

  return {
    bookings,
    isLoading: isLoading && bookings.length === 0,
    isError: !!error,
    mutate: mutateBookings,
  };
}

export function useBooking(bookingId: string | null | undefined, config?: Partial<SWRConfiguration>) {
  const { data, error, isLoading, mutate: mutateBooking } = useSWR<Booking | undefined>(
    bookingId ? `shegger:booking:${bookingId}` : null,
    () => (bookingId ? getBookingById(bookingId) : undefined),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: bookingId
        ? isBrowser()
          ? getBookingById(bookingId) || SEED_BOOKINGS.find((b) => b.id === bookingId)
          : SEED_BOOKINGS.find((b) => b.id === bookingId)
        : undefined,
      ...config,
    }
  );

  return {
    booking: data,
    isLoading: isLoading && !data,
    isError: !!error,
    mutate: mutateBooking,
  };
}

// ==========================================
// Hook: Reviews
// ==========================================

export function useReviews() {
  const { data, error, isLoading, mutate: mutateReviews } = useSWR<Review[]>(
    'shegger:reviews',
    () => getReviews(),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: isBrowser() ? getReviews() : SEED_REVIEWS,
    }
  );

  const reviews = data || [];

  return {
    reviews,
    isLoading: isLoading && reviews.length === 0,
    isError: !!error,
    mutate: mutateReviews,
  };
}

export function useCarReviews(carId: string | null | undefined) {
  const { data, error, isLoading, mutate: mutateReviews } = useSWR<Review[]>(
    carId ? `shegger:reviews:${carId}` : null,
    () => (carId ? getReviewsForCar(carId) : []),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: carId ? SEED_REVIEWS.filter((r) => r.carId === carId) : [],
    }
  );

  const reviews = data || [];

  return {
    reviews,
    isLoading: isLoading && reviews.length === 0,
    isError: !!error,
    mutate: mutateReviews,
  };
}

// ==========================================
// Hook: Disputes & Mediation
// ==========================================

export function useDisputes() {
  const { data, error, isLoading, mutate: mutateDisputes } = useSWR<Dispute[]>(
    'shegger:disputes',
    () => getDisputes(),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: isBrowser() ? getDisputes() : SEED_DISPUTES,
    }
  );

  const disputes = data || [];

  return {
    disputes,
    isLoading: isLoading && disputes.length === 0,
    isError: !!error,
    mutate: mutateDisputes,
  };
}

export function useDispute(disputeId: string | null | undefined) {
  const { data, error, isLoading, mutate: mutateDispute } = useSWR<Dispute | undefined>(
    disputeId ? `shegger:dispute:${disputeId}` : null,
    () => (disputeId ? getDisputeById(disputeId) : undefined),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: disputeId ? SEED_DISPUTES.find((d) => d.id === disputeId) : undefined,
    }
  );

  return {
    dispute: data,
    isLoading: isLoading && !data,
    isError: !!error,
    mutate: mutateDispute,
  };
}

// ==========================================
// Hook: Notifications
// ==========================================

export function useNotifications(userId?: string | null) {
  const { data, error, isLoading, mutate: mutateNotifs } = useSWR<Notification[]>(
    userId ? `shegger:notifications:${userId}` : 'shegger:notifications',
    () => (userId ? getNotificationsForUser(userId) : getNotifications()),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: isBrowser()
        ? userId
          ? getNotificationsForUser(userId)
          : getNotifications()
        : SEED_NOTIFICATIONS,
    }
  );

  const notifications = data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading: isLoading && notifications.length === 0,
    isError: !!error,
    mutate: mutateNotifs,
  };
}

// ==========================================
// Hook: User Session & Active Role
// ==========================================

export function useSession() {
  const { data: session, mutate: mutateSession } = useSWR<DemoSession | null>(
    'shegger:session',
    () => getCurrentSession(),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: isBrowser() ? getCurrentSession() : null,
    }
  );

  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    if (session?.userId) {
      setUser(getUserById(session.userId));
    } else {
      setUser(undefined);
    }
  }, [session?.userId]);

  return {
    session: session || null,
    user,
    activeRole: session?.activeRole || null,
    isSignedIn: !!session?.userId,
    mutate: mutateSession,
  };
}

// ==========================================
// Hook: Users Registry
// ==========================================

export function useUsers() {
  const { data, error, isLoading, mutate: mutateUsers } = useSWR<User[]>(
    'shegger:users',
    () => getUsers(),
    {
      ...DEFAULT_SWR_OPTIONS,
      fallbackData: isBrowser() ? getUsers() : SEED_USERS,
    }
  );

  return {
    users: data || [],
    isLoading: isLoading && (!data || data.length === 0),
    isError: !!error,
    mutate: mutateUsers,
  };
}

