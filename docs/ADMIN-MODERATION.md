# Shegger Wheels — Admin Listing Moderation Protocol

## 1. Overview & Architectural Scope

The Shegger Wheels vehicle listing moderation engine enforces platform safety, catalog quality, and regulatory compliance for peer-to-peer car rentals across Addis Ababa, Ethiopia.

All newly registered vehicles submitted by hosts begin in the `pending` state and remain invisible in the public catalogue until reviewed and explicitly approved by an authorized platform administrator.

---

## 2. Administrator Roles & Permission Matrix

| Actor Role | Active Session Required | Account Status | Can Moderate Listings? | Self-Approval Allowed? |
|---|---|---|---|---|
| **Admin (`admin`)** | Yes (`sw_session_v1`) | Active (`active`) | **YES** | **NO** (Conflict of Interest) |
| **Owner (`owner`)** | Yes | Active | **NO** (Rejected with 403 error) | **NO** (Forbidden) |
| **Renter (`renter`)** | Yes | Active | **NO** (Rejected with 403 error) | **NO** (Forbidden) |
| **Suspended User** | Yes | Suspended (`suspended`) | **NO** (Restricted from operations) | **NO** (Forbidden) |
| **Anonymous / Signed Out** | No | N/A | **NO** (Session required) | **NO** (Forbidden) |

### 2.1 Anti-Self-Approval & Conflict of Interest Guard
To preserve governance integrity:
1. An administrator who also owns vehicles cannot approve or moderate listings registered under their own user ID (`car.ownerId === adminActor.userId`).
2. Any attempt to self-approve results in an immediate rejection:
   ```text
   Conflict of interest: Administrators cannot approve or moderate their own vehicle listings.
   ```
3. Moderation must be executed by an independent administrator.

---

## 3. Moderation State Machine

```
                   ┌────────────────────────┐
                   │  Host creates listing  │
                   └───────────┬────────────┘
                               │
                               ▼
                   ┌────────────────────────┐
                   │     status: pending    │ ◄─── Hidden from catalogue & booking engine
                   └─────┬────────────┬─────┘
                         │            │
         Admin Approves  │            │  Admin Rejects (Mandatory Reason)
                         ▼            ▼
   ┌───────────────────────┐        ┌───────────────────────┐
   │    status: approved   │        │    status: rejected   │
   │  (Published & Live)   │        │  (Reason Persisted)   │
   └───────────┬───────────┘        └───────────┬───────────┘
               │                                │
               │ Host Toggles Maintenance       │ Admin Re-approves after fix
               ▼                                ▼
   ┌───────────────────────┐        ┌───────────────────────┐
   │    status: inactive   │        │    status: approved   │
   └───────────────────────┘        └───────────────────────┘
```

### 3.1 Approval Flow (`action: 'approve'`)
- Transitions listing from `pending` (or previously `rejected`) to `approved`.
- Clears any previous `rejectionReason`.
- Stamps `moderatedAt` with the current ISO timestamp and records `moderatedBy` with the admin user ID.
- **Immediate Effect**: The vehicle instantly becomes visible in the public search catalogue (`/cars`), homepage featured cars, and booking checkout.

### 3.2 Rejection Flow (`action: 'reject'`)
- **Mandatory Reason Requirement**: Rejection requires a non-empty descriptive reason (minimum 5 characters). An empty reason is rejected by validation.
- Preserves the reason under `car.rejectionReason`.
- Stamps `moderatedAt` and `moderatedBy`.
- **Immediate Effect**: The vehicle is immediately excluded from the public catalogue and cannot be reserved in `checkBookingConflicts()`.

---

## 4. Preservation of Bookings & Financial Snapshot Integrity

In accordance with platform safety and accounting rules:
1. **Ownership Invariance**: Moderating a vehicle listing never alters `car.ownerId`.
2. **Booking History**: Existing renter bookings associated with the vehicle (`carId === targetCar.id`) remain 100% intact.
3. **Price Snapshot Lock**: Every booking's stored `pricePerDay`, `subtotal`, `fee`, `securityDeposit`, and `total` are immutable snapshots agreed upon at checkout. Administrative approval or rejection of a listing does not modify existing booking records.
4. **Active Rentals**: Ongoing trips (`in_progress`) or confirmed upcoming trips remain valid and continue through their normal lifecycle to completion and TeleBirr escrow release.

---

## 5. Public Catalogue & Booking Enforcement

Listing availability is strictly guarded across all platform touchpoints:
1. **Public Catalog (`app/cars/page.tsx`)**: Queries `getCars().filter(c => c.status === 'approved')`. Pending, rejected, and inactive cars are completely filtered out.
2. **Homepage (`app/page.tsx`)**: Featured vehicles query only `c.status === 'approved'`.
3. **Conflict Engine (`lib/bookings.ts - checkBookingConflicts`)**:
   ```typescript
   if (car.status !== 'approved') {
     return {
       hasConflict: true,
       conflictReason: `Vehicle is currently not available for bookings (status: ${car.status}).`,
     };
   }
   ```
4. **Checkout Page (`app/checkout/page.tsx`)**: Blocks booking creation if listing is not approved.
