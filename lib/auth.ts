/**
 * Shegger Wheels — Demo Authentication & Safe Navigation Layer
 * 
 * Simulated in-memory authentication and role handling for the frontend-only
 * capstone prototype. No real passwords or external auth providers are used.
 */

import { User, UserRole, DemoSession } from './types';
import { getUsers, getCurrentSession, setCurrentSession, clearCurrentSession } from './storage';

// ==========================================
// Safe Return URL Validation
// ==========================================

/**
 * Validates and sanitizes a return or redirect path to prevent open redirect vulnerabilities.
 * Only allows safe same-origin relative application paths starting with a single '/'
 * and strictly rejects protocol-relative paths ('//'), backslash bypasses ('/\', '\/'),
 * external schemes ('http:', 'https:', 'javascript:', 'data:'), and malformed inputs.
 */
export function getSafeReturnUrl(
  rawUrl: string | null | undefined,
  fallback: string = '/dashboard'
): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return fallback;
  }

  const trimmed = rawUrl.trim();

  // Must begin with a single '/' and not with '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Reject backslashes anywhere in the path to prevent Windows/browser normalization bypasses
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Reject any protocol indicators or colon before query/hash (e.g. /http:evil.com)
  const pathPart = trimmed.split('?')[0].split('#')[0];
  if (pathPart.includes(':')) {
    return fallback;
  }

  // Validate by URL parsing with a fixed dummy origin to verify relative pathname
  try {
    const dummyOrigin = 'http://localhost';
    const parsed = new URL(trimmed, dummyOrigin);

    // Ensure the resolved origin matches the dummy origin and the pathname begins with a single '/'
    if (parsed.origin !== dummyOrigin) {
      return fallback;
    }

    if (!parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return fallback;
    }

    // Return the safe relative pathname + search + hash
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

// ==========================================
// Demo Authentication Operations
// ==========================================

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  session?: DemoSession;
}

/**
 * Signs in as a designated demo user by ID.
 * Prevents suspended accounts from signing in.
 */
export function signInAsDemoUser(userId: string, preferredRole?: UserRole): AuthResult {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return {
      success: false,
      error: `Demo user ID "${userId}" was not found in the seeded fleet registry.`,
    };
  }

  // Suspended account guard
  if (user.status === 'suspended') {
    return {
      success: false,
      error: `Account Suspended: Demo account "${user.name}" has been suspended due to policy or identity verification flags. Sign-in is blocked.`,
      user,
    };
  }

  // Determine active role respecting coexisting roles
  let activeRole: UserRole = user.roles[0] || 'renter';
  if (preferredRole && user.roles.includes(preferredRole)) {
    activeRole = preferredRole;
  }

  const session: DemoSession = {
    userId: user.id,
    activeRole,
    signedInAt: new Date().toISOString(),
  };

  setCurrentSession(session);

  return {
    success: true,
    user,
    session,
  };
}

/**
 * Signs in using an Ethiopian phone number (SMS/OTP bypass simulated).
 */
export function signInWithPhone(phoneInput: string, preferredRole?: UserRole): AuthResult {
  if (!phoneInput || !phoneInput.trim()) {
    return {
      success: false,
      error: 'Please enter a valid Ethiopian mobile phone number.',
    };
  }

  // Extract clean digits
  const cleanInput = phoneInput.replace(/\D/g, '');
  const users = getUsers();

  // Match against users by normalized phone digits
  const user = users.find((u) => {
    const cleanUserPhone = u.phone.replace(/\D/g, '');
    return (
      cleanUserPhone.endsWith(cleanInput) ||
      cleanInput.endsWith(cleanUserPhone) ||
      cleanUserPhone === cleanInput
    );
  });

  if (!user) {
    return {
      success: false,
      error:
        'No seeded demo account matches this phone number. Try selecting one of the pre-configured personas above or enter +251 91 122 3344.',
    };
  }

  return signInAsDemoUser(user.id, preferredRole);
}

/**
 * Signs out the current demo user and clears session storage.
 */
export function signOutDemoUser(): void {
  clearCurrentSession();
}

/**
 * Switches the active role for a user with coexisting roles (e.g. Renter <-> Owner)
 * without losing other assigned roles.
 */
export function switchActiveRole(newRole: UserRole): boolean {
  const session = getCurrentSession();
  if (!session) return false;

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user || !user.roles.includes(newRole)) return false;

  const updatedSession: DemoSession = {
    ...session,
    activeRole: newRole,
  };

  return setCurrentSession(updatedSession);
}

/**
 * Pre-configured demo personas matching the capstone seeds and Stitch specifications.
 */
export interface DemoPersona {
  id: string;
  name: string;
  initials: string;
  role: string;
  systemRole: UserRole;
  phone: string;
  displayPhone: string;
  badge: string;
  description: string;
  subtitle: string;
  status: 'active' | 'suspended';
  isDefault?: boolean;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'user_owner_01', // Dawit Tadesse (Multi-role: owner & renter)
    name: 'Dawit Tadesse',
    initials: 'DT',
    role: 'Renter & Owner',
    systemRole: 'renter',
    phone: '+251911223344',
    displayPhone: '91 122 3344',
    badge: 'Coexisting Roles',
    subtitle: 'Active Renter (3 Past Trips • 1 Upcoming in Bole) & Car Owner',
    description: 'Browse fleet inventory, simulate booking checkout, and switch seamlessly to host dashboard.',
    status: 'active',
    isDefault: true,
  },
  {
    id: 'user_owner_02', // Abebe Kebede (Superhost)
    name: 'Abebe Kebede',
    initials: 'AK',
    role: 'Host Partner',
    systemRole: 'owner',
    phone: '+251911556677',
    displayPhone: '91 155 6677',
    badge: 'Superhost',
    subtitle: 'Superhost (2 Vehicles: Land Cruiser Prado & RAV4)',
    description: 'Host telemetry: 85,000 ETB/mo revenue, booking requests, calendar blackout dates.',
    status: 'active',
  },
  {
    id: 'user_admin_01', // Yared Mulugeta (Admin)
    name: 'Yared Mulugeta',
    initials: 'YM',
    role: 'Administrator',
    systemRole: 'admin',
    phone: '+251911000001',
    displayPhone: '91 100 0001',
    badge: 'Ops & Audit',
    subtitle: 'Platform Admin & TeleBirr Escrow Auditor',
    description: 'Inspect vehicle registration certificates, driver license verify queue, system ledger.',
    status: 'active',
  },
  {
    id: 'user_suspended_01', // Kibreab Tesfaye (Suspended Account)
    name: 'Kibreab Tesfaye',
    initials: 'KT',
    role: 'Suspended Account',
    systemRole: 'renter',
    phone: '+251933445566',
    displayPhone: '93 344 5566',
    badge: 'Suspended Policy Flag',
    subtitle: 'Suspended for identity verification violation (Demo test account)',
    description: 'Test that suspended accounts are immediately blocked from signing in with clear security feedback.',
    status: 'suspended',
  },
];
