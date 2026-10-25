'use client';

/**
 * Shegger Wheels — Reactive SWR Data Layer & Cache Manager
 * 
 * Provides reactive data fetching, automatic cross-tab synchronization,
 * and 1-hour cache validation (Stale-While-Revalidate) matching the capstone
 * offline-first/localStorage architecture.
 */

import useSWR, { mutate, SWRConfiguration } from 'swr';
import { useMemo } from 'react';
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
// Cache & Revalidation Configuration
// ==========================================

export const ONE_HOUR_MS = 60 * 60 * 1000; // 3,600,000 ms cache lifetime baseline

export const DEFAULT_SWR_OPTIONS: SWRConfiguration = {
  dedupingInterval: 2000, // 2s dedupe window prevents duplicate fetches without blocking state transitions
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  keepPreviousData: true,
};

// ==========================================
// Cross-Tab & Same-Tab Reactive Synchronizer
// ==========================================

function syncEntityToCache(entity?: string) {
  if (!entity || entity === 'all') {
    mutate('shegger:cars', getCars(), { revalidate: false });
    mutate('shegger:bookings', getBookings(), { revalidate: false });
    mutate('shegger:reviews', getReviews(), { revalidate: false });
    mutate('shegger:disputes', getDisputes(), { revalidate: false });
    mutate('shegger:notifications', getNotifications(), { revalidate: false });
    mutate('shegger:session', getCurrentSession(), { revalidate: false });
    mutate('shegger:users', getUsers(), { revalidate: false });
    mutate(() => true, undefined, { revalidate: true });
    return;
  }

  if (entity === 'cars') {
    mutate('shegger:cars', getCars(), { revalidate: false });
    mutate((k) => typeof k === 'string' && k.startsWith('shegger:car'), undefined, { revalidate: true });
  } else if (entity === 'bookings') {
    mutate('shegger:bookings', getBookings(), { revalidate: false });
    mutate((k) => typeof k === 'string' && k.startsWith('shegger:booking'), undefined, { revalidate: true });
  } else if (entity === 'reviews') {
    mutate('shegger:reviews', getReviews(), { revalidate: false });
    mutate((k) => typeof k === 'string' && k.startsWith('shegger:reviews'), undefined, { revalidate: true });
  } else if (entity === 'disputes') {
    mutate('shegger:disputes', getDisputes(), { revalidate: false });
    mutate((k) => typeof k === 'string' && k.startsWith('shegger:dispute'), undefined, { revalidate: true });
  } else if (entity === 'notifications') {
    mutate('shegger:notifications', getNotifications(), { revalidate: false });
    mutate((k) => typeof k === 'string' && k.startsWith('shegger:notification'), undefined, { revalidate: true });
  } else if (entity === 'session') {
    mutate('shegger:session', getCurrentSession(), { revalidate: false });
  } else if (entity === 'users') {
    mutate('shegger:users', getUsers(), { revalidate: false });
  } else {
    mutate(`shegger:${entity}`);
  }
}

if (typeof window !== 'undefined') {
  // Listen to same-window storage mutation events dispatched by storage.ts
  window.addEventListener('shegger-storage-change', ((e: CustomEvent<{ key?: string; entity?: string }>) => {
    syncEntityToCache(e.detail?.entity);
  }) as EventListener);

  // Listen to cross-tab storage mutation events from other windows
  window.addEventListener('storage', (e: StorageEvent) => {
    if (!e.key) {
      syncEntityToCache('all');
      return;
    }
    if (e.key === STORAGE_KEYS.CARS) {
      syncEntityToCache('cars');
    } else if (e.key === STORAGE_KEYS.BOOKINGS) {
      syncEntityToCache('bookings');
    } else if (e.key === STORAGE_KEYS.REVIEWS) {
      syncEntityToCache('reviews');
    } else if (e.key === STORAGE_KEYS.DISPUTES) {
      syncEntityToCache('disputes');
    } else if (e.key === STORAGE_KEYS.NOTIFICATIONS) {
      syncEntityToCache('notifications');
    } else if (e.key === STORAGE_KEYS.SESSION) {
      const fromLocal = readStorage<DemoSession | null>(STORAGE_KEYS.SESSION, null, isDemoSession);
      if (fromLocal) {
        writeSession(SESSION_KEYS.SESSION, fromLocal);
      } else {
        removeSession(SESSION_KEYS.SESSION);
      }
      syncEntityToCache('session');
    }
  });

  // Listen to zero-latency BroadcastChannel messages
  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('shegger_wheels_sync');
      channel.onmessage = (event) => {
        const entity = event.data?.entity;
        if (entity === 'session') {
          const fromLocal = readStorage<DemoSession | null>(STORAGE_KEYS.SESSION, null, isDemoSession);
          if (fromLocal) {
            writeSession(SESSION_KEYS.SESSION, fromLocal);
          } else {
            removeSession(SESSION_KEYS.SESSION);
          }
        }
        syncEntityToCache(entity);
      };
    } catch {
      // Ignore in restricted environments
    }
  }
}

/**
 * Manually trigger revalidation for a specific entity or all cached keys with immediate cache injection
 */
export function triggerSheggerRevalidation(entity?: string) {
  syncEntityToCache(entity);
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

  const user = useMemo(() => {
    return session?.userId ? getUserById(session.userId) : undefined;
  }, [session]);

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

