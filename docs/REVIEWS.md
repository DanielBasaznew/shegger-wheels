# Shegger Wheels — Reviews & Owner Responses Specification

## 1. Overview & Architectural Scope

Shegger Wheels implements a transparent, verified review and rating system tailored for Addis Ababa's peer-to-peer car rental ecosystem. Consistent with the capstone's frontend-only requirements, all reviews, ratings, and host responses are validated client-side and persisted in browser `localStorage` (`sw_reviews_v1`) with zero backend database dependencies.

The review engine guarantees high trust by strictly gating reviews to completed trips. Renters cannot review vehicles they have not rented, cannot review active or pending trips, and cannot submit multiple reviews for the same booking. Vehicle hosts can publish official public responses to reviews on their listings.

---

## 2. Data Model & Schema

The data structure reuses the core `Review` type defined in [`lib/types.ts`](file:///c:/Users/DELL/Documents/IBT/sq2-daniel-basaznew/module-03-react-nextjs/Projects/shegger-wheels/lib/types.ts):

```typescript
export interface Review {
  id: string;               // Unique ID: 'rev-' + timestamp + '-' + random
  bookingId: string;        // Foreign key to Booking record
  carId: string;            // Foreign key to Car listing
  renterId: string;         // Foreign key to User who rented
  ownerId: string;          // Foreign key to User who owns vehicle
  rating: number;           // Integer 1 to 5
  comment: string;          // Written feedback (min 10 chars)
  createdAt: string;        // ISO 8601 timestamp of review submission
  ownerReply?: string;      // Optional public reply from vehicle host
  ownerReplyAt?: string;    // ISO 8601 timestamp of host reply/edit
}
```

Storage Key: `sw_reviews_v1` in `localStorage`.
Seed Records: Pre-seeded reviews exist in [`lib/seeds.ts`](file:///c:/Users/DELL/Documents/IBT/sq2-daniel-basaznew/module-03-react-nextjs/Projects/shegger-wheels/lib/seeds.ts).

---

## 3. Review Eligibility & Access Control

Review submission is governed by `isBookingReviewable(booking, actorUserId)` in [`lib/reviews.ts`](file:///c:/Users/DELL/Documents/IBT/sq2-daniel-basaznew/module-03-react-nextjs/Projects/shegger-wheels/lib/reviews.ts):

| Requirement | Rule | Error Returned |
| :--- | :--- | :--- |
| **Authentication** | Actor must have an active session (`session.userId`). | `"You must be signed in to submit a review."` |
| **Booking Ownership** | `booking.renterId === actor.userId`. | `"You are not authorized to review this reservation."` |
| **Trip Completion** | `booking.status === 'completed'`. Trips in `requested`, `confirmed`, `in_progress`, `cancelled`, or `declined` are blocked. | `"Reviews can only be submitted after your trip has completed."` |
| **Duplicate Prevention** | No review with matching `bookingId` exists in storage. | `"You have already submitted a review for this completed trip."` |

---

## 4. Input Validation Rules

### Renter Review Submission (`createReview`)
1. **Rating Range**: Must be an integer between 1 and 5 inclusive (`Number.isInteger(rating) && rating >= 1 && rating <= 5`). Fractional or out-of-bounds ratings trigger: `"Rating must be an integer between 1 and 5 stars."`
2. **Comment Length**: Written feedback must contain at least 10 non-whitespace characters (`comment.trim().length >= 10`). Maximum length is 1000 characters. Shorter text triggers: `"Please write at least 10 characters of feedback."`
3. **FSM Transition**: Upon successful submission, the booking status automatically transitions from `'completed'` to `'reviewed'` via `transitionBookingStatus()`, cementing terminal trip status.

### Host Response Workflow (`respondToReview`)
1. **Ownership Enforcement**: Only the owner of the vehicle reviewed (`review.ownerId === actor.userId` or `car.ownerId === actor.userId`) may post a response. Unauthorized users or other hosts trigger: `"Only the vehicle host can respond to this review."`
2. **Reply Length**: Minimum 5 non-whitespace characters, maximum 1000 characters. Shorter text triggers: `"Response must be at least 5 characters."`
3. **Editing Allowed**: Hosts can edit their published response. The updated response updates `ownerReply` and records the new timestamp in `ownerReplyAt`.

---

## 5. Vehicle Rating Aggregation & Empty States

Vehicle ratings are dynamically computed from stored reviews via `getCarRatingSummary(carId, reviews)`:

- **Average Rating**: Sum of ratings divided by review count, rounded to one decimal place (`4.9`, `5.0`).
- **Star Breakdown**: Distribution count of 1-star, 2-star, 3-star, 4-star, and 5-star ratings.
- **Empty State**: If a vehicle listing has 0 reviews:
  - Header badge displays `★ New` instead of hardcoded numbers.
  - Review section displays an inviting empty state card: *"No Reviews Yet — This vehicle hasn't received reviews yet. Complete a trip to be the first verified traveler to leave feedback!"*

---

## 6. UI Integration & Reactive Synchronization

1. **Vehicle Detail Page (`/cars/[id]`)**:
   - Uses `useSyncExternalStore` for real-time reactivity when reviews are added or edited.
   - Displays verified renter names, avatars, timestamps, star ratings, and nested host responses.
   - Shows empty state card when listing has 0 reviews.
2. **Renter Dashboard (`/dashboard`)**:
   - Displays `★ Leave Review` CTA button on completed bookings.
   - Displays `✓ Reviewed` badge on reviewed bookings.
   - Dedicated modal (`SubmitReviewModal`) with 1–5 star interactive picker and live validation.
3. **Host Fleet Dashboard (`/dashboard/host`)**:
   - Dedicated tab: `⭐ Guest Reviews` alongside Fleet, Reservations, and Earnings.
   - Lists all reviews across host's fleet with average fleet rating.
   - `💬 Respond to Review` and `✏️ Edit Response` triggers opening `OwnerResponseModal` with quick-response templates (e.g., *"Thank you for taking great care of the vehicle!"*).
4. **Booking Receipt (`/bookings/[id]`)**:
   - Displays prominent top callout banner on completed trips prompting renters for feedback.
   - Displays reviewed confirmation banner on reviewed trips.

---

## 7. Storage Keys & Event Dispatching

- **`sw_reviews_v1`**: Array of `Review` objects.
- **`sw_bookings_v1`**: Updated when booking transitions to `'reviewed'`.
- Storage mutations dispatch custom `shegger-storage-change` events and standard browser `storage` events, ensuring instant reactive updates across open dashboard tabs and detail views.
