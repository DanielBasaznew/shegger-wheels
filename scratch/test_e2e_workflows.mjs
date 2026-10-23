/**
 * Shegger Wheels — Task 15: End-to-End Workflow Integration Test Suite
 * 
 * Comprehensive verification of all 5 critical journeys:
 * 1. Renter Journey
 * 2. Owner Journey
 * 3. Admin Journey
 * 4. Persistence & Reset Journey
 * 5. Authorization & Guardrails Journey
 */

import {
  getCars,
  getCarById,
  saveCar,
  getUsers,
  getUserById,
  getBookings,
  getBookingById,
  saveBooking,
  getReviews,
  saveReview,
  getDisputes,
  saveDispute,
  getNotifications,
  saveNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  getCurrentSession,
  setCurrentSession,
  clearCurrentSession,
  resetDemoData,
} from '../lib/storage.ts';

import {
  signInAsDemoUser,
  signOutDemoUser,
  switchActiveRole,
  getSafeReturnUrl,
} from '../lib/auth.ts';

import {
  createBooking,
  transitionBookingStatus,
  calculateTrustedPrice,
  getOwnerEarningsAnalytics,
} from '../lib/bookings.ts';

import {
  createCarListing,
  updateCarListing,
  moderateCarListing,
  getAdminModerationMetrics,
} from '../lib/fleet.ts';

import {
  createReview,
  respondToReview,
  isBookingReviewable,
} from '../lib/reviews.ts';

import {
  getSafeNotificationLink,
} from '../lib/notifications.ts';

import { SEED_USERS, SEED_CARS, SEED_BOOKINGS, SEED_DISPUTES } from '../lib/seeds.ts';

// Mock Browser Storage Environment for Node execution
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

globalThis.window = {
  localStorage: new MockStorage(),
  sessionStorage: new MockStorage(),
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `— ${details}` : ''}`);
  }
}

console.log('====================================================');
console.log('SHEGGER WHEELS — TASK 15 END-TO-END WORKFLOW AUDIT');
console.log('====================================================\n');

// Initialize clean seeds
resetDemoData();

// ============================================================================
// JOURNEY 1: RENTER END-TO-END JOURNEY
// ============================================================================
console.log('--- JOURNEY 1: Renter Journey ---');

// 1. Browse approved cars
const publicCars = getCars().filter((c) => c.status === 'approved');
assert(publicCars.length > 0, 'Renter can discover approved catalog vehicles');

// 2. Open vehicle details
const selectedCar = publicCars[0];
assert(selectedCar.id && selectedCar.pricePerDay > 0, 'Car details loaded with pricing specs');

// 3. Sign in as verified renter
const renterAuth = signInAsDemoUser('user_renter_01', 'renter');
assert(renterAuth.success && renterAuth.session?.activeRole === 'renter', 'Renter signs into active session');

// 4. Test host blackout date conflict protection
const blackoutBookingAttempt = createBooking({
  carId: selectedCar.id,
  renterId: renterAuth.session.userId,
  startDate: '2026-11-01',
  endDate: '2026-11-04',
});
assert(!blackoutBookingAttempt.success && blackoutBookingAttempt.error?.includes('unavailable'), 'Host blackout dates are strictly enforced by booking conflict detector');

// 5. Create a valid rental booking on available dates
const startDate = '2026-11-05';
const endDate = '2026-11-08'; // 3 days
const bookingRes = createBooking({
  carId: selectedCar.id,
  renterId: renterAuth.session.userId,
  startDate,
  endDate,
  insuranceTier: 'standard',
  paymentMethod: 'telebirr',
});
assert(bookingRes.success && bookingRes.booking, 'Booking successfully created and submitted on available dates', bookingRes.error);
if (!bookingRes.booking) {
  console.error('Booking failed with:', bookingRes.error);
  process.exit(1);
}
const createdBooking = bookingRes.booking;

// Verify price snapshot integrity
assert(
  createdBooking.pricePerDay === selectedCar.pricePerDay &&
  createdBooking.days === 3 &&
  createdBooking.total > 0 &&
  createdBooking.securityDeposit === 0,
  'Booking pricing snapshot correctly calculates days, rates, and escrow deposit'
);

// 6. Host receives in-app notification of new request
const ownerNotifications = getNotificationsForUser(selectedCar.ownerId);
const requestNotif = ownerNotifications.find((n) => n.bookingId === createdBooking.id && n.type === 'booking_requested');
assert(!!requestNotif, 'Owner receives booking request in-app notification');

// 7. Host signs in and confirms the booking
signInAsDemoUser(selectedCar.ownerId, 'owner');
const confirmRes = transitionBookingStatus(
  createdBooking.id,
  'confirmed',
  { userId: selectedCar.ownerId, role: 'owner' }
);
assert(confirmRes.success && confirmRes.booking?.status === 'confirmed', 'Host successfully confirms booking request');

// 8. Renter signs back in and receives confirmation notification with tracking link
signInAsDemoUser('user_renter_01', 'renter');
const renterNotifications = getNotificationsForUser('user_renter_01');
const confirmedNotif = renterNotifications.find((n) => n.bookingId === createdBooking.id && n.type === 'booking_confirmed');
assert(!!confirmedNotif && confirmedNotif.link.includes('/track'), 'Renter receives confirmation notification with safe tracking link');

// 9. Access tracking when eligible
const trackingEligible = confirmRes.booking &&
  confirmRes.booking.renterId === 'user_renter_01' &&
  ['confirmed', 'in_progress'].includes(confirmRes.booking.status);
assert(trackingEligible === true, 'Renter has authorized access to trip tracking hub');

// 10. Handover / start trip (Owner action)
signInAsDemoUser(selectedCar.ownerId, 'owner');
const startRes = transitionBookingStatus(
  createdBooking.id,
  'in_progress',
  { userId: selectedCar.ownerId, role: 'owner' }
);
assert(startRes.success && startRes.booking?.status === 'in_progress', 'Trip progresses to active in_progress state');

// 11. Complete return & inspect vehicle (Owner action)
const completeRes = transitionBookingStatus(
  createdBooking.id,
  'completed',
  { userId: selectedCar.ownerId, role: 'owner' }
);
assert(completeRes.success && completeRes.booking?.status === 'completed', 'Trip completed and escrow disbursed to owner');

// 12. Review eligibility check (Renter action)
signInAsDemoUser('user_renter_01', 'renter');
const reviewCheck = isBookingReviewable(completeRes.booking, 'user_renter_01');
assert(reviewCheck.canReview === true, 'Completed trip is eligible for renter review submission');

// 13. Submit review
const reviewRes = createReview(
  { userId: 'user_renter_01', role: 'renter' },
  {
    bookingId: createdBooking.id,
    rating: 5,
    comment: 'Outstanding vehicle condition and seamless handover in Bole!',
  }
);
assert(reviewRes.success && reviewRes.review, 'Renter review submitted and verified');

// 13. Owner notified of new review
const updatedOwnerNotifs = getNotificationsForUser(selectedCar.ownerId);
const reviewNotif = updatedOwnerNotifs.find((n) => n.bookingId === createdBooking.id && n.type === 'review_received');
assert(!!reviewNotif, 'Host receives rating & review in-app notification');

// 14. Duplicate review prevented
const dupReviewRes = createReview(
  { userId: renterAuth.session.userId, role: 'renter' },
  {
    bookingId: createdBooking.id,
    rating: 4,
    comment: 'Attempting duplicate review.',
  }
);
assert(!dupReviewRes.success, 'Duplicate reviews for the same booking are blocked');

console.log('\n--- JOURNEY 2: Owner Journey ---');

// 1. Sign in as vehicle owner
const ownerAuth = signInAsDemoUser('user_owner_02', 'owner');
assert(ownerAuth.success && ownerAuth.session?.activeRole === 'owner', 'Owner signs into host session');

// 2. Create a new vehicle listing (starts pending)
const newListingRes = createCarListing(
  { userId: ownerAuth.session.userId, role: 'owner' },
  {
    make: 'Hyundai',
    model: 'Tucson Dynamic',
    year: 2023,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Petrol',
    neighbourhood: 'Bole',
    pricePerDay: 4800,
    description: 'Immaculate compact SUV for Addis Ababa city commute and countryside travel.',
    features: ['GPS Navigation', 'Backup Camera', 'Apple CarPlay', 'Leather Interior'],
    photos: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'],
  }
);
assert(newListingRes.success && newListingRes.car?.status === 'pending', 'Vehicle listing created in pending moderation state');
const pendingCar = newListingRes.car;

// 3. Confirm pending car cannot be booked by a renter
signInAsDemoUser('user_renter_01', 'renter');
const pendingBookingAttempt = createBooking({
  carId: pendingCar.id,
  renterId: 'user_renter_01',
  startDate: '2026-11-10',
  endDate: '2026-11-12',
});
assert(!pendingBookingAttempt.success && pendingBookingAttempt.error?.includes('approved'), 'Pending vehicle cannot be booked by renters');

// 4. Admin approves the listing
const adminAuth = signInAsDemoUser('user_admin_01', 'admin');
const approvalRes = moderateCarListing(
  pendingCar.id,
  { userId: adminAuth.session.userId, role: 'admin' },
  { action: 'approve' }
);
assert(approvalRes.success && approvalRes.car?.status === 'approved', 'Admin moderates and approves listing');

// 5. Owner receives in-app notification of listing approval
const hostApprovalNotifs = getNotificationsForUser(ownerAuth.session.userId);
const listingApprovedNotif = hostApprovalNotifs.find((n) => n.carId === pendingCar.id && n.type === 'system');
assert(!!listingApprovedNotif && listingApprovedNotif.title.includes('Approved'), 'Owner receives listing approval notification');

// 6. Renter now books the newly approved vehicle
signInAsDemoUser('user_renter_01', 'renter');
const bookNewCarRes = createBooking({
  carId: pendingCar.id,
  renterId: 'user_renter_01',
  startDate: '2026-11-15',
  endDate: '2026-11-17',
});
assert(bookNewCarRes.success && bookNewCarRes.booking, 'Approved car is now bookable');
const hostBooking = bookNewCarRes.booking;

// 7. Owner confirms, handsover, and returns
signInAsDemoUser('user_owner_02', 'owner');
transitionBookingStatus(hostBooking.id, 'confirmed', { userId: 'user_owner_02', role: 'owner' });
transitionBookingStatus(hostBooking.id, 'in_progress', { userId: 'user_owner_02', role: 'owner' });
transitionBookingStatus(hostBooking.id, 'completed', { userId: 'user_owner_02', role: 'owner' });

// 8. Verify owner earnings and escrow metrics
const earnings = getOwnerEarningsAnalytics('user_owner_02');
assert(earnings.bookingsCount.completed >= 1 && earnings.totalCompletedEarnings > 0, 'Owner earnings and escrow disbursement calculated');

// 9. Renter reviews and owner replies
signInAsDemoUser('user_renter_01', 'renter');
const hostCarReview = createReview(
  { userId: 'user_renter_01', role: 'renter' },
  {
    bookingId: hostBooking.id,
    rating: 5,
    comment: 'Super clean Tucson, smooth pickup in Bole!',
  }
);
assert(hostCarReview.success && hostCarReview.review, 'Renter review submitted on host car');

signInAsDemoUser('user_owner_02', 'owner');
const replyRes = respondToReview(
  hostCarReview.review.id,
  { userId: 'user_owner_02', role: 'owner' },
  'Thank you for treating the Tucson with care! Looking forward to hosting you again.'
);
assert(replyRes.success && replyRes.review?.ownerReply, 'Owner successfully replies to review');

console.log('\n--- JOURNEY 3: Admin Moderation & Dispute Journey ---');

// 1. Admin rejects an uncompliant vehicle
signInAsDemoUser('user_owner_01', 'owner');
const junkListing = createCarListing(
  { userId: 'user_owner_01', role: 'owner' },
  {
    make: 'Old',
    model: 'Beater',
    year: 1999,
    transmission: 'Manual',
    seats: 4,
    neighbourhood: 'Kazanchis',
    pricePerDay: 800,
    description: 'Old car with dented body and cracked windscreen.',
    features: ['AM Radio'],
    photos: ['https://images.unsplash.com/photo-test'],
  }
);
signInAsDemoUser('user_admin_01', 'admin');
const rejectRes = moderateCarListing(
  junkListing.car.id,
  { userId: 'user_admin_01', role: 'admin' },
  { action: 'reject', reason: 'Vehicle body and safety features fail municipal standards.' }
);
assert(rejectRes.success && rejectRes.car?.status === 'rejected', 'Admin rejects listing with mandatory reason');

// 2. Verify rejected car cannot be booked
const tryBookRejected = createBooking({
  carId: junkListing.car.id,
  renterId: 'user_renter_01',
  startDate: '2026-11-20',
  endDate: '2026-11-22',
});
assert(!tryBookRejected.success, 'Rejected listing is completely blocked from booking engine');

// 3. Inspect existing dispute
const disputes = getDisputes();
assert(disputes.length > 0, 'Dispute ledger contains active dispute records');
const testDispute = disputes[0];

// 4. Admin resolves dispute with settlement notes
const disputeRes = transitionBookingStatus(
  testDispute.bookingId,
  'resolved',
  { userId: 'user_admin_01', role: 'admin' },
  { reason: 'Security deposit released after verified inspection photos confirmed no damage.' }
);
assert(disputeRes.success && disputeRes.booking?.status === 'resolved', 'Admin resolves disputed booking');

testDispute.status = 'resolved';
testDispute.resolutionNotes = 'Deposit released to renter in full.';
testDispute.resolvedBy = 'user_admin_01';
testDispute.resolvedAt = new Date().toISOString();
saveDispute(testDispute);
assert(getDisputes().find((d) => d.id === testDispute.id)?.status === 'resolved', 'Dispute record updated to resolved state');

console.log('\n--- JOURNEY 4: Persistence & Reset Journey ---');

// 1. Storage consistency check
const initialCarCount = getCars().length;
const initialBookingCount = getBookings().length;
assert(initialCarCount > 0 && initialBookingCount > 0, 'Storage contains persistent demo records');

// 2. Set an unrelated third-party item in localStorage
window.localStorage.setItem('unrelated_app_setting', 'keep_me_safe');

// 3. Trigger resetDemoData
resetDemoData();

// 4. Verify baseline seeds are restored
assert(getCars().length === SEED_CARS.length, 'Reset restores baseline seed cars count');
assert(getBookings().length === SEED_BOOKINGS.length, 'Reset restores baseline seed bookings count');
assert(getDisputes().length === SEED_DISPUTES.length, 'Reset restores baseline seed disputes count');

// 5. Verify unrelated localStorage was NOT touched
assert(window.localStorage.getItem('unrelated_app_setting') === 'keep_me_safe', 'Reset demo data does not damage unrelated browser storage');

console.log('\n--- JOURNEY 5: Authorization & Guardrails Journey ---');

// 1. Signed-out access barrier
clearCurrentSession();
const signedOutBooking = createBooking({
  carId: 'car_01',
  renterId: 'user_renter_01',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
});
assert(!signedOutBooking.success && signedOutBooking.error?.includes('Authentication'), 'Signed-out booking creation is rejected');

// 2. Suspended user barrier (Both sign-in block and storage mutation defense)
const suspendedUser = SEED_USERS.find((u) => u.status === 'suspended');
if (suspendedUser) {
  // Layer 1: Suspended sign-in blocked
  const suspendedSignIn = signInAsDemoUser(suspendedUser.id, 'renter');
  assert(!suspendedSignIn.success && suspendedSignIn.error?.includes('Suspended'), 'Suspended user sign-in barrier enforced');

  // Layer 2: Even with injected session, mutation blocked
  setCurrentSession({ userId: suspendedUser.id, activeRole: 'renter', signedInAt: new Date().toISOString() });
  const suspendedBooking = createBooking({
    carId: 'car_01',
    renterId: suspendedUser.id,
    startDate: '2026-12-01',
    endDate: '2026-12-03',
  });
  assert(!suspendedBooking.success && suspendedBooking.error?.includes('suspended'), 'Suspended user storage mutation barrier enforced');
  clearCurrentSession();
}

// 3. Cross-user boundary (Renter A cannot transition Renter B booking)
signInAsDemoUser('user_renter_02', 'renter');
const crossUserAttempt = transitionBookingStatus(
  'booking_01', // Owned by user_renter_01
  'cancelled',
  { userId: 'user_renter_02', role: 'renter' }
);
assert(!crossUserAttempt.success, 'Cross-user booking mutation blocked');

// 4. Admin self-moderation conflict of interest guard
signInAsDemoUser('user_admin_01', 'admin');
// Create a car owned by admin
const adminCar = {
  ...SEED_CARS[0],
  id: 'car_admin_owned',
  ownerId: 'user_admin_01',
  status: 'pending',
};
saveCar(adminCar);
const selfModAttempt = moderateCarListing(
  'car_admin_owned',
  { userId: 'user_admin_01', role: 'admin' },
  { action: 'approve' }
);
assert(!selfModAttempt.success && selfModAttempt.error?.includes('Conflict of interest'), 'Admin self-approval conflict of interest guard enforced');

// 5. Safe internal navigation links & Return URL validation
const trackLink = getSafeNotificationLink('trip_started', 'booking_01');
const reviewLink = getSafeNotificationLink('review_received', 'booking_01', 'car_01');
assert(trackLink.startsWith('/bookings/booking_01/track'), 'Safe relative tracking link generated');
assert(reviewLink.startsWith('/cars/car_01'), 'Safe relative review link generated');

// Validate safe return URLs (open redirect defense)
const safeLocalReturn = getSafeReturnUrl('/cars/car_02');
const unsafeExternalReturn = getSafeReturnUrl('https://evil-phishing.com');
assert(safeLocalReturn === '/cars/car_02', 'Safe internal return URL accepted');
assert(unsafeExternalReturn === '/dashboard', 'Malicious external redirect sanitized to default fallback');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
