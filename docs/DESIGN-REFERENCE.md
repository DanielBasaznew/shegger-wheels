# Shegger Wheels — Google Stitch Design Reference & Route Mapping

## 1. Design System Overview ("Urban Motion")
The visual identity of Shegger Wheels is derived from the **Urban Motion** design system (`stitch_sheggar_wheels_mobility_platform/urban_motion/DESIGN.md`). The aesthetic is an architectural, editorial automotive tone fusing metropolitan velocity with structural discipline:
- **Baseline Canvas**: Warm Limestone (`#F5F2EB`) rather than sterile pure white.
- **Authoritative Contrast**: Obsidian Navy (`#111820`) for authoritative typography, dark containers, and primary navigational frameworks.
- **Conversion Trigger**: Electric Citron (`#D5F36A`) reserved for primary conversion CTAs, active ride tracking, selected dates, and high-visibility map anchors.
- **Tertiary Accent**: Restrained Terracotta (`#B9674B`) for trip duration alerts, cancellation warnings, and geographic accents.
- **Utility Neutral**: Muted Slate (`#66717D`) for hairline 1px borders (`rgba(102, 113, 125, 0.18)`), micro-labels, and metadata.
- **Typography**: **Plus Jakarta Sans** with negative tracking on bold headlines, uppercase `label-caps` for badges/chips, and `tabular-nums` for ETB pricing and specs.

---

## 2. Stitch Screen Audit

All design assets are located in the repository folder: `stitch_sheggar_wheels_mobility_platform/`.

| Screen Name | Directory Path | Key Assets | Primary Route | Purpose & Key Features |
|---|---|---|---|---|
| **Homepage** | `stitch_sheggar_wheels_mobility_platform/homepage/` | `code.html`<br>`screen.png` | `/` | Hero section, metropolitan search bar, featured vehicle cards, "How Shegger Wheels Works" 4-step grid, Ethiopian escrow guarantees, and footer. |
| **Car Catalogue** | `stitch_sheggar_wheels_mobility_platform/car_catalogue/` | `code.html`<br>`screen.png` | `/cars` | Full vehicle inventory with search query input, Addis neighbourhood filter chips (Bole, Kazanchis, CMC, etc.), transmission/seat filters, tabular pricing, and pagination. |
| **Car Details** | `stitch_sheggar_wheels_mobility_platform/car_details/` | `code.html`<br>`screen.png` | `/cars/[id]` | 16:10 photo showcase, host trust badges, high-density telemetry specs grid, pickup location badge, interactive date picker, and direct booking trigger. |
| **Demo Sign In** | `stitch_sheggar_wheels_mobility_platform/demo_sign_in/` | `code.html`<br>`screen.png` | `/signin` | Quick demo account cards (Renter, Owner, Admin), simulated phone/email login, role descriptions, and safe return path redirection. |
| **Checkout** | `stitch_sheggar_wheels_mobility_platform/checkout/` | `code.html`<br>`screen.png` | `/checkout` | Mock TeleBirr / Chapa payment flow, itemized price breakdown (rental rate, platform fee, security deposit), escrow security terms, and confirmation. |
| **Renter Dashboard** | `stitch_sheggar_wheels_mobility_platform/renter_dashboard/` | `code.html`<br>`screen.png` | `/dashboard` | Left sidebar navigation, active escrow balance chip, upcoming and completed trip cards, booking status pill indicators, and quick links to booking tracking. |

---

## 3. Capstone Route Mapping & Design Gaps

### 3.1 Directly Covered Routes
The following routes have pixel-precise Stitch reference layouts:
- `/` ➔ `homepage`
- `/cars` ➔ `car_catalogue`
- `/cars/[id]` ➔ `car_details`
- `/signin` ➔ `demo_sign_in`
- `/checkout` ➔ `checkout`
- `/dashboard` ➔ `renter_dashboard`

### 3.2 Design System Extension (Gaps Not in Stitch)
The capstone specification includes Owner and Admin capabilities that do not have dedicated Stitch mockups:
1. **Renter Booking Management**:
   - `/bookings`: Extends the table/card components from `renter_dashboard`.
   - `/bookings/[id]`: Extends receipt and telemetry cards from `checkout` and `car_details`.
   - `/bookings/[id]/track`: Integrates Leaflet map with Urban Motion Obsidian/Citron theme.
   - `/bookings/[id]/review`: Extends modal/form inputs from Urban Motion design specifications.
2. **Owner Suite**:
   - `/owner`, `/owner/cars`, `/owner/cars/new`, `/owner/cars/[id]/availability`, `/owner/earnings`, `/owner/reviews`: Reuses the sidebar navigation pattern, metrics cards, form inputs, and typography from `renter_dashboard` and `urban_motion/DESIGN.md`.
3. **Admin Suite**:
   - `/admin`, `/admin/listings`, `/admin/users`, `/admin/disputes`, `/admin/reports`, `/admin/announcements`: Reuses Urban Motion layout grids, status chips, data tables, and Recharts color tokens (Obsidian `#111820`, Citron `#D5F36A`, Terracotta `#B9674B`).

---

## 4. Key Component Standards for Implementation
- **Vehicle Card**: 16:10 aspect ratio image, floating neighbourhood pill badge (e.g. `BOLE • AUTOMATIC`), host verification checkmark, ETB daily rate formatted with `font-specs-tabular`.
- **Action Buttons**:
  - *Primary Conversion*: Background `#D5F36A` (Electric Citron), text `#111820` (Obsidian Navy), font weight 600, rounded pill (`rounded-full`) or `rounded-xl`.
  - *Secondary Action*: Background `#111820`, text `#F5F2EB` (Warm Limestone).
- **Filter Chips**: Pill containers (`rounded-full`) with active state transitioning from White to `#111820` with white text.
- **Form Controls**: Crisp `#66717D/25` 1px borders, rounded corners (`rounded-lg`), focusing cleanly to Obsidian Navy with subtle ring.

---

## 5. Next Implementation Priorities
Based on capstone requirements and the Stitch design audit, the recommended implementation sequence is:
1. **Core Data & Storage Foundation**: Implement browser storage abstraction (`readStorage`, `writeStorage`), entity TypeScript interfaces, seed data (cars across Addis neighbourhoods, demo users, sample bookings), and session helper (`getCurrentSession`, `signInAsDemo`).
2. **Design System & Theme Integration**: Configure Tailwind CSS v4 with Urban Motion design tokens (colors, typography, radii, containers) and install/verify Plus Jakarta Sans.
3. **Public Experience**: Implement pixel-faithful Stitch Homepage (`/`), Catalogue with live filters & pagination (`/cars`), and Car Details (`/cars/[id]`).
4. **Demo Authentication & Guards**: Implement Stitch Demo Sign-in (`/signin`) with safe return URL validation, and role guardrails.
5. **Checkout & Booking Lifecycle**: Implement Stitch Checkout (`/checkout`) with mock TeleBirr simulation, and booking state transitions.
6. **Renter Portal**: Implement Stitch Renter Dashboard (`/dashboard`), trip tracking, review submission, and booking history CSV export.
7. **Owner Tools & Admin Governance**: Build Owner fleet management/earnings and Admin moderation/disputes according to the Urban Motion design system.
