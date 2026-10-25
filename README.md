# Shegger Wheels (ሸገር ዊልስ) — Peer-to-Peer Car Rental Marketplace

> **Addis Ababa Peer-to-Peer Automotive Mobility Platform**  
> An interactive, responsive, frontend-only marketplace connecting local car owners with verified renters across Addis Ababa, Ethiopia. Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS using the bespoke **Urban Motion** design language.

---

## Table of Contents

- [Overview](#overview)
- [Key Features & User Roles](#key-features--user-roles)
- [Technology Stack](#technology-stack)
- [Main Pages & User Workflows](#main-pages--user-workflows)
- [Project Structure](#project-structure)
- [Prerequisites & Local Installation](#prerequisites--local-installation)
- [Available Commands](#available-commands)
- [Demo Instructions & Seeded Accounts](#demo-instructions--seeded-accounts)
- [Data Persistence & Prototype Scope](#data-persistence--prototype-scope)
- [Simulated TeleBirr Escrow & Features](#simulated-telebirr-escrow--features)
- [Accessibility, Performance & Testing](#accessibility-performance--testing)
- [Deployment Note](#deployment-note)

---

## Overview

**Shegger Wheels** is a peer-to-peer automotive mobility marketplace tailored to the urban landscape of Addis Ababa. The platform empowers vehicle owners to monetize their personal vehicles and enables renters (locals, business travelers, and diaspora visitors) to book verified cars directly from individual hosts in key neighbourhoods like Bole, Kazanchis, CMC, Old Airport, and Sarbet.

Designed around the **Urban Motion** design system, the interface blends high-contrast functionality with a warm mineral aesthetic:
- **Obsidian Dark** (`#111820`) for prominent contrast and structural containers.
- **Citron Electric** (`#D5F36A`) for primary calls-to-action and active status badges.
- **Warm Limestone** (`#F5F2EB`) for textured surface depth.
- **Terracotta Accent** (`#B9674B`) for warnings, disputes, and cancellations.
- **Plus Jakarta Sans** typography with tabular numerics for currency figures (`ETB`).

---

## Key Features & User Roles

Shegger Wheels supports three distinct user personas, each with tailored views and role-based permissions:

### 1. Renter
- **Explore & Filter:** Search vehicles by keyword, Addis Ababa neighbourhood, daily price range, transmission (Automatic / Manual), category, and seating capacity.
- **Car Detail View:** Inspect high-resolution 4-tile photo galleries, full-screen image lightboxes, host badges, verified reviews, and vehicle specifications.
- **Date Range Selection:** Select trip dates with automatic host blackout date validation and duration checks.
- **Simulated Reservation:** Transparent pricing breakdown (daily rate, platform service fee, refundable deposit) with instant booking submission.
- **Trip Tracking Hub:** Real-time visual progress milestone tracker (`Requested` → `Confirmed` → `In Progress` → `Completed`).
- **Renter Dashboard:** Overview of upcoming and completed journeys, printable booking receipts, and one-click CSV export.
- **Rating & Reviews:** Submit star ratings (1–5 stars) and detailed reviews for completed trips.

### 2. Owner (Host)
- **Vehicle Listing Creator:** Multi-step vehicle listing wizard supporting specs, features, Addis Ababa neighbourhood coordinates, and curated photo presets.
- **Blackout Calendar Manager:** Block custom date ranges to prevent booking conflicts with personal car use.
- **Booking Request Management:** Review incoming booking inquiries; confirm or decline requests with required rationale.
- **Trip Lifecycle Controls:** Handover verification to start trips and completion verification to release escrow.
- **Earnings & Financial Analytics:** Real-time breakdown of gross bookings, platform service fees, pending escrow, and net earnings in ETB.
- **Host Review Responses:** Reply directly to renter feedback to build host reputation.

### 3. Administrator
- **Listing Moderation Queue:** Review pending host vehicle submissions with photo inspection and approve or reject listings with mandatory notes.
- **Dispute Resolution Desk:** Investigate active disputes raised by renters or owners, record administrative findings, and mark disputes as resolved.
- **Platform Governance:** Conflict-of-interest protections (e.g., admins cannot approve their own listings).

---

## Technology Stack

- **Framework:** [Next.js 16.4.2](https://nextjs.org/) (App Router, Turbopack, Partial Prefetching, Cache Components)
- **Library:** [React 19.3.0](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/) (Strict mode enabled)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with custom `@theme` tokens and `@tailwindcss/turbopack`
- **Typography:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) via `next/font/google`
- **State Management:** Reactive browser storage via React 19 `useSyncExternalStore` with referential stability snapshot caching
- **Storage Engines:** Browser `localStorage` (persistent demo records) and `sessionStorage` (temporary demo session and checkout drafts)
- **Image Optimization:** Next.js `<Image>` component configured with AVIF and WebP format negotiation

---

## Main Pages & User Workflows

| Route | Page Name | Primary Workflow |
|---|---|---|
| `/` | **Landing Page** | Platform overview, Addis neighbourhood search widget, featured vehicles, trust guarantees, and diaspora mobility highlights. |
| `/cars` | **Vehicle Catalogue** | Search and filter vehicles with live price sliders, transmission filters, neighbourhood selectors, and responsive vehicle cards. |
| `/cars/[id]` | **Car Details** | Full specs, host profile, 4-photo mosaic gallery, full-screen lightbox, verified reviews, blackout conflict calendar, and reservation drawer. |
| `/checkout` | **Checkout & Escrow** | Order summary, driver details verification, simulated TeleBirr / CBE payment method selection, and escrow lock. |
| `/signin` | **Demo Sign-In** | One-click persona switcher (Renter, Owner, Admin) with role-switching capability, account status indicators, and sign-out. |
| `/dashboard` | **Renter Dashboard** | Active itinerary spotlight card, booking history ledger, printable receipts modal, and CSV export. |
| `/dashboard/host` | **Host Fleet Portal** | Fleet inventory, vehicle creator modal, blackout date editor, booking request approvals, trip handover controls, and earnings analytics. |
| `/dashboard/admin` | **Admin Moderation** | Vehicle approval/rejection queue with mandatory reason dialog, vehicle inspection drawer, dispute resolution desk, and platform metrics. |
| `/bookings/[id]` | **Booking Details** | Detailed reservation status, price breakdown, host contact dialog, cancellation, and dispute submission. |
| `/bookings/[id]/track` | **Trip Tracking Hub** | Simulated live trip progress timeline with status milestone updates, odometer check, and return handover confirmation. |

---

## Project Structure

```text
shegger-wheels/
├── app/                              # Next.js App Router routes & layouts
│   ├── layout.tsx                    # Root layout with Plus Jakarta Sans & Header/Footer
│   ├── page.tsx                      # Landing page with hero search & featured fleet
│   ├── globals.css                   # Tailwind v4 theme tokens, font utilities, focus rings
│   ├── cars/                         # Vehicle catalogue & [id] car detail pages
│   ├── checkout/                     # Multi-step checkout & simulated escrow
│   ├── signin/                       # One-click demo persona switcher
│   ├── dashboard/                    # Renter dashboard, /host portal, /admin moderation
│   └── bookings/[id]/                # Reservation detail & /track live trip timeline
├── components/                       # Modular UI components grouped by feature
│   ├── auth/                         # ProtectedRoute, SignInView
│   ├── bookings/                     # BookingDetailView, TripTrackingView
│   ├── cars/                         # CarDetailsView, VehicleCard
│   ├── checkout/                     # CheckoutView
│   ├── dashboard/                    # RenterDashboardView, HostFleetDashboardView, AdminModerationDashboardView
│   ├── home/                         # HomeSearchWidget
│   ├── layout/                       # Header, Footer
│   ├── notifications/                # NotificationBell with unread badges & drawer
│   ├── reviews/                      # SubmitReviewModal, OwnerResponseModal
│   └── ui/                           # Button, Badge, Container, Card, FormField, SectionHeading
├── lib/                              # Domain logic, data access, and storage layer
│   ├── types.ts                      # Core TypeScript interfaces (User, Car, Booking, Review, Dispute)
│   ├── seeds.ts                      # Seed data for Addis Ababa users, cars, bookings, disputes
│   ├── storage.ts                    # Safe localStorage/sessionStorage engine & isOptimizableImage helper
│   ├── auth.ts                       # Session management, role switching, suspended user guards
│   ├── bookings.ts                   # Booking lifecycle FSM, pricing logic, date conflict detector
│   ├── fleet.ts                      # Vehicle listing CRUD, blackout dates, moderation, earnings analytics
│   ├── notifications.ts              # In-app notifications with safe relative link sanitizer
│   ├── reviews.ts                    # Rating aggregates, review submission eligibility, owner responses
│   └── csv.ts                        # Secure CSV generation with formula injection (CWE-1236) sanitization
├── docs/                             # Comprehensive architectural and audit documentation
│   ├── REQUIREMENTS.md               # Capstone requirements & specifications
│   ├── USER-FLOWS.md                 # Complete user journeys and FSM diagrams
│   ├── DATA.md                       # Data dictionary & storage schema
│   ├── DESIGN-REFERENCE.md           # Urban Motion color tokens & component specs
│   ├── ACCESSIBILITY-RESPONSIVE-AUDIT.md # WCAG 2.1 AA audit & responsive tests
│   └── PERFORMANCE-CLEANUP.md        # Image optimization & build performance benchmarks
├── scratch/                          # Automated verification suites
│   ├── test_e2e_workflows.mjs        # 44-case end-to-end journey test suite
│   └── test_security_audit.mjs       # 65-case security, RBAC, and input validation suite
├── stitch_sheggar_wheels_mobility_platform/ # Google Stitch design reference templates
├── next.config.ts                    # Next.js config (AVIF/WebP, Unsplash remote pattern)
├── tsconfig.json                     # TypeScript strict configuration
└── package.json                      # Project dependencies and npm scripts
```

---

## Prerequisites & Local Installation

### Prerequisites
- **Node.js:** v18.17.0 or higher (tested on Node.js v20 and v24)
- **Package Manager:** `npm` (included with Node.js)

### Installation Steps

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/basaznewdaniel-fullstack/sq2-daniel-basaznew.git
   cd module-03-react-nextjs/Projects/shegger-wheels
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Available Commands

All available project commands can be executed from the project root:

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack on `http://localhost:3000`. |
| `npm run build` | Compiles the production application bundle and validates static page generation. |
| `npm run start` | Starts the production server using the compiled `.next` build. |
| `npm run lint` | Runs ESLint across all `.ts`, `.tsx`, and `.mjs` files to verify code quality. |
| `npx tsc --noEmit` | Executes TypeScript type checking across the entire project with zero code emission. |
| `npx tsx scratch/test_e2e_workflows.mjs` | Executes the 44-test end-to-end workflow verification suite. |
| `npx tsx scratch/test_security_audit.mjs` | Executes the 65-test security, RBAC, and boundary audit suite. |

---

## Demo Instructions & Seeded Accounts

The application includes realistic, internally consistent seed data tailored to Addis Ababa. No database setup or signup is required.

### Available Demo Personas

Navigate to `/signin` to switch between personas with a single click:

| Persona Name | Role | Email | Neighbourhood | Suggested Demo Journey |
|---|---|---|---|---|
| **Dawit Tadesse** | `owner` & `renter` *(Dual Role)* | `dawit.tadesse@example.et` | Bole | Experience both sides: rent cars as a guest or toggle to Host role in the navigation bar to manage listings and earnings. |
| **Sara Hailu** | `renter` | `sara.hailu@example.et` | CMC | View active and completed itineraries on `/dashboard`, track live trips, print receipts, and export CSV booking history. |
| **Abebe Kebede** | `owner` | `abebe.kebede@example.et` | Kazanchis | Access `/dashboard/host` to review incoming bookings, manage blackout dates, start/complete trips, and reply to reviews. |
| **Yared Mulugeta** | `admin` | `admin@sheggerwheels.et` | Bole | Access `/dashboard/admin` to review the vehicle moderation queue, inspect car photos, and resolve disputes. |
| **Kibreab Tesfaye** | `renter` *(Suspended)* | `kibreab.suspended@example.et` | Sarbet | Demonstrates security guardrails: access is blocked at sign-in with an administrative policy notice. |

### How to Reset Demo Data

If demo records become heavily modified during testing, restore the initial baseline state at any time:
1. Open the user profile dropdown in the top-right corner of the navigation bar.
2. Click **"Reset Demo Data"**.
3. Confirm the prompt to restore seed cars, bookings, reviews, disputes, and notifications to their original default state.

*(The reset operation is strictly isolated to Shegger Wheels keys and does not affect unrelated browser storage).*

---

## Data Persistence & Prototype Scope

### How Storage Works
- **`localStorage`**: Stores persistent demo records across browser reloads:
  - `sw_cars_v1` — Vehicle catalogue and host listings
  - `sw_bookings_v1` — Booking reservations and status history
  - `sw_reviews_v1` — Ratings, comments, and host responses
  - `sw_disputes_v1` — Administrative dispute records
  - `sw_notifications_v1` — User notifications and read states
  - `sw_users_v1` — Seed user profiles
- **`sessionStorage`**: Stores temporary session state:
  - `sw_session_v1` — Current signed-in persona and active role
  - `sw_checkout_draft_v1` — Active booking dates and car selection during checkout

### Prototype Scope & Limitations
- **Frontend-Only Scope:** There is no remote backend or database. All data is managed locally in the client's browser.
- **Client Isolation:** Changes made in one browser profile (e.g., Chrome) will not sync to a different browser (e.g., Firefox) or an Incognito window.
- **Security Context:** Authorization and validation checks (ownership checks, role-based route protection, state transition guards, CSV formula injection neutralization) are implemented in client-side TypeScript to demonstrate proper application architecture. In a production system, these checks would be enforced by a hardened backend API.

---

## Simulated TeleBirr Escrow & Features

To deliver a complete car rental marketplace experience without handling real financial transactions, Shegger Wheels simulates local Ethiopian payment and verification mechanisms:

1. **Simulated TeleBirr & CBE Birr Escrow:**
   - Real payment credentials or passwords are **never** requested or collected.
   - When a booking is confirmed, payment status transitions to `held_in_escrow` with a generated mock reference code (e.g., `TB-MOCK-819273`).
   - Escrow funds remain locked until the owner confirms return handover on `/dashboard/host` or `/bookings/[id]/track`, at which point funds disburse to the host's earnings ledger.
2. **In-App Notification Center:**
   - The bell icon in the navigation bar displays unread notification badges.
   - Triggers automated notifications on booking requests, host confirmations, trip handovers, completed trips, and admin moderation decisions.
   - All links in notifications are validated to guarantee safe internal navigation.
3. **Printable Receipts & CSV Export:**
   - Renter dashboard provides a simulated printable official receipt modal.
   - CSV export feature applies RFC 4180 escaping and prefixing (`'`) to neutralize CSV Formula Injection (CWE-1236) vulnerabilities.

---

## Accessibility, Performance & Testing

### Accessibility (WCAG 2.1 AA)
- **High-Contrast Focus Rings:** Custom obsidian and citron focus visible outlines on all interactive buttons, inputs, and navigation links.
- **Keyboard Navigation:** Full tab order navigation; modals and full-screen lightboxes feature focus traps and `Escape` key listeners.
- **Screen Reader Support:** Accessible labels (`aria-label`, `aria-expanded`, `aria-controls`), live regions for dynamic alerts, and an accessible "Skip to main content" link.
- **Motion Sensitivity:** Respects user `prefers-reduced-motion` settings by disabling non-essential transitions and animations.
- *Detailed audit findings: [ACCESSIBILITY-RESPONSIVE-AUDIT.md](docs/ACCESSIBILITY-RESPONSIVE-AUDIT.md)*

### Performance Optimization
- **Next.js Image Pipeline:** Remote Unsplash photos and local assets are converted to modern AVIF/WebP formats with responsive `sizes` attributes, achieving up to 90–95% payload reduction compared to unoptimized JPEGs.
- **Snapshot Referential Stability:** Raw string change detection in `useSyncExternalStore` eliminates unnecessary re-renders and resolves React 19 maximum update depth warnings.
- **Sub-2s Static Generation:** Turbopack compiles 33 routes in ~3.2s with static page generation completing in ~1.6s.
- *Detailed audit findings: [PERFORMANCE-CLEANUP.md](docs/PERFORMANCE-CLEANUP.md)*

### Automated Test Verification
Run both automated test suites locally:
```bash
# Run 44-case End-to-End Workflow Suite (Renter, Owner, Admin journeys)
npx tsx scratch/test_e2e_workflows.mjs

# Run 65-case Security, RBAC & Storage Validation Suite
npx tsx scratch/test_security_audit.mjs
```
- **Workflow Suite:** 44/44 passed (Discovery, Booking, Conflict Detection, Moderation, Trip Lifecycle, Reviewing, Reset).
- **Security Audit:** 65/65 passed (Signed-out mutation rejection, Cross-tenant data isolation, Privilege escalation defense, FSM transitions, CWE-1236 CSV injection defense, Storage corruption recovery).

---

## Deployment Note

This project is a standard Next.js App Router application optimized for deployment via GitHub integration on [Vercel](https://vercel.com):
1. Push the code to a GitHub repository.
2. Import the project into the Vercel dashboard.
3. Vercel automatically detects Next.js, executes `npm run build`, and serves the application globally across edge locations with zero server configuration required.

*(Note: Per project requirements, this repository remains a local demonstration prototype and has not been deployed to production).*

---

## License & Credits

Built as part of the IBT Full-Stack Academy React & Next.js Capstone Module.  
Designed according to the Google Stitch **Urban Motion** specification for Addis Ababa, Ethiopia.
