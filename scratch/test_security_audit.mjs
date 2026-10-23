/**
 * Shegger Wheels — Task 16: Security & Permission Regression Test Suite
 * 
 * Comprehensive automated regression testing for:
 * 1. Signed-out mutation rejection across all sensitive operations.
 * 2. Cross-tenant ownership and data isolation (bookings, cars, reviews, notifications).
 * 3. Role enforcement & privilege escalation defense (actor role spoofing).
 * 4. Suspended account lockdown (UI bypass and direct mutations).
 * 5. Booking lifecycle FSM transitions, trip controls, and duplicate reviews.
 * 6. Listing moderation, mandatory rejection reasons, and self-approval blocks.
 * 7. Safe navigation, open redirect defense, and notification link sanitization.
 * 8. Input boundary validation (ratings, dates, oversized text, corrupted storage).
 * 9. Sensitive data leakage & CSV formula injection (CWE-1236).
 * 10. Demo reset scope and seed consistency.
 */

import assert from 'node:assert/strict';

// Set up mock browser environment
const localStorageMap = new Map();
const sessionStorageMap = new Map();

globalThis.window = {
  localStorage: {
    getItem: (k) => (localStorageMap.has(k) ? localStorageMap.get(k) : null),
    setItem: (k, v) => localStorageMap.set(k, String(v)),
    removeItem: (k) => localStorageMap.delete(k),
    clear: () => localStorageMap.clear(),
  },
  sessionStorage: {
    getItem: (k) => (sessionStorageMap.has(k) ? sessionStorageMap.get(k) : null),
    setItem: (k, v) => sessionStorageMap.set(k, String(v)),
    removeItem: (k) => sessionStorageMap.delete(k),
    clear: () => sessionStorageMap.clear(),
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

const {
  STORAGE_KEYS,
  SESSION_KEYS,
  resetDemoData,
  getUsers,
  getUserById,
  getCars,
  getBookings,
  getNotifications,
  getNotificationsForUser,
  markNotificationAsRead,
  deleteNotification,
  getCurrentSession,
  setCurrentSession,
  clearCurrentSession,
} = await import('../lib/storage.ts');

const {
  getSafeReturnUrl,
  signInAsDemoUser,
  switchActiveRole,
} = await import('../lib/auth.ts');

const {
  createBooking,
  transitionBookingStatus,
  confirmBookingByOwner,
  declineBookingByOwner,
  startTripByOwner,
  completeTripByOwner,
  disputeBookingByOwner,
  cancelBookingByRenter,
  openDispute,
  resolveDisputeByAdmin,
  isValidDateString,
} = await import('../lib/bookings.ts');

const {
  createCarListing,
  updateCarListing,
  toggleCarListingActive,
  updateCarBlackoutDates,
  moderateCarListing,
} = await import('../lib/fleet.ts');

const {
  createReview,
  respondToReview,
} = await import('../lib/reviews.ts');

const {
  getSafeNotificationLink,
  sendNotification,
} = await import('../lib/notifications.ts');

const {
  escapeCSVValue,
  generateRenterBookingsCSV,
} = await import('../lib/csv.ts');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('SHEGGER WHEELS — TASK 16 SECURITY & PERMISSION AUDIT');
console.log('======================================================\n');

// Reset to clean seed data
resetDemoData();
clearCurrentSession();

// --------------------------------------------------------------------
// 1. Signed-Out Mutation Rejection
// --------------------------------------------------------------------
console.log('\n--- 1. Signed-Out Mutation Rejection ---');

test('Signed-out: createBooking rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = createBooking({
    carId: 'car_01',
    startDate: '2026-11-01',
    endDate: '2026-11-05',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: transitionBookingStatus rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = transitionBookingStatus('bk_01', 'cancelled', {
    userId: 'user_renter_01',
    role: 'renter',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: cancelBookingByRenter rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = cancelBookingByRenter('bk_01', {
    userId: 'user_renter_01',
    role: 'renter',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: confirmBookingByOwner rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = confirmBookingByOwner('bk_01', {
    userId: 'user_owner_02',
    role: 'owner',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: createCarListing rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = createCarListing(
    { userId: 'user_owner_01', role: 'owner' },
    {
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
      transmission: 'Automatic',
      seats: 5,
      neighbourhood: 'Bole',
      pricePerDay: 2500,
      description: 'Clean modern sedan for city trips.',
      features: ['Air Conditioning'],
      photos: ['https://example.com/photo.jpg'],
    }
  );
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: updateCarListing rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = updateCarListing('car_01', { userId: 'user_owner_01', role: 'owner' }, { pricePerDay: 3000 });
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: moderateCarListing rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = moderateCarListing('car_01', { userId: 'user_admin_01', role: 'admin' }, { action: 'approve' });
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: createReview rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = createReview({ userId: 'user_renter_01', role: 'renter' }, {
    bookingId: 'bk_03',
    rating: 5,
    comment: 'Great rental experience!',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: respondToReview rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = respondToReview('rev_01', { userId: 'user_owner_01', role: 'owner' }, 'Thank you!');
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: openDispute rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = openDispute('bk_01', { userId: 'user_renter_01', role: 'renter' }, { reason: 'Vehicle damaged' });
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: resolveDisputeByAdmin rejects unauthenticated call', () => {
  clearCurrentSession();
  const res = resolveDisputeByAdmin('dispute_01', { userId: 'user_admin_01', role: 'admin' }, 'Settled refund');
  assert.equal(res.success, false);
  assert.match(res.error, /authentication required/i);
});

test('Signed-out: markNotificationAsRead rejects unauthenticated call', () => {
  clearCurrentSession();
  const notifs = getNotifications();
  const notif = notifs[0];
  const res = markNotificationAsRead(notif.id, notif.recipientId);
  assert.equal(res, false);
});

test('Signed-out: deleteNotification rejects unauthenticated call', () => {
  clearCurrentSession();
  const notifs = getNotifications();
  const notif = notifs[0];
  const res = deleteNotification(notif.id, notif.recipientId);
  assert.equal(res, false);
});

// --------------------------------------------------------------------
// 2. Cross-Tenant Ownership & Data Isolation
// --------------------------------------------------------------------
console.log('\n--- 2. Cross-Tenant Ownership & Data Isolation ---');

test('Cross-tenant: Renter A cannot cancel Renter B booking', () => {
  // Sign in as Dawit (renter)
  signInAsDemoUser('user_owner_01', 'renter');
  // Attempt to cancel booking_03 (which belongs to Sara user_renter_01)
  const res = cancelBookingByRenter('booking_03', { userId: 'user_owner_01', role: 'renter' }, 'Not my booking');
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Cross-tenant: Renter A cannot transition Renter B booking', () => {
  signInAsDemoUser('user_owner_01', 'renter');
  const res = transitionBookingStatus('booking_03', 'cancelled', { userId: 'user_owner_01', role: 'renter' });
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Cross-tenant: Owner A cannot confirm Owner B booking request', () => {
  // Sign in as Abebe (owner)
  signInAsDemoUser('user_owner_02', 'owner');
  // booking_04 is for car_04 (owned by Dawit user_owner_01)
  const res = confirmBookingByOwner('booking_04', { userId: 'user_owner_02', role: 'owner' });
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Cross-tenant: Owner A cannot modify Owner B car listing', () => {
  signInAsDemoUser('user_owner_01', 'owner');
  // car_01 is owned by Abebe user_owner_02
  const res = updateCarListing('car_01', { userId: 'user_owner_01', role: 'owner' }, { pricePerDay: 9999 });
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Cross-tenant: Owner A cannot update Owner B blackout dates', () => {
  signInAsDemoUser('user_owner_01', 'owner');
  const res = updateCarBlackoutDates('car_01', { userId: 'user_owner_01', role: 'owner' }, ['2026-12-01']);
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Cross-tenant: Renter A cannot review Renter B booking', () => {
  signInAsDemoUser('user_owner_01', 'renter');
  // booking_01 was booked by Sara user_renter_01
  const res = createReview({ userId: 'user_owner_01', role: 'renter' }, {
    bookingId: 'booking_01',
    rating: 5,
    comment: 'Impersonating renter review attempt.',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Cross-tenant: Host A cannot post reply to Host B review', () => {
  signInAsDemoUser('user_owner_01', 'owner');
  // review_01 is for car_01 (owned by Abebe user_owner_02)
  const res = respondToReview('review_01', { userId: 'user_owner_01', role: 'owner' }, 'Unauthorized response.');
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Cross-tenant: User A cannot read User B notifications', () => {
  signInAsDemoUser('user_owner_01', 'renter');
  // Dawit attempts to retrieve Abebe's notifications
  const abebeNotifs = getNotificationsForUser('user_owner_02');
  assert.deepEqual(abebeNotifs, []);
});

test('Cross-tenant: User A cannot mark User B notification as read', () => {
  signInAsDemoUser('user_owner_01', 'renter');
  const allNotifs = getNotifications();
  const abebeNotif = allNotifs.find((n) => n.recipientId === 'user_owner_02');
  assert.ok(abebeNotif);
  const res = markNotificationAsRead(abebeNotif.id, 'user_owner_02');
  assert.equal(res, false);
});

test('Cross-tenant: User A cannot delete User B notification', () => {
  signInAsDemoUser('user_owner_01', 'renter');
  const allNotifs = getNotifications();
  const abebeNotif = allNotifs.find((n) => n.recipientId === 'user_owner_02');
  assert.ok(abebeNotif);
  const res = deleteNotification(abebeNotif.id, 'user_owner_02');
  assert.equal(res, false);
});

test('Cross-tenant: CSV export strictly isolates to authenticated renter', () => {
  const renterUser = getUserById('user_owner_01');
  const allBookings = getBookings();
  const allCars = getCars();
  const csv = generateRenterBookingsCSV(allBookings, allCars, renterUser);
  // Verify that bookings not belonging to Dawit are excluded
  const foreignBooking = allBookings.find((b) => b.renterId !== 'user_owner_01');
  assert.ok(foreignBooking);
  assert.equal(csv.includes(foreignBooking.id), false);
});

// --------------------------------------------------------------------
// 3. Role Enforcement & Privilege Escalation Defense
// --------------------------------------------------------------------
console.log('\n--- 3. Role Enforcement & Privilege Escalation Defense ---');

test('Privilege escalation: Renter claiming role: admin in transitionBookingStatus is rejected', () => {
  signInAsDemoUser('user_renter_01', 'renter');
  // Attempting to decline a booking by spoofing role: 'admin'
  const res = transitionBookingStatus('booking_04', 'declined', {
    userId: 'user_renter_01',
    role: 'admin', // Spoofed admin role
  });
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Privilege escalation: Owner claiming role: admin in updateCarListing is rejected', () => {
  signInAsDemoUser('user_owner_02', 'owner');
  // Abebe tries to edit Dawit's car_02 by claiming role: 'admin'
  const res = updateCarListing('car_02', {
    userId: 'user_owner_02',
    role: 'admin', // Spoofed
  }, { pricePerDay: 1234 });
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Role check: Non-admin cannot call moderateCarListing', () => {
  signInAsDemoUser('user_owner_02', 'owner');
  const res = moderateCarListing('car_01', {
    userId: 'user_owner_02',
    role: 'admin', // Spoofed
  }, { action: 'approve' });
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Role check: Non-admin cannot resolve disputes', () => {
  signInAsDemoUser('user_owner_02', 'owner');
  const res = resolveDisputeByAdmin('dispute_01', {
    userId: 'user_owner_02',
    role: 'admin', // Spoofed
  }, 'Spoofed resolution notes');
  assert.equal(res.success, false);
  assert.match(res.error, /unauthorized/i);
});

test('Role check: Non-owner account cannot create car listing', () => {
  // Create temporary non-owner user in memory
  const renterOnlySession = {
    userId: 'user_renter_only',
    activeRole: 'renter',
    signedInAt: new Date().toISOString(),
  };
  setCurrentSession(renterOnlySession);
  // Temporary seed user
  const users = getUsers();
  users.push({
    id: 'user_renter_only',
    name: 'Only Renter',
    email: 'renter@test.com',
    phone: '+251911999999',
    roles: ['renter'],
    status: 'active',
    createdAt: new Date().toISOString(),
  });
  window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const res = createCarListing(
    { userId: 'user_renter_only', role: 'owner' },
    {
      make: 'Toyota',
      model: 'Yaris',
      year: 2021,
      transmission: 'Automatic',
      seats: 5,
      neighbourhood: 'Bole',
      pricePerDay: 2000,
      description: 'Compact city car.',
      features: ['Air Conditioning'],
      photos: ['https://example.com/yaris.jpg'],
    }
  );
  assert.equal(res.success, false);
  assert.match(res.error, /owner \/ host privileges/i);
  resetDemoData(); // restore clean seeds
});

test('Role check: Owner cannot rent their own car', () => {
  signInAsDemoUser('user_owner_01', 'renter');
  // car_02 is owned by user_owner_01
  const res = createBooking({
    carId: 'car_02',
    startDate: '2026-11-10',
    endDate: '2026-11-15',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /cannot book a vehicle that you own/i);
});

test('Conflict of interest: Admin cannot moderate vehicle they own', () => {
  signInAsDemoUser('user_admin_01', 'admin');
  // Temporarily set car_01 owner to user_admin_01 in persistent storage
  const cars = getCars();
  const car = cars.find((c) => c.id === 'car_01');
  const originalOwner = car.ownerId;
  car.ownerId = 'user_admin_01';
  window.localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));

  const res = moderateCarListing('car_01', { userId: 'user_admin_01', role: 'admin' }, { action: 'approve' });
  assert.equal(res.success, false);
  assert.match(res.error, /conflict of interest/i);

  // Restore owner
  car.ownerId = originalOwner;
  window.localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
});

// --------------------------------------------------------------------
// 4. Suspended Accounts
// --------------------------------------------------------------------
console.log('\n--- 4. Suspended Accounts ---');

test('Suspended: Blocked at sign-in with policy notice', () => {
  clearCurrentSession();
  const res = signInAsDemoUser('user_suspended_01');
  assert.equal(res.success, false);
  assert.match(res.error, /account suspended/i);
});

test('Suspended: Blocked in switchActiveRole', () => {
  // Simulate active session for suspended user
  setCurrentSession({
    userId: 'user_suspended_01',
    activeRole: 'renter',
    signedInAt: new Date().toISOString(),
  });
  const res = switchActiveRole('owner');
  assert.equal(res, false);
});

test('Suspended: Blocked in createBooking', () => {
  setCurrentSession({
    userId: 'user_suspended_01',
    activeRole: 'renter',
    signedInAt: new Date().toISOString(),
  });
  const res = createBooking({
    carId: 'car_02',
    startDate: '2026-11-01',
    endDate: '2026-11-05',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /suspended/i);
});

test('Suspended: Blocked in transitionBookingStatus', () => {
  setCurrentSession({
    userId: 'user_suspended_01',
    activeRole: 'renter',
    signedInAt: new Date().toISOString(),
  });
  const res = transitionBookingStatus('booking_04', 'cancelled', {
    userId: 'user_suspended_01',
    role: 'renter',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /suspended/i);
});

test('Suspended: Blocked in cancelBookingByRenter', () => {
  setCurrentSession({
    userId: 'user_suspended_01',
    activeRole: 'renter',
    signedInAt: new Date().toISOString(),
  });
  const res = cancelBookingByRenter('booking_04', {
    userId: 'user_suspended_01',
    role: 'renter',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /suspended/i);
});

test('Suspended: Blocked in createCarListing', () => {
  setCurrentSession({
    userId: 'user_suspended_01',
    activeRole: 'owner',
    signedInAt: new Date().toISOString(),
  });
  const res = createCarListing(
    { userId: 'user_suspended_01', role: 'owner' },
    {
      make: 'Toyota',
      model: 'Prado',
      year: 2022,
      transmission: 'Automatic',
      seats: 7,
      neighbourhood: 'Bole',
      pricePerDay: 5000,
      description: 'Luxury 4x4.',
      features: ['Four-Wheel Drive'],
      photos: ['https://example.com/prado.jpg'],
    }
  );
  assert.equal(res.success, false);
  assert.match(res.error, /suspended/i);
});

test('Suspended: Blocked in updateCarListing', () => {
  setCurrentSession({
    userId: 'user_suspended_01',
    activeRole: 'owner',
    signedInAt: new Date().toISOString(),
  });
  const res = updateCarListing('car_01', {
    userId: 'user_suspended_01',
    role: 'owner',
  }, { pricePerDay: 9000 });
  assert.equal(res.success, false);
  assert.match(res.error, /suspended/i);
});

test('Suspended: Blocked in createReview', () => {
  setCurrentSession({
    userId: 'user_suspended_01',
    activeRole: 'renter',
    signedInAt: new Date().toISOString(),
  });
  const res = createReview(
    { userId: 'user_suspended_01', role: 'renter' },
    { bookingId: 'booking_01', rating: 5, comment: 'Review attempt by suspended user' }
  );
  assert.equal(res.success, false);
  assert.match(res.error, /suspended/i);
});

test('Suspended: Blocked in markNotificationAsRead', () => {
  setCurrentSession({
    userId: 'user_suspended_01',
    activeRole: 'renter',
    signedInAt: new Date().toISOString(),
  });
  const res = markNotificationAsRead('notif_01', 'user_suspended_01');
  assert.equal(res, false);
});

// --------------------------------------------------------------------
// 5. Booking Lifecycle FSM & Trip Controls
// --------------------------------------------------------------------
console.log('\n--- 5. Booking Lifecycle FSM & Trip Controls ---');

test('FSM: Illegal jump requested -> completed is rejected', () => {
  signInAsDemoUser('user_admin_01', 'admin');
  const res = transitionBookingStatus('booking_04', 'completed', {
    userId: 'user_admin_01',
    role: 'admin',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /unsupported transition/i);
});

test('FSM: Illegal jump requested -> in_progress is rejected', () => {
  signInAsDemoUser('user_admin_01', 'admin');
  const res = transitionBookingStatus('booking_04', 'in_progress', {
    userId: 'user_admin_01',
    role: 'admin',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /unsupported transition/i);
});

test('FSM: Terminal state declined cannot transition to confirmed', () => {
  signInAsDemoUser('user_owner_01', 'owner');
  // First decline booking_04 (requested booking on Dawit's car)
  const declineRes = declineBookingByOwner('booking_04', { userId: 'user_owner_01', role: 'owner' });
  assert.equal(declineRes.success, true);
  // Attempt to confirm declined booking
  const confirmRes = confirmBookingByOwner('booking_04', { userId: 'user_owner_01', role: 'owner' });
  assert.equal(confirmRes.success, false);
  assert.match(confirmRes.error, /only "requested" bookings can be confirmed/i);
});

test('Trip controls: Cannot start trip unless booking is confirmed', () => {
  resetDemoData();
  signInAsDemoUser('user_owner_01', 'owner');
  // booking_04 is currently 'requested', not 'confirmed'
  const res = startTripByOwner('booking_04', { userId: 'user_owner_01', role: 'owner' });
  assert.equal(res.success, false);
  assert.match(res.error, /only "confirmed" bookings can be started/i);
});

test('Trip controls: Cannot complete trip unless booking is in_progress', () => {
  signInAsDemoUser('user_owner_01', 'owner');
  // booking_04 is 'requested'
  const res = completeTripByOwner('booking_04', { userId: 'user_owner_01', role: 'owner' });
  assert.equal(res.success, false);
  assert.match(res.error, /only "in_progress" rentals can be completed/i);
});

test('Dispute controls: Cannot dispute a requested booking', () => {
  signInAsDemoUser('user_owner_01', 'owner');
  const res = disputeBookingByOwner('booking_04', { userId: 'user_owner_01', role: 'owner' }, 'Dispute reason');
  assert.equal(res.success, false);
  assert.match(res.error, /disputes can only be raised for "in_progress" or "completed"/i);
});

test('Review eligibility: Cannot review an uncompleted trip', () => {
  signInAsDemoUser('user_renter_01', 'renter');
  // booking_04 is requested, not completed
  const res = createReview({ userId: 'user_renter_01', role: 'renter' }, {
    bookingId: 'booking_04',
    rating: 5,
    comment: 'Trying to review unfinished trip.',
  });
  assert.equal(res.success, false);
  assert.match(res.error, /cannot review an unfinished trip/i);
});

test('Review eligibility: Duplicate review is rejected', () => {
  // Mark booking_03 (belonging to Sara user_renter_01) as completed
  const bookings = getBookings();
  const targetBooking = bookings.find((b) => b.id === 'booking_03');
  assert.ok(targetBooking);
  targetBooking.status = 'completed';
  window.localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

  signInAsDemoUser('user_renter_01', 'renter');
  const firstReview = createReview({ userId: 'user_renter_01', role: 'renter' }, {
    bookingId: 'booking_03',
    rating: 5,
    comment: 'First legitimate review for completed trip.',
  });
  assert.equal(firstReview.success, true);

  // Attempt duplicate review
  const duplicateReview = createReview({ userId: 'user_renter_01', role: 'renter' }, {
    bookingId: 'booking_03',
    rating: 4,
    comment: 'Attempting duplicate review submission.',
  });
  assert.equal(duplicateReview.success, false);
  assert.match(duplicateReview.error, /duplicate review/i);
});

// --------------------------------------------------------------------
// 6. Listing Moderation Integrity
// --------------------------------------------------------------------
console.log('\n--- 6. Listing Moderation Integrity ---');

test('Moderation: Rejection requires non-empty reason with at least 5 chars', () => {
  signInAsDemoUser('user_admin_01', 'admin');
  const resNoReason = moderateCarListing('car_01', { userId: 'user_admin_01', role: 'admin' }, {
    action: 'reject',
    reason: '',
  });
  assert.equal(resNoReason.success, false);
  assert.match(resNoReason.error, /rejection reason/i);

  const resShortReason = moderateCarListing('car_01', { userId: 'user_admin_01', role: 'admin' }, {
    action: 'reject',
    reason: 'bad',
  });
  assert.equal(resShortReason.success, false);
  assert.match(resShortReason.error, /at least 5 characters/i);
});

test('Moderation: Owner cannot self-approve pending car listing', () => {
  signInAsDemoUser('user_owner_01', 'owner');
  // Create pending car
  const newListing = createCarListing({ userId: 'user_owner_01', role: 'owner' }, {
    make: 'Toyota',
    model: 'Rush',
    year: 2023,
    transmission: 'Automatic',
    seats: 7,
    neighbourhood: 'Bole',
    pricePerDay: 3500,
    description: 'Brand new 7 seater SUV.',
    features: ['Air Conditioning'],
    photos: ['https://example.com/rush.jpg'],
  });
  assert.equal(newListing.success, true);
  const pendingCarId = newListing.car.id;

  // Attempt self-approval via updateCarListing
  const selfApproveRes = updateCarListing(pendingCarId, { userId: 'user_owner_01', role: 'owner' }, {
    status: 'approved',
  });
  assert.equal(selfApproveRes.success, false);
  assert.match(selfApproveRes.error, /owners cannot self-approve/i);

  // Attempt self-approval via toggleCarListingActive
  const toggleRes = toggleCarListingActive(pendingCarId, { userId: 'user_owner_01', role: 'owner' });
  assert.equal(toggleRes.success, false);
  assert.match(toggleRes.error, /pending listings cannot be activated/i);
});

test('Moderation: Non-approved car is excluded from new bookings', () => {
  signInAsDemoUser('user_renter_01', 'renter');
  // Attempt to book pending car created above
  const cars = getCars();
  const pendingCar = cars.find((c) => c.status === 'pending');
  assert.ok(pendingCar);

  const bookPending = createBooking({
    carId: pendingCar.id,
    startDate: '2026-11-20',
    endDate: '2026-11-25',
  });
  assert.equal(bookPending.success, false);
  assert.match(bookPending.error, /not currently approved/i);
});

// --------------------------------------------------------------------
// 7. Safe Redirects and Links
// --------------------------------------------------------------------
console.log('\n--- 7. Safe Redirects and Links ---');

test('Safe URL: Rejects external absolute URLs', () => {
  assert.equal(getSafeReturnUrl('https://evil-phishing.com'), '/dashboard');
  assert.equal(getSafeReturnUrl('http://attacker.com/login'), '/dashboard');
  assert.equal(getSafeReturnUrl('//evil.com/phish'), '/dashboard');
});

test('Safe URL: Rejects backslash bypasses and protocol-relatives', () => {
  assert.equal(getSafeReturnUrl('/\\evil.com'), '/dashboard');
  assert.equal(getSafeReturnUrl('/\\/evil.com'), '/dashboard');
  assert.equal(getSafeReturnUrl('/path\\to\\danger'), '/dashboard');
  assert.equal(getSafeReturnUrl('///evil.com'), '/dashboard');
});

test('Safe URL: Rejects dangerous schemes and colon bypasses', () => {
  assert.equal(getSafeReturnUrl('javascript:alert(1)'), '/dashboard');
  assert.equal(getSafeReturnUrl('/javascript:alert(1)'), '/dashboard');
  assert.equal(getSafeReturnUrl('data:text/html,<script>alert(1)</script>'), '/dashboard');
  assert.equal(getSafeReturnUrl('/data:text/html,abc'), '/dashboard');
  assert.equal(getSafeReturnUrl('/http:evil.com'), '/dashboard');
});

test('Safe URL: Rejects control characters and URI-encoded tricks', () => {
  assert.equal(getSafeReturnUrl('/\t/evil.com'), '/dashboard');
  assert.equal(getSafeReturnUrl('/\n/evil.com'), '/dashboard');
  assert.equal(getSafeReturnUrl('/%2f%2fevil.com'), '/dashboard');
  assert.equal(getSafeReturnUrl('/%5cevil.com'), '/dashboard');
});

test('Safe URL: Allows safe relative application paths', () => {
  assert.equal(getSafeReturnUrl('/cars/car_01'), '/cars/car_01');
  assert.equal(getSafeReturnUrl('/dashboard/host'), '/dashboard/host');
  assert.equal(getSafeReturnUrl('/checkout?carId=car_01&days=3#pricing'), '/checkout?carId=car_01&days=3#pricing');
});

test('Safe Notification Link: Rejects path traversal and dangerous IDs', () => {
  assert.equal(getSafeNotificationLink('trip_started', '../../admin'), '/dashboard');
  assert.equal(getSafeNotificationLink('booking_confirmed', '//evil.com'), '/dashboard');
  assert.equal(getSafeNotificationLink('review_received', undefined, '<script>'), '/dashboard');
  assert.equal(getSafeNotificationLink('booking_confirmed', 'bk_01'), '/bookings/bk_01/track');
});

test('Notification Link Sanitization: sendNotification sanitizes malicious link', () => {
  const notif = sendNotification({
    recipientId: 'user_owner_01',
    type: 'booking_requested',
    title: 'Test Title',
    message: 'Test Message',
    link: 'https://evil.com/phishing',
  });
  assert.equal(notif.link, '/dashboard');
});

// --------------------------------------------------------------------
// 8. Input and Storage Validation
// --------------------------------------------------------------------
console.log('\n--- 8. Input and Storage Validation ---');

test('Date validation: isValidDateString detects leap years and invalid dates', () => {
  assert.equal(isValidDateString('2026-02-28'), true);
  assert.equal(isValidDateString('2026-02-29'), false); // Not a leap year
  assert.equal(isValidDateString('2024-02-29'), true); // 2024 was leap year
  assert.equal(isValidDateString('2026-99-99'), false);
  assert.equal(isValidDateString('invalid-date'), false);
  assert.equal(isValidDateString(''), false);
});

test('Booking validation: Rejects malformed dates and durations > 90 days', () => {
  signInAsDemoUser('user_renter_01', 'renter');
  const resBadDate = createBooking({
    carId: 'car_01',
    startDate: '2026-99-99',
    endDate: '2026-99-98',
  });
  assert.equal(resBadDate.success, false);
  assert.match(resBadDate.error, /valid YYYY-MM-DD format/i);

  const resOverDuration = createBooking({
    carId: 'car_01',
    startDate: '2026-11-01',
    endDate: '2027-05-01', // > 90 days
  });
  assert.equal(resOverDuration.success, false);
  assert.match(resOverDuration.error, /maximum permitted window/i);
});

test('Review validation: Rejects invalid star rating and oversized comments', () => {
  signInAsDemoUser('user_renter_01', 'renter');
  const resBadRating = createReview({ userId: 'user_renter_01', role: 'renter' }, {
    bookingId: 'booking_01',
    rating: 6, // invalid
    comment: 'Super great experience on road.',
  });
  assert.equal(resBadRating.success, false);
  assert.match(resBadRating.error, /between 1 and 5 stars/i);

  const resLongComment = createReview({ userId: 'user_renter_01', role: 'renter' }, {
    bookingId: 'booking_01',
    rating: 5,
    comment: 'A'.repeat(2500), // > 2000 chars
  });
  assert.equal(resLongComment.success, false);
  assert.match(resLongComment.error, /2,000 characters/i);
});

test('Fleet bounds: Rejects oversized make/description and absurd price', () => {
  signInAsDemoUser('user_owner_01', 'owner');
  const resLongMake = createCarListing({ userId: 'user_owner_01', role: 'owner' }, {
    make: 'A'.repeat(60),
    model: 'RAV4',
    year: 2022,
    transmission: 'Automatic',
    seats: 5,
    neighbourhood: 'Bole',
    pricePerDay: 2000,
    description: 'Standard description for car.',
    features: ['Air Conditioning'],
    photos: ['https://example.com/car.jpg'],
  });
  assert.equal(resLongMake.success, false);
  assert.match(resLongMake.error, /must not exceed 50 characters/i);

  const resAbsurdPrice = createCarListing({ userId: 'user_owner_01', role: 'owner' }, {
    make: 'Toyota',
    model: 'RAV4',
    year: 2022,
    transmission: 'Automatic',
    seats: 5,
    neighbourhood: 'Bole',
    pricePerDay: 9999999, // > 500,000
    description: 'Standard description for car.',
    features: ['Air Conditioning'],
    photos: ['https://example.com/car.jpg'],
  });
  assert.equal(resAbsurdPrice.success, false);
  assert.match(resAbsurdPrice.error, /between 500 ETB and 500,000 ETB/i);
});

test('Corrupted storage recovery: Corrupted session in sessionStorage safely returns null', () => {
  window.sessionStorage.setItem(SESSION_KEYS.SESSION, JSON.stringify({ corrupted: 'bad_session_data' }));
  const session = getCurrentSession();
  assert.equal(session, null);
});

// --------------------------------------------------------------------
// 9. Sensitive Data & CSV Formula Injection (CWE-1236)
// --------------------------------------------------------------------
console.log('\n--- 9. Sensitive Data & CSV Formula Injection (CWE-1236) ---');

test('CSV: Neutralizes formula triggers (=, +, -, @, \\t, \\r)', () => {
  assert.equal(escapeCSVValue('=1+1'), "'=1+1");
  assert.equal(escapeCSVValue('+cmd|/c calc'), "'+cmd|/c calc");
  assert.equal(escapeCSVValue('-2+3'), "'-2+3");
  assert.equal(escapeCSVValue('@SUM(A1:A10)'), "'@SUM(A1:A10)");
  assert.equal(escapeCSVValue('\t=cmd'), "'\t=cmd");
  assert.equal(escapeCSVValue('Normal Text'), 'Normal Text');
  assert.equal(escapeCSVValue('Text, with comma'), '"Text, with comma"');
});

// --------------------------------------------------------------------
// 10. Demo Reset Behavior & Storage Key Isolation
// --------------------------------------------------------------------
console.log('\n--- 10. Demo Reset Behavior & Storage Key Isolation ---');

test('Reset: Preserves foreign localStorage keys and restores seeds', () => {
  // Set foreign user key
  window.localStorage.setItem('unrelated_app_key', 'preserve_me');
  resetDemoData();

  // Foreign key remains intact
  assert.equal(window.localStorage.getItem('unrelated_app_key'), 'preserve_me');

  // App keys restored to seed counts
  const users = getUsers();
  assert.ok(users.length >= 4);
  const cars = getCars();
  assert.ok(cars.length >= 4);
  const bookings = getBookings();
  assert.ok(bookings.length >= 4);
});

console.log(`\n======================================================`);
console.log(`SECURITY AUDIT TEST SUMMARY: ${passedTests}/${totalTests} Passed`);
console.log(`======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
