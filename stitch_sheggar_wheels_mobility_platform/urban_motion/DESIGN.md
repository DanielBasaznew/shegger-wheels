---
name: Urban Motion
colors:
  surface: '#fcf9f2'
  surface-dim: '#dcdad3'
  surface-bright: '#fcf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ec'
  surface-container: '#f1eee7'
  surface-container-high: '#ebe8e1'
  surface-container-highest: '#e5e2db'
  on-surface: '#1c1c18'
  on-surface-variant: '#44474b'
  inverse-surface: '#31312c'
  inverse-on-surface: '#f3f0e9'
  outline: '#75777c'
  outline-variant: '#c5c6cb'
  surface-tint: '#585f69'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#151c24'
  on-primary-container: '#7d848f'
  inverse-primary: '#c0c7d2'
  secondary: '#536600'
  on-secondary: '#ffffff'
  secondary-container: '#ceec64'
  on-secondary-container: '#576a00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#390c00'
  on-tertiary-container: '#c16d51'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce3ee'
  primary-fixed-dim: '#c0c7d2'
  on-primary-fixed: '#151c24'
  on-primary-fixed-variant: '#404751'
  secondary-fixed: '#d1ef67'
  secondary-fixed-dim: '#b6d24d'
  on-secondary-fixed: '#171e00'
  on-secondary-fixed-variant: '#3e4c00'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#76331b'
  background: '#fcf9f2'
  on-background: '#1c1c18'
  surface-variant: '#e5e2db'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  specs-tabular:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an architectural, editorial automotive tone for an urban peer-to-peer car sharing ecosystem. The aesthetic fuses metropolitan momentum with structural restraint: high-end modern layout architecture, generous typographic contrast, asymmetric grid placements, and crisp, physical boundaries. 

The visual identity targets discerning urban drivers, diaspora visitors, and local car owners who require effortless mobility without commercial vehicle rental friction. The experience feels assured, technical, and grounded rather than playful or gamified. We lean into the materiality of the city: warm mineral limestone tones evoke historic masonry, obsidian navy conveys mechanical solidity, and an electric citron punch acts as an energetic spark for dynamic interactions and confirmations.

Visual balance is achieved through strict negative space discipline, monolithic sans-serif typography, crisp 1px structural dividing lines, tactile pill-shaped utility badges, and bespoke vehicle telemetry modules. Gratuitous neon blurs, chaotic gradients, and ornamental emoji embellishments are strictly forbidden in favor of refined mechanical clarity.

## Colors

The color system is organized around contrast hierarchy and utility. The canvas default is not pure white or harsh zinc, but **Warm Limestone** (`#F5F2EB`), an architectural foundation that eliminates glare while providing a refined baseline.

### Palette Architecture
- **Obsidian Navy (`#111820`):** The primary color anchor. Applied across authoritative typography, primary actions, deep contrast containers, dark mode modules, and critical navigational frameworks.
- **Electric Citron (`#D5F36A`):** The catalytic secondary accent. Reserved for primary conversion triggers (CTAs), search confirmation actions, active ride trackers, selected dates, and high-visibility map anchors. Never used for long-form text or passive backgrounds.
- **Restrained Terracotta (`#B9674B`):** The warm tertiary color. Used strategically for trip duration alerts, cancellation policies, subtle geographic highlights, and warning statuses without the alarmism of generic primary red.
- **Warm Limestone (`#F5F2EB`):** The root neutral canvas. Grounds pages with a tactile, editorial paper-like grain.
- **Clean White (`#FFFFFF`):** Reserved for elevated surface cards, modal dialogue layers, and contrasting data panels against the limestone background.
- **Muted Slate (`#66717D`):** The utility neutral. Deployed for subtle hairline borders (`border-[#66717D]/20`), micro-labels, metadata, specs separators, and non-interactive iconography.

### State & Contrast Applications
- **Interactive Citron:** Primary interactive buttons pair `#D5F36A` with `#111820` text for maximum daylight legibility and WCAG AAA compliance.
- **Muted Borders:** Surface divisions rely on 1px borders using `#66717D` at 15–25% opacity to maintain structure without cluttering density.

## Typography

The type system is powered by **Plus Jakarta Sans**, chosen for its crisp geometric contours, wide apertures, and clean automotive character. The type scales lean on dramatic tension between massive editorial display headlines and micro-calibrated technical specs.

### Hierarchy & Style Rules
- **Display & Headlines:** Headings utilize tight negative letter-spacing (`-0.02em` to `-0.03em`) and heavy weights (`700` and `800`) to evoke modern editorial speed and presence.
- **Tabular Figures & Automotive Specs:** Currency figures (e.g., `3,500 ETB / day`), transmission rates, engine capacities, and availability metrics must leverage open-type tabular numbers (`font-variant-numeric: tabular-nums`) to preserve columnar precision across inventory feeds.
- **Micro Labels & Badges:** Metadata badges, neighborhood tags (e.g., *BOLE*, *KAZANCHIS*, *OLD AIRPORT*, *CMC*), and filter triggers apply `label-caps` in uppercase with elevated letter-spacing (`0.08em`) for immediate scannability.

## Layout & Spacing

The structural layout relies on an asymmetric 12-column fluid grid system on desktop, collapsing to an 8-column layout on tablet and a 4-column layout on mobile devices. 

### Grid & Composition Rules
- **Container Strategy:** The outer canvas maintains a generous maximum container width of `1360px` with intentional offset columns. High-value automotive feature lists leverage a 7:5 ratio layout (vehicle imagery alongside technical booking configurations).
- **Rhythmic Densities:** Spacing relies on strict base-4 multiples. Compact data surfaces (specs sheets, verification forms) utilize tight gaps (`space-xs` and `space-sm`), while promotional panels and listing overviews breathe with `space-lg` and `space-xl`.
- **Canvas Continuity:** Full-bleed background bands alternate between Warm Limestone (`#F5F2EB`) and Obsidian Navy (`#111820`) to create clear sectional thresholds without artificial dividers.

## Elevation & Depth

Visual depth is expressed through clean physical layering and structural outlines rather than heavy blurred drop shadows. The design system uses an architectural surface-container philosophy:

1. **Surface 0 (Base Canvas):** Warm Limestone (`#F5F2EB`), entirely flat, non-elevated.
2. **Surface 1 (Card & Sheet Tier):** Clean White (`#FFFFFF`) surfaces elevated through crisp hairlines: `border: 1px solid rgba(102, 113, 125, 0.18)` accompanied by an ambient, barely perceptible tint shadow: `box-shadow: 0 4px 20px -2px rgba(17, 24, 32, 0.04)`.
3. **Surface 2 (Floating Modals & Date Pickers):** Elevated above the canvas with a refined multi-stop shadow: `box-shadow: 0 12px 32px -4px rgba(17, 24, 32, 0.08), 0 2px 6px -1px rgba(17, 24, 32, 0.04)` enclosed with a 1px border.
4. **Surface 3 (Monolithic Anchors):** Solid Obsidian Navy (`#111820`) blocks that sit recessed or locked to the viewport (e.g., bottom booking bars, sticky search engines).
5. **No Skeuomorphic Glows:** Citron accents and action states never feature neon aura glows. Hover and active states are communicated solely through mechanical surface shifts, border-color illumination, and micro-transforms.

## Shapes

The geometric architecture balances soft tactile radii with clean structural containers. 

- **Level 2 (`rounded-lg: 1rem`, `rounded-xl: 1.5rem`):** Applied uniformly across interactive cards, vehicle imagery frames, sheet flyouts, and modal wrappers. 
- **Pill Geometry (`rounded-full`):** Reserved selectively for interactive filter chips, status badges, price indicators, and high-frequency tactile CTA buttons to optimize touch targets on mobile viewports.
- **Strict Hairline Accents:** Inner controls (input boxes, specification chips, toggle frames) use an internal corner radius of `0.5rem` (`rounded-md`) to produce concentric nesting within parent cards.

## Components

### Buttons
- **Primary CTA (Conversion):** Background in Electric Citron (`#D5F36A`), text in Obsidian Navy (`#111820`), font weight `600`, radius `rounded-full` or `rounded-xl`. Hover state transitions background brightness subtly with a `1px` translation along the Y-axis.
- **Secondary CTA:** Obsidian Navy (`#111820`) background with Warm Limestone (`#F5F2EB`) text. Used for account actions, host registration, and secondary details.
- **Ghost / Outline:** Transparent background, 1px border in `#66717D/30`, Obsidian Navy text. Hover triggers background in `#FFFFFF` with full border opacity.

### Vehicle Card
- Built on a Clean White (`#FFFFFF`) container with `rounded-xl` and a `1px solid rgba(102, 113, 125, 0.16)` border.
- **Header:** Features an uncropped 16:10 aspect ratio vehicle image frame with an embedded floating tag top-right for the neighborhood (e.g., "BOLE • HYBRID") in `label-caps` typography.
- **Body:** Vehicle make and model in `headline-sm`, host verification checkmark, and a horizontal spec strip displaying tabular attributes (Seats, Gearbox, Fuel policy) separated by hairline vertical slashes.
- **Footer:** Direct pricing presentation: `ETB X,XXX` in bold specs font, paired with a compact "Rent" button or instant-book bolt indicator.

### Filter & Neighborhood Chips
- Pill-shaped (`rounded-full`) containers with padding `py-2 px-4`.
- **Default State:** Clean White background, 1px border `#66717D/25`, text `#111820`.
- **Active State:** Obsidian Navy background (`#111820`), text `#FFFFFF`, border-color `#111820`. An optional trailing count badge appears with Citron text.

### Inputs & Date-Range Pickers
- **Containers:** Background `#FFFFFF`, 1px border `#66717D/25`, radius `rounded-lg`, interior padding `px-4 py-3`.
- **Focus State:** 1px border transitions directly to Obsidian Navy (`#111820`) with a zero-offset outline ring of `2px rgba(17, 24, 32, 0.08)`.
- **Floating Labels:** Rendered in `label-caps` in Muted Slate (`#66717D`) stacked directly above the active tabular entry.

### Telemetry & Spec Modules
- High-density data grid used on vehicle detail screens. Two-column or four-column layout composed of Warm Limestone-tinted cells (`#F5F2EB/60`) within the white parent card.
- Displays transmission, engine, deposit requirement in ETB, and delivery perimeter.

### Checkboxes & Segmented Radios
- **Checkbox:** Square with `rounded-md` (4px), 1.5px border `#66717D/40`. Selected state fills with Obsidian Navy (`#111820`) with an Electric Citron check icon.
- **Segmented Radio:** Pill-shaped pill switches in an enclosed `#F5F2EB` tray with smooth slide animation. Active pill is Clean White with deep obsidian typography.