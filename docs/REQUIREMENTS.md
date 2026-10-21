# Shegger Wheels — Functional Requirements & Acceptance Criteria

## 1. Project Goal & Overview
Shegger Wheels is a responsive peer-to-peer car rental marketplace tailored for Addis Ababa, Ethiopia. The platform enables local car owners to list underutilized vehicles, set daily rates and availability, and manage booking requests, while renters browse verified cars across Addis Ababa sub-cities, request rentals, track trips, and leave reviews. Platform administrators moderate vehicle listings, manage demo accounts, inspect activity, and resolve disputes.

## 2. Technical Scope & Architecture Constraints
- **Frontend-Only**: No backend database. All persistence relies on browser storage (`localStorage` for persistent demo data, `sessionStorage` for temporary session/checkout state).
- **Framework**: Next.js App Router (React 19, TypeScript, Tailwind CSS v4).
- **Client/Server Boundary**: Server Components, Route Handlers, and static generation must be used intentionally. Since browser storage APIs exist only in the browser, interactive and storage-dependent components are Client Components.
- **Security Scope**: Frontend demo guardrails only; does not claim production authentication or financial security.
- **No Real Credentials**: Never collect real passwords, bank accounts, or payment credentials. Payments (TeleBirr/Chapa) and trip tracking are clearly labelled simulations.

## 3. Storage Model & Suggested Keys
| Key | Storage | Purpose & Contents |
|---|---|---|
| `sw_users_v1` | `localStorage` | Seeded and demo user records (id, name, email, phone, roles, status, createdAt). |
| `sw_cars_v1` | `localStorage` | Car listings (ownerId, make, model, year, transmission, seats, neighbourhood, pricePerDay, photos, status). |
| `sw_bookings_v1` | `localStorage` | Booking records and lifecycle status (dates, days, price snapshot, totals, paymentStatus, status). |
| `sw_reviews_v1` | `localStorage` | Renter reviews and owner replies linked to completed bookings. |
| `sw_disputes_v1` | `localStorage` | Dispute tickets opened by renters/owners and resolved by admin. |
| `sw_announcements_v1` | `localStorage` | Admin broadcast announcements. |
| `sw_session_v1` | `sessionStorage` | Current signed-in demo user ID and session metadata. |
| `sw_checkout_draft_v1` | `sessionStorage` | Temporary selected dates and checkout summary draft. |

## 4. User Roles & Permissions
1. **Visitor / Renter**:
   - Public: Browse landing page, search/filter catalogue, view vehicle details and availability.
   - Protected (Renter session): Submit rental requests, mock checkout, view renter dashboard, manage own bookings, cancel eligible bookings, view simulated tracking, leave reviews for completed trips, export personal booking history as CSV.
2. **Car Owner**:
   - Protected (Owner session): View owner dashboard, create/edit/deactivate listings, upload/select demo photos, set pricing and blackout dates, approve/decline incoming rental requests, inspect earnings and car utilization, reply to reviews and disputes involving own rentals, export earnings data.
   - *Note*: An account can possess both `renter` and `owner` roles simultaneously (`roles: ['renter', 'owner']`).
3. **Platform Administrator**:
   - Protected (Admin session): Only accessible via a dedicated, clearly labelled seeded demo admin account.
   - Capabilities: Platform overview metrics, moderate (approve/reject) pending vehicle listings, view/suspend/reinstate demo users, inspect all bookings, review and resolve disputes with recorded notes, view mock platform commissions, export platform reports as CSV, publish announcements.

## 5. Core Data Entities
- **User**: `id`, `name`, `email` (unique), `phone`, `roles` (`['renter']`, `['owner']`, or `['renter', 'owner']`, or `['admin']`), `status` (`'active'` | `'suspended'`), `createdAt`.
- **Car**: `id`, `ownerId`, `make`, `model`, `year`, `transmission` (`'Automatic'` | `'Manual'`), `seats`, `city` (`'Addis Ababa'`), `neighbourhood` (e.g., `'Bole'`, `'Kazanchis'`, `'CMC'`, `'Sarbet'`, `'Old Airport'`), `latitude`, `longitude`, `pricePerDay`, `photos[]`, `description`, `status` (`'draft'` | `'pending'` | `'approved'` | `'rejected'` | `'inactive'`), `unavailableDates[]`, `createdAt`.
- **Booking**: `id`, `carId`, `renterId`, `ownerId`, `startDate`, `endDate`, `days`, `pricePerDay` (snapshot at booking), `subtotal`, `fee` (platform demo fee), `total`, `paymentStatus` (`'unpaid'` | `'held_in_escrow'` | `'paid'` | `'refunded'`), `status` (`'requested'` | `'confirmed'` | `'in_progress'` | `'completed'` | `'reviewed'` | `'declined'` | `'cancelled'` | `'disputed'` | `'resolved'`), `createdAt`, `updatedAt`.
- **Review**: `id`, `bookingId`, `carId`, `renterId`, `ownerId`, `rating` (1–5), `comment`, `ownerReply`, `createdAt`.
- **Dispute**: `id`, `bookingId`, `openedBy`, `reason`, `description`, `status` (`'open'` | `'investigating'` | `'resolved'`), `resolutionNotes`, `resolvedBy`, `createdAt`, `resolvedAt`.
- **Announcement**: `id`, `title`, `message`, `active` (boolean), `createdAt`, `createdBy`.

## 6. Acceptance Criteria by Feature

### AC-1: Catalogue & Search
- Users can search cars by make, model, or description (case-insensitive).
- Users can filter by neighbourhood, price range (min/max), transmission, minimum seats, and date availability.
- URL search parameters mirror filter and sort state (e.g., `/cars?neighbourhood=Bole&sort=price-asc`).
- Pagination shows active page, controls, and resets gracefully on filter changes.
- Only cars with `status: 'approved'` and active listing appear in public catalogue.

### AC-2: Car Detail & Booking Request
- Car detail route (`/cars/[id]`) renders photo gallery, vehicle specs, neighbourhood, daily rate, and owner card.
- Date picker prevents booking overlapping dates or dates in `unavailableDates`.
- Submitting a booking requires a signed-in renter session; signed-out users are redirected to `/signin?next=/cars/[id]`.

### AC-3: Checkout & Simulated Payment
- `/checkout` displays breakdown: days × daily rate, simulated platform fee, and total ETB.
- Mock payment button simulates TeleBirr checkout with clear demo labels and fake transaction IDs.
- Creates booking in `'requested'` or `'confirmed'` status based on mock instant-book settings.

### AC-4: Renter Dashboard & Booking Management
- `/dashboard` displays upcoming, active, completed, and cancelled trips.
- Detailed receipt view at `/bookings/[id]` shows pricing snapshot and allowed actions based on current status.
- Renter can cancel only eligible bookings (`requested` or early `confirmed`).
- Completed trips permit submitting one review (rating + comment).
- CSV export downloads personal booking history.

### AC-5: Owner Fleet & Earnings Management
- `/owner` shows active cars, pending requests, confirmed rentals, total earnings, and utilization metrics.
- Owners can create new car listings (starts in `'pending'` or `'draft'`) and edit existing ones.
- Owners can approve or decline incoming rental requests with valid status transitions.
- Availability calendar lets owners block out maintenance/private dates.
- Owners can respond to reviews on their vehicles.

### AC-6: Admin Moderation & Dispute Handling
- Dedicated Admin dashboard (`/admin`) displaying platform volume, mock revenue/commission, user counts, and dispute count.
- Admin can approve or reject pending car listings.
- Admin can inspect disputes, record resolution notes, and transition dispute status to `'resolved'`.
- Admin can suspend or reinstate demo accounts; suspended accounts are blocked from performing demo actions.
- Admin can publish platform announcements shown to visitors and users.

### AC-7: Three Required Negative Tests (Frontend Guardrails)
1. **Signed-out write attempt**: Calling booking/listing mutations without a valid session fails with a clear prompt and does not mutate storage.
2. **Cross-user ownership attempt**: A signed-in renter cannot cancel or mutate another renter's booking; an owner cannot edit another owner's car.
3. **Unsafe return URL**: Redirecting after sign-in validates destination using `safeReturnPath()` and rejects external URLs (e.g., `https://example.com` redirects to `/`).
