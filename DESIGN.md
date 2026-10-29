---
name: Triage Ops
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bec9c7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#889391'
  outline-variant: '#3e4948'
  surface-tint: '#84d5ce'
  primary: '#84d5ce'
  on-primary: '#003734'
  primary-container: '#0b6e69'
  on-primary-container: '#9cede6'
  inverse-primary: '#006a65'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#8a5700'
  on-tertiary-container: '#ffd8ac'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a0f1ea'
  primary-fixed-dim: '#84d5ce'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#00504c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  code-stream:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-telemetry:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-caption:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system sets the atmosphere for a high-stakes, interactive technical simulation where the player acts as an on-call site reliability engineer resolving a critical hospital clinical appointment outage. The visual identity balances clinical precision, tense operational telemetry, and focused calm under pressure.

### Philosophy & Visual Identity
- **Style Direction:** High-contrast technical realism combined with serene, modern minimalism. It avoids frantic, cliché neon terminal tropes in favor of an authentic, institutional enterprise command center aesthetic.
- **Atmosphere:** Deep charcoal and slate substrates reduce cognitive glare while spotlighting mission-critical system state changes. Deep teal acts as the steadying anchor, emerald green communicates stabilized systems and patient safety metrics, and alert amber-orange drives urgent telemetry countdowns and cascading failures.
- **Emotional Resonance:** High focus, intellectual tension, clinical accountability, and professional mastery.

## Colors

The palette uses dark tactical neutrals paired with high-clarity semantic accents. Contrast ratios strictly adhere to WCAG AAA standards for critical telemetry and primary typography.

### Roles & Hex Tokens
- **Canvas Base (`#090d16`):** The foundational void beneath all telemetry panels.
- **Surface Layer 1 (`#0f172a`):** Deep slate-charcoal used for root view layouts and inactive modules.
- **Surface Layer 2 (`#1e293b`):** Mid-tone slate for cards, interactive logs, and operational modals.
- **Surface Elevated (`#334155`):** High-level overlays, hover states, and floating incident drawers.
- **Primary Teal (`#0b6e69`):** The core brand tone representing systematic recovery, infrastructure health, and standard operational commands.
- **Primary Teal Bright (`#14b8a6`):** Used on dark surfaces for interactive focus rings, active links, and primary button labels.
- **Secondary Emerald (`#10b981`):** Signals recovered databases, successful API failovers, stabilized patient queue counts, and resolved incidents.
- **Tertiary Alert Amber (`#f59e0b`):** Highlights SLA breach countdowns, dropped socket connections, high CPU throttling, and irreversible operational decisions.
- **Critical Red (`#ef4444`):** Signals patient service degradation, database deadlocks, and total infrastructure collapse.
- **Text High-Contrast (`#f8fafc`):** 98% white for headings, critical logs, and active status readouts.
- **Text Muted (`#94a3b8`):** Subordinate technical metadata, timestamps, and inactive options.

## Typography

The typographic hierarchy creates clear separation between system narrative, tactical decisions, and raw machine telemetry:

- **Headlines (Space Grotesk):** Provides a sharp, authoritative, technical profile for incident titles, service outage phases, and critical decision crossroads.
- **Narrative & Decisions (Geist):** Renders interactive dialogue, clinical incident context, and branching narrative paths with neutral clarity and effortless reading cadence.
- **System Logs & Telemetry (JetBrains Mono):** Dedicated to stack traces, latency monitors, SLA timers, memory usage metrics, and decision impact diffs (`+ / -`).

## Layout & Spacing

The layout is built upon an 8pt modular spatial system structured inside a rigid, high-density HUD view.

### Grid & Breakpoints
- **Mobile (< 768px):** Single-column command stream with fixed top-level telemetry metrics (Patient Risk Level, SLA Countdown) and stacked decision cards. Gutter is `1rem` and outer margin is `1rem`.
- **Tablet (768px – 1024px):** Dual-column layout. Column 1 hosts incoming logs and patient alerts; Column 2 features active decision forks. Outer margins expand to `1.5rem`.
- **Desktop (> 1024px):** 12-column telemetry dashboard locked at a maximum width of `1440px`. 4 columns reserved for continuous server telemetry & service topology, 8 columns dedicated to the interactive incident narrative, decision engine, and diagnostic command line. Desktop gutters scale to `1.5rem`, outer margins to `2.5rem`.
- **Vertical Spacing:** Tightly grouped metadata sections use `space-xs` (4px) and `space-sm` (8px). Structural cards and operational modules separate by `space-lg` (24px) or `space-xl` (32px).

## Elevation & Depth

To reflect an authentic high-reliability ops dashboard, visual hierarchy relies on tonal layering and luminous borders rather than deep blurry dropshadows.

- **Level 0 (App Canvas):** Pure background tone (`#090d16`). Flat, zero shadow.
- **Level 1 (Telemetry Panels & Logs):** Layered tone (`#0f172a`) paired with a razor-thin structural border (`1px solid #1e293b`).
- **Level 2 (Active Cards & Diagnostic Blocks):** Elevated tone (`#1e293b`) with an inner 1px border (`#334155`). Shadow is ambient and subdued: `0 4px 12px rgba(0, 0, 0, 0.4)`.
- **Level 3 (Urgent Modals & Critical Incident Focus):** `#1e293b` backed by a slight teal/amber optical glow depending on operational state: `0 0 0 1px #0b6e69, 0 12px 32px -4px rgba(11, 110, 105, 0.25)`.
- **Emergency Pulsing State:** Threat countdown elements emit a restrained, non-distracting ambient amber aura: `0 0 16px rgba(245, 158, 11, 0.2)`.

## Shapes

The interface balances ergonomic touch interactions with an architectural, engineering posture.

- **Primary Cards & Telemetry Containers:** Rigidly spec'd at `14px` border radius (`rounded-card`) to fulfill the system requirement, softening the technical density without appearing playful.
- **Pills, Tags & Badges:** `4px` corner radius for an industrial micro-chip label appearance.
- **Action Buttons & Input Triggers:** `8px` corner radius to retain clean distinction against surrounding `14px` container shells.
- **Interactive Bounds:** All interactive elements maintain an absolute minimum touch/hit area of `48px x 48px` to guarantee zero miss-clicks during rapid-fire game decisions.

## Components

### Decision Cards
- **Geometry:** 14px border-radius, background surface `#1e293b`, 1px border `#334155`.
- **Hit Target:** Minimum vertical card footprint of 72px (always exceeding the 48px minimum hit target).
- **Interactive State:** Hover transitions border to bright teal (`#14b8a6`) and adds a 2px left accent stripe. Active press reduces scale to 99%.
- **Content Structure:** Top row displays consequence probability and projected downtime delta via JetBrains Mono; bottom contains the engineering choice prose in Geist.

### Buttons (Tactical Commands)
- **Dimensions:** Min-height `48px`, padding `0 24px`, font size `14px`, JetBrains Mono uppercase, letter spacing `0.06em`.
- **Primary Variant (System Execution):** Solid `#0b6e69` fill, high-contrast white text (`#f8fafc`). Hover scales to `#0d827c`.
- **Destructive/Risk Variant (Hard Failover, Purge Cache):** Background transparent with 1px border in amber (`#f59e0b`). Text `#f59e0b`. Hover fills amber with black text (`#090d16`).

### Telemetry Chips & Health Badges
- **Geometry:** Height `28px`, min-width `48px`, radius `4px`, padding `0 8px`.
- **Status Healthy (Queue Flowing):** Background `rgba(16, 185, 129, 0.1)`, text `#10b981`, border `1px solid rgba(16, 185, 129, 0.3)`.
- **Status Degraded (Memory Leak / SLA Alert):** Background `rgba(245, 158, 11, 0.1)`, text `#f59e0b`, border `1px solid rgba(245, 158, 11, 0.3)`.

### Input & Terminal Command Line
- **Dimensions:** Min-height `48px`, background `#090d16`, border `1px solid #334155`, radius `8px`.
- **Text:** JetBrains Mono 14px with blinking teal caret (`#14b8a6`). Placeholder text `#64748b`.

### Live Countdown SLA Monitor
- **Structure:** Persistent top status bar displaying remaining window before complete clinical failure. Monospaced font in amber (`#f59e0b`) paired with a segmented progress track that drains right-to-left.