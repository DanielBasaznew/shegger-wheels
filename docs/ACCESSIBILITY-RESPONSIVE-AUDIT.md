# Shegger Wheels — Responsive Design & Accessibility Audit Report

**Specification Reference:** Task 17 of 20  
**Audit Date:** October 23, 2026  
**Auditor:** QA & Accessibility Engineering Team  
**Standard Evaluated:** WCAG 2.1 Level AA Compliance & Responsive Layout Integrity  
**Scope:** Frontend-only Next.js architecture (localStorage/sessionStorage simulated persistence)

---

## 1. Executive Summary

This audit evaluated the responsive layouts, keyboard accessibility, semantic landmarks, and interaction states across all major user journeys in **Shegger Wheels**—a peer-to-peer car rental marketplace tailored for Addis Ababa.

### Key Audit Outcomes
- **Zero Horizontal Overflow:** Verified across mobile (375px, 390px), tablet (768px), and desktop (1280px+) viewports.
- **Full Keyboard Operability:** All interactive components (navigation drawers, header profile menus, notification dropdowns, catalogue filters, booking aside, photo gallery lightbox, host fleet management, admin arbitration, and modal overlays) are reachable via `Tab`/`Shift+Tab` and dismissible via `Escape`.
- **High-Contrast Focus Indicators:** Standardized global `:focus-visible` styling (`outline: 2px solid #111820`, `outline-offset: 2px`, `box-shadow: 0 0 0 4px rgba(213, 243, 106, 0.45)`) implemented across light backgrounds, with automatic lime inversion (`#D5F36A`) on dark surfaces.
- **Reduced Motion Support:** Respects user OS preferences (`prefers-reduced-motion: reduce`) by disabling CSS animations/transitions and halting continuous SVG telematic waypoint loops.
- **Build & Quality Gates:** Passed `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), and `npm run build` (33/33 pre-rendered routes successfully optimized).

---

## 2. Tested Routes & Viewport Matrix

| Route | Viewports Tested | Key Focus Areas | Status |
|---|---|---|---|
| `/` (Landing Page) | 390px, 768px, 1280px | Skip link, hero search, category pills, escrow trust markers | Verified |
| `/cars` (Catalogue) | 390px, 768px, 1280px | Responsive filter sidebar drawer, price slider, vehicle cards, pagination | Verified |
| `/cars/[id]` (Vehicle Details) | 390px, 768px, 1280px | Mobile sticky reservation bar, photo lightbox, host contact modal, telemetry | Verified |
| `/checkout` (Reservation) | 390px, 768px, 1280px | Date inputs with `aria-describedby`, custom radio card focus rings, escrow summary | Verified |
| `/bookings/[id]/track` (Telematics) | 390px, 768px, 1280px | Waypoint map SVG landmarks, live event log region, reduced motion pause | Verified |
| `/dashboard` (Renter Hub) | 390px, 768px, 1280px | Horizontally scrollable table with keyboard focus, QR pass dialog, cancel modal | Verified |
| `/dashboard/host` (Owner Fleet) | 390px, 768px, 1280px | Utilization table, Add/Edit Vehicle modal, Blackout Dates calendar, dispute trigger | Verified |
| `/dashboard/admin` (Governance) | 390px, 768px, 1280px | Moderation queue tablist, dispute arbitration modal, rejection reason validation | Verified |
| `/signin` (Demo Persona Switcher) | 390px, 768px, 1280px | Quick persona switcher cards, credentials form, accessible password toggle | Verified |

---

## 3. Findings & Corrective Engineering Actions

### 3.1 Landmark Semantics & Skip Links (WCAG 1.3.1, 2.4.1)
- **Issue:** The root Next.js `layout.tsx` lacked a mechanism for keyboard-only and screen reader users to bypass top-level navigation, requiring multiple tab presses on every page load. Additionally, nested `<main>` tags were present in `app/cars/page.tsx` and dashboard sub-views.
- **Fix:**
  - Added a prominent Skip-to-Main-Content link (`<a href="#main-content" ...>Skip to main content</a>`) in `app/layout.tsx`. It remains visually off-screen until focused, then surfaces with high contrast (`bg-[#111820] text-[#D5F36A] ring-2 ring-[#D5F36A]`).
  - Wrapped global page content in a single top-level `<main id="main-content" tabIndex={-1} ...>`.
  - Replaced nested `<main>` elements in `app/cars/page.tsx` with semantic `<div id="catalogue-results">` containers.

### 3.2 Visible Focus Indicators & Custom Controls (WCAG 2.4.7)
- **Issue:** Modern CSS resets and Tailwind defaults often silence outlines (`outline: none`), making navigation invisible for keyboard users. Furthermore, customized radio buttons and star rating controls lacked focus-within indicators.
- **Fix:**
  - Added global `:focus-visible` utility classes in `app/globals.css`:
    ```css
    :focus-visible {
      outline: 2px solid #111820;
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(213, 243, 106, 0.45);
    }
    .bg-\[\#111820\] :focus-visible {
      outline: 2px solid #D5F36A;
      outline-offset: 2px;
    }
    ```
  - In `CheckoutView.tsx`, added `focus-within:ring-2 focus-within:ring-[#111820] focus-within:ring-offset-2` to handover preference radio cards so tabbing through options clearly highlights the selected card.
  - In `SubmitReviewModal.tsx`, implemented accessible `role="radiogroup"` with star buttons having `role="radio"`, `aria-checked`, and readable labels (e.g., `aria-label="Rate 5 stars"`).

### 3.3 Dialog & Modal Overlays (WCAG 2.1.2, 4.1.2)
- **Issue:** Multiple modal overlays across host, renter, and admin views lacked `role="dialog"`, `aria-modal="true"`, and associated accessible headings. Several modals lacked keyboard `Escape` dismissal or did not restore focus to their trigger elements upon closing.
- **Fix:**
  - Enforced `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="<modal-title-id>"` across all application modals:
    - Host Fleet: Confirm Reservation, Decline Reservation, Handover Key, Complete Return, Report Dispute, Vehicle Form, and Blackout Dates Manager.
    - Renter Dashboard: Digital QR Boarding Pass, Reservation Receipt, and Cancel Booking Dialog.
    - Vehicle Detail: Contact Host Modal and Photo Lightbox Carousel.
    - Admin Portal: Listing Inspection, Approval Confirmation, Rejection Reason Form, and Dispute Arbitration.
  - Attached global `Escape` key event listeners with clean teardown to dismiss active modals.
  - Added accessible `aria-label="Close dialog"` attributes to all dismissal buttons (`✕`).

### 3.4 Mobile Responsive Layouts & Sticky Actions (WCAG 1.4.10)
- **Issue:** On mobile screens (< 768px), the vehicle reservation card on `/cars/[id]` was positioned at the very bottom of long mechanical specs and host bios, requiring excessive scrolling to reserve. Additionally, tables on `/dashboard` and `/dashboard/host` caused horizontal clipping for keyboard users.
- **Fix:**
  - Implemented a sticky bottom reservation action bar in `CarDetailsView.tsx` (`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#66717D]/20 p-4`) displaying the daily rate and a "Reserve Now" button that smooth-scrolls directly to the booking form.
  - Wrapped all data tables with horizontal scroll containers containing `tabIndex={0}`, `role="region"`, and accessible names (`aria-label="Booking history table"`, `aria-label="Fleet utilization table"`) so keyboard users can scroll through columns using arrow keys.
  - Optimized the catalogue filter sidebar on mobile: converted into an off-canvas drawer with an explicit close button (`✕`) and "Apply & View Results" trigger.

### 3.5 Form Accessibility & Error Association (WCAG 3.3.1, 3.3.2)
- **Issue:** In the checkout and admin rejection workflows, error messages were visually rendered but not programmatically linked to their input fields.
- **Fix:**
  - Added explicit `<label htmlFor="...">` bindings to all form fields.
  - Linked validation errors via `aria-describedby="<error-element-id>"` and set `aria-invalid="true"` when fields fail validation.
  - Added `role="alert"` and `aria-live="assertive"` to validation error banners so screen readers immediately announce errors without requiring focus displacement.

### 3.6 Reduced Motion & Telematics (WCAG 2.3.3)
- **Issue:** Continuous pulsing map markers and simulated vehicle telemetry intervals in `TripTrackingView.tsx` could cause discomfort for users with vestibular or motion sensitivities.
- **Fix:**
  - Added global media query in `app/globals.css`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    ```
  - In `TripTrackingView.tsx`, integrated runtime `window.matchMedia('(prefers-reduced-motion: reduce)')` checks to pause continuous telemetry simulation intervals and provide a clean manual step control instead.

### 3.7 Dynamic Screen Reader Announcements (WCAG 4.1.3)
- **Issue:** Changes to unread notification counts or telematic waypoint status updates were not automatically communicated to assistive tech.
- **Fix:**
  - Added `role="status"` and `aria-live="polite"` regions to `NotificationBell.tsx` to announce count changes (`"You have X unread notifications"`).
  - Added `role="region"` with `aria-label` describing current waypoint telemetry, and `role="log"` to the vehicle transit feed.

---

## 4. Verification & Testing Evidence

1. **TypeScript Type Safety:**
   - Command: `npx tsc --noEmit`
   - Result: `0 errors` (Exit Code 0).
2. **ESLint Code Quality:**
   - Command: `npm run lint`
   - Result: `0 errors, 0 warnings` (Exit Code 0).
3. **Production Next.js Build:**
   - Command: `npm run build`
   - Result: Clean compile in 4.3s, 33/33 static and partially pre-rendered routes generated (Exit Code 0).
4. **End-to-End Workflow Verification:**
   - Command: `npx tsx scratch/test_e2e_workflows.mjs`
   - Result: `44/44 tests passed` (Exit Code 0).
5. **Security & Permission Audit Verification:**
   - Command: `npx tsx scratch/test_security_audit.mjs`
   - Result: `65/65 tests passed` (Exit Code 0).
6. **Cross-Viewport Browser Session:**
   - Recording: `a11y_responsive_audit_1792720723873.webp`
   - Tested: Mobile (390x844), Tablet (768x1024), Desktop (1280x800).
   - Validated: Mobile navigation toggle, filter drawer open/close, sticky bottom reservation bar, tablet host dashboard utilization table, desktop profile dropdown Escape dismissal, and Admin Moderation queue/disputes ledger switcher.

---

## 5. Scope Boundaries & Remaining Limitations

1. **Simulated Storage Scope:** All data persistence relies on client-side `localStorage` and `sessionStorage`. Cross-device synchronization or server-side screen reader rendering depends on local browser capabilities.
2. **Mock Telematics Map:** Vehicle tracking is rendered as an accessible SVG vector canvas with semantic coordinate descriptors, rather than a heavy WebGL canvas (such as Mapbox or Google Maps), ensuring lightweight performance and superior screen reader compatibility.
3. **Automated Tooling Scope:** Auditing utilized browser viewport inspection, keyboard event tracing, and linting rules. Full WCAG 2.1 AAA compliance (e.g., 7:1 text contrast on secondary badges or user-customizable color schemes) remains an enhancement outside the MVP specification.
